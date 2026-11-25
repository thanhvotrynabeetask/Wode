import {
  ProjectSchema,
  Role,
  NodeTemplate,
  FlowType,
  CornerSymbol,
  NodeKind,
  NodeListingItem,
  NodeBorderAnchor,
  DiagramSection,
  NodeInstance,
  EdgeConfig,
} from '../types/schema';
import { CANVAS_DEFAULTS } from '../utils/constants';
import { NODE_KIND_META } from '../utils/nodeKind';
import {
  Point,
  pointsToPath,
  routeEdges,
  RouteRequest,
  anchorToPoint,
  pointToBorderAnchor,
  pointToBorderSide,
  getNodeSidePort,
  getNodePortForEdge,
  buildOrthogonalConnector,
  buildManualPoints,
  extractWaypoints,
} from './EdgeRouter';

export type { Point } from './EdgeRouter';
export {
  anchorToPoint,
  pointToBorderAnchor,
  pointToBorderSide,
  getNodeSidePort,
  getNodePortForEdge,
  buildOrthogonalConnector,
  buildManualPoints,
  extractWaypoints,
};

export interface LayoutDiagramHeader {
  id: string;
  title: string;
  order: number;
  x: number;
  y: number;
  width: number;
  height: number;
  frameCount: number;
  nodeCount: number;
  isActive: boolean;
}

export interface LayoutNode {
  instanceId: string;
  baseId: string;
  frameId: string;
  frameTitle: string;
  diagramId?: string;
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
  diagramId?: string;
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
  sourceAnchor?: NodeBorderAnchor;
  targetAnchor?: NodeBorderAnchor;
}

export interface LayoutSwimlane {
  id?: string;
  diagramId?: string;
  roleId: string;
  roleName: string;
  color: string;
  y: number;
  height: number;
  width: number;
  isEmptyPlaceholder?: boolean;
}

export interface LayoutFrameOverlay {
  diagramId?: string;
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
  diagramHeaders: LayoutDiagramHeader[];
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
  sourceAnchor?: NodeBorderAnchor;
  targetAnchor?: NodeBorderAnchor;
}

function getDiagramList(schema: ProjectSchema): DiagramSection[] {
  if (schema.diagrams && schema.diagrams.length > 0) {
    const activeId = schema.active_diagram_id || schema.diagrams[0].id;
    return schema.diagrams.map((diag) => {
      if (diag.id === activeId) {
        return {
          ...diag,
          roles: schema.roles || [],
          node_palette: schema.node_palette || [],
          frames: schema.frames || [],
          nodes: schema.nodes || diag.nodes || [],
          edges_config: schema.edges_config || diag.edges_config || [],
          edge_routes: schema.edge_routes || diag.edge_routes || {},
        };
      }
      return {
        ...diag,
        roles: diag.roles || [],
        node_palette: diag.node_palette || [],
        frames: diag.frames || [],
        nodes: diag.nodes || [],
        edges_config: diag.edges_config || [],
        edge_routes: diag.edge_routes || {},
      };
    });
  }
  return [
    {
      id: schema.active_diagram_id || 'diag_1',
      title: schema.metadata?.project_name || 'Diagram 1',
      order: 1,
      roles: schema.roles || [],
      node_palette: schema.node_palette || [],
      frames: schema.frames || [],
      nodes: schema.nodes || [],
      edges_config: schema.edges_config || [],
      edge_routes: schema.edge_routes,
    },
  ];
}

export class LayoutEngine {
  public static calculate(schema: ProjectSchema, expandedListings: Set<string> = new Set()): LayoutResult {
    const defaultNodeWidth = CANVAS_DEFAULTS.NODE_WIDTH;
    const laneHeaderWidth = 180;
    const frameGap = 36;
    const nodeGapX = schema.settings.horizontal_spacing !== undefined ? schema.settings.horizontal_spacing : 40;
    const startX = laneHeaderWidth + 24;

    // Dynamic node height helper
    const computeNodeHeight = (nodeInst: typeof schema.frames[0]['nodes'][0]): number => {
      const customLabel = nodeInst.custom_label || '';
      const title = nodeInst.title || '';
      let height = CANVAS_DEFAULTS.NODE_HEIGHT; // base height (64px)

      // If title wraps into 2 lines (more than ~20 characters or has newline)
      if (title.length > 20 || title.includes('\n')) {
        height += 14;
      }

      if (customLabel) {
        const lines = customLabel.split('\n');
        let visualLineCount = 0;
        for (const line of lines) {
          // Each line takes at least 1 visual row; if line exceeds ~22 chars, estimate wrapping rows
          visualLineCount += Math.max(1, Math.ceil(line.length / 22));
        }
        if (visualLineCount > 1) {
          height += (visualLineCount - 1) * 16;
        }
      }
      if (
        nodeInst.listings &&
        nodeInst.listings.length > 0 &&
        expandedListings.has(nodeInst.instance_id)
      ) {
        height += nodeInst.listings.length * 14 + 10;
      }
      if (nodeInst.custom_height !== undefined && nodeInst.custom_height > 0) {
        return Math.max(height, nodeInst.custom_height);
      }
      return height;
    };

    // Node width helper
    const computeNodeWidth = (nodeInst: typeof schema.frames[0]['nodes'][0]): number => {
      if (nodeInst.custom_width !== undefined && nodeInst.custom_width > 0) {
        return nodeInst.custom_width;
      }
      return defaultNodeWidth;
    };

    const diagrams = getDiagramList(schema).sort((a, b) => a.order - b.order);
    const activeDiagramId = schema.active_diagram_id || diagrams[0].id;

    const layoutNodes: LayoutNode[] = [];
    const layoutEdges: LayoutEdge[] = [];
    const swimlanes: LayoutSwimlane[] = [];
    const frameOverlays: LayoutFrameOverlay[] = [];
    const diagramHeaders: LayoutDiagramHeader[] = [];

    let currentDiagramTopY = 24;
    let maxContentWidthAcrossAll = 1100;

    diagrams.forEach((diag) => {
      const diagRoles = diag.roles || [];
      const diagTemplates = diag.node_palette || [];
      const templateMap = new Map<string, NodeTemplate>(
        diagTemplates.map((t) => [t.base_id, t])
      );
      const roleMap = new Map<string, Role>(diagRoles.map((r) => [r.id, r]));
      const fallbackRoleId = diagRoles[0]?.id ?? 'default_role';

      const resolveKind = (n: typeof schema.frames[0]['nodes'][0], tpl?: NodeTemplate): NodeKind =>
        tpl ? tpl.node_kind || 'standard' : n.node_kind || 'standard';

      const resolveRoleId = (n: typeof schema.frames[0]['nodes'][0], tpl?: NodeTemplate): string => {
        const kind = resolveKind(n, tpl);
        const candidate =
          kind === 'standard'
            ? tpl?.role_id || n.assigned_role_id
            : n.assigned_role_id || tpl?.role_id;
        return candidate && roleMap.has(candidate) ? candidate : fallbackRoleId;
      };

      const totalNodesInDiag =
        (diag.nodes?.length || 0) + diag.frames.reduce((sum, f) => sum + f.nodes.length, 0);

      // 1. Diagram Header
      const headerY = currentDiagramTopY;
      const headerHeight = 36;
      diagramHeaders.push({
        id: diag.id,
        title: diag.title || `Sơ đồ ${diag.order}`,
        order: diag.order,
        x: 10,
        y: headerY,
        width: 0, // updated at the end
        height: headerHeight,
        frameCount: diag.frames.length,
        nodeCount: totalNodesInDiag,
        isActive: diag.id === activeDiagramId,
      });

      let currentLaneY = headerY + headerHeight + 16;
      const diagramSwimlanesStartY = currentLaneY;

      // 2. Dynamic Swimlane Heights for this Diagram
      const roleYMap = new Map<string, { y: number; height: number }>();
      if (diagRoles.length === 0) {
        // Visual placeholder swimlane so the diagram has spacious, clickable canvas area
        const emptyLaneHeight = 120;
        swimlanes.push({
          id: `${diag.id}_empty_lane`,
          diagramId: diag.id,
          roleId: '__empty__',
          roleName: 'Chưa có làn bơi (Swimlane)',
          color: '#94A3B8',
          y: currentLaneY,
          height: emptyLaneHeight,
          width: 0,
          isEmptyPlaceholder: true,
        });
        currentLaneY += emptyLaneHeight;
      } else {
        const roleMaxHeightMap = new Map<string, number>();
        diagRoles.forEach((r) => roleMaxHeightMap.set(r.id, CANVAS_DEFAULTS.NODE_HEIGHT));

        if (diag.nodes && diag.nodes.length > 0) {
          diag.nodes.forEach((n) => {
            const tpl = templateMap.get(n.base_id);
            const roleId = resolveRoleId(n, tpl);
            const h = computeNodeHeight(n);
            const curMax = roleMaxHeightMap.get(roleId) || CANVAS_DEFAULTS.NODE_HEIGHT;
            if (h > curMax) roleMaxHeightMap.set(roleId, h);
          });
        }

        diag.frames.forEach((frame) => {
          frame.nodes.forEach((n) => {
            const tpl = templateMap.get(n.base_id);
            const roleId = resolveRoleId(n, tpl);
            const h = computeNodeHeight(n);
            const curMax = roleMaxHeightMap.get(roleId) || CANVAS_DEFAULTS.NODE_HEIGHT;
            if (h > curMax) roleMaxHeightMap.set(roleId, h);
          });
        });

        diagRoles.forEach((role, rIdx) => {
          const maxNodeH = roleMaxHeightMap.get(role.id) || CANVAS_DEFAULTS.NODE_HEIGHT;
          let laneHeight = Math.max(CANVAS_DEFAULTS.LANE_MIN_HEIGHT, maxNodeH + 48);
          if (role.custom_height !== undefined && role.custom_height > 0) {
            laneHeight = Math.max(laneHeight, role.custom_height);
          }
          roleYMap.set(role.id, { y: currentLaneY, height: laneHeight });
          swimlanes.push({
            id: `${diag.id}_${role.id}_${rIdx}`,
            diagramId: diag.id,
            roleId: role.id,
            roleName: role.name,
            color: role.color,
            y: currentLaneY,
            height: laneHeight,
            width: 0,
          });
          currentLaneY += laneHeight;
        });
      }

      // 3. Position Frames and Nodes along X-axis
      let currentFrameX = startX;
      const nodePositionMap = new Map<string, LayoutNode>();

      // 3a. Position Standalone Nodes (Nodes not in any frame)
      let maxStandaloneRightX = startX;
      if (diag.nodes && diag.nodes.length > 0) {
        diag.nodes.forEach((nodeInst, nIdx) => {
          const tpl = templateMap.get(nodeInst.base_id);
          const nodeKind = resolveKind(nodeInst, tpl);
          const isSpecial = nodeKind !== 'standard';

          const roleId = resolveRoleId(nodeInst, tpl);
          const role = roleMap.get(roleId);
          const laneInfo = roleYMap.get(roleId) || { y: diagramSwimlanesStartY, height: 130 };

          const nodeHeight = computeNodeHeight(nodeInst);
          const nodeWidth = computeNodeWidth(nodeInst);

          const defaultX = startX + nIdx * (nodeWidth + nodeGapX);
          const nodeX = nodeInst.custom_x !== undefined ? nodeInst.custom_x : defaultX;

          let nodeY = laneInfo.y + (laneInfo.height - nodeHeight) / 2;
          if (!isSpecial && nodeInst.custom_y !== undefined) {
            const minY = laneInfo.y + 4;
            const maxY = laneInfo.y + laneInfo.height - nodeHeight - 4;
            if (nodeInst.custom_y >= minY && nodeInst.custom_y <= maxY) {
              nodeY = nodeInst.custom_y;
            }
          }

          const layoutNode: LayoutNode = {
            instanceId: nodeInst.instance_id,
            baseId: nodeInst.base_id,
            frameId: '',
            frameTitle: '',
            diagramId: diag.id,
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

          if (nodeX + nodeWidth > maxStandaloneRightX) {
            maxStandaloneRightX = nodeX + nodeWidth;
          }
        });
      }

      // If standalone nodes exist without custom_x, frame sequence starts after them
      const hasUnpositionedStandalone = (diag.nodes || []).some((n) => n.custom_x === undefined);
      if (hasUnpositionedStandalone && diag.nodes && diag.nodes.length > 0) {
        currentFrameX = maxStandaloneRightX + frameGap;
      }

      let maxFrameRightX = currentFrameX;

      const roleIndexMap = new Map<string, number>();
      (diag.roles || []).forEach((r, idx) => {
        roleIndexMap.set(r.id, idx);
        roleIndexMap.set(r.name.toLowerCase(), idx);
      });

      const computeFrameAutoColumns = (
        frameNodes: NodeInstance[],
        frameEdges: EdgeConfig[]
      ): Map<string, number> => {
        const nodeMap = new Map<string, { roleId: string; laneIndex: number; column?: number }>();
        frameNodes.forEach((n) => {
          const tpl = templateMap.get(n.base_id);
          const roleId = resolveRoleId(n, tpl);
          nodeMap.set(n.instance_id, {
            roleId,
            laneIndex: roleIndexMap.get(roleId) ?? roleIndexMap.get(roleId.toLowerCase()) ?? 0,
            column: n.column,
          });
        });

        const inEdges = new Map<string, string[]>();
        frameNodes.forEach((n) => inEdges.set(n.instance_id, []));

        (frameEdges || []).forEach((e) => {
          if (inEdges.has(e.to_instance) && nodeMap.has(e.from_instance)) {
            if (e.flow_type !== 'dashed') {
              inEdges.get(e.to_instance)!.push(e.from_instance);
            }
          }
        });

        const columnMap = new Map<string, number>();
        const columns: Map<string, string>[] = [];

        function getCol(cIdx: number) {
          while (columns.length <= cIdx) columns.push(new Map());
          return columns[cIdx];
        }

        function isPathObstructed(colIdx: number, laneA: number, laneB: number): boolean {
          const minLane = Math.min(laneA, laneB);
          const maxLane = Math.max(laneA, laneB);
          const colRoles = getCol(colIdx);
          for (const instId of colRoles.values()) {
            const node = nodeMap.get(instId);
            if (node && node.laneIndex > minLane && node.laneIndex < maxLane) {
              return true;
            }
          }
          return false;
        }

        frameNodes.forEach((n) => {
          if (n.column !== undefined) {
            columnMap.set(n.instance_id, n.column);
            const colMap = getCol(n.column);
            const roleId = nodeMap.get(n.instance_id)?.roleId || '';
            colMap.set(roleId, n.instance_id);
            return;
          }

          const nInfo = nodeMap.get(n.instance_id)!;
          const roleId = nInfo.roleId;
          const myLane = nInfo.laneIndex;
          const preds = inEdges.get(n.instance_id) || [];

          let minCol = 0;
          let preferredCol = -1;

          preds.forEach((pId) => {
            if (columnMap.has(pId)) {
              const pCol = columnMap.get(pId)!;
              const pNode = nodeMap.get(pId)!;
              if (pNode.roleId === roleId) {
                minCol = Math.max(minCol, pCol + 1);
              } else {
                minCol = Math.max(minCol, pCol);
                if (!isPathObstructed(pCol, pNode.laneIndex, myLane)) {
                  preferredCol = pCol;
                } else {
                  minCol = Math.max(minCol, pCol + 1);
                }
              }
            }
          });

          let placedCol = -1;
          if (preferredCol >= minCol && !getCol(preferredCol).has(roleId)) {
            placedCol = preferredCol;
          } else {
            let c = minCol;
            while (getCol(c).has(roleId)) c++;
            placedCol = c;
          }

          columnMap.set(n.instance_id, placedCol);
          getCol(placedCol).set(roleId, n.instance_id);
        });

        return columnMap;
      };

      diag.frames.forEach((frame) => {
        const frameStartX = frame.custom_x !== undefined ? frame.custom_x : currentFrameX;
        let frameContentWidth = 0;

        if (frame.nodes.length === 0) {
          frameContentWidth = defaultNodeWidth + 30;
          currentFrameX = Math.max(currentFrameX, frameStartX + frameContentWidth + frameGap);
        } else {
          let maxNodeRightX = frameStartX;
          const autoColMap = computeFrameAutoColumns(frame.nodes, frame.edges_config || []);

          frame.nodes.forEach((nodeInst, nIdx) => {
            const tpl = templateMap.get(nodeInst.base_id);
            const nodeKind = resolveKind(nodeInst, tpl);
            const isSpecial = nodeKind !== 'standard';

            const roleId = resolveRoleId(nodeInst, tpl);
            const role = roleMap.get(roleId);
            const laneInfo = roleYMap.get(roleId) || { y: diagramSwimlanesStartY, height: 130 };

            const nodeHeight = computeNodeHeight(nodeInst);
            const nodeWidth = computeNodeWidth(nodeInst);

            const col = nodeInst.column !== undefined ? nodeInst.column : (autoColMap.get(nodeInst.instance_id) ?? nIdx);
            const defaultX = frameStartX + col * (nodeWidth + nodeGapX);
            const nodeX = nodeInst.custom_x !== undefined ? nodeInst.custom_x : defaultX;

            let nodeY = laneInfo.y + (laneInfo.height - nodeHeight) / 2;
            if (!isSpecial && nodeInst.custom_y !== undefined) {
              const minY = laneInfo.y + 4;
              const maxY = laneInfo.y + laneInfo.height - nodeHeight - 4;
              if (nodeInst.custom_y >= minY && nodeInst.custom_y <= maxY) {
                nodeY = nodeInst.custom_y;
              }
            }

            const layoutNode: LayoutNode = {
              instanceId: nodeInst.instance_id,
              baseId: nodeInst.base_id,
              frameId: frame.frame_id,
              frameTitle: frame.title,
              diagramId: diag.id,
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

          const maxCol = Math.max(0, ...Array.from(autoColMap.values()));
          const naturalWidth = Math.max(
            (maxCol + 1) * defaultNodeWidth + maxCol * nodeGapX,
            maxNodeRightX - frameStartX
          );
          frameContentWidth = frame.custom_width ? Math.max(100, frame.custom_width) : naturalWidth;
          currentFrameX = Math.max(currentFrameX, frameStartX + frameContentWidth + frameGap);
        }

        const calculatedFrameWidth = frame.custom_width ? Math.max(120, frame.custom_width) : frameContentWidth + 30;
        frameOverlays.push({
          diagramId: diag.id,
          frameId: frame.frame_id,
          title: frame.title,
          order: frame.order,
          x: frameStartX - 15,
          y: diagramSwimlanesStartY - 14,
          width: calculatedFrameWidth,
          height: currentLaneY - diagramSwimlanesStartY + 24,
        });

        if (frameStartX + calculatedFrameWidth > maxFrameRightX) {
          maxFrameRightX = frameStartX + calculatedFrameWidth;
        }
      });

      const diagramContentRightX = Math.max(maxStandaloneRightX, maxFrameRightX);
      if (diagramContentRightX > maxContentWidthAcrossAll) {
        maxContentWidthAcrossAll = diagramContentRightX;
      }

      // 4. Collect and Route Edges for this Diagram
      const rawEdges: RawEdgeSpec[] = [];

      // 4a. Standalone edges (diagram-level edges)
      if (diag.edges_config && diag.edges_config.length > 0) {
        diag.edges_config.forEach((edgeConf, eIdx) => {
          rawEdges.push({
            id: edgeConf.edge_id || `edge_standalone_${eIdx}`,
            fromInstanceId: edgeConf.from_instance,
            toInstanceId: edgeConf.to_instance,
            frameId: '',
            label: edgeConf.message_label,
            flowType: edgeConf.flow_type || 'solid',
            color: edgeConf.color,
            curvatureOffset: edgeConf.curvature_offset,
            isMacro: false,
            sourceAnchor: edgeConf.source_anchor,
            targetAnchor: edgeConf.target_anchor,
          });
        });
      } else if (diag.frames.length === 0 && diag.nodes && diag.nodes.length >= 2) {
        // Auto sequential edge connection when no frames and no custom edges defined
        for (let i = 0; i < diag.nodes.length - 1; i++) {
          rawEdges.push({
            id: `auto_standalone_${i}`,
            fromInstanceId: diag.nodes[i].instance_id,
            toInstanceId: diag.nodes[i + 1].instance_id,
            frameId: '',
            label: undefined,
            flowType: 'solid',
            isMacro: false,
          });
        }
      }

      diag.frames.forEach((frame) => {
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
              sourceAnchor: edgeConf.source_anchor,
              targetAnchor: edgeConf.target_anchor,
            });
          });
        } else {
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
      diag.frames.forEach((frame, idx) => {
        if (frame.nodes.length === 0) return;
        const lastNodeInCurrentFrame = frame.nodes[frame.nodes.length - 1];

        let targetFrame: typeof diag.frames[0] | undefined;
        if (frame.next_frame_target) {
          targetFrame = diag.frames.find((f) => f.frame_id === frame.next_frame_target);
        } else if (idx < diag.frames.length - 1) {
          targetFrame = diag.frames[idx + 1];
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

      const seenRouteKeys = new Set<string>();
      const uniqueEdges = rawEdges.filter((e) => {
        const key = `${e.fromInstanceId}>${e.toInstanceId}`;
        if (e.fromInstanceId === e.toInstanceId || seenRouteKeys.has(key)) return false;
        if (!nodePositionMap.has(e.fromInstanceId) || !nodePositionMap.has(e.toInstanceId)) return false;
        seenRouteKeys.add(key);
        return true;
      });

      const diagRoutes =
        diag.edge_routes ||
        (diag.id === activeDiagramId ? schema.edge_routes : undefined) ||
        {};
      const requests: RouteRequest[] = uniqueEdges.map((e) => {
        const key = `${e.fromInstanceId}>${e.toInstanceId}`;
        const routeOverride = diagRoutes[key];
        return {
          key,
          fromId: e.fromInstanceId,
          toId: e.toInstanceId,
          labelWidth: e.label ? e.label.length * 7 + 16 : 0,
          waypoints: routeOverride?.waypoints,
          sourceAnchor: routeOverride?.sourceAnchor || e.sourceAnchor,
          targetAnchor: routeOverride?.targetAnchor || e.targetAnchor,
        };
      });

      const diagNodes = Array.from(nodePositionMap.values());
      const routed = routeEdges(
        diagNodes.map((n) => ({
          id: n.instanceId,
          x: n.x,
          y: n.y,
          width: n.width,
          height: n.height,
        })),
        requests,
        { minX: laneHeaderWidth + 10, width: Math.max(1200, diagramContentRightX + 120), height: currentLaneY + 40 }
      );

      uniqueEdges.forEach((edgeSpec) => {
        const routeKey = `${edgeSpec.fromInstanceId}>${edgeSpec.toInstanceId}`;
        const route = routed.get(routeKey);
        if (!route) return;
        const routeOverride = diagRoutes[routeKey];
        layoutEdges.push({
          id: edgeSpec.id,
          fromInstanceId: edgeSpec.fromInstanceId,
          toInstanceId: edgeSpec.toInstanceId,
          frameId: edgeSpec.frameId,
          diagramId: diag.id,
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
          sourceAnchor: routeOverride?.sourceAnchor || edgeSpec.sourceAnchor,
          targetAnchor: routeOverride?.targetAnchor || edgeSpec.targetAnchor,
        });
      });

      // Vertical gap before next diagram below (generous spacing for side-by-side comparison)
      currentDiagramTopY = currentLaneY + 80;
    });

    const totalWidth = Math.max(1200, maxContentWidthAcrossAll + 120);

    // Update widths for all swimlanes and diagram headers
    swimlanes.forEach((lane) => {
      lane.width = totalWidth;
    });
    diagramHeaders.forEach((dh) => {
      dh.width = totalWidth - 20;
    });

    const totalHeight = currentDiagramTopY + 40;

    return {
      nodes: layoutNodes,
      edges: layoutEdges,
      swimlanes,
      frames: frameOverlays,
      diagramHeaders,
      canvasWidth: totalWidth,
      canvasHeight: totalHeight,
    };
  }
}
