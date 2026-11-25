import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Role } from '../../types/schema';
import { useTranslation } from '../../i18n';
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
  const { t } = useTranslation();

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
      title={initialRole ? t('palette.editRole') : t('palette.addRole')}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            {t('palette.roleModalNameLabel')}
          </label>
          <input
            type="text"
            required
            autoFocus
            placeholder="e.g. Customer, System, Admin..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            {t('palette.roleModalColorLabel')}
          </label>
          <div className="flex flex-wrap gap-2.5 mb-2">
            {DEFAULT_ROLE_COLORS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full transition-transform ${
                  color.toLowerCase() === c.toLowerCase() ? 'scale-125 ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-slate-900 shadow-sm' : 'hover:scale-110'
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
              className="w-8 h-8 rounded border border-gray-300 dark:border-slate-700 cursor-pointer bg-transparent"
            />
            <span className="text-xs font-mono text-gray-600 dark:text-slate-300 uppercase font-semibold">{color}</span>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-800">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={!name.trim()}>
            {initialRole ? t('common.save') : t('common.add')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
