import React, { useState } from 'react';
import { EdgeConfig, NodeInstance, FlowType } from '../../types/schema';
import { Button } from '../common/Button';
import { Plus, Trash2, ArrowRight, CornerDownRight, ChevronUp, ChevronDown, GripVertical, Sliders, X } from 'lucide-react';

interface EdgeConfiguratorProps {
  nodes: NodeInstance[];
  edges: EdgeConfig[];
  onChange: (edges: EdgeConfig[]) => void;
}

const PRESET_COLORS = ['#64748B', '#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export const EdgeConfigurator: React.FC<EdgeConfiguratorProps> = ({
  nodes,
  edges,
  onChange,
}) => {
  const [fromInstance, setFromInstance] = useState(nodes[0]?.instance_id || '');
  const [toInstance, setToInstance] = useState(nodes[1]?.instance_id || '');
  const [label, setLabel] = useState('');
  const [flowType, setFlowType] = useState<FlowType>('solid');
  const [color, setColor] = useState('#64748B');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleUpdateEdgeEndpoints = (index: number, newFrom: string, newTo: string) => {
    if (newFrom === newTo) return;
    const updated = edges.map((e, i) =>
      i === index ? { ...e, from_instance: newFrom, to_instance: newTo } : e
    );
    onChange(updated);
  };

  const handleSwapEdge = (index: number) => {
    const current = edges[index];
    if (!current) return;
    const updated = edges.map((e, i) =>
      i === index ? { ...e, from_instance: current.to_instance, to_instance: current.from_instance } : e
    );
    onChange(updated);
  };

  const handleUpdateEdge = (index: number, updates: Partial<EdgeConfig>) => {
    const updated = edges.map((e, i) => (i === index ? { ...e, ...updates } : e));
    onChange(updated);
  };

  const handleAddEdge = () => {
    if (!fromInstance || !toInstance || fromInstance === toInstance) return;
    const newEdge: EdgeConfig = {
      from_instance: fromInstance,
      to_instance: toInstance,
      message_label: label.trim(),
      flow_type: flowType,
      color,
    };
    onChange([...edges, newEdge]);
    setLabel('');
  };

  const handleRemoveEdge = (index: number) => {
    const updated = edges.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleMoveEdge = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= edges.length) return;
    const updated = [...edges];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    onChange(updated);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex === null || draggedIndex === index) return;
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      handleDragEnd();
      return;
    }
    const updated = [...edges];
    const [moved] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, moved);
    onChange(updated);
    handleDragEnd();
  };

  const handleResetToAuto = () => {
    const autoEdges: EdgeConfig[] = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      autoEdges.push({
        from_instance: nodes[i].instance_id,
        to_instance: nodes[i + 1].instance_id,
        message_label: '',
        flow_type: 'solid',
      });
    }
    onChange(autoEdges);
  };

  const getNodeTitle = (id: string) => {
    const n = nodes.find((node) => node.instance_id === id);
    return n ? n.custom_label || n.title : id;
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-gray-700 flex items-center gap-1.5">
          <CornerDownRight size={13} className="text-blue-500" />
          Nối dây trong Frame (Micro-flow)
        </span>
        <button
          onClick={handleResetToAuto}
          className="text-[11px] text-blue-600 hover:underline font-medium"
          title="Tự động nối tuần tự theo thứ tự hiển thị"
        >
          Nối tự động
        </button>
      </div>

      {/* List of current edges */}
      {edges.length === 0 ? (
        <p className="text-[11px] text-gray-400 italic">
          Đang áp dụng nối tuần tự tự động (mặc định).
        </p>
      ) : (
        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
          {edges.map((edge, idx) => (
            <div key={edge.edge_id || `${edge.from_instance}-${edge.to_instance}-${idx}`} className="space-y-1">
              <div
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragEnd={handleDragEnd}
                onDrop={(e) => handleDrop(e, idx)}
                className={`flex items-center justify-between bg-white dark:bg-slate-800 border rounded px-1.5 py-1.5 gap-1 transition-all ${
                  draggedIndex === idx
                    ? 'opacity-40 border-dashed border-blue-400 bg-blue-50/40'
                    : dragOverIndex === idx
                    ? 'border-blue-500 ring-1 ring-blue-400 bg-blue-50/60 dark:bg-blue-950/40'
                    : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                }`}
              >
                {/* Left: Drag Grip, Order Number, Color */}
                <div className="flex items-center gap-1 shrink-0">
                  <span title="Kéo thả để đổi thứ tự dây" className="cursor-grab active:cursor-grabbing shrink-0 flex items-center">
                    <GripVertical size={12} className="text-gray-300 hover:text-gray-600" />
                  </span>

                  <span className="text-[10px] font-mono text-gray-400 dark:text-slate-500 w-3.5 shrink-0 select-none">
                    {idx + 1}.
                  </span>

                  {/* Color Dot */}
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: edge.color || '#64748B' }}
                  />
                </div>

                {/* Center: Directly Editable From & To Selects */}
                <div className="flex items-center gap-1 flex-1 min-w-0" onMouseDown={(e) => e.stopPropagation()}>
                  <select
                    value={edge.from_instance}
                    onChange={(e) => handleUpdateEdgeEndpoints(idx, e.target.value, edge.to_instance)}
                    className="flex-1 min-w-0 text-[11px] font-semibold bg-gray-50/90 dark:bg-slate-700/80 hover:bg-white dark:hover:bg-slate-600 border border-gray-200 dark:border-slate-600 rounded px-1 py-0.5 truncate cursor-pointer text-gray-800 dark:text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    title={`Từ node: ${getNodeTitle(edge.from_instance)} (Bấm để chọn lại node)`}
                  >
                    {nodes.map((n) => (
                      <option key={n.instance_id} value={n.instance_id} disabled={n.instance_id === edge.to_instance}>
                        {n.custom_label || n.title}
                      </option>
                    ))}
                    {!nodes.some((n) => n.instance_id === edge.from_instance) && (
                      <option value={edge.from_instance}>{getNodeTitle(edge.from_instance)}</option>
                    )}
                  </select>

                  <button
                    type="button"
                    onClick={() => handleSwapEdge(idx)}
                    className="p-0.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded transition-colors shrink-0"
                    title="Đảo chiều luồng (đổi nguồn ⇄ đích)"
                  >
                    <ArrowRight size={11} />
                  </button>

                  <select
                    value={edge.to_instance}
                    onChange={(e) => handleUpdateEdgeEndpoints(idx, edge.from_instance, e.target.value)}
                    className="flex-1 min-w-0 text-[11px] font-semibold bg-gray-50/90 dark:bg-slate-700/80 hover:bg-white dark:hover:bg-slate-600 border border-gray-200 dark:border-slate-600 rounded px-1 py-0.5 truncate cursor-pointer text-gray-800 dark:text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    title={`Đến node: ${getNodeTitle(edge.to_instance)} (Bấm để chọn lại node)`}
                  >
                    {nodes.map((n) => (
                      <option key={n.instance_id} value={n.instance_id} disabled={n.instance_id === edge.from_instance}>
                        {n.custom_label || n.title}
                      </option>
                    ))}
                    {!nodes.some((n) => n.instance_id === edge.to_instance) && (
                      <option value={edge.to_instance}>{getNodeTitle(edge.to_instance)}</option>
                    )}
                  </select>
                </div>

                {/* Badge for label & flow type */}
                {edge.message_label && (
                  <span
                    className="text-[9px] text-blue-600 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-300 px-1 rounded truncate max-w-[45px] shrink-0"
                    title={`Thông điệp: "${edge.message_label}"`}
                  >
                    "{edge.message_label}"
                  </span>
                )}

                {edge.flow_type !== 'solid' && (
                  <span
                    className="text-[9px] text-gray-400 border border-dashed border-gray-300 dark:border-slate-600 px-1 rounded shrink-0 cursor-pointer hover:text-blue-500"
                    title="Bấm để chuyển kiểu nét"
                    onClick={() => {
                      const nextType: FlowType = edge.flow_type === 'dashed' ? 'dotted' : 'solid';
                      handleUpdateEdge(idx, { flow_type: nextType });
                    }}
                  >
                    {edge.flow_type === 'dashed' ? 'đứt' : 'chấm'}
                  </span>
                )}

                {/* Actions: Edit Details, Reorder Up/Down, Remove */}
                <div className="flex items-center gap-0.5 shrink-0" onMouseDown={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => setEditingIndex(editingIndex === idx ? null : idx)}
                    className={`p-1 rounded transition-colors ${
                      editingIndex === idx
                        ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/40'
                        : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700'
                    }`}
                    title="Tùy chỉnh chi tiết (nhãn thông điệp, nét, màu)"
                  >
                    <Sliders size={11} />
                  </button>
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMoveEdge(idx, 'up')}
                    className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 disabled:opacity-20 transition-colors"
                    title="Di chuyển dây lên trên"
                  >
                    <ChevronUp size={12} />
                  </button>
                  <button
                    type="button"
                    disabled={idx === edges.length - 1}
                    onClick={() => handleMoveEdge(idx, 'down')}
                    className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 disabled:opacity-20 transition-colors"
                    title="Di chuyển dây xuống dưới"
                  >
                    <ChevronDown size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveEdge(idx)}
                    className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                    title="Xóa liên kết"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              {/* Expandable Details Editor */}
              {editingIndex === idx && (
                <div className="p-2 bg-blue-50/60 dark:bg-slate-800/90 border border-blue-200 dark:border-blue-900/60 rounded-lg space-y-2 text-[11px] ml-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-700 dark:text-slate-200">
                      Tùy chỉnh chi tiết luồng #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingIndex(null)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"
                    >
                      <X size={12} />
                    </button>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-500 dark:text-slate-400 block mb-0.5">Nhãn thông điệp trên dây</label>
                    <input
                      type="text"
                      value={edge.message_label || ''}
                      onChange={(e) => handleUpdateEdge(idx, { message_label: e.target.value })}
                      placeholder="Nhập thông điệp luồng (ví dụ: Gửi duyệt, Phản hồi...)"
                      className="w-full bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded px-2 py-1 text-[11px] outline-none text-gray-800 dark:text-slate-100 focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-gray-500 dark:text-slate-400 block mb-0.5">Kiểu nét</label>
                      <select
                        value={edge.flow_type || 'solid'}
                        onChange={(e) => handleUpdateEdge(idx, { flow_type: e.target.value as FlowType })}
                        className="w-full bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded px-1.5 py-1 text-[11px] text-gray-800 dark:text-slate-100"
                      >
                        <option value="solid">Nét liền</option>
                        <option value="dashed">Nét đứt</option>
                        <option value="dotted">Nét chấm</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-500 dark:text-slate-400 block mb-0.5">Màu sắc dây</label>
                      <div className="flex items-center gap-1 pt-1">
                        {PRESET_COLORS.map((c) => (
                          <button
                            type="button"
                            key={c}
                            onClick={() => handleUpdateEdge(idx, { color: c })}
                            className={`w-3.5 h-3.5 rounded-full transition-transform ${
                              (edge.color || '#64748B') === c ? 'scale-125 ring-1 ring-blue-500' : ''
                            }`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Form to add explicit edge */}
      {nodes.length >= 2 && (
        <div className="pt-2 border-t border-gray-200/80 dark:border-slate-800 space-y-2">
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <label className="text-[10px] text-gray-500 dark:text-slate-400 block mb-0.5">Từ Node</label>
              <select
                value={fromInstance}
                onChange={(e) => setFromInstance(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-gray-800 dark:text-slate-100 rounded px-1.5 py-1 text-[11px] truncate"
              >
                {nodes.map((n) => (
                  <option key={n.instance_id} value={n.instance_id} className="bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-100">
                    {n.custom_label || n.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 dark:text-slate-400 block mb-0.5">Đến Node</label>
              <select
                value={toInstance}
                onChange={(e) => setToInstance(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-gray-800 dark:text-slate-100 rounded px-1.5 py-1 text-[11px] truncate"
              >
                {nodes.map((n) => (
                  <option key={n.instance_id} value={n.instance_id} className="bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-100">
                    {n.custom_label || n.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-1.5">
            <input
              type="text"
              placeholder="Tên thông điệp luồng..."
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="flex-1 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-gray-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 rounded px-2 py-1 text-[11px] outline-none"
            />
            <select
              value={flowType}
              onChange={(e) => setFlowType(e.target.value as FlowType)}
              className="bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-gray-800 dark:text-slate-100 rounded px-1.5 py-1 text-[11px]"
            >
              <option value="solid" className="bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-100">Nét liền</option>
              <option value="dashed" className="bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-100">Nét đứt</option>
              <option value="dotted" className="bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-100">Nét chấm</option>
            </select>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-gray-500 dark:text-slate-400">Màu:</span>
              <div className="flex gap-1">
                {PRESET_COLORS.map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-4 h-4 rounded-full transition-transform ${
                      color === c ? 'scale-125 ring-1 ring-blue-500' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleAddEdge}
              disabled={!fromInstance || !toInstance || fromInstance === toInstance}
              icon={<Plus size={12} />}
              className="py-1 px-2.5 text-[11px]"
            >
              Thêm luồng
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
