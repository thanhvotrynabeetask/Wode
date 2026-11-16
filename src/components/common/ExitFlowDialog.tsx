import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { useProjectStore } from '../../store/useProjectStore';
import { useUIStore } from '../../store/useUIStore';
import { FileSystemService } from '../../services/FileSystemService';
import { Save, AlertTriangle } from 'lucide-react';

interface ExitFlowDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExitConfirmed: () => void;
}

export const ExitFlowDialog: React.FC<ExitFlowDialogProps> = ({
  isOpen,
  onClose,
  onExitConfirmed,
}) => {
  const schema = useProjectStore((s) => s.schema);
  const markClean = useProjectStore((s) => s.markClean);
  const addToast = useUIStore((s) => s.addToast);
  const [saving, setSaving] = useState(false);

  const handleSaveAndExit = async () => {
    setSaving(true);
    try {
      const backupName = await FileSystemService.saveSessionBackup(schema);
      markClean();
      addToast('success', `Đã lưu snapshot phiên: ${backupName}`);
      onExitConfirmed();
      onClose();
    } catch (err) {
      addToast('error', `Lỗi khi lưu phiên: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleExitWithoutSave = () => {
    markClean();
    onExitConfirmed();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Xác nhận thoát phiên làm việc" size="md">
      <div className="space-y-4">
        <div className="flex items-start gap-3 text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
          <AlertTriangle size={20} className="shrink-0 mt-0.5" />
          <p className="text-xs text-amber-900 leading-relaxed">
            Bạn có các thay đổi chưa được lưu vào file dự án. Bạn có muốn lưu lại snapshot lịch sử phiên làm việc này vào thư mục Workspace trước khi thoát không?
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Button
            variant="primary"
            onClick={handleSaveAndExit}
            loading={saving}
            icon={<Save size={15} />}
            className="w-full justify-center"
          >
            Lưu & Thoát (Tạo session backup)
          </Button>

          <Button
            variant="danger"
            onClick={handleExitWithoutSave}
            disabled={saving}
            className="w-full justify-center"
          >
            Không lưu & Thoát
          </Button>

          <Button
            variant="ghost"
            onClick={onClose}
            disabled={saving}
            className="w-full justify-center"
          >
            Hủy (Quay lại làm việc)
          </Button>
        </div>
      </div>
    </Modal>
  );
};
