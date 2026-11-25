import { ProjectSchema, Role, Frame, NodeInstance, EdgeConfig } from './types.js';
import { CANVAS_DEFAULTS } from './constants.js';

export interface LayoutPoint {
  x: number;
  y: number;
}

export interface LayoutNode {
  instanceId: string;
  baseId: string;
  frameId: string;
  frameTitle: string;
  roleId: string;
  roleName: string;
  color: string;
  title: string;
  customLabel: string | null;
  nodeKind: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutSwimlane {
  roleId: string;
  roleName: string;
  color: string;
  y: number;
  height: number;
  width: number;
}

export interface LayoutFrame {
  frameId: string;
  title: string;
  order: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutEdge {
  fromInstanceId: string;
  toInstanceId: string;
  fromNode: LayoutNode;
  toNode: LayoutNode;
  label: string;
  flowType: string;
  color?: string;
  pathD: string;
  labelX: number;
  labelY: number;
  isMacro: boolean;
}

export interface DiagramLayout {
  width: number;
  height: number;
  swimlanes: LayoutSwimlane[];
  frames: LayoutFrame[];
  nodes: LayoutNode[];
  edges: LayoutEdge[];
}

export class DiagramEngine {
  public static calculate(schema: ProjectSchema): DiagramLayout {
    const roles = schema.roles || [];
    const frames = [...(schema.frames || [])].sort((a, b) => a.order - b.order);
    const spacing = schema.settings?.horizontal_spacing ?? CANVAS_DEFAULTS.DEFAULT_HORIZONTAL_SPACING;

    // Map roleId -> role
    const roleMap = new Map<string, Role>();
    roles.forEach((r) => roleMap.set(r.id, r));

    // Calculate swimlane vertical heights and positions
    const swimlanes: LayoutSwimlane[] = [];
    let currentY = 0;

    // Calculate dynamic height for each role based on its nodes
    roles.forEach((role) => {
      let maxNodeHeight = CANVAS_DEFAULTS.NODE_MIN_HEIGHT;
      frames.forEach((f) => {
        (f.nodes || []).forEach((n) => {
          const roleId = n.assigned_role_id || this.getRoleForNode(n, schema);
          if (roleId === role.id) {
            const h = n.custom_height || (n.custom_label ? 80 : CANVAS_DEFAULTS.NODE_MIN_HEIGHT);
            if (h > maxNodeHeight) maxNodeHeight = h;
          }
        });
      });

      const laneHeight = role.custom_height || Math.max(CANVAS_DEFAULTS.SWIMLANE_MIN_HEIGHT, maxNodeHeight + 60);
      swimlanes.push({
        roleId: role.id,
        roleName: role.name,
        color: role.color,
        y: currentY,
        height: laneHeight,
        width: 1000, // Will update at the end
      });
      currentY += laneHeight;
    });

    const totalHeight = Math.max(currentY, 400);

    // Position frames and nodes horizontally with intelligent auto-column alignment
    let currentX = CANVAS_DEFAULTS.START_X;
    const layoutNodes: LayoutNode[] = [];
    const layoutFrames: LayoutFrame[] = [];

    // Role index lookup to detect lane order and intermediate obstructions
    const roleIndexMap = new Map<string, number>();
    roles.forEach((r, idx) => {
      roleIndexMap.set(r.id, idx);
      roleIndexMap.set(r.name.toLowerCase(), idx);
    });

    frames.forEach((frame) => {
      const frameStartX = currentX;
      let frameWidth = 100;
      const frameNodes = frame.nodes || [];

      if (frameNodes.length === 0) {
        frameWidth = 140;
        currentX += frameWidth + spacing;
      } else {
        // Calculate auto-columns for nodes in this frame:
        // Consecutive nodes in DIFFERENT lanes align vertically in the same column unless obstructed
        const autoColMap = this.computeAutoColumns(frameNodes, frame.edges_config || [], roles, roleIndexMap, schema);

        frameNodes.forEach((node) => {
          const roleId = node.assigned_role_id || this.getRoleForNode(node, schema);
          const lane = swimlanes.find((l) => l.roleId === roleId) || swimlanes[0];
          const nodeWidth = node.custom_width || CANVAS_DEFAULTS.NODE_WIDTH;
          const nodeHeight = node.custom_height || (node.custom_label ? 74 : CANVAS_DEFAULTS.NODE_MIN_HEIGHT);

          const col = node.column !== undefined ? node.column : (autoColMap.get(node.instance_id) ?? 0);
          const defaultX = frameStartX + col * (nodeWidth + spacing);
          const nodeX = node.custom_x !== undefined ? node.custom_x : defaultX;
          const laneY = lane ? lane.y : 0;
          const laneH = lane ? lane.height : CANVAS_DEFAULTS.SWIMLANE_MIN_HEIGHT;
          const nodeY = node.custom_y !== undefined ? node.custom_y : laneY + (laneH - nodeHeight) / 2;

          const role = roleMap.get(roleId);

          layoutNodes.push({
            instanceId: node.instance_id,
            baseId: node.base_id,
            frameId: frame.frame_id,
            frameTitle: frame.title,
            roleId: roleId,
            roleName: role?.name || 'Chưa gán',
            color: role?.color || '#3B82F6',
            title: node.title,
            customLabel: node.custom_label,
            nodeKind: node.node_kind || 'standard',
            x: nodeX,
            y: nodeY,
            width: nodeWidth,
            height: nodeHeight,
          });
        });

        const frameNodeLayouts = layoutNodes.filter((n) => n.frameId === frame.frame_id);
        if (frameNodeLayouts.length > 0) {
          const minX = Math.min(...frameNodeLayouts.map((n) => n.x));
          const maxX = Math.max(...frameNodeLayouts.map((n) => n.x + n.width));
          frameWidth = Math.max(140, maxX - minX + CANVAS_DEFAULTS.FRAME_PADDING_HORIZONTAL * 2);
          currentX = maxX + CANVAS_DEFAULTS.FRAME_PADDING_HORIZONTAL;
        }
      }

      layoutFrames.push({
        frameId: frame.frame_id,
        title: frame.title,
        order: frame.order,
        x: frameStartX - CANVAS_DEFAULTS.FRAME_PADDING_HORIZONTAL,
        y: 10,
        width: Math.max(frameWidth, currentX - frameStartX + CANVAS_DEFAULTS.FRAME_PADDING_HORIZONTAL),
        height: totalHeight - 20,
      });

      currentX += spacing;
    });

    const totalWidth = Math.max(currentX + 100, 1200);
    swimlanes.forEach((lane) => (lane.width = totalWidth));

    // Build edges with smart vertical alignment and non-overlapping loopbacks
    const layoutEdges: LayoutEdge[] = [];
    const nodeMap = new Map<string, LayoutNode>();
    layoutNodes.forEach((n) => nodeMap.set(n.instanceId, n));

    // Index all forward edges to identify bidirectional return pairs
    const allEdgePairs = new Set<string>();
    frames.forEach((frame) => {
      (frame.edges_config || []).forEach((edge) => {
        allEdgePairs.add(`${edge.from_instance}>${edge.to_instance}`);
      });
    });

    frames.forEach((frame) => {
      (frame.edges_config || []).forEach((edge) => {
        const fromNode = nodeMap.get(edge.from_instance);
        const toNode = nodeMap.get(edge.to_instance);
        if (!fromNode || !toNode) return;

        const isMacro = fromNode.frameId !== toNode.frameId;
        const fromCenterX = fromNode.x + fromNode.width / 2;
        const toCenterX = toNode.x + toNode.width / 2;
        const isVerticallyAligned = Math.abs(fromCenterX - toCenterX) <= 24;

        // Check if this edge is a return in a bidirectional pair (e.g. A->B forward, B->A return)
        const isBidirectionalReturn = allEdgePairs.has(`${edge.to_instance}>${edge.from_instance}`) &&
          (fromNode.x > toNode.x || (fromNode.x === toNode.x && edge.flow_type === 'dashed'));

        let pathD: string;
        let labelX: number;
        let labelY: number;

        if (isVerticallyAligned && toNode.y > fromNode.y) {
          // Direct straight vertical flow: top to bottom
          const alignX = Math.round((fromCenterX + toCenterX) / 2);
          const startY = fromNode.y + fromNode.height;
          const endY = toNode.y;
          pathD = `M ${alignX} ${startY} L ${alignX} ${endY}`;
          labelX = alignX;
          labelY = Math.round((startY + endY) / 2);
        } else if (isVerticallyAligned && toNode.y < fromNode.y) {
          // Direct straight vertical flow: bottom to top
          const alignX = Math.round((fromCenterX + toCenterX) / 2);
          const startY = fromNode.y;
          const endY = toNode.y + toNode.height;
          pathD = `M ${alignX} ${startY} L ${alignX} ${endY}`;
          labelX = alignX;
          labelY = Math.round((startY + endY) / 2);
        } else if (isBidirectionalReturn || (toNode.x < fromNode.x && edge.flow_type === 'dashed')) {
          // Backward / loopback flow (e.g. reject, sửa code):
          // Arch upward above the lane so it never overlaps the forward line or labels
          const sourcePoint = { x: fromNode.x + fromNode.width / 2, y: fromNode.y };
          const targetPoint = { x: toNode.x + toNode.width / 2, y: toNode.y };
          const archHeight = Math.max(35, Math.abs(targetPoint.x - sourcePoint.x) * 0.15);
          const cp1x = sourcePoint.x - 20;
          const cp1y = sourcePoint.y - archHeight;
          const cp2x = targetPoint.x + 20;
          const cp2y = targetPoint.y - archHeight;

          pathD = `M ${sourcePoint.x} ${sourcePoint.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${targetPoint.x} ${targetPoint.y}`;
          labelX = Math.round((sourcePoint.x + targetPoint.x) / 2);
          labelY = Math.round((cp1y + cp2y) / 2 - 8);
        } else {
          // Standard forward flow
          const sourcePoint = { x: fromNode.x + fromNode.width, y: fromNode.y + fromNode.height / 2 };
          const targetPoint = { x: toNode.x, y: toNode.y + toNode.height / 2 };

          const dx = targetPoint.x - sourcePoint.x;
          const cp1x = sourcePoint.x + Math.max(30, dx * 0.4);
          const cp1y = sourcePoint.y;
          const cp2x = targetPoint.x - Math.max(30, dx * 0.4);
          const cp2y = targetPoint.y;

          pathD = `M ${sourcePoint.x} ${sourcePoint.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${targetPoint.x} ${targetPoint.y}`;
          labelX = Math.round((sourcePoint.x + targetPoint.x) / 2);
          labelY = Math.round((sourcePoint.y + targetPoint.y) / 2);
        }

        layoutEdges.push({
          fromInstanceId: edge.from_instance,
          toInstanceId: edge.to_instance,
          fromNode,
          toNode,
          label: edge.message_label,
          flowType: edge.flow_type || 'solid',
          color: edge.color,
          pathD,
          labelX,
          labelY,
          isMacro,
        });
      });
    });

    // Label anti-collision pass: separate overlapping edge labels
    for (let i = 0; i < layoutEdges.length; i++) {
      for (let j = i + 1; j < layoutEdges.length; j++) {
        const e1 = layoutEdges[i];
        const e2 = layoutEdges[j];
        if (e1.label && e2.label) {
          const dx = Math.abs(e1.labelX - e2.labelX);
          const dy = Math.abs(e1.labelY - e2.labelY);
          if (dx < 50 && dy < 25) {
            e2.labelY += 24;
          }
        }
      }
    }

    return {
      width: totalWidth,
      height: totalHeight,
      swimlanes,
      frames: layoutFrames,
      nodes: layoutNodes,
      edges: layoutEdges,
    };
  }

  /**
   * Computes optimal column positions (0, 1, 2...) for nodes in a frame:
   * - Sequential nodes in DIFFERENT lanes align vertically in the same column unless an intermediate lane is blocked.
   * - Consecutive nodes in the SAME lane advance to the next column.
   */
  private static computeAutoColumns(
    frameNodes: NodeInstance[],
    frameEdges: EdgeConfig[],
    roles: Role[],
    roleIndexMap: Map<string, number>,
    schema: ProjectSchema
  ): Map<string, number> {
    const nodeMap = new Map<string, { roleId: string; laneIndex: number; column?: number }>();
    frameNodes.forEach((n) => {
      const roleId = n.assigned_role_id || this.getRoleForNode(n, schema);
      nodeMap.set(n.instance_id, {
        roleId,
        laneIndex: roleIndexMap.get(roleId) ?? roleIndexMap.get(roleId.toLowerCase()) ?? 0,
        column: n.column,
      });
    });

    const inEdges = new Map<string, string[]>();
    frameNodes.forEach((n) => inEdges.set(n.instance_id, []));

    (frameEdges || []).forEach((e) => {
      if (inEdges.has(e.to_instance) && nodeMap.has(e.from_instance)) {
        if (e.flow_type !== 'dashed') {
          inEdges.get(e.to_instance)!.push(e.from_instance);
        }
      }
    });

    const columnMap = new Map<string, number>();
    const columns: Map<string, string>[] = [];

    function getCol(cIdx: number) {
      while (columns.length <= cIdx) columns.push(new Map());
      return columns[cIdx];
    }

    function isPathObstructed(colIdx: number, laneA: number, laneB: number): boolean {
      const minLane = Math.min(laneA, laneB);
      const maxLane = Math.max(laneA, laneB);
      const colRoles = getCol(colIdx);
      for (const instId of colRoles.values()) {
        const node = nodeMap.get(instId);
        if (node && node.laneIndex > minLane && node.laneIndex < maxLane) {
          return true;
        }
      }
      return false;
    }

    frameNodes.forEach((n) => {
      if (n.column !== undefined) {
        columnMap.set(n.instance_id, n.column);
        const colMap = getCol(n.column);
        const roleId = nodeMap.get(n.instance_id)?.roleId || '';
        colMap.set(roleId, n.instance_id);
        return;
      }

      const nInfo = nodeMap.get(n.instance_id)!;
      const roleId = nInfo.roleId;
      const myLane = nInfo.laneIndex;
      const preds = inEdges.get(n.instance_id) || [];

      let minCol = 0;
      let preferredCol = -1;

      preds.forEach((pId) => {
        if (columnMap.has(pId)) {
          const pCol = columnMap.get(pId)!;
          const pNode = nodeMap.get(pId)!;
          if (pNode.roleId === roleId) {
            minCol = Math.max(minCol, pCol + 1);
          } else {
            minCol = Math.max(minCol, pCol);
            if (!isPathObstructed(pCol, pNode.laneIndex, myLane)) {
              preferredCol = pCol;
            } else {
              minCol = Math.max(minCol, pCol + 1);
            }
          }
        }
      });

      let placedCol = -1;
      if (preferredCol >= minCol && !getCol(preferredCol).has(roleId)) {
        placedCol = preferredCol;
      } else {
        let c = minCol;
        while (getCol(c).has(roleId)) c++;
        placedCol = c;
      }

      columnMap.set(n.instance_id, placedCol);
      getCol(placedCol).set(roleId, n.instance_id);
    });

    return columnMap;
  }

  private static getRoleForNode(node: NodeInstance, schema: ProjectSchema): string {
    const template = (schema.node_palette || []).find((p) => p.base_id === node.base_id);
    return template?.role_id || (schema.roles?.[0]?.id ?? '');
  }

  public static generateHtml(schema: ProjectSchema, options: { darkMode?: boolean } = {}): string {
    const layout = this.calculate(schema);
    const projectName = schema.metadata.project_name || 'Workflow Diagram';
    const jsonSource = JSON.stringify(schema, null, 2);
    const isDark = options.darkMode !== false;

    const palette = isDark
      ? {
          laneEven: '#0F172A',
          laneOdd: '#131D31',
          laneBorder: '#1E293B',
          cardBg: '#1E293B',
          cardBorder: '#334155',
          textFill: '#F1F5F9',
          nodeBg: '#1E293B',
          nodeBorder: '#334155',
          nodeTitle: '#F1F5F9',
          nodeLabel: '#94A3B8',
          edgeColor: '#94A3B8',
          edgeMacroColor: '#818CF8',
          edgeLabelBg: '#1E293B',
          edgeLabelText: '#F1F5F9',
          frameFill: 'rgba(100, 116, 139, 0.08)',
          frameStroke: '#475569',
          frameLabelBg: '#475569',
          frameLabelText: '#FFFFFF',
          bodyBg: '#0B0F17',
          headerBg: '#0F172A',
          headerBorder: '#1E293B',
          headerText: '#F1F5F9',
          cardBgMain: '#0F172A',
          cardBorderMain: '#1E293B',
          badgeBg: '#1E293B',
          badgeText: '#818CF8',
        }
      : {
          laneEven: '#FFFFFF',
          laneOdd: '#F8FAFC',
          laneBorder: '#E2E8F0',
          cardBg: '#FFFFFF',
          cardBorder: '#E2E8F0',
          textFill: '#334155',
          nodeBg: '#FFFFFF',
          nodeBorder: '#CBD5E1',
          nodeTitle: '#1E293B',
          nodeLabel: '#64748B',
          edgeColor: '#64748B',
          edgeMacroColor: '#6366F1',
          edgeLabelBg: '#FFFFFF',
          edgeLabelText: '#475569',
          frameFill: 'rgba(100, 116, 139, 0.04)',
          frameStroke: '#94A3B8',
          frameLabelBg: '#475569',
          frameLabelText: '#FFFFFF',
          bodyBg: '#F1F5F9',
          headerBg: '#FFFFFF',
          headerBorder: '#E2E8F0',
          headerText: '#1E293B',
          cardBgMain: '#FFFFFF',
          cardBorderMain: '#E2E8F0',
          badgeBg: '#EEF2FF',
          badgeText: '#4F46E5',
        };

    const lanesSvg = layout.swimlanes
      .map((lane, idx) => {
        const bgFill = idx % 2 === 0 ? palette.laneEven : palette.laneOdd;
        return `
        <g>
          <rect x="0" y="${lane.y}" width="${lane.width}" height="${lane.height}" fill="${bgFill}" />
          <line x1="0" y1="${lane.y + lane.height}" x2="${lane.width}" y2="${lane.y + lane.height}" stroke="${palette.laneBorder}" stroke-width="1" />
          <rect x="10" y="${lane.y + 12}" width="150" height="${lane.height - 24}" rx="8" fill="${palette.cardBg}" stroke="${palette.cardBorder}" stroke-width="1.5" />
          <rect x="10" y="${lane.y + 12}" width="6" height="${lane.height - 24}" rx="3" fill="${lane.color}" />
          <text x="26" y="${lane.y + lane.height / 2 + 5}" font-size="13" font-weight="700" fill="${palette.textFill}" font-family="system-ui, sans-serif">${this.escapeXml(lane.roleName)}</text>
        </g>`;
      })
      .join('\n');

    const framesSvg = layout.frames
      .map(
        (f) => `
        <g>
          <rect x="${f.x}" y="${f.y}" width="${f.width}" height="${f.height}" rx="12" fill="${palette.frameFill}" stroke="${palette.frameStroke}" stroke-width="1" stroke-dasharray="6 4" />
          <g transform="translate(${f.x + 12}, ${f.y - 12})">
            <rect x="0" y="0" width="${Math.max(90, f.title.length * 8 + 36)}" height="24" rx="12" fill="${palette.frameLabelBg}" />
            <text x="12" y="16" font-size="11" font-weight="700" fill="${palette.frameLabelText}" font-family="system-ui, sans-serif">#${f.order} ${this.escapeXml(f.title)}</text>
          </g>
        </g>`
      )
      .join('\n');

    const edgesSvg = layout.edges
      .map((e) => {
        const strokeColor = e.color || (e.isMacro ? palette.edgeMacroColor : palette.edgeColor);
        const strokeWidth = e.isMacro ? 2.5 : 2;
        let dash = '';
        if (e.flowType === 'dashed') dash = 'stroke-dasharray="6 4"';
        else if (e.flowType === 'dotted') dash = 'stroke-dasharray="2 3"';

        const glowAttr = isDark ? `filter="drop-shadow(0 0 4px ${strokeColor}88)"` : '';
        const marker = e.isMacro ? 'url(#arrow-macro)' : 'url(#arrow-normal)';

        const labelMarkup = e.label
          ? (() => {
              const labelWidth = Math.max(48, Math.round(e.label.length * 7.5 + 24));
              return `
          <g transform="translate(${e.labelX}, ${e.labelY})">
            <rect x="${-labelWidth / 2}" y="-11" width="${labelWidth}" height="22" rx="11" fill="${palette.edgeLabelBg}" stroke="${strokeColor}" stroke-width="1.5" />
            <text x="0" y="4" text-anchor="middle" font-size="11" font-weight="600" fill="${palette.edgeLabelText}" font-family="system-ui, sans-serif">${this.escapeXml(e.label)}</text>
          </g>`;
            })()
          : '';

        return `
        <g>
          <path d="${e.pathD}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" ${dash} ${glowAttr} marker-end="${marker}" stroke-linecap="round" />
          ${labelMarkup}
        </g>`;
      })
      .join('\n');

    const nodesSvg = layout.nodes
      .map((n) => {
        const glowFilter = isDark
          ? `filter="drop-shadow(0 0 8px ${n.color}66)"`
          : `filter="drop-shadow(0 2px 4px rgba(0,0,0,0.08))"`;

        return `
        <g transform="translate(${n.x}, ${n.y})">
          <rect x="0" y="0" width="${n.width}" height="${n.height}" rx="8" fill="${palette.nodeBg}" stroke="${palette.nodeBorder}" stroke-width="1.5" ${glowFilter} />
          <rect x="0" y="0" width="5" height="${n.height}" rx="2" fill="${n.color}" />
          <text x="16" y="24" font-size="13" font-weight="700" fill="${palette.nodeTitle}" font-family="system-ui, sans-serif">${this.escapeXml(n.title)}</text>
          ${
            n.customLabel
              ? `<text x="16" y="44" font-size="11" fill="${palette.nodeLabel}" font-family="system-ui, sans-serif">${this.escapeXml(n.customLabel)}</text>`
              : ''
          }
        </g>`;
      })
      .join('\n');

    return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeXml(projectName)} — Wode Diagram</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: ${palette.bodyBg}; color: ${palette.headerText}; overflow: hidden; height: 100vh; display: flex; flex-direction: column; }
    header { background: ${palette.headerBg}; border-bottom: 1px solid ${palette.headerBorder}; padding: 12px 24px; display: flex; align-items: center; justify-content: space-between; height: 52px; }
    .title { font-weight: 700; font-size: 16px; color: ${palette.headerText}; display: flex; align-items: center; gap: 8px; }
    .badge { background: ${palette.badgeBg}; color: ${palette.badgeText}; font-size: 11px; padding: 3px 10px; border-radius: 9999px; font-weight: 600; }
    .controls { display: flex; gap: 8px; }
    .btn { background: ${palette.cardBg}; border: 1px solid ${palette.cardBorder}; color: ${palette.headerText}; padding: 6px 14px; border-radius: 6px; font-size: 12px; cursor: pointer; font-weight: 600; }
    .btn:hover { opacity: 0.9; }
    main { flex: 1; overflow: auto; padding: 24px; position: relative; }
    .canvas-container { background: ${palette.cardBgMain}; border-radius: 12px; border: 1px solid ${palette.cardBorderMain}; display: inline-block; min-width: 100%; min-height: 100%; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    svg { display: block; overflow: visible; }
  </style>
</head>
<body>
  <header>
    <div class="title">
      <span>📐 ${this.escapeXml(projectName)}</span>
      <span class="badge">Wode Swimlane Viewer</span>
      <span class="badge">${isDark ? 'Dark Mode' : 'Light Mode'}</span>
    </div>
    <div class="controls">
      <button class="btn" onclick="window.print()">In / Xuất PDF</button>
      <button class="btn" onclick="copyJsonSource()">Copy JSON</button>
    </div>
  </header>
  <main>
    <div class="canvas-container">
      <svg width="${layout.width}" height="${layout.height}" viewBox="0 0 ${layout.width} ${layout.height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <marker id="arrow-normal" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="${palette.edgeColor}" />
          </marker>
          <marker id="arrow-macro" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 1 L 9 5 L 0 9 z" fill="${palette.edgeMacroColor}" />
          </marker>
        </defs>
        ${lanesSvg}
        ${framesSvg}
        ${edgesSvg}
        ${nodesSvg}
      </svg>
    </div>
  </main>
  <script id="workflow-source-data" type="application/json">
${jsonSource}
  </script>
  <script>
    function copyJsonSource() {
      const data = document.getElementById('workflow-source-data').textContent.trim();
      navigator.clipboard.writeText(data).then(() => alert('Đã sao chép toàn bộ JSON Wode vào bộ nhớ tạm!'));
    }
  </script>
</body>
</html>`;
  }

  private static escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<':
          return '&lt;';
        case '>':
          return '&gt;';
        case '&':
          return '&amp;';
        case '\'':
          return '&apos;';
        case '"':
          return '&quot;';
        default:
          return c;
      }
    });
  }
}
