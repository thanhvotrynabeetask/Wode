import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { RolePalette } from '../palette/RolePalette';
import { FrameList } from '../builder/FrameList';
import { DiagramCanvas } from '../canvas/DiagramCanvas';
import { useUIStore } from '../../store/useUIStore';

export const AppShell: React.FC = () => {
  const activePanel = useUIStore((s) => s.activePanel);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-100 dark:bg-slate-950">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar (320px width for cards and forms) */}
        <div className="w-80 shrink-0 flex flex-col h-full overflow-hidden border-r border-gray-200 dark:border-slate-800">
          <Sidebar>
            {activePanel === 'palette' && <RolePalette />}
            {activePanel === 'builder' && <FrameList />}
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
