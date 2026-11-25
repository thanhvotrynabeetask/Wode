import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS } from '../utils/constants';

export interface KeybindingMap {
  undo: string;
  redo: string;
  modeSelect: string;
  modePan: string;
  zoomIn: string;
  zoomOut: string;
  fitScreen: string;
  selectAll: string;
  save: string;
}

export const DEFAULT_KEYBINDINGS: KeybindingMap = {
  undo: 'Ctrl+Z',
  redo: 'Ctrl+Y',
  modeSelect: 'Ctrl+Q',
  modePan: 'Ctrl+A',
  zoomIn: 'Ctrl+=',
  zoomOut: 'Ctrl+-',
  fitScreen: 'Ctrl+0',
  selectAll: 'Ctrl+Shift+A',
  save: 'Ctrl+S',
};

interface SettingsState {
  workspacePath: string | null;
  workspaceHandle: FileSystemDirectoryHandle | null;
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'vi';
  enableDarkGlow: boolean;
  keybindings: KeybindingMap;
  lastOpenedFile: string | null;

  setWorkspacePath: (path: string) => void;
  setWorkspaceHandle: (handle: FileSystemDirectoryHandle | null) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setLanguage: (language: 'en' | 'vi') => void;
  setEnableDarkGlow: (enabled: boolean) => void;
  setKeybinding: (action: keyof KeybindingMap, shortcut: string) => void;
  resetKeybindings: () => void;
  setLastOpenedFile: (file: string | null) => void;
  clearWorkspace: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      workspacePath: null,
      workspaceHandle: null,
      theme: 'system',
      language: 'en',
      enableDarkGlow: true,
      keybindings: { ...DEFAULT_KEYBINDINGS },
      lastOpenedFile: null,

      setWorkspacePath: (path) => set({ workspacePath: path }),
      setWorkspaceHandle: (handle) => set({ workspaceHandle: handle }),
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setEnableDarkGlow: (enableDarkGlow) => set({ enableDarkGlow }),
      setKeybinding: (action, shortcut) =>
        set((s) => ({
          keybindings: { ...s.keybindings, [action]: shortcut },
        })),
      resetKeybindings: () => set({ keybindings: { ...DEFAULT_KEYBINDINGS } }),
      setLastOpenedFile: (file) => set({ lastOpenedFile: file }),
      clearWorkspace: () => set({ workspacePath: null, workspaceHandle: null, lastOpenedFile: null }),
    }),
    {
      name: STORAGE_KEYS.WORKSPACE_PATH,
      version: 2,
      migrate: (persisted: unknown) => {
        const state = (persisted || {}) as { keybindings?: Partial<KeybindingMap> };
        const stored = { ...DEFAULT_KEYBINDINGS, ...(state.keybindings || {}) };
        if (stored.modePan === 'Ctrl+W') stored.modePan = DEFAULT_KEYBINDINGS.modePan;
        if (stored.selectAll === 'Ctrl+A') stored.selectAll = DEFAULT_KEYBINDINGS.selectAll;
        return { ...state, keybindings: stored } as never;
      },
      partialize: (state) => ({
        workspacePath: state.workspacePath,
        theme: state.theme,
        language: state.language,
        enableDarkGlow: state.enableDarkGlow,
        keybindings: state.keybindings,
        lastOpenedFile: state.lastOpenedFile,
      }),
    }
  )
);
