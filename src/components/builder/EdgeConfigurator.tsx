import React, { useState } from 'react';
import { EdgeConfig, NodeInstance, FlowType } from '../../types/schema';
import { Button } from '../common/Button';
import { Plus, Trash2, ArrowRight, CornerDownRight } from 'lucide-react';

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
        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
          {edges.map((edge, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between bg-white border border-gray-200 rounded px-2 py-1.5 gap-1.5"
            >
              <div className="flex items-center gap-1.5 truncate flex-1 min-w-0">
                {/* Color Dot */}
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: edge.color || '#64748B' }}
                />

                <span className="font-medium text-gray-700 truncate" title={getNodeTitle(edge.from_instance)}>
                  {getNodeTitle(edge.from_instance)}
                </span>
                <ArrowRight size={11} className="text-gray-400 shrink-0" />
                <span className="font-medium text-gray-700 truncate" title={getNodeTitle(edge.to_instance)}>
                  {getNodeTitle(edge.to_instance)}
                </span>

                {edge.message_label && (
                  <span className="text-[10px] text-blue-600 bg-blue-50 px-1 rounded truncate">
                    "{edge.message_label}"
                  </span>
                )}

                {edge.flow_type !== 'solid' && (
                  <span className="text-[9px] text-gray-400 border border-dashed border-gray-300 px-1 rounded shrink-0">
                    {edge.flow_type === 'dashed' ? 'đứt' : 'chấm'}
                  </span>
                )}
              </div>

              <button
                onClick={() => handleRemoveEdge(idx)}
                className="text-gray-400 hover:text-red-500 p-0.5 shrink-0"
                title="Xóa liên kết"
              >
                <Trash2 size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Form to add explicit edge */}
      {nodes.length >= 2 && (
        <div className="pt-2 border-t border-gray-200/80 space-y-2">
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <label className="text-[10px] text-gray-500 block mb-0.5">Từ Node</label>
              <select
                value={fromInstance}
                onChange={(e) => setFromInstance(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded px-1.5 py-1 text-[11px] truncate"
              >
                {nodes.map((n) => (
                  <option key={n.instance_id} value={n.instance_id}>
                    {n.custom_label || n.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 block mb-0.5">Đến Node</label>
              <select
                value={toInstance}
                onChange={(e) => setToInstance(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded px-1.5 py-1 text-[11px] truncate"
              >
                {nodes.map((n) => (
                  <option key={n.instance_id} value={n.instance_id}>
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
              className="flex-1 bg-white border border-gray-300 rounded px-2 py-1 text-[11px] outline-none"
            />
            <select
              value={flowType}
              onChange={(e) => setFlowType(e.target.value as FlowType)}
              className="bg-white border border-gray-300 rounded px-1.5 py-1 text-[11px]"
            >
              <option value="solid">Nét liền</option>
              <option value="dashed">Nét đứt</option>
              <option value="dotted">Nét chấm</option>
            </select>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-gray-500">Màu:</span>
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
