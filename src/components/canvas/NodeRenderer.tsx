import React, { useState } from 'react';
import { LayoutNode } from '../../services/LayoutEngine';
import { CornerSymbolIcon } from '../common/CornerSymbolIcon';
import { Database, Check, X } from 'lucide-react';

interface NodeRendererProps {
  node: LayoutNode;
  isSelected: boolean;
  isHighlighted: boolean;
  isDark?: boolean;
  enableDarkGlow?: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  onStartDrag: (e: React.MouseEvent, node: LayoutNode) => void;
  onUpdateLabel?: (newLabel: string) => void;
}

export const NodeRenderer: React.FC<NodeRendererProps> = ({
  node,
  isSelected,
  isHighlighted,
  isDark = false,
  enableDarkGlow = true,
  onSelect,
  onHoverStart,
  onHoverEnd,
  onStartDrag,
  onUpdateLabel,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(node.customLabel || '');

  const isStorage = node.nodeKind === 'storage';

  const handleSaveEdit = () => {
    if (onUpdateLabel) {
      onUpdateLabel(editText.trim());
    }
    setIsEditing(false);
  };

  // Dark mode styling and luminous glow (Requirement 3)
  const nodeBg = isDark
    ? isStorage
      ? '#082F49'
      : '#1E293B'
    : isStorage
    ? '#F0F9FF'
    : '#FFFFFF';

  const nodeBorder = isDark
    ? isSelected
      ? '#3B82F6'
      : isStorage
      ? '#0284C7'
      : '#334155'
    : isSelected
    ? '#3B82F6'
    : isStorage
    ? '#0284C7'
    : '#CBD5E1';

  let glowFilter: string | undefined = undefined;
  if (isDark && enableDarkGlow) {
    if (isStorage) {
      glowFilter = 'drop-shadow(0 0 8px rgba(14, 165, 233, 0.45))';
    } else {
      glowFilter = `drop-shadow(0 0 6px ${node.color}55)`;
    }
  } else if (!isDark) {
    glowFilter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.06))';
  }

  return (
    <g
      transform={`translate(${node.x}, ${node.y})`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(e);
      }}
      onMouseDown={(e) => {
        if (e.button === 0 && !isEditing) {
          onStartDrag(e, node);
        }
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
        setEditText(node.customLabel || '');
      }}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      className="cursor-move select-none group"
    >
      {/* Selection Glow Indicator */}
      {(isSelected || isHighlighted) && (
        <rect
          x={-4}
          y={-4}
          width={node.width + 8}
          height={node.height + 8}
          rx={isStorage ? 14 : 12}
          fill="none"
          stroke={isSelected ? '#3B82F6' : '#F59E0B'}
          strokeWidth={isSelected ? 2.5 : 2}
          strokeDasharray={isSelected ? undefined : '5 3'}
        />
      )}

      {/* Main Node Card Body */}
      {isStorage ? (
        <g>
          <rect
            x={0}
            y={0}
            width={node.width}
            height={node.height}
            rx={10}
            fill={nodeBg}
            stroke={nodeBorder}
            strokeWidth={2}
            filter={glowFilter}
          />
          <path
            d={`M 0 10 Q ${node.width / 2} 18 ${node.width} 10 L ${node.width} 0 Q ${node.width / 2} -4 0 0 Z`}
            fill={isDark ? '#0C4A6E' : '#E0F2FE'}
          />
        </g>
      ) : (
        <g>
          <rect
            x={0}
            y={0}
            width={node.width}
            height={node.height}
            rx={8}
            fill={nodeBg}
            stroke={nodeBorder}
            strokeWidth={1.5}
            filter={glowFilter}
            className="group-hover:stroke-gray-400 transition-colors"
          />
          <rect
            x={0}
            y={0}
            width={5}
            height={node.height}
            rx={2}
            fill={node.color}
          />
        </g>
      )}

      {/* Content Layer (Heading on Top, Note Below) */}
      <foreignObject x={8} y={4} width={node.width - 16} height={node.height - 8}>
        <div className="w-full h-full flex flex-col justify-between text-left pointer-events-none select-none">
          {/* Top Line: Heading */}
          <div className="flex items-center justify-between gap-1 w-full shrink-0">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              {isStorage ? (
                <div className="w-4 h-4 rounded-full bg-sky-600 text-white flex items-center justify-center shrink-0">
                  <Database size={10} />
                </div>
              ) : null}

              <span
                className={`font-bold text-xs truncate leading-tight ${
                  isDark
                    ? isStorage
                      ? 'text-sky-300'
                      : 'text-slate-100'
                    : isStorage
                    ? 'text-sky-900'
                    : 'text-slate-900'
                }`}
                title={node.title}
              >
                {node.title}
              </span>
            </div>

            {!isStorage && node.cornerSymbol !== 'none' && (
              <span
                className="w-4 h-4 rounded flex items-center justify-center shrink-0 text-[10px]"
                style={{ backgroundColor: `${node.color}25`, color: node.color }}
              >
                <CornerSymbolIcon symbol={node.cornerSymbol} size={11} />
              </span>
            )}
          </div>

          {/* Bottom Area: Description / Note */}
          <div className="flex-1 mt-1 flex flex-col justify-center">
            {isEditing ? (
              <div
                className="flex items-center gap-1 pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <input
                  type="text"
                  autoFocus
                  placeholder="Thêm mô tả..."
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit();
                    if (e.key === 'Escape') setIsEditing(false);
                  }}
                  className={`w-full text-[11px] border rounded px-1.5 py-0.5 outline-none ${
                    isDark
                      ? 'bg-slate-800 border-blue-500 text-white'
                      : 'bg-white border-blue-500 text-slate-800'
                  }`}
                />
                <button
                  onClick={handleSaveEdit}
                  className="p-0.5 text-green-500 hover:bg-green-500/10 rounded shrink-0"
                  title="Lưu"
                >
                  <Check size={12} />
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-0.5 text-gray-400 hover:bg-gray-500/10 rounded shrink-0"
                  title="Hủy"
                >
                  <X size={12} />
                </button>
              </div>
            ) : isStorage ? (
              <span
                className={`text-[10px] font-semibold tracking-wide uppercase ${
                  isDark ? 'text-sky-400' : 'text-sky-600'
                }`}
              >
                {node.customLabel || 'Storage Object'}
              </span>
            ) : node.customLabel ? (
              <p
                className={`text-[11px] leading-snug break-words whitespace-normal line-clamp-4 ${
                  isDark ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                {node.customLabel}
              </p>
            ) : (
              <span className="text-[10px] text-gray-400 italic">
                (Nhấp đúp để thêm chú thích)
              </span>
            )}
          </div>
        </div>
      </foreignObject>
    </g>
  );
};
