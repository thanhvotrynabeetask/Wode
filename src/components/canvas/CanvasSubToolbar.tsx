import React, { useState } from 'react';
import { useUIStore } from '../../store/useUIStore';
import { useProjectStore } from '../../store/useProjectStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import {
  MousePointer,
  Hand,
  CheckSquare,
  XSquare,
  MoveHorizontal,
  Sliders,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Sparkles,
  Undo2,
  Redo2,
} from 'lucide-react';
import { CANVAS_DEFAULTS } from '../../utils/constants';

interface CanvasSubToolbarProps {
  totalNodes: number;
  allInstanceIds: string[];
  onFitToScreen: () => void;
}

export const CanvasSubToolbar: React.FC<CanvasSubToolbarProps> = ({
  allInstanceIds,
  onFitToScreen,
}) => {
  const {
    interactionMode,
    setInteractionMode,
    selection,
    selectAllInstances,
    clearSelection,
    zoom,
    setZoom,
    resetView,
    addToast,
  } = useUIStore();

  const {
    schema,
    setHorizontalSpacing,
    resetNodePositions,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useProjectStore();

  const { keybindings } = useSettingsStore();

  const [showSpacingPopover, setShowSpacingPopover] = useState(false);

  const selectedCount = selection.selectedInstanceIds.length;
  const currentSpacing = schema.settings.horizontal_spacing !== undefined ? schema.settings.horizontal_spacing : 40;

  return (
    <div className="h-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-slate-800 px-3 flex items-center justify-between gap-2 shrink-0 z-20 select-none shadow-xs text-xs text-gray-700 dark:text-slate-200">
      {/* Left: Mode Selection (Select / Pan) + Undo / Redo */}
      <div className="flex items-center gap-1.5">
        {/* Undo & Redo (Requirement 1) */}
        <div className="flex items-center bg-gray-100 dark:bg-slate-800 p-0.5 rounded-lg border border-gray-200 dark:border-slate-700">
          <button
            onClick={() => {
              undo();
              addToast('info', 'Đã hoàn tác (Undo)');
            }}
            disabled={!canUndo()}
            className="p-1 rounded text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none hover:bg-white dark:hover:bg-slate-700 transition-colors"
            title={`Hoàn tác (${keybindings.undo})`}
          >
            <Undo2 size={13} />
          </button>
          <button
            onClick={() => {
              redo();
              addToast('info', 'Đã làm lại (Redo)');
            }}
            disabled={!canRedo()}
            className="p-1 rounded text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none hover:bg-white dark:hover:bg-slate-700 transition-colors"
            title={`Làm lại (${keybindings.redo})`}
          >
            <Redo2 size={13} />
          </button>
        </div>

        <div className="w-px h-4 bg-gray-200 dark:bg-slate-800 mx-0.5" />

        {/* Mode Selector (Requirement 4) */}
        <div className="flex bg-gray-100 dark:bg-slate-800 p-0.5 rounded-lg border border-gray-200 dark:border-slate-700">
          <button
            onClick={() => setInteractionMode('select')}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors font-medium text-xs ${
              interactionMode === 'select'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            title={`Chế độ Chọn và Kéo (${keybindings.modeSelect})`}
          >
            <MousePointer size={13} />
            <span>Chọn</span>
            <kbd className="text-[10px] font-mono opacity-60 bg-gray-200 dark:bg-slate-600 px-1 py-0.2 rounded">
              {keybindings.modeSelect}
            </kbd>
          </button>

          <button
            onClick={() => setInteractionMode('pan')}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors font-medium text-xs ${
              interactionMode === 'pan'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            title={`Chế độ Di chuyển Canvas (${keybindings.modePan})`}
          >
            <Hand size={13} />
            <span>Kéo bàn</span>
            <kbd className="text-[10px] font-mono opacity-60 bg-gray-200 dark:bg-slate-600 px-1 py-0.2 rounded">
              {keybindings.modePan}
            </kbd>
          </button>
        </div>

        <div className="w-px h-4 bg-gray-200 dark:bg-slate-800 mx-0.5" />

        {/* Multi-selection info */}
        {selectedCount > 0 ? (
          <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-md">
            <span className="font-semibold text-xs">Đã chọn: {selectedCount}</span>
            <button
              onClick={clearSelection}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 p-0.5 ml-1"
              title="Bỏ chọn tất cả"
            >
              <XSquare size={13} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              selectAllInstances(allInstanceIds);
              addToast('info', `Đã chọn tất cả ${allInstanceIds.length} nhiệm vụ`);
            }}
            className="flex items-center gap-1 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-slate-800"
            title={`Chọn tất cả các node (${keybindings.selectAll})`}
          >
            <CheckSquare size={13} />
            <span>Chọn tất cả</span>
          </button>
        )}
      </div>

      {/* Middle: Horizontal Spacing & Auto-align */}
      <div className="flex items-center gap-1.5">
        <div className="relative">
          <button
            onClick={() => setShowSpacingPopover(!showSpacingPopover)}
            className={`flex items-center gap-1 px-2 py-1 rounded-md border text-xs font-medium transition-colors ${
              showSpacingPopover
                ? 'bg-blue-50 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700'
            }`}
            title="Chỉnh khoảng cách ngang giữa các node"
          >
            <MoveHorizontal size={13} className="text-gray-500 dark:text-slate-400" />
            <span>Khoảng cách: {currentSpacing}px</span>
          </button>

          {showSpacingPopover && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 w-60 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-gray-200 dark:border-slate-800 p-3 z-30">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-800 dark:text-slate-200 flex items-center gap-1">
                  <Sliders size={12} className="text-blue-600 dark:text-blue-400" />
                  Khoảng cách ngang
                </span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-xs">
                  {currentSpacing}px
                </span>
              </div>

              <input
                type="range"
                min="16"
                max="120"
                step="4"
                value={currentSpacing}
                onChange={(e) => setHorizontalSpacing(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer mb-2"
              />

              <div className="grid grid-cols-3 gap-1 pt-1 border-t border-gray-100 dark:border-slate-800">
                <button
                  onClick={() => setHorizontalSpacing(24)}
                  className={`py-1 text-[10px] rounded border ${
                    currentSpacing === 24 ? 'bg-blue-50 dark:bg-blue-900/40 border-blue-400 font-bold text-blue-700 dark:text-blue-300' : 'hover:bg-gray-50 dark:hover:bg-slate-800 border-gray-200 dark:border-slate-700'
                  }`}
                >
                  Gọn (24px)
                </button>
                <button
                  onClick={() => setHorizontalSpacing(40)}
                  className={`py-1 text-[10px] rounded border ${
                    currentSpacing === 40 ? 'bg-blue-50 dark:bg-blue-900/40 border-blue-400 font-bold text-blue-700 dark:text-blue-300' : 'hover:bg-gray-50 dark:hover:bg-slate-800 border-gray-200 dark:border-slate-700'
                  }`}
                >
                  Chuẩn (40px)
                </button>
                <button
                  onClick={() => setHorizontalSpacing(72)}
                  className={`py-1 text-[10px] rounded border ${
                    currentSpacing === 72 ? 'bg-blue-50 dark:bg-blue-900/40 border-blue-400 font-bold text-blue-700 dark:text-blue-300' : 'hover:bg-gray-50 dark:hover:bg-slate-800 border-gray-200 dark:border-slate-700'
                  }`}
                >
                  Rộng (72px)
                </button>
              </div>

              <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => setShowSpacingPopover(false)}
                  className="text-[11px] text-gray-500 hover:text-gray-800 dark:hover:text-slate-300"
                >
                  Xong
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => {
            resetNodePositions();
            addToast('info', 'Đã căn đều lại vị trí các node theo làn bơi.');
          }}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          title="Tự động căn đều lại tọa độ ngang của tất cả các node"
        >
          <Sparkles size={13} className="text-amber-500" />
          <span>Căn đều vị trí</span>
        </button>
      </div>

      {/* Right: Zoom & Navigation */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setZoom(Math.max(CANVAS_DEFAULTS.ZOOM_MIN, Number((zoom - CANVAS_DEFAULTS.ZOOM_STEP).toFixed(2))))}
          className="p-1.5 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded"
          title={`Thu nhỏ (${keybindings.zoomOut})`}
        >
          <ZoomOut size={14} />
        </button>

        <span
          onClick={resetView}
          className="text-xs font-mono font-semibold px-1.5 py-0.5 rounded hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer w-11 text-center"
          title="Click để reset 100%"
        >
          {Math.round(zoom * 100)}%
        </span>

        <button
          onClick={() => setZoom(Math.min(CANVAS_DEFAULTS.ZOOM_MAX, Number((zoom + CANVAS_DEFAULTS.ZOOM_STEP).toFixed(2))))}
          className="p-1.5 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded"
          title={`Phóng to (${keybindings.zoomIn})`}
        >
          <ZoomIn size={14} />
        </button>

        <div className="w-px h-4 bg-gray-200 dark:bg-slate-800 mx-1" />

        <button
          onClick={onFitToScreen}
          className="p-1.5 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded"
          title={`Vừa màn hình (${keybindings.fitScreen})`}
        >
          <Maximize2 size={14} />
        </button>

        <button
          onClick={resetView}
          className="p-1.5 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded"
          title="Căn giữa lại (Reset view)"
        >
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  );
};
