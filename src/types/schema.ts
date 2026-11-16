// Core data schema matching the JSON spec in Wode.md.md

export type CornerSymbol = 'user-action' | 'bot' | 'check' | 'timer' | 'none';
export type FlowType = 'solid' | 'dashed' | 'dotted';
export type NodeKind = 'standard' | 'storage' | 'mediator'; // 'storage' & 'mediator' can freely magnet across swimlanes

export interface Role {
  id: string;
  name: string;
  color: string;
}

export interface NodeTemplate {
  base_id: string;
  role_id: string;
  title: string;
  corner_symbol: CornerSymbol;
  color: string;
  node_kind?: NodeKind; // default 'standard'
}

export interface NodeInstance {
  instance_id: string;
  base_id: string;
  title: string;
  custom_label: string | null;
  node_kind?: NodeKind;
  custom_x?: number; // User dragged X offset/position
  custom_y?: number; // Snapped Y position in lane
  assigned_role_id?: string; // If special node was magneted into a specific lane
}

export interface EdgeConfig {
  edge_id?: string;
  from_instance: string;
  to_instance: string;
  message_label: string;
  flow_type: FlowType;
  color?: string; // Custom independent color for this message flow
  curvature_offset?: number; // Independent curvature variation to avoid collision
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
  horizontal_spacing?: number; // Configurable node horizontal gap (default 40px)
}

export interface ProjectSchema {
  version: string;
  metadata: ProjectMetadata;
  settings: ProjectSettings;
  roles: Role[];
  node_palette: NodeTemplate[];
  frames: Frame[];
}
