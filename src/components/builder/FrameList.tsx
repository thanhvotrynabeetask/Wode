import React, { useState } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { useUIStore } from '../../store/useUIStore';
import { FrameCard } from './FrameCard';
import { Button } from '../common/Button';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Plus, Workflow } from 'lucide-react';

export const FrameList: React.FC = () => {
  const {
    schema,
    addFrame,
    updateFrameTitle,
    removeFrame,
    reorderFrames,
    removeNodeFromFrame,
    reorderNodesInFrame,
    updateNodeInstance,
    setEdgeConfig,
    setNextFrameTarget,
  } = useProjectStore();

  const { selection, setSelectedFrame, setSelectedInstance, addToast } = useUIStore();

  const [deleteConfirmFrameId, setDeleteConfirmFrameId] = useState<string | null>(null);

  const handleCreateFrame = () => {
    const nextOrder = schema.frames.length + 1;
    const defaultTitle = `Giai đoạn ${nextOrder}`;
    addFrame(defaultTitle);
    addToast('success', `Đã tạo ${defaultTitle}`);
  };

  const handleMoveFrame = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= schema.frames.length) return;
    const newOrderedIds = [...schema.frames.map((f) => f.frame_id)];
    const temp = newOrderedIds[index];
    newOrderedIds[index] = newOrderedIds[targetIndex];
    newOrderedIds[targetIndex] = temp;
    reorderFrames(newOrderedIds);
  };

  const frameToDelete = schema.frames.find((f) => f.frame_id === deleteConfirmFrameId);

  return (
    <div className="flex flex-col h-full bg-gray-50/50 dark:bg-slate-900 select-none">
      {/* Header bar */}
      <div className="p-3 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between shrink-0">
        <div>
          <h3 className="text-xs font-bold text-gray-800 dark:text-slate-100 uppercase tracking-wider">
            Phân Đoạn Quy Trình
          </h3>
          <p className="text-[10px] text-gray-400 dark:text-slate-500">
            {schema.frames.length} Frame(s) • Macro-flow
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={<Plus size={13} />}
          onClick={handleCreateFrame}
          className="text-xs py-1.5"
        >
          Thêm Frame
        </Button>
      </div>

      {/* Frame Cards List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {schema.frames.length === 0 ? (
          <div className="p-6 text-center text-gray-400">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2">
              <Workflow size={20} />
            </div>
            <p className="text-xs font-semibold text-gray-700 mb-1">
              Chưa có phân đoạn nào
            </p>
            <p className="text-[11px] text-gray-400 mb-4 max-w-xs mx-auto">
              Frame là các thẻ gom nhóm đại diện cho từng bước hoặc giai đoạn cắt ngang các làn bơi.
            </p>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={13} />}
              onClick={handleCreateFrame}
              className="mx-auto"
            >
              Tạo Frame đầu tiên
            </Button>
          </div>
        ) : (
          schema.frames.map((frame, index) => (
            <FrameCard
              key={frame.frame_id}
              frame={frame}
              allFrames={schema.frames}
              index={index}
              total={schema.frames.length}
              nodeTemplates={schema.node_palette}
              roles={schema.roles}
              selectedInstanceId={selection.selectedInstanceId}
              onSelectFrame={() => setSelectedFrame(frame.frame_id)}
              onSelectInstance={(instanceId) => setSelectedInstance(instanceId)}
              onUpdateTitle={(title) => updateFrameTitle(frame.frame_id, title)}
              onRemoveFrame={() => setDeleteConfirmFrameId(frame.frame_id)}
              onMoveUp={() => handleMoveFrame(index, 'up')}
              onMoveDown={() => handleMoveFrame(index, 'down')}
              onRemoveNode={(instanceId) => removeNodeFromFrame(frame.frame_id, instanceId)}
              onReorderNodes={(orderedIds) => reorderNodesInFrame(frame.frame_id, orderedIds)}
              onUpdateNodeLabel={(instanceId, label) =>
                updateNodeInstance(frame.frame_id, instanceId, { custom_label: label })
              }
              onUpdateNodeListings={(instanceId, listings) =>
                updateNodeInstance(frame.frame_id, instanceId, { listings })
              }
              onUpdateEdges={(edges) => setEdgeConfig(frame.frame_id, edges)}
              onUpdateNextFrameTarget={(targetId) =>
                setNextFrameTarget(frame.frame_id, targetId)
              }
            />
          ))
        )}
      </div>

      {/* Delete Confirmation */}
      {deleteConfirmFrameId && frameToDelete && (
        <ConfirmDialog
          isOpen={true}
          title="Xóa Phân Đoạn (Frame)"
          message={`Bạn có chắc muốn xóa \"${frameToDelete.title}\" cùng toàn bộ ${frameToDelete.nodes.length} nhiệm vụ bên trong?`}
          confirmLabel="Xóa"
          variant="danger"
          onConfirm={() => {
            removeFrame(deleteConfirmFrameId);
            setDeleteConfirmFrameId(null);
            addToast('info', 'Đã xóa phân đoạn.');
          }}
          onCancel={() => setDeleteConfirmFrameId(null)}
        />
      )}
    </div>
  );
};
