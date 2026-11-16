import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { NodeTemplate, Role, CornerSymbol, NodeKind } from '../../types/schema';
import { CornerSymbolIcon } from '../common/CornerSymbolIcon';
import { Database, UserCheck } from 'lucide-react';

interface NodeTemplateEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: Omit<NodeTemplate, 'base_id'>) => void;
  roles: Role[];
  initialTemplate?: NodeTemplate | null;
  defaultRoleId?: string;
}

const CORNER_SYMBOLS: { id: CornerSymbol; label: string }[] = [
  { id: 'user-action', label: 'Tác vụ người' },
  { id: 'bot', label: 'Tự động' },
  { id: 'check', label: 'Kiểm duyệt' },
  { id: 'timer', label: 'Hẹn giờ / Đợi' },
  { id: 'none', label: 'Không có' },
];

export const NodeTemplateEditorModal: React.FC<NodeTemplateEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  roles,
  initialTemplate,
  defaultRoleId,
}) => {
  const [title, setTitle] = useState('');
  const [roleId, setRoleId] = useState('');
  const [cornerSymbol, setCornerSymbol] = useState<CornerSymbol>('user-action');
  const [nodeKind, setNodeKind] = useState<NodeKind>('standard');

  useEffect(() => {
    if (initialTemplate) {
      setTitle(initialTemplate.title);
      setRoleId(initialTemplate.role_id);
      setCornerSymbol(initialTemplate.corner_symbol);
      setNodeKind(initialTemplate.node_kind || 'standard');
    } else {
      setTitle('');
      setRoleId(defaultRoleId || (roles[0] ? roles[0].id : ''));
      setCornerSymbol('user-action');
      setNodeKind('standard');
    }
  }, [initialTemplate, defaultRoleId, roles, isOpen]);

  const selectedRole = roles.find((r) => r.id === roleId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !roleId) return;

    onSave({
      title: title.trim(),
      role_id: roleId,
      corner_symbol: cornerSymbol,
      node_kind: nodeKind,
      color: nodeKind === 'storage' ? '#0284C7' : selectedRole ? selectedRole.color : '#3B82F6',
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialTemplate ? 'Sửa Thẻ Node Mẫu' : 'Tạo Thẻ Node Mẫu Mới'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Node Kind Selection (Standard vs Storage Object) */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
            Phân loại thành phần
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setNodeKind('standard')}
              className={`p-2.5 rounded-lg border text-left flex items-start gap-2.5 transition-colors ${
                nodeKind === 'standard'
                  ? 'border-blue-500 bg-blue-50/70 text-blue-900 ring-1 ring-blue-500'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <UserCheck size={18} className="text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold">Nhiệm vụ chuẩn</p>
                <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">
                  Cố định trong làn bơi (Swimlane), chỉ di chuyển ngang.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setNodeKind('storage')}
              className={`p-2.5 rounded-lg border text-left flex items-start gap-2.5 transition-colors ${
                nodeKind === 'storage'
                  ? 'border-sky-500 bg-sky-50/70 text-sky-900 ring-1 ring-sky-500'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Database size={18} className="text-sky-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold">Storage / Trung gian</p>
                <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">
                  Database, Queue... có thể tự do kéo đổi làn trên Canvas.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
            Tiêu đề nhiệm vụ
          </label>
          <input
            type="text"
            required
            autoFocus
            placeholder={nodeKind === 'storage' ? 'Ví dụ: Redis Cache, PostgreSQL DB, Message Queue...' : 'Ví dụ: Tạo đơn hàng, Duyệt thanh toán...'}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Role Selection */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
            {nodeKind === 'storage' ? 'Làn mặc định ban đầu' : 'Thuộc Vai Trò (Swimlane)'}
          </label>
          <select
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
            className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500 bg-white"
          >
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        {/* Corner Symbol (only if standard) */}
        {nodeKind === 'standard' && (
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Biểu tượng góc phân loại
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CORNER_SYMBOLS.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => setCornerSymbol(s.id)}
                  className={`flex items-center gap-2 px-3 py-2 text-xs rounded-lg border text-left transition-colors ${
                    cornerSymbol === s.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <CornerSymbolIcon symbol={s.id} size={15} />
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={!title.trim() || !roleId}>
            {initialTemplate ? 'Lưu thay đổi' : 'Tạo Node Mẫu'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
