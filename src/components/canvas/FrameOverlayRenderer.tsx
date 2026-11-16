import React from 'react';
import { LayoutFrameOverlay } from '../../services/LayoutEngine';

interface FrameOverlayRendererProps {
  frames: LayoutFrameOverlay[];
  selectedFrameId: string | null;
}

export const FrameOverlayRenderer: React.FC<FrameOverlayRendererProps> = ({
  frames,
  selectedFrameId,
}) => {
  return (
    <g className="select-none pointer-events-none">
      {frames.map((frame) => {
        const isSelected = selectedFrameId === frame.frameId;
        return (
          <g key={frame.frameId}>
            {/* Frame boundary box */}
            <rect
              x={frame.x}
              y={frame.y}
              width={frame.width}
              height={frame.height}
              rx={12}
              fill={isSelected ? '#3B82F6' : '#64748B'}
              fillOpacity={isSelected ? 0.04 : 0.015}
              stroke={isSelected ? '#3B82F6' : '#94A3B8'}
              strokeWidth={isSelected ? 1.75 : 1}
              strokeDasharray="6 4"
            />

            {/* Frame Header Top Pill */}
            <g transform={`translate(${frame.x + 12}, ${frame.y - 12})`}>
              <rect
                x={0}
                y={0}
                width={Math.max(90, frame.title.length * 7 + 36)}
                height={24}
                rx={12}
                fill={isSelected ? '#2563EB' : '#475569'}
                filter="drop-shadow(0 1px 2px rgba(0,0,0,0.1))"
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
          </g>
        );
      })}
    </g>
  );
};
