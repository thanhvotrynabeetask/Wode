import React from 'react';
import { Header } from './Header';
import { TabBar } from './TabBar';
import { Sidebar } from './Sidebar';
import { RolePalette } from '../palette/RolePalette';
import { FrameList } from '../builder/FrameList';
import { ConnectionPanel } from '../connections/ConnectionPanel';
import { DiagramCanvas } from '../canvas/DiagramCanvas';
import { useUIStore } from '../../store/useUIStore';

export const AppShell: React.FC = () => {
  const activePanel = useUIStore((s) => s.activePanel);
  const isSidebarExpanded = useUIStore((s) => s.isSidebarExpanded);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-100 dark:bg-slate-950">
      <Header />
      <TabBar />
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div
          className={`shrink-0 flex flex-col h-full overflow-hidden border-r border-gray-200 dark:border-slate-800 transition-all duration-300 ${
            isSidebarExpanded ? 'w-80' : 'w-12'
          }`}
        >
          <Sidebar>
            {activePanel === 'palette' && <RolePalette />}
            {activePanel === 'builder' && <FrameList />}
            {activePanel === 'connections' && <ConnectionPanel />}
          </Sidebar>
        </div>

        {/* Right Canvas */}
        <main className="flex-1 overflow-hidden relative bg-gray-50 dark:bg-[#0B0F17]">
          <DiagramCanvas />
        </main>
      </div>
    </div>
  );
};
