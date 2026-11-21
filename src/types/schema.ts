// Core data schema matching the JSON spec in Wode.md.md

export type CornerSymbol = 'user-action' | 'bot' | 'check' | 'timer' | 'none';
export type FlowType = 'solid' | 'dashed' | 'dotted';
export type NodeKind = 'standard' | 'storage' | 'mediator'; // 'storage' & 'mediator' can freely magnet across swimlanes
export type BorderSide = 'top' | 'right' | 'bottom' | 'left';

export interface NodeBorderAnchor {
  side: BorderSide;
  /** Normalized ratio along the border edge (0.0 to 1.0). E.g., 0.5 is center. */
  ratio: number;
}

/** Listing item types for node details */
export type ListingItemType = 'skill' | 'ai_model' | 'ai_agent' | 'connector' | 'tool' | 'custom';

/** Symbol mapping for listing item types */
export const LISTING_ITEM_SYMBOLS: Record<ListingItemType, { icon: string; label: string }> = {
  skill: { icon: '🧠', label: 'Skill' },
  ai_model: { icon: '🤖', label: 'AI Model' },
  ai_agent: { icon: '👤', label: 'AI Agent' },
  connector: { icon: '🔌', label: 'Connector' },
  tool: { icon: '🛠️', label: 'Tool' },
  custom: { icon: '📝', label: 'Custom' },
};

export interface NodeListingItem {
  id: string;
  type: ListingItemType;
  name: string;
  /** Optional description */
  description?: string;
}

export interface Role {
  id: string;
  name: string;
  color: string;
  /** Custom lane height (px). When set, overrides the auto-calculated height. */
  custom_height?: number;
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
  /** Expandable list of items (skills, AI models, agents, connectors, tools) */
  listings?: NodeListingItem[];
  /** Custom node width (px). When set, overrides the default width. */
  custom_width?: number;
  /** Custom node height (px). When set, overrides the auto-calculated height. */
  custom_height?: number;
}

export interface EdgeConfig {
  edge_id?: string;
  from_instance: string;
  to_instance: string;
  message_label: string;
  flow_type: FlowType;
  color?: string; // Custom independent color for this message flow
  curvature_offset?: number; // Independent curvature variation to avoid collision
  source_anchor?: NodeBorderAnchor;
  target_anchor?: NodeBorderAnchor;
}

export interface EdgeRoute {
  /** Interior bend points of a hand-drawn orthogonal route (absolute canvas coordinates). */
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
  horizontal_spacing?: number; // Configurable node horizontal gap (default 40px)
}

export interface DiagramSection {
  id: string;
  title: string;
  order: number;
  roles?: Role[];
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
  /** Manual route overrides keyed by `${fromInstanceId}>${toInstanceId}`. Absent = automatic routing. */
  edge_routes?: Record<string, EdgeRoute>;
  /** Multi-diagram support: list of diagrams stacked vertically in project */
  diagrams?: DiagramSection[];
  active_diagram_id?: string;
}