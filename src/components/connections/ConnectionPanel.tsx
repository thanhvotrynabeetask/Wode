import React, { useState, useMemo } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { useUIStore } from '../../store/useUIStore';
import { EdgeConfig, FlowType } from '../../types/schema';
import { Button } from '../common/Button';
import { ConfirmDialog } from '../common/ConfirmDialog';
import {
  Network,
  Plus,
  Trash2,
  ArrowRight,
  ChevronUp,
  ChevronDown,
  Repeat,
  Sliders,
  Sparkles,
  Search,
} from 'lucide-react';
import { useTranslation } from '../../i18n';

const PRESET_COLORS = ['#64748B', '#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899'];

export const ConnectionPanel: React.FC = () => {
  const {
    schema,
    getAllEdges,
    addEdge,
    updateEdgeConfig,
    removeEdge,
    reorderEdges,
    clearAllEdges,
  } = useProjectStore();

  const { addToast } = useUIStore();
  const { t } = useTranslation();

  // Collect all nodes across all frames and standalone nodes in the active diagram
  const allNodes = useMemo(() => {
    const list: {
      instanceId: string;
      title: string;
      frameTitle: string;
      roleName: string;
      roleColor: string;
    }[] = [];

    const roleMap = new Map(schema.roles.map((r) => [r.id, r]));
    const templateMap = new Map(schema.node_palette.map((tp) => [tp.base_id, tp]));

    schema.frames.forEach((frame) => {
      frame.nodes.forEach((node) => {
        const tpl = templateMap.get(node.base_id);
        const role = roleMap.get(node.assigned_role_id || tpl?.role_id || '');
        list.push({
          instanceId: node.instance_id,
          title: tpl?.title || node.title,
          frameTitle: frame.title,
          roleName: role?.name || 'Chưa gán',
          roleColor: role?.color || '#3B82F6',
        });
      });
    });

    (schema.nodes || []).forEach((node) => {
      const tpl = templateMap.get(node.base_id);
      const role = roleMap.get(node.assigned_role_id || tpl?.role_id || '');
      list.push({
        instanceId: node.instance_id,
        title: tpl?.title || node.title,
        frameTitle: 'Độc lập',
        roleName: role?.name || 'Chưa gán',
        roleColor: role?.color || '#3B82F6',
      });
    });

    return list;
  }, [schema.frames, schema.nodes, schema.roles, schema.node_palette]);

  // Current edges
  const edges = useMemo(() => getAllEdges(), [schema.edges_config, schema.frames]);

  // Form states
  const [fromInstance, setFromInstance] = useState('');
  const [toInstance, setToInstance] = useState('');
  const [label, setLabel] = useState('');
  const [flowType, setFlowType] = useState<FlowType>('solid');
  const [color, setColor] = useState('#64748B');
  const [search, setSearch] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(true);

  // Set default endpoints if empty
  React.useEffect(() => {
    if (allNodes.length >= 2) {
      if (!fromInstance) setFromInstance(allNodes[0].instanceId);
      if (!toInstance) setToInstance(allNodes[1].instanceId);
    }
  }, [allNodes]);

  const handleAddEdge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromInstance || !toInstance || fromInstance === toInstance) {
      addToast('warning', 'Vui lòng chọn 2 node khác nhau để tạo đường nối');
      return;
    }
    const newEdge: EdgeConfig = {
      from_instance: fromInstance,
      to_instance: toInstance,
      message_label: label.trim(),
      flow_type: flowType,
      color,
    };
    addEdge(newEdge);
    addToast('success', 'Đã thêm đường nối thành công');
    setLabel('');
  };

  const handleSwapEndpoints = () => {
    const temp = fromInstance;
    setFromInstance(toInstance);
    setToInstance(temp);
  };

  const handleSwapExistingEdge = (edge: EdgeConfig) => {
    removeEdge(edge.from_instance, edge.to_instance);
    addEdge({
      ...edge,
      from_instance: edge.to_instance,
      to_instance: edge.from_instance,
    });
    addToast('info', 'Đã đảo chiều đường nối');
  };

  const handleMoveEdge = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= edges.length) return;
    const reordered = [...edges];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    reorderEdges(reordered);
  };

  const handleAutoConnectSequential = () => {
    if (allNodes.length < 2) {
      addToast('warning', 'Cần ít nhất 2 nhiệm vụ trên sơ đồ để nối tuần tự');
      return;
    }
    const newEdges: EdgeConfig[] = [];
    for (let i = 0; i < allNodes.length - 1; i++) {
      newEdges.push({
        edge_id: `auto_seq_${i}_${Date.now() % 10000}`,
        from_instance: allNodes[i].instanceId,
        to_instance: allNodes[i + 1].instanceId,
        message_label: '',
        flow_type: 'solid',
        color: '#64748B',
      });
    }
    reorderEdges(newEdges);
    addToast('success', `Đã nối tuần tự ${newEdges.length} đường nối qua tất cả giai đoạn`);
  };

  const filteredEdges = useMemo(() => {
    if (!search.trim()) return edges;
    const q = search.toLowerCase();
    const nodeNameMap = new Map(allNodes.map((n) => [n.instanceId, n.title.toLowerCase()]));
    return edges.filter((e) => {
      const fromName = nodeNameMap.get(e.from_instance) || '';
      const toName = nodeNameMap.get(e.to_instance) || '';
      const lbl = (e.message_label || '').toLowerCase();
      return fromName.includes(q) || toName.includes(q) || lbl.includes(q);
    });
  }, [edges, search, allNodes]);

  const getNodeInfo = (instanceId: string) => {
    return allNodes.find((n) => n.instanceId === instanceId);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50/50 dark:bg-slate-900 select-none">
      {/* Header bar */}
      <div className="p-3 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between shrink-0">
        <div>
          <h3 className="text-xs font-bold text-gray-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
            <Network size={14} className="text-blue-600 dark:text-blue-400" />
            {t('sidebar.connectionsTab') || 'Đường nối'}
          </h3>
          <p className="text-[10px] text-gray-400 dark:text-slate-500">
            {edges.length} {edges.length === 1 ? 'luồng nối' : 'luồng nối'} • Toàn bộ quy trình
          </p>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant={showAddForm ? 'secondary' : 'primary'}
            size="sm"
            icon={<Plus size={13} />}
            onClick={() => setShowAddForm(!showAddForm)}
            className="text-xs py-1.5"
          >
            {showAddForm ? 'Đóng form' : 'Thêm nối'}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Add Connection Form Card */}
        {showAddForm && (
          <form
            onSubmit={handleAddEdge}
            className="bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/60 rounded-xl p-3 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <Plus size={13} />
                Thêm đường nối mới
              </span>
              <button
                type="button"
                onClick={handleSwapEndpoints}
                title="Đảo chiều nguồn ⇄ đích"
                className="text-[11px] text-gray-500 hover:text-blue-600 flex items-center gap-1 py-0.5 px-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-800"
              >
                <Repeat size={11} />
                Đảo chiều
              </button>
            </div>

            {/* From Node */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 dark:text-slate-400 mb-1">
                Node nguồn (Bắt đầu):
              </label>
              <select
                value={fromInstance}
                onChange={(e) => setFromInstance(e.target.value)}
                className="w-full text-xs bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg p-2 text-gray-800 dark:text-slate-100 outline-none focus:border-blue-500"
              >
                {allNodes.map((n) => (
                  <option key={n.instanceId} value={n.instanceId}>
                    {n.title} [{n.frameTitle} • {n.roleName}]
                  </option>
                ))}
              </select>
            </div>

            {/* To Node */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 dark:text-slate-400 mb-1">
                Node đích (Kết thúc):
              </label>
              <select
                value={toInstance}
                onChange={(e) => setToInstance(e.target.value)}
                className="w-full text-xs bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg p-2 text-gray-800 dark:text-slate-100 outline-none focus:border-blue-500"
              >
                {allNodes.map((n) => (
                  <option key={n.instanceId} value={n.instanceId}>
                    {n.title} [{n.frameTitle} • {n.roleName}]
                  </option>
                ))}
              </select>
            </div>

            {/* Message Flow Label */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 dark:text-slate-400 mb-1">
                Nhãn thông điệp / Text trên luồng:
              </label>
              <input
                type="text"
                placeholder="VD: Gửi thông báo, Phê duyệt..."
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full text-xs bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg p-2 text-gray-800 dark:text-slate-100 outline-none focus:border-blue-500"
              />
            </div>

            {/* Flow Type */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 dark:text-slate-400 mb-1">
                Kiểu đường nét:
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'solid', label: 'Nét liền' },
                  { id: 'dashed', label: 'Nét đứt' },
                  { id: 'dotted', label: 'Nét chấm' },
                ].map((ft) => (
                  <button
                    key={ft.id}
                    type="button"
                    onClick={() => setFlowType(ft.id as FlowType)}
                    className={`py-1.5 px-2 rounded-lg border text-[11px] font-medium transition-colors ${
                      flowType === ft.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold'
                        : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {ft.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Edge Color */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 dark:text-slate-400 mb-1">
                Màu sắc đường nối:
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-5 h-5 rounded-full transition-transform ${
                      color.toLowerCase() === c.toLowerCase()
                        ? 'scale-125 ring-2 ring-offset-1 ring-blue-500 shadow-sm'
                        : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-5 h-5 rounded border border-gray-300 cursor-pointer bg-transparent ml-1"
                />
              </div>
            </div>

            <Button type="submit" variant="primary" size="sm" icon={<Plus size={13} />} className="w-full mt-2">
              Tạo đường nối
            </Button>
          </form>
        )}

        {/* Quick Batch Actions & Search */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={12} className="absolute left-2.5 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm đường nối..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-7 pr-2 py-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg outline-none focus:border-blue-500 text-gray-800 dark:text-slate-100"
            />
          </div>
          {edges.length > 0 && (
            <button
              type="button"
              onClick={() => setClearConfirmOpen(true)}
              title="Xóa tất cả đường nối"
              className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg border border-transparent hover:border-red-200"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>

        {/* Connections List */}
        {edges.length === 0 ? (
          <div className="p-6 text-center text-gray-400 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl space-y-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
              <Network size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-700 dark:text-slate-200">
                Chưa có đường nối nào
              </p>
              <p className="text-[11px] text-gray-400 max-w-xs mx-auto mt-1">
                Các đường nối giữa các node hoàn toàn độc lập với việc phân chia giai đoạn (frame).
              </p>
            </div>
            {allNodes.length >= 2 && (
              <Button
                variant="secondary"
                size="sm"
                icon={<Sparkles size={13} />}
                onClick={handleAutoConnectSequential}
                className="mx-auto text-xs"
              >
                Nối tuần tự tự động
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                Danh sách ({filteredEdges.length})
              </span>
              {allNodes.length >= 2 && (
                <button
                  onClick={handleAutoConnectSequential}
                  className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
                >
                  <Sparkles size={10} />
                  Nối tuần tự tất cả
                </button>
              )}
            </div>

            {filteredEdges.map((edge, idx) => {
              const from = getNodeInfo(edge.from_instance);
              const to = getNodeInfo(edge.to_instance);
              const isEditing = editingIndex === idx;

              return (
                <div
                  key={`${edge.from_instance}_${edge.to_instance}_${idx}`}
                  className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-2.5 shadow-xs transition-colors hover:border-gray-300 dark:hover:border-slate-700"
                >
                  <div className="flex items-start justify-between gap-2">
                    {/* Endpoints & info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-800 dark:text-slate-100 flex-wrap">
                        {/* Source Node */}
                        <span className="flex items-center gap-1 truncate max-w-[42%]" title={from?.title || edge.from_instance}>
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: from?.roleColor || '#3B82F6' }}
                          />
                          <span className="truncate">{from?.title || edge.from_instance}</span>
                        </span>

                        <ArrowRight size={12} className="text-gray-400 shrink-0" />

                        {/* Target Node */}
                        <span className="flex items-center gap-1 truncate max-w-[42%]" title={to?.title || edge.to_instance}>
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: to?.roleColor || '#EF4444' }}
                          />
                          <span className="truncate">{to?.title || edge.to_instance}</span>
                        </span>
                      </div>

                      {/* Phase badges */}
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400 dark:text-slate-500">
                        <span>[{from?.frameTitle || 'Độc lập'}] ➔ [{to?.frameTitle || 'Độc lập'}]</span>
                      </div>

                      {/* Label badge if present */}
                      {edge.message_label && (
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <span
                            className="text-[10px] font-medium px-2 py-0.5 rounded-full border truncate max-w-[200px]"
                            style={{
                              backgroundColor: `${edge.color || '#64748B'}15`,
                              borderColor: edge.color || '#64748B',
                              color: edge.color || '#64748B',
                            }}
                          >
                            {edge.message_label}
                          </span>
                          {(edge.label_x !== undefined || edge.label_y !== undefined) && (
                            <span className="text-[9px] text-amber-600 dark:text-amber-400 font-mono" title="Đã kéo vị trí trên canvas">
                              [kéo tùy chỉnh]
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMoveEdge(idx, 'up')}
                        disabled={idx === 0}
                        title="Di chuyển lên"
                        className="p-1 rounded text-gray-400 hover:text-gray-600 disabled:opacity-20"
                      >
                        <ChevronUp size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveEdge(idx, 'down')}
                        disabled={idx === edges.length - 1}
                        title="Di chuyển xuống"
                        className="p-1 rounded text-gray-400 hover:text-gray-600 disabled:opacity-20"
                      >
                        <ChevronDown size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSwapExistingEdge(edge)}
                        title="Đảo chiều"
                        className="p-1 rounded text-gray-400 hover:text-blue-600"
                      >
                        <Repeat size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingIndex(isEditing ? null : idx)}
                        title="Sửa chi tiết"
                        className={`p-1 rounded ${isEditing ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        <Sliders size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          removeEdge(edge.from_instance, edge.to_instance);
                          addToast('info', 'Đã xóa đường nối');
                        }}
                        title="Xóa đường nối"
                        className="p-1 rounded text-gray-400 hover:text-red-600"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Inline quick editor */}
                  {isEditing && (
                    <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-slate-800 space-y-2 text-xs">
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">
                          Nhãn thông điệp:
                        </label>
                        <input
                          type="text"
                          value={edge.message_label || ''}
                          onChange={(e) =>
                            updateEdgeConfig(edge.from_instance, edge.to_instance, {
                              message_label: e.target.value,
                            })
                          }
                          className="w-full text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded px-2 py-1 outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">
                            Kiểu nét:
                          </label>
                          <select
                            value={edge.flow_type || 'solid'}
                            onChange={(e) =>
                              updateEdgeConfig(edge.from_instance, edge.to_instance, {
                                flow_type: e.target.value as FlowType,
                              })
                            }
                            className="w-full text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded px-1.5 py-1 outline-none"
                          >
                            <option value="solid">Nét liền</option>
                            <option value="dashed">Nét đứt</option>
                            <option value="dotted">Nét chấm</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">
                            Màu sắc:
                          </label>
                          <div className="flex items-center gap-1">
                            <input
                              type="color"
                              value={edge.color || '#64748B'}
                              onChange={(e) =>
                                updateEdgeConfig(edge.from_instance, edge.to_instance, {
                                  color: e.target.value,
                                })
                              }
                              className="w-6 h-6 rounded cursor-pointer bg-transparent border border-gray-200"
                            />
                            <span className="font-mono text-[10px] text-gray-400">
                              {edge.color || '#64748B'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Reset custom label pos if any */}
                      {(edge.label_x !== undefined || edge.label_y !== undefined) && (
                        <button
                          type="button"
                          onClick={() => {
                            updateEdgeConfig(edge.from_instance, edge.to_instance, {
                              label_x: undefined,
                              label_y: undefined,
                            });
                            addToast('info', 'Đã đặt lại vị trí nhãn về mặc định');
                          }}
                          className="text-[10px] text-blue-600 hover:underline"
                        >
                          Đặt lại vị trí chữ về giữa đường nối
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirm Clear All Dialog */}
      <ConfirmDialog
        isOpen={clearConfirmOpen}
        onCancel={() => setClearConfirmOpen(false)}
        title="Xóa tất cả đường nối"
        message="Bạn có chắc chắn muốn xóa tất cả đường nối trên sơ đồ? Các khung giai đoạn và nhiệm vụ sẽ vẫn được giữ nguyên."
        onConfirm={() => {
          clearAllEdges();
          setClearConfirmOpen(false);
          addToast('info', 'Đã xóa toàn bộ đường nối trên sơ đồ');
        }}
        confirmLabel="Xóa tất cả"
        cancelLabel="Hủy"
        variant="danger"
      />
    </div>
  );
};
