import fs from 'fs/promises';
import path from 'path';
import {
  ProjectSchema,
  Role,
  NodeTemplate,
  Frame,
  NodeInstance,
  EdgeConfig,
  CornerSymbol,
  NodeKind,
  ValidationResult,
  NodeListingItem,
} from './types.js';
import { APP_VERSION, DEFAULT_ROLE_COLORS } from './constants.js';
import { DiagramEngine } from './engine.js';
import { LiveSyncServer } from './liveSync.js';

export interface CreateDiagramInput {
  projectName: string;
  filePath?: string;
  exportHtml?: boolean;
  darkMode?: boolean;
  roles: Array<{ id?: string; name: string; color?: string }>;
  frames: Array<{ id?: string; title: string; order?: number; nextFrameTarget?: string }>;
  nodes: Array<{
    id?: string;
    frame: string; // Title or ID
    role: string; // Name or ID
    title: string;
    customLabel?: string;
    column?: number; // Optional column index in frame (0, 1, 2...)
    cornerSymbol?: CornerSymbol;
    nodeKind?: NodeKind;
    listings?: NodeListingItem[];
  }>;
  edges: Array<{
    from: string; // Title or ID of source node
    to: string; // Title or ID of target node
    label?: string;
    flowType?: 'solid' | 'dashed' | 'dotted';
    color?: string;
  }>;
  horizontalSpacing?: number;
}

export class DiagramManager {
  private static activeSchema: ProjectSchema | null = null;
  private static activeFilePath: string | null = null;

  public static getActiveSchema(): ProjectSchema | null {
    return this.activeSchema;
  }

  public static getActiveFilePath(): string | null {
    return this.activeFilePath;
  }

  /**
   * Create a full workflow diagram from high-level specs
   */
  public static async createDiagram(input: CreateDiagramInput): Promise<{
    schema: ProjectSchema;
    jsonPath?: string;
    htmlPath?: string;
    summary: string;
  }> {
    const timestamp = new Date().toISOString();

    // 1. Build Roles
    const roles: Role[] = [];
    const roleNameToId = new Map<string, string>();

    input.roles.forEach((r, idx) => {
      const roleId = r.id || `role_${idx + 1}_${r.name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 16)}`;
      const color = r.color || DEFAULT_ROLE_COLORS[idx % DEFAULT_ROLE_COLORS.length];
      const roleObj: Role = { id: roleId, name: r.name, color };
      roles.push(roleObj);
      roleNameToId.set(r.name.toLowerCase(), roleId);
      roleNameToId.set(roleId.toLowerCase(), roleId);
    });

    if (roles.length === 0) {
      roles.push({ id: 'role_default', name: 'Default Role', color: '#3B82F6' });
      roleNameToId.set('default role', 'role_default');
    }

    // 2. Build Frames
    const frames: Frame[] = [];
    const frameNameToId = new Map<string, string>();

    input.frames.forEach((f, idx) => {
      const frameId = f.id || `frame_${idx + 1}`;
      const order = f.order ?? idx + 1;
      const frameObj: Frame = {
        frame_id: frameId,
        title: f.title,
        order,
        nodes: [],
        edges_config: [],
        next_frame_target: f.nextFrameTarget || null,
      };
      frames.push(frameObj);
      frameNameToId.set(f.title.toLowerCase(), frameId);
      frameNameToId.set(frameId.toLowerCase(), frameId);
    });

    if (frames.length === 0) {
      frames.push({
        frame_id: 'frame_1',
        title: 'Giai đoạn 1',
        order: 1,
        nodes: [],
        edges_config: [],
      });
      frameNameToId.set('giai đoạn 1', 'frame_1');
      frameNameToId.set('frame_1', 'frame_1');
    }

    // 3. Build Nodes & Palettes
    const nodePalette: NodeTemplate[] = [];
    const nodeNameToInstanceId = new Map<string, string>();
    const nodeInstanceToFrame = new Map<string, Frame>();

    input.nodes.forEach((n, idx) => {
      // Find matching role
      const matchedRoleId =
        roleNameToId.get(n.role.toLowerCase()) || roles[0]?.id || 'role_default';
      const roleObj = roles.find((r) => r.id === matchedRoleId) || roles[0];

      // Find matching frame
      const matchedFrameId =
        frameNameToId.get(n.frame.toLowerCase()) || frames[0]?.frame_id;
      const targetFrame = frames.find((f) => f.frame_id === matchedFrameId) || frames[0];

      const baseId = `node_${idx + 1}`;
      const instanceId = n.id || `inst_${idx + 1}_${Date.now() % 100000}`;

      // Create Palette Template
      nodePalette.push({
        base_id: baseId,
        role_id: matchedRoleId,
        title: n.title,
        corner_symbol: n.cornerSymbol || 'user-action',
        color: roleObj.color,
        node_kind: n.nodeKind || 'standard',
      });

      // Create Node Instance
      const instance: NodeInstance = {
        instance_id: instanceId,
        base_id: baseId,
        title: n.title,
        custom_label: n.customLabel || null,
        node_kind: n.nodeKind || 'standard',
        column: n.column,
        assigned_role_id: matchedRoleId,
        listings: n.listings || [],
      };

      targetFrame.nodes.push(instance);
      nodeNameToInstanceId.set(n.title.toLowerCase(), instanceId);
      nodeNameToInstanceId.set(instanceId.toLowerCase(), instanceId);
      nodeInstanceToFrame.set(instanceId, targetFrame);
    });

    // 4. Build Edges
    input.edges.forEach((e) => {
      const fromInstance =
        nodeNameToInstanceId.get(e.from.toLowerCase()) || e.from;
      const toInstance =
        nodeNameToInstanceId.get(e.to.toLowerCase()) || e.to;

      const sourceFrame = nodeInstanceToFrame.get(fromInstance) || frames[0];

      const edgeObj: EdgeConfig = {
        edge_id: `edge_${Date.now() % 100000}_${Math.floor(Math.random() * 1000)}`,
        from_instance: fromInstance,
        to_instance: toInstance,
        message_label: e.label || '',
        flow_type: e.flowType || 'solid',
        color: e.color,
      };

      sourceFrame.edges_config.push(edgeObj);
    });

    // 5. Build Final Schema
    const schema: ProjectSchema = {
      version: APP_VERSION,
      metadata: {
        project_name: input.projectName,
        updated_at: timestamp,
      },
      settings: {
        workspace_path: '',
        horizontal_spacing: input.horizontalSpacing ?? 40,
      },
      roles,
      node_palette: nodePalette,
      frames,
      diagrams: [
        {
          id: 'diag_1',
          title: input.projectName,
          order: 1,
          roles,
          node_palette: nodePalette,
          frames,
        },
      ],
      active_diagram_id: 'diag_1',
    };

    this.activeSchema = schema;

    // 6. Save to disk if requested or default
    let jsonPath: string | undefined;
    let htmlPath: string | undefined;

    const baseName = input.projectName.replace(/[/\\?%*:|"<>]/g, '_') || 'diagram';
    const targetJsonPath = input.filePath || `${baseName}.json`;

    await fs.writeFile(targetJsonPath, JSON.stringify(schema, null, 2), 'utf8');
    jsonPath = path.resolve(targetJsonPath);
    this.activeFilePath = jsonPath;

    if (input.exportHtml !== false) {
      const htmlContent = DiagramEngine.generateHtml(schema, { darkMode: input.darkMode });
      const targetHtmlPath = targetJsonPath.replace(/\.json$/i, '') + '.html';
      await fs.writeFile(targetHtmlPath, htmlContent, 'utf8');
      htmlPath = path.resolve(targetHtmlPath);
    }

    // 7. Broadcast via LiveSync
    LiveSyncServer.broadcastSchema(schema, `Tạo mới sơ đồ: "${input.projectName}"`);

    const nodeCount = frames.reduce((acc, f) => acc + f.nodes.length, 0);
    const edgeCount = frames.reduce((acc, f) => acc + f.edges_config.length, 0);

    const summary = `✅ Đã tạo thành công sơ đồ Wode "${input.projectName}":
- Swimlanes / Roles: ${roles.length} (${roles.map((r) => r.name).join(', ')})
- Frames (Phân đoạn): ${frames.length} (${frames.map((f) => f.title).join(', ')})
- Nodes (Nhiệm vụ): ${nodeCount}
- Edges (Dây nối/Flows): ${edgeCount}
- File JSON: ${jsonPath}
${htmlPath ? `- File HTML Viewer (Offline): ${htmlPath}` : ''}`;

    return { schema, jsonPath, htmlPath, summary };
  }

  /**
   * Load diagram from file (supports .json or .html)
   */
  public static async loadDiagram(filePath?: string): Promise<{
    schema: ProjectSchema;
    summary: string;
    filePath: string;
  }> {
    const targetPath = filePath || this.activeFilePath;
    if (!targetPath) {
      if (this.activeSchema) {
        return {
          schema: this.activeSchema,
          summary: this.getSummary(this.activeSchema),
          filePath: 'memory',
        };
      }
      throw new Error('Chưa có file sơ đồ nào được chỉ định và không có sơ đồ nào trong bộ nhớ.');
    }

    const content = await fs.readFile(targetPath, 'utf8');
    let jsonText = content;

    if (targetPath.endsWith('.html') || content.includes('id="workflow-source-data"')) {
      const match = content.match(/<script\s+id="workflow-source-data"[^>]*>([\s\S]*?)<\/script>/i);
      if (!match || !match[1]) {
        throw new Error('File HTML không chứa khối dữ liệu hợp lệ (#workflow-source-data).');
      }
      jsonText = match[1].trim();
    }

    const validation = this.validateJsonText(jsonText);
    if (!validation.isValid || !validation.data) {
      throw new Error(validation.error || 'Dữ liệu sơ đồ không hợp lệ.');
    }

    this.activeSchema = validation.data;
    this.activeFilePath = path.resolve(targetPath);

    LiveSyncServer.broadcastSchema(this.activeSchema, `Mở file sơ đồ: ${path.basename(targetPath)}`);

    return {
      schema: this.activeSchema,
      summary: this.getSummary(this.activeSchema),
      filePath: this.activeFilePath,
    };
  }

  /**
   * Save active schema
   */
  public static async saveActiveSchema(filePath?: string, exportHtml = true, darkMode = true): Promise<{
    jsonPath: string;
    htmlPath?: string;
  }> {
    if (!this.activeSchema) {
      throw new Error('Không có sơ đồ nào đang mở để lưu.');
    }

    const targetJsonPath = filePath || this.activeFilePath || `${this.activeSchema.metadata.project_name || 'diagram'}.json`;
    await fs.writeFile(targetJsonPath, JSON.stringify(this.activeSchema, null, 2), 'utf8');
    const resolvedJson = path.resolve(targetJsonPath);
    this.activeFilePath = resolvedJson;

    let htmlPath: string | undefined;
    if (exportHtml) {
      const htmlContent = DiagramEngine.generateHtml(this.activeSchema, { darkMode });
      const targetHtmlPath = targetJsonPath.replace(/\.json$/i, '') + '.html';
      await fs.writeFile(targetHtmlPath, htmlContent, 'utf8');
      htmlPath = path.resolve(targetHtmlPath);
    }

    LiveSyncServer.broadcastSchema(this.activeSchema, `Đã lưu sơ đồ: ${path.basename(targetJsonPath)}`);

    return { jsonPath: resolvedJson, htmlPath };
  }

  /**
   * Add a role / swimlane
   */
  public static async addRole(name: string, color?: string, filePath?: string): Promise<string> {
    const { schema } = await this.getOrCreateActiveSchema(filePath);
    const existing = schema.roles.find((r) => r.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      return `Swimlane / Role "${name}" đã tồn tại với ID: ${existing.id}`;
    }

    const roleColor = color || DEFAULT_ROLE_COLORS[schema.roles.length % DEFAULT_ROLE_COLORS.length];
    const newRole: Role = {
      id: `role_${schema.roles.length + 1}_${name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 16)}`,
      name,
      color: roleColor,
    };

    schema.roles.push(newRole);
    schema.metadata.updated_at = new Date().toISOString();

    await this.saveActiveSchema();
    return `Đã thêm làn bơi mới: "${name}" (ID: ${newRole.id}, Color: ${roleColor})`;
  }

  /**
   * Add a frame / phase
   */
  public static async addFrame(title: string, order?: number, nextFrameTarget?: string, filePath?: string): Promise<string> {
    const { schema } = await this.getOrCreateActiveSchema(filePath);
    const frameOrder = order ?? schema.frames.length + 1;
    const frameId = `frame_${schema.frames.length + 1}`;

    const newFrame: Frame = {
      frame_id: frameId,
      title,
      order: frameOrder,
      nodes: [],
      edges_config: [],
      next_frame_target: nextFrameTarget || null,
    };

    schema.frames.push(newFrame);
    schema.metadata.updated_at = new Date().toISOString();

    await this.saveActiveSchema();
    return `Đã thêm phân đoạn mới: "${title}" (ID: ${frameId}, Order: ${frameOrder})`;
  }

  /**
   * Add a node to a frame
   */
  public static async addNode(params: {
    frame: string;
    role: string;
    title: string;
    customLabel?: string;
    column?: number;
    cornerSymbol?: CornerSymbol;
    nodeKind?: NodeKind;
    listings?: NodeListingItem[];
    filePath?: string;
  }): Promise<string> {
    const { schema } = await this.getOrCreateActiveSchema(params.filePath);

    // Find frame
    const frame = schema.frames.find(
      (f) => f.frame_id.toLowerCase() === params.frame.toLowerCase() || f.title.toLowerCase() === params.frame.toLowerCase()
    );
    if (!frame) {
      throw new Error(`Không tìm thấy Frame "${params.frame}". Hiện có: ${schema.frames.map((f) => f.title).join(', ')}`);
    }

    // Find role
    const role = schema.roles.find(
      (r) => r.id.toLowerCase() === params.role.toLowerCase() || r.name.toLowerCase() === params.role.toLowerCase()
    );
    if (!role) {
      throw new Error(`Không tìm thấy Role "${params.role}". Hiện có: ${schema.roles.map((r) => r.name).join(', ')}`);
    }

    const baseId = `node_${Date.now() % 100000}`;
    const instanceId = `inst_${Date.now() % 100000}_${Math.floor(Math.random() * 1000)}`;

    // Add to template palette
    schema.node_palette.push({
      base_id: baseId,
      role_id: role.id,
      title: params.title,
      corner_symbol: params.cornerSymbol || 'user-action',
      color: role.color,
      node_kind: params.nodeKind || 'standard',
    });

    // Add instance
    const instance: NodeInstance = {
      instance_id: instanceId,
      base_id: baseId,
      title: params.title,
      custom_label: params.customLabel || null,
      node_kind: params.nodeKind || 'standard',
      column: params.column,
      assigned_role_id: role.id,
      listings: params.listings || [],
    };

    frame.nodes.push(instance);
    schema.metadata.updated_at = new Date().toISOString();

    await this.saveActiveSchema();
    return `Đã thêm Node "${params.title}" vào Frame "${frame.title}" (Làn: ${role.name}, Instance ID: ${instanceId})`;
  }

  /**
   * Connect two nodes
   */
  public static async connectNodes(params: {
    from: string;
    to: string;
    label?: string;
    flowType?: 'solid' | 'dashed' | 'dotted';
    color?: string;
    filePath?: string;
  }): Promise<string> {
    const { schema } = await this.getOrCreateActiveSchema(params.filePath);

    let fromNode: NodeInstance | undefined;
    let fromFrame: Frame | undefined;
    let toNode: NodeInstance | undefined;

    for (const f of schema.frames) {
      for (const n of f.nodes) {
        if (n.instance_id.toLowerCase() === params.from.toLowerCase() || n.title.toLowerCase() === params.from.toLowerCase()) {
          fromNode = n;
          fromFrame = f;
        }
        if (n.instance_id.toLowerCase() === params.to.toLowerCase() || n.title.toLowerCase() === params.to.toLowerCase()) {
          toNode = n;
        }
      }
    }

    if (!fromNode || !fromFrame) {
      throw new Error(`Không tìm thấy node nguồn (From): "${params.from}"`);
    }
    if (!toNode) {
      throw new Error(`Không tìm thấy node đích (To): "${params.to}"`);
    }

    const edge: EdgeConfig = {
      edge_id: `edge_${Date.now() % 100000}_${Math.floor(Math.random() * 1000)}`,
      from_instance: fromNode.instance_id,
      to_instance: toNode.instance_id,
      message_label: params.label || '',
      flow_type: params.flowType || 'solid',
      color: params.color,
    };

    fromFrame.edges_config.push(edge);
    schema.metadata.updated_at = new Date().toISOString();

    await this.saveActiveSchema();
    return `Đã tạo đường nối từ "${fromNode.title}" ➔ "${toNode.title}" (Nhãn: "${edge.message_label}", Nét: ${edge.flow_type})`;
  }

  /**
   * Update an existing node
   */
  public static async updateNode(params: {
    node: string;
    newTitle?: string;
    customLabel?: string;
    role?: string;
    frame?: string;
    cornerSymbol?: CornerSymbol;
    nodeKind?: NodeKind;
    listings?: NodeListingItem[];
    filePath?: string;
  }): Promise<string> {
    const { schema } = await this.getOrCreateActiveSchema(params.filePath);

    let targetNode: NodeInstance | undefined;
    let currentFrame: Frame | undefined;

    for (const f of schema.frames) {
      for (const n of f.nodes) {
        if (n.instance_id.toLowerCase() === params.node.toLowerCase() || n.title.toLowerCase() === params.node.toLowerCase()) {
          targetNode = n;
          currentFrame = f;
          break;
        }
      }
      if (targetNode) break;
    }

    if (!targetNode || !currentFrame) {
      throw new Error(`Không tìm thấy node: "${params.node}"`);
    }

    if (params.newTitle) targetNode.title = params.newTitle;
    if (params.customLabel !== undefined) targetNode.custom_label = params.customLabel;
    if (params.nodeKind) targetNode.node_kind = params.nodeKind;
    if (params.listings) targetNode.listings = params.listings;

    // Change role if specified
    if (params.role) {
      const role = schema.roles.find(
        (r) => r.id.toLowerCase() === params.role!.toLowerCase() || r.name.toLowerCase() === params.role!.toLowerCase()
      );
      if (role) {
        targetNode.assigned_role_id = role.id;
      }
    }

    // Move to different frame if specified
    if (params.frame && params.frame.toLowerCase() !== currentFrame.title.toLowerCase() && params.frame.toLowerCase() !== currentFrame.frame_id.toLowerCase()) {
      const destFrame = schema.frames.find(
        (f) => f.frame_id.toLowerCase() === params.frame!.toLowerCase() || f.title.toLowerCase() === params.frame!.toLowerCase()
      );
      if (destFrame) {
        currentFrame.nodes = currentFrame.nodes.filter((n) => n.instance_id !== targetNode!.instance_id);
        destFrame.nodes.push(targetNode);
      }
    }

    schema.metadata.updated_at = new Date().toISOString();
    await this.saveActiveSchema();
    return `Đã cập nhật Node: "${targetNode.title}" (ID: ${targetNode.instance_id})`;
  }

  /**
   * Delete a node and its associated edges
   */
  public static async deleteNode(nodeIdentifier: string, filePath?: string): Promise<string> {
    const { schema } = await this.getOrCreateActiveSchema(filePath);

    let foundNode: NodeInstance | undefined;
    let foundFrame: Frame | undefined;

    for (const f of schema.frames) {
      for (const n of f.nodes) {
        if (n.instance_id.toLowerCase() === nodeIdentifier.toLowerCase() || n.title.toLowerCase() === nodeIdentifier.toLowerCase()) {
          foundNode = n;
          foundFrame = f;
          break;
        }
      }
      if (foundNode) break;
    }

    if (!foundNode || !foundFrame) {
      throw new Error(`Không tìm thấy node để xóa: "${nodeIdentifier}"`);
    }

    const targetId = foundNode.instance_id;
    const targetTitle = foundNode.title;

    // Remove node
    foundFrame.nodes = foundFrame.nodes.filter((n) => n.instance_id !== targetId);

    // Remove all edges referencing this node
    let removedEdges = 0;
    schema.frames.forEach((f) => {
      const initialCount = f.edges_config.length;
      f.edges_config = f.edges_config.filter((e) => e.from_instance !== targetId && e.to_instance !== targetId);
      removedEdges += initialCount - f.edges_config.length;
    });

    schema.metadata.updated_at = new Date().toISOString();
    await this.saveActiveSchema();
    return `Đã xóa Node "${targetTitle}" và ${removedEdges} đường nối liên quan.`;
  }

  /**
   * Scan directory for diagrams
   */
  public static async listDiagrams(directory = '.'): Promise<Array<{
    fileName: string;
    fullPath: string;
    type: 'json' | 'html';
    projectName?: string;
    updatedAt?: string;
    rolesCount?: number;
    framesCount?: number;
    nodesCount?: number;
  }>> {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    const results = [];

    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const ext = path.extname(entry.name).toLowerCase();
      if (ext !== '.json' && ext !== '.html') continue;
      if (entry.name.includes('package') || entry.name.includes('tsconfig') || entry.name.includes('vercel')) continue;

      const fullPath = path.resolve(directory, entry.name);
      try {
        const text = await fs.readFile(fullPath, 'utf8');
        let jsonText = text;

        if (ext === '.html') {
          const match = text.match(/<script\s+id="workflow-source-data"[^>]*>([\s\S]*?)<\/script>/i);
          if (!match) continue;
          jsonText = match[1].trim();
        }

        const data = JSON.parse(jsonText);
        if (data && data.version && data.metadata && data.frames) {
          const nodeCount = (data.frames || []).reduce((acc: number, f: any) => acc + (f.nodes?.length || 0), 0);
          results.push({
            fileName: entry.name,
            fullPath,
            type: ext.slice(1) as 'json' | 'html',
            projectName: data.metadata?.project_name || 'Không tên',
            updatedAt: data.metadata?.updated_at,
            rolesCount: data.roles?.length || 0,
            framesCount: data.frames?.length || 0,
            nodesCount: nodeCount,
          });
        }
      } catch {
        // Skip unparseable files
      }
    }

    return results;
  }

  /**
   * Validate JSON schema and diagram completeness
   */
  public static validateJsonText(jsonText: string): ValidationResult {
    try {
      const obj = JSON.parse(jsonText);
      const warnings: string[] = [];

      if (!obj || typeof obj !== 'object') {
        return { isValid: false, error: 'Dữ liệu không phải JSON object.' };
      }
      if (!obj.version) {
        return { isValid: false, error: 'Thiếu trường "version".' };
      }
      if (!obj.metadata?.project_name) {
        return { isValid: false, error: 'Thiếu trường "metadata.project_name".' };
      }
      if (!Array.isArray(obj.roles) || obj.roles.length === 0) {
        warnings.push('Chưa có Swimlane/Role nào được định nghĩa.');
      }
      if (!Array.isArray(obj.frames) || obj.frames.length === 0) {
        return { isValid: false, error: 'Sơ đồ phải có ít nhất 1 Frame.' };
      }

      // Check node references in edges
      const allInstanceIds = new Set<string>();
      (obj.frames || []).forEach((f: Frame) => {
        (f.nodes || []).forEach((n: NodeInstance) => allInstanceIds.add(n.instance_id));
      });

      (obj.frames || []).forEach((f: Frame) => {
        (f.edges_config || []).forEach((e: EdgeConfig) => {
          if (!allInstanceIds.has(e.from_instance)) {
            warnings.push(`Dây nối tham chiếu đến node nguồn không tồn tại: ${e.from_instance}`);
          }
          if (!allInstanceIds.has(e.to_instance)) {
            warnings.push(`Dây nối tham chiếu đến node đích không tồn tại: ${e.to_instance}`);
          }
        });
      });

      return {
        isValid: true,
        warnings,
        data: obj as ProjectSchema,
      };
    } catch (err: any) {
      return { isValid: false, error: `Cú pháp JSON lỗi: ${err.message}` };
    }
  }

  public static getSummary(schema: ProjectSchema): string {
    const roles = schema.roles || [];
    const frames = schema.frames || [];
    const nodeCount = frames.reduce((acc, f) => acc + (f.nodes?.length || 0), 0);
    const edgeCount = frames.reduce((acc, f) => acc + (f.edges_config?.length || 0), 0);

    return `📊 Thông tin sơ đồ: "${schema.metadata.project_name}"
- Cập nhật lúc: ${schema.metadata.updated_at}
- Số làn bơi (Roles): ${roles.length} (${roles.map((r) => r.name).join(', ')})
- Số phân đoạn (Frames): ${frames.length}
- Tổng số bước (Nodes): ${nodeCount}
- Tổng số luồng nối (Edges): ${edgeCount}

Chi tiết phân đoạn:
${frames
  .map(
    (f) =>
      `  • [Frame #${f.order}] "${f.title}": ${f.nodes.length} nodes (${f.nodes.map((n) => n.title).join(', ')})${
        f.edges_config.length > 0 ? ` | ${f.edges_config.length} flows` : ''
      }`
  )
  .join('\n')}`;
  }

  private static async getOrCreateActiveSchema(filePath?: string): Promise<{ schema: ProjectSchema }> {
    if (filePath) {
      const res = await this.loadDiagram(filePath);
      return { schema: res.schema };
    }
    if (this.activeSchema) {
      return { schema: this.activeSchema };
    }
    // Create new blank schema
    const res = await this.createDiagram({
      projectName: 'New Diagram',
      roles: [{ name: 'Default Role' }],
      frames: [{ title: 'Giai đoạn 1' }],
      nodes: [],
      edges: [],
    });
    return { schema: res.schema };
  }
}
