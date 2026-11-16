import React from 'react';
import { Layers, List } from 'lucide-react';
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
  const { activePanel, setActivePanel } = useUIStore();

  return (
    <aside className="flex flex-col h-full bg-gray-50 dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800">
      <div className="flex border-b border-gray-200 dark:border-slate-800 shrink-0">
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
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </aside>
  );
};
