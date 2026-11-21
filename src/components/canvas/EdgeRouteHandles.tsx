import React from 'react';
import { Point } from '../../services/EdgeRouter';

/** Segment index used for the single handle shown on a perfectly straight edge. */
export const STRAIGHT_EDGE_HANDLE = -1;

export type EdgeHandleType = 'start' | 'end' | 'segment';

interface EdgeRouteHandlesProps {
  points: Point[];
  fromNode?: { x: number; y: number; width: number; height: number };
  toNode?: { x: number; y: number; width: number; height: number };
  activeHandleType?: EdgeHandleType | null;
  onHandleMouseDown: (
    e: React.MouseEvent,
    handleType: EdgeHandleType,
    segmentIndex: number
  ) => void;
}

/**
 * Interactive drag handles for editing an edge:
 * - 2 circular endpoint handles (Source & Target) that slide along the node borderline
 * - Intermediate rectangular handles for bending orthogonal segments
 */
export const EdgeRouteHandles: React.FC<EdgeRouteHandlesProps> = ({
  points,
  fromNode,
  toNode,
  activeHandleType,
  onHandleMouseDown,
}) => {
  if (points.length < 2) return null;

  const startPoint = points[0];
  const endPoint = points[points.length - 1];

  const bodyHandles: { index: number; x: number; y: number; horizontal: boolean }[] = [];

  if (points.length === 2) {
    bodyHandles.push({
      index: STRAIGHT_EDGE_HANDLE,
      x: (points[0].x + points[1].x) / 2,
      y: (points[0].y + points[1].y) / 2,
      horizontal: Math.abs(points[0].y - points[1].y) < 0.01,
    });
  } else {
    for (let j = 1; j <= points.length - 3; j++) {
      const a = points[j];
      const b = points[j + 1];
      const horizontal = Math.abs(a.y - b.y) < 0.01;
      bodyHandles.push({ index: j, x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, horizontal });
    }
  }

  return (
    <g className="edge-route-handles select-none">
      {/* Visual Border Guide: subtle outline around fromNode when editing/dragging */}
      {fromNode && (
        <rect
          x={fromNode.x - 2}
          y={fromNode.y - 2}
          width={fromNode.width + 4}
          height={fromNode.height + 4}
          rx={10}
          fill="none"
          stroke="#3B82F6"
          strokeWidth={1.5}
          strokeDasharray="4 3"
          opacity={activeHandleType === 'start' ? 0.9 : 0.4}
          className="pointer-events-none transition-opacity"
        />
      )}

      {/* Visual Border Guide: subtle outline around toNode when editing/dragging */}
      {toNode && (
        <rect
          x={toNode.x - 2}
          y={toNode.y - 2}
          width={toNode.width + 4}
          height={toNode.height + 4}
          rx={10}
          fill="none"
          stroke="#EF4444"
          strokeWidth={1.5}
          strokeDasharray="4 3"
          opacity={activeHandleType === 'end' ? 0.9 : 0.4}
          className="pointer-events-none transition-opacity"
        />
      )}

      {/* Body Segment Handles */}
      {bodyHandles.map((h) => (
        <g
          key={`segment-${h.index}`}
          transform={`translate(${h.x}, ${h.y})`}
          style={{ cursor: h.horizontal ? 'ns-resize' : 'ew-resize' }}
          onMouseDown={(e) => onHandleMouseDown(e, 'segment', h.index)}
        >
          <rect x={-12} y={-12} width={24} height={24} fill="transparent" />
          <rect
            x={-6}
            y={-6}
            width={12}
            height={12}
            rx={3}
            fill="#F59E0B"
            stroke="#FFFFFF"
            strokeWidth={1.5}
            className="hover:scale-125 transition-transform"
          />
        </g>
      ))}

      {/* Source Endpoint Handle (Điểm chạm đầu nguồn trên viền Node A) */}
      <g
        transform={`translate(${startPoint.x}, ${startPoint.y})`}
        style={{ cursor: 'crosshair' }}
        onMouseDown={(e) => onHandleMouseDown(e, 'start', 0)}
        className="group"
      >
        <circle r={14} fill="transparent" />
        <circle
          r={10}
          fill="#3B82F6"
          opacity={activeHandleType === 'start' ? 0.4 : 0.15}
          className="group-hover:opacity-40 transition-opacity"
        />
        <circle
          r={6.5}
          fill="#3B82F6"
          stroke="#FFFFFF"
          strokeWidth={2}
          className="group-hover:scale-110 transition-transform shadow-md"
        />
        <circle r={2} fill="#FFFFFF" />
        <title>Điểm chạm nguồn: Kéo để trượt trên viền Node nguồn</title>
      </g>

      {/* Target Endpoint Handle (Điểm chạm đầu đích trên viền Node B) */}
      <g
        transform={`translate(${endPoint.x}, ${endPoint.y})`}
        style={{ cursor: 'crosshair' }}
        onMouseDown={(e) => onHandleMouseDown(e, 'end', points.length - 1)}
        className="group"
      >
        <circle r={14} fill="transparent" />
        <circle
          r={10}
          fill="#EF4444"
          opacity={activeHandleType === 'end' ? 0.4 : 0.15}
          className="group-hover:opacity-40 transition-opacity"
        />
        <circle
          r={6.5}
          fill="#EF4444"
          stroke="#FFFFFF"
          strokeWidth={2}
          className="group-hover:scale-110 transition-transform shadow-md"
        />
        <circle r={2} fill="#FFFFFF" />
        <title>Điểm chạm đích: Kéo để trượt trên viền Node đích</title>
      </g>
    </g>
  );
};
