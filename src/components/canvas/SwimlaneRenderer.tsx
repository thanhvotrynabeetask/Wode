import React from 'react';
import { LayoutSwimlane } from '../../services/LayoutEngine';

interface SwimlaneRendererProps {
  swimlanes: LayoutSwimlane[];
  isDark?: boolean;
}

export const SwimlaneRenderer: React.FC<SwimlaneRendererProps> = ({ swimlanes, isDark = false }) => {
  return (
    <g className="select-none">
      {swimlanes.map((lane, idx) => {
        const isEven = idx % 2 === 0;

        const bgFill = isDark
          ? isEven
            ? '#0F172A'
            : '#131D31'
          : isEven
          ? '#FFFFFF'
          : '#F8FAFC';

        const borderColor = isDark ? '#1E293B' : '#E2E8F0';
        const cardBg = isDark ? '#1E293B' : '#FFFFFF';
        const cardBorder = isDark ? '#334155' : '#E2E8F0';
        const textFill = isDark ? '#F1F5F9' : '#334155';

        return (
          <g key={lane.roleId}>
            {/* Lane background row */}
            <rect
              x={0}
              y={lane.y}
              width={lane.width}
              height={lane.height}
              fill={bgFill}
            />

            {/* Lane bottom border line */}
            <line
              x1={0}
              y1={lane.y + lane.height}
              x2={lane.width}
              y2={lane.y + lane.height}
              stroke={borderColor}
              strokeWidth={1}
            />

            {/* Left Swimlane Role Card */}
            <rect
              x={10}
              y={lane.y + 12}
              width={140}
              height={lane.height - 24}
              rx={8}
              fill={cardBg}
              stroke={cardBorder}
              strokeWidth={1.5}
              filter={isDark ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' : 'drop-shadow(0 1px 3px rgba(0,0,0,0.05))'}
            />

            {/* Role Color left strip on card */}
            <rect
              x={10}
              y={lane.y + 12}
              width={6}
              height={lane.height - 24}
              rx={3}
              fill={lane.color}
            />

            {/* Role Name */}
            <text
              x={26}
              y={lane.y + lane.height / 2 + 4}
              fontSize={12}
              fontWeight={700}
              fill={textFill}
              className="font-sans"
            >
              {lane.roleName.length > 13 ? lane.roleName.slice(0, 12) + '...' : lane.roleName}
            </text>
          </g>
        );
      })}
    </g>
  );
};
