import { ProjectSchema } from '../types/schema';
import { LayoutEngine } from './LayoutEngine';
import { FileSystemService } from './FileSystemService';
import { LoggerService } from './LoggerService';

export class ExportService {
  /**
   * Export standalone HTML with embedded viewer & JSON source data
   */
  public static async exportHTML(schema: ProjectSchema): Promise<string> {
    const layout = LayoutEngine.calculate(schema);
    const projectName = schema.metadata.project_name || 'Workflow Diagram';
    const jsonSource = JSON.stringify(schema, null, 2);

    // Build standalone SVG markup
    const lanesSvg = layout.swimlanes
      .map((lane, idx) => {
        const isEven = idx % 2 === 0;
        return `
        <g>
          <rect x="0" y="${lane.y}" width="${lane.width}" height="${lane.height}" fill="${isEven ? '#FFFFFF' : '#F8FAFC'}" />
          <line x1="0" y1="${lane.y + lane.height}" x2="${lane.width}" y2="${lane.y + lane.height}" stroke="#E2E8F0" stroke-width="1" />
          <rect x="10" y="${lane.y + 12}" width="140" height="${lane.height - 24}" rx="8" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" />
          <rect x="10" y="${lane.y + 12}" width="6" height="${lane.height - 24}" rx="3" fill="${lane.color}" />
          <text x="26" y="${lane.y + lane.height / 2 + 4}" font-size="12" font-weight="700" fill="#334155" font-family="system-ui, sans-serif">${this.escapeXml(lane.roleName)}</text>
        </g>`;
      })
      .join('\n');

    const framesSvg = layout.frames
      .map(
        (f) => `
        <g>
          <rect x="${f.x}" y="${f.y}" width="${f.width}" height="${f.height}" rx="12" fill="#64748B" fill-opacity="0.02" stroke="#94A3B8" stroke-width="1" stroke-dasharray="6 4" />
          <g transform="translate(${f.x + 12}, ${f.y - 12})">
            <rect x="0" y="0" width="${Math.max(90, f.title.length * 7 + 36)}" height="24" rx="12" fill="#475569" />
            <text x="10" y="16" font-size="11" font-weight="700" fill="#FFFFFF" font-family="system-ui, sans-serif">#${f.order} ${this.escapeXml(f.title)}</text>
          </g>
        </g>`
      )
      .join('\n');

    const edgesSvg = layout.edges
      .map((e) => {
        const strokeColor = e.color || (e.isMacro ? '#6366F1' : '#64748B');
        const strokeWidth = e.isMacro ? 2.25 : 1.75;
        const marker = e.isMacro ? 'url(#arrow-macro)' : 'url(#arrow-normal)';
        let dash = '';
        if (e.flowType === 'dashed') dash = 'stroke-dasharray="6 4"';
        else if (e.flowType === 'dotted') dash = 'stroke-dasharray="2 3"';

        const labelMarkup = e.label
          ? `
          <g transform="translate(${e.labelX}, ${e.labelY})">
            <rect x="${-e.label.length * 3.5 - 8}" y="-10" width="${e.label.length * 7 + 16}" height="18" rx="9" fill="#FFFFFF" stroke="${strokeColor}" stroke-width="1" />
            <text x="0" y="3" text-anchor="middle" font-size="10" font-weight="500" fill="#475569" font-family="system-ui, sans-serif">${this.escapeXml(e.label)}</text>
          </g>`
          : '';
        return `
        <g>
          <path d="${e.pathD}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" ${dash} marker-end="${marker}" stroke-linecap="round" />
          ${labelMarkup}
        </g>`;
      })
      .join('\n');

    const nodesSvg = layout.nodes
      .map((n) => {
        const displayTitle = n.customLabel || n.title;
        const isStorage = n.nodeKind === 'storage';
        const isMediator = n.nodeKind === 'mediator';

        if (isMediator) {
          return `
        <g transform="translate(${n.x}, ${n.y})">
          <rect x="0" y="0" width="${n.width}" height="${n.height}" rx="20" fill="#F5F3FF" stroke="#7C3AED" stroke-width="2" stroke-dasharray="6 3" />
          <circle cx="22" cy="${n.height / 2}" r="8" fill="#7C3AED" />
          <text x="38" y="26" font-size="12" font-weight="600" fill="#5B21B6" font-family="system-ui, sans-serif">${this.escapeXml(displayTitle)}</text>
          <text x="38" y="42" font-size="9" font-weight="600" fill="#7C3AED" font-family="system-ui, sans-serif">KÊNH TRUNG GIAN</text>
        </g>`;
        }

        if (isStorage) {
          return `
        <g transform="translate(${n.x}, ${n.y})">
          <rect x="0" y="0" width="${n.width}" height="${n.height}" rx="10" fill="#F0F9FF" stroke="#0284C7" stroke-width="2" filter="drop-shadow(0 2px 4px rgba(2, 132, 199, 0.15))" />
          <path d="M 0 10 Q ${n.width / 2} 18 ${n.width} 10 L ${n.width} 0 Q ${n.width / 2} -4 0 0 Z" fill="#E0F2FE" />
          <circle cx="18" cy="${n.height / 2}" r="8" fill="#0284C7" />
          <text x="34" y="26" font-size="12" font-weight="600" fill="#0369A1" font-family="system-ui, sans-serif">${this.escapeXml(displayTitle)}</text>
          <text x="34" y="42" font-size="9" font-weight="600" fill="#0EA5E9" font-family="system-ui, sans-serif">STORAGE OBJECT</text>
        </g>`;
        }

        return `
        <g transform="translate(${n.x}, ${n.y})">
          <rect x="0" y="0" width="${n.width}" height="${n.height}" rx="8" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.06))" />
          <rect x="0" y="0" width="5" height="${n.height}" rx="2" fill="${n.color}" />
          <text x="14" y="${n.customLabel ? 24 : 34}" font-size="12" font-weight="600" fill="#1E293B" font-family="system-ui, sans-serif">${this.escapeXml(displayTitle)}</text>
          ${
            n.customLabel
              ? `<text x="14" y="42" font-size="10" fill="#94A3B8" font-family="system-ui, sans-serif" font-style="italic">${this.escapeXml(n.title)}</text>`
              : ''
          }
        </g>`;
      })
      .join('\n');

    const htmlContent = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self' data:; connect-src 'none'; font-src 'self';">
  <title>${this.escapeXml(projectName)} — Wode Diagram</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #F1F5F9; color: #1E293B; overflow: hidden; height: 100vh; display: flex; flex-direction: column; }
    header { background: #FFFFFF; border-bottom: 1px solid #E2E8F0; padding: 10px 20px; display: flex; align-items: center; justify-content: space-between; height: 48px; }
    .title { font-weight: 700; font-size: 15px; color: #1E293B; }
    .badge { background: #EEF2FF; color: #4F46E5; font-size: 11px; padding: 2px 8px; border-radius: 9999px; font-weight: 600; margin-left: 8px; }
    main { flex: 1; overflow: auto; padding: 30px; position: relative; }
    .canvas-card { background: #FFFFFF; border-radius: 12px; border: 1px solid #E2E8F0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); display: inline-block; min-width: 100%; min-height: 100%; padding: 20px; }
    svg { display: block; overflow: visible; }
  </style>
</head>
<body>
  <header>
    <div style="display: flex; align-items: center;">
      <span class="title">${this.escapeXml(projectName)}</span>
      <span class="badge">Offline SVG Viewer</span>
    </div>
    <div style="font-size: 12px; color: #64748B;">
      Xuất từ <strong>Wode</strong> • ${new Date().toLocaleDateString('vi-VN')}
    </div>
  </header>
  <main>
    <div class="canvas-card">
      <svg width="${layout.canvasWidth}" height="${layout.canvasHeight}" viewBox="0 0 ${layout.canvasWidth} ${layout.canvasHeight}">
        <defs>
          <marker id="arrow-normal" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#94A3B8" />
          </marker>
          <marker id="arrow-macro" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#6366F1" />
          </marker>
        </defs>
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

    const fileName = `${projectName.replace(/[/\\?%*:|"<>]/g, '_') || 'workflow'}.html`;
    FileSystemService.downloadFile(fileName, htmlContent, 'text/html');
    LoggerService.info('ExportService', `Đã xuất file HTML độc lập: ${fileName}`);
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
