import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useUIStore } from '../../store/useUIStore';
import { LayoutEngine, LayoutNode, LayoutEdge } from '../../services/LayoutEngine';
import { SwimlaneRenderer } from './SwimlaneRenderer';
import { FrameOverlayRenderer } from './FrameOverlayRenderer';
import { EdgeRenderer } from './EdgeRenderer';
import { NodeRenderer } from './NodeRenderer';
import { EdgeEditorModal } from './EdgeEditorModal';
import { EdgeRouteHandles, STRAIGHT_EDGE_HANDLE, EdgeHandleType } from './EdgeRouteHandles';
import {
  Point,
  buildManualPoints,
  extractWaypoints,
  pointsToPath,
  pointToBorderSide,
  getNodePortForEdge,
  getNodeSidePort,
  inferDefaultBorderSides,
  buildOrthogonalConnector,
  simplifyPolyline,
  straightenAlignedPolyline,
  STRAIGHT_ALIGN_TOLERANCE,
} from '../../services/EdgeRouter';
import { BorderSide, NodeBorderAnchor } from '../../types/schema';
import { CanvasSubToolbar } from './CanvasSubToolbar';
import { useGlobalKeybindings } from '../../hooks/useGlobalKeybindings';
import { CANVAS_DEFAULTS } from '../../utils/constants';
import { Check } from 'lucide-react';
import { useTranslation } from '../../i18n';

interface MultiDragItem {
  node: LayoutNode;
  nodeStartX: number;
  nodeStartY: number;
}

interface MultiDragState {
  items: MultiDragItem[];
  startClientX: number;
  startClientY: number;
  currentOffsets: Map<string, { x: number; y: number; assignedRoleId?: string }>;
  primaryNode: LayoutNode;
}

interface LabelDragState {
  edge: LayoutEdge;
  startClientX: number;
  startClientY: number;
  startLabelX: number;
  startLabelY: number;
  currentLabelX: number;
  currentLabelY: number;
  hasMoved: boolean;
}

export const DiagramCanvas: React.FC = () => {
  const schema = useProjectStore((s) => s.schema);
  const { theme, enableDarkGlow } = useSettingsStore();
  const { t } = useTranslation();
  const {
    updateNodePosition,
    updateMultipleNodesPositions,
    moveNodeToFrame,
    updateNodeInstance,
    updateRole,
    moveRole,
    updateEdge,
    updateStandaloneEdge,
    updateEdgeConfig,
    removeEdge,
    setEdgeRoute,
    clearAllEdgeRoutes,
    setActiveDiagram,
    updateFrameWidth,
  } = useProjectStore();

  const {
    interactionMode,
    setInteractionMode,
    zoom,
    panX,
    panY,
    selection,
    expandedListings,
    setZoom,
    setPan,
    toggleSelectInstance,
    setSelectedInstance,
    setSelectedInstances,
    setSelectedFrame,
    setHighlightedPath,
    clearSelection,
    addToast,
    toggleListing,
  } = useUIStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const lastAnchorIdRef = useRef<string | null>(null);

  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number; startPanX: number; startPanY: number }>({
    x: 0,
    y: 0,
    startPanX: 0,
    startPanY: 0,
  });

  const [multiDragState, setMultiDragState] = useState<MultiDragState | null>(null);
  const rafRef = useRef<number | null>(null);

  // Marquee Area Selection State (Rectangle selection zone in Select Mode)
  const [marqueeState, setMarqueeState] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    initialSelectedIds: string[];
    isAppend: boolean;
  } | null>(null);

  const [editingEdge, setEditingEdge] = useState<LayoutEdge | null>(null);
  const [labelDragState, setLabelDragState] = useState<LabelDragState | null>(null);
  const justDraggedLabelRef = useRef(false);

  const [routeEditKey, setRouteEditKey] = useState<string | null>(null);
  const [routeDrag, setRouteDrag] = useState<{
    edge: LayoutEdge;
    dragType: EdgeHandleType;
    segmentIndex: number;
    basePoints: Point[];
    startClientX: number;
    startClientY: number;
    rawPoints: Point[];
    previewPoints: Point[];
    fromNode: LayoutNode;
    toNode: LayoutNode;
    sourceAnchor?: NodeBorderAnchor;
    targetAnchor?: NodeBorderAnchor;
    moved: boolean;
  } | null>(null);

  // Horizontal Frame resizing state
  const [frameResizeState, setFrameResizeState] = useState<{
    frameId: string;
    startX: number;
    initialWidth: number;
  } | null>(null);

  const handleFrameResizeStart = (e: React.MouseEvent, frameId: string, currentWidth: number) => {
    e.stopPropagation();
    setFrameResizeState({
      frameId,
      startX: e.clientX,
      initialWidth: currentWidth,
    });
  };

  // Horizontal Frame resize drag listener
  useEffect(() => {
    if (!frameResizeState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = (e.clientX - frameResizeState.startX) / zoom;
      const newWidth = Math.max(120, Math.round(frameResizeState.initialWidth + deltaX));
      updateFrameWidth(frameResizeState.frameId, newWidth);
    };

    const handleMouseUp = () => {
      setFrameResizeState(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [frameResizeState, zoom, updateFrameWidth]);

  // Auto-alignment snap guideline state during node drag
  const [snapGuide, setSnapGuide] = useState<{
    type: 'vertical' | 'horizontal';
    pos: number;
    start: number;
    end: number;
    alignedNodeTitle?: string;
  } | null>(null);

  const layout = useMemo(() => {
    return LayoutEngine.calculate(schema, expandedListings);
  }, [schema, expandedListings]);

  const allInstanceIds = useMemo(() => {
    return layout.nodes.map((n) => n.instanceId);
  }, [layout.nodes]);

  // Dark mode resolution
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  // Viewport bounds clamping to prevent free-roaming out of bounds
  const clampPan = useCallback(
    (x: number, y: number, currentZoom: number) => {
      const vpW = containerRef.current?.clientWidth || 1000;
      const vpH = containerRef.current?.clientHeight || 800;
      const diagramW = layout.canvasWidth * currentZoom;
      const diagramH = layout.canvasHeight * currentZoom;

      const padX = Math.max(80, Math.min(220, vpW * 0.25));
      const padY = Math.max(60, Math.min(180, vpH * 0.25));

      const minX = Math.min(-padX, vpW - diagramW - padX);
      const maxX = Math.max(padX, vpW - diagramW + padX);
      const minY = Math.min(-padY, vpH - diagramH - padY);
      const maxY = Math.max(padY, vpH - diagramH + padY);

      return {
        x: Math.max(minX, Math.min(maxX, x)),
        y: Math.max(minY, Math.min(maxY, y)),
      };
    },
    [layout.canvasWidth, layout.canvasHeight]
  );

  // Handle Canvas background mouse drag:
  // - In Box Select mode (Quét chọn vùng - nút cạnh Select All):
  //   Dragging draws the marquee selection rectangle to pick multiple nodes.
  // - In Pan mode (Ctrl+A), normal Select mode (Ctrl+Q), or Middle click:
  //   Dragging on empty canvas pans the view smoothly, without accidentally opening a selection box!
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 && e.button !== 1) return;

    // In Box Select Mode: Left click on canvas starts Rectangle Area Selection
    if (interactionMode === 'boxSelect' && e.button === 0) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const canvasX = (e.clientX - rect.left - panX) / zoom;
      const canvasY = (e.clientY - rect.top - panY) / zoom;

      const isAppend = e.shiftKey || e.ctrlKey || e.metaKey;
      const initialSelected = isAppend ? [...selection.selectedInstanceIds] : [];

      if (!isAppend) {
        clearSelection();
        lastAnchorIdRef.current = null;
      }

      setMarqueeState({
        startX: canvasX,
        startY: canvasY,
        currentX: canvasX,
        currentY: canvasY,
        initialSelectedIds: initialSelected,
        isAppend,
      });
      return;
    }

    // Default for empty canvas (Pan mode, or Select mode dragging on empty space):
    // Dragging pans canvas view smoothly; clicking deselects (if not shiftKey)
    setIsPanning(true);
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startPanX: panX,
      startPanY: panY,
    };
    if (!e.shiftKey) {
      clearSelection();
      lastAnchorIdRef.current = null;
    }
  };

  // High performance Drag tracking with requestAnimationFrame
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (routeDrag) {
        if (routeDrag.dragType === 'start') {
          const rect = containerRef.current?.getBoundingClientRect();
          if (!rect) return;
          const canvasX = (e.clientX - rect.left - panX) / zoom;
          const canvasY = (e.clientY - rect.top - panY) / zoom;

          const newSide = pointToBorderSide(routeDrag.fromNode, { x: canvasX, y: canvasY });
          const newAnchor: NodeBorderAnchor = { side: newSide, ratio: 0.5 };
          const newStart = getNodePortForEdge(
            routeDrag.fromNode,
            newSide,
            routeDrag.edge.id,
            routeDrag.toNode,
            layout.edges,
            layout.nodes
          );
          const currentEnd = routeDrag.basePoints[routeDrag.basePoints.length - 1];
          const targetSide = routeDrag.targetAnchor?.side || 'left';

          const raw = [newStart, ...routeDrag.basePoints.slice(1)];
          const waypoints = extractWaypoints(raw);
          const preview =
            waypoints.length > 0
              ? buildManualPoints(newStart, currentEnd, waypoints, newAnchor.side, targetSide)
              : buildOrthogonalConnector(newStart, currentEnd, newAnchor.side, targetSide);

          setRouteDrag((prev) =>
            prev
              ? {
                  ...prev,
                  rawPoints: raw,
                  previewPoints: preview || [newStart, currentEnd],
                  sourceAnchor: newAnchor,
                  moved: true,
                }
              : null
          );
          return;
        }

        if (routeDrag.dragType === 'end') {
          const rect = containerRef.current?.getBoundingClientRect();
          if (!rect) return;
          const canvasX = (e.clientX - rect.left - panX) / zoom;
          const canvasY = (e.clientY - rect.top - panY) / zoom;

          const newSide = pointToBorderSide(routeDrag.toNode, { x: canvasX, y: canvasY });
          const newAnchor: NodeBorderAnchor = { side: newSide, ratio: 0.5 };
          const newEnd = getNodePortForEdge(
            routeDrag.toNode,
            newSide,
            routeDrag.edge.id,
            routeDrag.fromNode,
            layout.edges,
            layout.nodes
          );
          const currentStart = routeDrag.basePoints[0];
          const startSide = routeDrag.sourceAnchor?.side || 'right';

          const raw = [...routeDrag.basePoints.slice(0, -1), newEnd];
          const waypoints = extractWaypoints(raw);
          const preview =
            waypoints.length > 0
              ? buildManualPoints(currentStart, newEnd, waypoints, startSide, newAnchor.side)
              : buildOrthogonalConnector(currentStart, newEnd, startSide, newAnchor.side);

          setRouteDrag((prev) =>
            prev
              ? {
                  ...prev,
                  rawPoints: raw,
                  previewPoints: preview || [currentStart, newEnd],
                  targetAnchor: newAnchor,
                  moved: true,
                }
              : null
          );
          return;
        }

        if (routeDrag.dragType === 'segment') {
          const { basePoints, segmentIndex } = routeDrag;
          const raw = basePoints.map((p) => ({ ...p }));
          const a = raw[segmentIndex];
          const b = raw[segmentIndex + 1];
          if (!a || !b) return;

          const start = raw[0];
          const end = raw[raw.length - 1];
          const isHorizontal = Math.abs(a.y - b.y) < 0.01;

          if (isHorizontal) {
            const deltaY = (e.clientY - routeDrag.startClientY) / zoom;
            const rawY = basePoints[segmentIndex].y + deltaY;
            const alignY = Math.round((start.y + end.y) / 2);
            const isEndpointsAligned = Math.abs(start.y - end.y) <= STRAIGHT_ALIGN_TOLERANCE;

            let finalY: number;
            // Magnetic snap to straight alignment line if within 15px
            if (isEndpointsAligned && Math.abs(rawY - alignY) <= 15) {
              finalY = alignY;
            } else if (Math.abs(rawY - start.y) <= 8) {
              finalY = start.y;
            } else if (Math.abs(rawY - end.y) <= 8) {
              finalY = end.y;
            } else {
              finalY = Math.round(rawY);
            }

            a.y = finalY;
            b.y = finalY;
          } else {
            const deltaX = (e.clientX - routeDrag.startClientX) / zoom;
            const rawX = basePoints[segmentIndex].x + deltaX;
            const alignX = Math.round((start.x + end.x) / 2);
            const isEndpointsAligned = Math.abs(start.x - end.x) <= STRAIGHT_ALIGN_TOLERANCE;

            let finalX: number;
            // Magnetic snap to straight alignment line if within 15px
            if (isEndpointsAligned && Math.abs(rawX - alignX) <= 15) {
              finalX = alignX;
            } else if (Math.abs(rawX - start.x) <= 8) {
              finalX = start.x;
            } else if (Math.abs(rawX - end.x) <= 8) {
              finalX = end.x;
            } else {
              finalX = Math.round(rawX);
            }

            a.x = finalX;
            b.x = finalX;
          }

          const simplified = simplifyPolyline(raw);
          const straightened = straightenAlignedPolyline(simplified, STRAIGHT_ALIGN_TOLERANCE);
          const waypoints = extractWaypoints(straightened);

          const startSide = routeDrag.sourceAnchor?.side || 'right';
          const targetSide = routeDrag.targetAnchor?.side || 'left';

          let preview: Point[];
          if (straightened.length === 2) {
            preview = straightened;
          } else if (waypoints.length > 0) {
            const manual = buildManualPoints(start, end, waypoints, startSide, targetSide);
            preview = manual || straightened;
          } else {
            preview = buildOrthogonalConnector(start, end, startSide, targetSide);
          }

          setRouteDrag((prev) =>
            prev ? { ...prev, rawPoints: straightened, previewPoints: preview, moved: true } : null
          );
          return;
        }
      }
      if (marqueeState) {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const canvasX = (e.clientX - rect.left - panX) / zoom;
        const canvasY = (e.clientY - rect.top - panY) / zoom;

        const boxLeft = Math.min(marqueeState.startX, canvasX);
        const boxRight = Math.max(marqueeState.startX, canvasX);
        const boxTop = Math.min(marqueeState.startY, canvasY);
        const boxBottom = Math.max(marqueeState.startY, canvasY);

        // Find all nodes whose bounding box intersects the marquee rectangle
        const hitIds = layout.nodes
          .filter((n) => {
            return !(
              n.x + n.width < boxLeft ||
              n.x > boxRight ||
              n.y + n.height < boxTop ||
              n.y > boxBottom
            );
          })
          .map((n) => n.instanceId);

        const newSelected = marqueeState.isAppend
          ? Array.from(new Set([...marqueeState.initialSelectedIds, ...hitIds]))
          : hitIds;

        setSelectedInstances(newSelected);
        setMarqueeState((prev) => (prev ? { ...prev, currentX: canvasX, currentY: canvasY } : null));
        return;
      }
      if (multiDragState) {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);

        rafRef.current = requestAnimationFrame(() => {
          const rawDx = (e.clientX - multiDragState.startClientX) / zoom;
          const rawDy = (e.clientY - multiDragState.startClientY) / zoom;
          const isMulti = multiDragState.items.length > 1;

          let effectiveDx = rawDx;
          let activeGuide: {
            type: 'vertical' | 'horizontal';
            pos: number;
            start: number;
            end: number;
            alignedNodeTitle?: string;
          } | null = null;

          if (!isMulti) {
            // SINGLE NODE: Magnetic Snap to other candidate nodes
            const primaryItem = multiDragState.items[0];
            const primaryNode = primaryItem.node;
            const rawProposedPrimaryX = Math.max(160, Math.round(primaryItem.nodeStartX + rawDx));

            // Nodes not being dragged (candidates for auto-alignment)
            const candidateNodes = layout.nodes.filter((n) => n.instanceId !== primaryNode.instanceId);

            const SNAP_THRESHOLD = 15;
            let bestSnapScore = Infinity;
            let bestSnappedX = rawProposedPrimaryX;

            const primaryCenterX = rawProposedPrimaryX + primaryNode.width / 2;
            const primaryLeftX = rawProposedPrimaryX;
            const primaryRightX = rawProposedPrimaryX + primaryNode.width;

            candidateNodes.forEach((other) => {
              const otherCenterX = other.x + other.width / 2;
              const otherLeftX = other.x;
              const otherRightX = other.x + other.width;

              // 1. Center-to-Center snap (highest priority: produces 100% straight vertical flows)
              const diffCenter = Math.abs(primaryCenterX - otherCenterX);
              if (diffCenter <= SNAP_THRESHOLD) {
                const score = diffCenter * 0.75;
                if (score < bestSnapScore) {
                  bestSnapScore = score;
                  bestSnappedX = otherCenterX - primaryNode.width / 2;
                  const minY = Math.min(primaryNode.y, other.y) - 14;
                  const maxY = Math.max(primaryNode.y + primaryNode.height, other.y + other.height) + 14;
                  activeGuide = {
                    type: 'vertical',
                    pos: otherCenterX,
                    start: minY,
                    end: maxY,
                    alignedNodeTitle: other.title,
                  };
                }
              }

              // 2. Left-to-Left snap
              const diffLeft = Math.abs(primaryLeftX - otherLeftX);
              if (diffLeft <= SNAP_THRESHOLD) {
                const score = diffLeft;
                if (score < bestSnapScore) {
                  bestSnapScore = score;
                  bestSnappedX = otherLeftX;
                  const minY = Math.min(primaryNode.y, other.y) - 14;
                  const maxY = Math.max(primaryNode.y + primaryNode.height, other.y + other.height) + 14;
                  activeGuide = {
                    type: 'vertical',
                    pos: otherLeftX,
                    start: minY,
                    end: maxY,
                    alignedNodeTitle: other.title,
                  };
                }
              }

              // 3. Right-to-Right snap
              const diffRight = Math.abs(primaryRightX - otherRightX);
              if (diffRight <= SNAP_THRESHOLD) {
                const score = diffRight;
                if (score < bestSnapScore) {
                  bestSnapScore = score;
                  bestSnappedX = otherRightX - primaryNode.width;
                  const minY = Math.min(primaryNode.y, other.y) - 14;
                  const maxY = Math.max(primaryNode.y + primaryNode.height, other.y + other.height) + 14;
                  activeGuide = {
                    type: 'vertical',
                    pos: otherRightX,
                    start: minY,
                    end: maxY,
                    alignedNodeTitle: other.title,
                  };
                }
              }
            });

            if (bestSnapScore < Infinity) {
              effectiveDx = bestSnappedX - primaryItem.nodeStartX;
            } else {
              effectiveDx = rawProposedPrimaryX - primaryItem.nodeStartX;
            }
          } else {
            // MULTI-SELECTION DRAG:
            // Calculate minimum startX across all items to guarantee NO item crosses margin (< 160)
            const minStartX = Math.min(...multiDragState.items.map((i) => i.nodeStartX));
            // Uniform clamp: every node shifts by EXACT SAME effectiveDx
            effectiveDx = Math.max(160 - minStartX, rawDx);
          }

          setSnapGuide(activeGuide);

          const updatedOffsets = new Map<string, { x: number; y: number; assignedRoleId?: string }>();

          multiDragState.items.forEach(({ node, nodeStartX, nodeStartY }) => {
            const isSpecial = node.nodeKind === 'storage' || node.nodeKind === 'mediator';
            // Uniformly shift all nodes by effectiveDx to keep exact order and relative spacing!
            const newX = Math.round(nodeStartX + effectiveDx);

            let newY = nodeStartY;
            let assignedRoleId: string | undefined = undefined;

            if (!isMulti) {
              const diagSwimlanes = node.diagramId
                ? layout.swimlanes.filter((l) => l.diagramId === node.diagramId)
                : layout.swimlanes;

              if (isSpecial && diagSwimlanes.length > 0) {
                // Magnet: follow the lane under the cursor and sit centered in it
                const centerNodeY = nodeStartY + rawDy + node.height / 2;
                const targetLane =
                  diagSwimlanes.find(
                    (lane) => centerNodeY >= lane.y && centerNodeY <= lane.y + lane.height
                  ) ||
                  diagSwimlanes.reduce((nearest, lane) => {
                    const distance = (l: typeof lane) =>
                      Math.min(Math.abs(centerNodeY - l.y), Math.abs(centerNodeY - (l.y + l.height)));
                    return distance(lane) < distance(nearest) ? lane : nearest;
                  });
                newY = targetLane.y + (targetLane.height - node.height) / 2;
                assignedRoleId = targetLane.roleId;
              } else {
                const lane = diagSwimlanes.find((l) => l.roleId === node.roleId) || layout.swimlanes.find((l) => l.roleId === node.roleId);
                if (lane) {
                  const minY = lane.y + 6;
                  const maxY = lane.y + lane.height - node.height - 6;
                  newY = Math.max(minY, Math.min(maxY, nodeStartY + rawDy));
                }
              }
            } else {
              // When moving multiple nodes, preserve each node's exact Y position inside its lane!
              newY = nodeStartY;
            }

            updatedOffsets.set(node.instanceId, { x: newX, y: newY, assignedRoleId });
          });

          setMultiDragState((prev) => (prev ? { ...prev, currentOffsets: updatedOffsets } : null));
        });
      } else if (labelDragState) {
        const dx = (e.clientX - labelDragState.startClientX) / zoom;
        const dy = (e.clientY - labelDragState.startClientY) / zoom;
        const dist = Math.hypot(e.clientX - labelDragState.startClientX, e.clientY - labelDragState.startClientY);
        const hasMoved = labelDragState.hasMoved || dist > 4;
        setLabelDragState((prev) =>
          prev
            ? {
                ...prev,
                currentLabelX: Math.round(prev.startLabelX + dx),
                currentLabelY: Math.round(prev.startLabelY + dy),
                hasMoved,
              }
            : null
        );
      } else if (isPanning) {
        const dx = e.clientX - panStartRef.current.x;
        const dy = e.clientY - panStartRef.current.y;
        const clamped = clampPan(panStartRef.current.startPanX + dx, panStartRef.current.startPanY + dy, zoom);
        setPan(clamped.x, clamped.y);
      }
    },
    [isPanning, multiDragState, routeDrag, labelDragState, zoom, setPan, clampPan, layout.swimlanes]
  );

  const handleMouseUp = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    if (routeDrag) {
      if (routeDrag.moved) {
        const isEndpointDrag = routeDrag.dragType === 'start' || routeDrag.dragType === 'end';
        const waypoints = isEndpointDrag
          ? (routeDrag.edge.isManualRoute ? extractWaypoints(routeDrag.previewPoints) : undefined)
          : extractWaypoints(routeDrag.previewPoints);

        setEdgeRoute(routeDrag.edge.routeKey, {
          waypoints: waypoints && waypoints.length > 0 ? waypoints : [],
          sourceAnchor: routeDrag.sourceAnchor,
          targetAnchor: routeDrag.targetAnchor,
        });

        if (routeDrag.edge.frameId) {
          updateEdge(
            routeDrag.edge.frameId,
            routeDrag.edge.fromInstanceId,
            routeDrag.edge.toInstanceId,
            {
              source_anchor: routeDrag.sourceAnchor,
              target_anchor: routeDrag.targetAnchor,
            }
          );
        } else {
          updateStandaloneEdge(
            routeDrag.edge.fromInstanceId,
            routeDrag.edge.toInstanceId,
            {
              source_anchor: routeDrag.sourceAnchor,
              target_anchor: routeDrag.targetAnchor,
            }
          );
        }
      }
      setRouteDrag(null);
      return;
    }

    if (marqueeState) {
      const dist = Math.hypot(marqueeState.currentX - marqueeState.startX, marqueeState.currentY - marqueeState.startY);
      if (dist > 5) {
        const count = selection.selectedInstanceIds.length;
        if (count > 0) {
          addToast('info', t('canvas.selectedCount', { count }) || `Đã chọn ${count} nhiệm vụ`);
        }
      }
      setMarqueeState(null);
      // Automatically return to select mode so user can immediately move/edit the selected items!
      if (interactionMode === 'boxSelect') {
        setInteractionMode('select');
      }
    }

    if (multiDragState) {
      if (multiDragState.items.length === 1) {
        const primaryItem = multiDragState.items[0];
        const primaryOffset = multiDragState.currentOffsets.get(primaryItem.node.instanceId);
        const primaryFinalX = primaryOffset ? primaryOffset.x : primaryItem.node.x;

        const targetFrame = layout.frames.find(
          (f) =>
            f.diagramId === primaryItem.node.diagramId &&
            primaryFinalX + primaryItem.node.width / 2 >= f.x &&
            primaryFinalX + primaryItem.node.width / 2 <= f.x + f.width
        );

        if (targetFrame && targetFrame.frameId !== primaryItem.node.frameId) {
          const primaryCenterX = primaryFinalX + primaryItem.node.width / 2;
          const insertIndex = layout.nodes.filter(
            (n) => n.frameId === targetFrame.frameId && n.x + n.width / 2 < primaryCenterX
          ).length;
          // Seamless transfer across frames without any annoying confirm guardrail dialog
          moveNodeToFrame(
            primaryItem.node.frameId,
            targetFrame.frameId,
            primaryItem.node.instanceId,
            primaryFinalX,
            primaryOffset?.assignedRoleId,
            insertIndex
          );
        } else {
          if (primaryOffset) {
            updateNodePosition(
              primaryItem.node.frameId,
              primaryItem.node.instanceId,
              primaryOffset.x,
              primaryOffset.y,
              primaryOffset.assignedRoleId
            );
          }
        }
      } else {
        // MULTI-NODE DRAG:
        // Group movement: Preserve all items and frames!
        const updates = multiDragState.items.map((item) => {
          const pos = multiDragState.currentOffsets.get(item.node.instanceId);
          return {
            frameId: item.node.frameId,
            instanceId: item.node.instanceId,
            customX: pos ? pos.x : item.node.x,
            customY: pos ? pos.y : item.node.y,
            assignedRoleId: pos?.assignedRoleId,
          };
        });
        updateMultipleNodesPositions(updates);
      }

      setMultiDragState(null);
    }

    if (labelDragState) {
      if (labelDragState.hasMoved) {
        justDraggedLabelRef.current = true;
        setTimeout(() => {
          justDraggedLabelRef.current = false;
        }, 150);

        updateEdgeConfig(
          labelDragState.edge.fromInstanceId,
          labelDragState.edge.toInstanceId,
          {
            label_x: labelDragState.currentLabelX,
            label_y: labelDragState.currentLabelY,
          }
        );
      }
      setLabelDragState(null);
    }

    setSnapGuide(null);
    setIsPanning(false);
  }, [
    multiDragState,
    routeDrag,
    labelDragState,
    layout.frames,
    layout.nodes,
    schema.active_diagram_id,
    updateNodePosition,
    updateMultipleNodesPositions,
    updateEdgeConfig,
    setEdgeRoute,
    setActiveDiagram,
  ]);

  useEffect(() => {
    if (isPanning || multiDragState || routeDrag || labelDragState || marqueeState) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isPanning, multiDragState, routeDrag, labelDragState, marqueeState, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    if (!routeEditKey) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        e.preventDefault();
        setRouteEditKey(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [routeEditKey]);

  const handleRouteHandleDown = (
    e: React.MouseEvent,
    edge: LayoutEdge,
    handleType: EdgeHandleType,
    segmentIndex: number
  ) => {
    e.stopPropagation();
    e.preventDefault();

    if (edge.diagramId && edge.diagramId !== schema.active_diagram_id) {
      setActiveDiagram(edge.diagramId);
    }

    const fromNode = layout.nodes.find((n) => n.instanceId === edge.fromInstanceId);
    const toNode = layout.nodes.find((n) => n.instanceId === edge.toInstanceId);
    if (!fromNode || !toNode) return;

    let basePoints = edge.points.map((p) => ({ ...p }));
    let index = segmentIndex;

    if (handleType === 'segment' && segmentIndex === STRAIGHT_EDGE_HANDLE) {
      // A straight edge has no bends yet: give it an orthogonal shape whose middle run can be dragged.
      const [start, end] = basePoints;
      const isVertical = Math.abs(start.x - end.x) <= Math.abs(start.y - end.y);
      if (isVertical) {
        const y1 = Math.round(start.y + (end.y - start.y) * 0.35);
        const y2 = Math.round(start.y + (end.y - start.y) * 0.65);
        basePoints = [
          start,
          { x: start.x, y: y1 },
          { x: start.x, y: y1 },
          { x: end.x, y: y2 },
          { x: end.x, y: y2 },
          end,
        ];
        index = 2;
      } else {
        const x1 = Math.round(start.x + (end.x - start.x) * 0.35);
        const x2 = Math.round(start.x + (end.x - start.x) * 0.65);
        basePoints = [
          start,
          { x: x1, y: start.y },
          { x: x1, y: start.y },
          { x: x2, y: end.y },
          { x: x2, y: end.y },
          end,
        ];
        index = 2;
      }
    }

    setRouteDrag({
      edge,
      dragType: handleType,
      segmentIndex: index,
      basePoints,
      startClientX: e.clientX,
      startClientY: e.clientY,
      rawPoints: basePoints,
      previewPoints: basePoints,
      fromNode,
      toNode,
      sourceAnchor: edge.sourceAnchor,
      targetAnchor: edge.targetAnchor,
      moved: false,
    });
  };

  const handleSelectSide = (edge: LayoutEdge, type: 'start' | 'end', side: BorderSide) => {
    if (edge.diagramId && edge.diagramId !== schema.active_diagram_id) {
      setActiveDiagram(edge.diagramId);
    }

    const newSourceAnchor: NodeBorderAnchor =
      type === 'start'
        ? { side, ratio: 0.5 }
        : edge.sourceAnchor || { side: 'right', ratio: 0.5 };

    const newTargetAnchor: NodeBorderAnchor =
      type === 'end'
        ? { side, ratio: 0.5 }
        : edge.targetAnchor || { side: 'left', ratio: 0.5 };

    setEdgeRoute(edge.routeKey, {
      sourceAnchor: newSourceAnchor,
      targetAnchor: newTargetAnchor,
    });

    if (edge.frameId) {
      updateEdge(edge.frameId, edge.fromInstanceId, edge.toInstanceId, {
        source_anchor: newSourceAnchor,
        target_anchor: newTargetAnchor,
      });
    } else {
      updateStandaloneEdge(edge.fromInstanceId, edge.toInstanceId, {
        source_anchor: newSourceAnchor,
        target_anchor: newTargetAnchor,
      });
    }

    const sideName = side === 'top' ? t('canvas.sideTop') : side === 'bottom' ? t('canvas.sideBottom') : side === 'left' ? t('canvas.sideLeft') : t('canvas.sideRight');
    addToast('info', t('canvas.edgeAnchorSwitched', { endpoint: type === 'start' ? t('canvas.sourceNodeFallback') : t('canvas.targetNodeFallback'), side: sideName }));
  };

  const routeEditEdge = routeEditKey ? layout.edges.find((ed) => ed.routeKey === routeEditKey) : null;
  const manualRouteCount = Object.keys(schema.edge_routes || {}).length;

  // Handle Zoom via mouse wheel with viewport bounds clamping
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    const mouseX = rect ? e.clientX - rect.left : (containerRef.current?.clientWidth || 1000) / 2;
    const mouseY = rect ? e.clientY - rect.top : (containerRef.current?.clientHeight || 800) / 2;

    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Number(
      Math.min(CANVAS_DEFAULTS.ZOOM_MAX, Math.max(CANVAS_DEFAULTS.ZOOM_MIN, zoom * zoomFactor)).toFixed(2)
    );
    if (newZoom === zoom) return;

    // Zoom centered toward cursor position
    const rawPanX = mouseX - (mouseX - panX) * (newZoom / zoom);
    const rawPanY = mouseY - (mouseY - panY) * (newZoom / zoom);
    const clamped = clampPan(rawPanX, rawPanY, newZoom);

    setZoom(newZoom);
    setPan(clamped.x, clamped.y);
  };

  // Fit to screen
  const handleFitToScreen = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    if (layout.canvasWidth === 0 || layout.canvasHeight === 0) return;

    const scaleX = (clientWidth - 60) / layout.canvasWidth;
    const scaleY = (clientHeight - 100) / layout.canvasHeight;
    const fitZoom = Math.min(1.2, Math.max(CANVAS_DEFAULTS.ZOOM_MIN, Math.min(scaleX, scaleY)));

    setZoom(Number(fitZoom.toFixed(2)));
    setPan(30, 20);
  }, [layout.canvasWidth, layout.canvasHeight, setZoom, setPan]);

  // Register Global Keybindings (Undo, Redo, Ctrl+Q, Ctrl+A, etc. - Requirement 1, 4, 5)
  useGlobalKeybindings(allInstanceIds, handleFitToScreen);

  // Node Drag Start handler (supports multi-selection dragging)
  const handleStartNodeDrag = (e: React.MouseEvent, clickedNode: LayoutNode) => {
    e.stopPropagation();

    if (interactionMode === 'pan') {
      setIsPanning(true);
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        startPanX: panX,
        startPanY: panY,
      };
      return;
    }

    if (interactionMode === 'boxSelect') {
      setInteractionMode('select');
    }

    if (clickedNode.diagramId && clickedNode.diagramId !== schema.active_diagram_id) {
      setActiveDiagram(clickedNode.diagramId);
    }

    const isAlreadySelected = selection.selectedInstanceIds.includes(clickedNode.instanceId);

    let dragIds = selection.selectedInstanceIds;
    if (!isAlreadySelected || dragIds.length <= 1) {
      setSelectedInstance(clickedNode.instanceId);
      setSelectedFrame(clickedNode.frameId);
      dragIds = [clickedNode.instanceId];
      lastAnchorIdRef.current = clickedNode.instanceId;
    }

    const itemsToDrag: MultiDragItem[] = layout.nodes
      .filter((n) => dragIds.includes(n.instanceId))
      .map((n) => ({
        node: n,
        nodeStartX: n.x,
        nodeStartY: n.y,
      }));

    if (itemsToDrag.length === 0) {
      itemsToDrag.push({
        node: clickedNode,
        nodeStartX: clickedNode.x,
        nodeStartY: clickedNode.y,
      });
    }

    setMultiDragState({
      items: itemsToDrag,
      startClientX: e.clientX,
      startClientY: e.clientY,
      currentOffsets: new Map(),
      primaryNode: clickedNode,
    });
  };

  // Node Click Selection (Ctrl for toggle, Shift for flow range selection - Requirement 2)
  const handleNodeClick = (e: React.MouseEvent, instanceId: string, frameId: string, diagramId?: string) => {
    // In Pan mode (Ctrl+A), canvas is purely for viewing/panning, do not alter selection on click
    if (interactionMode === 'pan') {
      return;
    }

    if (interactionMode === 'boxSelect') {
      setInteractionMode('select');
    }

    if (diagramId && diagramId !== schema.active_diagram_id) {
      setActiveDiagram(diagramId);
    }

    if (e.ctrlKey || e.metaKey) {
      // Toggle individual node
      toggleSelectInstance(instanceId, true);
      lastAnchorIdRef.current = instanceId;
    } else if (e.shiftKey && lastAnchorIdRef.current) {
      // Range selection along chart flow (within the same diagram only)
      const anchorNode = layout.nodes.find((n) => n.instanceId === lastAnchorIdRef.current);
      const targetNode = layout.nodes.find((n) => n.instanceId === instanceId);
      if (anchorNode && targetNode && anchorNode.diagramId === targetNode.diagramId) {
        const diagNodes = layout.nodes.filter((n) => n.diagramId === targetNode.diagramId);
        const anchorIndex = diagNodes.findIndex((n) => n.instanceId === lastAnchorIdRef.current);
        const targetIndex = diagNodes.findIndex((n) => n.instanceId === instanceId);
        if (anchorIndex !== -1 && targetIndex !== -1) {
          const start = Math.min(anchorIndex, targetIndex);
          const end = Math.max(anchorIndex, targetIndex);
          const rangeIds = diagNodes.slice(start, end + 1).map((n) => n.instanceId);
          setSelectedInstances(rangeIds);
          addToast('info', t('canvas.flowTasksSelected', { count: rangeIds.length }));
        }
      } else {
        setSelectedInstance(instanceId);
        lastAnchorIdRef.current = instanceId;
      }
    } else {
      // Single selection
      setSelectedInstance(instanceId);
      lastAnchorIdRef.current = instanceId;
    }

    setSelectedFrame(frameId);
    setHighlightedPath(calculateConnectedPath(instanceId));
  };

  const calculateConnectedPath = (instanceId: string) => {
    const connected = new Set<string>([instanceId]);
    let queue = [instanceId];
    while (queue.length > 0) {
      const current = queue.shift()!;
      layout.edges.forEach((e) => {
        if (e.fromInstanceId === current && !connected.has(e.toInstanceId)) {
          connected.add(e.toInstanceId);
          queue.push(e.toInstanceId);
        }
      });
    }
    queue = [instanceId];
    while (queue.length > 0) {
      const current = queue.shift()!;
      layout.edges.forEach((e) => {
        if (e.toInstanceId === current && !connected.has(e.fromInstanceId)) {
          connected.add(e.fromInstanceId);
          queue.push(e.fromInstanceId);
        }
      });
    }
    return Array.from(connected);
  };

  const handleNodeHoverStart = (instanceId: string) => {
    setHighlightedPath(calculateConnectedPath(instanceId));
  };

  const handleNodeHoverEnd = () => {
    if (!selection.selectedInstanceId) {
      setHighlightedPath([]);
    } else {
      setHighlightedPath(calculateConnectedPath(selection.selectedInstanceId));
    }
  };

  const isEdgeHighlighted = (fromId: string, toId: string) => {
    return (
      selection.highlightedPath.includes(fromId) &&
      selection.highlightedPath.includes(toId)
    );
  };

  const handleStartLabelDrag = (e: React.MouseEvent, edge: LayoutEdge) => {
    e.stopPropagation();
    setLabelDragState({
      edge,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startLabelX: edge.labelX,
      startLabelY: edge.labelY,
      currentLabelX: edge.labelX,
      currentLabelY: edge.labelY,
      hasMoved: false,
    });
  };

  const handleSaveEdge = (updates: {
    message_label: string;
    flow_type: any;
    color?: string;
    source_anchor?: NodeBorderAnchor;
    target_anchor?: NodeBorderAnchor;
  }) => {
    if (!editingEdge) return;

    // Check if anchor configuration actually changed
    const currentSourceSide = editingEdge.sourceAnchor?.side || undefined;
    const currentTargetSide = editingEdge.targetAnchor?.side || undefined;
    const newSourceSide = updates.source_anchor?.side || undefined;
    const newTargetSide = updates.target_anchor?.side || undefined;
    const anchorsChanged = newSourceSide !== currentSourceSide || newTargetSide !== currentTargetSide;

    const edgeUpdates: any = {
      message_label: updates.message_label,
      flow_type: updates.flow_type,
      color: updates.color,
    };

    if (anchorsChanged) {
      edgeUpdates.source_anchor = updates.source_anchor;
      edgeUpdates.target_anchor = updates.target_anchor;
      setEdgeRoute(editingEdge.routeKey, {
        sourceAnchor: updates.source_anchor || null,
        targetAnchor: updates.target_anchor || null,
      });
    }

    updateEdgeConfig(editingEdge.fromInstanceId, editingEdge.toInstanceId, edgeUpdates);
    addToast('success', t('canvas.flowUpdated'));
    setEditingEdge(null);
  };

  const fromNode = editingEdge ? layout.nodes.find((n) => n.instanceId === editingEdge.fromInstanceId) : null;
  const toNode = editingEdge ? layout.nodes.find((n) => n.instanceId === editingEdge.toInstanceId) : null;

  return (
    <div className={`flex flex-col w-full h-full overflow-hidden select-none ${isDark ? 'bg-[#0B0F17]' : 'bg-slate-100/70'}`}>
      {/* 1. Canvas Sub-Toolbar (Structured, accessible, displays shortcut keys) */}
      <CanvasSubToolbar
        totalNodes={layout.nodes.length}
        allInstanceIds={allInstanceIds}
        onFitToScreen={handleFitToScreen}
      />

      {/* 2. Main Interactive SVG Diagram Canvas Area */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
        className={`relative flex-1 w-full h-full overflow-hidden select-none ${
          interactionMode === 'pan'
            ? isPanning
              ? 'cursor-grabbing select-none'
              : 'cursor-grab active:cursor-grabbing'
            : interactionMode === 'boxSelect' || marqueeState
            ? 'cursor-crosshair'
            : 'cursor-default'
        }`}
      >
        {/* Subtle Canvas Dot Grid Background */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none opacity-40"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="canvas-grid" width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M 24 0 L 0 0 0 24" fill="none" stroke={isDark ? '#1E293B' : '#CBD5E1'} strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#canvas-grid)" />
        </svg>

        {/* Scalable & Pannable SVG */}
        <svg
          width="100%"
          height="100%"
          className={`w-full h-full overflow-visible ${isPanning ? 'pointer-events-none' : ''}`}
          style={{
            transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
        >
          <defs>
            <marker
              id="arrow-normal"
              viewBox="0 0 8 8"
              refX="7"
              refY="4"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M 0 1 L 7 4 L 0 7 z" fill={isDark ? '#94A3B8' : '#64748B'} />
            </marker>

            <marker
              id="arrow-macro"
              viewBox="0 0 8 8"
              refX="7"
              refY="4"
              markerWidth="7"
              markerHeight="7"
              orient="auto"
            >
              <path d="M 0 1 L 7 4 L 0 7 z" fill={isDark ? '#818CF8' : '#6366F1'} />
            </marker>

            <marker
              id="arrow-highlight"
              viewBox="0 0 8 8"
              refX="7"
              refY="4"
              markerWidth="8"
              markerHeight="8"
              orient="auto"
            >
              <path d="M 0 1 L 7 4 L 0 7 z" fill="#F59E0B" />
            </marker>
          </defs>

          {/* Layer 0: Diagram Header Banners (for stacked multi-diagram support) */}
          <g>
            {layout.diagramHeaders.map((dh) => (
              <g
                key={dh.id}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => {
                  setActiveDiagram(dh.id);
                  addToast('info', t('canvas.activeDiagramToast', { title: dh.title }));
                }}
                className="cursor-pointer group select-none"
              >
                {/* Banner background */}
                <rect
                  x={dh.x}
                  y={dh.y}
                  width={dh.width}
                  height={dh.height}
                  rx={8}
                  fill={dh.isActive ? (isDark ? '#1E293B' : '#EFF6FF') : (isDark ? '#0F172A' : '#F8FAFC')}
                  stroke={dh.isActive ? '#3B82F6' : (isDark ? '#334155' : '#E2E8F0')}
                  strokeWidth={dh.isActive ? 1.75 : 1}
                />
                {/* Order tag badge */}
                <rect
                  x={dh.x + 8}
                  y={dh.y + 7}
                  width={24}
                  height={22}
                  rx={6}
                  fill={dh.isActive ? '#2563EB' : (isDark ? '#475569' : '#94A3B8')}
                />
                <text
                  x={dh.x + 20}
                  y={dh.y + 22}
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize={11}
                  fontWeight={700}
                >
                  #{dh.order}
                </text>
                {/* Diagram Title */}
                <text
                  x={dh.x + 40}
                  y={dh.y + 22}
                  fill={dh.isActive ? (isDark ? '#60A5FA' : '#1D4ED8') : (isDark ? '#F1F5F9' : '#1E293B')}
                  fontSize={13}
                  fontWeight={700}
                >
                  {dh.title}
                </text>
                {/* Frame & Node count summary */}
                <text
                  x={dh.x + 48 + Math.min(dh.title.length * 8.5, 320)}
                  y={dh.y + 22}
                  fill={isDark ? '#94A3B8' : '#64748B'}
                  fontSize={11}
                  fontWeight={500}
                >
                  {t('canvas.diagramSummary', { frameCount: dh.frameCount, nodeCount: dh.nodeCount })}
                </text>
                {/* Status badge at right */}
                {dh.isActive ? (
                  <g transform={`translate(${Math.max(dh.x + 380, dh.x + dh.width - 150)}, ${dh.y + 8})`}>
                    <rect x={0} y={0} width={138} height={20} rx={10} fill="#3B82F6" fillOpacity={isDark ? 0.3 : 0.12} />
                    <text x={69} y={14} textAnchor="middle" fill="#2563EB" fontSize={10} fontWeight={700}>
                      {t('canvas.activeEditing')}
                    </text>
                  </g>
                ) : (
                  <g transform={`translate(${Math.max(dh.x + 380, dh.x + dh.width - 150)}, ${dh.y + 8})`}>
                    <rect x={0} y={0} width={138} height={20} rx={10} fill={isDark ? '#1E293B' : '#E2E8F0'} />
                    <text x={69} y={14} textAnchor="middle" fill={isDark ? '#94A3B8' : '#64748B'} fontSize={10} fontWeight={500}>
                      {t('canvas.clickToSelect')}
                    </text>
                  </g>
                )}
              </g>
            ))}
          </g>

          {/* Layer 1: Swimlanes */}
          <SwimlaneRenderer
            swimlanes={layout.swimlanes}
            isDark={isDark}
            onUpdateLaneSize={(roleId, height) => updateRole(roleId, { custom_height: height })}
            onSelectDiagram={(diagId) => setActiveDiagram(diagId)}
            onMoveRole={(roleId, direction) => {
              moveRole(roleId, direction);
              addToast('info', t('palette.swimlaneMoved') || 'Đã thay đổi thứ tự swimlane');
            }}
          />

          {/* Layer 2: Frame Overlays */}
          <FrameOverlayRenderer
            frames={layout.frames}
            selectedFrameId={selection.selectedFrameId}
            onSelectFrame={(frameId) => setSelectedFrame(frameId)}
            onResizeFrameStart={handleFrameResizeStart}
          />

          {/* Layer 3: Edges (Interactive & Smart Anti-overlapping) */}
          <g>
            {layout.edges.map((edge) => {
              const isDragged = routeDrag?.edge.routeKey === edge.routeKey;
              let displayEdge = isDragged
                ? { ...edge, points: routeDrag.previewPoints, pathD: pointsToPath(routeDrag.previewPoints) }
                : edge;

              // If a connected node is being dragged, smoothly preview the edge in real time
              if (
                !isDragged &&
                multiDragState &&
                (multiDragState.currentOffsets.has(edge.fromInstanceId) ||
                  multiDragState.currentOffsets.has(edge.toInstanceId))
              ) {
                const fromNode = layout.nodes.find((n) => n.instanceId === edge.fromInstanceId);
                const toNode = layout.nodes.find((n) => n.instanceId === edge.toInstanceId);
                if (fromNode && toNode) {
                  const fromOff = multiDragState.currentOffsets.get(edge.fromInstanceId);
                  const toOff = multiDragState.currentOffsets.get(edge.toInstanceId);
                  const fromN = fromOff ? { ...fromNode, x: fromOff.x, y: fromOff.y } : fromNode;
                  const toN = toOff ? { ...toNode, x: toOff.x, y: toOff.y } : toNode;
                  const inferred = inferDefaultBorderSides(fromN, toN);
                  const startSide = edge.sourceAnchor?.side || inferred.sourceSide;
                  const endSide = edge.targetAnchor?.side || inferred.targetSide;
                  const start = getNodeSidePort(fromN, startSide, 0, 1);
                  const end = getNodeSidePort(toN, endSide, 0, 1);
                  const pts = buildOrthogonalConnector(start, end, startSide, endSide);
                  displayEdge = {
                    ...edge,
                    points: pts,
                    pathD: pointsToPath(pts),
                    labelX: (start.x + end.x) / 2,
                    labelY: (start.y + end.y) / 2,
                  };
                }
              }

              return (
                <EdgeRenderer
                  key={edge.id}
                  edge={displayEdge}
                  isHighlighted={
                    edge.routeKey === routeEditKey || isEdgeHighlighted(edge.fromInstanceId, edge.toInstanceId)
                  }
                  isDark={isDark}
                  enableDarkGlow={enableDarkGlow}
                  onClick={() => {
                    if (edge.diagramId && edge.diagramId !== schema.active_diagram_id) {
                      setActiveDiagram(edge.diagramId);
                    }
                  }}
                  onDoubleClick={() => {
                    if (justDraggedLabelRef.current) return;
                    if (edge.diagramId && edge.diagramId !== schema.active_diagram_id) {
                      setActiveDiagram(edge.diagramId);
                    }
                    setEditingEdge(edge);
                  }}
                  onLabelMouseDown={handleStartLabelDrag}
                  overrideLabelX={labelDragState?.edge.routeKey === edge.routeKey ? labelDragState.currentLabelX : undefined}
                  overrideLabelY={labelDragState?.edge.routeKey === edge.routeKey ? labelDragState.currentLabelY : undefined}
                />
              );
            })}
          </g>

          {/* Layer 4: Nodes (Multi-selectable & Smoothly Draggable) */}
          <g>
            {layout.nodes.map((node) => {
              const offset = multiDragState?.currentOffsets.get(node.instanceId);
              const displayNode = offset ? { ...node, x: offset.x, y: offset.y } : node;
              const isSelected = selection.selectedInstanceIds.includes(node.instanceId);

              return (
                <NodeRenderer
                  key={node.instanceId}
                  node={displayNode}
                  isSelected={isSelected}
                  isHighlighted={selection.highlightedPath.includes(node.instanceId)}
                  isDark={isDark}
                  enableDarkGlow={enableDarkGlow}
                  listingsExpanded={expandedListings.has(node.instanceId)}
                  onSelect={(e) => handleNodeClick(e, node.instanceId, node.frameId, node.diagramId)}
                  onHoverStart={() => handleNodeHoverStart(node.instanceId)}
                  onHoverEnd={handleNodeHoverEnd}
                  onStartDrag={handleStartNodeDrag}
                  onUpdateLabel={(newLabel) =>
                    updateNodeInstance(node.frameId, node.instanceId, { custom_label: newLabel })
                  }
                  onToggleListings={() => toggleListing(node.instanceId)}
                  onUpdateSize={(w, h) =>
                    updateNodeInstance(node.frameId, node.instanceId, { custom_width: w, custom_height: h })
                  }
                  zoom={zoom}
                />
              );
            })}
          </g>

          {/* Alignment Snap Guidelines when dragging with purpose */}
          {snapGuide && (
            <g className="pointer-events-none transition-opacity duration-150">
              {snapGuide.type === 'vertical' ? (
                <g>
                  {/* Subtle luminous glow line */}
                  <line
                    x1={snapGuide.pos}
                    y1={snapGuide.start}
                    x2={snapGuide.pos}
                    y2={snapGuide.end}
                    stroke="#0284C7"
                    strokeWidth={4}
                    strokeOpacity={0.25}
                  />
                  {/* Crisp dashed center line */}
                  <line
                    x1={snapGuide.pos}
                    y1={snapGuide.start}
                    x2={snapGuide.pos}
                    y2={snapGuide.end}
                    stroke="#38BDF8"
                    strokeWidth={1.5}
                    strokeDasharray="5 3"
                  />
                  {/* Anchor dots */}
                  <circle cx={snapGuide.pos} cy={snapGuide.start + 14} r={3.5} fill="#0284C7" stroke="#38BDF8" strokeWidth={1.5} />
                  <circle cx={snapGuide.pos} cy={snapGuide.end - 14} r={3.5} fill="#0284C7" stroke="#38BDF8" strokeWidth={1.5} />
                  {/* Alignment badge */}
                  <g transform={`translate(${snapGuide.pos + 8}, ${(snapGuide.start + snapGuide.end) / 2 - 10})`}>
                    <rect x="0" y="0" width="84" height="20" rx="4" fill="#0F172A" stroke="#38BDF8" strokeWidth={1} fillOpacity={0.9} />
                    <text x="6" y="14" fontSize="10" fontWeight="600" fill="#38BDF8" fontFamily="system-ui, sans-serif">
                      {t('canvas.alignedBadge')}
                    </text>
                  </g>
                </g>
              ) : (
                <g>
                  <line
                    x1={snapGuide.start}
                    y1={snapGuide.pos}
                    x2={snapGuide.end}
                    y2={snapGuide.pos}
                    stroke="#0284C7"
                    strokeWidth={4}
                    strokeOpacity={0.25}
                  />
                  <line
                    x1={snapGuide.start}
                    y1={snapGuide.pos}
                    x2={snapGuide.end}
                    y2={snapGuide.pos}
                    stroke="#38BDF8"
                    strokeWidth={1.5}
                    strokeDasharray="5 3"
                  />
                  <circle cx={snapGuide.start + 14} cy={snapGuide.pos} r={3.5} fill="#0284C7" stroke="#38BDF8" strokeWidth={1.5} />
                  <circle cx={snapGuide.end - 14} cy={snapGuide.pos} r={3.5} fill="#0284C7" stroke="#38BDF8" strokeWidth={1.5} />
                </g>
              )}
            </g>
          )}

          {/* Layer 5: Manual route handles for the edge being edited */}
          {routeEditEdge && (
            <EdgeRouteHandles
              points={routeDrag?.edge.routeKey === routeEditEdge.routeKey ? routeDrag.previewPoints : routeEditEdge.points}
              fromNode={layout.nodes.find((n) => n.instanceId === routeEditEdge.fromInstanceId)}
              toNode={layout.nodes.find((n) => n.instanceId === routeEditEdge.toInstanceId)}
              activeHandleType={routeDrag?.dragType}
              sourceSide={routeDrag?.sourceAnchor?.side || routeEditEdge.sourceAnchor?.side || 'right'}
              targetSide={routeDrag?.targetAnchor?.side || routeEditEdge.targetAnchor?.side || 'left'}
              onSelectSide={(type, side) => handleSelectSide(routeEditEdge, type, side)}
              onHandleMouseDown={(e, handleType, segmentIndex) => handleRouteHandleDown(e, routeEditEdge, handleType, segmentIndex)}
            />
          )}

          {/* Marquee Area Selection Zone (Ctrl+Q Rectangle Select) */}
          {marqueeState && Math.hypot(marqueeState.currentX - marqueeState.startX, marqueeState.currentY - marqueeState.startY) > 2 && (
            <g className="pointer-events-none">
              <rect
                x={Math.min(marqueeState.startX, marqueeState.currentX)}
                y={Math.min(marqueeState.startY, marqueeState.currentY)}
                width={Math.abs(marqueeState.currentX - marqueeState.startX)}
                height={Math.abs(marqueeState.currentY - marqueeState.startY)}
                fill={isDark ? 'rgba(56, 189, 248, 0.16)' : 'rgba(37, 99, 235, 0.12)'}
                stroke={isDark ? '#38BDF8' : '#2563EB'}
                strokeWidth={1.5}
                strokeDasharray="4 2"
                rx={2}
              />
            </g>
          )}
        </svg>

        {/* Manual route editing bar */}
        {(routeEditEdge || manualRouteCount > 0) && (
          <div
            className="absolute top-3 left-4 flex items-center gap-2 z-20"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {routeEditEdge ? (
              <div
                className={`border rounded-lg px-3 py-1.5 shadow-lg text-[11px] flex items-center gap-3 backdrop-blur-sm ${
                  isDark ? 'bg-slate-900/95 border-amber-500/50 text-slate-200' : 'bg-white/95 border-amber-400 text-gray-700 shadow-amber-500/10'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="font-semibold text-amber-600 dark:text-amber-400">{t('canvas.editingFlowRoute')}</span>
                  <span>{t('canvas.editingFlowRouteHint')}</span>
                </div>

                <div className="w-px h-4 bg-gray-200 dark:bg-slate-700" />

                <button
                  type="button"
                  className="font-semibold text-amber-500 hover:text-amber-600 dark:hover:text-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-xs transition-colors"
                  disabled={!routeEditEdge.isManualRoute}
                  onClick={() => {
                    setEdgeRoute(routeEditEdge.routeKey, null);
                    addToast('info', t('canvas.routeAutoToast'));
                  }}
                  title={t('canvas.resetToAutoTitle')}
                >
                  {t('canvas.resetToAutoBtn')}
                </button>

                <button
                  type="button"
                  className="flex items-center gap-1 font-bold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 px-2.5 py-1 rounded-md text-xs shadow-xs transition-colors"
                  onClick={() => setRouteEditKey(null)}
                  title={t('canvas.doneBtnTitle')}
                >
                  <Check size={13} />
                  <span>{t('canvas.doneBtn')}</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                className={`border rounded-lg px-2.5 py-1 shadow-xs text-[11px] transition-colors ${
                  isDark
                    ? 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-200'
                    : 'bg-white/90 border-gray-200 text-gray-500 hover:text-gray-800'
                }`}
                onClick={() => {
                  clearAllEdgeRoutes();
                  addToast('info', t('canvas.resetManualRoutesToast', { count: manualRouteCount }));
                }}
              >
                {t('canvas.resetManualRoutes', { count: manualRouteCount })}
              </button>
            )}
          </div>
        )}

        {/* Quick status pill at bottom left */}
        <div className="absolute bottom-3 left-4 pointer-events-none select-none">
          <div className={`backdrop-blur-xs border rounded-lg px-2.5 py-1 shadow-xs text-[11px] flex items-center gap-2 ${
            isDark ? 'bg-slate-900/90 border-slate-800 text-slate-400' : 'bg-white/90 border-gray-200/90 text-gray-500'
          }`}>
            <span><strong>{schema.roles.length}</strong> {t('canvas.statusLanes', { count: '' }).trim()}</span>
            {schema.frames.length > 0 && (
              <>
                <span>•</span>
                <span><strong>{schema.frames.length}</strong> {t('canvas.statusPhases', { count: '' }).trim()}</span>
              </>
            )}
            <span>•</span>
            <span><strong>{layout.nodes.length}</strong> {t('canvas.statusTasks', { count: '' }).trim()}</span>
            {selection.selectedInstanceIds.length > 0 && (
              <>
                <span>•</span>
                <span className="font-semibold text-blue-500">{t('canvas.selectedCount', { count: selection.selectedInstanceIds.length })}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* On-Canvas Edge Customization Modal */}
      <EdgeEditorModal
        isOpen={Boolean(editingEdge)}
        onClose={() => setEditingEdge(null)}
        edge={editingEdge}
        fromNode={fromNode}
        toNode={toNode}
        fromNodeTitle={fromNode?.title || t('canvas.sourceNodeFallback')}
        toNodeTitle={toNode?.title || t('canvas.targetNodeFallback')}
        onSave={handleSaveEdge}
        onDelete={() => {
          if (editingEdge) {
            removeEdge(editingEdge.fromInstanceId, editingEdge.toInstanceId);
            addToast('info', t('canvas.deleteEdgeSuccess') || 'Đã xóa đường nối');
            setEditingEdge(null);
          }
        }}
        onResetLabelPosition={() => {
          if (editingEdge) {
            updateEdgeConfig(editingEdge.fromInstanceId, editingEdge.toInstanceId, {
              label_x: undefined,
              label_y: undefined,
            });
            addToast('info', 'Đã đặt lại vị trí nhãn về mặc định');
          }
        }}
        onEditRoute={() => {
          if (editingEdge) setRouteEditKey(editingEdge.routeKey);
        }}
        onResetRoute={() => {
          if (editingEdge) {
            setEdgeRoute(editingEdge.routeKey, null);
            addToast('info', t('canvas.routeAutoToast'));
          }
        }}
      />
    </div>
  );
};
