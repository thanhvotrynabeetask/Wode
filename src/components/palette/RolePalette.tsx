import React, { useState } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { useUIStore } from '../../store/useUIStore';
import { RoleGroup } from './RoleGroup';
import { RoleEditorModal } from './RoleEditorModal';
import { NodeTemplateEditorModal } from './NodeTemplateEditorModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Button } from '../common/Button';
import { Plus, Search, Sparkles } from 'lucide-react';
import { Role, NodeTemplate } from '../../types/schema';

export const RolePalette: React.FC = () => {
  const {
    schema,
    addRole,
    updateRole,
    removeRole,
    addNodeTemplate,
    updateNodeTemplate,
    removeNodeTemplate,
    addNodeToFrame,
    addFrame,
    getUsageCount,
  } = useProjectStore();

  const { selection, setSelectedFrame, addToast } = useUIStore();

  const [search, setSearch] = useState('');
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NodeTemplate | null>(null);
  const [targetRoleIdForTemplate, setTargetRoleIdForTemplate] = useState<string | undefined>(undefined);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'role' | 'template';
    id: string;
    name: string;
  } | null>(null);

  // Active frame for quick add
  const activeFrame = schema.frames.find((f) => f.frame_id === selection.selectedFrameId) || schema.frames[0];

  const handleAddNodeToFrame = (baseId: string) => {
    let targetFrame = activeFrame;
    if (!targetFrame) {
      // If no frames yet, create one automatically
      addFrame('Giai đoạn 1');
      const updatedFrames = useProjectStore.getState().schema.frames;
      targetFrame = updatedFrames[0];
      if (targetFrame) setSelectedFrame(targetFrame.frame_id);
    }
    if (targetFrame) {
      addNodeToFrame(targetFrame.frame_id, baseId);
      addToast('success', `Đã thêm vào khung: ${targetFrame.title}`);
    }
  };

  const handleSeedSampleData = () => {
    // Helpful starter setup matching the JSON Schema example in spec
    addRole('Customer', '#3B82F6');
    addRole('Sales Admin', '#10B981');
    addRole('Warehouse', '#F59E0B');

    const state = useProjectStore.getState();
    const customerRole = state.schema.roles.find((r) => r.name === 'Customer');
    const salesRole = state.schema.roles.find((r) => r.name === 'Sales Admin');
    const warehouseRole = state.schema.roles.find((r) => r.name === 'Warehouse');

    if (customerRole) {
      addNodeTemplate({
        role_id: customerRole.id,
        title: 'Tạo đơn hàng',
        corner_symbol: 'user-action',
        color: customerRole.color,
      });
      addNodeTemplate({
        role_id: customerRole.id,
        title: 'Thanh toán trực tuyến',
        corner_symbol: 'check',
        color: customerRole.color,
      });
    }

    if (salesRole) {
      addNodeTemplate({
        role_id: salesRole.id,
        title: 'Xác nhận đơn & kiểm tồn',
        corner_symbol: 'bot',
        color: salesRole.color,
      });
    }

    if (warehouseRole) {
      addNodeTemplate({
        role_id: warehouseRole.id,
        title: 'Đóng gói & xuất kho',
        corner_symbol: 'timer',
        color: warehouseRole.color,
      });
    }

    addToast('success', 'Đã tải bộ mẫu vai trò và nhiệm vụ cơ bản!');
  };

  // Filter templates based on search query
  const filteredRoles = schema.roles.map((role) => {
    const templates = schema.node_palette.filter((tpl) => tpl.role_id === role.id);
    const filteredTemplates = search.trim()
      ? templates.filter(
          (t) =>
            t.title.toLowerCase().includes(search.toLowerCase()) ||
            role.name.toLowerCase().includes(search.toLowerCase())
        )
      : templates;
    return { role, templates: filteredTemplates };
  });

  return (
    <div className="flex flex-col h-full bg-white select-none">
      {/* Search & Actions Bar */}
      <div className="p-3 border-b border-gray-200 space-y-2 shrink-0 bg-gray-50/50">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm vai trò hoặc nhiệm vụ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-md outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant="primary"
            size="sm"
            className="flex-1 justify-center text-xs py-1.5"
            icon={<Plus size={13} />}
            onClick={() => {
              setEditingRole(null);
              setRoleModalOpen(true);
            }}
          >
            Thêm Vai Trò
          </Button>

          {schema.roles.length === 0 && (
            <Button
              variant="secondary"
              size="sm"
              icon={<Sparkles size={13} className="text-amber-500" />}
              onClick={handleSeedSampleData}
              title="Khởi tạo dữ liệu mẫu"
            >
              Mẫu
            </Button>
          )}
        </div>
      </div>

      {/* Roles & Templates List */}
      <div className="flex-1 overflow-y-auto">
        {schema.roles.length === 0 ? (
          <div className="p-6 text-center text-gray-400">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2 text-gray-400">
              <Plus size={20} />
            </div>
            <p className="text-xs font-medium text-gray-600 mb-1">Chưa có vai trò nào</p>
            <p className="text-[11px] text-gray-400 mb-4">
              Mỗi vai trò (Role) sẽ tương ứng với một làn bơi (Swimlane) trên sơ đồ.
            </p>
            <div className="flex flex-col gap-2 max-w-xs mx-auto">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setEditingRole(null);
                  setRoleModalOpen(true);
                }}
              >
                Tạo vai trò đầu tiên
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={<Sparkles size={13} className="text-amber-500" />}
                onClick={handleSeedSampleData}
              >
                Tạo dữ liệu mẫu nhanh
              </Button>
            </div>
          </div>
        ) : (
          filteredRoles.map(({ role, templates }) => (
            <RoleGroup
              key={role.id}
              role={role}
              templates={templates}
              getUsageCount={getUsageCount}
              onEditRole={() => {
                setEditingRole(role);
                setRoleModalOpen(true);
              }}
              onDeleteRole={() =>
                setDeleteConfirm({
                  type: 'role',
                  id: role.id,
                  name: `Vai trò "${role.name}" và toàn bộ nhiệm vụ liên quan`,
                })
              }
              onAddTemplate={() => {
                setTargetRoleIdForTemplate(role.id);
                setEditingTemplate(null);
                setTemplateModalOpen(true);
              }}
              onEditTemplate={(tpl) => {
                setTargetRoleIdForTemplate(role.id);
                setEditingTemplate(tpl);
                setTemplateModalOpen(true);
              }}
              onDeleteTemplate={(baseId) => {
                const tpl = schema.node_palette.find((t) => t.base_id === baseId);
                setDeleteConfirm({
                  type: 'template',
                  id: baseId,
                  name: `Nhiệm vụ mẫu "${tpl?.title ?? baseId}"`,
                })
              }}
              onAddNodeToFrame={handleAddNodeToFrame}
              activeFrameTitle={activeFrame?.title}
            />
          ))
        )}
      </div>

      {/* Modals */}
      <RoleEditorModal
        isOpen={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        initialRole={editingRole}
        onSave={(name, color) => {
          if (editingRole) {
            updateRole(editingRole.id, { name, color });
            addToast('success', `Đã cập nhật vai trò ${name}`);
          } else {
            addRole(name, color);
            addToast('success', `Đã thêm vai trò ${name}`);
          }
        }}
      />

      <NodeTemplateEditorModal
        isOpen={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        roles={schema.roles}
        initialTemplate={editingTemplate}
        defaultRoleId={targetRoleIdForTemplate}
        onSave={(tpl) => {
          if (editingTemplate) {
            updateNodeTemplate(editingTemplate.base_id, tpl);
            addToast('success', `Đã cập nhật nhiệm vụ ${tpl.title}`);
          } else {
            addNodeTemplate(tpl);
            addToast('success', `Đã tạo nhiệm vụ mẫu ${tpl.title}`);
          }
        }}
      />

      {deleteConfirm && (
        <ConfirmDialog
          isOpen={true}
          title="Xác nhận xóa"
          message={`Bạn có chắc chắn muốn xóa ${deleteConfirm.name}? Hành động này không thể hoàn tác.`}
          confirmLabel="Xóa"
          variant="danger"
          onConfirm={() => {
            if (deleteConfirm.type === 'role') {
              removeRole(deleteConfirm.id);
            } else {
              removeNodeTemplate(deleteConfirm.id);
            }
            setDeleteConfirm(null);
            addToast('info', 'Đã xóa thành công.');
          }}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
};
