import { useEffect } from 'react';
import { WorkspacePicker } from './components/settings/WorkspacePicker';
import { AppShell } from './components/layout/AppShell';
import { ToastContainer } from './components/common/Toast';
import { SettingsDialog } from './components/settings/SettingsDialog';
import { useSettingsStore } from './store/useSettingsStore';
import { FileSystemService } from './services/FileSystemService';
import { LoggerService } from './services/LoggerService';
import { useBeforeUnload } from './hooks/useBeforeUnload';

export default function App() {
  const { workspacePath, workspaceHandle, theme } = useSettingsStore();

  useBeforeUnload();

  // Handle Dark mode theme class on document element
  useEffect(() => {
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    document.documentElement.classList.toggle('dark', isDark);

    if (theme === 'system') {
      const listener = (e: MediaQueryListEvent) => {
        document.documentElement.classList.toggle('dark', e.matches);
      };
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [theme]);

  useEffect(() => {
    if (workspaceHandle) {
      FileSystemService.setWorkspaceHandle(workspaceHandle);
    }
    LoggerService.info('App', 'Khởi động ứng dụng Wode (100% Offline Local-first)');
  }, [workspaceHandle]);

  if (!workspacePath) {
    return (
      <>
        <WorkspacePicker />
        <ToastContainer />
      </>
    );
  }

  return (
    <>
      <AppShell />
      <SettingsDialog />
      <ToastContainer />
    </>
  );
}
