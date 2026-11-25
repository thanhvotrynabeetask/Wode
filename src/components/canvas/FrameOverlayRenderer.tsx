import React from 'react';
import { LayoutFrameOverlay } from '../../services/LayoutEngine';

interface FrameOverlayRendererProps {
  frames: LayoutFrameOverlay[];
  selectedFrameId: string | null;
  onSelectFrame?: (frameId: string) => void;
  onResizeFrameStart?: (e: React.MouseEvent, frameId: string, currentWidth: number) => void;
}

export const FrameOverlayRenderer: React.FC<FrameOverlayRendererProps> = ({
  frames,
  selectedFrameId,
  onSelectFrame,
  onResizeFrameStart,
}) => {
  return (
    <g className="select-none">
      {frames.map((frame) => {
        const isSelected = selectedFrameId === frame.frameId;
        const rightEdgeX = frame.x + frame.width;
        const midY = frame.y + frame.height / 2;

        return (
          <g key={frame.frameId} className="group/frame">
            {/* Frame boundary stroke (pointer-events: stroke so clicking/hovering border works without blocking inner nodes) */}
            <rect
              x={frame.x}
              y={frame.y}
              width={frame.width}
              height={frame.height}
              rx={12}
              fill={isSelected ? '#3B82F6' : '#64748B'}
              fillOpacity={isSelected ? 0.05 : 0.015}
              stroke={isSelected ? '#3B82F6' : '#94A3B8'}
              strokeWidth={isSelected ? 2 : 1}
              strokeDasharray="6 4"
              pointerEvents="stroke"
              className="cursor-pointer transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onSelectFrame?.(frame.frameId);
              }}
            />

            {/* Invisible right-edge hover strip to easily detect hovering near the resize handle */}
            <rect
              x={rightEdgeX - 12}
              y={frame.y}
              width={24}
              height={frame.height}
              fill="transparent"
              className="pointer-events-auto cursor-ew-resize"
              onClick={(e) => {
                e.stopPropagation();
                onSelectFrame?.(frame.frameId);
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                onResizeFrameStart?.(e, frame.frameId, frame.width);
              }}
            />

            {/* Frame Header Top Pill (Clickable to select frame) */}
            <g
              transform={`translate(${frame.x + 12}, ${frame.y - 12})`}
              className="pointer-events-auto cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onSelectFrame?.(frame.frameId);
              }}
            >
              <rect
                x={0}
                y={0}
                width={Math.max(90, frame.title.length * 7 + 36)}
                height={24}
                rx={12}
                fill={isSelected ? '#2563EB' : '#475569'}
                filter="drop-shadow(0 1px 2px rgba(0,0,0,0.1))"
                className="hover:fill-blue-600 transition-colors"
              />
              <text
                x={10}
                y={16}
                fontSize={11}
                fontWeight={700}
                fill="#FFFFFF"
                className="font-sans"
              >
                #{frame.order} {frame.title}
              </text>
            </g>

            {/* Interactive Right-Edge Horizontal Resize Handle (Hidden by default, shown on hover or when frame is selected) */}
            <g
              transform={`translate(${rightEdgeX}, ${midY})`}
              className={`pointer-events-auto cursor-ew-resize group/handle transition-opacity duration-200 ${
                isSelected ? 'opacity-100' : 'opacity-0 group-hover/frame:opacity-100'
              }`}
              onMouseDown={(e) => {
                e.stopPropagation();
                onResizeFrameStart?.(e, frame.frameId, frame.width);
              }}
            >
              {/* Invisible wider hit area for easy grabbing */}
              <rect
                x={-12}
                y={-30}
                width={24}
                height={60}
                fill="transparent"
              />

              {/* Visual handle pill */}
              <rect
                x={-4}
                y={-20}
                width={8}
                height={40}
                rx={4}
                fill={isSelected ? '#2563EB' : '#94A3B8'}
                stroke="#FFFFFF"
                strokeWidth={1.5}
                className="group-hover/handle:scale-125 group-hover/handle:fill-blue-500 transition-all shadow-sm"
              />

              {/* 3 dots indicator inside handle */}
              <circle cx={0} cy={-8} r={1.2} fill="#FFFFFF" />
              <circle cx={0} cy={0} r={1.2} fill="#FFFFFF" />
              <circle cx={0} cy={8} r={1.2} fill="#FFFFFF" />

              <title>Kéo ngang để chỉnh độ rộng Frame / Drag horizontally to resize frame</title>
            </g>
          </g>
        );
      })}
    </g>
  );
};
