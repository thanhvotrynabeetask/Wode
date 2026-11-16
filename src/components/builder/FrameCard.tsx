import React, { useState } from 'react';
import { Frame, NodeTemplate, Role } from '../../types/schema';
import { FrameNodeSlot } from './FrameNodeSlot';
import { EdgeConfigurator } from './EdgeConfigurator';
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Trash2,
  GitBranch,
  Edit2,
  Check,
  X,
  Network,
} from 'lucide-react';

interface FrameCardProps {
  frame: Frame;
  allFrames: Frame[];
  index: number;
  total: number;
  nodeTemplates: NodeTemplate[];
  roles: Role[];
  selectedInstanceId: string | null;
  onSelectFrame: () => void;
  onSelectInstance: (id: string) => void;
  onUpdateTitle: (title: string) => void;
  onRemoveFrame: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemoveNode: (instanceId: string) => void;
  onReorderNodes: (instanceIds: string[]) => void;
  onUpdateNodeLabel: (instanceId: string, label: string | null) => void;
  onUpdateEdges: (edges: any[]) => void;
  onUpdateNextFrameTarget: (targetId: string | null) => void;
}

export const FrameCard: React.FC<FrameCardProps> = ({
  frame,
  allFrames,
  index,
  total,
  nodeTemplates,
  roles,
  selectedInstanceId,
  onSelectFrame,
  onSelectInstance,
  onUpdateTitle,
  onRemoveFrame,
  onMoveUp,
  onMoveDown,
  onRemoveNode,
  onReorderNodes,
  onUpdateNodeLabel,
  onUpdateEdges,
  onUpdateNextFrameTarget,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleText, setTitleText] = useState(frame.title);
  const [showEdgeConfig, setShowEdgeConfig] = useState(false);

  const handleSaveTitle = () => {
    if (titleText.trim()) onUpdateTitle(titleText.trim());
    setEditingTitle(false);
  };

  const handleNodeMove = (nodeIndex: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? nodeIndex - 1 : nodeIndex + 1;
    if (targetIndex < 0 || targetIndex >= frame.nodes.length) return;
    const newOrder = [...frame.nodes.map((n) => n.instance_id)];
    const temp = newOrder[nodeIndex];
    newOrder[nodeIndex] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;
    onReorderNodes(newOrder);
  };

  const otherFrames = allFrames.filter((f) => f.frame_id !== frame.frame_id);

  return (
    <div
      onClick={onSelectFrame}
      className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden transition-all hover:border-gray-300"
    >
      {/* Frame Header */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50/80 border-b border-gray-100">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCollapsed(!collapsed);
            }}
            className="text-gray-400 hover:text-gray-600 shrink-0"
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          </button>

          {/* Frame Order Badge */}
          <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded shrink-0">
            #{frame.order}
          </span>

          {/* Title Editor */}
          {editingTitle ? (
            <div className="flex items-center gap-1 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                autoFocus
                value={titleText}
                onChange={(e) => setTitleText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle();
                  if (e.key === 'Escape') setEditingTitle(false);
                }}
                className="w-full text-xs font-semibold border border-blue-400 rounded px-1.5 py-0.5 outline-none"
              />
              <button onClick={handleSaveTitle} className="text-green-600 hover:text-green-700 p-0.5">
                <Check size={12} />
              </button>
              <button onClick={() => setEditingTitle(false)} className="text-gray-400 hover:text-gray-600 p-0.5">
                <X size={12} />
              </button>
            </div>
          ) : (
            <span
              className="text-xs font-semibold text-gray-800 truncate cursor-pointer hover:text-blue-600"
              title={frame.title}
              onDoubleClick={(e) => {
                e.stopPropagation();
                setEditingTitle(true);
              }}
            >
              {frame.title}
            </span>
          )}

          {/* Node Count */}
          <span className="text-[10px] text-gray-400 shrink-0">
            ({frame.nodes.length} node)
          </span>
        </div>

        {/* Header Actions */}
        {!editingTitle && (
          <div className="flex items-center gap-0.5 shrink-0 ml-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditingTitle(true);
                setTitleText(frame.title);
              }}
              title="Sửa tiêu đề Frame"
              className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-gray-200/50"
            >
              <Edit2 size={12} />
            </button>
            <button
              disabled={index === 0}
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp();
              }}
              title="Di chuyển Frame lên trước"
              className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-200/50 disabled:opacity-20"
            >
              <ChevronUp size={13} />
            </button>
            <button
              disabled={index === total - 1}
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown();
              }}
              title="Di chuyển Frame xuống sau"
              className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-200/50 disabled:opacity-20"
            >
              <ChevronDown size={13} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemoveFrame();
              }}
              title="Xóa Frame này"
              className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Frame Body */}
      {!collapsed && (
        <div className="p-2.5 space-y-2">
          {/* Node Slots */}
          {frame.nodes.length === 0 ? (
            <div className="text-center py-4 px-2 border border-dashed border-gray-200 rounded-lg">
              <p className="text-[11px] text-gray-400">
                Chưa có nhiệm vụ nào trong phân đoạn này.
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                Chuyển sang tab "Kho Node" và bấm <strong>+ Thêm</strong> để đưa vào.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {frame.nodes.map((node, nodeIdx) => {
                const template = nodeTemplates.find((t) => t.base_id === node.base_id);
                const role = template ? roles.find((r) => r.id === template.role_id) : undefined;
                return (
                  <FrameNodeSlot
                    key={node.instance_id}
                    node={node}
                    index={nodeIdx}
                    total={frame.nodes.length}
                    template={template}
                    role={role}
                    isSelected={selectedInstanceId === node.instance_id}
                    onSelect={() => onSelectInstance(node.instance_id)}
                    onRemove={() => onRemoveNode(node.instance_id)}
                    onMoveUp={() => handleNodeMove(nodeIdx, 'up')}
                    onMoveDown={() => handleNodeMove(nodeIdx, 'down')}
                    onUpdateCustomLabel={(label) => onUpdateNodeLabel(node.instance_id, label)}
                  />
                );
              })}
            </div>
          )}

          {/* Micro-flow Edge Configurator Toggle */}
          {frame.nodes.length >= 2 && (
            <div className="pt-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEdgeConfig(!showEdgeConfig);
                }}
                className="flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:underline"
              >
                <Network size={12} />
                {showEdgeConfig ? 'Ẩn cấu hình nối dây' : 'Tùy biến nối dây (Edges)'}
                {frame.edges_config.length > 0 && (
                  <span className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.2 rounded-full ml-1">
                    {frame.edges_config.length}
                  </span>
                )}
              </button>

              {showEdgeConfig && (
                <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                  <EdgeConfigurator
                    nodes={frame.nodes}
                    edges={frame.edges_config}
                    onChange={onUpdateEdges}
                  />
                </div>
              )}
            </div>
          )}

          {/* Macro-flow Branching Target */}
          {otherFrames.length > 0 && (
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="text-[11px] text-gray-500 flex items-center gap-1">
                <GitBranch size={12} className="text-amber-500" />
                Rẽ nhánh tiếp:
              </span>
              <select
                value={frame.next_frame_target || ''}
                onChange={(e) =>
                  onUpdateNextFrameTarget(e.target.value ? e.target.value : null)
                }
                onClick={(e) => e.stopPropagation()}
                className="text-[11px] bg-white border border-gray-200 rounded px-1.5 py-0.5 text-gray-700 outline-none max-w-[140px] truncate"
              >
                <option value="">Tuần tự (Frame tiếp theo)</option>
                {otherFrames.map((f) => (
                  <option key={f.frame_id} value={f.frame_id}>
                    #{f.order} {f.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
