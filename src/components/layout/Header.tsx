import React, { useRef, useState } from 'react';
import { Save, Settings, FolderOpen, FilePlus, Download, Upload, ChevronDown, LogOut } from 'lucide-react';
import { useProjectStore, syncActiveDiagramToDiagrams } from '../../store/useProjectStore';
import { useUIStore } from '../../store/useUIStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { Button } from '../common/Button';
import { ExitFlowDialog } from '../common/ExitFlowDialog';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { FileSystemService } from '../../services/FileSystemService';
import { ExportService, ExportOptions } from '../../services/ExportService';
import { ImportService } from '../../services/ImportService';
import { APP_NAME } from '../../utils/constants';

type PendingAction = 'new' | 'exit' | 'open';

export const Header: React.FC = () => {
  const { schema, isDirty, setProjectName, loadSchema, newProject, markClean } = useProjectStore();
  const { openSettings, addToast } = useUIStore();
  const workspacePath = useSettingsStore((s) => s.workspacePath);

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(schema.metadata.project_name);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Dialog states for exit / reset flow
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showCleanExitConfirm, setShowCleanExitConfirm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const exportButtonRef = useRef<HTMLDivElement>(null);

  const handleNameBlur = () => {
    setEditingName(false);
    if (nameInput.trim()) setProjectName(nameInput.trim());
    else setNameInput(schema.metadata.project_name);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const fullSchema = {
        ...schema,
        diagrams: syncActiveDiagramToDiagrams(schema),
      };
      const res = await FileSystemService.saveProject(fullSchema);
      if (res && res.canceled) {
        return;
      }
      markClean();
      addToast('success', `Đã lưu dự án: ${res.fileName}`);
    } catch (err) {
      addToast('error', `Lỗi khi lưu: ${(err as Error).message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportHTML = async (darkMode: boolean) => {
    setShowExportMenu(false);
    setIsExporting(true);
    try {
      const options: ExportOptions = { darkMode };
      const fullSchema = {
        ...schema,
        diagrams: syncActiveDiagramToDiagrams(schema),
      };
      const fileName = await ExportService.exportHTML(fullSchema, options);
      addToast('success', `Đã xuất HTML ${darkMode ? '(Dark Mode)' : '(Light Mode)'}: ${fileName}`);
    } catch (err) {
      addToast('error', `Lỗi khi xuất HTML: ${(err as Error).message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const executeLoadFile = async (file: File) => {
    try {
      const loaded = await ImportService.parseFile(file);
      loadSchema(loaded);
      setNameInput(loaded.metadata.project_name);
      addToast('success', `Đã mở dự án từ ${file.name}`);
    } catch (err) {
      addToast('error', `Không thể mở file: ${(err as Error).message}`);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isDirty) {
      setPendingFile(file);
      setPendingAction('open');
    } else {
      await executeLoadFile(file);
    }
    e.target.value = '';
  };

  const handleNewProjectClick = () => {
    if (isDirty) {
      setPendingAction('new');
    } else {
      newProject();
      setNameInput('Untitled Project');
      addToast('info', 'Đã tạo dự án mới');
    }
  };

  const handleExitClick = () => {
    if (isDirty) {
      setPendingAction('exit');
    } else {
      const hasContent = schema.frames.length > 0 || schema.roles.length > 0;
      if (hasContent) {
        setShowCleanExitConfirm(true);
      } else {
        addToast('info', 'Sơ đồ đang ở trạng thái trống.');
      }
    }
  };

  const handleConfirmPendingAction = async () => {
    const action = pendingAction;
    const file = pendingFile;
    setPendingAction(null);
    setPendingFile(null);

    if (action === 'new') {
      newProject();
      setNameInput('Untitled Project');
      addToast('info', 'Đã tạo sơ đồ mới.');
    } else if (action === 'exit') {
      newProject();
      setNameInput('Untitled Project');
      addToast('info', 'Đã đóng phiên làm việc.');
    } else if (action === 'open' && file) {
      await executeLoadFile(file);
    }
  };

  // Close export menu when clicking outside
  React.useEffect(() => {
    if (!showExportMenu) return;
    const handler = (e: MouseEvent) => {
      if (exportButtonRef.current && !exportButtonRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showExportMenu]);

  return (
    <>
      <header className="h-12 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center px-4 gap-3 shrink-0 z-[60]">
        {/* Hidden File Input for Open / Import */}
        <input
          type="file"
          ref={fileInputRef}
          accept=".json,.html"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Logo */}
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-base select-none mr-2">
          <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
            <rect x="1" y="4" width="6" height="5" rx="1" fill="currentColor" fillOpacity="0.9" />
            <rect x="1" y="11" width="6" height="5" rx="1" fill="currentColor" fillOpacity="0.5" />
            <rect x="13" y="7" width="6" height="5" rx="1" fill="currentColor" fillOpacity="0.9" />
            <line x1="7" y1="6.5" x2="13" y2="9.5" stroke="currentColor" strokeWidth="1" strokeOpacity="0.7" />
            <line x1="7" y1="13.5" x2="13" y2="9.5" stroke="currentColor" strokeWidth="1" strokeOpacity="0.7" />
          </svg>
          {APP_NAME}
        </div>

        {/* Project name */}
        {editingName ? (
          <input
            autoFocus
            className="text-sm font-semibold text-gray-800 dark:text-slate-100 border-b-2 border-blue-500 outline-none bg-transparent px-1 py-0.5 w-52"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleNameBlur();
              if (e.key === 'Escape') {
                setEditingName(false);
                setNameInput(schema.metadata.project_name);
              }
            }}
          />
        ) : (
          <span
            className="text-sm font-semibold text-gray-800 dark:text-slate-100 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 px-1.5 py-0.5 rounded hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            onClick={() => {
              setEditingName(true);
              setNameInput(schema.metadata.project_name);
            }}
            title="Click để đổi tên sơ đồ"
          >
            {schema.metadata.project_name}
            {isDirty && (
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" title="Chưa lưu thay đổi" />
            )}
          </span>
        )}

        <div className="flex-1" />

        {/* Action Buttons */}
        <Button
          variant="ghost"
          size="sm"
          icon={<FilePlus size={15} />}
          onClick={handleNewProjectClick}
          title="Tạo sơ đồ mới"
        >
          Mới
        </Button>

        <Button
          variant="ghost"
          size="sm"
          icon={<FolderOpen size={15} />}
          onClick={() => fileInputRef.current?.click()}
          title="Mở file .json hoặc .html từ máy tính"
        >
          Mở
        </Button>

        <Button
          variant={isDirty ? 'primary' : 'secondary'}
          size="sm"
          icon={<Save size={15} />}
          loading={isSaving}
          onClick={handleSave}
          title={workspacePath ? `Lưu vào Workspace: ${workspacePath}` : 'Lưu file sơ đồ (.json)'}
        >
          Lưu
        </Button>

        <div className="w-px h-5 bg-gray-200 dark:bg-slate-700 mx-1" />

        <Button
          variant="ghost"
          size="sm"
          icon={<Upload size={15} />}
          onClick={() => fileInputRef.current?.click()}
          title="Nhập dữ liệu từ file .html hoặc .json"
        >
          Import
        </Button>

        {/* Export Dropdown */}
        <div ref={exportButtonRef} className="relative">
          <Button
            variant="ghost"
            size="sm"
            icon={<Download size={15} />}
            loading={isExporting}
            onClick={() => setShowExportMenu((v) => !v)}
            title="Xuất file HTML độc lập chứa toàn bộ sơ đồ"
          >
            Export
            <ChevronDown size={12} className="ml-0.5" />
          </Button>

          {showExportMenu && (
            <div
              className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl z-50 py-1"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <button
                className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"
                onClick={() => handleExportHTML(false)}
              >
                <span className="w-3 h-3 rounded-full bg-white border border-gray-300" />
                Light Mode
              </button>
              <button
                className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"
                onClick={() => handleExportHTML(true)}
              >
                <span className="w-3 h-3 rounded-full bg-slate-900 border border-slate-600" />
                Dark Mode + Glow
              </button>
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-gray-200 dark:bg-slate-700 mx-1" />

        <Button
          variant="ghost"
          size="sm"
          icon={<Settings size={15} />}
          onClick={openSettings}
          title="Cài đặt Workspace, Giao diện & Phím tắt"
        />

        <Button
          variant="ghost"
          size="sm"
          icon={<LogOut size={15} />}
          onClick={handleExitClick}
          title="Thoát / Đóng sơ đồ hiện tại"
          className="text-gray-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
        />
      </header>

      {/* Exit / Unsaved changes confirmation dialog */}
      <ExitFlowDialog
        isOpen={pendingAction !== null}
        onClose={() => {
          setPendingAction(null);
          setPendingFile(null);
        }}
        onConfirmExit={handleConfirmPendingAction}
        title={
          pendingAction === 'new'
            ? 'Xác nhận tạo sơ đồ mới'
            : pendingAction === 'open'
            ? 'Xác nhận mở sơ đồ khác'
            : 'Xác nhận đóng sơ đồ'
        }
        description={
          pendingAction === 'new'
            ? 'Sơ đồ hiện tại có những thay đổi chưa được lưu. Bạn có muốn lưu sơ đồ trước khi tạo sơ đồ mới không?'
            : pendingAction === 'open'
            ? 'Sơ đồ hiện tại có những thay đổi chưa được lưu. Bạn có muốn lưu sơ đồ trước khi mở file mới không?'
            : 'Sơ đồ hiện tại có những thay đổi chưa được lưu. Bạn có muốn lưu sơ đồ trước khi đóng phiên làm việc không?'
        }
        saveButtonLabel={
          pendingAction === 'new'
            ? 'Lưu sơ đồ & Tạo mới'
            : pendingAction === 'open'
            ? 'Lưu sơ đồ & Mở file'
            : 'Lưu sơ đồ & Thoát'
        }
        discardButtonLabel={
          pendingAction === 'new'
            ? 'Không lưu & Tạo mới'
            : pendingAction === 'open'
            ? 'Không lưu & Mở file'
            : 'Không lưu & Thoát'
        }
      />

      {/* Clean Exit Confirmation (when no dirty changes, but user clicks Exit with content) */}
      {showCleanExitConfirm && (
        <ConfirmDialog
          isOpen={true}
          title="Đóng sơ đồ hiện tại"
          message="Bạn có chắc muốn đóng sơ đồ này và bắt đầu lại với khung vẽ trống không?"
          confirmLabel="Đóng sơ đồ"
          variant="primary"
          onConfirm={() => {
            newProject();
            setNameInput('Untitled Project');
            setShowCleanExitConfirm(false);
            addToast('info', 'Đã đóng sơ đồ.');
          }}
          onCancel={() => setShowCleanExitConfirm(false)}
        />
      )}
    </>
  );
};
