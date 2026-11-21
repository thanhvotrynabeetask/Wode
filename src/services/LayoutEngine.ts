import { ProjectSchema, Role, NodeTemplate, FlowType, CornerSymbol, NodeKind, NodeListingItem } from '../types/schema';
import { CANVAS_DEFAULTS } from '../utils/constants';
import { NODE_KIND_META } from '../utils/nodeKind';
import { Point, pointsToPath, routeEdges, RouteRequest } from './EdgeRouter';

export type { Point } from './EdgeRouter';

export interface LayoutNode {
  instanceId: string;
  baseId: string;
  frameId: string;
  frameTitle: string;
  roleId: string;
  title: string;
  customLabel: string | null;
  cornerSymbol: CornerSymbol;
  nodeKind: NodeKind;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  laneY: number;
  laneHeight: number;
  /** Expandable list of items (skills, AI models, agents, connectors, tools) */
  listings?: NodeListingItem[];
}

export interface LayoutEdge {
  id: string;
  fromInstanceId: string;
  toInstanceId: string;
  frameId?: string;
  /** Key used to persist a manual route for this edge: `${from}>${to}`. */
  routeKey: string;
  pathD: string;
  /** Orthogonal polyline the path is drawn from (first/last point are the node ports). */
  points: Point[];
  isManualRoute: boolean;
  labelX: number;
  labelY: number;
  label?: string;
  flowType: FlowType;
  color?: string;
  isMacro: boolean;
}

export interface LayoutSwimlane {
  roleId: string;
  roleName: string;
  color: string;
  y: number;
  height: number;
  width: number;
}

export interface LayoutFrameOverlay {
  frameId: string;
  title: string;
  order: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutResult {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
  swimlanes: LayoutSwimlane[];
  frames: LayoutFrameOverlay[];
  canvasWidth: number;
  canvasHeight: number;
}

interface RawEdgeSpec {
  id: string;
  fromInstanceId: string;
  toInstanceId: string;
  frameId?: string;
  label?: string;
  flowType: FlowType;
  color?: string;
  curvatureOffset?: number;
  isMacro: boolean;
}

export class LayoutEngine {
  public static calculate(schema: ProjectSchema, expandedListings: Set<string> = new Set()): LayoutResult {
    const roles = schema.roles;
    const frames = schema.frames;
    const templateMap = new Map<string, NodeTemplate>(
      schema.node_palette.map((t) => [t.base_id, t])
    );
    const roleMap = new Map<string, Role>(roles.map((r) => [r.id, r]));

    const defaultNodeWidth = CANVAS_DEFAULTS.NODE_WIDTH;
    const laneHeaderWidth = 140;
    const frameGap = 36;
    const nodeGapX = schema.settings.horizontal_spacing !== undefined ? schema.settings.horizontal_spacing : 40;
    const startX = laneHeaderWidth + 24;
    const topMargin = 50;

    // Helper: Calculate dynamic height of a node instance based on its text content
    const computeNodeHeight = (nodeInst: typeof frames[0]['nodes'][0]): number => {
      // If user has set a custom height, respect it.
      if (nodeInst.custom_height !== undefined && nodeInst.custom_height > 0) {
        return nodeInst.custom_height;
      }
      const customLabel = nodeInst.custom_label || '';
      let height = CANVAS_DEFAULTS.NODE_HEIGHT; // base 60px
      if (customLabel.length > 18) {
        // Add vertical space for wrapped text so it is NEVER truncated
        const extraLines = Math.ceil((customLabel.length - 18) / 18);
        height += extraLines * 16;
      }
      // Extra height for listing items only when the list is expanded on canvas
      if (
        nodeInst.listings &&
        nodeInst.listings.length > 0 &&
        expandedListings.has(nodeInst.instance_id)
      ) {
        height += nodeInst.listings.length * 14 + 10;
      }
      return height;
    };

    // Helper: Get node width (custom if set, else default)
    const computeNodeWidth = (nodeInst: typeof frames[0]['nodes'][0]): number => {
      if (nodeInst.custom_width !== undefined && nodeInst.custom_width > 0) {
        return nodeInst.custom_width;
      }
      return defaultNodeWidth;
    };

    // 1. Calculate Dynamic Heights for each Swimlane
    // Find the max node height belonging to each role
    const roleMaxHeightMap = new Map<string, number>();
    roles.forEach((r) => roleMaxHeightMap.set(r.id, CANVAS_DEFAULTS.NODE_HEIGHT));

    const fallbackRoleId = roles[0]?.id ?? 'default_role';
    const resolveKind = (n: typeof frames[0]['nodes'][0], tpl?: NodeTemplate): NodeKind =>
      tpl ? tpl.node_kind || 'standard' : n.node_kind || 'standard';
    // Special nodes (storage / mediator) live in the lane they were dropped on;
    // standard nodes always follow their template's role.
    const resolveRoleId = (n: typeof frames[0]['nodes'][0], tpl?: NodeTemplate): string => {
      const kind = resolveKind(n, tpl);
      const candidate =
        kind === 'standard'
          ? tpl?.role_id || n.assigned_role_id
          : n.assigned_role_id || tpl?.role_id;
      return candidate && roleMap.has(candidate) ? candidate : fallbackRoleId;
    };

    frames.forEach((frame) => {
      frame.nodes.forEach((n) => {
        const tpl = templateMap.get(n.base_id);
        const roleId = resolveRoleId(n, tpl);
        const h = computeNodeHeight(n);
        const curMax = roleMaxHeightMap.get(roleId) || CANVAS_DEFAULTS.NODE_HEIGHT;
        if (h > curMax) roleMaxHeightMap.set(roleId, h);
      });
    });

    const swimlanes: LayoutSwimlane[] = [];
    const roleYMap = new Map<string, { y: number; height: number }>();
    let currentLaneY = topMargin;

    roles.forEach((role) => {
      const maxNodeH = roleMaxHeightMap.get(role.id) || CANVAS_DEFAULTS.NODE_HEIGHT;
      // Lane height accommodates the tallest node in this lane + margins
      // If role has a custom_height, use that (but still ensure it fits the tallest node).
      let laneHeight = Math.max(CANVAS_DEFAULTS.LANE_MIN_HEIGHT, maxNodeH + 48);
      if (role.custom_height !== undefined && role.custom_height > 0) {
        laneHeight = Math.max(laneHeight, role.custom_height);
      }

      roleYMap.set(role.id, { y: currentLaneY, height: laneHeight });
      swimlanes.push({
        roleId: role.id,
        roleName: role.name,
        color: role.color,
        y: currentLaneY,
        height: laneHeight,
        width: 0,
      });

      currentLaneY += laneHeight;
    });

    const totalHeight = currentLaneY + 60;

    // 2. Position Nodes along Frames (X-axis)
    let currentX = startX;
    const layoutNodes: LayoutNode[] = [];
    const nodePositionMap = new Map<string, LayoutNode>();
    const frameOverlays: LayoutFrameOverlay[] = [];

    frames.forEach((frame) => {
      const frameStartX = currentX;
      let frameContentWidth = 0;

      if (frame.nodes.length === 0) {
        frameContentWidth = defaultNodeWidth + 30;
        currentX += frameContentWidth + frameGap;
      } else {
        let maxNodeRightX = frameStartX;

        frame.nodes.forEach((nodeInst, nIdx) => {
          const tpl = templateMap.get(nodeInst.base_id);
          const nodeKind = resolveKind(nodeInst, tpl);
          const isSpecial = nodeKind !== 'standard';

          const roleId = resolveRoleId(nodeInst, tpl);
          const role = roleMap.get(roleId);
          const laneInfo = roleYMap.get(roleId) || { y: topMargin, height: 130 };

          const nodeHeight = computeNodeHeight(nodeInst);
          const nodeWidth = computeNodeWidth(nodeInst);

          // Default X position
          const defaultX = currentX + nIdx * (nodeWidth + nodeGapX);
          const nodeX = nodeInst.custom_x !== undefined ? nodeInst.custom_x : defaultX;

          // Nodes always sit centered in their lane, so a special node dropped on a lane
          // magnets neatly instead of straddling the lane border.
          let nodeY = laneInfo.y + (laneInfo.height - nodeHeight) / 2;
          if (!isSpecial && nodeInst.custom_y !== undefined) {
            nodeY = nodeInst.custom_y;
          }

          const layoutNode: LayoutNode = {
            instanceId: nodeInst.instance_id,
            baseId: nodeInst.base_id,
            frameId: frame.frame_id,
            frameTitle: frame.title,
            roleId,
            title: tpl?.title || nodeInst.title,
            customLabel: nodeInst.custom_label,
            cornerSymbol: tpl?.corner_symbol || 'none',
            nodeKind,
            color: isSpecial ? NODE_KIND_META[nodeKind as 'storage' | 'mediator'].color : role?.color || '#3B82F6',
            x: nodeX,
            y: nodeY,
            width: nodeWidth,
            height: nodeHeight,
            laneY: laneInfo.y,
            laneHeight: laneInfo.height,
            listings: nodeInst.listings,
          };

          layoutNodes.push(layoutNode);
          nodePositionMap.set(nodeInst.instance_id, layoutNode);

          if (nodeX + nodeWidth > maxNodeRightX) {
            maxNodeRightX = nodeX + nodeWidth;
          }
        });

        frameContentWidth = Math.max(
          frame.nodes.length * defaultNodeWidth + Math.max(0, frame.nodes.length - 1) * nodeGapX,
          maxNodeRightX - frameStartX
        );
        currentX += frameContentWidth + frameGap;
      }

      frameOverlays.push({
        frameId: frame.frame_id,
        title: frame.title,
        order: frame.order,
        x: frameStartX - 15,
        y: topMargin - 30,
        width: frameContentWidth + 30,
        height: (currentLaneY - topMargin) + 40,
      });
    });

    const totalWidth = Math.max(1100, currentX + 120);

    // Update swimlane widths
    swimlanes.forEach((lane) => {
      lane.width = totalWidth;
    });

    // 3. Collect Raw Edges
    const rawEdges: RawEdgeSpec[] = [];

    frames.forEach((frame) => {
      if (frame.nodes.length < 2) return;

      if (frame.edges_config && frame.edges_config.length > 0) {
        frame.edges_config.forEach((edgeConf, eIdx) => {
          rawEdges.push({
            id: edgeConf.edge_id || `edge_${frame.frame_id}_${eIdx}`,
            fromInstanceId: edgeConf.from_instance,
            toInstanceId: edgeConf.to_instance,
            frameId: frame.frame_id,
            label: edgeConf.message_label,
            flowType: edgeConf.flow_type || 'solid',
            color: edgeConf.color,
            curvatureOffset: edgeConf.curvature_offset,
            isMacro: false,
          });
        });
      } else {
        // Auto-infer: sequential node[i] -> node[i+1]
        for (let i = 0; i < frame.nodes.length - 1; i++) {
          rawEdges.push({
            id: `auto_${frame.frame_id}_${i}`,
            fromInstanceId: frame.nodes[i].instance_id,
            toInstanceId: frame.nodes[i + 1].instance_id,
            frameId: frame.frame_id,
            label: undefined,
            flowType: 'solid',
            isMacro: false,
          });
        }
      }
    });

    // Inter-Frame Macro-flow
    frames.forEach((frame, idx) => {
      if (frame.nodes.length === 0) return;
      const lastNodeInCurrentFrame = frame.nodes[frame.nodes.length - 1];

      let targetFrame: typeof frames[0] | undefined;
      if (frame.next_frame_target) {
        targetFrame = frames.find((f) => f.frame_id === frame.next_frame_target);
      } else if (idx < frames.length - 1) {
        targetFrame = frames[idx + 1];
      }

      if (targetFrame && targetFrame.nodes.length > 0) {
        const firstNodeInTargetFrame = targetFrame.nodes[0];
        rawEdges.push({
          id: `macro_${frame.frame_id}_to_${targetFrame.frame_id}`,
          fromInstanceId: lastNodeInCurrentFrame.instance_id,
          toInstanceId: firstNodeInTargetFrame.instance_id,
          label: undefined,
          flowType: 'solid',
          isMacro: true,
        });
      }
    });

    // 4. ORTHOGONAL ROUTING (obstacle-aware, spread ports, separate tracks, manual overrides)
    const seenRouteKeys = new Set<string>();
    const uniqueEdges = rawEdges.filter((e) => {
      const key = `${e.fromInstanceId}>${e.toInstanceId}`;
      if (e.fromInstanceId === e.toInstanceId || seenRouteKeys.has(key)) return false;
      if (!nodePositionMap.has(e.fromInstanceId) || !nodePositionMap.has(e.toInstanceId)) return false;
      seenRouteKeys.add(key);
      return true;
    });

    const requests: RouteRequest[] = uniqueEdges.map((e) => {
      const key = `${e.fromInstanceId}>${e.toInstanceId}`;
      return {
        key,
        fromId: e.fromInstanceId,
        toId: e.toInstanceId,
        labelWidth: e.label ? e.label.length * 7 + 16 : 0,
        waypoints: schema.edge_routes?.[key]?.waypoints,
      };
    });

    const routed = routeEdges(
      layoutNodes.map((n) => ({
        id: n.instanceId,
        x: n.x,
        y: n.y,
        width: n.width,
        height: n.height,
      })),
      requests,
      { minX: laneHeaderWidth + 10, width: totalWidth, height: totalHeight }
    );

    const layoutEdges: LayoutEdge[] = [];
    uniqueEdges.forEach((edgeSpec) => {
      const routeKey = `${edgeSpec.fromInstanceId}>${edgeSpec.toInstanceId}`;
      const route = routed.get(routeKey);
      if (!route) return;
      layoutEdges.push({
        id: edgeSpec.id,
        fromInstanceId: edgeSpec.fromInstanceId,
        toInstanceId: edgeSpec.toInstanceId,
        frameId: edgeSpec.frameId,
        routeKey,
        pathD: pointsToPath(route.points),
        points: route.points,
        isManualRoute: route.isManual,
        labelX: route.labelX,
        labelY: route.labelY,
        label: edgeSpec.label,
        flowType: edgeSpec.flowType,
        color: edgeSpec.color,
        isMacro: edgeSpec.isMacro,
      });
    });

    return {
      nodes: layoutNodes,
      edges: layoutEdges,
      swimlanes,
      frames: frameOverlays,
      canvasWidth: totalWidth,
      canvasHeight: totalHeight,
    };
  }
}