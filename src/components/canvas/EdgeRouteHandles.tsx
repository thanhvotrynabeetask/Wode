import React from 'react';
import { Point } from '../../services/EdgeRouter';

/** Segment index used for the single handle shown on a perfectly straight edge. */
export const STRAIGHT_EDGE_HANDLE = -1;

interface EdgeRouteHandlesProps {
  points: Point[];
  onHandleMouseDown: (e: React.MouseEvent, segmentIndex: number) => void;
}

/**
 * Drag handles for hand-editing an orthogonal route. Segments touching a node port are fixed
 * so arrows always enter and leave a node horizontally; every segment in between can slide.
 */
export const EdgeRouteHandles: React.FC<EdgeRouteHandlesProps> = ({ points, onHandleMouseDown }) => {
  const handles: { index: number; x: number; y: number; horizontal: boolean }[] = [];

  if (points.length === 2) {
    handles.push({
      index: STRAIGHT_EDGE_HANDLE,
      x: (points[0].x + points[1].x) / 2,
      y: points[0].y,
      horizontal: true,
    });
  } else {
    for (let j = 1; j <= points.length - 3; j++) {
      const a = points[j];
      const b = points[j + 1];
      const horizontal = Math.abs(a.y - b.y) < 0.01;
      handles.push({ index: j, x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, horizontal });
    }
  }

  return (
    <g>
      {handles.map((h) => (
        <g
          key={h.index}
          transform={`translate(${h.x}, ${h.y})`}
          style={{ cursor: h.horizontal ? 'ns-resize' : 'ew-resize' }}
          onMouseDown={(e) => onHandleMouseDown(e, h.index)}
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
          />
        </g>
      ))}
    </g>
  );
};
