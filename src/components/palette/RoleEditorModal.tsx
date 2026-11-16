import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Role } from '../../types/schema';
import { DEFAULT_ROLE_COLORS } from '../../utils/constants';

interface RoleEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, color: string) => void;
  initialRole?: Role | null;
}

export const RoleEditorModal: React.FC<RoleEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialRole,
}) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState(DEFAULT_ROLE_COLORS[0]);

  useEffect(() => {
    if (initialRole) {
      setName(initialRole.name);
      setColor(initialRole.color);
    } else {
      setName('');
      setColor(DEFAULT_ROLE_COLORS[Math.floor(Math.random() * DEFAULT_ROLE_COLORS.length)]);
    }
  }, [initialRole, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim(), color);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialRole ? 'Sửa Vai Trò (Role)' : 'Thêm Vai Trò Mới'}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
            Tên vai trò
          </label>
          <input
            type="text"
            required
            autoFocus
            placeholder="Ví dụ: Khách hàng, Hệ thống, Kế toán..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
            Màu nhận diện
          </label>
          <div className="flex flex-wrap gap-2.5 mb-2">
            {DEFAULT_ROLE_COLORS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full transition-transform ${
                  color.toLowerCase() === c.toLowerCase() ? 'scale-125 ring-2 ring-offset-2 ring-blue-500 shadow-sm' : 'hover:scale-110'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
            />
            <span className="text-xs font-mono text-gray-500 uppercase">{color}</span>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={!name.trim()}>
            {initialRole ? 'Lưu thay đổi' : 'Thêm vai trò'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
