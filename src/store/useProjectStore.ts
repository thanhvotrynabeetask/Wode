import { create } from 'zustand';
import { ProjectSchema, Role, NodeTemplate, Frame, NodeInstance, EdgeConfig } from '../types/schema';

import { generateRoleId, generateNodeId, generateFrameId, generateInstanceId } from '../utils/idGenerator';
import { formatISOTimestamp } from '../utils/dateFormat';
import { APP_VERSION } from '../utils/constants';

interface ProjectState {
  schema: ProjectSchema;
  past: ProjectSchema[];
  future: ProjectSchema[];
  isDirty: boolean;
  currentFilePath: string | null;

  // History & Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Project-level
  setProjectName: (name: string) => void;
  loadSchema: (schema: ProjectSchema) => void;
  newProject: () => void;
  markClean: () => void;
  setHorizontalSpacing: (spacing: number) => void;

  // Roles
  addRole: (name: string, color: string) => void;
  updateRole: (id: string, updates: Partial<Omit<Role, 'id'>>) => void;
  removeRole: (id: string) => void;

  // Node Templates
  addNodeTemplate: (template: Omit<NodeTemplate, 'base_id'>) => void;
  updateNodeTemplate: (baseId: string, updates: Partial<Omit<NodeTemplate, 'base_id'>>) => void;
  removeNodeTemplate: (baseId: string) => void;

  // Frames
  addFrame: (title: string) => void;
  updateFrameTitle: (frameId: string, title: string) => void;
  removeFrame: (frameId: string) => void;
  reorderFrames: (orderedIds: string[]) => void;

  // Node Instances
  addNodeToFrame: (frameId: string, baseId: string) => void;
  removeNodeFromFrame: (frameId: string, instanceId: string) => void;
  reorderNodesInFrame: (frameId: string, orderedInstanceIds: string[]) => void;
  updateNodeInstance: (frameId: string, instanceId: string, updates: Partial<Omit<NodeInstance, 'instance_id'>>) => void;
  updateNodePosition: (frameId: string, instanceId: string, customX: number, customY?: number, assignedRoleId?: string) => void;
  updateMultipleNodesPositions: (updates: { frameId: string; instanceId: string; customX: number; customY?: number; assignedRoleId?: string }[]) => void;
  moveNodeToFrame: (
    fromFrameId: string,
    toFrameId: string,
    instanceId: string,
    newCustomX?: number,
    assignedRoleId?: string,
    insertIndex?: number
  ) => void;
  resetNodePositions: () => void;

  // Edges
  setEdgeConfig: (frameId: string, edges: EdgeConfig[]) => void;
  updateEdge: (frameId: string, fromInstance: string, toInstance: string, updates: Partial<EdgeConfig>) => void;
  updateEdgeByIndex: (frameId: string, edgeIndex: number, updates: Partial<EdgeConfig>) => void;
  setNextFrameTarget: (frameId: string, targetFrameId: string | null) => void;

  // Computed
  getUsageCount: (baseId: string) => number;
}

const createEmptySchema = (): ProjectSchema => ({
  version: APP_VERSION,
  metadata: {
    project_name: 'Untitled Project',
    updated_at: formatISOTimestamp(),
  },
  settings: {
    workspace_path: '',
    horizontal_spacing: 40,
  },
  roles: [],
  node_palette: [],
  frames: [],
});

const pushHistory = (past: ProjectSchema[], current: ProjectSchema): ProjectSchema[] => {
  const max = 40;
  const newPast = [...past, JSON.parse(JSON.stringify(current))];
  if (newPast.length > max) newPast.shift();
  return newPast;
};

export const useProjectStore = create<ProjectState>()((set, get) => ({
  schema: createEmptySchema(),
  past: [],
  future: [],
  isDirty: false,
  currentFilePath: null,

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  undo: () =>
    set((s) => {
      if (s.past.length === 0) return s;
      const previous = s.past[s.past.length - 1];
      const newPast = s.past.slice(0, -1);
      const newFuture = [JSON.parse(JSON.stringify(s.schema)), ...s.future];
      return {
        schema: previous,
        past: newPast,
        future: newFuture,
        isDirty: true,
      };
    }),

  redo: () =>
    set((s) => {
      if (s.future.length === 0) return s;
      const next = s.future[0];
      const newFuture = s.future.slice(1);
      const newPast = pushHistory(s.past, s.schema);
      return {
        schema: next,
        past: newPast,
        future: newFuture,
        isDirty: true,
      };
    }),

  setProjectName: (name) =>
    set((s) => ({
      past: pushHistory(s.past, s.schema),
      future: [],
      schema: { ...s.schema, metadata: { ...s.schema.metadata, project_name: name, updated_at: formatISOTimestamp() } },
      isDirty: true,
    })),

  loadSchema: (schema) => set({ schema, past: [], future: [], isDirty: false }),

  newProject: () => set({ schema: createEmptySchema(), past: [], future: [], isDirty: false, currentFilePath: null }),

  markClean: () => set({ isDirty: false }),

  setHorizontalSpacing: (spacing) =>
    set((s) => ({
      past: pushHistory(s.past, s.schema),
      future: [],
      schema: {
        ...s.schema,
        settings: {
          ...s.schema.settings,
          horizontal_spacing: spacing,
        },
      },
      isDirty: true,
    })),

  addRole: (name, color) =>
    set((s) => ({
      past: pushHistory(s.past, s.schema),
      future: [],
      schema: {
        ...s.schema,
        roles: [...s.schema.roles, { id: generateRoleId(), name, color }],
      },
      isDirty: true,
    })),

  updateRole: (id, updates) =>
    set((s) => ({
      past: pushHistory(s.past, s.schema),
      future: [],
      schema: {
        ...s.schema,
        roles: s.schema.roles.map((r) => (r.id === id ? { ...r, ...updates } : r)),
      },
      isDirty: true,
    })),

  removeRole: (id) =>
    set((s) => {
      const remainingRoles = s.schema.roles.filter((r) => r.id !== id);
      const fallbackRoleId = remainingRoles[0]?.id;
      const isSpecial = (n: NodeTemplate) => n.node_kind === 'storage' || n.node_kind === 'mediator';
      // Storage / mediator templates are independent of any role: keep them and re-home to another lane.
      const nodePalette = s.schema.node_palette
        .filter((n) => n.role_id !== id || (isSpecial(n) && fallbackRoleId))
        .map((n) => (n.role_id === id && fallbackRoleId ? { ...n, role_id: fallbackRoleId } : n));
      return {
        past: pushHistory(s.past, s.schema),
        future: [],
        schema: {
          ...s.schema,
          roles: remainingRoles,
          node_palette: nodePalette,
        },
        isDirty: true,
      };
    }),

  addNodeTemplate: (template) =>
    set((s) => ({
      past: pushHistory(s.past, s.schema),
      future: [],
      schema: {
        ...s.schema,
        node_palette: [...s.schema.node_palette, { ...template, base_id: generateNodeId() }],
      },
      isDirty: true,
    })),

  updateNodeTemplate: (baseId, updates) =>
    set((s) => ({
      past: pushHistory(s.past, s.schema),
      future: [],
      schema: {
        ...s.schema,
        node_palette: s.schema.node_palette.map((n) => (n.base_id === baseId ? { ...n, ...updates } : n)),
      },
      isDirty: true,
    })),

  removeNodeTemplate: (baseId) =>
    set((s) => ({
      past: pushHistory(s.past, s.schema),
      future: [],
      schema: {
        ...s.schema,
        node_palette: s.schema.node_palette.filter((n) => n.base_id !== baseId),
      },
      isDirty: true,
    })),

  addFrame: (title) =>
    set((s) => {
      const newFrame: Frame = {
        frame_id: generateFrameId(),
        title,
        order: s.schema.frames.length + 1,
        nodes: [],
        edges_config: [],
        next_frame_target: null,
      };
      return {
        past: pushHistory(s.past, s.schema),
        future: [],
        schema: { ...s.schema, frames: [...s.schema.frames, newFrame] },
        isDirty: true,
      };
    }),

  updateFrameTitle: (frameId, title) =>
    set((s) => ({
      past: pushHistory(s.past, s.schema),
      future: [],
      schema: {
        ...s.schema,
        frames: s.schema.frames.map((f) => (f.frame_id === frameId ? { ...f, title } : f)),
      },
      isDirty: true,
    })),

  removeFrame: (frameId) =>
    set((s) => ({
      past: pushHistory(s.past, s.schema),
      future: [],
      schema: {
        ...s.schema,
        frames: s.schema.frames
          .filter((f) => f.frame_id !== frameId)
          .map((f, i) => ({ ...f, order: i + 1 })),
      },
      isDirty: true,
    })),

  reorderFrames: (orderedIds) =>
    set((s) => {
      const frameMap = new Map(s.schema.frames.map((f) => [f.frame_id, f]));
      const reordered = orderedIds
        .map((id, i) => {
          const f = frameMap.get(id);
          return f ? { ...f, order: i + 1 } : null;
        })
        .filter(Boolean) as Frame[];
      return {
        past: pushHistory(s.past, s.schema),
        future: [],
        schema: { ...s.schema, frames: reordered },
        isDirty: true,
      };
    }),

  addNodeToFrame: (frameId, baseId) =>
    set((s) => {
      const template = s.schema.node_palette.find((n) => n.base_id === baseId);
      if (!template) return s;
      const instance: NodeInstance = {
        instance_id: generateInstanceId(baseId),
        base_id: baseId,
        title: template.title,
        custom_label: null,
        node_kind: template.node_kind || 'standard',
        assigned_role_id: template.role_id,
      };
      return {
        past: pushHistory(s.past, s.schema),
        future: [],
        schema: {
          ...s.schema,
          frames: s.schema.frames.map((f) =>
            f.frame_id === frameId ? { ...f, nodes: [...f.nodes, instance] } : f
          ),
        },
        isDirty: true,
      };
    }),

  removeNodeFromFrame: (frameId, instanceId) =>
    set((s) => ({
      past: pushHistory(s.past, s.schema),
      future: [],
      schema: {
        ...s.schema,
        frames: s.schema.frames.map((f) =>
          f.frame_id === frameId
            ? { ...f, nodes: f.nodes.filter((n) => n.instance_id !== instanceId) }
            : f
        ),
      },
      isDirty: true,
    })),

  reorderNodesInFrame: (frameId, orderedInstanceIds) =>
    set((s) => ({
      past: pushHistory(s.past, s.schema),
      future: [],
      schema: {
        ...s.schema,
        frames: s.schema.frames.map((f) => {
          if (f.frame_id !== frameId) return f;
          const nodeMap = new Map(f.nodes.map((n) => [n.instance_id, n]));
          const reordered = orderedInstanceIds.map((id) => nodeMap.get(id)).filter(Boolean) as NodeInstance[];
          return { ...f, nodes: reordered };
        }),
      },
      isDirty: true,
    })),

  updateNodeInstance: (frameId, instanceId, updates) =>
    set((s) => ({
      past: pushHistory(s.past, s.schema),
      future: [],
      schema: {
        ...s.schema,
        frames: s.schema.frames.map((f) =>
          f.frame_id === frameId
            ? {
                ...f,
                nodes: f.nodes.map((n) =>
                  n.instance_id === instanceId ? { ...n, ...updates } : n
                ),
              }
            : f
        ),
      },
      isDirty: true,
    })),

  updateNodePosition: (frameId, instanceId, customX, customY, assignedRoleId) =>
    set((s) => ({
      past: pushHistory(s.past, s.schema),
      future: [],
      schema: {
        ...s.schema,
        frames: s.schema.frames.map((f) => {
          if (f.frame_id !== frameId) return f;
          return {
            ...f,
            nodes: f.nodes.map((n) => {
              if (n.instance_id !== instanceId) return n;
              return {
                ...n,
                custom_x: customX,
                ...(customY !== undefined ? { custom_y: customY } : {}),
                ...(assignedRoleId ? { assigned_role_id: assignedRoleId } : {}),
              };
            }),
          };
        }),
      },
      isDirty: true,
    })),

  updateMultipleNodesPositions: (updates) =>
    set((s) => {
      const updateMap = new Map(updates.map((u) => [u.instanceId, u]));
      return {
        past: pushHistory(s.past, s.schema),
        future: [],
        schema: {
          ...s.schema,
          frames: s.schema.frames.map((f) => ({
            ...f,
            nodes: f.nodes.map((n) => {
              const u = updateMap.get(n.instance_id);
              if (!u) return n;
              return {
                ...n,
                custom_x: u.customX,
                ...(u.customY !== undefined ? { custom_y: u.customY } : {}),
                ...(u.assignedRoleId ? { assigned_role_id: u.assignedRoleId } : {}),
              };
            }),
          })),
        },
        isDirty: true,
      };
    }),

  moveNodeToFrame: (fromFrameId, toFrameId, instanceId, newCustomX, assignedRoleId, insertIndex) =>
    set((s) => {
      let movingNode: NodeInstance | null = null;
      const updatedFrames = s.schema.frames.map((f) => {
        if (f.frame_id === fromFrameId) {
          movingNode = f.nodes.find((n) => n.instance_id === instanceId) || null;
          return {
            ...f,
            nodes: f.nodes.filter((n) => n.instance_id !== instanceId),
            edges_config: f.edges_config.filter(
              (e) => e.from_instance !== instanceId && e.to_instance !== instanceId
            ),
          };
        }
        return f;
      });

      if (!movingNode) return s;

      const targetNode = movingNode as NodeInstance;
      const finalNode: NodeInstance = {
        ...targetNode,
        custom_x: newCustomX !== undefined ? newCustomX : undefined,
        custom_y: undefined,
        ...(assignedRoleId ? { assigned_role_id: assignedRoleId } : {}),
      };

      return {
        past: pushHistory(s.past, s.schema),
        future: [],
        schema: {
          ...s.schema,
          frames: updatedFrames.map((f) => {
            if (f.frame_id !== toFrameId) return f;
            const nodes = [...f.nodes];
            const index =
              insertIndex === undefined ? nodes.length : Math.max(0, Math.min(insertIndex, nodes.length));
            nodes.splice(index, 0, finalNode);
            return { ...f, nodes };
          }),
        },
        isDirty: true,
      };
    }),

  resetNodePositions: () =>
    set((s) => ({
      past: pushHistory(s.past, s.schema),
      future: [],
      schema: {
        ...s.schema,
        frames: s.schema.frames.map((f) => ({
          ...f,
          nodes: f.nodes.map((n) => ({
            ...n,
            custom_x: undefined,
            custom_y: undefined,
          })),
        })),
      },
      isDirty: true,
    })),

  setEdgeConfig: (frameId, edges) =>
    set((s) => ({
      past: pushHistory(s.past, s.schema),
      future: [],
      schema: {
        ...s.schema,
        frames: s.schema.frames.map((f) =>
          f.frame_id === frameId ? { ...f, edges_config: edges } : f
        ),
      },
      isDirty: true,
    })),

  updateEdge: (frameId, fromInstance, toInstance, updates) =>
    set((s) => ({
      past: pushHistory(s.past, s.schema),
      future: [],
      schema: {
        ...s.schema,
        frames: s.schema.frames.map((f) => {
          if (f.frame_id !== frameId) return f;
          const exists = f.edges_config.some(
            (e) => e.from_instance === fromInstance && e.to_instance === toInstance
          );
          if (exists) {
            return {
              ...f,
              edges_config: f.edges_config.map((e) =>
                e.from_instance === fromInstance && e.to_instance === toInstance
                  ? { ...e, ...updates }
                  : e
              ),
            };
          } else {
            return {
              ...f,
              edges_config: [
                ...f.edges_config,
                {
                  from_instance: fromInstance,
                  to_instance: toInstance,
                  message_label: updates.message_label || '',
                  flow_type: updates.flow_type || 'solid',
                  color: updates.color,
                  curvature_offset: updates.curvature_offset,
                },
              ],
            };
          }
        }),
      },
      isDirty: true,
    })),

  updateEdgeByIndex: (frameId, edgeIndex, updates) =>
    set((s) => ({
      past: pushHistory(s.past, s.schema),
      future: [],
      schema: {
        ...s.schema,
        frames: s.schema.frames.map((f) => {
          if (f.frame_id !== frameId) return f;
          return {
            ...f,
            edges_config: f.edges_config.map((e, idx) =>
              idx === edgeIndex ? { ...e, ...updates } : e
            ),
          };
        }),
      },
      isDirty: true,
    })),

  setNextFrameTarget: (frameId, targetFrameId) =>
    set((s) => ({
      past: pushHistory(s.past, s.schema),
      future: [],
      schema: {
        ...s.schema,
        frames: s.schema.frames.map((f) =>
          f.frame_id === frameId ? { ...f, next_frame_target: targetFrameId } : f
        ),
      },
      isDirty: true,
    })),

  getUsageCount: (baseId) => {
    const { schema } = get();
    return schema.frames.reduce(
      (count, frame) => count + frame.nodes.filter((n) => n.base_id === baseId).length,
      0
    );
  },
}));
