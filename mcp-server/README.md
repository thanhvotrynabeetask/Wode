# Wode MCP Server (Model Context Protocol Connector)

Server kết nối (MCP Connector) chuẩn dành cho AI Agent (Antigravity, Claude, Cursor, Gemini, v.v.) giúp agent trực tiếp **thiết kế, phân tích và vẽ sơ đồ quy trình dạng phân làn (Swimlane Workflow Diagram)** trên công cụ **Wode**.

---

## 🌟 Tính Năng Nổi Bật

1. **Vẽ Sơ Đồ Toàn Diện Trong 1 Bước (`wode_create_diagram`)**:
   - Agent chỉ cần truyền danh sách vai trò (Roles), các giai đoạn (Frames), các bước công việc (Nodes) và dây nối luồng (Edges).
   - Tự động sinh ID, gán màu sắc thẩm mỹ cho từng làn bơi, liên kết các bước và tính toán thứ tự.
   - Tự động xuất ra cả **File JSON Wode chuẩn** và **File HTML tương tác offline** (hỗ trợ Dark Mode phát sáng).

2. **Live Sync Tự Động Với Ứng Dụng Wode (WebSocket)**:
   - Tích hợp sẵn server WebSocket chạy ngầm (`ws://localhost:3333`).
   - Khi bạn mở ứng dụng web Wode trên trình duyệt, bất cứ khi nào Agent gọi lệnh vẽ hoặc cập nhật sơ đồ qua MCP, biểu đồ trên màn hình web sẽ **tự động vẽ lại theo thời gian thực** mà không cần reload trang hay import thủ công.

3. **Bộ Công Cụ Thao Tác Chi Tiết (Granular Tools)**:
   - Thêm làn bơi (`wode_add_role`), thêm giai đoạn (`wode_add_frame`), thêm bước (`wode_add_node`).
   - Nối dây luồng tin nhắn (`wode_connect_nodes`), cập nhật nội dung (`wode_update_node`), xóa bước (`wode_delete_node`).
   - Đọc và phân tích sơ đồ có sẵn (`wode_get_diagram`), quét thư mục tìm sơ đồ (`wode_list_diagrams`).
   - Kiểm tra tính toàn vẹn và hợp lệ của sơ đồ (`wode_validate_diagram`).

---

## 🚀 Hướng Dẫn Cài Đặt & Sử Dụng

### 1. Build Server
```bash
# Tại thư mục gốc của dự án Wode:
npm run mcp:build
```

### 2. Khởi Chạy Server Thủ Công (Nếu Muốn Test Stdio hoặc LiveSync)
```bash
npm run mcp
```

---

## ⚙️ Cấu Hình Với Các AI Client

### A. Cấu Hình Cho Claude Desktop
Mở file cấu hình Claude Desktop:
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

Thêm cấu hình:
```json
{
  "mcpServers": {
    "wode": {
      "command": "node",
      "args": [
        "C:\\Users\\thanh\\Desktop\\project\\Wode\\mcp-server\\dist\\index.js"
      ],
      "env": {
        "WODE_WS_PORT": "3333"
      }
    }
  }
}
```

### B. Cấu Hình Cho Cursor
Thêm vào `.cursor/mcp.json` (hoặc Cài đặt Cursor > Features > MCP Servers):
```json
{
  "mcpServers": {
    "wode": {
      "command": "node",
      "args": [
        "C:\\Users\\thanh\\Desktop\\project\\Wode\\mcp-server\\dist\\index.js"
      ]
    }
  }
}
```

### C. Cấu Hình Cho Antigravity
Thêm vào file cấu hình MCP của workspace hoặc agent:
```json
{
  "mcpServers": {
    "wode": {
      "command": "node",
      "args": [
        "c:/Users/thanh/Desktop/project/Wode/mcp-server/dist/index.js"
      ]
    }
  }
}
```

---

## 🛠️ Danh Sách MCP Tools Được Cung Cấp

| Tên Tool | Mô Tả |
| :--- | :--- |
| `wode_create_diagram` | Tạo toàn bộ quy trình Swimlane gồm Roles, Frames, Nodes, Edges trong 1 câu lệnh và xuất file JSON + HTML |
| `wode_get_diagram` | Đọc cấu trúc sơ đồ từ file `.json`/`.html` hoặc từ phiên đang mở trong bộ nhớ |
| `wode_list_diagrams` | Quét thư mục tìm toàn bộ các file sơ đồ Wode kèm thống kê số bước, làn bơi |
| `wode_add_role` | Thêm làn bơi (Swimlane / Actor) mới |
| `wode_add_frame` | Thêm phân đoạn / giai đoạn (Frame) mới |
| `wode_add_node` | Thêm bước xử lý / nhiệm vụ vào một làn bơi và phân đoạn |
| `wode_connect_nodes` | Tạo đường nối có mũi tên và nhãn thông điệp giữa 2 bước |
| `wode_update_node` | Chỉnh sửa tên bước, mô tả, chuyển làn bơi hoặc chuyển giai đoạn |
| `wode_delete_node` | Xóa bước xử lý cùng toàn bộ dây nối liên quan |
| `wode_export_html` | Xuất sơ đồ thành file HTML độc lập mở xem offline 100% |
| `wode_validate_diagram` | Kiểm tra cú pháp JSON và tính toàn vẹn liên kết của sơ đồ |

---

## 💡 Ví Dụ Prompt Cho Agent

Khi đã kết nối MCP Server, bạn chỉ cần ra lệnh tự nhiên cho Agent, ví dụ:
- *"Hãy vẽ cho tôi sơ đồ quy trình Đăng ký tài khoản gồm Khách hàng, Frontend, Auth Service và Email Service."*
- *"Thêm bước xác thực OTP qua SMS vào giai đoạn Xác minh trong sơ đồ vừa vẽ."*
- *"Xuất quy trình hiện tại ra file HTML Dark Mode để tôi gửi cho khách hàng xem."*
