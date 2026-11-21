import React, { useRef, useState } from 'react';
import { Save, Settings, FolderOpen, FilePlus, Download, Upload, ChevronDown } from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { useUIStore } from '../../store/useUIStore';
import { Button } from '../common/Button';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { FileSystemService } from '../../services/FileSystemService';
import { ExportService, ExportOptions } from '../../services/ExportService';
import { ImportService } from '../../services/ImportService';
import { APP_NAME } from '../../utils/constants';

export const Header: React.FC = () => {
  const { schema, isDirty, setProjectName, loadSchema, newProject, markClean } = useProjectStore();
  const { openSettings, addToast } = useUIStore();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(schema.metadata.project_name);
  const [showNewConfirm, setShowNewConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

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
      const res = await FileSystemService.saveProject(schema);
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
      const fileName = await ExportService.exportHTML(schema, options);
      addToast('success', `Đã xuất HTML ${darkMode ? '(Dark Mode)' : '(Light Mode)'}: ${fileName}`);
    } catch (err) {
      addToast('error', `Lỗi khi xuất HTML: ${(err as Error).message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const loaded = await ImportService.parseFile(file);
      loadSchema(loaded);
      setNameInput(loaded.metadata.project_name);
      addToast('success', `Đã mở dự án từ ${file.name}`);
    } catch (err) {
      addToast('error', `Không thể mở file: ${(err as Error).message}`);
    } finally {
      e.target.value = '';
    }
  };

  const handleNewProjectClick = () => {
    if (isDirty) {
      setShowNewConfirm(true);
    } else {
      newProject();
      setNameInput('Untitled Project');
      addToast('info', 'Đã tạo dự án mới');
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
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" title="Chưa lưu" />
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
          title="Mở file .json hoặc .html từ máy"
        >
          Mở
        </Button>

        <Button
          variant={isDirty ? 'primary' : 'secondary'}
          size="sm"
          icon={<Save size={15} />}
          loading={isSaving}
          onClick={handleSave}
          title="Lưu file vào Workspace"
        >
          Lưu
        </Button>

        <div className="w-px h-5 bg-gray-200 mx-1" />

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

        <div className="w-px h-5 bg-gray-200 mx-1" />

        <Button
          variant="ghost"
          size="sm"
          icon={<Settings size={15} />}
          onClick={openSettings}
          title="Cài đặt Workspace & Giao diện"
        />
      </header>

      {/* Confirm dialog for New Project when dirty */}
      {showNewConfirm && (
        <ConfirmDialog
          isOpen={true}
          title="Tạo sơ đồ mới"
          message="Bạn có những thay đổi chưa lưu. Bạn có chắc muốn tạo sơ đồ mới và bỏ qua các thay đổi hiện tại?"
          confirmLabel="Tạo mới"
          variant="danger"
          onConfirm={() => {
            newProject();
            setNameInput('Untitled Project');
            setShowNewConfirm(false);
            addToast('info', 'Đã tạo sơ đồ mới.');
          }}
          onCancel={() => setShowNewConfirm(false)}
        />
      )}
    </>
  );
};
