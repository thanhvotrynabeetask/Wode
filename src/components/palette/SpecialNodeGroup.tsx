import React, { useState } from 'react';
import { NodeTemplate, NodeKind } from '../../types/schema';
import { NodeCard } from './NodeCard';
import { NODE_KIND_META } from '../../utils/nodeKind';
import { ChevronDown, ChevronRight, Plus, Database, ArrowLeftRight } from 'lucide-react';
import { useTranslation } from '../../i18n';

interface SpecialNodeGroupProps {
  kind: Exclude<NodeKind, 'standard'>;
  templates: NodeTemplate[];
  getUsageCount: (baseId: string) => number;
  onAddTemplate: () => void;
  onEditTemplate: (template: NodeTemplate) => void;
  onDeleteTemplate: (baseId: string) => void;
  onDuplicateTemplate?: (template: NodeTemplate) => void;
  onAddNodeToFrame: (baseId: string) => void;
  activeFrameTitle?: string | null;
}

export const SpecialNodeGroup: React.FC<SpecialNodeGroupProps> = ({
  kind,
  templates,
  getUsageCount,
  onAddTemplate,
  onEditTemplate,
  onDeleteTemplate,
  onDuplicateTemplate,
  onAddNodeToFrame,
  activeFrameTitle,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const meta = NODE_KIND_META[kind];
  const { t } = useTranslation();
  const groupLabel = kind === 'storage' ? t('palette.storageGroupTitle') : t('palette.mediatorGroupTitle');
  const groupHint = kind === 'storage' ? t('palette.storageHint') : t('palette.mediatorHint');

  return (
    <div className="border-b border-gray-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50/70 dark:bg-slate-800/60 hover:bg-gray-100/60 dark:hover:bg-slate-800 transition-colors">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2 min-w-0 flex-1 text-left"
        >
          {collapsed ? (
            <ChevronRight size={14} className="text-gray-400 dark:text-slate-500 shrink-0" />
          ) : (
            <ChevronDown size={14} className="text-gray-400 dark:text-slate-500 shrink-0" />
          )}
          <span
            className="flex items-center justify-center w-4 h-4 rounded shrink-0"
            style={{ backgroundColor: `${meta.color}1A`, color: meta.color }}
          >
            {kind === 'storage' ? <Database size={11} /> : <ArrowLeftRight size={11} />}
          </span>
          <span className="text-xs font-semibold text-gray-800 dark:text-slate-200 truncate">{groupLabel}</span>
          <span className="text-[10px] bg-gray-200/80 dark:bg-slate-700 text-gray-600 dark:text-slate-300 rounded-full px-1.5 shrink-0">
            {templates.length}
          </span>
        </button>

        <button
          onClick={onAddTemplate}
          title={`${t('common.add')} ${groupLabel}`}
          className="p-1 rounded text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors ml-2 shrink-0"
        >
          <Plus size={14} />
        </button>
      </div>

      {!collapsed && (
        <div className="p-2.5 space-y-2 bg-gray-50/30 dark:bg-slate-900/60">
          <p className="text-[10px] text-gray-400 dark:text-slate-400 leading-snug">{groupHint}</p>
          {templates.length === 0 ? (
            <div className="text-center py-3 px-2 border border-dashed border-gray-200 dark:border-slate-700 rounded-lg">
              <p className="text-[11px] text-gray-400 dark:text-slate-400 mb-1.5">{t('palette.unusedWarning')}</p>
              <button
                onClick={onAddTemplate}
                className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-medium hover:underline"
              >
                <Plus size={12} /> {t('common.add')}
              </button>
            </div>
          ) : (
            templates.map((tpl) => (
              <NodeCard
                key={tpl.base_id}
                template={tpl}
                usageCount={getUsageCount(tpl.base_id)}
                roleColor={meta.color}
                onEdit={() => onEditTemplate(tpl)}
                onDelete={() => onDeleteTemplate(tpl.base_id)}
                onDuplicate={onDuplicateTemplate ? () => onDuplicateTemplate(tpl) : undefined}
                onAddToActiveFrame={() => onAddNodeToFrame(tpl.base_id)}
                activeFrameTitle={activeFrameTitle}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};
