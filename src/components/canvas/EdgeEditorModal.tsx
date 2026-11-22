import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { LayoutEdge } from '../../services/LayoutEngine';
import { FlowType, BorderSide, NodeBorderAnchor } from '../../types/schema';
import { Palette, Route, Trash2, Crosshair, ArrowRight } from 'lucide-react';

interface EdgeEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  edge: LayoutEdge | null;
  fromNodeTitle?: string;
  toNodeTitle?: string;
  onSave: (updates: {
    message_label: string;
    flow_type: FlowType;
    color?: string;
    source_anchor?: NodeBorderAnchor;
    target_anchor?: NodeBorderAnchor;
  }) => void;
  onDelete?: () => void;
  onEditRoute?: () => void;
  onResetRoute?: () => void;
}

const PRESET_EDGE_COLORS = [
  '#64748B', // Slate
  '#2563EB', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#EC4899', // Pink
];

const BORDER_SIDES: { side: BorderSide; label: string }[] = [
  { side: 'right', label: 'Bên phải' },
  { side: 'left', label: 'Bên trái' },
  { side: 'top', label: 'Phía trên' },
  { side: 'bottom', label: 'Phía dưới' },
];

export const EdgeEditorModal: React.FC<EdgeEditorModalProps> = ({
  isOpen,
  onClose,
  edge,
  fromNodeTitle = 'Node nguồn',
  toNodeTitle = 'Node đích',
  onSave,
  onDelete,
  onEditRoute,
  onResetRoute,
}) => {
  const [label, setLabel] = useState('');
  const [flowType, setFlowType] = useState<FlowType>('solid');
  const [color, setColor] = useState('#64748B');
  const [sourceSide, setSourceSide] = useState<BorderSide>('right');
  const [targetSide, setTargetSide] = useState<BorderSide>('left');

  useEffect(() => {
    if (edge) {
      setLabel(edge.label || '');
      setFlowType(edge.flowType || 'solid');
      setColor(edge.color || (edge.isMacro ? '#6366F1' : '#64748B'));
      setSourceSide(edge.sourceAnchor?.side || 'right');
      setTargetSide(edge.targetAnchor?.side || 'left');
    }
  }, [edge, isOpen]);

  if (!edge) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      message_label: label.trim(),
      flow_type: flowType,
      color,
      source_anchor: { side: sourceSide, ratio: 0.5 },
      target_anchor: { side: targetSide, ratio: 0.5 },
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tùy Chỉnh Luồng Dữ Liệu (Message Flow)" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Source -> Target Info */}
        <div className="bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700/80 rounded-lg p-2.5 text-xs text-gray-600 dark:text-slate-300 flex items-center justify-between">
          <span className="font-semibold text-gray-800 dark:text-slate-200 truncate max-w-[42%]" title={fromNodeTitle}>
            {fromNodeTitle}
          </span>
          <span className="text-gray-400 dark:text-slate-500">⟶</span>
          <span className="font-semibold text-gray-800 dark:text-slate-200 truncate max-w-[42%]" title={toNodeTitle}>
            {toNodeTitle}
          </span>
        </div>

        {/* Flow Name / Message Label */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Tên luồng / Thông điệp
          </label>
          <input
            type="text"
            autoFocus
            placeholder="Ví dụ: Gửi payload JSON, Xác nhận token..."
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full text-xs bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
          />
        </div>

        {/* Border Touch Points (Vị trí 2 đầu tiếp xúc viền) */}
        <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Crosshair size={14} className="text-blue-600 dark:text-blue-400" />
              Điểm chạm trên viền Node (Endpoints)
            </label>
            {onEditRoute && (
              <button
                type="button"
                onClick={() => {
                  onEditRoute();
                  onClose();
                }}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1"
              >
                Kéo trực quan trên Canvas
                <ArrowRight size={12} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            {/* Source touch point */}
            <div>
              <p className="font-medium text-gray-600 dark:text-slate-400 mb-1.5 truncate" title={`Node nguồn: ${fromNodeTitle}`}>
                Đầu ra: <span className="font-semibold text-blue-600 dark:text-blue-400">{fromNodeTitle}</span>
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {BORDER_SIDES.map((b) => (
                  <button
                    key={b.side}
                    type="button"
                    onClick={() => setSourceSide(b.side)}
                    className={`py-1.5 px-2 rounded-lg border text-[11px] font-medium transition-colors ${
                      sourceSide === b.side
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold shadow-xs'
                        : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 bg-white dark:bg-slate-800'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Target touch point */}
            <div>
              <p className="font-medium text-gray-600 dark:text-slate-400 mb-1.5 truncate" title={`Node đích: ${toNodeTitle}`}>
                Đầu vào: <span className="font-semibold text-red-600 dark:text-red-400">{toNodeTitle}</span>
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {BORDER_SIDES.map((b) => (
                  <button
                    key={b.side}
                    type="button"
                    onClick={() => setTargetSide(b.side)}
                    className={`py-1.5 px-2 rounded-lg border text-[11px] font-medium transition-colors ${
                      targetSide === b.side
                        ? 'border-red-500 bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-semibold shadow-xs'
                        : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 bg-white dark:bg-slate-800'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-slate-400 leading-relaxed italic">
            * Mỗi Node có 4 cạnh (ở giữa). Nếu có nhiều luồng cùng nối vào 1 cạnh, hệ thống sẽ tự động xếp đều nằm giữa để tránh đè lấn.
          </p>
        </div>

        {/* Flow Stroke Style */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Kiểu nét vẽ (Line Style)
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setFlowType('solid')}
              className={`py-2 px-2 rounded-lg border text-xs font-medium text-center transition-colors ${
                flowType === 'solid'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold'
                  : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="w-8 h-0.5 bg-current mx-auto mb-1" />
              Nét liền
            </button>
            <button
              type="button"
              onClick={() => setFlowType('dashed')}
              className={`py-2 px-2 rounded-lg border text-xs font-medium text-center transition-colors ${
                flowType === 'dashed'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold'
                  : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="w-8 h-0.5 border-t-2 border-dashed border-current mx-auto mb-1" />
              Nét đứt
            </button>
            <button
              type="button"
              onClick={() => setFlowType('dotted')}
              className={`py-2 px-2 rounded-lg border text-xs font-medium text-center transition-colors ${
                flowType === 'dotted'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold'
                  : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="w-8 h-0.5 border-t-2 border-dotted border-current mx-auto mb-1" />
              Nét chấm
            </button>
          </div>
        </div>

        {/* Flow Color */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Palette size={13} className="text-gray-500 dark:text-slate-400" />
            Màu sắc luồng
          </label>
          <div className="flex flex-wrap gap-2.5 mb-2">
            {PRESET_EDGE_COLORS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setColor(c)}
                className={`w-6 h-6 rounded-full transition-transform ${
                  color.toLowerCase() === c.toLowerCase()
                    ? 'scale-125 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 ring-blue-500 shadow-sm'
                    : 'hover:scale-110'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-7 h-7 rounded border border-gray-300 dark:border-slate-700 bg-transparent cursor-pointer"
            />
            <span className="text-xs font-mono text-gray-500 dark:text-slate-400 uppercase">{color}</span>
          </div>
        </div>

        {/* Manual routing button */}
        {onEditRoute && (
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Route size={13} className="text-gray-500 dark:text-slate-400" />
              Định tuyến trên Canvas
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onEditRoute();
                  onClose();
                }}
                className="flex-1 text-xs font-medium border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded-lg px-3 py-2 transition-colors flex items-center justify-center gap-1.5"
              >
                <Crosshair size={13} />
                Kéo trực quan điểm chạm & đường nối trên Canvas
              </button>
              {edge.isManualRoute && onResetRoute && (
                <button
                  type="button"
                  onClick={() => {
                    onResetRoute();
                    onClose();
                  }}
                  className="text-xs font-medium border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg px-3 py-2 transition-colors"
                >
                  Tự động lại
                </button>
              )}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-slate-800">
          {onDelete ? (
            <button
              type="button"
              onClick={() => {
                onDelete();
                onClose();
              }}
              className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center gap-1 p-1 hover:bg-red-50 dark:hover:bg-red-950/40 rounded"
            >
              <Trash2 size={13} />
              Xóa luồng
            </button>
          ) : (
            <div />
          )}

          <div className="flex gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Lưu thay đổi
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
