import React from 'react';
import { LayoutEdge } from '../../services/LayoutEngine';

interface EdgeRendererProps {
  edge: LayoutEdge;
  isHighlighted: boolean;
  isDark?: boolean;
  enableDarkGlow?: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
  onLabelMouseDown?: (e: React.MouseEvent, edge: LayoutEdge) => void;
  overrideLabelX?: number;
  overrideLabelY?: number;
}

export const EdgeRenderer: React.FC<EdgeRendererProps> = ({
  edge,
  isHighlighted,
  isDark = false,
  enableDarkGlow = true,
  onClick,
  onDoubleClick,
  onLabelMouseDown,
  overrideLabelX,
  overrideLabelY,
}) => {
  const defaultStrokeColor = edge.isMacro
    ? isDark
      ? '#818CF8'
      : '#6366F1'
    : isDark
    ? '#94A3B8'
    : '#64748B';

  const strokeColor = isHighlighted ? '#F59E0B' : edge.color || defaultStrokeColor;

  const strokeWidth = isHighlighted ? 2.5 : edge.isMacro ? 2.25 : 1.75;
  const markerId = isHighlighted
    ? 'arrow-highlight'
    : edge.isMacro
    ? 'arrow-macro'
    : 'arrow-normal';

  let dashArray: string | undefined = undefined;
  if (edge.flowType === 'dashed') {
    dashArray = '6 4';
  } else if (edge.flowType === 'dotted') {
    dashArray = '2 3';
  }

  const glowFilter = isDark && enableDarkGlow ? `drop-shadow(0 0 3px ${strokeColor}99)` : undefined;

  const currentLabelX = overrideLabelX !== undefined ? overrideLabelX : edge.labelX;
  const currentLabelY = overrideLabelY !== undefined ? overrideLabelY : edge.labelY;

  return (
    <g
      className="select-none cursor-pointer group"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick();
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (onDoubleClick) onDoubleClick();
      }}
    >
      <title>Nhấp đúp để chỉnh sửa đường nối</title>
      {/* Invisible wider stroke for easy click interaction */}
      <path
        d={edge.pathD}
        fill="none"
        stroke="transparent"
        strokeWidth={14}
        className="cursor-pointer"
      />

      {/* Glow path if highlighted */}
      {isHighlighted && (
        <path
          d={edge.pathD}
          fill="none"
          stroke={isDark ? '#D97706' : '#FDE68A'}
          strokeWidth={6}
          strokeLinecap="round"
          opacity={0.8}
        />
      )}

      {/* Main connection curve */}
      <path
        d={edge.pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={dashArray}
        markerEnd={`url(#${markerId})`}
        strokeLinecap="round"
        filter={glowFilter}
        className="group-hover:stroke-blue-400 transition-colors"
      />

      {/* Edge message label pill - Draggable / Double-click to Edit */}
      {edge.label && (
        <g
          transform={`translate(${currentLabelX}, ${currentLabelY})`}
          className="cursor-grab active:cursor-grabbing group/label"
          onMouseDown={(e) => {
            e.stopPropagation();
            if (onLabelMouseDown) {
              onLabelMouseDown(e, edge);
            }
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (onClick) onClick();
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            if (onDoubleClick) onDoubleClick();
          }}
        >
          <rect
            x={-edge.label.length * 3.5 - 8}
            y={-10}
            width={edge.label.length * 7 + 16}
            height={20}
            rx={10}
            fill={isDark ? '#1E293B' : '#FFFFFF'}
            stroke={strokeColor}
            strokeWidth={edge.labelCustom ? 2 : 1.25}
            strokeDasharray={edge.labelCustom ? '3 2' : undefined}
            filter={isDark ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' : 'drop-shadow(0 1px 2px rgba(0,0,0,0.08))'}
            className="group-hover/label:stroke-blue-500 transition-colors"
          />
          <text
            x={0}
            y={4}
            textAnchor="middle"
            fontSize={10}
            fontWeight={600}
            fill={isDark ? '#F1F5F9' : '#334155'}
            className="font-sans pointer-events-none"
          >
            {edge.label}
          </text>
          <title>Kéo để di chuyển vị trí / Nhấp đúp để chỉnh sửa</title>
        </g>
      )}
    </g>
  );
};
