# 🌊 Wode - Offline Swimlane Workflow Diagram Builder & AI Agent MCP Connector

<div align="center">

**[ English ](README.md)** • [ Tiếng Việt ](README.vi.md)

[![React 18](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC.svg)](https://tailwindcss.com/)
[![MCP Ready](https://img.shields.io/badge/MCP-Connector-emerald.svg)](https://modelcontextprotocol.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Data Privacy](https://img.shields.io/badge/Data%20Privacy-100%25%20Client--Side-green.svg)](#-data-sovereignty--privacy-guarantee-100-client-side)

</div>

**Wode** is an open-source, local-first workflow diagram builder tailored for designing, visualizing, and automating **Cross-functional Flowcharts (Swimlane Diagrams)**. 

Built with deterministic rule-based layout algorithms, Wode eliminates diagram clutter, automatically arranges swimlanes, straightens vertical flows, and features an integrated **Model Context Protocol (MCP) Server** with real-time **WebSocket Live Sync** (`ws://localhost:3333`) for AI Agents (Claude Desktop, Cursor, Google Antigravity, Windsurf, and more).

---

## 💡 Core Differentiator: Seamless Human + AI Co-Authoring

Most diagramming tools today force you into one of two extremes:
* **Text-to-Diagram engines (Mermaid, PlantUML):** Great for AI agents to write syntax, but **frustrating for humans to tweak visually**. If a connection is awkward, you cannot drag it—you have to fiddle with lines of code.
* **Freeform canvas tools (Miro, Draw.io, FigJam):** Great for manual dragging, but **nearly impossible for AI agents to generate structured, production-ready swimlane workflows programmatically**. Connecting lines turn into spaghetti messes requiring hours of manual cleanup.

### 🌟 Wode bridges this gap with true bi-directional co-authoring:

| Comparison Dimension | Code/CLI Generators *(Mermaid, Archify)* | Visual Canvas Tools *(Miro, Draw.io)* | 🌊 Wode *(Swimlane Studio)* |
| :--- | :---: | :---: | :---: |
| **AI Agent Automated Generation** | ✅ Fast via code / CLI scripts | ❌ Fragile / Layout mess | ✅ **1-Click via MCP Server & Live Sync** |
| **Interactive Visual Editor (Visual IDE)** | ❌ None (Only static viewers) | ✅ Freeform whiteboards | ✅ **Full Swimlane Studio with real-time UI** |
| **Direct Visual Canvas Drag & Edit** | ❌ Impossible to drag | ✅ Freeform dragging | ✅ **Smooth dragging + Magnetic Snap-to-align** |
| **Build Entirely from Scratch (No AI needed)**| ❌ Must write raw syntax | ✅ Visual mouse clicks | ✅ **Visual mouse authoring with 3-tier palette** |
| **Deterministic Swimlane Geometry** | ⚠️ Rigid code syntax | ❌ Easy to tangle (Spaghetti) | ✅ **Auto-column vertical flows + 0 overlap** |
| **Bi-directional Human & AI Collaboration** | ❌ 1-way (AI outputs static HTML) | ❌ No workflow isolation | ✅ **2-way live sync with auto-isolated tabs** |
| **Data Privacy & Offline First** | ⚠️ Tool-dependent | ❌ Cloud account required | ✅ **100% Client-Side, Zero Telemetry** |

### 🎯 The Ideal Two-Way Workflow:
1. **AI-Assisted Fast Drafting:** Ask your AI assistant (Claude Desktop, Cursor, Google Antigravity, Windsurf): *"Build a 5-swimlane feature delivery workflow..."* — Wode MCP Server generates the complete schema in seconds.
2. **Human Visual Fine-Tuning:** The diagram renders live on your browser via WebSocket (`ws://localhost:3333`). You grab your mouse, nudge nodes, stretch phase frames, tweak text descriptions, and reroute flows with instant visual feedback.
3. **Or Build 100% Manually:** Start from a blank canvas and construct your entire enterprise architecture using the 3-tier palette, then have your AI agent review and validate the workflow logic (`wode_validate_diagram`).

---

## 🔒 Data Sovereignty & Privacy Guarantee (100% Client-Side)

Whether you access Wode via the **hosted web deployment (Vercel)** or run it **locally on your machine**:

* 🛡️ **Your Data Stays With You:** All diagrams, workflow structures, and session states exist strictly within your browser and local disk.
* 🚫 **Zero Telemetry / Zero Cloud Database:** No tracking scripts, no external analytics, no telemetry, and no remote database storage.
* 💾 **Direct Disk Storage:** Leverages the native *Web File System Access API* (with fallback to direct JSON/HTML downloads) to keep your project files securely on your filesystem.

> [!TIP]
> **Recommended Experience: Run Locally!**  
> While the hosted Vercel deployment allows quick previews without installation, we **strongly recommend cloning and running Wode locally**. Running locally provides:
> 1. **Peak Performance & Zero Lag:** No dependency on external bandwidth or serverless free-tier cold-starts during peak traffic.
> 2. **AI Agent Live Sync (WebSocket):** Seamlessly connect your AI assistants (Claude, Cursor, Antigravity) to `ws://localhost:3333` so they can generate and manipulate diagrams live in your browser.

---

## 🚀 Getting Started

### Option 1: Try It on the Web (Hosted Deployment)
If you just want to preview or design a workflow right away:
* Open the deployment link: `wode-beta.vercel.app` *(or author's hosted URL)*.
* Full access to diagram authoring, `.json` file saving, and standalone `.html` exports.
* Switch between **English** and **Tiếng Việt** anytime via Settings or the header globe button.

---

### Option 2: Run Locally (Recommended ⭐)

#### 1. Prerequisites
* **Node.js**: Version 20 or higher (`node -v`)
* **npm**: Version 9 or higher (`npm -v`)

#### 2. Installation & Development Server
```bash
# 1. Clone the repository
git clone https://github.com/thanhvotrynabeetask/Wode.git
cd Wode

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```
Open your browser at `http://localhost:5173`.

#### 3. Production Build & Preview
```bash
# Build optimized bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 🤖 AI Agent MCP Connector & Live Sync

Wode includes a standalone server implementing the official [Model Context Protocol](https://modelcontextprotocol.io/) specification. It gives AI coding assistants the ability to create, read, update, and validate swimlane diagrams programmatically.

### 1. Build the MCP Server
From the root directory of the Wode project:
```bash
npm run mcp:setup
```

### 2. Configure Your AI Client

#### 🔹 Claude Desktop
Open your Claude Desktop configuration file:
* **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
* **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

Add the server:
```json
{
  "mcpServers": {
    "wode": {
      "command": "node",
      "args": [
        "<PATH_TO_WODE_PROJECT>/mcp-server/dist/index.js"
      ],
      "env": {
        "WODE_WS_PORT": "3333"
      }
    }
  }
}
```

#### 🔹 Cursor
Open **Cursor Settings** > **Features** > **MCP Servers** (or create `.cursor/mcp.json`):
```json
{
  "mcpServers": {
    "wode": {
      "command": "node",
      "args": [
        "<PATH_TO_WODE_PROJECT>/mcp-server/dist/index.js"
      ]
    }
  }
}
```

#### 🔹 Google Antigravity / Other Agents
```json
{
  "mcpServers": {
    "wode": {
      "command": "node",
      "args": [
        "<PATH_TO_WODE_PROJECT>/mcp-server/dist/index.js"
      ]
    }
  }
}
```

---

## 🌟 Key Features & User Guide

### 📑 1. Multi-Tab System & Isolated AI Agent Workflows
- **Intuitive Tab Bar:** Located directly beneath the Header, manage multiple concurrent workflow sessions independently.
- **Tab Management:**
  - Click `+` to open a fresh diagram tab.
  - **Double-click** any tab title to rename it inline.
  - Click `×` to close tabs (maintains at least 1 active canvas).
- **🛡️ Auto Agent Isolation:** When an AI Agent invokes MCP tools over WebSocket LiveSync (`ws://localhost:3333`), Wode automatically creates and routes changes to a dedicated `🤖 Agent (MCP)` tab. Your active personal canvas is never disturbed or overwritten!

---

### 🖼️ 2. Decoupled Visual Frames & On-Canvas Horizontal Resizing
- **Frames as Pure Visual Decor Overlays:** Frames group tasks into sequential phases/milestones without locking down the nodes inside:
  - **Zero-Loss Deletion:** Deleting a frame removes only the decorative boundary. **All nodes and edges remain 100% intact at their exact pixel canvas coordinates**, never jumping or collapsing.
  - **Seamless Dragging:** Transfer nodes across frames smoothly without annoying confirmation dialogs.
- **Direct Horizontal Resize Handle:**
  - Drag the right edge of any frame directly on the canvas to expand or contract phase boundaries.
  - **Smart Hover-Triggered Handle:** The resize pill remains neatly hidden (`opacity-0`) and automatically fades in only when you hover over or select the frame.

---

### 📐 3. Auto-Column Vertical Flow Alignment & Anti-Overlap Routing
- **Smart Vertical Alignment (`Auto-Column`):**
  - When two tasks in different swimlanes connect sequentially within the same phase (e.g. Stakeholder $\to$ UX/UI Agent), Wode automatically places them in the **same vertical column**.
  - Edges travel straight down (`M x y1 L x y2`), reducing diagram width by 40–50% and eliminating awkward diagonal crossings.
  - Automatic detection of intermediate lane obstructions prevents lines from crossing through unrelated nodes.
- **Anti-Overlapping Arched Loopbacks:**
  - Feedback, rejection, or revision edges (`dashed` / loopback) automatically arch upward over task cards.
  - Forward and return edge labels never share coordinates or collide with each other.
  - Generous label pill padding accommodates Vietnamese diacritics and Unicode characters cleanly without clipping.

---

### 🧹 4. Canvas Clearing & Diagram Management (SubToolbar)
- **Clear Canvas:** Reset the entire canvas to a blank slate in one click, protected by a safety confirmation dialog.
- **Delete Selected Diagram:** When working with multiple diagrams, easily remove a specific diagram without affecting others.

---

### 🎨 5. 3-Tier Data Architecture
1. **Tier 1 - Palette & Role Library:** Manage swimlane actors with custom hex colors. Categorize actions with corner symbols (`user-action`, `bot`, `check`, `timer`) and track template usage counts (`x0`, `x1`, `x2`...).
2. **Tier 2 - Frame Builder:** Structure business phases, configure custom task notes (`customLabel`), and define linear or branching handoffs (`next_frame_target`).
3. **Tier 3 - SVG Visual Canvas:** Interactive swimlane canvas with live dragging, multi-selection, and automatic layout synchronization.

---

### 💾 6. Standalone Offline HTML Exporter & Auto-Save Recovery
- **Single-File Offline Viewer:** Export diagrams as standalone `.html` files featuring dark mode, interactive SVG zoom/pan, and **embedded raw JSON source data**. Open in any browser without installing Wode, or re-import the file at any time.
- **Session Recovery:** Prompts automatic session backup (`session_YYYYMMDD_HHmmss.json`) if you attempt to leave with unsaved modifications.

---

## ⌨️ Keyboard Shortcuts Reference

| Shortcut | Description |
| :--- | :--- |
| `Ctrl + Z` | Undo |
| `Ctrl + Y` / `Ctrl + Shift + Z` | Redo |
| `Ctrl + Q` | Toggle Node Selection & Drag Mode |
| `Ctrl + A` | Toggle Canvas Pan Mode |
| `Ctrl + Shift + A` | Select all nodes on canvas |
| `Ctrl + Click` | Add / remove node from multi-selection |
| `Shift + Click` | Select sequential flow range |
| `Delete` / `Backspace` | Remove selected node |
| `Scroll Wheel` | Zoom In / Out |
| `Middle Click` / `Space + Drag` | Pan canvas |

*(Shortcuts can be customized in **Settings > Shortcuts & Controls**)*

---

## 🤝 Contributing & 📄 License

* Distributed under the **MIT License**. Free for personal, educational, and commercial use.
* Community contributions, feature suggestions, and bug reports are warmly welcome!
