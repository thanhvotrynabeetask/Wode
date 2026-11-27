import React, { useState, useRef } from 'react';
import { LayoutNode } from '../../services/LayoutEngine';
import { CornerSymbolIcon } from '../common/CornerSymbolIcon';
import { Database, ArrowLeftRight, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { NODE_KIND_META } from '../../utils/nodeKind';
import { LISTING_ITEM_SYMBOLS } from '../../types/schema';
import { useTranslation } from '../../i18n';

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
  onToggleListings?: (instanceId: string) => void;
  listingsExpanded?: boolean;
  onUpdateSize?: (width: number, height: number) => void;
  zoom?: number;
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
  onToggleListings,
  listingsExpanded = false,
  onUpdateSize,
  zoom = 1,
}) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(node.customLabel || '');
  const resizeRef = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null);

  const isStorage = node.nodeKind === 'storage';
  const isMediator = node.nodeKind === 'mediator';
  const isSpecial = isStorage || isMediator;
  const kindColor = isSpecial ? NODE_KIND_META[node.nodeKind as 'storage' | 'mediator'].color : node.color;
  const kindTag = isSpecial ? NODE_KIND_META[node.nodeKind as 'storage' | 'mediator'].tag : '';

  const hasListings = node.listings && node.listings.length > 0;

  const handleSaveEdit = () => {
    if (onUpdateLabel) {
      onUpdateLabel(editText.trim());
    }
    setIsEditing(false);
  };

  const specialBg = isStorage
    ? isDark ? '#082F49' : '#F0F9FF'
    : isDark ? '#2E1065' : '#F5F3FF';
  const specialHeaderBg = isStorage
    ? isDark ? '#0C4A6E' : '#E0F2FE'
    : isDark ? '#4C1D95' : '#EDE9FE';

  const nodeBg = isSpecial ? specialBg : isDark ? '#1E293B' : '#FFFFFF';

  const nodeBorder = isSelected
    ? '#3B82F6'
    : isSpecial
    ? kindColor
    : isDark
    ? '#334155'
    : '#CBD5E1';

  let glowFilter: string | undefined = undefined;
  if (isDark && enableDarkGlow) {
    glowFilter = isSpecial
      ? `drop-shadow(0 0 8px ${kindColor}73)`
      : `drop-shadow(0 0 6px ${node.color}55)`;
  } else if (!isDark) {
    glowFilter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.06))';
  }

  const titleClass = isDark
    ? isStorage
      ? 'text-sky-300'
      : isMediator
      ? 'text-violet-300'
      : 'text-slate-100'
    : isStorage
    ? 'text-sky-900'
    : isMediator
    ? 'text-violet-900'
    : 'text-slate-900';

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onUpdateSize) return;
    e.preventDefault();
    resizeRef.current = { startX: e.clientX, startY: e.clientY, startW: node.width, startH: node.height };

    const move = (ev: MouseEvent) => {
      const ref = resizeRef.current;
      if (!ref) return;
      const dx = ev.clientX - ref.startX;
      const dy = ev.clientY - ref.startY;
      const factor = zoom || 1;
      const newW = Math.max(120, Math.round(ref.startW + dx / factor));
      const newH = Math.max(60, Math.round(ref.startH + dy / factor));
      onUpdateSize(newW, newH);
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
          rx={isMediator ? 24 : isStorage ? 14 : 12}
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
            fill={specialHeaderBg}
          />
        </g>
      ) : isMediator ? (
        <g>
          <rect
            x={0}
            y={0}
            width={node.width}
            height={node.height}
            rx={20}
            fill={nodeBg}
            stroke={nodeBorder}
            strokeWidth={2}
            strokeDasharray="6 3"
            filter={glowFilter}
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
      <foreignObject x={8} y={4} width={node.width - 16} height={node.height - 8} style={{ overflow: 'hidden' }}>
        <div className="w-full h-full flex flex-col justify-between text-left pointer-events-none select-none">
          {/* Top Line: Heading */}
          <div className="flex items-start justify-between gap-1 w-full shrink-0">
            <div className="flex items-start gap-1.5 min-w-0 flex-1">
              {isSpecial ? (
                <div
                  className="w-4 h-4 rounded-full text-white flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: kindColor }}
                >
                  {isStorage ? <Database size={10} /> : <ArrowLeftRight size={10} />}
                </div>
              ) : null}

              <span
                className={`font-bold text-xs leading-snug line-clamp-2 break-words ${titleClass}`}
                title={node.title}
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  wordBreak: 'break-word',
                }}
              >
                {node.title}
              </span>
            </div>

            {/* Listing toggle indicator */}
            {hasListings && (
              <button
                className="pointer-events-auto p-0.5 text-gray-400 hover:text-blue-500 transition-colors shrink-0 mt-0.5"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onToggleListings) onToggleListings(node.instanceId);
                }}
                title={listingsExpanded ? t('canvas.collapseList') : t('canvas.expandList')}
              >
                {listingsExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              </button>
            )}

            {!isSpecial && node.cornerSymbol !== 'none' && (
              <span
                className="w-4 h-4 rounded flex items-center justify-center shrink-0 text-[10px] mt-0.5"
                style={{ backgroundColor: `${node.color}25`, color: node.color }}
              >
                <CornerSymbolIcon symbol={node.cornerSymbol} size={11} />
              </span>
            )}
          </div>

          {/* Bottom Area: Description / Note + Listings */}
          <div className="flex-1 mt-1 flex flex-col justify-center min-h-0">
            {isEditing ? (
              <div
                className="flex items-start gap-1 pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <textarea
                  autoFocus
                  placeholder={t('builder.customNotePlaceholder')}
                  value={editText}
                  rows={Math.max(2, Math.min(6, editText.split('\n').length))}
                  onChange={(e) => setEditText(e.target.value)}
                  onFocus={(e) => {
                    const val = e.currentTarget.value;
                    e.currentTarget.setSelectionRange(val.length, val.length);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (e.shiftKey) {
                        e.stopPropagation();
                      } else {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSaveEdit();
                      }
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsEditing(false);
                    }
                  }}
                  className={`w-full text-[11px] leading-tight border rounded px-1.5 py-1 outline-none resize-none shadow-md ${
                    isDark
                      ? 'bg-slate-800 border-blue-500 text-white placeholder-slate-400'
                      : 'bg-white border-blue-500 text-slate-800 placeholder-slate-400'
                  }`}
                />
                <div className="flex flex-col gap-0.5 shrink-0 pt-0.5">
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    className="p-1 text-green-500 hover:bg-green-500/10 rounded"
                    title={t('builder.saveEnter')}
                  >
                    <Check size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="p-1 text-gray-400 hover:bg-gray-500/10 rounded"
                    title={t('builder.cancelEsc')}
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Description / Label */}
                {isSpecial ? (
                  <span
                    className="text-[10px] font-semibold tracking-wide uppercase whitespace-pre-wrap break-words"
                    style={{ color: kindColor }}
                  >
                    {node.customLabel || kindTag}
                  </span>
                ) : node.customLabel ? (
                  <p
                    className={`text-[11px] leading-snug break-words whitespace-pre-wrap ${
                      isDark ? 'text-slate-300' : 'text-slate-600'
                    }`}
                  >
                    {node.customLabel}
                  </p>
                ) : (
                  <span className="text-[10px] text-gray-400 italic">
                    {t('canvas.doubleClickToAddNote')}
                  </span>
                )}

                {/* Collapsible Listing Items */}
                {hasListings && listingsExpanded && (
                  <div className="mt-1 space-y-0.5">
                    {node.listings!.map((item) => {
                      const symbol = LISTING_ITEM_SYMBOLS[item.type];
                      return (
                        <div
                          key={item.id}
                          className={`flex items-center gap-1 text-[10px] ${
                            isDark ? 'text-slate-400' : 'text-slate-500'
                          }`}
                        >
                          <span className="shrink-0">{symbol.icon}</span>
                          <span className="truncate">{item.name}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Listing count badge when collapsed */}
                {hasListings && !listingsExpanded && (
                  <span className={`text-[9px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {t('builder.itemsCount', { count: node.listings!.length })}
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </foreignObject>

      {/* Resize Handle (bottom-right corner) */}
      {onUpdateSize && (
        <rect
          x={node.width - 10}
          y={node.height - 10}
          width={10}
          height={10}
          fill="transparent"
          style={{ cursor: 'nwse-resize' }}
          onMouseDown={handleResizeStart}
        />
      )}
    </g>
  );
};