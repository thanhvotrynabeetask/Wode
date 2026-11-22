import { create } from 'zustand';
import { ProjectSchema, Role, NodeTemplate, Frame, NodeInstance, EdgeConfig, NodeBorderAnchor, EdgeRoute, DiagramSection } from '../types/schema';

import { generateRoleId, generateNodeId, generateFrameId, generateInstanceId, generateDiagramId } from '../utils/idGenerator';
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
  appendDiagramFromFile: (loadedSchema: ProjectSchema) => { addedCount: number; diagramTitle: string };
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
  setEdgeRoute: (
    routeKey: string,
    route:
      | {
          waypoints?: { x: number; y: number }[];
          sourceAnchor?: NodeBorderAnchor;
          targetAnchor?: NodeBorderAnchor;
        }
      | { x: number; y: number }[]
      | null
  ) => void;
  clearAllEdgeRoutes: () => void;

  // Multi-Diagram support
  addDiagram: (title?: string) => string;
  duplicateDiagram: (options?: {
    sourceDiagramId?: string;
    title?: string;
    duplicateContent?: boolean;
  }) => string;
  removeDiagram: (diagramId: string) => void;
  reorderDiagrams: (orderedIds: string[]) => void;
  moveDiagram: (diagramId: string, direction: 'up' | 'down') => void;
  updateDiagramTitle: (diagramId: string, title: string) => void;
  setActiveDiagram: (diagramId: string) => void;

  // Computed
  getUsageCount: (baseId: string) => number;
}

const createEmptySchema = (): ProjectSchema => {
  const initialFrame: Frame = {
    frame_id: 'frame_1',
    title: 'Giai đoạn 1',
    order: 1,
    nodes: [],
    edges_config: [],
  };
  const initialDiagram: DiagramSection = {
    id: 'diag_1',
    title: 'Sơ đồ 1',
    order: 1,
    frames: [initialFrame],
    edge_routes: {},
  };
  return {
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
    frames: [initialFrame],
    diagrams: [initialDiagram],
    active_diagram_id: 'diag_1',
  };
};

export function syncActiveDiagramToDiagrams(schema: ProjectSchema): DiagramSection[] {
  const activeId = schema.active_diagram_id || schema.diagrams?.[0]?.id || 'diag_1';
  const diagrams =
    schema.diagrams && schema.diagrams.length > 0
      ? [...schema.diagrams]
      : [
          {
            id: activeId,
            title: schema.metadata?.project_name || 'Sơ đồ 1',
            order: 1,
            roles: schema.roles || [],
            node_palette: schema.node_palette || [],
            frames: schema.frames || [],
            edge_routes: schema.edge_routes || {},
          },
        ];

  return diagrams.map((diag) => {
    if (diag.id === activeId) {
      return {
        ...diag,
        roles: schema.roles || [],
        node_palette: schema.node_palette || [],
        frames: schema.frames,
        edge_routes: schema.edge_routes || {},
      };
    }
    return {
      ...diag,
      roles: diag.roles || [],
      node_palette: diag.node_palette || [],
      frames: diag.frames || [],
      edge_routes: diag.edge_routes || {},
    };
  });
}

export function updateActiveDiagramInSchema(
  schema: ProjectSchema,
  updates: {
    frames?: Frame[];
    roles?: Role[];
    node_palette?: NodeTemplate[];
    edge_routes?: Record<string, EdgeRoute>;
  }
): ProjectSchema {
  const activeId = schema.active_diagram_id || schema.diagrams?.[0]?.id || 'diag_1';
  const existingDiagrams =
    schema.diagrams && schema.diagrams.length > 0
      ? schema.diagrams
      : [
          {
            id: activeId,
            title: schema.metadata?.project_name || 'Sơ đồ 1',
            order: 1,
            roles: schema.roles || [],
            node_palette: schema.node_palette || [],
            frames: schema.frames || [],
            edge_routes: schema.edge_routes || {},
          },
        ];

  const updatedDiagrams = existingDiagrams.map((d) => {
    if (d.id === activeId) {
      return {
        ...d,
        ...(updates.frames !== undefined ? { frames: updates.frames } : {}),
        ...(updates.roles !== undefined ? { roles: updates.roles } : {}),
        ...(updates.node_palette !== undefined ? { node_palette: updates.node_palette } : {}),
        ...(updates.edge_routes !== undefined ? { edge_routes: updates.edge_routes } : {}),
      };
    }
    return d;
  });

  return {
    ...schema,
    ...updates,
    diagrams: updatedDiagrams,
  };
}

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

  loadSchema: (schema) => {
    let diagrams = schema.diagrams;
    if (!diagrams || diagrams.length === 0) {
      diagrams = [
        {
          id: 'diag_1',
          title: schema.metadata?.project_name || 'Sơ đồ 1',
          order: 1,
          roles: schema.roles || [],
          node_palette: schema.node_palette || [],
          frames: schema.frames || [],
          edge_routes: schema.edge_routes || {},
        },
      ];
    } else {
      diagrams = diagrams.map((d, idx) => ({
        ...d,
        order: d.order || idx + 1,
        roles: d.roles || [],
        node_palette: d.node_palette || [],
        frames: d.frames || [],
        edge_routes: d.edge_routes || {},
      }));
    }
    const activeId = schema.active_diagram_id || diagrams[0].id;
    const activeDiagram = diagrams.find((d) => d.id === activeId) || diagrams[0];

    set({
      schema: {
        ...schema,
        roles: activeDiagram.roles || [],
        node_palette: activeDiagram.node_palette || [],
        diagrams,
        active_diagram_id: activeDiagram.id,
        frames: activeDiagram.frames,
        edge_routes: activeDiagram.edge_routes || {},
      },
      past: [],
      future: [],
      isDirty: false,
    });
  },

  appendDiagramFromFile: (loaded) => {
    const s = get();
    const activeId = s.schema.active_diagram_id || s.schema.diagrams?.[0]?.id || 'diag_1';

    // 1. Current diagrams (with their own roles, palette, frames, routes preserved)
    const currentDiagrams: DiagramSection[] = (
      s.schema.diagrams && s.schema.diagrams.length > 0
        ? s.schema.diagrams
        : [
            {
              id: activeId,
              title: s.schema.metadata?.project_name || 'Sơ đồ 1',
              order: 1,
              roles: s.schema.roles || [],
              node_palette: s.schema.node_palette || [],
              frames: s.schema.frames || [],
              edge_routes: s.schema.edge_routes || {},
            },
          ]
    ).map((d) => {
      if (d.id === activeId) {
        return {
          ...d,
          roles: s.schema.roles || d.roles || [],
          node_palette: s.schema.node_palette || d.node_palette || [],
          frames: s.schema.frames,
          edge_routes: s.schema.edge_routes || {},
        };
      }
      return d;
    });

    // 2. Incoming file roles & palette (for the new diagram to keep independently)
    const incomingRoles: Role[] = (loaded.roles || []).map((r) => ({ ...r }));
    const incomingPalette: NodeTemplate[] = (loaded.node_palette || []).map((t) => ({ ...t }));

    // 3. Extract incoming diagrams
    const rawIncomingDiagrams: DiagramSection[] =
      loaded.diagrams && loaded.diagrams.length > 0
        ? loaded.diagrams
        : [
            {
              id: generateDiagramId(),
              title: loaded.metadata?.project_name || 'Sơ đồ bổ sung',
              order: 1,
              roles: incomingRoles,
              node_palette: incomingPalette,
              frames: loaded.frames || [],
              edge_routes: loaded.edge_routes || {},
            },
          ];

    // 4. Remap IDs in each incoming diagram to prevent collisions with existing canvas,
    // and strictly isolate its nodes, frames, edges, and routes.
    const remappedDiagrams: DiagramSection[] = rawIncomingDiagrams.map((diag, diagIdx) => {
      const newDiagId = generateDiagramId();
      const frameIdMap = new Map<string, string>();
      const instanceIdMap = new Map<string, string>();

      // Register new unique IDs for each frame and node instance in THIS diagram
      diag.frames.forEach((f) => {
        frameIdMap.set(f.frame_id, generateFrameId());
        f.nodes.forEach((n) => {
          instanceIdMap.set(n.instance_id, generateInstanceId(n.base_id));
        });
      });

      const remappedFrames: Frame[] = diag.frames.map((f, fIdx) => {
        const newFrameId = frameIdMap.get(f.frame_id) || generateFrameId();
        // next_frame_target MUST ONLY point to a frame within THIS diagram
        const newNextTarget =
          f.next_frame_target && frameIdMap.has(f.next_frame_target)
            ? frameIdMap.get(f.next_frame_target)!
            : null;

        const remappedNodes: NodeInstance[] = f.nodes.map((n) => ({
          ...n,
          instance_id: instanceIdMap.get(n.instance_id) || generateInstanceId(n.base_id),
          custom_y: undefined, // Reset absolute Y coordinate to place node centered inside its new lane
        }));

        // Filter and remap edges: BOTH from_instance AND to_instance MUST exist in THIS diagram's node map
        const remappedEdges: EdgeConfig[] = (f.edges_config || [])
          .filter((e) => instanceIdMap.has(e.from_instance) && instanceIdMap.has(e.to_instance))
          .map((e) => ({
            ...e,
            from_instance: instanceIdMap.get(e.from_instance)!,
            to_instance: instanceIdMap.get(e.to_instance)!,
          }));

        return {
          ...f,
          frame_id: newFrameId,
          order: fIdx + 1,
          next_frame_target: newNextTarget,
          nodes: remappedNodes,
          edges_config: remappedEdges,
        };
      });

      // Remap edge routes strictly within this diagram (preserve anchors, drop old absolute waypoints)
      const remappedRoutes: Record<string, EdgeRoute> = {};
      if (diag.edge_routes) {
        Object.entries(diag.edge_routes).forEach(([key, route]) => {
          const parts = key.split('>');
          if (parts.length === 2 && instanceIdMap.has(parts[0]) && instanceIdMap.has(parts[1])) {
            const newFrom = instanceIdMap.get(parts[0])!;
            const newTo = instanceIdMap.get(parts[1])!;
            remappedRoutes[`${newFrom}>${newTo}`] = {
              sourceAnchor: route.sourceAnchor,
              targetAnchor: route.targetAnchor,
            };
          }
        });
      }

      const diagRoles = diag.roles && diag.roles.length > 0 ? diag.roles : incomingRoles;
      const diagPalette =
        diag.node_palette && diag.node_palette.length > 0 ? diag.node_palette : incomingPalette;

      return {
        id: newDiagId,
        title: diag.title || loaded.metadata?.project_name || `Sơ đồ bổ sung ${diagIdx + 1}`,
        order: currentDiagrams.length + diagIdx + 1,
        roles: diagRoles,
        node_palette: diagPalette,
        frames: remappedFrames,
        edge_routes: remappedRoutes,
      };
    });

    const allDiagrams = [...currentDiagrams, ...remappedDiagrams];
    const firstAdded = remappedDiagrams[0];

    set({
      past: pushHistory(s.past, s.schema),
      future: [],
      schema: {
        ...s.schema,
        diagrams: allDiagrams,
        active_diagram_id: firstAdded.id,
        roles: firstAdded.roles || [],
        node_palette: firstAdded.node_palette || [],
        frames: firstAdded.frames,
        edge_routes: firstAdded.edge_routes || {},
      },
      isDirty: true,
    });

    return {
      addedCount: remappedDiagrams.length,
      diagramTitle: firstAdded.title,
    };
  },

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
    set((s) => {
      const updatedRoles = [...s.schema.roles, { id: generateRoleId(), name, color }];
      return {
        past: pushHistory(s.past, s.schema),
        future: [],
        schema: updateActiveDiagramInSchema(s.schema, { roles: updatedRoles }),
        isDirty: true,
      };
    }),

  updateRole: (id, updates) =>
    set((s) => {
      const updatedRoles = s.schema.roles.map((r) => (r.id === id ? { ...r, ...updates } : r));
      return {
        past: pushHistory(s.past, s.schema),
        future: [],
        schema: updateActiveDiagramInSchema(s.schema, { roles: updatedRoles }),
        isDirty: true,
      };
    }),

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
        schema: updateActiveDiagramInSchema(s.schema, {
          roles: remainingRoles,
          node_palette: nodePalette,
        }),
        isDirty: true,
      };
    }),

  addNodeTemplate: (template) =>
    set((s) => {
      const updatedPalette = [...s.schema.node_palette, { ...template, base_id: generateNodeId() }];
      return {
        past: pushHistory(s.past, s.schema),
        future: [],
        schema: updateActiveDiagramInSchema(s.schema, { node_palette: updatedPalette }),
        isDirty: true,
      };
    }),

  updateNodeTemplate: (baseId, updates) =>
    set((s) => {
      const updatedPalette = s.schema.node_palette.map((n) => (n.base_id === baseId ? { ...n, ...updates } : n));
      return {
        past: pushHistory(s.past, s.schema),
        future: [],
        schema: updateActiveDiagramInSchema(s.schema, { node_palette: updatedPalette }),
        isDirty: true,
      };
    }),

  removeNodeTemplate: (baseId) =>
    set((s) => {
      const updatedPalette = s.schema.node_palette.filter((n) => n.base_id !== baseId);
      return {
        past: pushHistory(s.past, s.schema),
        future: [],
        schema: updateActiveDiagramInSchema(s.schema, { node_palette: updatedPalette }),
        isDirty: true,
      };
    }),

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
      const updatedFrames = [...s.schema.frames, newFrame];
      return {
        past: pushHistory(s.past, s.schema),
        future: [],
        schema: updateActiveDiagramInSchema(s.schema, { frames: updatedFrames }),
        isDirty: true,
      };
    }),

  updateFrameTitle: (frameId, title) =>
    set((s) => {
      const updatedFrames = s.schema.frames.map((f) => (f.frame_id === frameId ? { ...f, title } : f));
      return {
        past: pushHistory(s.past, s.schema),
        future: [],
        schema: updateActiveDiagramInSchema(s.schema, { frames: updatedFrames }),
        isDirty: true,
      };
    }),

  removeFrame: (frameId) =>
    set((s) => {
      const updatedFrames = s.schema.frames
        .filter((f) => f.frame_id !== frameId)
        .map((f, i) => ({ ...f, order: i + 1 }));
      return {
        past: pushHistory(s.past, s.schema),
        future: [],
        schema: updateActiveDiagramInSchema(s.schema, { frames: updatedFrames }),
        isDirty: true,
      };
    }),

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
        schema: updateActiveDiagramInSchema(s.schema, { frames: reordered }),
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
      const updatedFrames = s.schema.frames.map((f) =>
        f.frame_id === frameId ? { ...f, nodes: [...f.nodes, instance] } : f
      );
      return {
        past: pushHistory(s.past, s.schema),
        future: [],
        schema: updateActiveDiagramInSchema(s.schema, { frames: updatedFrames }),
        isDirty: true,
      };
    }),

  removeNodeFromFrame: (frameId, instanceId) =>
    set((s) => {
      const updatedFrames = s.schema.frames.map((f) =>
        f.frame_id === frameId
          ? { ...f, nodes: f.nodes.filter((n) => n.instance_id !== instanceId) }
          : f
      );
      return {
        past: pushHistory(s.past, s.schema),
        future: [],
        schema: updateActiveDiagramInSchema(s.schema, { frames: updatedFrames }),
        isDirty: true,
      };
    }),

  reorderNodesInFrame: (frameId, orderedInstanceIds) =>
    set((s) => {
      const updatedFrames = s.schema.frames.map((f) => {
        if (f.frame_id !== frameId) return f;
        const nodeMap = new Map(f.nodes.map((n) => [n.instance_id, n]));
        const reordered = orderedInstanceIds.map((id) => nodeMap.get(id)).filter(Boolean) as NodeInstance[];
        const sortedX = f.nodes
          .map((n) => n.custom_x)
          .filter((x): x is number => x !== undefined)
          .sort((a, b) => a - b);
        if (sortedX.length === reordered.length && sortedX.length > 0) {
          reordered.forEach((node, idx) => {
            node.custom_x = sortedX[idx];
          });
        } else {
          reordered.forEach((node) => {
            delete node.custom_x;
          });
        }
        return { ...f, nodes: reordered };
      });
      return {
        past: pushHistory(s.past, s.schema),
        future: [],
        schema: updateActiveDiagramInSchema(s.schema, { frames: updatedFrames }),
        isDirty: true,
      };
    }),

  updateNodeInstance: (frameId, instanceId, updates) =>
    set((s) => {
      const updatedFrames = s.schema.frames.map((f) =>
        f.frame_id === frameId
          ? {
              ...f,
              nodes: f.nodes.map((n) =>
                n.instance_id === instanceId ? { ...n, ...updates } : n
              ),
            }
          : f
      );
      return {
        past: pushHistory(s.past, s.schema),
        future: [],
        schema: updateActiveDiagramInSchema(s.schema, { frames: updatedFrames }),
        isDirty: true,
      };
    }),

  updateNodePosition: (frameId, instanceId, customX, customY, assignedRoleId) =>
    set((s) => {
      const updatedFrames = s.schema.frames.map((f) => {
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
      });
      return {
        past: pushHistory(s.past, s.schema),
        future: [],
        schema: updateActiveDiagramInSchema(s.schema, { frames: updatedFrames }),
        isDirty: true,
      };
    }),

  updateMultipleNodesPositions: (updates) =>
    set((s) => {
      const updateMap = new Map(updates.map((u) => [u.instanceId, u]));
      const updatedFrames = s.schema.frames.map((f) => ({
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
      }));
      return {
        past: pushHistory(s.past, s.schema),
        future: [],
        schema: updateActiveDiagramInSchema(s.schema, { frames: updatedFrames }),
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

      const finalFrames = updatedFrames.map((f) => {
        if (f.frame_id !== toFrameId) return f;
        const nodes = [...f.nodes];
        const index =
          insertIndex === undefined ? nodes.length : Math.max(0, Math.min(insertIndex, nodes.length));
        nodes.splice(index, 0, finalNode);
        return { ...f, nodes };
      });

      return {
        past: pushHistory(s.past, s.schema),
        future: [],
        schema: updateActiveDiagramInSchema(s.schema, { frames: finalFrames }),
        isDirty: true,
      };
    }),

  resetNodePositions: () =>
    set((s) => {
      const updatedFrames = s.schema.frames.map((f) => ({
        ...f,
        nodes: f.nodes.map((n) => ({
          ...n,
          custom_x: undefined,
          custom_y: undefined,
        })),
      }));
      return {
        past: pushHistory(s.past, s.schema),
        future: [],
        schema: updateActiveDiagramInSchema(s.schema, { frames: updatedFrames }),
        isDirty: true,
      };
    }),

  setEdgeConfig: (frameId, edges) =>
    set((s) => {
      const updatedFrames = s.schema.frames.map((f) =>
        f.frame_id === frameId ? { ...f, edges_config: edges } : f
      );
      return {
        past: pushHistory(s.past, s.schema),
        future: [],
        schema: updateActiveDiagramInSchema(s.schema, { frames: updatedFrames }),
        isDirty: true,
      };
    }),

  updateEdge: (frameId, fromInstance, toInstance, updates) =>
    set((s) => {
      const updatedFrames = s.schema.frames.map((f) => {
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
          const baseEdges: EdgeConfig[] =
            f.edges_config.length > 0
              ? f.edges_config
              : f.nodes.slice(0, -1).map((n, i) => ({
                  from_instance: n.instance_id,
                  to_instance: f.nodes[i + 1].instance_id,
                  message_label: '',
                  flow_type: 'solid' as const,
                }));
          return {
            ...f,
            edges_config: [
              ...baseEdges,
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
      });
      return {
        past: pushHistory(s.past, s.schema),
        future: [],
        schema: updateActiveDiagramInSchema(s.schema, { frames: updatedFrames }),
        isDirty: true,
      };
    }),

  setEdgeRoute: (routeKey, routeOrWaypoints) =>
    set((s) => {
      const routes = { ...(s.schema.edge_routes || {}) };
      if (!routeOrWaypoints) {
        delete routes[routeKey];
      } else if (Array.isArray(routeOrWaypoints)) {
        if (routeOrWaypoints.length > 0) {
          routes[routeKey] = {
            ...(routes[routeKey] || {}),
            waypoints: routeOrWaypoints,
          };
        } else {
          const existing = routes[routeKey];
          if (existing?.sourceAnchor || existing?.targetAnchor) {
            delete existing.waypoints;
            routes[routeKey] = { ...existing };
          } else {
            delete routes[routeKey];
          }
        }
      } else {
        const { waypoints, sourceAnchor, targetAnchor } = routeOrWaypoints;
        const existing = routes[routeKey] || {};
        const updated: EdgeRoute = {
          ...existing,
          ...(waypoints !== undefined ? { waypoints } : {}),
          ...(sourceAnchor !== undefined ? { sourceAnchor } : {}),
          ...(targetAnchor !== undefined ? { targetAnchor } : {}),
        };
        if (updated.waypoints && updated.waypoints.length === 0) {
          delete updated.waypoints;
        }
        if (updated.waypoints || updated.sourceAnchor || updated.targetAnchor) {
          routes[routeKey] = updated;
        } else {
          delete routes[routeKey];
        }
      }
      const updatedRoutes = Object.keys(routes).length > 0 ? routes : undefined;
      return {
        past: pushHistory(s.past, s.schema),
        future: [],
        schema: updateActiveDiagramInSchema(s.schema, { edge_routes: updatedRoutes }),
        isDirty: true,
      };
    }),

  clearAllEdgeRoutes: () =>
    set((s) => ({
      past: pushHistory(s.past, s.schema),
      future: [],
      schema: updateActiveDiagramInSchema(s.schema, { edge_routes: undefined }),
      isDirty: true,
    })),

  updateEdgeByIndex: (frameId, edgeIndex, updates) =>
    set((s) => {
      const updatedFrames = s.schema.frames.map((f) => {
        if (f.frame_id !== frameId) return f;
        return {
          ...f,
          edges_config: f.edges_config.map((e, idx) =>
            idx === edgeIndex ? { ...e, ...updates } : e
          ),
        };
      });
      return {
        past: pushHistory(s.past, s.schema),
        future: [],
        schema: updateActiveDiagramInSchema(s.schema, { frames: updatedFrames }),
        isDirty: true,
      };
    }),

  setNextFrameTarget: (frameId, targetFrameId) =>
    set((s) => {
      const updatedFrames = s.schema.frames.map((f) =>
        f.frame_id === frameId ? { ...f, next_frame_target: targetFrameId } : f
      );
      return {
        past: pushHistory(s.past, s.schema),
        future: [],
        schema: updateActiveDiagramInSchema(s.schema, { frames: updatedFrames }),
        isDirty: true,
      };
    }),

  // Multi-Diagram support
  addDiagram: (title) => {
    const s = get();
    const currentDiagrams = syncActiveDiagramToDiagrams(s.schema);
    const newId = generateDiagramId();
    const newOrder = currentDiagrams.length + 1;
    const initialFrame: Frame = {
      frame_id: generateFrameId(),
      title: 'Giai đoạn 1',
      order: 1,
      nodes: [],
      edges_config: [],
      next_frame_target: null,
    };
    const newDiagram: DiagramSection = {
      id: newId,
      title: title?.trim() || `Sơ đồ ${newOrder}`,
      order: newOrder,
      roles: [], // Sơ đồ mới hoàn toàn: không nhân bản swimlane cũ
      node_palette: [], // Bảng mẫu mới trống hoàn toàn
      frames: [initialFrame],
      edge_routes: {},
    };
    const updatedDiagrams = [...currentDiagrams, newDiagram];
    set({
      past: pushHistory(s.past, s.schema),
      future: [],
      schema: {
        ...s.schema,
        diagrams: updatedDiagrams,
        active_diagram_id: newId,
        roles: [],
        node_palette: [],
        frames: newDiagram.frames,
        edge_routes: {},
      },
      isDirty: true,
    });
    return newId;
  },

  duplicateDiagram: (options) => {
    const s = get();
    const currentDiagrams = syncActiveDiagramToDiagrams(s.schema);
    const sourceId = options?.sourceDiagramId || s.schema.active_diagram_id || currentDiagrams[0]?.id;
    const source = currentDiagrams.find((d) => d.id === sourceId) || currentDiagrams[0];
    if (!source) return '';

    const newId = generateDiagramId();
    const newOrder = currentDiagrams.length + 1;
    const duplicateContent = options?.duplicateContent ?? true;

    // 1. Remap roles with fresh IDs
    const roleIdMap = new Map<string, string>();
    const newRoles: Role[] = (source.roles || []).map((r) => {
      const newRoleId = generateRoleId();
      roleIdMap.set(r.id, newRoleId);
      return {
        ...r,
        id: newRoleId,
      };
    });

    // 2. Remap node palette with fresh base_ids and remapped role_ids
    const templateIdMap = new Map<string, string>();
    const newPalette: NodeTemplate[] = (source.node_palette || []).map((tpl) => {
      const newBaseId = generateNodeId();
      templateIdMap.set(tpl.base_id, newBaseId);
      return {
        ...tpl,
        base_id: newBaseId,
        role_id: roleIdMap.get(tpl.role_id) || tpl.role_id,
      };
    });

    let newFrames: Frame[] = [];
    const newRoutes: Record<string, EdgeRoute> = {};

    if (duplicateContent) {
      // 3. Remap frames, node instances, and edges
      const frameIdMap = new Map<string, string>();
      const instanceIdMap = new Map<string, string>();

      source.frames.forEach((f) => {
        frameIdMap.set(f.frame_id, generateFrameId());
        f.nodes.forEach((n) => {
          instanceIdMap.set(n.instance_id, generateInstanceId(templateIdMap.get(n.base_id) || n.base_id));
        });
      });

      newFrames = source.frames.map((f, fIdx) => {
        const newFrameId = frameIdMap.get(f.frame_id) || generateFrameId();
        const newNextTarget =
          f.next_frame_target && frameIdMap.has(f.next_frame_target)
            ? frameIdMap.get(f.next_frame_target)!
            : null;

        const remappedNodes: NodeInstance[] = f.nodes.map((n) => ({
          ...n,
          instance_id: instanceIdMap.get(n.instance_id) || generateInstanceId(n.base_id),
          base_id: templateIdMap.get(n.base_id) || n.base_id,
          assigned_role_id: n.assigned_role_id ? (roleIdMap.get(n.assigned_role_id) || n.assigned_role_id) : undefined,
          custom_y: undefined,
        }));

        const remappedEdges: EdgeConfig[] = (f.edges_config || [])
          .filter((e) => instanceIdMap.has(e.from_instance) && instanceIdMap.has(e.to_instance))
          .map((e) => ({
            ...e,
            from_instance: instanceIdMap.get(e.from_instance)!,
            to_instance: instanceIdMap.get(e.to_instance)!,
          }));

        return {
          ...f,
          frame_id: newFrameId,
          order: fIdx + 1,
          next_frame_target: newNextTarget,
          nodes: remappedNodes,
          edges_config: remappedEdges,
        };
      });

      // Remap edge routes
      if (source.edge_routes) {
        Object.entries(source.edge_routes).forEach(([key, route]) => {
          const parts = key.split('>');
          if (parts.length === 2 && instanceIdMap.has(parts[0]) && instanceIdMap.has(parts[1])) {
            const newFrom = instanceIdMap.get(parts[0])!;
            const newTo = instanceIdMap.get(parts[1])!;
            newRoutes[`${newFrom}>${newTo}`] = {
              sourceAnchor: route.sourceAnchor,
              targetAnchor: route.targetAnchor,
            };
          }
        });
      }
    } else {
      // Empty content: single empty frame
      newFrames = [
        {
          frame_id: generateFrameId(),
          title: 'Giai đoạn 1',
          order: 1,
          nodes: [],
          edges_config: [],
          next_frame_target: null,
        },
      ];
    }

    const defaultTitle = `${source.title} (Bản sao)`;
    const newTitle = options?.title?.trim() || defaultTitle;

    const newDiagram: DiagramSection = {
      id: newId,
      title: newTitle,
      order: newOrder,
      roles: newRoles,
      node_palette: newPalette,
      frames: newFrames,
      edge_routes: newRoutes,
    };

    const updatedDiagrams = [...currentDiagrams, newDiagram];
    set({
      past: pushHistory(s.past, s.schema),
      future: [],
      schema: {
        ...s.schema,
        diagrams: updatedDiagrams,
        active_diagram_id: newId,
        roles: newRoles,
        node_palette: newPalette,
        frames: newFrames,
        edge_routes: newRoutes,
      },
      isDirty: true,
    });

    return newId;
  },

  removeDiagram: (diagramId) => {
    const s = get();
    const currentDiagrams = syncActiveDiagramToDiagrams(s.schema);
    if (currentDiagrams.length <= 1) return;

    const remaining = currentDiagrams
      .filter((d) => d.id !== diagramId)
      .map((d, idx) => ({ ...d, order: idx + 1 }));

    const nextActive = remaining[0];
    set({
      past: pushHistory(s.past, s.schema),
      future: [],
      schema: {
        ...s.schema,
        diagrams: remaining,
        active_diagram_id: nextActive.id,
        roles: nextActive.roles || [],
        node_palette: nextActive.node_palette || [],
        frames: nextActive.frames,
        edge_routes: nextActive.edge_routes || {},
      },
      isDirty: true,
    });
  },

  reorderDiagrams: (orderedIds) => {
    const s = get();
    const currentDiagrams = syncActiveDiagramToDiagrams(s.schema);
    const diagMap = new Map(currentDiagrams.map((d) => [d.id, d]));
    const reordered = orderedIds
      .map((id) => diagMap.get(id))
      .filter(Boolean) as DiagramSection[];
    const updated = reordered.map((d, idx) => ({ ...d, order: idx + 1 }));

    set({
      past: pushHistory(s.past, s.schema),
      future: [],
      schema: {
        ...s.schema,
        diagrams: updated,
      },
      isDirty: true,
    });
  },

  moveDiagram: (diagramId, direction) => {
    const s = get();
    const currentDiagrams = syncActiveDiagramToDiagrams(s.schema);
    const index = currentDiagrams.findIndex((d) => d.id === diagramId);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentDiagrams.length) return;

    const reordered = [...currentDiagrams];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    const updated = reordered.map((d, idx) => ({ ...d, order: idx + 1 }));
    set({
      past: pushHistory(s.past, s.schema),
      future: [],
      schema: {
        ...s.schema,
        diagrams: updated,
      },
      isDirty: true,
    });
  },

  updateDiagramTitle: (diagramId, title) => {
    const s = get();
    const currentDiagrams = syncActiveDiagramToDiagrams(s.schema);
    const updated = currentDiagrams.map((d) =>
      d.id === diagramId ? { ...d, title: title.trim() || d.title } : d
    );
    set({
      past: pushHistory(s.past, s.schema),
      future: [],
      schema: {
        ...s.schema,
        diagrams: updated,
      },
      isDirty: true,
    });
  },

  setActiveDiagram: (diagramId) => {
    const s = get();
    const currentDiagrams = syncActiveDiagramToDiagrams(s.schema);
    const target = currentDiagrams.find((d) => d.id === diagramId);
    if (!target) return;

    set({
      schema: {
        ...s.schema,
        diagrams: currentDiagrams,
        active_diagram_id: diagramId,
        roles: target.roles || [],
        node_palette: target.node_palette || [],
        frames: target.frames || [],
        edge_routes: target.edge_routes || {},
      },
    });
  },

  getUsageCount: (baseId) => {
    const { schema } = get();
    return schema.frames.reduce(
      (count, frame) => count + frame.nodes.filter((n) => n.base_id === baseId).length,
      0
    );
  },
}));
