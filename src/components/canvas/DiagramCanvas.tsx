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
import { EdgeRouteHandles, STRAIGHT_EDGE_HANDLE } from './EdgeRouteHandles';
import { Point, buildManualPoints, extractWaypoints, pointsToPath } from '../../services/EdgeRouter';
import { CanvasSubToolbar } from './CanvasSubToolbar';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useGlobalKeybindings } from '../../hooks/useGlobalKeybindings';
import { CANVAS_DEFAULTS } from '../../utils/constants';

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
    updateEdge,
    setEdgeRoute,
    clearAllEdgeRoutes,
  } = useProjectStore();

  const {
    interactionMode,
    zoom,
    panX,
    panY,
    selection,
    setZoom,
    setPan,
    toggleSelectInstance,
    setSelectedInstance,
    setSelectedInstances,
    setSelectedFrame,
    setHighlightedPath,
    clearSelection,
    addToast,
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
    segmentIndex: number;
    basePoints: Point[];
    startClientX: number;
    startClientY: number;
    rawPoints: Point[];
    previewPoints: Point[];
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
    return LayoutEngine.calculate(schema);
  }, [schema]);

  const allInstanceIds = useMemo(() => {
    return layout.nodes.map((n) => n.instanceId);
  }, [layout.nodes]);

  // Dark mode resolution
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  // Handle Pan via canvas background mouse drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 && e.button !== 1) return;
    if (interactionMode === 'pan' || e.button === 1 || e.altKey) {
      setIsPanning(true);
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        startPanX: panX,
        startPanY: panY,
      };
    } else {
      clearSelection();
      lastAnchorIdRef.current = null;
    }
  };

  // High performance Drag tracking with requestAnimationFrame
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (routeDrag) {
        const snapToGrid = (v: number) => Math.round(v / 10) * 10;
        const { basePoints, segmentIndex } = routeDrag;
        const raw = basePoints.map((p) => ({ ...p }));
        const a = raw[segmentIndex];
        const b = raw[segmentIndex + 1];
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
        const normalized =
          waypoints.length > 0 ? buildManualPoints(raw[0], raw[raw.length - 1], waypoints) : null;
        setRouteDrag((prev) =>
          prev ? { ...prev, rawPoints: raw, previewPoints: normalized || raw, moved: true } : null
        );
        return;
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

            if (isSpecial && layout.swimlanes.length > 0) {
              // Magnet: follow the lane under the cursor (nearest one when outside) and sit centered in it.
              const centerNodeY = nodeStartY + dy + node.height / 2;
              const targetLane =
                layout.swimlanes.find(
                  (lane) => centerNodeY >= lane.y && centerNodeY <= lane.y + lane.height
                ) ||
                layout.swimlanes.reduce((nearest, lane) => {
                  const distance = (l: typeof lane) =>
                    Math.min(Math.abs(centerNodeY - l.y), Math.abs(centerNodeY - (l.y + l.height)));
                  return distance(lane) < distance(nearest) ? lane : nearest;
                });
              newY = targetLane.y + (targetLane.height - node.height) / 2;
              assignedRoleId = targetLane.roleId;
            } else {
              const lane = layout.swimlanes.find((l) => l.roleId === node.roleId);
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
        setPan(panStartRef.current.startPanX + dx, panStartRef.current.startPanY + dy);
      }
    },
    [isPanning, multiDragState, routeDrag, zoom, setPan, layout.swimlanes]
  );

  const handleMouseUp = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    if (routeDrag) {
      if (routeDrag.moved) {
        const waypoints = extractWaypoints(routeDrag.rawPoints);
        setEdgeRoute(routeDrag.edge.routeKey, waypoints.length > 0 ? waypoints : null);
      }
      setRouteDrag(null);
      return;
    }

    if (multiDragState) {
      const primaryOffset = multiDragState.currentOffsets.get(multiDragState.primaryNode.instanceId);
      const primaryFinalX = primaryOffset ? primaryOffset.x : multiDragState.primaryNode.x;

      const targetFrame = layout.frames.find(
        (f) =>
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
      if (e.key === 'Escape') setRouteEditKey(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [routeEditKey]);

  const handleRouteHandleDown = (e: React.MouseEvent, edge: LayoutEdge, segmentIndex: number) => {
    e.stopPropagation();
    e.preventDefault();
    let basePoints = edge.points.map((p) => ({ ...p }));
    let index = segmentIndex;

    if (segmentIndex === STRAIGHT_EDGE_HANDLE) {
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
      segmentIndex: index,
      basePoints,
      startClientX: e.clientX,
      startClientY: e.clientY,
      rawPoints: basePoints,
      previewPoints: basePoints,
      moved: false,
    });
  };

  const routeEditEdge = routeEditKey ? layout.edges.find((ed) => ed.routeKey === routeEditKey) : null;
  const manualRouteCount = Object.keys(schema.edge_routes || {}).length;

  // Handle Zoom via mouse wheel
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.min(
      CANVAS_DEFAULTS.ZOOM_MAX,
      Math.max(CANVAS_DEFAULTS.ZOOM_MIN, zoom * zoomFactor)
    );
    setZoom(Number(newZoom.toFixed(2)));
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
  const handleNodeClick = (e: React.MouseEvent, instanceId: string, frameId: string) => {
    if (e.ctrlKey || e.metaKey) {
      // Toggle individual node
      toggleSelectInstance(instanceId, true);
      lastAnchorIdRef.current = instanceId;
    } else if (e.shiftKey && lastAnchorIdRef.current) {
      // Range selection along chart flow!
      const anchorIndex = layout.nodes.findIndex((n) => n.instanceId === lastAnchorIdRef.current);
      const targetIndex = layout.nodes.findIndex((n) => n.instanceId === instanceId);
      if (anchorIndex !== -1 && targetIndex !== -1) {
        const start = Math.min(anchorIndex, targetIndex);
        const end = Math.max(anchorIndex, targetIndex);
        const rangeIds = layout.nodes.slice(start, end + 1).map((n) => n.instanceId);
        setSelectedInstances(rangeIds);
        addToast('info', `Đã chọn ${rangeIds.length} nhiệm vụ theo luồng`);
      } else {
        toggleSelectInstance(instanceId, true);
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

  const handleSaveEdge = (updates: { message_label: string; flow_type: any; color?: string }) => {
    if (!editingEdge) return;
    const targetFrameId = editingEdge.frameId || schema.frames[0]?.frame_id;
    if (targetFrameId) {
      updateEdge(targetFrameId, editingEdge.fromInstanceId, editingEdge.toInstanceId, updates);
      addToast('success', 'Đã cập nhật thuộc tính luồng dữ liệu.');
    }
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
          interactionMode === 'pan' ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
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
          className="w-full h-full overflow-visible"
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

          {/* Layer 1: Swimlanes */}
          <SwimlaneRenderer swimlanes={layout.swimlanes} isDark={isDark} />

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
                  onClick={() => setEditingEdge(edge)}
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
                  onSelect={(e) => handleNodeClick(e, node.instanceId, node.frameId)}
                  onHoverStart={() => handleNodeHoverStart(node.instanceId)}
                  onHoverEnd={handleNodeHoverEnd}
                  onStartDrag={handleStartNodeDrag}
                  onUpdateLabel={(newLabel) =>
                    updateNodeInstance(node.frameId, node.instanceId, { custom_label: newLabel })
                  }
                />
              );
            })}
          </g>

          {/* Layer 5: Manual route handles for the edge being edited */}
          {routeEditEdge && (
            <EdgeRouteHandles
              points={routeDrag?.edge.routeKey === routeEditEdge.routeKey ? routeDrag.previewPoints : routeEditEdge.points}
              onHandleMouseDown={(e, segmentIndex) => handleRouteHandleDown(e, routeEditEdge, segmentIndex)}
            />
          )}
        </svg>

        {/* Manual route editing bar */}
        {(routeEditEdge || manualRouteCount > 0) && (
          <div
            className="absolute bottom-3 right-4 flex items-center gap-2"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {routeEditEdge ? (
              <div
                className={`border rounded-lg px-3 py-1.5 shadow-md text-[11px] flex items-center gap-3 ${
                  isDark ? 'bg-slate-900/95 border-amber-500/40 text-slate-200' : 'bg-white/95 border-amber-400 text-gray-700'
                }`}
              >
                <span>Kéo các ô vàng để dời đoạn đường (bám lưới 10px)</span>
                <button
                  type="button"
                  className="font-semibold text-amber-500 hover:text-amber-400 disabled:opacity-40 disabled:cursor-not-allowed"
                  disabled={!routeEditEdge.isManualRoute}
                  onClick={() => {
                    setEdgeRoute(routeEditEdge.routeKey, null);
                    addToast('info', 'Đã trả luồng về tự động định tuyến.');
                  }}
                >
                  Tự động lại
                </button>
                <button
                  type="button"
                  className="font-semibold text-blue-500 hover:text-blue-400"
                  onClick={() => setRouteEditKey(null)}
                >
                  Xong
                </button>
              </div>
            ) : (
              <button
                type="button"
                className={`border rounded-lg px-2.5 py-1 shadow-xs text-[11px] ${
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
