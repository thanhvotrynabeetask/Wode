export type ActivePanel = 'palette' | 'builder' | 'connections' | 'settings';
export type CanvasInteractionMode = 'select' | 'pan' | 'boxSelect';

export interface SelectionState {
  selectedFrameId: string | null;
  selectedInstanceId: string | null;
  selectedInstanceIds: string[]; // Multi-selected nodes
  highlightedPath: string[];
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

export interface UIState {
  activePanel: ActivePanel;
  interactionMode: CanvasInteractionMode;
  zoom: number;
  panX: number;
  panY: number;
  selection: SelectionState;
  isSettingsOpen: boolean;
  isSidebarExpanded: boolean;
  toasts: Toast[];
}
