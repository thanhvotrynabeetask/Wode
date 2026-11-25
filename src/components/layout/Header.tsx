import React, { useRef, useState, useEffect } from 'react';
import { Save, Settings, FolderOpen, FilePlus, Download, Upload, ChevronDown, LogOut, Layers, Bot, Globe } from 'lucide-react';
import { useProjectStore, syncActiveDiagramToDiagrams } from '../../store/useProjectStore';
import { useUIStore } from '../../store/useUIStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { Button } from '../common/Button';
import { ExitFlowDialog } from '../common/ExitFlowDialog';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { MCPStatusModal } from '../common/MCPStatusModal';
import { useMCPLiveSync } from '../../hooks/useMCPLiveSync';
import { FileSystemService } from '../../services/FileSystemService';
import { ExportService, ExportOptions } from '../../services/ExportService';
import { ImportService } from '../../services/ImportService';
import { APP_NAME } from '../../utils/constants';
import { useTranslation } from '../../i18n';

type PendingAction = 'new' | 'exit' | 'open';

export const Header: React.FC = () => {
  const { schema, isDirty, setProjectName, loadSchema, appendDiagramFromFile, newProject, markClean } = useProjectStore();
  const { openSettings, addToast } = useUIStore();
  const workspacePath = useSettingsStore((s) => s.workspacePath);
  const { isConnected: isMCPConnected } = useMCPLiveSync();
  const { t, language, setLanguage } = useTranslation();

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(schema.metadata.project_name);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showOpenMenu, setShowOpenMenu] = useState(false);
  const [showMCPModal, setShowMCPModal] = useState(false);
  const openModeRef = useRef<'replace' | 'append'>('replace');

  // Dialog states for exit / reset flow
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showCleanExitConfirm, setShowCleanExitConfirm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const openButtonRef = useRef<HTMLDivElement>(null);
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

    const currentMode = openModeRef.current;
    // Reset mode back to default for subsequent actions
    openModeRef.current = 'replace';

    if (currentMode === 'append') {
      try {
        const loaded = await ImportService.parseFile(file);
        const result = appendDiagramFromFile(loaded);
        addToast(
          'success',
          `Đã mở thêm sơ đồ độc lập "${result.diagramTitle}" ngay bên dưới sơ đồ hiện có để đối chiếu!`
        );
      } catch (err) {
        addToast('error', `Không thể mở sơ đồ bổ sung: ${(err as Error).message}`);
      }
      e.target.value = '';
      return;
    }

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
      const hasContent =
        schema.frames.length > 0 || schema.roles.length > 0 || (schema.nodes || []).length > 0;
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

  // Close dropdown menus when clicking outside
  useEffect(() => {
    if (!showExportMenu && !showOpenMenu) return;
    const handler = (e: MouseEvent) => {
      if (exportButtonRef.current && !exportButtonRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
      if (openButtonRef.current && !openButtonRef.current.contains(e.target as Node)) {
        setShowOpenMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showExportMenu, showOpenMenu]);

  // Support triggering file open from other components (e.g. CanvasSubToolbar)
  useEffect(() => {
    const handleCustomOpen = (e: Event) => {
      const customEvent = e as CustomEvent<{ mode?: 'replace' | 'append' }>;
      openModeRef.current = customEvent.detail?.mode || 'replace';
      fileInputRef.current?.click();
    };
    window.addEventListener('wode:open-file', handleCustomOpen);
    return () => window.removeEventListener('wode:open-file', handleCustomOpen);
  }, []);

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
          title={t('header.newDiagram')}
        >
          {t('common.add')}
        </Button>

        {/* Open Dropdown */}
        <div ref={openButtonRef} className="relative">
          <Button
            variant="ghost"
            size="sm"
            icon={<FolderOpen size={15} />}
            onClick={() => setShowOpenMenu((v) => !v)}
            title={t('header.openDiagram')}
          >
            {t('header.openDiagram').split(' ')[0]}
            <ChevronDown size={12} className="ml-0.5" />
          </Button>

          {showOpenMenu && (
            <div
              className="absolute left-0 top-full mt-1 w-72 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl z-50 py-1"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <button
                className="w-full text-left px-3 py-2 text-xs text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 flex flex-col gap-0.5"
                onClick={() => {
                  setShowOpenMenu(false);
                  openModeRef.current = 'replace';
                  fileInputRef.current?.click();
                }}
              >
                <span className="font-semibold flex items-center gap-1.5 text-gray-800 dark:text-slate-100">
                  <FolderOpen size={14} className="text-blue-500" />
                  {t('header.openReplace')}
                </span>
              </button>

              <div className="border-t border-gray-100 dark:border-slate-700 my-1" />

              <button
                className="w-full text-left px-3 py-2 text-xs text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 flex flex-col gap-0.5"
                onClick={() => {
                  setShowOpenMenu(false);
                  openModeRef.current = 'append';
                  fileInputRef.current?.click();
                }}
              >
                <span className="font-semibold flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <Layers size={14} />
                  {t('header.openAppend')}
                </span>
              </button>
            </div>
          )}
        </div>

        <Button
          variant={isDirty ? 'primary' : 'secondary'}
          size="sm"
          icon={<Save size={15} />}
          loading={isSaving}
          onClick={handleSave}
          title={workspacePath ? `${t('header.saveProject')}: ${workspacePath}` : t('header.saveProject')}
        >
          {t('common.save')}
        </Button>

        <div className="w-px h-5 bg-gray-200 dark:bg-slate-700 mx-1" />

        <Button
          variant="ghost"
          size="sm"
          icon={<Upload size={15} />}
          onClick={() => fileInputRef.current?.click()}
          title="Import JSON / HTML"
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
            title={t('header.exportMenu')}
          >
            {t('header.exportMenu')}
            <ChevronDown size={12} className="ml-0.5" />
          </Button>

          {showExportMenu && (
            <div
              className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl z-50 py-1"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <button
                className="w-full text-left px-3 py-2 text-xs text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"
                onClick={() => handleExportHTML(false)}
              >
                <span className="w-3 h-3 rounded-full bg-white border border-gray-300" />
                {t('header.exportHTMLLight')}
              </button>
              <button
                className="w-full text-left px-3 py-2 text-xs text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"
                onClick={() => handleExportHTML(true)}
              >
                <span className="w-3 h-3 rounded-full bg-slate-900 border border-slate-600" />
                {t('header.exportHTMLDark')}
              </button>
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-gray-200 dark:bg-slate-700 mx-1" />

        {/* Language Quick Switcher */}
        <button
          type="button"
          onClick={() => setLanguage(language === 'en' ? 'vi' : 'en')}
          className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          title={language === 'en' ? 'Chuyển sang Tiếng Việt' : 'Switch to English'}
        >
          <Globe size={13} className="text-blue-500" />
          <span>{language === 'en' ? 'EN' : 'VI'}</span>
        </button>

        {/* MCP Agent Connector Status */}
        <Button
          variant={isMCPConnected ? 'primary' : 'ghost'}
          size="sm"
          icon={<Bot size={15} className={isMCPConnected ? 'text-emerald-300 animate-pulse' : 'text-gray-400'} />}
          onClick={() => setShowMCPModal(true)}
          title={isMCPConnected ? t('header.mcpConnected') : t('header.mcpStandby')}
          className={isMCPConnected ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-medium' : 'text-gray-600 dark:text-slate-300'}
        >
          <span className="hidden sm:inline">MCP</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          icon={<Settings size={15} />}
          onClick={openSettings}
          title={t('header.settings')}
        />

        <Button
          variant="ghost"
          size="sm"
          icon={<LogOut size={15} />}
          onClick={handleExitClick}
          title={t('header.exit')}
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

      {/* MCP Connector Info Modal */}
      <MCPStatusModal
        isOpen={showMCPModal}
        onClose={() => setShowMCPModal(false)}
        isConnected={isMCPConnected}
      />
    </>
  );
};
