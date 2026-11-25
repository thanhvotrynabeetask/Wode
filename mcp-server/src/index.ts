#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import path from 'path';
import { DiagramManager } from './diagramManager.js';
import { DiagramEngine } from './engine.js';
import { LiveSyncServer } from './liveSync.js';
import { DEFAULT_ROLE_COLORS, DEFAULT_WS_PORT } from './constants.js';

// Start LiveSync WebSocket Server for auto-syncing with Wode Web App
const wsPort = process.env.WODE_WS_PORT ? parseInt(process.env.WODE_WS_PORT, 10) : DEFAULT_WS_PORT;
LiveSyncServer.start(wsPort);

const server = new McpServer({
  name: 'wode-mcp-server',
  version: '1.0.0',
});

// ---------------------------------------------------------------------------
// TOOL 1: wode_create_diagram
// ---------------------------------------------------------------------------
server.tool(
  'wode_create_diagram',
  'Tạo một sơ đồ quy trình dạng phân làn (Swimlane Workflow Diagram) hoàn chỉnh cho Wode trong 1 bước. Tự động liên kết các node, tạo frame, phân làn role và xuất file JSON cùng file HTML (viewer offline).',
  {
    projectName: z.string().describe('Tên sơ đồ quy trình (ví dụ: "Quy trình Đặt hàng và Thanh toán TMĐT")'),
    filePath: z.string().optional().describe('Đường dẫn lưu file JSON (mặc định: ./<projectName>.json)'),
    exportHtml: z.boolean().optional().default(true).describe('Có xuất kèm file .html xem offline ngay trong trình duyệt không (mặc định: true)'),
    darkMode: z.boolean().optional().default(true).describe('Sử dụng giao diện Dark Mode phát sáng (Luminous Glow) cho HTML (mặc định: true)'),
    roles: z
      .array(
        z.object({
          name: z.string().describe('Tên vai trò / làn bơi (ví dụ: "Khách hàng", "Frontend", "Backend API", "Cơ sở dữ liệu", "Cổng thanh toán")'),
          color: z.string().optional().describe('Mã màu Hex cho làn (ví dụ: "#3B82F6", "#10B981", "#8B5CF6")'),
          id: z.string().optional().describe('Mã định danh tuỳ chọn cho role'),
        })
      )
      .describe('Danh sách các Swimlane (Role/Actors tham gia quy trình)'),
    frames: z
      .array(
        z.object({
          title: z.string().describe('Tiêu đề phân đoạn / giai đoạn (ví dụ: "Giai đoạn 1: Đặt hàng", "Giai đoạn 2: Xử lý thanh toán")'),
          id: z.string().optional().describe('ID phân đoạn (tuỳ chọn)'),
          order: z.number().optional().describe('Thứ tự hiển thị (1, 2, 3...)'),
          nextFrameTarget: z.string().optional().describe('Frame ID hoặc tiêu đề của frame tiếp theo nếu rẽ nhánh'),
        })
      )
      .describe('Danh sách các phân đoạn (Frames) của quy trình theo thứ tự thời gian'),
    nodes: z
      .array(
        z.object({
          frame: z.string().describe('Tiêu đề hoặc ID của Frame chứa node này'),
          role: z.string().describe('Tên hoặc ID của Role/Swimlane sở hữu node này'),
          title: z.string().describe('Tiêu đề ngắn gọn của nhiệm vụ / bước xử lý (ví dụ: "Nhập thông tin giao hàng")'),
          customLabel: z.string().optional().describe('Mô tả chi tiết nội dung hoặc payload của bước này'),
          column: z
            .number()
            .optional()
            .describe(
              'Chỉ số cột (0, 1, 2...) trong frame. Các node ở làn khác nhau có cùng cột sẽ tự động xếp thẳng đứng, giúp đường nối đi từ trên xuống dưới gọn gàng, tránh chéo luồng.'
            ),
          cornerSymbol: z
            .enum(['user-action', 'bot', 'check', 'timer', 'none'])
            .optional()
            .default('user-action')
            .describe('Biểu tượng góc phân loại tác vụ'),
          nodeKind: z
            .enum(['standard', 'storage', 'mediator'])
            .optional()
            .default('standard')
            .describe('Loại node: "standard" (nghiệp vụ thường), "storage" (database/kho chứa), "mediator" (kênh trung gian)'),
          listings: z
            .array(
              z.object({
                id: z.string().default(() => `item_${Date.now()}`),
                type: z.enum(['skill', 'ai_model', 'ai_agent', 'connector', 'tool', 'custom']),
                name: z.string(),
                description: z.string().optional(),
              })
            )
            .optional()
            .describe('Danh sách kỹ năng, AI agent, model hoặc connector gắn với bước này'),
        })
      )
      .describe('Danh sách các nhiệm vụ / Node trong từng phân đoạn'),
    edges: z
      .array(
        z.object({
          from: z.string().describe('Tiêu đề hoặc ID của node nguồn'),
          to: z.string().describe('Tiêu đề hoặc ID của node đích'),
          label: z.string().optional().describe('Nội dung tin nhắn / dữ liệu truyền đi (ví dụ: "POST /orders", "OTP SMS", "200 OK")'),
          flowType: z.enum(['solid', 'dashed', 'dotted']).optional().default('solid').describe('Kiểu nét vẽ: solid (liền), dashed (đứt), dotted (chấm)'),
          color: z.string().optional().describe('Màu sắc riêng cho đường nối (mã hex)'),
        })
      )
      .describe('Danh sách các đường nối / luồng trao đổi thông điệp giữa các node'),
    horizontalSpacing: z.number().optional().default(40).describe('Khoảng cách ngang giữa các node (pixel, mặc định: 40)'),
  },
  async (args) => {
    try {
      const result = await DiagramManager.createDiagram(args as any);
      return {
        content: [
          {
            type: 'text',
            text: result.summary,
          },
        ],
      };
    } catch (err: any) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Lỗi khi tạo sơ đồ: ${err.message}` }],
      };
    }
  }
);

// ---------------------------------------------------------------------------
// TOOL 2: wode_get_diagram
// ---------------------------------------------------------------------------
server.tool(
  'wode_get_diagram',
  'Đọc và phân tích thông tin chi tiết một sơ đồ Wode từ file (.json hoặc .html) hoặc từ sơ đồ đang hoạt động trong bộ nhớ.',
  {
    filePath: z.string().optional().describe('Đường dẫn tới file .json hoặc .html. Nếu bỏ trống sẽ lấy sơ đồ đang mở trong bộ nhớ.'),
    returnFullSchema: z.boolean().optional().default(false).describe('Có trả về toàn bộ cấu trúc JSON raw không (mặc định: false - trả về bản tóm tắt)'),
  },
  async ({ filePath, returnFullSchema }) => {
    try {
      const result = await DiagramManager.loadDiagram(filePath);
      const text = returnFullSchema
        ? JSON.stringify(result.schema, null, 2)
        : result.summary;

      return {
        content: [{ type: 'text', text }],
      };
    } catch (err: any) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Lỗi khi đọc sơ đồ: ${err.message}` }],
      };
    }
  }
);

// ---------------------------------------------------------------------------
// TOOL 3: wode_list_diagrams
// ---------------------------------------------------------------------------
server.tool(
  'wode_list_diagrams',
  'Quét thư mục (mặc định thư mục làm việc hiện tại) để liệt kê tất cả các file sơ đồ Wode (.json và .html) cùng thống kê cơ bản.',
  {
    directory: z.string().optional().default('.').describe('Đường dẫn thư mục cần quét (mặc định: ".")'),
  },
  async ({ directory }) => {
    try {
      const list = await DiagramManager.listDiagrams(directory);
      if (list.length === 0) {
        return {
          content: [{ type: 'text', text: `Không tìm thấy file sơ đồ Wode (.json / .html) nào trong thư mục: ${path.resolve(directory)}` }],
        };
      }

      const formatted = list
        .map(
          (d, i) =>
            `${i + 1}. [${d.type.toUpperCase()}] "${d.projectName}"\n   - File: ${d.fileName}\n   - Làn bơi: ${d.rolesCount} | Giai đoạn: ${d.framesCount} | Nodes: ${d.nodesCount}\n   - Cập nhật: ${d.updatedAt || 'N/A'}`
        )
        .join('\n\n');

      return {
        content: [
          {
            type: 'text',
            text: `Tìm thấy ${list.length} sơ đồ trong "${path.resolve(directory)}":\n\n${formatted}`,
          },
        ],
      };
    } catch (err: any) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Lỗi khi quét thư mục: ${err.message}` }],
      };
    }
  }
);

// ---------------------------------------------------------------------------
// TOOL 4: wode_add_role
// ---------------------------------------------------------------------------
server.tool(
  'wode_add_role',
  'Thêm một làn bơi (Swimlane / Role) mới vào sơ đồ hiện tại.',
  {
    name: z.string().describe('Tên vai trò / làn bơi (ví dụ: "AI Orchestrator", "Kế toán", "Microservice X")'),
    color: z.string().optional().describe('Mã màu Hex cho làn (tuỳ chọn)'),
    filePath: z.string().optional().describe('Đường dẫn file sơ đồ cần chỉnh sửa'),
  },
  async ({ name, color, filePath }) => {
    try {
      const msg = await DiagramManager.addRole(name, color, filePath);
      return { content: [{ type: 'text', text: msg }] };
    } catch (err: any) {
      return { isError: true, content: [{ type: 'text', text: err.message }] };
    }
  }
);

// ---------------------------------------------------------------------------
// TOOL 5: wode_add_frame
// ---------------------------------------------------------------------------
server.tool(
  'wode_add_frame',
  'Thêm một phân đoạn / giai đoạn (Frame) mới vào sơ đồ hiện tại.',
  {
    title: z.string().describe('Tiêu đề phân đoạn (ví dụ: "Giai đoạn 3: Đối soát và Hóa đơn")'),
    order: z.number().optional().describe('Thứ tự sắp xếp (1, 2, 3...)'),
    nextFrameTarget: z.string().optional().describe('Mục tiêu rẽ nhánh sang frame kế tiếp'),
    filePath: z.string().optional().describe('Đường dẫn file sơ đồ cần chỉnh sửa'),
  },
  async ({ title, order, nextFrameTarget, filePath }) => {
    try {
      const msg = await DiagramManager.addFrame(title, order, nextFrameTarget, filePath);
      return { content: [{ type: 'text', text: msg }] };
    } catch (err: any) {
      return { isError: true, content: [{ type: 'text', text: err.message }] };
    }
  }
);

// ---------------------------------------------------------------------------
// TOOL 6: wode_add_node
// ---------------------------------------------------------------------------
server.tool(
  'wode_add_node',
  'Thêm một nhiệm vụ / node mới vào một phân đoạn và làn bơi cụ thể.',
  {
    frame: z.string().describe('Tiêu đề hoặc ID của Frame'),
    role: z.string().describe('Tên hoặc ID của Role / Làn bơi'),
    title: z.string().describe('Tiêu đề nhiệm vụ'),
    customLabel: z.string().optional().describe('Mô tả chi tiết / ghi chú cho nhiệm vụ'),
    column: z.number().optional().describe('Chỉ số cột (0, 1, 2...) trong frame để căn thẳng đứng với node ở làn khác'),
    cornerSymbol: z.enum(['user-action', 'bot', 'check', 'timer', 'none']).optional().default('user-action'),
    nodeKind: z.enum(['standard', 'storage', 'mediator']).optional().default('standard'),
    filePath: z.string().optional(),
  },
  async (args) => {
    try {
      const msg = await DiagramManager.addNode(args as any);
      return { content: [{ type: 'text', text: msg }] };
    } catch (err: any) {
      return { isError: true, content: [{ type: 'text', text: err.message }] };
    }
  }
);

// ---------------------------------------------------------------------------
// TOOL 7: wode_connect_nodes
// ---------------------------------------------------------------------------
server.tool(
  'wode_connect_nodes',
  'Tạo một đường nối (Edge/Flow) từ một node sang node khác với nhãn thông điệp và kiểu nét vẽ.',
  {
    from: z.string().describe('Tiêu đề hoặc ID của node nguồn'),
    to: z.string().describe('Tiêu đề hoặc ID của node đích'),
    label: z.string().optional().describe('Nhãn thông điệp / payload truyền qua luồng'),
    flowType: z.enum(['solid', 'dashed', 'dotted']).optional().default('solid'),
    color: z.string().optional().describe('Mã màu Hex cho dây nối'),
    filePath: z.string().optional(),
  },
  async (args) => {
    try {
      const msg = await DiagramManager.connectNodes(args);
      return { content: [{ type: 'text', text: msg }] };
    } catch (err: any) {
      return { isError: true, content: [{ type: 'text', text: err.message }] };
    }
  }
);

// ---------------------------------------------------------------------------
// TOOL 8: wode_update_node
// ---------------------------------------------------------------------------
server.tool(
  'wode_update_node',
  'Cập nhật thông tin của một node đang có trong sơ đồ (đổi tên, sửa mô tả, chuyển làn, chuyển frame).',
  {
    node: z.string().describe('Tiêu đề hoặc ID của node cần sửa'),
    newTitle: z.string().optional().describe('Tiêu đề mới'),
    customLabel: z.string().optional().describe('Mô tả / ghi chú mới'),
    role: z.string().optional().describe('Chuyển sang Role / Làn bơi khác'),
    frame: z.string().optional().describe('Chuyển sang Frame / Phân đoạn khác'),
    nodeKind: z.enum(['standard', 'storage', 'mediator']).optional(),
    filePath: z.string().optional(),
  },
  async (args) => {
    try {
      const msg = await DiagramManager.updateNode(args);
      return { content: [{ type: 'text', text: msg }] };
    } catch (err: any) {
      return { isError: true, content: [{ type: 'text', text: err.message }] };
    }
  }
);

// ---------------------------------------------------------------------------
// TOOL 9: wode_delete_node
// ---------------------------------------------------------------------------
server.tool(
  'wode_delete_node',
  'Xóa một node khỏi sơ đồ cùng với tất cả các đường nối (edges) liên quan tới node đó.',
  {
    node: z.string().describe('Tiêu đề hoặc ID của node cần xóa'),
    filePath: z.string().optional(),
  },
  async ({ node, filePath }) => {
    try {
      const msg = await DiagramManager.deleteNode(node, filePath);
      return { content: [{ type: 'text', text: msg }] };
    } catch (err: any) {
      return { isError: true, content: [{ type: 'text', text: err.message }] };
    }
  }
);

// ---------------------------------------------------------------------------
// TOOL 10: wode_export_html
// ---------------------------------------------------------------------------
server.tool(
  'wode_export_html',
  'Xuất sơ đồ ra file HTML độc lập 100% offline. File này có thể mở trực tiếp trong bất kỳ trình duyệt nào mà không cần server, có đầy đủ SVG rendering và nhúng sẵn dữ liệu JSON gốc.',
  {
    jsonFilePath: z.string().optional().describe('Đường dẫn file .json nguồn (nếu bỏ trống dùng sơ đồ hiện tại)'),
    htmlFilePath: z.string().optional().describe('Đường dẫn lưu file .html (mặc định cùng tên với file .json)'),
    darkMode: z.boolean().optional().default(true).describe('Bật giao diện tối Dark Mode có hiệu ứng Glow'),
  },
  async ({ jsonFilePath, htmlFilePath, darkMode }) => {
    try {
      const { schema } = await DiagramManager.loadDiagram(jsonFilePath);
      const htmlContent = DiagramEngine.generateHtml(schema, { darkMode });
      const targetPath = htmlFilePath || (jsonFilePath ? jsonFilePath.replace(/\.json$/i, '') + '.html' : `${schema.metadata.project_name || 'diagram'}.html`);
      const fs = await import('fs/promises');
      await fs.writeFile(targetPath, htmlContent, 'utf8');

      return {
        content: [
          {
            type: 'text',
            text: `✅ Đã xuất sơ đồ thành file HTML offline thành công:\n${path.resolve(targetPath)}`,
          },
        ],
      };
    } catch (err: any) {
      return { isError: true, content: [{ type: 'text', text: err.message }] };
    }
  }
);

// ---------------------------------------------------------------------------
// TOOL 11: wode_validate_diagram
// ---------------------------------------------------------------------------
server.tool(
  'wode_validate_diagram',
  'Kiểm tra tính toàn vẹn cú pháp và logic của sơ đồ Wode (kiểm tra các liên kết dây nối, frame, role).',
  {
    filePath: z.string().describe('Đường dẫn file .json hoặc .html cần kiểm tra'),
  },
  async ({ filePath }) => {
    try {
      const fs = await import('fs/promises');
      const content = await fs.readFile(filePath, 'utf8');
      let jsonText = content;
      if (filePath.endsWith('.html') || content.includes('id="workflow-source-data"')) {
        const match = content.match(/<script\s+id="workflow-source-data"[^>]*>([\s\S]*?)<\/script>/i);
        if (match && match[1]) jsonText = match[1].trim();
      }

      const res = DiagramManager.validateJsonText(jsonText);
      if (!res.isValid) {
        return {
          content: [{ type: 'text', text: `❌ Sơ đồ không hợp lệ:\n- Lỗi: ${res.error}` }],
        };
      }

      const warningText =
        res.warnings && res.warnings.length > 0
          ? `\nCảnh báo:\n${res.warnings.map((w) => `  ⚠️ ${w}`).join('\n')}`
          : '\nKhông có cảnh báo nào.';

      return {
        content: [{ type: 'text', text: `✅ Sơ đồ hoàn toàn hợp lệ!${warningText}` }],
      };
    } catch (err: any) {
      return { isError: true, content: [{ type: 'text', text: err.message }] };
    }
  }
);

// ---------------------------------------------------------------------------
// RESOURCE: Schema Reference
// ---------------------------------------------------------------------------
server.resource(
  'schema-reference',
  'wode://schema-reference',
  async () => ({
    contents: [
      {
        uri: 'wode://schema-reference',
        mimeType: 'text/markdown',
        text: `# Hướng Dẫn Cấu Trúc Sơ Đồ Wode (Swimlane Diagram)

## 1. Thành Phần Cốt Lõi:
1. **Roles (Làn bơi / Swimlanes)**: Đại diện cho các Actor / Service / Hệ thống (vd: Khách hàng, Web Frontend, API Backend, DB, Payment Gateway). Mỗi Role có màu riêng.
2. **Frames (Phân đoạn / Giai đoạn)**: Đại diện cho các bước thời gian (vd: Giai đoạn 1: Đặt hàng, Giai đoạn 2: Xử lý thanh toán). Cắt ngang qua các Swimlane.
3. **Nodes (Nhiệm vụ / Bước xử lý)**: Nằm bên trong 1 Frame và thuộc 1 Role. Có title ngắn và custom_label mô tả chi tiết.
4. **Edges (Đường nối / Flows)**: Luồng dữ liệu giữa các Node (từ node này sang node khác), có kèm message_label (tên API, payload, sự kiện) và kiểu nét (solid, dashed, dotted).

## 2. Quy Tắc Thiết Kế Sơ Đồ Đẹp:
- Đặt tên Role ngắn gọn, đại diện cho thực thể chịu trách nhiệm.
- Chia quy trình thành 2 - 5 Frame hợp lý theo thứ tự tiến trình nghiệp vụ.
- Đặt tên Node là động từ + danh từ (ví dụ: "Nhập thông tin thanh toán", "Xác thực OTP", "Trừ tiền tài khoản").
- Ghi rõ nội dung giao tiếp trên Edge (ví dụ: "POST /checkout", "200 OK", "Token JWT").
`,
      },
    ],
  })
);

// Connect via Stdio
async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Wode MCP Server running on stdio');
}

run().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
