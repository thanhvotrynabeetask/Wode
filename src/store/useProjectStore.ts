import { create } from 'zustand';
import { ProjectSchema, Role, NodeTemplate, Frame, NodeInstance, EdgeConfig, NodeBorderAnchor, EdgeRoute, DiagramSection, TabSession } from '../types/schema';
import { LayoutEngine, LayoutNode, LayoutFrameOverlay } from '../services/LayoutEngine';

import { generateRoleId, generateNodeId, generateFrameId, generateInstanceId, generateDiagramId, generateDuplicateTitle } from '../utils/idGenerator';
import { formatISOTimestamp } from '../utils/dateFormat';
import { APP_VERSION } from '../utils/constants';

interface ProjectState {
  schema: ProjectSchema;
  past: ProjectSchema[];
  future: ProjectSchema[];
  isDirty: boolean;
  currentFilePath: string | null;

  // Multi-Tab Session Management (Separates User from MCP Agent)
  tabs: TabSession[];
  activeTabId: string;
  createTab: (title?: string, type?: 'user' | 'agent', initialSchema?: ProjectSchema) => string;
  switchTab: (tabId: string) => void;
  closeTab: (tabId: string) => void;
  renameTab: (tabId: string, newTitle: string) => void;
  handleMCPUpdate: (schema: ProjectSchema, message?: string) => void;
  clearCanvas: () => void;

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
  duplicateNodeTemplate: (baseId: string, targetFrameId?: string) => NodeTemplate | null;

  // Frames
  addFrame: (title: string) => void;
  updateFrameTitle: (frameId: string, title: string) => void;
  updateFrameWidth: (frameId: string, customWidth: number) => void;
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

  // Standalone / Frameless nodes & edges
  addStandaloneNode: (baseId: string) => string;
  removeStandaloneNode: (instanceId: string) => void;
  updateStandaloneEdge: (fromInstance: string, toInstance: string, updates: Partial<EdgeConfig>) => void;

  // Computed
  getUsageCount: (baseId: string) => number;
}

const createEmptySchema = (): ProjectSchema => {
  const initialDiagram: DiagramSection = {
    id: 'diag_1',
    title: 'Diagram 1',
    order: 1,
    frames: [],
    nodes: [],
    edges_config: [],
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
    frames: [],
    nodes: [],
    edges_config: [],
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
            title: schema.metadata?.project_name || 'Diagram 1',
            order: 1,
            roles: schema.roles || [],
            node_palette: schema.node_palette || [],
            frames: schema.frames || [],
            nodes: schema.nodes || [],
            edges_config: schema.edges_config || [],
            edge_routes: schema.edge_routes || {},
          },
        ];

  return diagrams.map((diag) => {
    if (diag.id === activeId) {
      return {
        ...diag,
        roles: schema.roles || [],
        node_palette: schema.node_palette || [],
        frames: schema.frames || [],
        nodes: schema.nodes || [],
        edges_config: schema.edges_config || [],
        edge_routes: schema.edge_routes || {},
      };
    }
    return {
      ...diag,
      roles: diag.roles || [],
      node_palette: diag.node_palette || [],
      frames: diag.frames || [],
      nodes: diag.nodes || [],
      edges_config: diag.edges_config || [],
      edge_routes: diag.edge_routes || {},
    };
  });
}

export function updateActiveDiagramInSchema(
  schema: ProjectSchema,
  updates: {
    frames?: Frame[];
    nodes?: NodeInstance[];
    edges_config?: EdgeConfig[];
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
            title: schema.metadata?.project_name || 'Diagram 1',
            order: 1,
            roles: schema.roles || [],
            node_palette: schema.node_palette || [],
            frames: schema.frames || [],
            nodes: schema.nodes || [],
            edges_config: schema.edges_config || [],
            edge_routes: schema.edge_routes || {},
          },
        ];

  const updatedDiagrams = existingDiagrams.map((d) => {
    if (d.id === activeId) {
      return {
        ...d,
        ...(updates.frames !== undefined ? { frames: updates.frames } : {}),
        ...(updates.nodes !== undefined ? { nodes: updates.nodes } : {}),
        ...(updates.edges_config !== undefined ? { edges_config: updates.edges_config } : {}),
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

const defaultTabId = 'tab_default';
const defaultInitialSchema = createEmptySchema();
const initialTabs: TabSession[] = [
  {
    id: defaultTabId,
    title: 'Workspace 1',
    type: 'user',
    schema: defaultInitialSchema,
    past: [],
    future: [],
    isDirty: false,
    currentFilePath: null,
  },
];

export const useProjectStore = create<ProjectState>()((setOriginal, get) => {
  const set: typeof setOriginal = (partial) => {
    setOriginal((state) => {
      const next = typeof partial === 'function' ? (partial as any)(state) : partial;
      if (!next) return state;

      const nextSchema = next.schema !== undefined ? next.schema : state.schema;
      const nextPast = next.past !== undefined ? next.past : state.past;
      const nextFuture = next.future !== undefined ? next.future : state.future;
      const nextDirty = next.isDirty !== undefined ? next.isDirty : state.isDirty;
      const nextFilePath = next.currentFilePath !== undefined ? next.currentFilePath : state.currentFilePath;

      const nextTabs = next.tabs !== undefined
        ? next.tabs
        : (state.tabs || []).map((t) =>
            t.id === (next.activeTabId || state.activeTabId)
              ? {
                  ...t,
                  schema: nextSchema,
                  past: nextPast,
                  future: nextFuture,
                  isDirty: nextDirty,
                  currentFilePath: nextFilePath,
                }
              : t
          );

      return {
        ...next,
        tabs: nextTabs,
      };
    });
  };

  return {
    schema: defaultInitialSchema,
    past: [],
    future: [],
    isDirty: false,
    currentFilePath: null,

    tabs: initialTabs,
    activeTabId: defaultTabId,

    createTab: (title, type = 'user', initialSchema) => {
      const newId = `tab_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const schema = initialSchema || createEmptySchema();
      const currentTabs = get().tabs;
      const newTitle = title || (type === 'agent' ? '🤖 Agent Session' : `Workspace ${currentTabs.length + 1}`);

      const newTab: TabSession = {
        id: newId,
        title: newTitle,
        type,
        schema,
        past: [],
        future: [],
        isDirty: false,
        currentFilePath: null,
      };

      set((s) => ({
        tabs: [...s.tabs, newTab],
        activeTabId: newId,
        schema: newTab.schema,
        past: [],
        future: [],
        isDirty: false,
        currentFilePath: null,
      }));

      return newId;
    },

    switchTab: (targetTabId) => {
      set((s) => {
        if (targetTabId === s.activeTabId) return s;
        const targetTab = s.tabs.find((t) => t.id === targetTabId);
        if (!targetTab) return s;

        const updatedTabs = s.tabs.map((t) =>
          t.id === targetTabId ? { ...t, hasUnreadUpdate: false } : t
        );

        return {
          tabs: updatedTabs,
          activeTabId: targetTabId,
          schema: targetTab.schema,
          past: targetTab.past,
          future: targetTab.future,
          isDirty: targetTab.isDirty,
          currentFilePath: targetTab.currentFilePath,
        };
      });
    },

    closeTab: (tabId) => {
      set((s) => {
        if (s.tabs.length <= 1) return s;
        const nextTabs = s.tabs.filter((t) => t.id !== tabId);
        if (s.activeTabId === tabId) {
          const nextActive = nextTabs[nextTabs.length - 1];
          return {
            tabs: nextTabs,
            activeTabId: nextActive.id,
            schema: nextActive.schema,
            past: nextActive.past,
            future: nextActive.future,
            isDirty: nextActive.isDirty,
            currentFilePath: nextActive.currentFilePath,
          };
        }
        return { tabs: nextTabs };
      });
    },

    renameTab: (tabId, newTitle) => {
      set((s) => ({
        tabs: s.tabs.map((t) => (t.id === tabId ? { ...t, title: newTitle } : t)),
      }));
    },

    handleMCPUpdate: (mcpSchema, _message) => {
      set((s) => {
        const agentTab = s.tabs.find((t) => t.type === 'agent');
        let nextTabs: TabSession[];
        let targetTabId: string;

        if (agentTab) {
          targetTabId = agentTab.id;
          nextTabs = s.tabs.map((t) =>
            t.id === agentTab.id
              ? {
                  ...t,
                  title: mcpSchema.metadata?.project_name ? `🤖 ${mcpSchema.metadata.project_name}` : t.title,
                  schema: mcpSchema,
                  past: pushHistory(t.past, t.schema),
                  future: [],
                  isDirty: false,
                  hasUnreadUpdate: s.activeTabId !== t.id,
                }
              : t
          );
        } else {
          targetTabId = `tab_agent_${Date.now()}`;
          const newAgentTab: TabSession = {
            id: targetTabId,
            title: mcpSchema.metadata?.project_name ? `🤖 ${mcpSchema.metadata.project_name}` : '🤖 Agent (MCP)',
            type: 'agent',
            schema: mcpSchema,
            past: [],
            future: [],
            isDirty: false,
            currentFilePath: null,
            hasUnreadUpdate: s.activeTabId !== targetTabId,
          };
          nextTabs = [...s.tabs, newAgentTab];
        }

        if (s.activeTabId === targetTabId) {
          return {
            tabs: nextTabs,
            schema: mcpSchema,
            past: pushHistory(s.past, s.schema),
            future: [],
            isDirty: false,
          };
        }

        return {
          tabs: nextTabs,
        };
      });
    },

    clearCanvas: () => {
      const empty = createEmptySchema();
      set((s) => ({
        past: pushHistory(s.past, s.schema),
        future: [],
        schema: empty,
        isDirty: true,
      }));
    },

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
          title: schema.metadata?.project_name || 'Diagram 1',
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
              title: s.schema.metadata?.project_name || 'Diagram 1',
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
      const updatedFrames = s.schema.frames.map((f) => ({
        ...f,
        nodes: f.nodes.map((n) =>
          n.base_id === baseId
            ? {
                ...n,
                ...(updates.title ? { title: updates.title } : {}),
                ...(updates.role_id ? { assigned_role_id: updates.role_id } : {}),
                ...(updates.node_kind ? { node_kind: updates.node_kind } : {}),
              }
            : n
        ),
      }));
      const updatedNodes = (s.schema.nodes || []).map((n) =>
        n.base_id === baseId
          ? {
              ...n,
              ...(updates.title ? { title: updates.title } : {}),
              ...(updates.role_id ? { assigned_role_id: updates.role_id } : {}),
              ...(updates.node_kind ? { node_kind: updates.node_kind } : {}),
            }
          : n
      );
      return {
        past: pushHistory(s.past, s.schema),
        future: [],
        schema: updateActiveDiagramInSchema(s.schema, {
          node_palette: updatedPalette,
          frames: updatedFrames,
          nodes: updatedNodes,
        }),
        isDirty: true,
      };
    }),

  removeNodeTemplate: (baseId) =>
    set((s) => {
      const updatedPalette = s.schema.node_palette.filter((n) => n.base_id !== baseId);
      const updatedFrames = s.schema.frames.map((f) => ({
        ...f,
        nodes: f.nodes.filter((n) => n.base_id !== baseId),
      }));
      const updatedNodes = (s.schema.nodes || []).filter((n) => n.base_id !== baseId);
      return {
        past: pushHistory(s.past, s.schema),
        future: [],
        schema: updateActiveDiagramInSchema(s.schema, {
          node_palette: updatedPalette,
          frames: updatedFrames,
          nodes: updatedNodes,
        }),
        isDirty: true,
      };
    }),

  duplicateNodeTemplate: (baseId, targetFrameId) => {
    let createdTemplate: NodeTemplate | null = null;
    set((s) => {
      const source = s.schema.node_palette.find((n) => n.base_id === baseId);
      if (!source) return s;

      const newBaseId = generateNodeId();
      const existingTitles = s.schema.node_palette.map((t) => t.title);
      const newTitle = generateDuplicateTitle(source.title, existingTitles);

      const newTemplate: NodeTemplate = {
        base_id: newBaseId,
        title: newTitle,
        role_id: source.role_id,
        color: source.color,
        corner_symbol: source.corner_symbol,
        node_kind: source.node_kind,
      };
      createdTemplate = newTemplate;

      const newInstance: NodeInstance = {
        instance_id: generateInstanceId(newBaseId),
        base_id: newBaseId,
        title: newTitle,
        custom_label: null,
        node_kind: newTemplate.node_kind || 'standard',
        assigned_role_id: newTemplate.role_id,
      };

      const updatedPalette = [...s.schema.node_palette, newTemplate];

      let updatedFrames = s.schema.frames;
      let updatedNodes = s.schema.nodes || [];

      if (s.schema.frames.length > 0) {
        const frameId =
          targetFrameId ||
          (s.schema.frames.find((f) => f.frame_id === targetFrameId)?.frame_id) ||
          s.schema.frames[0].frame_id;
        updatedFrames = s.schema.frames.map((f) =>
          f.frame_id === frameId ? { ...f, nodes: [...f.nodes, newInstance] } : f
        );
      } else {
        updatedNodes = [...updatedNodes, newInstance];
      }

      return {
        past: pushHistory(s.past, s.schema),
        future: [],
        schema: updateActiveDiagramInSchema(s.schema, {
          node_palette: updatedPalette,
          frames: updatedFrames,
          nodes: updatedNodes,
        }),
        isDirty: true,
      };
    });
    return createdTemplate;
  },

  addFrame: (title) =>
    set((s) => {
      const isFirstFrame = s.schema.frames.length === 0;
      const initialNodes =
        isFirstFrame && (s.schema.nodes || []).length > 0 ? [...(s.schema.nodes || [])] : [];
      const initialEdges =
        isFirstFrame && (s.schema.edges_config || []).length > 0
          ? [...(s.schema.edges_config || [])]
          : [];
      const newFrame: Frame = {
        frame_id: generateFrameId(),
        title,
        order: s.schema.frames.length + 1,
        nodes: initialNodes,
        edges_config: initialEdges,
        next_frame_target: null,
      };
      const updatedFrames = [...s.schema.frames, newFrame];
      return {
        past: pushHistory(s.past, s.schema),
        future: [],
        schema: updateActiveDiagramInSchema(s.schema, {
          frames: updatedFrames,
          nodes: isFirstFrame ? [] : s.schema.nodes,
          edges_config: isFirstFrame ? [] : s.schema.edges_config,
        }),
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

  updateFrameWidth: (frameId, customWidth) =>
    set((s) => {
      const currentLayout = LayoutEngine.calculate(s.schema);
      const framePosMap = new Map<string, { x: number; width: number }>();
      currentLayout.frames.forEach((f: LayoutFrameOverlay) => {
        framePosMap.set(f.frameId, { x: f.x + 15, width: f.width });
      });

      const updatedFrames = s.schema.frames.map((f) => {
        const fl = framePosMap.get(f.frame_id);
        const lockedX = f.custom_x !== undefined ? f.custom_x : fl?.x;
        if (f.frame_id === frameId) {
          return {
            ...f,
            custom_x: lockedX,
            custom_width: Math.max(80, Math.round(customWidth)),
          };
        }
        return {
          ...f,
          custom_x: lockedX,
        };
      });

      return {
        past: pushHistory(s.past, s.schema),
        future: [],
        schema: updateActiveDiagramInSchema(s.schema, { frames: updatedFrames }),
        isDirty: true,
      };
    }),

  removeFrame: (frameId) =>
    set((s) => {
      // 1. Snapshot the exact current canvas layout before removing the frame
      const currentLayout = LayoutEngine.calculate(s.schema);
      const nodePosMap = new Map<string, { x: number; y: number }>();
      currentLayout.nodes.forEach((n: LayoutNode) => {
        nodePosMap.set(n.instanceId, { x: n.x, y: n.y });
      });
      const framePosMap = new Map<string, { x: number; width: number }>();
      currentLayout.frames.forEach((f: LayoutFrameOverlay) => {
        framePosMap.set(f.frameId, { x: f.x + 15, width: f.width });
      });

      const frameToRemove = s.schema.frames.find((f) => f.frame_id === frameId);

      // 2. Lock coordinates of all remaining frames and their nodes
      const updatedFrames = s.schema.frames
        .filter((f) => f.frame_id !== frameId)
        .map((f, i) => {
          const fl = framePosMap.get(f.frame_id);
          return {
            ...f,
            order: i + 1,
            custom_x: f.custom_x !== undefined ? f.custom_x : fl?.x,
            custom_width: f.custom_width !== undefined ? f.custom_width : (fl ? fl.width - 30 : undefined),
            nodes: f.nodes.map((n) => {
              const np = nodePosMap.get(n.instance_id);
              return {
                ...n,
                custom_x: n.custom_x !== undefined ? n.custom_x : np?.x,
              };
            }),
          };
        });

      // 3. For nodes in the removed frame: freeze their exact canvas coordinates so they do not move a single pixel
      const frameNodes = (frameToRemove?.nodes || []).map((n) => {
        const np = nodePosMap.get(n.instance_id);
        return {
          ...n,
          custom_x: n.custom_x !== undefined ? n.custom_x : np?.x,
        };
      });
      const frameEdges = frameToRemove?.edges_config || [];

      // 4. For existing standalone nodes: also lock custom_x
      const existingStandaloneNodes = (s.schema.nodes || []).map((n) => {
        const np = nodePosMap.get(n.instance_id);
        return {
          ...n,
          custom_x: n.custom_x !== undefined ? n.custom_x : np?.x,
        };
      });

      const newStandaloneNodes = [
        ...existingStandaloneNodes,
        ...frameNodes,
      ];
      const newStandaloneEdges = [
        ...(s.schema.edges_config || []),
        ...frameEdges,
      ];

      return {
        past: pushHistory(s.past, s.schema),
        future: [],
        schema: updateActiveDiagramInSchema(s.schema, {
          frames: updatedFrames,
          nodes: newStandaloneNodes,
          edges_config: newStandaloneEdges,
        }),
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
      if (!frameId || s.schema.frames.length === 0) {
        const updatedNodes = [...(s.schema.nodes || []), instance];
        return {
          past: pushHistory(s.past, s.schema),
          future: [],
          schema: updateActiveDiagramInSchema(s.schema, { nodes: updatedNodes }),
          isDirty: true,
        };
      }
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
        !frameId || f.frame_id === frameId
          ? { ...f, nodes: f.nodes.filter((n) => n.instance_id !== instanceId) }
          : f
      );
      const updatedNodes = (s.schema.nodes || []).filter((n) => n.instance_id !== instanceId);
      return {
        past: pushHistory(s.past, s.schema),
        future: [],
        schema: updateActiveDiagramInSchema(s.schema, { frames: updatedFrames, nodes: updatedNodes }),
        isDirty: true,
      };
    }),

  addStandaloneNode: (baseId) => {
    let newInstanceId = '';
    set((s) => {
      const template = s.schema.node_palette.find((n) => n.base_id === baseId);
      if (!template) return s;
      newInstanceId = generateInstanceId(baseId);
      const instance: NodeInstance = {
        instance_id: newInstanceId,
        base_id: baseId,
        title: template.title,
        custom_label: null,
        node_kind: template.node_kind || 'standard',
        assigned_role_id: template.role_id,
      };
      const updatedNodes = [...(s.schema.nodes || []), instance];
      return {
        past: pushHistory(s.past, s.schema),
        future: [],
        schema: updateActiveDiagramInSchema(s.schema, { nodes: updatedNodes }),
        isDirty: true,
      };
    });
    return newInstanceId;
  },

  removeStandaloneNode: (instanceId) =>
    set((s) => {
      const updatedNodes = (s.schema.nodes || []).filter((n) => n.instance_id !== instanceId);
      const updatedEdges = (s.schema.edges_config || []).filter(
        (e) => e.from_instance !== instanceId && e.to_instance !== instanceId
      );
      return {
        past: pushHistory(s.past, s.schema),
        future: [],
        schema: updateActiveDiagramInSchema(s.schema, { nodes: updatedNodes, edges_config: updatedEdges }),
        isDirty: true,
      };
    }),

  updateStandaloneEdge: (fromInstance, toInstance, updates) =>
    set((s) => {
      const edges = [...(s.schema.edges_config || [])];
      const existingIdx = edges.findIndex(
        (e) => e.from_instance === fromInstance && e.to_instance === toInstance
      );
      if (existingIdx >= 0) {
        edges[existingIdx] = { ...edges[existingIdx], ...updates };
      } else {
        edges.push({
          edge_id: `edge_${fromInstance}_${toInstance}`,
          from_instance: fromInstance,
          to_instance: toInstance,
          message_label: updates.message_label || '',
          flow_type: updates.flow_type || 'solid',
          ...updates,
        });
      }
      return {
        past: pushHistory(s.past, s.schema),
        future: [],
        schema: updateActiveDiagramInSchema(s.schema, { edges_config: edges }),
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
        !frameId || f.frame_id === frameId
          ? {
              ...f,
              nodes: f.nodes.map((n) =>
                n.instance_id === instanceId ? { ...n, ...updates } : n
              ),
            }
          : f
      );
      const updatedNodes = (s.schema.nodes || []).map((n) =>
        n.instance_id === instanceId ? { ...n, ...updates } : n
      );
      return {
        past: pushHistory(s.past, s.schema),
        future: [],
        schema: updateActiveDiagramInSchema(s.schema, {
          frames: updatedFrames,
          nodes: updatedNodes,
        }),
        isDirty: true,
      };
    }),

  updateNodePosition: (frameId, instanceId, customX, customY, assignedRoleId) =>
    set((s) => {
      const updatedFrames = s.schema.frames.map((f) => {
        if (frameId && f.frame_id !== frameId) return f;
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
      const updatedNodes = (s.schema.nodes || []).map((n) => {
        if (n.instance_id !== instanceId) return n;
        return {
          ...n,
          custom_x: customX,
          ...(customY !== undefined ? { custom_y: customY } : {}),
          ...(assignedRoleId ? { assigned_role_id: assignedRoleId } : {}),
        };
      });
      return {
        past: pushHistory(s.past, s.schema),
        future: [],
        schema: updateActiveDiagramInSchema(s.schema, {
          frames: updatedFrames,
          nodes: updatedNodes,
        }),
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
      const updatedNodes = (s.schema.nodes || []).map((n) => {
        const u = updateMap.get(n.instance_id);
        if (!u) return n;
        return {
          ...n,
          custom_x: u.customX,
          ...(u.customY !== undefined ? { custom_y: u.customY } : {}),
          ...(u.assignedRoleId ? { assigned_role_id: u.assignedRoleId } : {}),
        };
      });
      return {
        past: pushHistory(s.past, s.schema),
        future: [],
        schema: updateActiveDiagramInSchema(s.schema, {
          frames: updatedFrames,
          nodes: updatedNodes,
        }),
        isDirty: true,
      };
    }),

  moveNodeToFrame: (fromFrameId, toFrameId, instanceId, newCustomX, assignedRoleId, insertIndex) =>
    set((s) => {
      let movingNode: NodeInstance | null = null;
      let newStandaloneNodes = [...(s.schema.nodes || [])];

      // Check if node is in a frame
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

      // If not found in frames, check standalone nodes
      if (!movingNode) {
        movingNode = newStandaloneNodes.find((n) => n.instance_id === instanceId) || null;
        if (movingNode) {
          newStandaloneNodes = newStandaloneNodes.filter((n) => n.instance_id !== instanceId);
        }
      }

      if (!movingNode) return s;

      const targetNode = movingNode as NodeInstance;
      const finalNode: NodeInstance = {
        ...targetNode,
        custom_x: newCustomX !== undefined ? newCustomX : undefined,
        custom_y: undefined,
        ...(assignedRoleId ? { assigned_role_id: assignedRoleId } : {}),
      };

      if (toFrameId) {
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
          schema: updateActiveDiagramInSchema(s.schema, {
            frames: finalFrames,
            nodes: newStandaloneNodes,
          }),
          isDirty: true,
        };
      } else {
        newStandaloneNodes.push(finalNode);
        return {
          past: pushHistory(s.past, s.schema),
          future: [],
          schema: updateActiveDiagramInSchema(s.schema, {
            frames: updatedFrames,
            nodes: newStandaloneNodes,
          }),
          isDirty: true,
        };
      }
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
    const newDiagram: DiagramSection = {
      id: newId,
      title: title?.trim() || `Diagram ${newOrder}`,
      order: newOrder,
      roles: [], // Sơ đồ mới hoàn toàn: không nhân bản swimlane cũ
      node_palette: [], // Bảng mẫu mới trống hoàn toàn
      frames: [], // Frame là tùy chọn: mặc định không tạo sẵn frame
      nodes: [],
      edges_config: [],
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
        frames: [],
        nodes: [],
        edges_config: [],
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
        nodes: target.nodes || [],
        edges_config: target.edges_config || [],
        edge_routes: target.edge_routes || {},
      },
    });
  },

  getUsageCount: (baseId) => {
    const { schema } = get();
    const frameCount = schema.frames.reduce(
      (count, frame) => count + frame.nodes.filter((n) => n.base_id === baseId).length,
      0
    );
    const standaloneCount = (schema.nodes || []).filter((n) => n.base_id === baseId).length;
    return frameCount + standaloneCount;
  },
};
});
