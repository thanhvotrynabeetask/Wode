import React, { useState } from 'react';
import { NodeInstance, NodeTemplate, Role, NodeListingItem, ListingItemType } from '../../types/schema';
import { LISTING_ITEM_SYMBOLS } from '../../types/schema';
import { CornerSymbolIcon } from '../common/CornerSymbolIcon';
import { NODE_KIND_META, isSpecialKind } from '../../utils/nodeKind';
import { ChevronUp, ChevronDown, Trash2, Edit3, Check, X, Plus, List } from 'lucide-react';

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
  onUpdateNodeListings: (instanceId: string, listings: NodeListingItem[]) => void;
}

const LISTING_TYPES: { value: ListingItemType; label: string }[] = [
  { value: 'skill', label: 'Skill' },
  { value: 'ai_model', label: 'AI Model' },
  { value: 'ai_agent', label: 'AI Agent' },
  { value: 'connector', label: 'Connector (API/MCP)' },
  { value: 'tool', label: 'Tool (trả phí)' },
  { value: 'custom', label: 'Khác' },
];

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
  onUpdateNodeListings,
}) => {
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelText, setLabelText] = useState(node.custom_label || '');
  const [showListingEditor, setShowListingEditor] = useState(false);
  const [newListingName, setNewListingName] = useState('');
  const [newListingType, setNewListingType] = useState<ListingItemType>('skill');

  const kind = node.node_kind || template?.node_kind;
  const kindMeta = isSpecialKind(kind) ? NODE_KIND_META[kind] : null;
  const roleColor = role?.color || kindMeta?.color || '#3B82F6';
  const nodeTitle = node.title || template?.title || 'Chưa đặt tên';
  const nodeDescription = node.custom_label;
  const listings = node.listings || [];

  const handleSaveLabel = () => {
    onUpdateCustomLabel(labelText.trim() ? labelText.trim() : null);
    setEditingLabel(false);
  };

  const handleAddListing = () => {
    if (!newListingName.trim()) return;
    const newItem: NodeListingItem = {
      id: `li_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type: newListingType,
      name: newListingName.trim(),
    };
    onUpdateNodeListings(node.instance_id, [...listings, newItem]);
    setNewListingName('');
    setNewListingType('skill');
  };

  const handleRemoveListing = (id: string) => {
    onUpdateNodeListings(node.instance_id, listings.filter((li) => li.id !== id));
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
              {/* Main Heading: Tên Node (Title) giống như mục Kho Node */}
              <p className="text-xs font-semibold text-gray-800 dark:text-slate-200 truncate" title={nodeTitle}>
                {nodeTitle}
              </p>
              {/* Mô tả / Ghi chú (Custom Label) hiển thị rõ bên dưới nếu có */}
              {nodeDescription && (
                <p className="text-[11px] text-gray-500 dark:text-slate-400 truncate mt-0.5" title={nodeDescription}>
                  {nodeDescription}
                </p>
              )}
              {kindMeta && (
                <p className="text-[10px] truncate mt-0.5" style={{ color: kindMeta.color }}>
                  {kindMeta.tag}
                  {role ? ` • Làn: ${role.name}` : ''}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Actions: Reorder up/down, edit description, delete */}
        {!editingLabel && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              disabled={index === 0}
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp();
              }}
              title="Di chuyển node lên trước (đổi thứ tự)"
              className="p-1 rounded text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 disabled:opacity-20 transition-colors"
            >
              <ChevronUp size={13} />
            </button>
            <button
              disabled={index === total - 1}
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown();
              }}
              title="Di chuyển node xuống sau (đổi thứ tự)"
              className="p-1 rounded text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 disabled:opacity-20 transition-colors"
            >
              <ChevronDown size={13} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditingLabel(true);
                setLabelText(node.custom_label || '');
              }}
              title="Thêm hoặc sửa mô tả / ghi chú cho nhiệm vụ này"
              className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Edit3 size={12} />
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

      {/* Listing Toggle & Editor */}
      <div className="mt-1.5 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => setShowListingEditor(!showListingEditor)}
          className={`flex items-center gap-1 text-[10px] font-medium rounded px-1.5 py-0.5 transition-colors ${
            listings.length > 0
              ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
              : 'text-gray-400 hover:text-blue-600 hover:bg-gray-50'
          }`}
        >
          <List size={10} />
          {listings.length > 0 ? `📋 ${listings.length} mục` : 'Thêm danh sách'}
        </button>
        {showListingEditor && (
          <span className="text-[9px] text-gray-400">bấm để edit</span>
        )}
      </div>

      {/* Full Listing Editor in Side Panel */}
      {showListingEditor && (
        <div className="mt-1.5 bg-gray-50 border border-gray-200 rounded-lg p-2 space-y-1.5" onClick={(e) => e.stopPropagation()}>
          {/* Existing Items */}
          {listings.length > 0 && (
            <div className="space-y-1">
              {listings.map((item) => {
                const symbol = LISTING_ITEM_SYMBOLS[item.type];
                return (
                  <div key={item.id} className="flex items-center gap-1.5 text-[11px] group/item">
                    <span className="shrink-0">{symbol.icon}</span>
                    <span className="flex-1 truncate text-gray-700">{item.name}</span>
                    <span className="text-[9px] text-gray-400 shrink-0">{symbol.label}</span>
                    <button
                      onClick={() => handleRemoveListing(item.id)}
                      className="p-0.5 text-gray-300 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity"
                      title="Xóa"
                    >
                      <X size={10} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add New Item */}
          <div className="flex items-center gap-1.5">
            <select
              value={newListingType}
              onChange={(e) => setNewListingType(e.target.value as ListingItemType)}
              className="text-[10px] border border-gray-200 rounded px-1 py-0.5 outline-none bg-white max-w-[90px]"
            >
              {LISTING_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {LISTING_ITEM_SYMBOLS[t.value].icon} {t.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Tên..."
              value={newListingName}
              onChange={(e) => setNewListingName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddListing();
              }}
              className="flex-1 text-[10px] border border-gray-200 rounded px-1.5 py-0.5 outline-none bg-white"
            />
            <button
              onClick={handleAddListing}
              disabled={!newListingName.trim()}
              className="p-1 text-green-600 hover:bg-green-50 disabled:opacity-30 rounded transition-colors"
              title="Thêm"
            >
              <Plus size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
