# Contributing to Wode 🌊

Thank you for your interest in contributing to **Wode**! We welcome bug reports, feature suggestions, documentation improvements, and pull requests from everyone.

---

## 🛠️ Local Development Setup

### Prerequisites
- **Node.js**: v20 or higher (`node -v`)
- **npm**: v10 or higher (`npm -v`)
- **Git**

### 1. Fork & Clone
```bash
git clone https://github.com/<your-username>/Wode.git
cd Wode
```

### 2. Install Dependencies
```bash
# Install frontend web app dependencies
npm install

# Setup and build MCP server
npm run mcp:setup
```

### 3. Run Development Servers
```bash
# Terminal 1: Run Vite Frontend Dev Server (default: http://localhost:5173)
npm run dev

# Terminal 2 (Optional): Run MCP Server in watch/dev mode
npm run mcp:dev
```

---

## 📐 Architecture & Principles

When developing features for Wode, please adhere to our core architectural principles:

1. **Local-First & Offline Guarantee**:
   - Zero telemetry, zero external cloud database dependencies.
   - All state mutations must remain 100% functional offline.
   - Project data is persisted directly to local storage / local filesystem via the *Web File System Access API*.

2. **Deterministic Layout Rules**:
   - Diagram rendering is mathematically deterministic (calculated via `LayoutEngine.ts` and `mcp-server/src/engine.ts`).
   - Frame overlays are visual decor groupings—frames must never alter or shift node absolute coordinates upon modification or deletion.
   - Sequential steps across different swimlanes should maintain auto-column vertical alignment unless obstructed.

3. **Internationalization (i18n)**:
   - All user-facing UI labels and toast messages must support both English (`en`) and Vietnamese (`vi`).
   - Add new translation strings to both dictionaries in `src/i18n/translations.ts`.

4. **Bi-directional MCP Live Sync**:
   - Changes made to the MCP server (`mcp-server/`) must preserve standard MCP tool specifications and keep WebSocket sync (`ws://localhost:3333`) stable for external AI agents.

---

## 🧪 Verification & Quality Checks

Before submitting a Pull Request, please run the following verification commands to ensure zero build or type errors:

```bash
# Typecheck and build the web frontend
npm run build

# Typecheck and build the MCP connector server
npm run mcp:build
```

---

## 🚀 Submitting a Pull Request (PR)

1. **Create a branch**:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bugfix-name
   ```

2. **Commit your changes**:
   Please follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat: add new swimlane layout preset`
   - `fix: resolve edge overlap on reverse loops`
   - `docs: update MCP setup guide`
   - `chore: bump dependencies`

3. **Push to your fork and open a PR**:
   - Provide a clear summary of what you changed and why.
   - Include before/after screenshots or a short GIF if your PR affects the UI or canvas rendering.
   - Reference any relevant issues (e.g. `Fixes #12`).

---

## 💬 Community & Discussions

If you have questions, ideas, or architectural discussions, feel free to open a [GitHub Discussion](https://github.com/thanhvotrynabeetask/Wode/discussions) or submit an Issue.

Thank you for helping make Wode better for humans and AI agents alike!
