import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { NodeTemplate, Role, CornerSymbol, NodeKind } from '../../types/schema';
import { CornerSymbolIcon } from '../common/CornerSymbolIcon';
import { Database, UserCheck, ArrowLeftRight } from 'lucide-react';
import { NODE_KIND_META } from '../../utils/nodeKind';
import { CANVAS_DEFAULTS } from '../../utils/constants';
import { useTranslation } from '../../i18n';

interface NodeTemplateEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: Omit<NodeTemplate, 'base_id'>) => void;
  roles: Role[];
  initialTemplate?: NodeTemplate | null;
  defaultRoleId?: string;
  defaultKind?: NodeKind;
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
  defaultKind,
}) => {
  const [title, setTitle] = useState('');
  const [roleId, setRoleId] = useState('');
  const [cornerSymbol, setCornerSymbol] = useState<CornerSymbol>('user-action');
  const [nodeKind, setNodeKind] = useState<NodeKind>('standard');
  const { t } = useTranslation();

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
      setNodeKind(defaultKind || 'standard');
    }
  }, [initialTemplate, defaultRoleId, defaultKind, roles, isOpen]);

  const selectedRole = roles.find((r) => r.id === roleId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !roleId) return;

    onSave({
      title: title.trim(),
      role_id: roleId,
      corner_symbol: cornerSymbol,
      node_kind: nodeKind,
      color: nodeKind !== 'standard' ? NODE_KIND_META[nodeKind].color : selectedRole ? selectedRole.color : '#3B82F6',
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialTemplate ? t('palette.editNode') : t('palette.addNodeTemplate')}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Node Kind Selection (Standard vs Storage Object) */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Phân loại thành phần
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setNodeKind('standard')}
              className={`p-2.5 rounded-lg border text-left flex items-start gap-2.5 transition-colors ${
                nodeKind === 'standard'
                  ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 ring-1 ring-blue-500'
                  : 'border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'
              }`}
            >
              <UserCheck size={18} className="text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold">Nhiệm vụ chuẩn</p>
                <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-0.5 leading-snug">
                  Cố định trong làn bơi (Swimlane), chỉ di chuyển ngang.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setNodeKind('storage')}
              className={`p-2.5 rounded-lg border text-left flex items-start gap-2.5 transition-colors ${
                nodeKind === 'storage'
                  ? 'border-sky-500 bg-sky-50/70 dark:bg-sky-950/60 text-sky-900 dark:text-sky-200 ring-1 ring-sky-500'
                  : 'border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'
              }`}
            >
              <Database size={18} className="text-sky-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold">Storage</p>
                <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-0.5 leading-snug">
                  Database, Cache... tự hút vào làn khi kéo thả.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setNodeKind('mediator')}
              className={`p-2.5 rounded-lg border text-left flex items-start gap-2.5 transition-colors ${
                nodeKind === 'mediator'
                  ? 'border-violet-500 bg-violet-50/70 dark:bg-violet-950/60 text-violet-900 dark:text-violet-200 ring-1 ring-violet-500'
                  : 'border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'
              }`}
            >
              <ArrowLeftRight size={18} className="text-violet-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold">Kênh trung gian</p>
                <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-0.5 leading-snug">
                  Queue, API gateway... tự hút vào làn khi kéo thả.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Title */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
              Tiêu đề nhiệm vụ
            </label>
            <span
              className={`text-[10px] ${
                title.length >= CANVAS_DEFAULTS.MAX_NODE_TITLE_LENGTH
                  ? 'text-red-500 font-bold'
                  : title.length >= 40
                  ? 'text-amber-500 font-semibold'
                  : 'text-gray-400 dark:text-slate-500'
              }`}
            >
              {title.length}/{CANVAS_DEFAULTS.MAX_NODE_TITLE_LENGTH} ký tự (tối đa 2 dòng)
            </span>
          </div>
          <input
            type="text"
            required
            autoFocus
            maxLength={CANVAS_DEFAULTS.MAX_NODE_TITLE_LENGTH}
            placeholder={
              nodeKind === 'storage'
                ? 'Ví dụ: Redis Cache, PostgreSQL DB...'
                : nodeKind === 'mediator'
                ? 'Ví dụ: Message Queue, API Gateway, Webhook...'
                : 'Ví dụ: Tạo đơn hàng, Duyệt thanh toán...'
            }
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-xs bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
          />
        </div>

        {/* Role Selection */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            {nodeKind !== 'standard' ? 'Làn mặc định ban đầu' : 'Thuộc Vai Trò (Swimlane)'}
          </label>
          <select
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
            className="w-full text-xs bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
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
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
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
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-medium'
                      : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <CornerSymbolIcon symbol={s.id} size={15} />
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-800">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={!title.trim() || !roleId}>
            {initialTemplate ? t('common.save') : t('common.add')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
