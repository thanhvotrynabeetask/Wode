import { create } from 'zustand';
import { UIState, Toast, ActivePanel, CanvasInteractionMode } from '../types/state';
import { generateId } from '../utils/idGenerator';
import { CANVAS_DEFAULTS } from '../utils/constants';

interface UIActions {
  setActivePanel: (panel: ActivePanel) => void;
  setInteractionMode: (mode: CanvasInteractionMode) => void;
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  resetView: () => void;
  setSelectedFrame: (frameId: string | null) => void;
  setSelectedInstance: (instanceId: string | null) => void;
  toggleSelectInstance: (instanceId: string, isMulti: boolean) => void;
  setSelectedInstances: (instanceIds: string[]) => void;
  selectAllInstances: (allIds: string[]) => void;
  setHighlightedPath: (instanceIds: string[]) => void;
  clearSelection: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  toggleSidebar: () => void;
  toggleListing: (instanceId: string) => void;
  addToast: (type: Toast['type'], message: string) => void;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIState & UIActions & { expandedListings: Set<string> }>()((set) => ({
  activePanel: 'palette',
  interactionMode: 'select',
  zoom: 1,
  panX: 0,
  panY: 0,
  selection: {
    selectedFrameId: null,
    selectedInstanceId: null,
    selectedInstanceIds: [],
    highlightedPath: [],
  },
  isSettingsOpen: false,
  isSidebarExpanded: true,
  expandedListings: new Set<string>(),
  toasts: [],

  setActivePanel: (panel) => set({ activePanel: panel }),
  setInteractionMode: (mode) => set({ interactionMode: mode }),
  setZoom: (zoom) => set({ zoom: Math.min(CANVAS_DEFAULTS.ZOOM_MAX, Math.max(CANVAS_DEFAULTS.ZOOM_MIN, zoom)) }),
  setPan: (panX, panY) => set({ panX, panY }),
  resetView: () => set({ zoom: 1, panX: 0, panY: 0 }),

  setSelectedFrame: (frameId) =>
    set((s) => ({ selection: { ...s.selection, selectedFrameId: frameId } })),

  setSelectedInstance: (instanceId) =>
    set((s) => ({
      selection: {
        ...s.selection,
        selectedInstanceId: instanceId,
        selectedInstanceIds: instanceId ? [instanceId] : [],
      },
    })),

  toggleSelectInstance: (instanceId, isMulti) =>
    set((s) => {
      if (!isMulti) {
        return {
          selection: {
            ...s.selection,
            selectedInstanceId: instanceId,
            selectedInstanceIds: [instanceId],
          },
        };
      }
      const already = s.selection.selectedInstanceIds.includes(instanceId);
      const newIds = already
        ? s.selection.selectedInstanceIds.filter((id) => id !== instanceId)
        : [...s.selection.selectedInstanceIds, instanceId];
      return {
        selection: {
          ...s.selection,
          selectedInstanceId: newIds[newIds.length - 1] || null,
          selectedInstanceIds: newIds,
        },
      };
    }),

  setSelectedInstances: (instanceIds) =>
    set((s) => ({
      selection: {
        ...s.selection,
        selectedInstanceId: instanceIds[0] || null,
        selectedInstanceIds: instanceIds,
      },
    })),

  selectAllInstances: (allIds) =>
    set((s) => ({
      selection: {
        ...s.selection,
        selectedInstanceId: allIds[0] || null,
        selectedInstanceIds: allIds,
      },
    })),

  setHighlightedPath: (instanceIds) =>
    set((s) => ({ selection: { ...s.selection, highlightedPath: instanceIds } })),

  clearSelection: () =>
    set((s) => ({
      selection: {
        ...s.selection,
        selectedFrameId: null,
        selectedInstanceId: null,
        selectedInstanceIds: [],
        highlightedPath: [],
      },
    })),

  openSettings: () => set({ isSettingsOpen: true }),
  closeSettings: () => set({ isSettingsOpen: false }),
  toggleSidebar: () => set((s) => ({ isSidebarExpanded: !s.isSidebarExpanded })),
  toggleListing: (instanceId) =>
    set((s) => {
      const next = new Set(s.expandedListings);
      if (next.has(instanceId)) next.delete(instanceId);
      else next.add(instanceId);
      return { expandedListings: next };
    }),

  addToast: (type, message) =>
    set((s) => ({
      toasts: [...s.toasts, { id: generateId('toast'), type, message }],
    })),
  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
