import React, { useState } from 'react';
import { NodeInstance, NodeTemplate, Role, NodeListingItem, ListingItemType } from '../../types/schema';
import { LISTING_ITEM_SYMBOLS } from '../../types/schema';
import { CornerSymbolIcon } from '../common/CornerSymbolIcon';
import { NODE_KIND_META, isSpecialKind } from '../../utils/nodeKind';
import { ChevronUp, ChevronDown, Trash2, Edit3, Check, X, Plus, List } from 'lucide-react';
import { useTranslation } from '../../i18n';

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
  const { t } = useTranslation();
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelText, setLabelText] = useState(node.custom_label || '');
  const [showListingEditor, setShowListingEditor] = useState(false);
  const [newListingName, setNewListingName] = useState('');
  const [newListingType, setNewListingType] = useState<ListingItemType>('skill');

  const listingTypeOptions: { value: ListingItemType; label: string }[] = [
    { value: 'skill', label: t('builder.listingTypes.skill') },
    { value: 'ai_model', label: t('builder.listingTypes.ai_model') },
    { value: 'ai_agent', label: t('builder.listingTypes.ai_agent') },
    { value: 'connector', label: t('builder.listingTypes.connector') },
    { value: 'tool', label: t('builder.listingTypes.tool') },
    { value: 'custom', label: t('builder.listingTypes.custom') },
  ];

  const kind = node.node_kind || template?.node_kind;
  const kindMeta = isSpecialKind(kind) ? NODE_KIND_META[kind] : null;
  const roleColor = role?.color || kindMeta?.color || '#3B82F6';
  const nodeTitle = node.title || template?.title || t('builder.untitled');
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
      className={`group relative bg-white dark:bg-slate-800 border rounded-lg p-2 transition-all cursor-pointer ${
        isSelected
          ? 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-100 dark:ring-blue-950/50 shadow-sm'
          : 'border-gray-200 dark:border-slate-700/80 hover:border-gray-300 dark:hover:border-slate-600 shadow-xs'
      }`}
    >
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {/* Index in frame */}
          <span className="text-[10px] font-mono text-gray-400 dark:text-slate-400 w-3.5 text-center shrink-0">
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
            <span className="text-gray-400 dark:text-slate-400 shrink-0">
              <CornerSymbolIcon symbol={template.corner_symbol} size={12} />
            </span>
          )}

          {/* Title or Custom Label Input */}
          {editingLabel ? (
            <div className="flex items-start gap-1 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
              <textarea
                autoFocus
                placeholder={t('builder.customNotePlaceholder')}
                value={labelText}
                rows={Math.max(2, Math.min(5, labelText.split('\n').length))}
                onChange={(e) => setLabelText(e.target.value)}
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
                      handleSaveLabel();
                    }
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    e.stopPropagation();
                    setEditingLabel(false);
                  }
                }}
                className="w-full text-xs bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 border border-blue-400 rounded px-1.5 py-1 outline-none resize-none"
              />
              <div className="flex flex-col gap-0.5 shrink-0 pt-0.5">
                <button onClick={handleSaveLabel} className="text-green-600 hover:text-green-700 p-0.5" title={t('builder.saveEnter')}>
                  <Check size={12} />
                </button>
                <button onClick={() => setEditingLabel(false)} className="text-gray-400 hover:text-gray-600 p-0.5" title={t('builder.cancelEsc')}>
                  <X size={12} />
                </button>
              </div>
            </div>
          ) : (
            <div className="min-w-0 flex-1">
              {/* Main Heading: Tên Node (Title) */}
              <p
                className="text-xs font-semibold text-gray-800 dark:text-slate-100 line-clamp-2 break-words leading-tight"
                title={nodeTitle}
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  wordBreak: 'break-word',
                }}
              >
                {nodeTitle}
              </p>
              {/* Mô tả / Ghi chú (Custom Label) hiển thị rõ bên dưới nếu có */}
              {nodeDescription && (
                <p className="text-[11px] text-gray-500 dark:text-slate-300 whitespace-pre-line break-words mt-0.5" title={nodeDescription}>
                  {nodeDescription}
                </p>
              )}
              {kindMeta && (
                <p className="text-[10px] truncate mt-0.5" style={{ color: kindMeta.color }}>
                  {kindMeta.tag}
                  {role ? ` ${t('builder.laneIndicator', { name: role.name })}` : ''}
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
              title={t('builder.moveNodeUp')}
              className="p-1 rounded text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 disabled:opacity-20 transition-colors"
            >
              <ChevronUp size={13} />
            </button>
            <button
              disabled={index === total - 1}
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown();
              }}
              title={t('builder.moveNodeDown')}
              className="p-1 rounded text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 disabled:opacity-20 transition-colors"
            >
              <ChevronDown size={13} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditingLabel(true);
                setLabelText(node.custom_label || '');
              }}
              title={t('builder.editNodeNote')}
              className="p-1 rounded text-gray-400 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            >
              <Edit3 size={12} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              title={t('builder.deleteFromFrame')}
              className="p-1 rounded text-gray-400 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-slate-700 transition-colors"
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
              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50'
              : 'text-gray-400 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-slate-700/60'
          }`}
        >
          <List size={10} />
          {listings.length > 0 ? t('builder.itemsCount', { count: listings.length }) : t('builder.addList')}
        </button>
        {showListingEditor && (
          <span className="text-[9px] text-gray-400 dark:text-slate-400">{t('builder.clickToEdit')}</span>
        )}
      </div>

      {/* Full Listing Editor in Side Panel */}
      {showListingEditor && (
        <div className="mt-1.5 bg-gray-50 dark:bg-slate-900/90 border border-gray-200 dark:border-slate-700 rounded-lg p-2 space-y-1.5" onClick={(e) => e.stopPropagation()}>
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
                      title={t('common.delete')}
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
              className="text-[10px] border border-gray-200 dark:border-slate-700 rounded px-1 py-0.5 outline-none bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 max-w-[90px]"
            >
              {listingTypeOptions.map((t) => (
                <option key={t.value} value={t.value} className="bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100">
                  {LISTING_ITEM_SYMBOLS[t.value].icon} {t.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder={t('builder.itemPlaceholder')}
              value={newListingName}
              onChange={(e) => setNewListingName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddListing();
              }}
              className="flex-1 text-[10px] border border-gray-200 dark:border-slate-700 rounded px-1.5 py-0.5 outline-none bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500"
            />
            <button
              onClick={handleAddListing}
              disabled={!newListingName.trim()}
              className="p-1 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/40 disabled:opacity-30 rounded transition-colors"
              title={t('common.add')}
            >
              <Plus size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
