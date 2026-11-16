import React, { useState } from 'react';
import { FolderOpen, ArrowRight } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { Button } from '../common/Button';
import { APP_NAME } from '../../utils/constants';

export const WorkspacePicker: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setWorkspacePath, setWorkspaceHandle } = useSettingsStore();

  const handlePickFolder = async () => {
    setError(null);
    setLoading(true);
    try {
      if ('showDirectoryPicker' in window) {
        const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
        setWorkspaceHandle(handle);
        setWorkspacePath(handle.name);
      } else {
        const path = prompt('Nhập đường dẫn thư mục Workspace (ví dụ: C:/MyWorkflows):');
        if (path) setWorkspacePath(path);
        else setError('Vui lòng nhập đường dẫn thư mục.');
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError('Không thể truy cập thư mục. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-5 shadow-lg">
          <svg viewBox="0 0 32 32" fill="none" className="w-9 h-9">
            <rect x="3" y="8" width="10" height="7" rx="2" fill="white" fillOpacity="0.9" />
            <rect x="3" y="18" width="10" height="7" rx="2" fill="white" fillOpacity="0.6" />
            <rect x="19" y="12" width="10" height="7" rx="2" fill="white" fillOpacity="0.9" />
            <line x1="13" y1="11.5" x2="19" y2="15.5" stroke="white" strokeWidth="1.5" strokeOpacity="0.8" />
            <line x1="13" y1="21.5" x2="19" y2="15.5" stroke="white" strokeWidth="1.5" strokeOpacity="0.8" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">Chào mừng đến {APP_NAME}</h1>
        <p className="text-gray-500 text-sm mb-7 leading-relaxed">
          Workflow Diagram Builder chạy hoàn toàn Offline.
          <br />Chọn thư mục Workspace để bắt đầu — toàn bộ file sơ đồ và log sẽ được lưu tại đây.
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-left mb-6">
          <p className="text-xs text-amber-700 leading-relaxed">
            <strong>🔒 Bảo mật:</strong> Ứng dụng không gửi bất kỳ dữ liệu nào ra internet.
            Mọi thông tin chỉ được lưu trong thư mục bạn chọn.
          </p>
        </div>

        <Button
          variant="primary"
          size="lg"
          className="w-full justify-center"
          icon={<FolderOpen size={18} />}
          loading={loading}
          onClick={handlePickFolder}
        >
          Chọn thư mục Workspace
          <ArrowRight size={16} className="ml-auto" />
        </Button>

        {error && (
          <p className="mt-3 text-sm text-red-600">{error}</p>
        )}

        <p className="mt-5 text-xs text-gray-400">
          Bạn có thể thay đổi Workspace bất kỳ lúc nào trong phần Cài đặt.
        </p>
      </div>
    </div>
  );
};
