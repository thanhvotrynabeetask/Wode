import React from 'react';
import { NodeTemplate } from '../../types/schema';
import { Badge } from '../common/Badge';
import { CornerSymbolIcon } from '../common/CornerSymbolIcon';
import { MoreVertical, Edit2, Trash2, Plus, Database, ArrowLeftRight } from 'lucide-react';
import { NODE_KIND_META, isSpecialKind } from '../../utils/nodeKind';

interface NodeCardProps {
  template: NodeTemplate;
  usageCount: number;
  roleColor: string;
  onEdit: () => void;
  onDelete: () => void;
  onAddToActiveFrame?: () => void;
  activeFrameTitle?: string | null;
}

export const NodeCard: React.FC<NodeCardProps> = ({
  template,
  usageCount,
  roleColor,
  onEdit,
  onDelete,
  onAddToActiveFrame,
  activeFrameTitle,
}) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const isUnused = usageCount === 0;
  const isStorage = template.node_kind === 'storage';
  const isMediator = template.node_kind === 'mediator';
  const isSpecial = isSpecialKind(template.node_kind);
  const kindMeta = isSpecialKind(template.node_kind) ? NODE_KIND_META[template.node_kind] : null;

  return (
    <div
      className={`group relative bg-white rounded-lg p-2.5 transition-all shadow-sm ${
        isStorage
          ? 'border-2 border-sky-300 bg-sky-50/20 hover:border-sky-400'
          : isMediator
          ? 'border-2 border-dashed border-violet-300 bg-violet-50/20 hover:border-violet-400'
          : isUnused
          ? 'border-2 border-dashed border-amber-300 hover:border-amber-400 bg-amber-50/20'
          : 'border border-gray-200 hover:border-gray-300 hover:shadow'
      }`}
    >
      <div className="flex items-start justify-between gap-1.5 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          {/* Icon Badge */}
          {isSpecial && kindMeta ? (
            <span
              className="flex items-center justify-center w-5 h-5 rounded shrink-0"
              style={{ backgroundColor: `${kindMeta.color}1A`, color: kindMeta.color }}
              title={kindMeta.tag}
            >
              {isStorage ? <Database size={12} /> : <ArrowLeftRight size={12} />}
            </span>
          ) : (
            <span
              className="flex items-center justify-center w-5 h-5 rounded shrink-0"
              style={{ backgroundColor: `${roleColor}1A`, color: roleColor }}
              title={template.corner_symbol}
            >
              <CornerSymbolIcon symbol={template.corner_symbol} size={13} />
            </span>
          )}

          {/* Node Title */}
          <span className="text-xs font-medium text-gray-800 truncate" title={template.title}>
            {template.title}
          </span>
        </div>

        {/* Usage Badge */}
        <div className="flex items-center gap-1 shrink-0">
          <Badge
            count={usageCount}
            color={kindMeta ? kindMeta.color : isUnused ? '#F59E0B' : roleColor}
            className={isUnused ? 'bg-amber-100 text-amber-800 font-bold' : ''}
          />

          {/* Dropdown Menu Trigger */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical size={13} />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-30 text-xs">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit();
                    }}
                    className="w-full flex items-center gap-1.5 px-3 py-1.5 text-gray-700 hover:bg-gray-50"
                  >
                    <Edit2 size={12} />
                    Sửa mẫu
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete();
                    }}
                    className="w-full flex items-center gap-1.5 px-3 py-1.5 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={12} />
                    Xóa mẫu
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {kindMeta && (
        <div className="mb-1.5">
          <span
            className="text-[9px] font-semibold tracking-wider px-1.5 py-0.5 rounded uppercase"
            style={{ color: kindMeta.color, backgroundColor: `${kindMeta.color}1A` }}
          >
            {kindMeta.tag} • Kéo đổi làn tự do
          </span>
        </div>
      )}

      {/* Quick Add action to active frame */}
      {onAddToActiveFrame && (
        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[10px] text-gray-400">
            {activeFrameTitle ? `+ Đưa vào ${activeFrameTitle}` : '+ Đưa vào Frame'}
          </span>
          <button
            onClick={onAddToActiveFrame}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <Plus size={12} />
            Thêm
          </button>
        </div>
      )}
    </div>
  );
};
