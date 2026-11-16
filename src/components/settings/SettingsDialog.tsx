import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useUIStore } from '../../store/useUIStore';
import { useSettingsStore, KeybindingMap } from '../../store/useSettingsStore';
import { Button } from '../common/Button';
import { LoggerService } from '../../services/LoggerService';
import { FileSystemService } from '../../services/FileSystemService';
import { eventToShortcut } from '../../utils/keyboardUtils';
import {
  FolderOpen,
  Palette,
  Keyboard,
  Terminal,
  Download,
  ShieldCheck,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

type SettingsTab = 'general' | 'appearance' | 'keybindings';

const KEYBINDING_LABELS: Record<keyof KeybindingMap, { title: string; desc: string }> = {
  undo: { title: 'Hoàn tác (Undo)', desc: 'Khôi phục thao tác trước đó' },
  redo: { title: 'Làm lại (Redo)', desc: 'Thực hiện lại thao tác vừa hoàn tác' },
  modeSelect: { title: 'Chế độ Chọn / Kéo', desc: 'Chọn node, di chuyển vị trí trong làn' },
  modePan: { title: 'Chế độ Di chuyển (Pan)', desc: 'Kéo di chuyển góc nhìn Canvas' },
  selectAll: { title: 'Chọn tất cả', desc: 'Chọn toàn bộ node trên sơ đồ' },
  save: { title: 'Lưu dự án', desc: 'Lưu vào thư mục Workspace' },
  zoomIn: { title: 'Phóng to (+)', desc: 'Tăng mức thu phóng' },
  zoomOut: { title: 'Thu nhỏ (-)', desc: 'Giảm mức thu phóng' },
  fitScreen: { title: 'Vừa màn hình (Fit)', desc: 'Căn khung nhìn bao quát sơ đồ' },
};

export const SettingsDialog: React.FC = () => {
  const { isSettingsOpen, closeSettings, addToast } = useUIStore();
  const {
    workspacePath,
    clearWorkspace,
    theme,
    setTheme,
    enableDarkGlow,
    setEnableDarkGlow,
    keybindings,
    setKeybinding,
    resetKeybindings,
  } = useSettingsStore();

  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');
  const [showLogs, setShowLogs] = useState(false);
  const [recordingAction, setRecordingAction] = useState<keyof KeybindingMap | null>(null);

  const logs = LoggerService.getFormattedLogs();

  const handleDownloadLogs = () => {
    FileSystemService.downloadFile('app_execution.log', logs, 'text/plain');
    addToast('success', 'Đã tải file app_execution.log');
  };

  // Keyboard recorder for custom keybinding
  useEffect(() => {
    if (!recordingAction) return;

    const handleRecordKey = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Ignore single modifier presses
      if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) return;

      const shortcut = eventToShortcut(e);
      if (shortcut) {
        setKeybinding(recordingAction, shortcut);
        addToast('success', `Đã đổi phím tắt "${KEYBINDING_LABELS[recordingAction].title}" thành ${shortcut}`);
        setRecordingAction(null);
      }
    };

    window.addEventListener('keydown', handleRecordKey, true);
    return () => {
      window.removeEventListener('keydown', handleRecordKey, true);
    };
  }, [recordingAction, setKeybinding, addToast]);

  return (
    <Modal isOpen={isSettingsOpen} onClose={closeSettings} title="Cài Đặt Hệ Thống" size="lg">
      <div className="flex flex-col h-[460px]">
        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 shrink-0 gap-1 mb-4">
          <button
            onClick={() => setActiveTab('appearance')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'appearance'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Palette size={14} />
            Giao Diện & Glow
          </button>

          <button
            onClick={() => setActiveTab('keybindings')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'keybindings'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Keyboard size={14} />
            Phím Tắt & Điều Khiển
          </button>

          <button
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'general'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <FolderOpen size={14} />
            Workspace & Log
          </button>
        </div>

        {/* Tab 1: Appearance & Dark Mode Glow */}
        {activeTab === 'appearance' && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Chế độ giao diện (Theme)
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between h-20 transition-all ${
                    theme === 'light'
                      ? 'border-blue-600 ring-2 ring-blue-100 bg-blue-50/50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center text-white text-[10px]">
                    ☀️
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">Giao diện sáng</p>
                    <p className="text-[10px] text-gray-500">Nền trắng thanh lịch</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between h-20 transition-all ${
                    theme === 'dark'
                      ? 'border-blue-600 ring-2 ring-blue-100 bg-slate-900 text-white'
                      : 'border-gray-200 hover:border-gray-300 bg-slate-900/90 text-white'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-white text-[10px]">
                    🌙
                  </div>
                  <div>
                    <p className="font-bold text-slate-100">Giao diện tối</p>
                    <p className="text-[10px] text-slate-400">Dịu mắt ban đêm</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('system')}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between h-20 transition-all ${
                    theme === 'system'
                      ? 'border-blue-600 ring-2 ring-blue-100 bg-blue-50/50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-slate-400 flex items-center justify-center text-white text-[10px]">
                    💻
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">Theo hệ thống</p>
                    <p className="text-[10px] text-gray-500">Đồng bộ OS</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Dark Glow Toggle (Requirement 3) */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Sparkles size={18} className="text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-gray-800 text-xs">
                    Hiệu ứng phát sáng nhẹ (Luminous Glow)
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                    Khi bật Dark Mode, các node và đường nối flow sẽ tỏa sáng nhẹ theo màu sắc nhận diện giúp phân biệt quy trình rõ ràng và ấn tượng.
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={enableDarkGlow}
                  onChange={(e) => setEnableDarkGlow(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
              </label>
            </div>
          </div>
        )}

        {/* Tab 2: Keybindings & Shortcuts Management (Requirement 4 & 5) */}
        {activeTab === 'keybindings' && (
          <div className="flex-1 overflow-y-auto pr-1 text-xs space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-gray-100">
              <p className="text-gray-500 text-[11px]">
                Click vào phím tắt bất kỳ để bấm tổ hợp phím mới thay đổi.
              </p>
              <button
                type="button"
                onClick={() => {
                  resetKeybindings();
                  addToast('info', 'Đã đặt lại toàn bộ phím tắt mặc định.');
                }}
                className="flex items-center gap-1 text-[11px] text-blue-600 hover:underline font-medium"
              >
                <RotateCcw size={12} />
                Mặc định
              </button>
            </div>

            <div className="space-y-2">
              {(Object.keys(KEYBINDING_LABELS) as Array<keyof KeybindingMap>).map((key) => {
                const isRecording = recordingAction === key;
                const shortcut = keybindings[key];
                const meta = KEYBINDING_LABELS[key];

                return (
                  <div
                    key={key}
                    className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100/70 transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-gray-800 text-xs">{meta.title}</p>
                      <p className="text-[10px] text-gray-500">{meta.desc}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setRecordingAction(isRecording ? null : key)}
                      className={`px-2.5 py-1 rounded-md font-mono text-xs font-bold transition-all shadow-2xs ${
                        isRecording
                          ? 'bg-amber-500 text-white animate-pulse ring-2 ring-amber-300'
                          : 'bg-white text-gray-800 border border-gray-300 hover:border-blue-500 hover:text-blue-600'
                      }`}
                    >
                      {isRecording ? 'Bấm phím mới...' : shortcut}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Workspace & Log */}
        {activeTab === 'general' && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Thư mục Workspace (Local-first)
              </label>
              <div className="flex items-center gap-2">
                <span className="flex-1 text-xs font-mono text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 truncate">
                  {workspacePath ?? 'Chưa chọn'}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    clearWorkspace();
                    closeSettings();
                  }}
                >
                  Đổi thư mục
                </Button>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-start gap-2.5">
              <ShieldCheck size={18} className="text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-800 leading-relaxed">
                <strong>100% Offline & Bảo Mật:</strong> Không API ngoài, không telemetry. Dữ liệu chỉ nằm trong máy cá nhân.
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal size={14} className="text-gray-500" />
                  Nhật ký (app_execution.log)
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowLogs(!showLogs)}
                    className="text-xs text-blue-600 hover:underline font-medium"
                  >
                    {showLogs ? 'Thu gọn' : 'Xem nhật ký'}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadLogs}
                    className="text-xs text-gray-600 hover:text-gray-900 flex items-center gap-1"
                  >
                    <Download size={12} />
                    Tải log
                  </button>
                </div>
              </div>

              {showLogs && (
                <div className="bg-slate-900 text-slate-200 font-mono text-[11px] p-3 rounded-lg max-h-40 overflow-y-auto leading-relaxed border border-slate-800">
                  {logs ? <pre className="whitespace-pre-wrap">{logs}</pre> : <span>Chưa có nhật ký.</span>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-gray-100 shrink-0">
          <Button variant="primary" size="sm" onClick={closeSettings}>
            Đóng
          </Button>
        </div>
      </div>
    </Modal>
  );
};
