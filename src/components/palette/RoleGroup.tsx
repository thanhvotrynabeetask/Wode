import React, { useState } from 'react';
import { Role, NodeTemplate } from '../../types/schema';
import { NodeCard } from './NodeCard';
import { ChevronDown, ChevronRight, Plus, MoreHorizontal, Edit2, Trash2 } from 'lucide-react';
import { useTranslation } from '../../i18n';

interface RoleGroupProps {
  role: Role;
  templates: NodeTemplate[];
  getUsageCount: (baseId: string) => number;
  onEditRole: () => void;
  onDeleteRole: () => void;
  onAddTemplate: () => void;
  onEditTemplate: (template: NodeTemplate) => void;
  onDeleteTemplate: (baseId: string) => void;
  onDuplicateTemplate?: (template: NodeTemplate) => void;
  onAddNodeToFrame: (baseId: string) => void;
  activeFrameTitle?: string | null;
}

export const RoleGroup: React.FC<RoleGroupProps> = ({
  role,
  templates,
  getUsageCount,
  onEditRole,
  onDeleteRole,
  onAddTemplate,
  onEditTemplate,
  onDeleteTemplate,
  onDuplicateTemplate,
  onAddNodeToFrame,
  activeFrameTitle,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <div className="border-b border-gray-200/80 last:border-b-0 bg-white">
      {/* Header */}
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

          {/* Role color indicator */}
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
            style={{ backgroundColor: role.color }}
          />

          {/* Role title */}
          <span className="text-xs font-semibold text-gray-800 truncate" title={role.name}>
            {role.name}
          </span>

          {/* Template count badge */}
          <span className="text-[10px] bg-gray-200/80 text-gray-600 rounded-full px-1.5 py-0.2 shrink-0">
            {templates.length}
          </span>
        </button>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0 ml-2">
          <button
            onClick={onAddTemplate}
            title={t('palette.addNodeTemplate')}
            className="p-1 rounded text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <Plus size={14} />
          </button>

          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-200/60 transition-colors"
            >
              <MoreHorizontal size={14} />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-30 text-xs">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onEditRole();
                    }}
                    className="w-full flex items-center gap-1.5 px-3 py-1.5 text-gray-700 hover:bg-gray-50"
                  >
                    <Edit2 size={12} />
                    {t('palette.editRole')}
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onDeleteRole();
                    }}
                    className="w-full flex items-center gap-1.5 px-3 py-1.5 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={12} />
                    {t('common.delete')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Node templates in role */}
      {!collapsed && (
        <div className="p-2.5 space-y-2 bg-gray-50/30">
          {templates.length === 0 ? (
            <div className="text-center py-3 px-2 border border-dashed border-gray-200 rounded-lg">
              <p className="text-[11px] text-gray-400 mb-1.5">{t('palette.noSampleTemplates')}</p>
              <button
                onClick={onAddTemplate}
                className="inline-flex items-center gap-1 text-[11px] text-blue-600 font-medium hover:underline"
              >
                <Plus size={12} /> {t('palette.createNewTask')}
              </button>
            </div>
          ) : (
            templates.map((tpl) => (
              <NodeCard
                key={tpl.base_id}
                template={tpl}
                usageCount={getUsageCount(tpl.base_id)}
                roleColor={role.color}
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
