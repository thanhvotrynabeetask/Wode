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
  Layers,
  Plus,
  ChevronUp,
  ChevronDown,
  Trash2,
  Edit3,
  Check,
  X,
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
    addDiagram,
    removeDiagram,
    moveDiagram,
    updateDiagramTitle,
    setActiveDiagram,
  } = useProjectStore();

  const { keybindings } = useSettingsStore();

  const [showSpacingPopover, setShowSpacingPopover] = useState(false);
  const [showDiagramPopover, setShowDiagramPopover] = useState(false);
  const [editingDiagId, setEditingDiagId] = useState<string | null>(null);
  const [diagTitleInput, setDiagTitleInput] = useState('');

  const selectedCount = selection.selectedInstanceIds.length;
  const currentSpacing = schema.settings.horizontal_spacing !== undefined ? schema.settings.horizontal_spacing : 40;

  // Resolve diagram list
  const diagrams =
    schema.diagrams && schema.diagrams.length > 0
      ? [...schema.diagrams].sort((a, b) => a.order - b.order)
      : [
          {
            id: schema.active_diagram_id || 'diag_1',
            title: schema.metadata?.project_name || 'Sơ đồ 1',
            order: 1,
            frames: schema.frames || [],
          },
        ];
  const activeId = schema.active_diagram_id || diagrams[0].id;
  const activeDiagram = diagrams.find((d) => d.id === activeId) || diagrams[0];

  return (
    <div className="h-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-slate-800 px-3 flex items-center justify-between gap-2 shrink-0 z-20 select-none shadow-xs text-xs text-gray-700 dark:text-slate-200">
      {/* Left: Undo / Redo + Mode Selector + Multi-selection */}
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

      {/* Middle: Diagram Management (Multi-diagram stacked below) & Spacing */}
      <div className="flex items-center gap-2">
        {/* Diagram Selector & Management Popover */}
        <div className="relative">
          <button
            onClick={() => {
              setShowDiagramPopover(!showDiagramPopover);
              setShowSpacingPopover(false);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-colors ${
              showDiagramPopover
                ? 'bg-blue-50 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700'
            }`}
            title="Quản lý và sắp xếp các sơ đồ trong dự án (xếp tầng trên dưới)"
          >
            <Layers size={13} className="text-blue-600 dark:text-blue-400" />
            <span className="font-semibold max-w-[130px] truncate">{activeDiagram?.title || 'Sơ đồ 1'}</span>
            <span className="text-[10px] font-mono text-gray-400">
              (#{activeDiagram?.order || 1}/{diagrams.length})
            </span>
            <ChevronDown size={11} className="text-gray-400" />
          </button>

          {showDiagramPopover && (
            <div className="absolute top-full left-0 mt-1.5 w-84 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-800 p-3 z-30">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100 dark:border-slate-800">
                <div>
                  <h4 className="font-bold text-gray-800 dark:text-slate-100 text-xs flex items-center gap-1.5">
                    <Layers size={13} className="text-blue-600" />
                    Quản lý Sơ đồ ({diagrams.length})
                  </h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Sơ đồ xếp theo thứ tự từ trên xuống dưới trên Canvas
                  </p>
                </div>
                <button
                  onClick={() => {
                    addDiagram();
                    addToast('success', 'Đã thêm sơ đồ mới nằm ở dưới tiếp theo!');
                  }}
                  className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded-md text-[11px] font-medium transition-colors shadow-xs"
                  title="Thêm một sơ đồ mới nằm ở dưới tiếp theo"
                >
                  <Plus size={12} />
                  <span>+ Thêm sơ đồ</span>
                </button>
              </div>

              {/* Diagram List */}
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-0.5">
                {diagrams.map((diag, idx) => {
                  const isActive = diag.id === activeId;
                  const totalNodes = diag.frames.reduce((sum, f) => sum + f.nodes.length, 0);

                  return (
                    <div
                      key={diag.id}
                      onClick={() => setActiveDiagram(diag.id)}
                      className={`group p-2 rounded-lg border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-400 dark:border-blue-600 shadow-xs'
                          : 'bg-gray-50/50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                              isActive
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-300'
                            }`}
                          >
                            #{diag.order}
                          </span>

                          {editingDiagId === diag.id ? (
                            <div
                              className="flex items-center gap-1 flex-1 min-w-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="text"
                                autoFocus
                                value={diagTitleInput}
                                onChange={(e) => setDiagTitleInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    updateDiagramTitle(diag.id, diagTitleInput);
                                    setEditingDiagId(null);
                                  }
                                  if (e.key === 'Escape') setEditingDiagId(null);
                                }}
                                className="w-full text-xs border border-blue-400 rounded px-1.5 py-0.5 outline-none bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                              />
                              <button
                                onClick={() => {
                                  updateDiagramTitle(diag.id, diagTitleInput);
                                  setEditingDiagId(null);
                                }}
                                className="text-green-600 hover:text-green-700 p-0.5"
                              >
                                <Check size={12} />
                              </button>
                              <button
                                onClick={() => setEditingDiagId(null)}
                                className="text-gray-400 hover:text-gray-600 p-0.5"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ) : (
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1">
                                <span
                                  className="font-semibold text-xs text-gray-800 dark:text-slate-100 truncate"
                                  title={diag.title}
                                >
                                  {diag.title}
                                </span>
                                {isActive && (
                                  <span className="text-[9px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/60 px-1 py-0.2 rounded shrink-0">
                                    Đang sửa
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-gray-500 dark:text-slate-400">
                                {diag.frames.length} phân đoạn • {totalNodes} nhiệm vụ
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Actions: Reorder Up/Down, Rename, Delete */}
                        {editingDiagId !== diag.id && (
                          <div
                            className="flex items-center gap-0.5 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              disabled={idx === 0}
                              onClick={() => {
                                moveDiagram(diag.id, 'up');
                                addToast('info', `Đã chuyển "${diag.title}" lên trên`);
                              }}
                              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-gray-200 dark:hover:bg-slate-700 rounded disabled:opacity-20 transition-colors"
                              title="Chuyển sơ đồ lên trên"
                            >
                              <ChevronUp size={13} />
                            </button>
                            <button
                              disabled={idx === diagrams.length - 1}
                              onClick={() => {
                                moveDiagram(diag.id, 'down');
                                addToast('info', `Đã chuyển "${diag.title}" xuống dưới`);
                              }}
                              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-gray-200 dark:hover:bg-slate-700 rounded disabled:opacity-20 transition-colors"
                              title="Chuyển sơ đồ xuống dưới"
                            >
                              <ChevronDown size={13} />
                            </button>
                            <button
                              onClick={() => {
                                setEditingDiagId(diag.id);
                                setDiagTitleInput(diag.title);
                              }}
                              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-gray-200 dark:hover:bg-slate-700 rounded transition-colors"
                              title="Đổi tên sơ đồ"
                            >
                              <Edit3 size={13} />
                            </button>
                            {diagrams.length > 1 && (
                              <button
                                onClick={() => {
                                  if (confirm(`Bạn có chắc muốn xóa "${diag.title}"?`)) {
                                    removeDiagram(diag.id);
                                    addToast('info', `Đã xóa "${diag.title}"`);
                                  }
                                }}
                                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded transition-colors"
                                title="Xóa sơ đồ này"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-slate-800 flex justify-between items-center text-[11px]">
                <span className="text-gray-400">Click sơ đồ để chọn chỉnh sửa</span>
                <button
                  onClick={() => setShowDiagramPopover(false)}
                  className="text-gray-500 hover:text-gray-800 dark:hover:text-slate-300 font-medium"
                >
                  Đóng
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Spacing Popover */}
        <div className="relative">
          <button
            onClick={() => {
              setShowSpacingPopover(!showSpacingPopover);
              setShowDiagramPopover(false);
            }}
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
                    currentSpacing === 24
                      ? 'bg-blue-50 dark:bg-blue-900/40 border-blue-400 font-bold text-blue-700 dark:text-blue-300'
                      : 'hover:bg-gray-50 dark:hover:bg-slate-800 border-gray-200 dark:border-slate-700'
                  }`}
                >
                  Gọn (24px)
                </button>
                <button
                  onClick={() => setHorizontalSpacing(40)}
                  className={`py-1 text-[10px] rounded border ${
                    currentSpacing === 40
                      ? 'bg-blue-50 dark:bg-blue-900/40 border-blue-400 font-bold text-blue-700 dark:text-blue-300'
                      : 'hover:bg-gray-50 dark:hover:bg-slate-800 border-gray-200 dark:border-slate-700'
                  }`}
                >
                  Chuẩn (40px)
                </button>
                <button
                  onClick={() => setHorizontalSpacing(72)}
                  className={`py-1 text-[10px] rounded border ${
                    currentSpacing === 72
                      ? 'bg-blue-50 dark:bg-blue-900/40 border-blue-400 font-bold text-blue-700 dark:text-blue-300'
                      : 'hover:bg-gray-50 dark:hover:bg-slate-800 border-gray-200 dark:border-slate-700'
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
