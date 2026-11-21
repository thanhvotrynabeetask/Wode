import { ProjectSchema } from '../types/schema';
import { LayoutEngine } from './LayoutEngine';
import { FileSystemService } from './FileSystemService';
import { LoggerService } from './LoggerService';

export interface ExportOptions {
  /** Render in dark mode with glow effects */
  darkMode?: boolean;
}

export class ExportService {
  /**
   * Export standalone HTML with embedded viewer & JSON source data
   */
  public static async exportHTML(schema: ProjectSchema, options: ExportOptions = {}): Promise<string> {
    const layout = LayoutEngine.calculate(schema);
    const projectName = schema.metadata.project_name || 'Workflow Diagram';
    const jsonSource = JSON.stringify(schema, null, 2);
    const isDark = !!options.darkMode;

    // Color palette
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
          nodeBorderSelected: '#3B82F6',
          nodeTitle: '#F1F5F9',
          nodeLabel: '#94A3B8',
          edgeColor: '#94A3B8',
          edgeMacroColor: '#818CF8',
          edgeLabelBg: '#1E293B',
          edgeLabelBorder: '#94A3B8',
          edgeLabelText: '#F1F5F9',
          frameFill: '#64748B20',
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
          storageBg: '#082F49',
          storageHeader: '#0C4A6E',
          storageTitle: '#7DD3FC',
          storageLabel: '#38BDF8',
          mediatorBg: '#2E1065',
          mediatorBorder: '#7C3AED',
          mediatorTitle: '#C4B5FD',
          mediatorLabel: '#A78BFA',
          gridStroke: '#1E293B',
          svgBg: '#0B0F17',
        }
      : {
          laneEven: '#FFFFFF',
          laneOdd: '#F8FAFC',
          laneBorder: '#E2E8F0',
          cardBg: '#FFFFFF',
          cardBorder: '#E2E8F0',
          textFill: '#334155',
          nodeBg: '#FFFFFF',
          nodeBorder: '#E2E8F0',
          nodeBorderSelected: '#3B82F6',
          nodeTitle: '#1E293B',
          nodeLabel: '#64748B',
          edgeColor: '#64748B',
          edgeMacroColor: '#6366F1',
          edgeLabelBg: '#FFFFFF',
          edgeLabelBorder: '#64748B',
          edgeLabelText: '#475569',
          frameFill: '#64748B05',
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
          storageBg: '#F0F9FF',
          storageHeader: '#E0F2FE',
          storageTitle: '#0369A1',
          storageLabel: '#0EA5E9',
          mediatorBg: '#F5F3FF',
          mediatorBorder: '#7C3AED',
          mediatorTitle: '#5B21B6',
          mediatorLabel: '#7C3AED',
          gridStroke: '#CBD5E1',
          svgBg: '#FFFFFF',
        };

    // Build standalone SVG markup
    const lanesSvg = layout.swimlanes
      .map((lane, idx) => {
        const isEven = idx % 2 === 0;
        const bgFill = isEven ? palette.laneEven : palette.laneOdd;
        // Wrap text if too long
        const roleName = lane.roleName;
        const p = palette;
        return `
        <g>
          <rect x="0" y="${lane.y}" width="${lane.width}" height="${lane.height}" fill="${bgFill}" />
          <line x1="0" y1="${lane.y + lane.height}" x2="${lane.width}" y2="${lane.y + lane.height}" stroke="${p.laneBorder}" stroke-width="1" />
          <rect x="10" y="${lane.y + 12}" width="140" height="${lane.height - 24}" rx="8" fill="${p.cardBg}" stroke="${p.cardBorder}" stroke-width="1.5" ${isDark ? 'filter="drop-shadow(0 2px 4px rgba(0,0,0,0.4))"' : 'filter="drop-shadow(0 1px 3px rgba(0,0,0,0.05))"'} />
          <rect x="10" y="${lane.y + 12}" width="6" height="${lane.height - 24}" rx="3" fill="${lane.color}" />
          <text x="26" y="${lane.y + lane.height / 2 + 4}" font-size="12" font-weight="700" fill="${p.textFill}" font-family="system-ui, sans-serif">${this.escapeXml(roleName.length > 18 ? roleName.slice(0, 17) + '…' : roleName)}</text>
        </g>`;
      })
      .join('\n');

    const framesSvg = layout.frames
      .map(
        (f) => {
          const p = palette;
          return `
        <g>
          <rect x="${f.x}" y="${f.y}" width="${f.width}" height="${f.height}" rx="12" fill="${p.frameFill}" stroke="${p.frameStroke}" stroke-width="1" stroke-dasharray="6 4" />
          <g transform="translate(${f.x + 12}, ${f.y - 12})">
            <rect x="0" y="0" width="${Math.max(90, f.title.length * 7 + 36)}" height="24" rx="12" fill="${p.frameLabelBg}" />
            <text x="10" y="16" font-size="11" font-weight="700" fill="${p.frameLabelText}" font-family="system-ui, sans-serif">#${f.order} ${this.escapeXml(f.title)}</text>
          </g>
        </g>`;
        }
      )
      .join('\n');

    const edgesSvg = layout.edges
      .map((e) => {
        const p = palette;
        const strokeColor = e.color || (e.isMacro ? p.edgeMacroColor : p.edgeColor);
        const strokeWidth = e.isMacro ? 2.25 : 1.75;
        const marker = e.isMacro ? 'url(#arrow-macro)' : 'url(#arrow-normal)';
        let dash = '';
        if (e.flowType === 'dashed') dash = 'stroke-dasharray="6 4"';
        else if (e.flowType === 'dotted') dash = 'stroke-dasharray="2 3"';

        const glowAttr = isDark ? `filter="drop-shadow(0 0 3px ${strokeColor}99)"` : '';

        const labelMarkup = e.label
          ? `
          <g transform="translate(${e.labelX}, ${e.labelY})">
            <rect x="${-e.label.length * 3.5 - 8}" y="-10" width="${e.label.length * 7 + 16}" height="20" rx="10" fill="${p.edgeLabelBg}" stroke="${strokeColor}" stroke-width="1.25" ${isDark ? 'filter="drop-shadow(0 2px 4px rgba(0,0,0,0.5))"' : 'filter="drop-shadow(0 1px 2px rgba(0,0,0,0.08))"'} />
            <text x="0" y="4" text-anchor="middle" font-size="10" font-weight="600" fill="${p.edgeLabelText}" font-family="system-ui, sans-serif">${this.escapeXml(e.label)}</text>
          </g>`
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
        const isStorage = n.nodeKind === 'storage';
        const isMediator = n.nodeKind === 'mediator';
        const p = palette;

        if (isMediator) {
          return `
        <g transform="translate(${n.x}, ${n.y})">
          <rect x="0" y="0" width="${n.width}" height="${n.height}" rx="20" fill="${p.mediatorBg}" stroke="${p.mediatorBorder}" stroke-width="2" stroke-dasharray="6 3" ${isDark ? 'filter="drop-shadow(0 0 8px #7C3AED73)"' : ''} />
          <circle cx="18" cy="${n.height / 2}" r="8" fill="#7C3AED" />
          <text x="34" y="24" font-size="12" font-weight="600" fill="${p.mediatorTitle}" font-family="system-ui, sans-serif">${this.escapeXml(n.title)}</text>
          ${n.customLabel ? `<text x="34" y="42" font-size="10" fill="${p.mediatorLabel}" font-family="system-ui, sans-serif">${this.escapeXml(n.customLabel)}</text>` : `<text x="34" y="42" font-size="9" font-weight="600" fill="${p.mediatorLabel}" font-family="system-ui, sans-serif">KÊNH TRUNG GIAN</text>`}
        </g>`;
        }

        if (isStorage) {
          return `
        <g transform="translate(${n.x}, ${n.y})">
          <rect x="0" y="0" width="${n.width}" height="${n.height}" rx="10" fill="${p.storageBg}" stroke="#0284C7" stroke-width="2" ${isDark ? 'filter="drop-shadow(0 0 8px #0284C773)"' : 'filter="drop-shadow(0 2px 4px rgba(2, 132, 199, 0.15))"'} />
          <path d="M 0 10 Q ${n.width / 2} 18 ${n.width} 10 L ${n.width} 0 Q ${n.width / 2} -4 0 0 Z" fill="${p.storageHeader}" />
          <circle cx="18" cy="${n.height / 2}" r="8" fill="#0284C7" />
          <text x="34" y="24" font-size="12" font-weight="600" fill="${p.storageTitle}" font-family="system-ui, sans-serif">${this.escapeXml(n.title)}</text>
          ${n.customLabel ? `<text x="34" y="42" font-size="10" fill="${p.storageLabel}" font-family="system-ui, sans-serif">${this.escapeXml(n.customLabel)}</text>` : `<text x="34" y="42" font-size="9" font-weight="600" fill="${p.storageLabel}" font-family="system-ui, sans-serif">STORAGE OBJECT</text>`}
        </g>`;
        }

        const glowFilter = isDark
          ? `filter="drop-shadow(0 0 6px ${n.color}55)"`
          : `filter="drop-shadow(0 2px 4px rgba(0,0,0,0.06))"`;

        return `
        <g transform="translate(${n.x}, ${n.y})">
          <rect x="0" y="0" width="${n.width}" height="${n.height}" rx="8" fill="${p.nodeBg}" stroke="${p.nodeBorder}" stroke-width="1.5" ${glowFilter} />
          <rect x="0" y="0" width="5" height="${n.height}" rx="2" fill="${n.color}" />
          <text x="14" y="24" font-size="12" font-weight="600" fill="${p.nodeTitle}" font-family="system-ui, sans-serif">${this.escapeXml(n.title)}</text>
          ${
            n.customLabel
              ? `<text x="14" y="42" font-size="10" fill="${p.nodeLabel}" font-family="system-ui, sans-serif">${this.escapeXml(n.customLabel)}</text>`
              : ''
          }
        </g>`;
      })
      .join('\n');

    // Arrow marker colors for dark mode
    const arrowNormalFill = isDark ? '#94A3B8' : '#94A3B8';
    const arrowMacroFill = isDark ? '#818CF8' : '#6366F1';

    const modeBadge = isDark
      ? '<span class="badge">Dark Mode + Glow</span>'
      : '<span class="badge">Light Mode</span>';

    const htmlContent = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self' data:; connect-src 'none'; font-src 'self';">
  <title>${this.escapeXml(projectName)} — Wode Diagram</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: ${palette.bodyBg}; color: ${palette.headerText}; overflow: hidden; height: 100vh; display: flex; flex-direction: column; }
    header { background: ${palette.headerBg}; border-bottom: 1px solid ${palette.headerBorder}; padding: 10px 20px; display: flex; align-items: center; justify-content: space-between; height: 48px; }
    .title { font-weight: 700; font-size: 15px; color: ${palette.headerText}; }
    .badge { background: ${palette.badgeBg}; color: ${palette.badgeText}; font-size: 11px; padding: 2px 8px; border-radius: 9999px; font-weight: 600; margin-left: 8px; }
    main { flex: 1; overflow: auto; padding: 30px; position: relative; }
    .canvas-card { background: ${palette.cardBgMain}; border-radius: 12px; border: 1px solid ${palette.cardBorderMain}; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); display: inline-block; min-width: 100%; min-height: 100%; padding: 20px; }
    svg { display: block; overflow: visible; }
  </style>
</head>
<body>
  <header>
    <div style="display: flex; align-items: center;">
      <span class="title">${this.escapeXml(projectName)}</span>
      ${modeBadge}
    </div>
    <div style="font-size: 12px; color: ${palette.nodeLabel};">
      Xuất từ <strong>Wode</strong> • ${new Date().toLocaleDateString('vi-VN')}
    </div>
  </header>
  <main>
    <div class="canvas-card">
      <svg width="${layout.canvasWidth}" height="${layout.canvasHeight}" viewBox="0 0 ${layout.canvasWidth} ${layout.canvasHeight}" style="background: ${palette.svgBg};">
        <defs>
          <marker id="arrow-normal" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="${arrowNormalFill}" />
          </marker>
          <marker id="arrow-macro" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="${arrowMacroFill}" />
          </marker>
          ${isDark ? `
          <pattern id="canvas-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="12" cy="12" r="0.75" fill="#1E293B" opacity="0.5" />
          </pattern>` : `
          <pattern id="canvas-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="12" cy="12" r="0.75" fill="#CBD5E1" opacity="0.4" />
          </pattern>`}
        </defs>
        <rect width="100%" height="100%" fill="url(#canvas-grid)" />
        ${lanesSvg}
        ${framesSvg}
        ${edgesSvg}
        ${nodesSvg}
      </svg>
    </div>
  </main>

  <!-- Embedded Source Data for 2-way Re-import -->
  <script id="workflow-source-data" type="application/json">
${jsonSource}
  </script>
</body>
</html>`;

    const fileName = `${projectName.replace(/[/\\?%*:|"<>]/g, '_') || 'workflow'}${isDark ? '_dark' : ''}.html`;
    FileSystemService.downloadFile(fileName, htmlContent, 'text/html');
    LoggerService.info('ExportService', `Đã xuất file HTML ${isDark ? 'Dark Mode + Glow' : 'Light Mode'}: ${fileName}`);
    return fileName;
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
