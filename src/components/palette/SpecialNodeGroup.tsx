import React, { useState } from 'react';
import { NodeTemplate, NodeKind } from '../../types/schema';
import { NodeCard } from './NodeCard';
import { NODE_KIND_META } from '../../utils/nodeKind';
import { ChevronDown, ChevronRight, Plus, Database, ArrowLeftRight } from 'lucide-react';

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

  return (
    <div className="border-b border-gray-200/80 bg-white">
      <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50/70 hover:bg-gray-100/60 transition-colors">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2 min-w-0 flex-1 text-left"
        >
          {collapsed ? (
            <ChevronRight size={14} className="text-gray-400 shrink-0" />
          ) : (
            <ChevronDown size={14} className="text-gray-400 shrink-0" />
          )}
          <span
            className="flex items-center justify-center w-4 h-4 rounded shrink-0"
            style={{ backgroundColor: `${meta.color}1A`, color: meta.color }}
          >
            {kind === 'storage' ? <Database size={11} /> : <ArrowLeftRight size={11} />}
          </span>
          <span className="text-xs font-semibold text-gray-800 truncate">{meta.label}</span>
          <span className="text-[10px] bg-gray-200/80 text-gray-600 rounded-full px-1.5 shrink-0">
            {templates.length}
          </span>
        </button>

        <button
          onClick={onAddTemplate}
          title={`Thêm ${meta.label.toLowerCase()} mới`}
          className="p-1 rounded text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors ml-2 shrink-0"
        >
          <Plus size={14} />
        </button>
      </div>

      {!collapsed && (
        <div className="p-2.5 space-y-2 bg-gray-50/30">
          <p className="text-[10px] text-gray-400 leading-snug">{meta.hint}</p>
          {templates.length === 0 ? (
            <div className="text-center py-3 px-2 border border-dashed border-gray-200 rounded-lg">
              <p className="text-[11px] text-gray-400 mb-1.5">Chưa có mẫu {meta.label.toLowerCase()}</p>
              <button
                onClick={onAddTemplate}
                className="inline-flex items-center gap-1 text-[11px] text-blue-600 font-medium hover:underline"
              >
                <Plus size={12} /> Tạo mới
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
