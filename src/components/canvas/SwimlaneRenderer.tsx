import React, { useRef } from 'react';
import { LayoutSwimlane } from '../../services/LayoutEngine';
import { useTranslation } from '../../i18n';

interface SwimlaneRendererProps {
  swimlanes: LayoutSwimlane[];
  isDark?: boolean;
  onUpdateLaneSize?: (roleId: string, height: number) => void;
  onSelectDiagram?: (diagramId: string) => void;
}

export const SwimlaneRenderer: React.FC<SwimlaneRendererProps> = ({
  swimlanes,
  isDark = false,
  onUpdateLaneSize,
  onSelectDiagram,
}) => {
  const resizeRef = useRef<{ startY: number; startH: number } | null>(null);
  const { t } = useTranslation();

  const handleLaneResizeStart = (e: React.MouseEvent, lane: LayoutSwimlane) => {
    e.stopPropagation();
    if (!onUpdateLaneSize) return;
    e.preventDefault();
    resizeRef.current = { startY: e.clientY, startH: lane.height };

    const move = (ev: MouseEvent) => {
      const ref = resizeRef.current;
      if (!ref) return;
      const newH = Math.max(120, Math.round(ref.startH + (ev.clientY - ref.startY)));
      onUpdateLaneSize(lane.roleId, newH);
    };
    const up = () => {
      resizeRef.current = null;
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  return (
    <g className="select-none">
      {swimlanes.map((lane, idx) => {
        if (lane.isEmptyPlaceholder) {
          return (
            <g
              key={lane.id || `${lane.diagramId || 'diag'}_empty`}
              className="cursor-pointer"
              onClick={() => {
                if (lane.diagramId && onSelectDiagram) {
                  onSelectDiagram(lane.diagramId);
                }
              }}
            >
              {/* Lane background row */}
              <rect
                x={0}
                y={lane.y}
                width={lane.width}
                height={lane.height}
                fill={isDark ? '#0F172A' : '#F8FAFC'}
                className="cursor-pointer"
              />

              {/* Lane bottom border line */}
              <line
                x1={0}
                y1={lane.y + lane.height}
                x2={lane.width}
                y2={lane.y + lane.height}
                stroke={isDark ? '#1E293B' : '#E2E8F0'}
                strokeWidth={1}
                strokeDasharray="4 4"
                className="pointer-events-none"
              />

              {/* Left Placeholder Card */}
              <rect
                x={10}
                y={lane.y + 12}
                width={180}
                height={lane.height - 24}
                rx={8}
                fill={isDark ? '#1E293B' : '#FFFFFF'}
                stroke={isDark ? '#334155' : '#CBD5E1'}
                strokeWidth={1.5}
                strokeDasharray="4 3"
              />
              <text
                x={100}
                y={lane.y + 12 + (lane.height - 24) / 2 - 6}
                textAnchor="middle"
                fill={isDark ? '#94A3B8' : '#64748B'}
                fontSize={11}
                fontWeight={700}
              >
                {t('canvas.noSwimlaneTitle')}
              </text>
              <text
                x={100}
                y={lane.y + 12 + (lane.height - 24) / 2 + 12}
                textAnchor="middle"
                fill={isDark ? '#64748B' : '#94A3B8'}
                fontSize={9}
              >
                {t('canvas.noSwimlaneSub')}
              </text>

              {/* Center Guidance text */}
              <text
                x={220}
                y={lane.y + lane.height / 2 + 4}
                fill={isDark ? '#94A3B8' : '#64748B'}
                fontSize={12}
                fontStyle="italic"
              >
                {t('canvas.noSwimlaneDesc')}
              </text>
            </g>
          );
        }

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

        // Card dimensions
        const CARD_LEFT = 10;
        const CARD_TOP = 12;
        const CARD_WIDTH = 180; // increased from 140
        const CARD_HEIGHT = lane.height - 24;
        const CARD_TEXT_LEFT = CARD_LEFT + 26; // 10 + 6 (color strip) + 10 padding

        // Wrap text if too long — increased max chars per line
        const maxCharsPerLine = 24;
        const roleName = lane.roleName;
        const lines: string[] = [];
        if (roleName.length > maxCharsPerLine) {
          // Split at word boundary
          let lastSpaceIdx = roleName.lastIndexOf(' ', maxCharsPerLine);
          if (lastSpaceIdx === -1 || lastSpaceIdx < maxCharsPerLine - 8) {
            lastSpaceIdx = maxCharsPerLine;
          }
          lines.push(roleName.slice(0, lastSpaceIdx));
          lines.push(roleName.slice(lastSpaceIdx + 1));
        } else {
          lines.push(roleName);
        }

        // Center text vertically within the card
        const cardCenterY = lane.y + CARD_TOP + CARD_HEIGHT / 2;
        const lineHeight = 14;
        const totalTextHeight = lines.length * lineHeight;
        const firstLineY = cardCenterY - totalTextHeight / 2 + lineHeight / 2;

        return (
          <g key={lane.id || `${lane.diagramId || 'diag'}_${lane.roleId}_${idx}`}>
            {/* Lane background row */}
            <rect
              x={0}
              y={lane.y}
              width={lane.width}
              height={lane.height}
              fill={bgFill}
              className="cursor-grab active:cursor-grabbing"
            />

            {/* Lane bottom border line */}
            <line
              x1={0}
              y1={lane.y + lane.height}
              x2={lane.width}
              y2={lane.y + lane.height}
              stroke={borderColor}
              strokeWidth={1}
              className="pointer-events-none"
            />

            {/* Left Swimlane Role Card */}
            <rect
              x={CARD_LEFT}
              y={lane.y + CARD_TOP}
              width={CARD_WIDTH}
              height={CARD_HEIGHT}
              rx={8}
              fill={cardBg}
              stroke={cardBorder}
              strokeWidth={1.5}
              filter={isDark ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' : 'drop-shadow(0 1px 3px rgba(0,0,0,0.05))'}
              className="cursor-grab active:cursor-grabbing"
            />

            {/* Role Color left strip on card */}
            <rect
              x={CARD_LEFT}
              y={lane.y + CARD_TOP}
              width={6}
              height={CARD_HEIGHT}
              rx={3}
              fill={lane.color}
              className="pointer-events-none"
            />

            {/* Role Name - wrapped text, centered in card */}
            <g className="pointer-events-none">
              {lines.map((line, lineIdx) => (
                <text
                  key={lineIdx}
                  x={CARD_TEXT_LEFT}
                  y={firstLineY + lineIdx * lineHeight}
                  fontSize={11}
                  fontWeight={700}
                  fill={textFill}
                  className="font-sans"
                  style={{ textAnchor: 'start' }}
                >
                  {line}
                </text>
              ))}
            </g>

            {/* Tooltip title for full name on hover */}
            <title>{roleName}</title>

            {/* Lane Resize Handle (bottom-right) */}
            {onUpdateLaneSize && (
              <rect
                x={lane.width - 10}
                y={lane.y + lane.height - 10}
                width={10}
                height={10}
                fill="transparent"
                style={{ cursor: 'ns-resize' }}
                onMouseDown={(e) => handleLaneResizeStart(e, lane)}
              />
            )}
          </g>
        );
      })}
    </g>
  );
};
