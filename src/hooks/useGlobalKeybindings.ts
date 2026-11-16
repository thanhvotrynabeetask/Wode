import { useEffect } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';
import { useProjectStore } from '../store/useProjectStore';
import { useUIStore } from '../store/useUIStore';
import { matchesShortcut } from '../utils/keyboardUtils';
import { FileSystemService } from '../services/FileSystemService';

export function useGlobalKeybindings(allInstanceIds: string[], onFitToScreen?: () => void): void {
  const { keybindings } = useSettingsStore();
  const { undo, redo, schema, markClean } = useProjectStore();
  const { setInteractionMode, selectAllInstances, setZoom, zoom, addToast } = useUIStore();

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      const isInputActive = activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select';

      // Always intercept Ctrl+W to prevent closing tab!
      if (matchesShortcut(e, keybindings.modePan) || (e.ctrlKey && e.key.toLowerCase() === 'w')) {
        e.preventDefault();
        setInteractionMode('pan');
        addToast('info', 'Chế độ: Di chuyển Canvas (Pan)');
        return;
      }

      if (matchesShortcut(e, keybindings.modeSelect) || (e.ctrlKey && e.key.toLowerCase() === 'q')) {
        e.preventDefault();
        setInteractionMode('select');
        addToast('info', 'Chế độ: Chọn và Kéo (Select)');
        return;
      }

      // If user is actively typing in an input field, do not trigger canvas shortcuts
      if (isInputActive) return;

      // Undo (Ctrl+Z)
      if (matchesShortcut(e, keybindings.undo) || (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'z')) {
        e.preventDefault();
        undo();
        addToast('info', 'Đã hoàn tác (Undo)');
        return;
      }

      // Redo (Ctrl+Y or Ctrl+Shift+Z)
      if (
        matchesShortcut(e, keybindings.redo) ||
        (e.ctrlKey && e.key.toLowerCase() === 'y') ||
        (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        e.preventDefault();
        redo();
        addToast('info', 'Đã làm lại (Redo)');
        return;
      }

      // Select All (Ctrl+A)
      if (matchesShortcut(e, keybindings.selectAll) || (e.ctrlKey && e.key.toLowerCase() === 'a')) {
        e.preventDefault();
        selectAllInstances(allInstanceIds);
        addToast('info', `Đã chọn tất cả ${allInstanceIds.length} nhiệm vụ`);
        return;
      }

      // Save (Ctrl+S)
      if (matchesShortcut(e, keybindings.save) || (e.ctrlKey && e.key.toLowerCase() === 's')) {
        e.preventDefault();
        try {
          const res = await FileSystemService.saveProject(schema);
          markClean();
          addToast('success', `Đã lưu dự án: ${res.fileName}`);
        } catch (err) {
          addToast('error', `Lỗi lưu: ${(err as Error).message}`);
        }
        return;
      }

      // Zoom In (Ctrl+=)
      if (matchesShortcut(e, keybindings.zoomIn) || (e.ctrlKey && e.key === '=')) {
        e.preventDefault();
        setZoom(Number((zoom + 0.1).toFixed(2)));
        return;
      }

      // Zoom Out (Ctrl+-)
      if (matchesShortcut(e, keybindings.zoomOut) || (e.ctrlKey && e.key === '-')) {
        e.preventDefault();
        setZoom(Number((zoom - 0.1).toFixed(2)));
        return;
      }

      // Fit Screen (Ctrl+0)
      if (matchesShortcut(e, keybindings.fitScreen) || (e.ctrlKey && e.key === '0')) {
        e.preventDefault();
        if (onFitToScreen) onFitToScreen();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [keybindings, undo, redo, schema, markClean, setInteractionMode, selectAllInstances, setZoom, zoom, addToast, allInstanceIds, onFitToScreen]);
}
