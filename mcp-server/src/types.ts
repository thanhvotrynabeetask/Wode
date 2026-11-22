// Core data schema matching Wode Workflow Diagram Builder

export type CornerSymbol = 'user-action' | 'bot' | 'check' | 'timer' | 'none';
export type FlowType = 'solid' | 'dashed' | 'dotted';
export type NodeKind = 'standard' | 'storage' | 'mediator';
export type BorderSide = 'top' | 'right' | 'bottom' | 'left';

export interface NodeBorderAnchor {
  side: BorderSide;
  ratio: number;
}

export type ListingItemType = 'skill' | 'ai_model' | 'ai_agent' | 'connector' | 'tool' | 'custom';

export interface NodeListingItem {
  id: string;
  type: ListingItemType;
  name: string;
  description?: string;
}

export interface Role {
  id: string;
  name: string;
  color: string;
  custom_height?: number;
}

export interface NodeTemplate {
  base_id: string;
  role_id: string;
  title: string;
  corner_symbol: CornerSymbol;
  color: string;
  node_kind?: NodeKind;
}

export interface NodeInstance {
  instance_id: string;
  base_id: string;
  title: string;
  custom_label: string | null;
  node_kind?: NodeKind;
  custom_x?: number;
  custom_y?: number;
  assigned_role_id?: string;
  listings?: NodeListingItem[];
  custom_width?: number;
  custom_height?: number;
}

export interface EdgeConfig {
  edge_id?: string;
  from_instance: string;
  to_instance: string;
  message_label: string;
  flow_type: FlowType;
  color?: string;
  curvature_offset?: number;
  source_anchor?: NodeBorderAnchor;
  target_anchor?: NodeBorderAnchor;
}

export interface EdgeRoute {
  waypoints?: { x: number; y: number }[];
  sourceAnchor?: NodeBorderAnchor;
  targetAnchor?: NodeBorderAnchor;
}

export interface Frame {
  frame_id: string;
  title: string;
  order: number;
  nodes: NodeInstance[];
  edges_config: EdgeConfig[];
  next_frame_target?: string | null;
}

export interface ProjectMetadata {
  project_name: string;
  updated_at: string;
}

export interface ProjectSettings {
  workspace_path: string;
  horizontal_spacing?: number;
}

export interface DiagramSection {
  id: string;
  title: string;
  order: number;
  roles?: Role[];
  node_palette?: NodeTemplate[];
  frames: Frame[];
  edge_routes?: Record<string, EdgeRoute>;
}

export interface ProjectSchema {
  version: string;
  metadata: ProjectMetadata;
  settings: ProjectSettings;
  roles: Role[];
  node_palette: NodeTemplate[];
  frames: Frame[];
  edge_routes?: Record<string, EdgeRoute>;
  diagrams?: DiagramSection[];
  active_diagram_id?: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
  data?: ProjectSchema;
}
