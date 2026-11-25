import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useUIStore } from '../../store/useUIStore';
import { useSettingsStore, KeybindingMap } from '../../store/useSettingsStore';
import { Button } from '../common/Button';
import { LoggerService } from '../../services/LoggerService';
import { FileSystemService } from '../../services/FileSystemService';
import { eventToShortcut } from '../../utils/keyboardUtils';
import { useTranslation } from '../../i18n';
import {
  FolderOpen,
  Palette,
  Keyboard,
  Terminal,
  Download,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Globe,
  Check,
} from 'lucide-react';

type SettingsTab = 'language' | 'appearance' | 'keybindings' | 'general';

export const SettingsDialog: React.FC = () => {
  const { isSettingsOpen, closeSettings, addToast } = useUIStore();
  const {
    workspacePath,
    setWorkspacePath,
    setWorkspaceHandle,
    clearWorkspace,
    theme,
    setTheme,
    language,
    setLanguage,
    enableDarkGlow,
    setEnableDarkGlow,
    keybindings,
    setKeybinding,
    resetKeybindings,
  } = useSettingsStore();

  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<SettingsTab>('language');
  const [showLogs, setShowLogs] = useState(false);
  const [recordingAction, setRecordingAction] = useState<keyof KeybindingMap | null>(null);

  const logs = LoggerService.getFormattedLogs();

  const handleDownloadLogs = () => {
    FileSystemService.downloadFile('app_execution.log', logs, 'text/plain');
    addToast('success', t('settings.workspace.downloadLogs'));
  };

  const handlePickWorkspace = async () => {
    try {
      if ('showDirectoryPicker' in window) {
        const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
        setWorkspaceHandle(handle);
        setWorkspacePath(handle.name);
        FileSystemService.setWorkspaceHandle(handle);
        addToast('success', `${t('settings.workspace.pathLabel')}: ${handle.name}`);
      } else {
        const path = prompt(t('settings.workspace.chooseFolder') + ':');
        if (path) {
          setWorkspacePath(path);
          addToast('success', `${t('settings.workspace.pathLabel')}: ${path}`);
        }
      }
    } catch (err: unknown) {
      if ((err as Error).name !== 'AbortError') {
        addToast('error', (err as Error).message);
      }
    }
  };

  const handleClearWorkspace = () => {
    clearWorkspace();
    FileSystemService.setWorkspaceHandle(null);
    addToast('info', t('settings.workspace.clearFolder'));
  };

  // Keyboard recorder for custom keybinding
  useEffect(() => {
    if (!recordingAction) return;

    const handleRecordKey = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) return;

      const shortcut = eventToShortcut(e);
      if (shortcut) {
        setKeybinding(recordingAction, shortcut);
        addToast('success', `${shortcut}`);
        setRecordingAction(null);
      }
    };

    window.addEventListener('keydown', handleRecordKey, true);
    return () => {
      window.removeEventListener('keydown', handleRecordKey, true);
    };
  }, [recordingAction, setKeybinding, addToast]);

  const keybindingKeys: Array<keyof KeybindingMap> = [
    'undo',
    'redo',
    'modeSelect',
    'modePan',
    'selectAll',
    'save',
    'zoomIn',
    'zoomOut',
    'fitScreen',
  ];

  return (
    <Modal isOpen={isSettingsOpen} onClose={closeSettings} title={t('settings.modalTitle')} size="lg">
      <div className="flex flex-col h-[460px]">
        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 dark:border-slate-800 shrink-0 gap-1 mb-4">
          <button
            onClick={() => setActiveTab('language')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'language'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Globe size={14} />
            {t('settings.tabs.language')}
          </button>

          <button
            onClick={() => setActiveTab('appearance')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'appearance'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Palette size={14} />
            {t('settings.tabs.appearance')}
          </button>

          <button
            onClick={() => setActiveTab('keybindings')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'keybindings'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Keyboard size={14} />
            {t('settings.tabs.keybindings')}
          </button>

          <button
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'general'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <FolderOpen size={14} />
            {t('settings.tabs.general')}
          </button>
        </div>

        {/* Tab 0: Language */}
        {activeTab === 'language' && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                {t('settings.language.title')}
              </label>
              <p className="text-gray-500 dark:text-slate-400 text-xs mb-3">
                {t('settings.language.desc')}
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                    language === 'en'
                      ? 'border-blue-600 ring-2 ring-blue-100 dark:ring-blue-900 bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                      : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/80 text-gray-700 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🇺🇸</span>
                    <div>
                      <p className="font-bold text-sm">English</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">Default (International)</p>
                    </div>
                  </div>
                  {language === 'en' && <Check size={18} className="text-blue-600 dark:text-blue-400" />}
                </button>

                <button
                  type="button"
                  onClick={() => setLanguage('vi')}
                  className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                    language === 'vi'
                      ? 'border-blue-600 ring-2 ring-blue-100 dark:ring-blue-900 bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                      : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/80 text-gray-700 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🇻🇳</span>
                    <div>
                      <p className="font-bold text-sm">Tiếng Việt</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">Ngôn ngữ Tiếng Việt</p>
                    </div>
                  </div>
                  {language === 'vi' && <Check size={18} className="text-blue-600 dark:text-blue-400" />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 1: Appearance & Dark Mode Glow */}
        {activeTab === 'appearance' && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                {t('settings.appearance.themeTitle')}
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between h-20 transition-all ${
                    theme === 'light'
                      ? 'border-blue-600 ring-2 ring-blue-100 dark:ring-blue-900 bg-blue-50/50 dark:bg-blue-950/40'
                      : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/80'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center text-white text-[10px]">
                    ☀️
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 dark:text-slate-200">{t('settings.appearance.lightTitle')}</p>
                    <p className="text-[10px] text-gray-500 dark:text-slate-400">{t('settings.appearance.lightDesc')}</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between h-20 transition-all ${
                    theme === 'dark'
                      ? 'border-blue-600 ring-2 ring-blue-100 dark:ring-blue-900 bg-slate-900 text-white'
                      : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 bg-slate-900/90 text-white'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-white text-[10px]">
                    🌙
                  </div>
                  <div>
                    <p className="font-bold text-slate-100">{t('settings.appearance.darkTitle')}</p>
                    <p className="text-[10px] text-slate-400">{t('settings.appearance.darkDesc')}</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('system')}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between h-20 transition-all ${
                    theme === 'system'
                      ? 'border-blue-600 ring-2 ring-blue-100 dark:ring-blue-900 bg-blue-50/50 dark:bg-blue-950/40'
                      : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/80'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-slate-400 flex items-center justify-center text-white text-[10px]">
                    💻
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 dark:text-slate-200">{t('settings.appearance.systemTitle')}</p>
                    <p className="text-[10px] text-gray-500 dark:text-slate-400">{t('settings.appearance.systemDesc')}</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Dark Glow Toggle */}
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Sparkles size={18} className="text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-gray-800 dark:text-slate-200 text-xs">
                    {t('settings.appearance.glowTitle')}
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    {t('settings.appearance.glowDesc')}
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
                <div className="w-9 h-5 bg-gray-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
              </label>
            </div>
          </div>
        )}

        {/* Tab 2: Keybindings */}
        {activeTab === 'keybindings' && (
          <div className="flex-1 overflow-y-auto pr-1 text-xs space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-gray-100 dark:border-slate-800">
              <p className="text-gray-500 dark:text-slate-400 text-[11px]">
                {t('settings.keybindings.desc')}
              </p>
              <button
                type="button"
                onClick={() => {
                  resetKeybindings();
                  addToast('info', t('settings.keybindings.resetDefault'));
                }}
                className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                <RotateCcw size={12} />
                {t('settings.keybindings.resetDefault')}
              </button>
            </div>

            <div className="space-y-2">
              {keybindingKeys.map((key) => {
                const isRecording = recordingAction === key;
                const shortcut = keybindings[key];
                const actionTitle = t(`settings.keybindings.actions.${key}.title`);
                const actionDesc = t(`settings.keybindings.actions.${key}.desc`);

                return (
                  <div
                    key={key}
                    className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 hover:bg-gray-100/70 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-slate-200 text-xs">{actionTitle}</p>
                      <p className="text-[10px] text-gray-500 dark:text-slate-400">{actionDesc}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setRecordingAction(isRecording ? null : key)}
                      className={`px-2.5 py-1 rounded-md font-mono text-xs font-bold transition-all shadow-2xs ${
                        isRecording
                          ? 'bg-amber-500 text-white animate-pulse ring-2 ring-amber-300'
                          : 'bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-200 border border-gray-300 dark:border-slate-700 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400'
                      }`}
                    >
                      {isRecording ? t('settings.keybindings.recordingPrompt') : shortcut}
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
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                {t('settings.workspace.title')}
              </label>
              <div className="flex items-center gap-2">
                <span className="flex-1 text-xs font-mono text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 truncate">
                  {workspacePath ? `📁 ${workspacePath}` : t('settings.workspace.noFolderSelected')}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<FolderOpen size={14} />}
                  onClick={handlePickWorkspace}
                >
                  {workspacePath ? t('common.edit') : t('settings.workspace.chooseFolder')}
                </Button>
                {workspacePath && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700 dark:text-red-400"
                    onClick={handleClearWorkspace}
                  >
                    {t('settings.workspace.clearFolder')}
                  </Button>
                )}
              </div>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 flex items-start gap-2.5">
              <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
                <strong>100% Client-Side & Local-First:</strong> Zero cloud storage, zero telemetry. All diagram data remains strictly on your local device.
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal size={14} className="text-gray-500 dark:text-slate-400" />
                  {t('settings.workspace.logsTitle')}
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowLogs(!showLogs)}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    {showLogs ? t('sidebar.collapse') : t('sidebar.expand')}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadLogs}
                    className="text-xs text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white flex items-center gap-1"
                  >
                    <Download size={12} />
                    {t('settings.workspace.downloadLogs')}
                  </button>
                </div>
              </div>

              {showLogs && (
                <div className="bg-slate-900 text-slate-200 font-mono text-[11px] p-3 rounded-lg max-h-40 overflow-y-auto leading-relaxed border border-slate-800">
                  {logs ? <pre className="whitespace-pre-wrap">{logs}</pre> : <span>No logs recorded.</span>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-gray-100 dark:border-slate-800 shrink-0">
          <Button variant="primary" size="sm" onClick={closeSettings}>
            {t('common.close')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
