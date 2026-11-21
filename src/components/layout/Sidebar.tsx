import React from 'react';
import { Layers, List, ChevronLeft, ChevronRight } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { ActivePanel } from '../../types/state';

const tabs: { id: ActivePanel; label: string; icon: React.ReactNode }[] = [
  { id: 'palette', label: 'Kho Node', icon: <Layers size={16} /> },
  { id: 'builder', label: 'Luồng', icon: <List size={16} /> },
];

interface SidebarProps {
  children?: React.ReactNode;
}

export const Sidebar: React.FC<SidebarProps> = ({ children }) => {
  const { activePanel, setActivePanel, isSidebarExpanded, toggleSidebar } = useUIStore();

  return (
    <aside className="relative flex flex-col h-full bg-gray-50 dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 transition-all duration-300">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 shrink-0">
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
              {isSidebarExpanded && tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={toggleSidebar}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          title={isSidebarExpanded ? 'Thu gọn sidebar' : 'Mở rộng sidebar'}
        >
          {isSidebarExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {isSidebarExpanded ? children : null}
      </div>
    </aside>
  );
};
