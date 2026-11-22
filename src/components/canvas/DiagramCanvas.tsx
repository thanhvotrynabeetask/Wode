import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useUIStore } from '../../store/useUIStore';
import { LayoutEngine, LayoutNode, LayoutEdge, LayoutFrameOverlay } from '../../services/LayoutEngine';
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
  buildOrthogonalConnector,
} from '../../services/EdgeRouter';
import { BorderSide, NodeBorderAnchor } from '../../types/schema';
import { CanvasSubToolbar } from './CanvasSubToolbar';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useGlobalKeybindings } from '../../hooks/useGlobalKeybindings';
import { CANVAS_DEFAULTS } from '../../utils/constants';
import { Check } from 'lucide-react';

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

export const DiagramCanvas: React.FC = () => {
  const schema = useProjectStore((s) => s.schema);
  const { theme, enableDarkGlow } = useSettingsStore();
  const {
    updateNodePosition,
    updateMultipleNodesPositions,
    moveNodeToFrame,
    updateNodeInstance,
    updateRole,
    updateEdge,
    setEdgeRoute,
    clearAllEdgeRoutes,
    setActiveDiagram,
  } = useProjectStore();

  const {
    interactionMode,
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

  const [editingEdge, setEditingEdge] = useState<LayoutEdge | null>(null);

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

  const [frameTransferConfirm, setFrameTransferConfirm] = useState<{
    node: LayoutNode;
    sourceFrameTitle: string;
    targetFrame: LayoutFrameOverlay;
    newX: number;
    assignedRoleId?: string;
    insertIndex: number;
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

  // Handle Pan via canvas background mouse drag (empty space always allows dragging to pan)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 && e.button !== 1) return;
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
        const snapToGrid = (v: number) => Math.round(v / 10) * 10;

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

          if (Math.abs(a.y - b.y) < 0.01) {
            const y = snapToGrid(a.y + (e.clientY - routeDrag.startClientY) / zoom);
            a.y = y;
            b.y = y;
          } else {
            const x = snapToGrid(a.x + (e.clientX - routeDrag.startClientX) / zoom);
            a.x = x;
            b.x = x;
          }
          const waypoints = extractWaypoints(raw);
          const startSide = routeDrag.sourceAnchor?.side || 'right';
          const targetSide = routeDrag.targetAnchor?.side || 'left';
          const normalized =
            waypoints.length > 0
              ? buildManualPoints(raw[0], raw[raw.length - 1], waypoints, startSide, targetSide)
              : null;
          setRouteDrag((prev) =>
            prev ? { ...prev, rawPoints: raw, previewPoints: normalized || raw, moved: true } : null
          );
          return;
        }
      }
      if (multiDragState) {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);

        rafRef.current = requestAnimationFrame(() => {
          const dx = (e.clientX - multiDragState.startClientX) / zoom;
          const dy = (e.clientY - multiDragState.startClientY) / zoom;

          const updatedOffsets = new Map<string, { x: number; y: number; assignedRoleId?: string }>();

          multiDragState.items.forEach(({ node, nodeStartX, nodeStartY }) => {
            const isSpecial = node.nodeKind === 'storage' || node.nodeKind === 'mediator';
            const newX = Math.max(160, Math.round(nodeStartX + dx));

            let newY = nodeStartY;
            let assignedRoleId: string | undefined = undefined;

            const diagSwimlanes = node.diagramId
              ? layout.swimlanes.filter((l) => l.diagramId === node.diagramId)
              : layout.swimlanes;

            if (isSpecial && diagSwimlanes.length > 0) {
              // Magnet: follow the lane under the cursor (nearest one when outside) and sit centered in it.
              const centerNodeY = nodeStartY + dy + node.height / 2;
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
                newY = Math.max(minY, Math.min(maxY, nodeStartY + dy));
              }
            }

            updatedOffsets.set(node.instanceId, { x: newX, y: newY, assignedRoleId });
          });

          setMultiDragState((prev) => (prev ? { ...prev, currentOffsets: updatedOffsets } : null));
        });
      } else if (isPanning) {
        const dx = e.clientX - panStartRef.current.x;
        const dy = e.clientY - panStartRef.current.y;
        const clamped = clampPan(panStartRef.current.startPanX + dx, panStartRef.current.startPanY + dy, zoom);
        setPan(clamped.x, clamped.y);
      }
    },
    [isPanning, multiDragState, routeDrag, zoom, setPan, clampPan, layout.swimlanes]
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
          waypoints: waypoints && waypoints.length > 0 ? waypoints : undefined,
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
        }
      }
      setRouteDrag(null);
      return;
    }

    if (multiDragState) {
      const primaryOffset = multiDragState.currentOffsets.get(multiDragState.primaryNode.instanceId);
      const primaryFinalX = primaryOffset ? primaryOffset.x : multiDragState.primaryNode.x;

      const targetFrame = layout.frames.find(
        (f) =>
          f.diagramId === multiDragState.primaryNode.diagramId &&
          primaryFinalX + multiDragState.primaryNode.width / 2 >= f.x &&
          primaryFinalX + multiDragState.primaryNode.width / 2 <= f.x + f.width
      );

      if (targetFrame && targetFrame.frameId !== multiDragState.primaryNode.frameId) {
        const primaryCenterX = primaryFinalX + multiDragState.primaryNode.width / 2;
        const insertIndex = layout.nodes.filter(
          (n) => n.frameId === targetFrame.frameId && n.x + n.width / 2 < primaryCenterX
        ).length;
        setFrameTransferConfirm({
          node: multiDragState.primaryNode,
          sourceFrameTitle: multiDragState.primaryNode.frameTitle,
          targetFrame,
          newX: primaryFinalX,
          assignedRoleId: primaryOffset?.assignedRoleId,
          insertIndex,
        });
      } else {
        if (multiDragState.items.length === 1) {
          const item = multiDragState.items[0];
          const pos = multiDragState.currentOffsets.get(item.node.instanceId);
          if (pos) {
            updateNodePosition(
              item.node.frameId,
              item.node.instanceId,
              pos.x,
              pos.y,
              pos.assignedRoleId
            );
          }
        } else {
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
      }

      setMultiDragState(null);
    }

    setIsPanning(false);
  }, [
    multiDragState,
    routeDrag,
    layout.frames,
    layout.nodes,
    updateNodePosition,
    updateMultipleNodesPositions,
    setEdgeRoute,
  ]);

  useEffect(() => {
    if (isPanning || multiDragState || routeDrag) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isPanning, multiDragState, routeDrag, handleMouseMove, handleMouseUp]);

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
      // A straight edge has no bends yet: give it a Z shape whose middle run can be dragged.
      const [start, end] = basePoints;
      const snapToGrid = (v: number) => Math.round(v / 10) * 10;
      const x1 = snapToGrid(start.x + (end.x - start.x) * 0.3);
      const x2 = snapToGrid(start.x + (end.x - start.x) * 0.7);
      basePoints = [
        start,
        { x: x1, y: start.y },
        { x: x1, y: start.y },
        { x: x2, y: start.y },
        { x: x2, y: start.y },
        end,
      ];
      index = 2;
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
    }

    const sideName = side === 'top' ? 'trên' : side === 'bottom' ? 'dưới' : side === 'left' ? 'trái' : 'phải';
    addToast('info', `Đã chuyển điểm chạm ${type === 'start' ? 'đầu nguồn' : 'đầu đích'} sang cạnh ${sideName}.`);
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
          addToast('info', `Đã chọn ${rangeIds.length} nhiệm vụ theo luồng`);
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

  const handleSaveEdge = (updates: {
    message_label: string;
    flow_type: any;
    color?: string;
    source_anchor?: NodeBorderAnchor;
    target_anchor?: NodeBorderAnchor;
  }) => {
    if (!editingEdge) return;
    const targetFrameId = editingEdge.frameId || schema.frames[0]?.frame_id;
    if (targetFrameId) {
      updateEdge(targetFrameId, editingEdge.fromInstanceId, editingEdge.toInstanceId, updates);
    }
    if (updates.source_anchor || updates.target_anchor) {
      setEdgeRoute(editingEdge.routeKey, {
        sourceAnchor: updates.source_anchor,
        targetAnchor: updates.target_anchor,
      });
    }
    addToast('success', 'Đã cập nhật thuộc tính luồng dữ liệu.');
    setEditingEdge(null);
  };

  const handleConfirmFrameTransfer = () => {
    if (!frameTransferConfirm) return;
    const { node, targetFrame, newX, assignedRoleId, insertIndex } = frameTransferConfirm;
    moveNodeToFrame(node.frameId, targetFrame.frameId, node.instanceId, newX, assignedRoleId, insertIndex);
    setSelectedFrame(targetFrame.frameId);
    setSelectedInstance(node.instanceId);
    addToast('success', `Đã chuyển "${node.title}" sang ${targetFrame.title}`);
    setFrameTransferConfirm(null);
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
          isPanning ? 'cursor-grabbing select-none' : 'cursor-grab active:cursor-grabbing'
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
                  addToast('info', `Đã chọn ${dh.title} để chỉnh sửa.`);
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
                  • {dh.frameCount} phân đoạn ({dh.nodeCount} nhiệm vụ)
                </text>
                {/* Status badge at right */}
                {dh.isActive ? (
                  <g transform={`translate(${Math.max(dh.x + 380, dh.x + dh.width - 150)}, ${dh.y + 8})`}>
                    <rect x={0} y={0} width={138} height={20} rx={10} fill="#3B82F6" fillOpacity={isDark ? 0.3 : 0.12} />
                    <text x={69} y={14} textAnchor="middle" fill="#2563EB" fontSize={10} fontWeight={700}>
                      ● Đang chọn chỉnh sửa
                    </text>
                  </g>
                ) : (
                  <g transform={`translate(${Math.max(dh.x + 380, dh.x + dh.width - 150)}, ${dh.y + 8})`}>
                    <rect x={0} y={0} width={138} height={20} rx={10} fill={isDark ? '#1E293B' : '#E2E8F0'} />
                    <text x={69} y={14} textAnchor="middle" fill={isDark ? '#94A3B8' : '#64748B'} fontSize={10} fontWeight={500}>
                      Bấm để chọn sửa
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
          />

          {/* Layer 2: Frame Overlays */}
          <FrameOverlayRenderer
            frames={layout.frames}
            selectedFrameId={selection.selectedFrameId}
          />

          {/* Layer 3: Edges (Interactive & Smart Anti-overlapping) */}
          <g>
            {layout.edges.map((edge) => {
              const isDragged = routeDrag?.edge.routeKey === edge.routeKey;
              const displayEdge = isDragged
                ? { ...edge, points: routeDrag.previewPoints, pathD: pointsToPath(routeDrag.previewPoints) }
                : edge;
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
                    setEditingEdge(edge);
                  }}
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
                  <span className="font-semibold text-amber-600 dark:text-amber-400">Đang uốn luồng:</span>
                  <span>Chọn 1 trong 4 cạnh Node để đổi điểm chạm • Kéo ô vàng để uốn</span>
                </div>

                <div className="w-px h-4 bg-gray-200 dark:bg-slate-700" />

                <button
                  type="button"
                  className="font-semibold text-amber-500 hover:text-amber-600 dark:hover:text-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-xs transition-colors"
                  disabled={!routeEditEdge.isManualRoute}
                  onClick={() => {
                    setEdgeRoute(routeEditEdge.routeKey, null);
                    addToast('info', 'Đã trả luồng về tự động định tuyến.');
                  }}
                  title="Xóa đường vẽ tay, đưa về tự động"
                >
                  Tự động lại
                </button>

                <button
                  type="button"
                  className="flex items-center gap-1 font-bold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 px-2.5 py-1 rounded-md text-xs shadow-xs transition-colors"
                  onClick={() => setRouteEditKey(null)}
                  title="Hoàn tất chỉnh sửa đường đi (Phím tắt: Enter hoặc Esc)"
                >
                  <Check size={13} />
                  <span>Xong (Enter)</span>
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
                  addToast('info', `Đã đặt lại ${manualRouteCount} đường thủ công về tự động.`);
                }}
              >
                Đặt lại {manualRouteCount} đường thủ công
              </button>
            )}
          </div>
        )}

        {/* Quick status pill at bottom left */}
        <div className="absolute bottom-3 left-4 pointer-events-none select-none">
          <div className={`backdrop-blur-xs border rounded-lg px-2.5 py-1 shadow-xs text-[11px] flex items-center gap-2 ${
            isDark ? 'bg-slate-900/90 border-slate-800 text-slate-400' : 'bg-white/90 border-gray-200/90 text-gray-500'
          }`}>
            <span><strong>{schema.roles.length}</strong> Làn</span>
            <span>•</span>
            <span><strong>{schema.frames.length}</strong> Phân đoạn</span>
            <span>•</span>
            <span><strong>{layout.nodes.length}</strong> Nhiệm vụ</span>
            {selection.selectedInstanceIds.length > 0 && (
              <>
                <span>•</span>
                <span className="font-semibold text-blue-500">Đã chọn {selection.selectedInstanceIds.length}</span>
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
        fromNodeTitle={fromNode?.title || 'Node nguồn'}
        toNodeTitle={toNode?.title || 'Node đích'}
        onSave={handleSaveEdge}
        onEditRoute={() => {
          if (editingEdge) setRouteEditKey(editingEdge.routeKey);
        }}
        onResetRoute={() => {
          if (editingEdge) {
            setEdgeRoute(editingEdge.routeKey, null);
            addToast('info', 'Đã trả luồng về tự động định tuyến.');
          }
        }}
      />

      {/* Frame Transfer Confirmation Dialog */}
      {frameTransferConfirm && (
        <ConfirmDialog
          isOpen={true}
          title="Chuyển Phân Đoạn (Frame Transfer)"
          message={`Bạn đã kéo nhiệm vụ "${frameTransferConfirm.node.title}" sang phân đoạn "${frameTransferConfirm.targetFrame.title}". Bạn có muốn chuyển nhiệm vụ này sang phân đoạn mới không?`}
          confirmLabel="Chuyển phân đoạn"
          cancelLabel="Giữ nguyên"
          variant="primary"
          onConfirm={handleConfirmFrameTransfer}
          onCancel={() => setFrameTransferConfirm(null)}
        />
      )}
    </div>
  );
};
