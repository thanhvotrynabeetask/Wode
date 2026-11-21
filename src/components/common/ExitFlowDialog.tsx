import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { useProjectStore } from '../../store/useProjectStore';
import { useUIStore } from '../../store/useUIStore';
import { FileSystemService } from '../../services/FileSystemService';
import { Save, AlertTriangle, ArrowRight, X } from 'lucide-react';

export interface ExitFlowDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmExit: () => void;
  title?: string;
  description?: string;
  saveButtonLabel?: string;
  discardButtonLabel?: string;
}

export const ExitFlowDialog: React.FC<ExitFlowDialogProps> = ({
  isOpen,
  onClose,
  onConfirmExit,
  title = 'Xác nhận lưu sơ đồ',
  description = 'Sơ đồ của bạn có các thay đổi chưa được lưu. Bạn có muốn lưu lại sơ đồ trước khi rời khỏi hoặc đóng phiên làm việc không?',
  saveButtonLabel = 'Lưu sơ đồ & Tiếp tục',
  discardButtonLabel = 'Không lưu & Tiếp tục',
}) => {
  const schema = useProjectStore((s) => s.schema);
  const markClean = useProjectStore((s) => s.markClean);
  const addToast = useUIStore((s) => s.addToast);
  const [saving, setSaving] = useState(false);

  const handleSaveAndExit = async () => {
    setSaving(true);
    try {
      const res = await FileSystemService.saveProject(schema);
      if (res && res.canceled) {
        // Người dùng đã hủy hộp thoại chọn file lưu
        return;
      }
      markClean();
      addToast('success', `Đã lưu sơ đồ: ${res.fileName}`);
      onClose();
      onConfirmExit();
    } catch (err) {
      addToast('error', `Lỗi khi lưu sơ đồ: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleExitWithoutSave = () => {
    markClean();
    onClose();
    onConfirmExit();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <div className="space-y-4">
        <div className="flex items-start gap-3 text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60 rounded-xl p-3.5">
          <AlertTriangle size={20} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <p className="text-xs leading-relaxed">
            {description}
          </p>
        </div>

        <div className="flex flex-col gap-2.5 pt-2">
          <Button
            variant="primary"
            onClick={handleSaveAndExit}
            loading={saving}
            icon={<Save size={15} />}
            className="w-full justify-center py-2.5 text-xs font-semibold shadow-xs"
          >
            {saveButtonLabel}
            <ArrowRight size={14} className="ml-1" />
          </Button>

          <Button
            variant="danger"
            onClick={handleExitWithoutSave}
            disabled={saving}
            icon={<X size={15} />}
            className="w-full justify-center py-2 text-xs"
          >
            {discardButtonLabel}
          </Button>

          <Button
            variant="ghost"
            onClick={onClose}
            disabled={saving}
            className="w-full justify-center py-2 text-xs text-gray-500 hover:text-gray-700 dark:text-slate-400"
          >
            Hủy (Quay lại chỉnh sửa)
          </Button>
        </div>
      </div>
    </Modal>
  );
};
