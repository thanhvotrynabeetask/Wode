import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen, title, message,
  confirmLabel = 'Xác nhận', cancelLabel = 'Hủy',
  variant = 'primary',
  onConfirm, onCancel,
}) => (
  <Modal isOpen={isOpen} onClose={onCancel} title={title} size="sm">
    <p className="text-sm text-gray-600 dark:text-slate-300 mb-5">{message}</p>
    <div className="flex justify-end gap-2">
      <Button variant="ghost" onClick={onCancel}>{cancelLabel}</Button>
      <Button variant={variant} onClick={onConfirm}>{confirmLabel}</Button>
    </div>
  </Modal>
);
