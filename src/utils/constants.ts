export const APP_VERSION = '1.0.0';
export const APP_NAME = 'Wode';

export const DEFAULT_ROLE_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
];

export const CANVAS_DEFAULTS = {
  ZOOM_MIN: 0.2,
  ZOOM_MAX: 3,
  ZOOM_STEP: 0.1,
  NODE_WIDTH: 175,
  NODE_HEIGHT: 64,
  LANE_MIN_HEIGHT: 100,
  FRAME_PADDING: 24,
  NODE_MARGIN: 16,
  /** Minimum horizontal gap that still lets a message pill display legibly. */
  MIN_SPACING: 24,
  /** Default horizontal gap — the tightest that keeps messages readable. */
  DEFAULT_SPACING: 24,
  /** Maximum character limit for node heading to comfortably display up to 2 lines. */
  MAX_NODE_TITLE_LENGTH: 50,
};

export const LOG_LEVELS = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  DEBUG: 'DEBUG',
} as const;

export const STORAGE_KEYS = {
  WORKSPACE_PATH: 'wode_workspace_path',
  THEME: 'wode_theme',
  LAST_FILE: 'wode_last_file',
} as const;
