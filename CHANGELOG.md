# 📝 Changelog

All notable changes to the **Wode** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] - 2026-11-27

### 🌟 Added (Tính năng mới)
- **Dedicated Connections Management Panel (Sidebar):**
  - Integrated a new **Connections** (`Network`) tab in the sidebar layout.
  - Comprehensive overview and instant search/filtering of all diagram connections.
  - Step details inspector: Source node $\to$ Target node, message label, solid/dashed flow styling, and connection color indicator.
  - Execution sequence reordering: Move connections up or down in the execution pipeline.
  - Fast deletion of individual connections or clear all connections with safety confirmation.
- **Canvas Box Selection Mode (`B` / `boxSelect`):**
  - Introduced Box Selection alongside Select and Pan modes.
  - Accessible via the Canvas SubToolbar toggle button or by pressing hotkey `B`.
  - Drag a selection box over the canvas to easily multi-select nodes across different frames and swimlanes.
- **Direct Canvas Draggable Connection Labels (`label_x`, `label_y`):**
  - Connection message pills can now be grabbed and dragged freely anywhere on the canvas to avoid overlapping cards or dense wire intersections.
  - Highlighted with a subtle dashed border when positioned manually, with a 1-click "Reset Route" option to revert to default curvature.
- **Swimlane Order Adjustment (Up / Down) in Palette:**
  - Added **Move Up** and **Move Down** controls to each role in the Role Palette.
  - Canvas swimlanes re-sort in real time without altering individual node positions or breaking execution flow.
- **Intelligent Text Wrapping Engine (`wrapSwimlaneTitle` & `wrapNodeText`):**
  - Added smart line wrapping utility that breaks swimlane role titles and node descriptions by word boundaries.
  - Completely prevents text overflow, clipped diacritics, and awkward truncation in both Canvas and SVG exports.
- **Enhanced SVG & Offline HTML Export Parity:**
  - Full visual parity between canvas and standalone SVG/HTML exports.
  - Multi-line role header cards with vertical accent color pills and soft drop shadows.
  - Support for custom draggable label coordinates (`label_x`, `label_y`) in exported files.
  - Distinct glowing drop-shadow filters and badges for special nodes:
    - **Database / Data Storage**: Sky blue `#0284C7`
    - **Mediator / Event Stream**: Purple `#7C3AED`

### 🔧 Changed & Improved (Cải tiến & Tối ưu)
- **Edge Routing & Anchor Snapping:**
  - Improved handling of waypoints and source/target anchor resetting in `EdgeRouter` and `useProjectStore`.
  - Added `deleteEdge`, `reorderEdges`, and `clearAllEdges` state actions in Zustand store.
- **Translations (i18n):**
  - Added full English and Vietnamese localization keys for the Connections tab, box selection mode, swimlane reordering, and toast notifications.

---

## [1.0.0] - 2026-11-25

### 🚀 Initial Public Release
- **Offline-First Swimlane Builder:** Deterministic rule-based auto-column layout engine for cross-functional flowcharts.
- **MCP Server & WebSocket Live Sync (`ws://localhost:3333`):** Bi-directional human and AI co-authoring with Claude Desktop, Cursor, and Google Antigravity.
- **Decoupled Visual Frames:** Flexible milestone containers that can be deleted without losing internal node coordinates.
- **Multi-Tab Session Architecture:** Dedicated `🤖 Agent (MCP)` tab isolation protecting human canvas workflows.
- **Standalone Single-File HTML Exporter:** Self-contained offline viewer with embedded JSON schema.
- **Bilingual Interface:** Full English & Tiếng Việt language toggle.
