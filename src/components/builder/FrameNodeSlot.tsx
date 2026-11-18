import React, { useState } from 'react';
import { NodeInstance, NodeTemplate, Role } from '../../types/schema';
import { CornerSymbolIcon } from '../common/CornerSymbolIcon';
import { NODE_KIND_META, isSpecialKind } from '../../utils/nodeKind';
import { ChevronUp, ChevronDown, Trash2, Edit3, Check, X } from 'lucide-react';

interface FrameNodeSlotProps {
  node: NodeInstance;
  index: number;
  total: number;
  template?: NodeTemplate;
  role?: Role;
  isSelected?: boolean;
  onSelect?: () => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onUpdateCustomLabel: (label: string | null) => void;
}

export const FrameNodeSlot: React.FC<FrameNodeSlotProps> = ({
  node,
  index,
  total,
  template,
  role,
  isSelected,
  onSelect,
  onRemove,
  onMoveUp,
  onMoveDown,
  onUpdateCustomLabel,
}) => {
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelText, setLabelText] = useState(node.custom_label || '');

  const kind = node.node_kind || template?.node_kind;
  const kindMeta = isSpecialKind(kind) ? NODE_KIND_META[kind] : null;
  const roleColor = role?.color || kindMeta?.color || '#3B82F6';
  const displayTitle = node.custom_label || node.title;

  const handleSaveLabel = () => {
    onUpdateCustomLabel(labelText.trim() ? labelText.trim() : null);
    setEditingLabel(false);
  };

  return (
    <div
      onClick={onSelect}
      className={`group relative bg-white border rounded-lg p-2 transition-all cursor-pointer ${
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-100 shadow-sm'
          : 'border-gray-200 hover:border-gray-300 shadow-xs'
      }`}
    >
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {/* Index in frame */}
          <span className="text-[10px] font-mono text-gray-400 w-3.5 text-center shrink-0">
            {index + 1}.
          </span>

          {/* Role color indicator */}
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: roleColor }}
            title={role?.name}
          />

          {/* Corner Symbol */}
          {template && template.corner_symbol !== 'none' && (
            <span className="text-gray-400 shrink-0">
              <CornerSymbolIcon symbol={template.corner_symbol} size={12} />
            </span>
          )}

          {/* Title or Custom Label Input */}
          {editingLabel ? (
            <div className="flex items-center gap-1 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                autoFocus
                placeholder="Ghi chú riêng..."
                value={labelText}
                onChange={(e) => setLabelText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveLabel();
                  if (e.key === 'Escape') setEditingLabel(false);
                }}
                className="w-full text-xs border border-blue-400 rounded px-1.5 py-0.5 outline-none"
              />
              <button onClick={handleSaveLabel} className="text-green-600 hover:text-green-700 p-0.5">
                <Check size={12} />
              </button>
              <button onClick={() => setEditingLabel(false)} className="text-gray-400 hover:text-gray-600 p-0.5">
                <X size={12} />
              </button>
            </div>
          ) : (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-800 truncate" title={displayTitle}>
                {displayTitle}
              </p>
              {kindMeta && (
                <p className="text-[10px] truncate" style={{ color: kindMeta.color }}>
                  {kindMeta.tag}
                  {role ? ` • Làn: ${role.name}` : ''}
                </p>
              )}
              {node.custom_label && (
                <p className="text-[10px] text-gray-400 truncate italic">
                  Gốc: {node.title}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        {!editingLabel && (
          <div className="flex items-center gap-0.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditingLabel(true);
                setLabelText(node.custom_label || '');
              }}
              title="Đổi tên/Ghi chú riêng cho bản sao này"
              className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-gray-100 transition-colors"
            >
              <Edit3 size={11} />
            </button>
            <button
              disabled={index === 0}
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp();
              }}
              title="Di chuyển lên trước"
              className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-20 transition-colors"
            >
              <ChevronUp size={12} />
            </button>
            <button
              disabled={index === total - 1}
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown();
              }}
              title="Di chuyển xuống sau"
              className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-20 transition-colors"
            >
              <ChevronDown size={12} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              title="Xóa khỏi phân đoạn này"
              className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={11} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
