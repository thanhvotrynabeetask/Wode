import React from 'react';
import { Layers, List, ChevronRight } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { ActivePanel } from '../../types/state';
import { useTranslation } from '../../i18n';

interface SidebarProps {
  children?: React.ReactNode;
}

export const Sidebar: React.FC<SidebarProps> = ({ children }) => {
  const { activePanel, setActivePanel, isSidebarExpanded, toggleSidebar } = useUIStore();
  const { t } = useTranslation();

  const tabs: { id: ActivePanel; label: string; icon: React.ReactNode }[] = [
    { id: 'palette', label: t('sidebar.paletteTab'), icon: <Layers size={16} /> },
    { id: 'builder', label: t('sidebar.builderTab'), icon: <List size={16} /> },
  ];

  if (!isSidebarExpanded) {
    return (
      <aside className="relative flex flex-col h-full bg-gray-50 dark:bg-slate-900 transition-all duration-300 items-center">
        {/* Toggle Expand Button at the top */}
        <div className="w-full h-10 flex items-center justify-center border-b border-gray-200 dark:border-slate-800 shrink-0">
          <button
            onClick={toggleSidebar}
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-gray-200/70 dark:hover:bg-slate-800 rounded-md transition-colors"
            title={t('sidebar.expand')}
          >
            <ChevronRight size={17} />
          </button>
        </div>

        {/* Tab icons stacked vertically in collapsed mode */}
        <div className="flex flex-col items-center gap-1.5 py-2 w-full">
          {tabs.map((tab) => {
            const isActive = activePanel === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActivePanel(tab.id);
                  toggleSidebar();
                }}
                className={[
                  'w-9 h-9 flex items-center justify-center rounded-lg transition-all',
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800 shadow-xs font-bold border border-blue-200 dark:border-blue-900/60'
                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800/60',
                ].join(' ')}
                title={`${tab.label} (${t('sidebar.expand')})`}
              >
                {tab.icon}
              </button>
            );
          })}
        </div>
      </aside>
    );
  }

  return (
    <aside className="relative flex flex-col h-full bg-gray-50 dark:bg-slate-900 transition-all duration-300">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 shrink-0 px-1">
        <div className="flex flex-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActivePanel(tab.id)}
              className={[
                'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors',
                activePanel === tab.id
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-white dark:bg-slate-900 font-bold'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800',
              ].join(' ')}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
        <button
          onClick={toggleSidebar}
          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-200/60 dark:hover:bg-slate-800 rounded transition-colors mr-1"
          title={t('sidebar.collapse')}
        >
          <ChevronRight size={15} className="rotate-180" />
        </button>
      </div>

      <div className="flex-1 overflow-hidden">{children}</div>
    </aside>
  );
};
