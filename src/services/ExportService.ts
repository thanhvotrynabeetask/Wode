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
        const roleName = lane.roleName;
        const p = palette;
        const cardTop = lane.y + 12;
        const cardHeight = lane.height - 24;

        return `
        <g>
          <rect x="0" y="${lane.y}" width="${lane.width}" height="${lane.height}" fill="${bgFill}" />
          <line x1="0" y1="${lane.y + lane.height}" x2="${lane.width}" y2="${lane.y + lane.height}" stroke="${p.laneBorder}" stroke-width="1" />
          <rect x="10" y="${cardTop}" width="180" height="${cardHeight}" rx="8" fill="${p.cardBg}" stroke="${p.cardBorder}" stroke-width="1.5" ${isDark ? 'filter="drop-shadow(0 2px 4px rgba(0,0,0,0.4))"' : 'filter="drop-shadow(0 1px 3px rgba(0,0,0,0.05))"'} />
          <rect x="10" y="${cardTop}" width="6" height="${cardHeight}" rx="3" fill="${lane.color}" />
          <foreignObject x="26" y="${cardTop}" width="154" height="${cardHeight}" style="overflow: hidden;">
            <div xmlns="http://www.w3.org/1999/xhtml" style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; text-align: left; padding-right: 8px; box-sizing: border-box; pointer-events: none; user-select: none;">
              <span style="font-weight: 700; font-size: 12px; line-height: 1.35; color: ${p.textFill}; word-break: break-word; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                ${this.escapeXml(roleName)}
              </span>
            </div>
          </foreignObject>
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
        const isCustomLabel = !!e.labelCustom;

        const labelMarkup = e.label
          ? `
          <g transform="translate(${e.labelX}, ${e.labelY})">
            <rect x="${-e.label.length * 3.5 - 8}" y="-10" width="${e.label.length * 7 + 16}" height="20" rx="10" fill="${p.edgeLabelBg}" stroke="${strokeColor}" stroke-width="${isCustomLabel ? 2 : 1.25}" ${isCustomLabel ? 'stroke-dasharray="3 2"' : ''} ${isDark ? 'filter="drop-shadow(0 2px 4px rgba(0,0,0,0.5))"' : 'filter="drop-shadow(0 1px 2px rgba(0,0,0,0.08))"'} />
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
        const isSpecial = isStorage || isMediator;
        const kindColor = isStorage ? '#0284C7' : isMediator ? '#7C3AED' : n.color;
        const p = palette;

        let glowFilter = '';
        if (isDark) {
          glowFilter = isSpecial
            ? `filter="drop-shadow(0 0 8px ${kindColor}73)"`
            : `filter="drop-shadow(0 0 6px ${n.color}55)"`;
        } else {
          glowFilter = 'filter="drop-shadow(0 2px 4px rgba(0,0,0,0.06))"';
        }

        if (isMediator) {
          const titleColor = isDark ? p.mediatorTitle : '#5B21B6';
          const labelColor = isDark ? p.mediatorLabel : '#7C3AED';
          const labelText = n.customLabel || 'KÊNH TRUNG GIAN';
          return `
        <g transform="translate(${n.x}, ${n.y})">
          <rect x="0" y="0" width="${n.width}" height="${n.height}" rx="20" fill="${p.mediatorBg}" stroke="${p.mediatorBorder}" stroke-width="2" stroke-dasharray="6 3" ${glowFilter} />
          <foreignObject x="8" y="4" width="${n.width - 16}" height="${n.height - 8}" style="overflow: hidden;">
            <div xmlns="http://www.w3.org/1999/xhtml" style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: space-between; text-align: left; box-sizing: border-box; pointer-events: none; user-select: none;">
              <div style="display: flex; align-items: flex-start; gap: 6px; width: 100%;">
                <div style="width: 16px; height: 16px; border-radius: 9999px; background-color: #7C3AED; color: white; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px;">
                  ${this.getSpecialIconSvg('mediator', 10)}
                </div>
                <span style="font-weight: 700; font-size: 12px; line-height: 1.35; color: ${titleColor}; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; word-break: break-word; flex: 1; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                  ${this.escapeXml(n.title)}
                </span>
              </div>
              <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; min-height: 0; margin-top: 4px;">
                <span style="font-size: 10px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: ${labelColor}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; word-break: break-word;">
                  ${this.escapeXml(labelText)}
                </span>
              </div>
            </div>
          </foreignObject>
        </g>`;
        }

        if (isStorage) {
          const titleColor = isDark ? p.storageTitle : '#0369A1';
          const labelColor = isDark ? p.storageLabel : '#0284C7';
          const labelText = n.customLabel || 'STORAGE OBJECT';
          return `
        <g transform="translate(${n.x}, ${n.y})">
          <rect x="0" y="0" width="${n.width}" height="${n.height}" rx="10" fill="${p.storageBg}" stroke="#0284C7" stroke-width="2" ${glowFilter} />
          <path d="M 0 10 Q ${n.width / 2} 18 ${n.width} 10 L ${n.width} 0 Q ${n.width / 2} -4 0 0 Z" fill="${p.storageHeader}" />
          <foreignObject x="8" y="4" width="${n.width - 16}" height="${n.height - 8}" style="overflow: hidden;">
            <div xmlns="http://www.w3.org/1999/xhtml" style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: space-between; text-align: left; box-sizing: border-box; pointer-events: none; user-select: none;">
              <div style="display: flex; align-items: flex-start; gap: 6px; width: 100%;">
                <div style="width: 16px; height: 16px; border-radius: 9999px; background-color: #0284C7; color: white; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px;">
                  ${this.getSpecialIconSvg('storage', 10)}
                </div>
                <span style="font-weight: 700; font-size: 12px; line-height: 1.35; color: ${titleColor}; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; word-break: break-word; flex: 1; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                  ${this.escapeXml(n.title)}
                </span>
              </div>
              <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; min-height: 0; margin-top: 4px;">
                <span style="font-size: 10px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: ${labelColor}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; word-break: break-word;">
                  ${this.escapeXml(labelText)}
                </span>
              </div>
            </div>
          </foreignObject>
        </g>`;
        }

        // Standard Node
        const hasCornerSymbol = n.cornerSymbol && n.cornerSymbol !== 'none';
        const cornerSymbolMarkup = hasCornerSymbol
          ? `<span style="width: 16px; height: 16px; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; background-color: ${n.color}25; color: ${n.color}; margin-top: 2px;">
              ${this.getSymbolSvg(n.cornerSymbol, 11)}
            </span>`
          : '';

        let noteMarkup = '';
        if (n.customLabel) {
          noteMarkup = `<p style="font-size: 11px; line-height: 1.35; color: ${p.nodeLabel}; word-break: break-word; white-space: pre-wrap; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">${this.escapeXml(n.customLabel)}</p>`;
        } else {
          noteMarkup = `<span style="font-size: 10px; color: ${isDark ? '#64748B' : '#94A3B8'}; font-style: italic; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">(Double click to add note)</span>`;
        }

        const listingsBadge = (n.listings && n.listings.length > 0)
          ? `<span style="font-size: 9px; color: ${isDark ? '#64748B' : '#94A3B8'}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin-top: 2px;">${n.listings.length} mục</span>`
          : '';

        return `
        <g transform="translate(${n.x}, ${n.y})">
          <rect x="0" y="0" width="${n.width}" height="${n.height}" rx="8" fill="${p.nodeBg}" stroke="${p.nodeBorder}" stroke-width="1.5" ${glowFilter} />
          <rect x="0" y="0" width="5" height="${n.height}" rx="2" fill="${n.color}" />
          <foreignObject x="8" y="4" width="${n.width - 16}" height="${n.height - 8}" style="overflow: hidden;">
            <div xmlns="http://www.w3.org/1999/xhtml" style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: space-between; text-align: left; box-sizing: border-box; pointer-events: none; user-select: none;">
              <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 4px; width: 100%;">
                <span style="font-weight: 700; font-size: 12px; line-height: 1.35; color: ${p.nodeTitle}; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; word-break: break-word; flex: 1; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                  ${this.escapeXml(n.title)}
                </span>
                ${cornerSymbolMarkup}
              </div>
              <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; min-height: 0; margin-top: 4px;">
                ${noteMarkup}
                ${listingsBadge}
              </div>
            </div>
          </foreignObject>
        </g>`;
      })
      .join('\n');

    // Arrow marker colors matching canvas exactly
    const arrowNormalFill = isDark ? '#94A3B8' : '#64748B';
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
    header { background: ${palette.headerBg}; border-bottom: 1px solid ${palette.headerBorder}; padding: 10px 20px; display: flex; align-items: center; justify-content: space-between; height: 48px; z-index: 10; flex-shrink: 0; }
    .title { font-weight: 700; font-size: 15px; color: ${palette.headerText}; }
    .badge { background: ${palette.badgeBg}; color: ${palette.badgeText}; font-size: 11px; padding: 2px 8px; border-radius: 9999px; font-weight: 600; margin-left: 8px; }
    
    #viewport {
      flex: 1;
      position: relative;
      overflow: hidden;
      cursor: grab;
      user-select: none;
      -webkit-user-select: none;
      background: ${palette.bodyBg};
    }
    #viewport:active {
      cursor: grabbing;
    }
    
    #diagram-wrapper {
      position: absolute;
      top: 0;
      left: 0;
      transform-origin: 0 0;
      will-change: transform;
      background: ${palette.cardBgMain};
      border-radius: 12px;
      border: 1px solid ${palette.cardBorderMain};
      box-shadow: 0 4px 24px -2px rgba(0,0,0,0.18);
      padding: 20px;
    }
    
    svg { display: block; overflow: visible; }
    foreignObject { overflow: hidden; }

    /* Floating Zoom Controls Bar */
    .zoom-toolbar {
      position: absolute;
      bottom: 24px;
      right: 24px;
      display: flex;
      align-items: center;
      gap: 3px;
      background: ${isDark ? 'rgba(30, 41, 59, 0.88)' : 'rgba(255, 255, 255, 0.92)'};
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid ${isDark ? 'rgba(51, 65, 85, 0.8)' : 'rgba(226, 232, 240, 0.9)'};
      border-radius: 28px;
      padding: 4px 8px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.25);
      z-index: 20;
    }

    .zoom-btn {
      background: transparent;
      border: none;
      color: ${isDark ? '#F1F5F9' : '#334155'};
      width: 30px;
      height: 30px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s ease, transform 0.1s ease;
    }
    .zoom-btn:hover {
      background: ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'};
      color: ${isDark ? '#FFFFFF' : '#0F172A'};
    }
    .zoom-btn:active {
      transform: scale(0.92);
    }
    .zoom-label {
      font-size: 12px;
      font-weight: 700;
      color: ${isDark ? '#CBD5E1' : '#475569'};
      min-width: 48px;
      text-align: center;
      cursor: pointer;
      padding: 4px 6px;
      border-radius: 6px;
      transition: background 0.15s ease;
    }
    .zoom-label:hover {
      background: ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'};
    }
    .zoom-divider {
      width: 1px;
      height: 16px;
      background: ${isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)'};
      margin: 0 3px;
    }
    .zoom-hint {
      position: absolute;
      bottom: 24px;
      left: 24px;
      font-size: 11px;
      color: ${isDark ? '#94A3B8' : '#64748B'};
      background: ${isDark ? 'rgba(15, 23, 42, 0.75)' : 'rgba(255, 255, 255, 0.85)'};
      backdrop-filter: blur(8px);
      padding: 5px 12px;
      border-radius: 20px;
      pointer-events: none;
      border: 1px solid ${isDark ? 'rgba(51, 65, 85, 0.4)' : 'rgba(226, 232, 240, 0.6)'};
      z-index: 10;
    }
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
  <main id="viewport">
    <div id="diagram-wrapper">
      <svg id="diagram-svg" width="${layout.canvasWidth}" height="${layout.canvasHeight}" viewBox="0 0 ${layout.canvasWidth} ${layout.canvasHeight}" style="background: ${palette.svgBg};">
        <defs>
          <marker id="arrow-normal" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 1 L 7 4 L 0 7 z" fill="${arrowNormalFill}" />
          </marker>
          <marker id="arrow-macro" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M 0 1 L 7 4 L 0 7 z" fill="${arrowMacroFill}" />
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

    <!-- Floating Zoom Controls Bar -->
    <div class="zoom-toolbar">
      <button class="zoom-btn" id="zoom-out-btn" title="Thu nhỏ (-)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>
      <span class="zoom-label" id="zoom-label" title="Nhấp để đặt lại 100% (Phím 0)">100%</span>
      <button class="zoom-btn" id="zoom-in-btn" title="Phóng to (+)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>
      <div class="zoom-divider"></div>
      <button class="zoom-btn" id="zoom-fit-btn" title="Phóng vừa màn hình (Phím F)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
      </button>
    </div>

    <div class="zoom-hint">
      Cuộn chuột để Zoom • Kéo để Di chuyển • Phím F: Fit màn hình
    </div>
  </main>

  <!-- Interactive Pan & Zoom Engine -->
  <script>
    (function() {
      const viewport = document.getElementById('viewport');
      const wrapper = document.getElementById('diagram-wrapper');
      const zoomInBtn = document.getElementById('zoom-in-btn');
      const zoomOutBtn = document.getElementById('zoom-out-btn');
      const zoomLabel = document.getElementById('zoom-label');
      const zoomFitBtn = document.getElementById('zoom-fit-btn');

      const diagW = ${layout.canvasWidth};
      const diagH = ${layout.canvasHeight};

      let zoom = 1;
      let panX = 40;
      let panY = 40;
      let isPanning = false;
      let startX = 0;
      let startY = 0;

      // Viewport bounds clamping: prevents diagram from being lost off-screen
      function clampPan(newPanX, newPanY, currentZoom) {
        const vpW = viewport.clientWidth;
        const vpH = viewport.clientHeight;
        const totalW = (diagW + 40) * currentZoom;
        const totalH = (diagH + 40) * currentZoom;

        // Viewport padding limits (diagram remains comfortably visible inside view)
        const padX = Math.max(60, Math.min(200, vpW * 0.15));
        const padY = Math.max(40, Math.min(150, vpH * 0.15));

        let minX, maxX;
        if (totalW >= vpW) {
          // Diagram is wider than viewport
          minX = vpW - totalW - padX;
          maxX = padX;
        } else {
          // Diagram is narrower than viewport: keep centered within boundary margins
          const centerX = (vpW - totalW) / 2;
          minX = Math.min(padX, centerX - padX);
          maxX = Math.max(vpW - totalW - padX, centerX + padX);
        }

        let minY, maxY;
        if (totalH >= vpH) {
          // Diagram is taller than viewport
          minY = vpH - totalH - padY;
          maxY = padY;
        } else {
          // Diagram is shorter than viewport
          const centerY = (vpH - totalH) / 2;
          minY = Math.min(padY, centerY - padY);
          maxY = Math.max(vpH - totalH - padY, centerY + padY);
        }

        return {
          x: Math.round(Math.max(minX, Math.min(maxX, newPanX))),
          y: Math.round(Math.max(minY, Math.min(maxY, newPanY))),
        };
      }

      function updateTransform() {
        const clamped = clampPan(panX, panY, zoom);
        panX = clamped.x;
        panY = clamped.y;
        wrapper.style.transform = 'translate(' + panX + 'px, ' + panY + 'px) scale(' + zoom + ')';
        if (zoomLabel) {
          zoomLabel.textContent = Math.round(zoom * 100) + '%';
        }
      }

      function setZoom(newZoom, centerX, centerY) {
        const clampedZoom = Math.min(Math.max(newZoom, 0.15), 3.5);
        const rect = viewport.getBoundingClientRect();
        const cx = centerX !== undefined ? centerX : rect.width / 2;
        const cy = centerY !== undefined ? centerY : rect.height / 2;

        panX = cx - (cx - panX) * (clampedZoom / zoom);
        panY = cy - (cy - panY) * (clampedZoom / zoom);
        zoom = clampedZoom;
        updateTransform();
      }

      function fitToScreen() {
        const vpW = viewport.clientWidth - 80;
        const vpH = viewport.clientHeight - 80;
        if (vpW <= 0 || vpH <= 0) return;

        const totalW = diagW + 40;
        const totalH = diagH + 40;
        const scale = Math.min(vpW / totalW, vpH / totalH, 1.2);
        zoom = Math.max(0.18, scale);
        panX = Math.round((viewport.clientWidth - totalW * zoom) / 2);
        panY = Math.max(30, Math.round((viewport.clientHeight - totalH * zoom) / 2));
        updateTransform();
      }

      function resetZoom() {
        zoom = 1;
        const totalW = diagW + 40;
        const totalH = diagH + 40;
        panX = Math.max(30, Math.round((viewport.clientWidth - totalW) / 2));
        panY = Math.max(30, Math.round((viewport.clientHeight - totalH) / 2));
        updateTransform();
      }

      zoomInBtn.addEventListener('click', function() { setZoom(zoom * 1.25); });
      zoomOutBtn.addEventListener('click', function() { setZoom(zoom / 1.25); });
      zoomLabel.addEventListener('click', resetZoom);
      zoomFitBtn.addEventListener('click', fitToScreen);

      viewport.addEventListener('wheel', function(e) {
        e.preventDefault();
        const rect = viewport.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const factor = e.deltaY < 0 ? 1.15 : 0.87;
        setZoom(zoom * factor, mouseX, mouseY);
      }, { passive: false });

      viewport.addEventListener('mousedown', function(e) {
        if (e.button === 0 || e.button === 1) {
          isPanning = true;
          startX = e.clientX - panX;
          startY = e.clientY - panY;
        }
      });

      window.addEventListener('mousemove', function(e) {
        if (!isPanning) return;
        const rawX = e.clientX - startX;
        const rawY = e.clientY - startY;
        const clamped = clampPan(rawX, rawY, zoom);
        panX = clamped.x;
        panY = clamped.y;
        startX = e.clientX - panX;
        startY = e.clientY - panY;
        wrapper.style.transform = 'translate(' + panX + 'px, ' + panY + 'px) scale(' + zoom + ')';
        if (zoomLabel) {
          zoomLabel.textContent = Math.round(zoom * 100) + '%';
        }
      });

      window.addEventListener('mouseup', function() {
        isPanning = false;
      });

      window.addEventListener('resize', function() {
        updateTransform();
      });

      // Touch pinch & pan
      let touchStartDist = 0;
      let touchStartZoom = 1;
      viewport.addEventListener('touchstart', function(e) {
        if (e.touches.length === 2) {
          touchStartDist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
          touchStartZoom = zoom;
        } else if (e.touches.length === 1) {
          isPanning = true;
          startX = e.touches[0].clientX - panX;
          startY = e.touches[0].clientY - panY;
        }
      });

      viewport.addEventListener('touchmove', function(e) {
        if (e.touches.length === 2 && touchStartDist > 0) {
          e.preventDefault();
          const dist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
          const factor = dist / touchStartDist;
          zoom = Math.min(Math.max(touchStartZoom * factor, 0.15), 3.5);
          updateTransform();
        } else if (e.touches.length === 1 && isPanning) {
          const rawX = e.touches[0].clientX - startX;
          const rawY = e.touches[0].clientY - startY;
          const clamped = clampPan(rawX, rawY, zoom);
          panX = clamped.x;
          panY = clamped.y;
          startX = e.touches[0].clientX - panX;
          startY = e.touches[0].clientY - panY;
          wrapper.style.transform = 'translate(' + panX + 'px, ' + panY + 'px) scale(' + zoom + ')';
        }
      }, { passive: false });

      viewport.addEventListener('touchend', function() {
        isPanning = false;
        touchStartDist = 0;
      });

      window.addEventListener('keydown', function(e) {
        if (e.target && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          setZoom(zoom * 1.25);
        } else if (e.key === '-' || e.key === '_') {
          e.preventDefault();
          setZoom(zoom / 1.25);
        } else if (e.key === '0') {
          e.preventDefault();
          resetZoom();
        } else if (e.key.toLowerCase() === 'f') {
          e.preventDefault();
          fitToScreen();
        }
      });

      // Initial layout: fit to screen if large, else center
      if (diagW > (window.innerWidth - 80)) {
        fitToScreen();
      } else {
        resetZoom();
      }
    })();
  </script>

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

  private static getSymbolSvg(symbol?: string, size = 11): string {
    switch (symbol) {
      case 'user-action':
        return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
      case 'bot':
        return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>`;
      case 'check':
        return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`;
      case 'timer':
        return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
      default:
        return '';
    }
  }

  private static getSpecialIconSvg(kind: 'storage' | 'mediator', size = 10): string {
    if (kind === 'storage') {
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/></svg>`;
    }
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/></svg>`;
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
