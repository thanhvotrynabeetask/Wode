import { useEffect } from 'react';
import { AppShell } from './components/layout/AppShell';
import { ToastContainer } from './components/common/Toast';
import { SettingsDialog } from './components/settings/SettingsDialog';
import { useSettingsStore } from './store/useSettingsStore';
import { FileSystemService } from './services/FileSystemService';
import { LoggerService } from './services/LoggerService';
import { useBeforeUnload } from './hooks/useBeforeUnload';

export default function App() {
  const { workspaceHandle, theme } = useSettingsStore();

  // Đảm bảo bật cảnh báo rời trang nếu sơ đồ có thay đổi chưa lưu
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
    LoggerService.info('App', 'Khởi động ứng dụng Wode (Sẵn sàng làm việc ngay lập tức)');
  }, [workspaceHandle]);

  return (
    <>
      <AppShell />
      <SettingsDialog />
      <ToastContainer />
    </>
  );
}
