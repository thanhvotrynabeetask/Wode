import React from 'react';
import { Point } from '../../services/EdgeRouter';
import { BorderSide } from '../../types/schema';

/** Segment index used for the single handle shown on a perfectly straight edge. */
export const STRAIGHT_EDGE_HANDLE = -1;

export type EdgeHandleType = 'start' | 'end' | 'segment';

interface EdgeRouteHandlesProps {
  points: Point[];
  fromNode?: { x: number; y: number; width: number; height: number };
  toNode?: { x: number; y: number; width: number; height: number };
  activeHandleType?: EdgeHandleType | null;
  sourceSide?: BorderSide;
  targetSide?: BorderSide;
  onSelectSide?: (type: 'start' | 'end', side: BorderSide) => void;
  onHandleMouseDown: (
    e: React.MouseEvent,
    handleType: EdgeHandleType,
    segmentIndex: number
  ) => void;
}

const SIDE_LABELS: Record<BorderSide, string> = {
  top: 'Trên',
  right: 'Phải',
  bottom: 'Dưới',
  left: 'Trái',
};

function getNodeMidpoints(node: { x: number; y: number; width: number; height: number }): { side: BorderSide; x: number; y: number }[] {
  return [
    { side: 'top', x: Math.round(node.x + node.width / 2), y: Math.round(node.y) },
    { side: 'right', x: Math.round(node.x + node.width), y: Math.round(node.y + node.height / 2) },
    { side: 'bottom', x: Math.round(node.x + node.width / 2), y: Math.round(node.y + node.height) },
    { side: 'left', x: Math.round(node.x), y: Math.round(node.y + node.height / 2) },
  ];
}

/**
 * Interactive drag handles for editing an edge:
 * - 4 centered port snap points on each node border (Top, Right, Bottom, Left)
 * - 2 circular endpoint handles (Source & Target) that snap strictly to the 4 border centers
 * - Intermediate rectangular handles for bending orthogonal segments
 */
export const EdgeRouteHandles: React.FC<EdgeRouteHandlesProps> = ({
  points,
  fromNode,
  toNode,
  activeHandleType,
  sourceSide = 'right',
  targetSide = 'left',
  onSelectSide,
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

  const fromMidpoints = fromNode ? getNodeMidpoints(fromNode) : [];
  const toMidpoints = toNode ? getNodeMidpoints(toNode) : [];

  return (
    <g className="edge-route-handles select-none">
      {/* Visual Border Guide & 4 Port Anchors on fromNode (Source) */}
      {fromNode && (
        <g className="from-node-anchors">
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

          {fromMidpoints.map((pt) => {
            const isActive = pt.side === sourceSide;
            return (
              <g
                key={`from-anchor-${pt.side}`}
                transform={`translate(${pt.x}, ${pt.y})`}
                className="cursor-pointer group/anchor"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectSide?.('start', pt.side);
                }}
              >
                <circle r={12} fill="transparent" />
                {isActive ? (
                  <>
                    <circle r={7} fill="#3B82F6" opacity={0.3} className="animate-ping" />
                    <circle r={5} fill="#3B82F6" stroke="#FFFFFF" strokeWidth={1.5} />
                  </>
                ) : (
                  <circle
                    r={3.5}
                    fill="#FFFFFF"
                    stroke="#3B82F6"
                    strokeWidth={1.5}
                    className="group-hover/anchor:scale-150 group-hover/anchor:fill-blue-100 transition-transform"
                  />
                )}
                <title>{`Cạnh ${SIDE_LABELS[pt.side]}: Nhấp để chuyển đầu nguồn vào giữa cạnh này`}</title>
              </g>
            );
          })}
        </g>
      )}

      {/* Visual Border Guide & 4 Port Anchors on toNode (Target) */}
      {toNode && (
        <g className="to-node-anchors">
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

          {toMidpoints.map((pt) => {
            const isActive = pt.side === targetSide;
            return (
              <g
                key={`to-anchor-${pt.side}`}
                transform={`translate(${pt.x}, ${pt.y})`}
                className="cursor-pointer group/anchor"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectSide?.('end', pt.side);
                }}
              >
                <circle r={12} fill="transparent" />
                {isActive ? (
                  <>
                    <circle r={7} fill="#EF4444" opacity={0.3} className="animate-ping" />
                    <circle r={5} fill="#EF4444" stroke="#FFFFFF" strokeWidth={1.5} />
                  </>
                ) : (
                  <circle
                    r={3.5}
                    fill="#FFFFFF"
                    stroke="#EF4444"
                    strokeWidth={1.5}
                    className="group-hover/anchor:scale-150 group-hover/anchor:fill-red-100 transition-transform"
                  />
                )}
                <title>{`Cạnh ${SIDE_LABELS[pt.side]}: Nhấp để chuyển đầu đích vào giữa cạnh này`}</title>
              </g>
            );
          })}
        </g>
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
        <title>Điểm chạm nguồn: Kéo để đổi sang 1 trong 4 cạnh (ở giữa cạnh)</title>
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
        <title>Điểm chạm đích: Kéo để đổi sang 1 trong 4 cạnh (ở giữa cạnh)</title>
      </g>
    </g>
  );
};
