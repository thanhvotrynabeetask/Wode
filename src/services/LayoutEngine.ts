import { ProjectSchema, Role, NodeTemplate, FlowType, CornerSymbol, NodeKind } from '../types/schema';
import { CANVAS_DEFAULTS } from '../utils/constants';
import { NODE_KIND_META } from '../utils/nodeKind';

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
}

export interface LayoutEdge {
  id: string;
  fromInstanceId: string;
  toInstanceId: string;
  frameId?: string;
  pathD: string;
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
  public static calculate(schema: ProjectSchema): LayoutResult {
    const roles = schema.roles;
    const frames = schema.frames;
    const templateMap = new Map<string, NodeTemplate>(
      schema.node_palette.map((t) => [t.base_id, t])
    );
    const roleMap = new Map<string, Role>(roles.map((r) => [r.id, r]));

    const nodeWidth = CANVAS_DEFAULTS.NODE_WIDTH;
    const laneHeaderWidth = 140;
    const frameGap = 36;
    const nodeGapX = schema.settings.horizontal_spacing !== undefined ? schema.settings.horizontal_spacing : 40;
    const startX = laneHeaderWidth + 24;
    const topMargin = 50;

    // Helper: Calculate dynamic height of a node instance based on its text content
    const computeNodeHeight = (nodeInst: typeof frames[0]['nodes'][0]): number => {
      const customLabel = nodeInst.custom_label || '';
      let height = CANVAS_DEFAULTS.NODE_HEIGHT; // base 60px
      if (customLabel.length > 18) {
        // Add vertical space for wrapped text so it is NEVER truncated
        const extraLines = Math.ceil((customLabel.length - 18) / 18);
        height += extraLines * 16;
      }
      return height;
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
      const laneHeight = Math.max(CANVAS_DEFAULTS.LANE_MIN_HEIGHT, maxNodeH + 48);

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
        frameContentWidth = nodeWidth + 30;
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
          };

          layoutNodes.push(layoutNode);
          nodePositionMap.set(nodeInst.instance_id, layoutNode);

          if (nodeX + nodeWidth > maxNodeRightX) {
            maxNodeRightX = nodeX + nodeWidth;
          }
        });

        frameContentWidth = Math.max(
          frame.nodes.length * nodeWidth + Math.max(0, frame.nodes.length - 1) * nodeGapX,
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

    // 4. SMART BRANCHING ROUTING (Guaranteed Horizontal Approach & Anti-overlap)
    const outgoingMap = new Map<string, RawEdgeSpec[]>();
    const incomingMap = new Map<string, RawEdgeSpec[]>();

    rawEdges.forEach((e) => {
      if (!outgoingMap.has(e.fromInstanceId)) outgoingMap.set(e.fromInstanceId, []);
      outgoingMap.get(e.fromInstanceId)!.push(e);

      if (!incomingMap.has(e.toInstanceId)) incomingMap.set(e.toInstanceId, []);
      incomingMap.get(e.toInstanceId)!.push(e);
    });

    const layoutEdges: LayoutEdge[] = [];

    rawEdges.forEach((edgeSpec) => {
      const fromNode = nodePositionMap.get(edgeSpec.fromInstanceId);
      const toNode = nodePositionMap.get(edgeSpec.toInstanceId);
      if (!fromNode || !toNode) return;

      const outGroup = outgoingMap.get(edgeSpec.fromInstanceId) || [edgeSpec];
      const inGroup = incomingMap.get(edgeSpec.toInstanceId) || [edgeSpec];

      const outIndex = outGroup.indexOf(edgeSpec);
      const outTotal = outGroup.length;

      const inIndex = inGroup.indexOf(edgeSpec);
      const inTotal = inGroup.length;

      const calculatedEdge = this.routeSmartEdge(
        fromNode,
        toNode,
        edgeSpec,
        outIndex,
        outTotal,
        inIndex,
        inTotal
      );
      layoutEdges.push(calculatedEdge);
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

  /**
   * Routes an edge with guaranteed horizontal approach to node ports.
   * By keeping cp2y == y2 strictly, the arrival tangent is strictly (1, 0),
   * which prevents arrowheads from tilting or breaking regardless of height differences.
   */
  private static routeSmartEdge(
    from: LayoutNode,
    to: LayoutNode,
    edgeSpec: RawEdgeSpec,
    outIndex: number,
    outTotal: number,
    inIndex: number,
    inTotal: number
  ): LayoutEdge {
    // 1. Stagger Start Port along the right edge of fromNode
    const x1 = from.x + from.width;
    const y1 = from.y + (from.height * (outIndex + 1)) / (outTotal + 1);

    // 2. Stagger End Port along the left edge of toNode
    const x2 = to.x;
    const y2 = to.y + (to.height * (inIndex + 1)) / (inTotal + 1);

    const dx = x2 - x1;

    // Arching for branching separation
    let branchArc = 0;
    if (outTotal > 1) {
      branchArc += (outIndex - (outTotal - 1) / 2) * 20;
    }
    if (inTotal > 1) {
      branchArc += (inIndex - (inTotal - 1) / 2) * 14;
    }
    if (edgeSpec.curvatureOffset !== undefined) {
      branchArc += edgeSpec.curvatureOffset;
    }

    let pathD = '';
    let labelX = (x1 + x2) / 2;
    let labelY = (y1 + y2) / 2 - 12 + branchArc;

    if (dx >= 20) {
      // Forward connection
      // Tension: how far the control points extend horizontally
      const tension = Math.max(35, Math.min(180, dx * 0.45));

      // CRITICAL FIX FOR IMAGE 2:
      // cp1y departs horizontally from y1
      // cp2y ARRIVES EXACTLY AT y2 (cp2y = y2)
      // This guarantees the tangent at (x2, y2) is strictly horizontal (dx/dt > 0, dy/dt = 0),
      // so the arrowhead is ALWAYS level and points straight into the node port!
      const cp1x = x1 + tension;
      const cp1y = y1 + branchArc * 0.4;
      const cp2x = x2 - tension;
      const cp2y = y2; // Strictly y2!

      pathD = `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
    } else {
      // Loop backward connection: route around cleanly
      const loopExtension = Math.max(45, Math.abs(dx) + 40);
      const cp1x = x1 + loopExtension;
      const cp1y = y1 - 25 + branchArc;
      const cp2x = x2 - loopExtension;
      const cp2y = y2; // Strictly y2 for perfect horizontal arrival!

      pathD = `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
      labelY = Math.min(y1, y2) - 20 + branchArc;
    }

    return {
      id: edgeSpec.id,
      fromInstanceId: from.instanceId,
      toInstanceId: to.instanceId,
      frameId: edgeSpec.frameId,
      pathD,
      labelX,
      labelY,
      label: edgeSpec.label,
      flowType: edgeSpec.flowType,
      color: edgeSpec.color,
      isMacro: edgeSpec.isMacro,
    };
  }
}
