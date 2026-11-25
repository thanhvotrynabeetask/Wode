import React, { useState } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { useUIStore } from '../../store/useUIStore';
import { useTranslation } from '../../i18n';
import { Plus, X, Bot, Layout, Check } from 'lucide-react';

export const TabBar: React.FC = () => {
  const { tabs, activeTabId, switchTab, createTab, closeTab, renameTab } = useProjectStore();
  const { clearSelection } = useUIStore();
  const { t } = useTranslation();

  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const handleStartRename = (e: React.MouseEvent, tabId: string, currentTitle: string) => {
    e.stopPropagation();
    setEditingTabId(tabId);
    setEditingTitle(currentTitle);
  };

  const handleSaveRename = (tabId: string) => {
    if (editingTitle.trim()) {
      renameTab(tabId, editingTitle.trim());
    }
    setEditingTabId(null);
  };

  const handleSelectTab = (tabId: string) => {
    if (tabId !== activeTabId) {
      clearSelection();
      switchTab(tabId);
    }
  };

  const handleClose = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    closeTab(tabId);
  };

  return (
    <div className="h-9 bg-gray-100 dark:bg-slate-950 border-b border-gray-200 dark:border-slate-800 px-2 flex items-center justify-between gap-1 select-none z-10 shrink-0">
      {/* Scrollable Tabs List */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar flex-1 h-full py-1">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const isAgent = tab.type === 'agent';

          return (
            <div
              key={tab.id}
              onClick={() => handleSelectTab(tab.id)}
              onDoubleClick={(e) => handleStartRename(e, tab.id, tab.title)}
              className={`group relative flex items-center gap-1.5 px-3 h-full rounded-md text-xs font-medium cursor-pointer transition-all border shrink-0 max-w-[200px] ${
                isActive
                  ? isAgent
                    ? 'bg-white dark:bg-slate-900 border-purple-400 dark:border-purple-600 text-purple-700 dark:text-purple-300 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-blue-400 dark:border-blue-600 text-blue-700 dark:text-blue-300 shadow-xs'
                  : 'bg-transparent border-transparent hover:bg-gray-200/60 dark:hover:bg-slate-800/60 text-gray-600 dark:text-slate-400'
              }`}
            >
              {/* Tab Icon */}
              {isAgent ? (
                <Bot
                  size={13}
                  className={`shrink-0 ${isActive ? 'text-purple-600 dark:text-purple-400' : 'text-purple-400'}`}
                />
              ) : (
                <Layout
                  size={12}
                  className={`shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}
                />
              )}

              {/* Title / Inline Rename Input */}
              {editingTabId === tab.id ? (
                <div
                  className="flex items-center gap-1 flex-1 min-w-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="text"
                    autoFocus
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveRename(tab.id);
                      if (e.key === 'Escape') setEditingTabId(null);
                    }}
                    onBlur={() => handleSaveRename(tab.id)}
                    className="w-full text-xs bg-white dark:bg-slate-800 border border-blue-400 rounded px-1 py-0.2 outline-none text-gray-900 dark:text-white"
                  />
                  <button
                    onClick={() => handleSaveRename(tab.id)}
                    className="text-green-600 hover:text-green-700 p-0.5 shrink-0"
                  >
                    <Check size={11} />
                  </button>
                </div>
              ) : (
                <span className="truncate flex-1" title={tab.title}>
                  {tab.title}
                </span>
              )}

              {/* Unread / Active Agent Pulse Badge */}
              {tab.hasUnreadUpdate && (
                <span
                  className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"
                  title="Có cập nhật mới từ AI Agent / New update from AI Agent"
                />
              )}

              {/* Unsaved changes dot indicator */}
              {tab.isDirty && !tab.hasUnreadUpdate && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" title="Chưa lưu" />
              )}

              {/* Close Tab Button (Hidden if only 1 tab) */}
              {tabs.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => handleClose(e, tab.id)}
                  className="p-0.5 rounded text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-slate-800 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  title={t('common.close')}
                >
                  <X size={11} />
                </button>
              )}
            </div>
          );
        })}

        {/* New Tab Button */}
        <button
          type="button"
          onClick={() => createTab()}
          className="flex items-center justify-center w-7 h-7 rounded-md text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/70 dark:hover:bg-slate-800 transition-colors shrink-0"
          title="Tạo Tab mới / New Workspace Tab"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
};
