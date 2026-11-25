# 🌊 Wode - Offline Swimlane Workflow Diagram Builder & AI Agent MCP Connector

<div align="center">

[ English ](README.md) • **[ Tiếng Việt ](README.vi.md)**

[![React 18](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC.svg)](https://tailwindcss.com/)
[![MCP Ready](https://img.shields.io/badge/MCP-Connector-emerald.svg)](https://modelcontextprotocol.io/)
[![Live Demo](https://img.shields.io/badge/Demo-wode--beta.vercel.app-blueviolet?logo=vercel)](https://wode-beta.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Data Privacy](https://img.shields.io/badge/Data%20Privacy-100%25%20Client--Side-green.svg)](#-cam-kết-tự-chủ-dữ-liệu--quyền-riêng-tư-100)

</div>

<!-- Showcase Demo Preview / GIF: Thả file demo.gif vào docs/demo.gif để hiển thị animation thực tế -->
<div align="center">
  <a href="https://wode-beta.vercel.app" target="_blank" rel="noopener noreferrer">
    <img src="docs/demo.gif" alt="Wode Live Demo" width="100%" style="max-width: 960px; border-radius: 8px; box-shadow: 0 8px 30px rgba(0,0,0,0.3);" onerror="this.onerror=null; this.src='docs/social-preview.svg';" />
  </a>
  <p><em>👉 <a href="https://wode-beta.vercel.app"><strong>Trải Nghiệm Trực Tiếp Web App: wode-beta.vercel.app</strong></a> • 100% Client-Side & Offline Ready</em></p>
</div>

**Wode** là công cụ mã nguồn mở (Open Source) chuyên biệt dùng để thiết kế, trực quan hóa và tự động hóa các sơ đồ quy trình nghiệp vụ phân làn (**Cross-functional Flowchart / Swimlane Diagram**). 

Ứng dụng được thiết kế theo triết lý **Local-first (Offline 100%)**, hoạt động hoàn toàn trên trình duyệt, kết hợp thuật toán tính toán layout xác định (Deterministic Rule-Based Layout) và tích hợp sẵn **MCP Server (Model Context Protocol)** kết nối trực tiếp với các AI Agent hàng đầu (Google Antigravity, Claude Desktop, Cursor, Windsurf, v.v.).

---

## 💡 Điểm Khác Biệt Cốt Lõi: Song Hành Giữa Con Người & AI Agent (Human + AI Co-Authoring)

Hầu hết các công cụ vẽ sơ đồ hiện nay đều rơi vào một trong hai thái cực:
* **Các công cụ Text-to-Diagram (Mermaid, PlantUML):** AI viết code sinh sơ đồ rất nhanh, nhưng người dùng **hoàn toàn bất lực khi muốn kéo thả hay tinh chỉnh trực quan bằng chuột**. Khi sơ đồ bị méo mó hay thiếu thẩm mỹ, bạn phải căng mắt sửa từng dòng code cú pháp.
* **Các bảng vẽ tự do (Miro, Draw.io, FigJam):** Người dùng thoải mái kéo thả thủ công, nhưng **AI Agent rất khó tự động hóa chuẩn xác**, dây nối dễ bị rối như ma trận mạng nhện (spaghetti flow), mất hàng giờ đồng hồ để căn lề dóng hàng.

### 🌟 Wode là chiếc cầu nối hoàn hảo giải quyết bài toán đó:

| Tiêu Chí So Sánh | Code/CLI Generator *(Mermaid, Archify)* | Visual Canvas *(Miro, Draw.io)* | 🌊 Wode *(Swimlane Studio)* |
| :--- | :---: | :---: | :---: |
| **AI Agent sinh sơ đồ tự động** | ✅ Nhanh qua code / script | ❌ Rất khó / Dễ lỗi bố cục | ✅ **1-Click qua MCP Server & Live Sync** |
| **Giao diện Editor tương tác (Visual IDE)** | ❌ Không có (chỉ xuất file tĩnh để xem) | ✅ Có bảng vẽ tự do | ✅ **Visual Studio hoàn chỉnh, chuyên biệt Swimlane** |
| **Cầm chuột kéo thả node & nắn chỉnh đường dây** | ❌ Không thể kéo thả | ✅ Kéo tự do | ✅ **Kéo thả mượt mà + Hít trục Snap-to-align** |
| **Tự tay thiết kế từ đầu bằng chuột (0 cần AI)** | ❌ Bắt buộc viết cú pháp code/JSON | ✅ Thao tác chuột | ✅ **Thao tác chuột với 3 tầng dữ liệu chuẩn** |
| **Độ chuẩn mực phân làn (Swimlane Alignment)** | ⚠️ Phụ thuộc cú pháp cứng | ❌ Dễ rối loạn làn (Spaghetti) | ✅ **Tự động chia làn, Auto-column căn dọc 0-overlap** |
| **Cộng tác 2 chiều Con người & AI (Multi-Tab)** | ❌ 1 chiều (AI xuất file xong là hết) | ❌ Không có cơ chế tách luồng | ✅ **Song hành 2 chiều, tự động cách ly tab riêng** |
| **Quyền riêng tư & Chạy Offline (Local-First)** | ⚠️ Tùy thuộc công cụ | ❌ Cần tài khoản đám mây | ✅ **100% Client-Side, Zero Telemetry** |

### 🎯 Quy trình cộng tác 2 chiều mượt mà:
1. **Khởi tạo nhanh bằng AI (AI Drafting):** Bạn chỉ cần ra lệnh cho AI Agent (Claude Desktop, Cursor, Google Antigravity, Windsurf): *"Vẽ cho tôi quy trình phát triển tính năng gồm 5 làn..."* — Agent sẽ sinh toàn bộ sơ đồ chuẩn xác qua MCP trong 3 giây.
2. **Con người trực tiếp hoàn thiện (Visual Polish):** Bạn lập tức nhìn thấy sơ đồ xuất hiện trên Canvas qua WebSocket Live Sync (`ws://localhost:3333`). Bạn có thể tự tay cầm chuột kéo lại vị trí node, điều chỉnh độ rộng Frame, sửa nhãn text, thêm/bớt bước theo ý thích.
3. **Hoặc tự tay làm từ A-Z (Manual Freedom):** Bạn hoàn toàn có thể tự vẽ thủ công từ con số 0 mà không cần bật AI, sau đó nhờ AI phân tích hoặc kiểm tra tính hợp lệ của quy trình (`wode_validate_diagram`).

---

## 🔒 Cam Kết Tự Chủ Dữ Liệu & Quyền Riêng Tư (100% Client-Side)

Dù bạn chọn sử dụng qua **link web triển khai trên Vercel** hay **chạy trực tiếp trên máy (Local)**:

* 🛡️ **Dữ liệu thuộc về bạn 100%:** Toàn bộ sơ đồ, nội dung quy trình và cấu hình chỉ tồn tại trên trình duyệt và ổ đĩa của bạn.
* 🚫 **Không gửi dữ liệu ra ngoài (Zero Telemetry):** Ứng dụng không sử dụng bất kỳ cơ sở dữ liệu đám mây nào, không thu thập analytics, không gọi API ngoài.
* 💾 **Lưu trữ chuẩn Local:** Ứng dụng tận dụng trực tiếp *Web File System Access API* (hoặc tải file JSON/HTML về máy) để bạn toàn quyền quản trị file dự án trên máy cá nhân.

> [!TIP]
> **Khuyến nghị trải nghiệm:** Mặc dù bạn có thể dùng link deploy Vercel để xem hoặc phác thảo nhanh mà không cần cài đặt, chúng tôi **khuyến khích bạn tải về và chạy Local trên máy**. Việc chạy local đảm bảo:
> 1. **Hiệu năng tối đa & Mượt mà tuyệt đối:** Không bị phụ thuộc vào đường truyền mạng, không gặp hiện tượng giật lag do lượng truy cập chia sẻ trên hạ tầng cloud miễn phí.
> 2. **Khai thác toàn bộ sức mạnh AI Agent MCP:** Kết nối tức thì với tính năng **Live Sync WebSocket** (`ws://localhost:3333`) để các AI Agent tự động vẽ và cập nhật sơ đồ ngay trên màn hình của bạn.

---

## 🚀 Các Phương Thức Sử Dụng

### Lựa Chọn 1: Sử Dụng Ngay Trên Web (Deploy Link)
Nếu bạn cần xem nhanh hoặc thiết kế sơ đồ tức thì mà không muốn cài đặt môi trường lập trình:
* Truy cập link trải nghiệm trực tiếp: [https://wode-beta.vercel.app](https://wode-beta.vercel.app).
* Bạn vẫn có toàn bộ tính năng vẽ sơ đồ, xuất/nhập file `.json` và file `.html` offline.
* Có thể đổi ngôn ngữ giao diện (English / Tiếng Việt) trong phần **Cài đặt** hoặc nút chuyển nhanh ở thanh Header.

---

### Lựa Chọn 2: Tải Về & Chạy Local Trên Máy (Khuyến Nghị ⭐)

#### 1. Yêu Cầu Môi Trường
* **Node.js**: Phiên bản 20 trở lên (`node -v`)
* **npm**: Đi kèm với Node.js (`npm -v`)

#### 2. Cài Đặt & Khởi Chạy Web App
```bash
# 1. Clone mã nguồn dự án về máy
git clone https://github.com/thanhvotrynabeetask/Wode.git
cd Wode

# 2. Cài đặt các gói phụ thuộc
npm install

# 3. Khởi chạy giao diện web ở môi trường phát triển
npm run dev
```
Sau đó mở trình duyệt tại địa chỉ: `http://localhost:5173`

#### 3. Build Bản Production Để Dùng Cực Nhanh
```bash
# Build mã nguồn tối ưu
npm run build

# Chạy bản build ngay trên máy
npm run preview
```

---

## 🤖 Kết Nối Với AI Agent (Wode MCP Server & Live Sync)

Wode đi kèm một MCP Server độc lập chuẩn [Model Context Protocol](https://modelcontextprotocol.io/) giúp các trợ lý AI (Claude Desktop, Cursor, Google Antigravity, Windsurf, v.v.) có thể trực tiếp vẽ sơ đồ, thêm làn bơi, tạo luồng công việc và đồng bộ thời gian thực lên màn hình của bạn qua WebSocket.

### 1. Cài Đặt & Build MCP Server
Tại thư mục gốc của dự án Wode, chạy lệnh:
```bash
npm run mcp:setup
```

### 2. Cấu Hình MCP Cho Các AI Client

#### 🔹 Dành cho Claude Desktop
Mở file cấu hình Claude Desktop:
* **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
* **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

Thêm cấu hình:
```json
{
  "mcpServers": {
    "wode": {
      "command": "node",
      "args": [
        "<DUONG_DAN_THU_MUC_WODE>/mcp-server/dist/index.js"
      ],
      "env": {
        "WODE_WS_PORT": "3333"
      }
    }
  }
}
```

#### 🔹 Dành cho Cursor
Mở cài đặt **Cursor Settings** > **Features** > **MCP Servers** (hoặc tạo file `.cursor/mcp.json`):
```json
{
  "mcpServers": {
    "wode": {
      "command": "node",
      "args": [
        "<DUONG_DAN_THU_MUC_WODE>/mcp-server/dist/index.js"
      ]
    }
  }
}
```

#### 🔹 Dành cho Google Antigravity / Agent Khác
```json
{
  "mcpServers": {
    "wode": {
      "command": "node",
      "args": [
        "<DUONG_DAN_THU_MUC_WODE>/mcp-server/dist/index.js"
      ]
    }
  }
}
```

---

## 🌟 Hướng Dẫn Sử Dụng Chi Tiết & Tính Năng Nổi Bật

### 📑 1. Hệ Thống Multi-Tab & Tách Bạch Flow Người Dùng vs AI Agent
- **Thanh Tab trực quan:** Nằm ngay dưới Header, cho phép bạn mở nhiều phiên làm việc song song, mỗi tab quản lý một canvas và bộ dữ liệu độc lập.
- **Thao tác tab linh hoạt:**
  - Nhấn nút `+` để tạo tab mới.
  - **Nhấp đúp chuột (Double click)** vào tiêu đề tab để đổi tên trực tiếp.
  - Nhấn nút `×` để đóng tab (hệ thống luôn giữ ít nhất 1 tab làm việc).
- **🛡️ Phân lập luồng Agent tự động:** Khi bạn đang làm việc trên tab của mình, nếu AI Agent gọi lệnh qua MCP Server (`ws://localhost:3333`), Wode sẽ **tự động tạo hoặc chuyển cập nhật sang tab riêng `🤖 Agent (MCP)`**. Điều này giúp bạn không bao giờ bị gián đoạn hay bị ghi đè lên nội dung đang vẽ!

---

### 🖼️ 2. Phân Đoạn (Frames) Độc Lập & Tùy Chỉnh Kích Thước Trực Tiếp
- **Frame là lớp Decor thuần túy:** Phân đoạn dùng để gom nhóm các bước theo từng giai đoạn thời gian (Phases / Milestones). Frame hoàn toàn độc lập với các phần tử bên trong:
  - **Xóa Frame an toàn:** Khi xóa một Frame, chỉ có đường bao phân đoạn biến mất. **Mọi node và dây nối bên trong được giữ nguyên 100% tại đúng tọa độ canvas (`ở đâu thì ở đó`)**, không bao giờ bị xóa theo hay dịch chuyển lộn xộn.
  - **Kéo thả node tự do:** Bãi bỏ hoàn toàn các hộp thoại xác nhận khi kéo node qua lại giữa các Frame.
- **Kéo chỉnh độ rộng Frame (Horizontal Resize):**
  - Người dùng có thể kéo trực tiếp cạnh phải của Frame trên Canvas để mở rộng hoặc thu hẹp chiều ngang giai đoạn.
  - **Nút kéo ẩn thông minh:** Nút kéo tay cầm mặc định ẩn đi (`opacity-0`) để giữ canvas luôn gọn gàng, và **chỉ tự động hiện lên khi người dùng lia chuột vào (hover) hoặc click chọn Frame**.

---

### 📐 3. Thuật Toán Căn Dọc Tự Động (Auto-Column) & Tối Ưu Hóa Dây Nối
- **Căn thẳng hàng dọc giữa các làn (`Auto-Column`):**
  - Khi 2 bước ở 2 làn khác nhau có kết nối liên tiếp trong cùng một giai đoạn (ví dụ: `[Kênh mới (Stakeholder)]` $\to$ `[UX/UI Agent (UX/UI)]`), Wode tự động xếp 2 node này vào **cùng một cột dọc**.
  - Dây nối đi **thẳng đứng từ trên xuống** (`M x y1 L x y2`), giúp sơ đồ gọn hơn 40–50% chiều ngang, loại bỏ hoàn toàn các đường xiên xẹo cắt ngang qua các làn bơi.
  - Tự động phát hiện cản trở làn trung gian để tránh vẽ dây đè xuyên qua node khác.
- **Chống đè chữ & Tách luồng phản hồi (Arched Loopbacks):**
  - Các đường quay lại như từ chối (`reject`) hay yêu cầu sửa code (`dashed`) tự động **uốn cong vòm lên trên đỉnh các thẻ node**, không bao giờ đè lên luồng chính thuận chiều.
  - Nhãn văn bản (Labels) giữa luồng thuận và luồng phản hồi được tách cao độ hoàn toàn, có cơ chế tự động chống trùng tọa độ.
  - Nhãn tiếng Việt có dấu được đệm tự động rộng rãi, bo góc mềm mại, không bị cắt cụt chữ.

---

### 🧹 4. Tùy Chọn Xóa Toàn Diện & Quản Lý Sơ Đồ (SubToolbar)
- **Xóa sạch toàn bộ Canvas (Clear Canvas):** Cho phép đặt lại toàn bộ vùng vẽ về trạng thái trắng tinh chỉ với 1 cú click (kèm hộp thoại xác nhận tránh bấm nhầm).
- **Xóa từng sơ đồ riêng biệt:** Khi trên canvas có từ 2 sơ đồ trở lên, bạn có thể chọn xóa chính xác sơ đồ mong muốn trong danh sách chọn.

---

### 🎨 5. Kiến Trúc 3 Tầng Dữ Liệu
1. **Tầng 1 - Kho Nhiệm Vụ (Role & Node Palette):** Quản lý vai trò (Roles) với mã màu riêng biệt. Phân loại tác vụ bằng biểu tượng góc trực quan (`user-action`, `bot`, `check`, `timer`). Tự động đếm tần suất sử dụng (`x0`, `x1`, `x2`...).
2. **Tầng 2 - Trình Dựng Phân Đoạn (Frame Builder):** Gom nhóm quy trình thành các phân đoạn logic (Frames). Tự động clone các node độc lập, hỗ trợ mô tả chi tiết (`customLabel`) và liên kết luồng tuyến tính hoặc rẽ nhánh (`next_frame_target`).
3. **Tầng 3 - Biểu Đồ Trực Quan (SVG Visual Canvas):** Vùng hiển thị sơ đồ Swimlane tự động chia làn, tính toán tọa độ, uốn cong dây nối mà không lo vỡ layout.

---

### 💾 6. Quản Lý File & Xuất Bản Ngoại Tuyến (Offline Viewer)
- **Xuất File HTML Độc Lập:** Xuất sơ đồ ra 1 file `.html` duy nhất chạy offline 100%, tích hợp sẵn Dark Mode phát sáng, SVG Viewer và **nhúng sẵn dữ liệu JSON gốc bên trong**. Bạn có thể gửi file này cho đối tác xem ngay trên trình duyệt mà không cần cài app, hoặc import ngược lại vào Wode bất cứ lúc nào.
- **Cảnh Báo & Lưu Phiên Tự Động:** Khi đóng tab hoặc thoát app nếu có thay đổi chưa lưu, hệ thống sẽ nhắc bạn xuất file sao lưu phiên làm việc (`session_YYYYMMDD_HHmmss.json`).

---

## ⌨️ Bảng Phím Tắt Tiện Dụng

| Phím Tắt | Chức Năng |
| :--- | :--- |
| `Ctrl + Z` | Hoàn tác (Undo) |
| `Ctrl + Y` / `Ctrl + Shift + Z` | Làm lại (Redo) |
| `Ctrl + Q` | Chuyển chế độ Chọn & Kéo Node |
| `Ctrl + A` | Chuyển chế độ Kéo di chuyển Canvas (Pan) |
| `Ctrl + Shift + A` | Chọn tất cả các node |
| `Ctrl + Click` | Thêm / bớt node vào nhóm đang chọn |
| `Shift + Click` | Chọn nhanh toàn bộ dải node theo luồng |
| `Delete` / `Backspace` | Xóa node đang chọn khỏi Frame |
| `Lăn chuột` | Phóng to / Thu nhỏ Canvas |
| `Chuột giữa` / `Giữ Space + Kéo` | Di chuyển vùng vẽ (Pan) |

*(Bạn có thể thay đổi các phím tắt này trong mục **Cài Đặt > Phím Tắt & Điều Khiển**)*

---

## 🤝 Đóng Góp (Contributing) & 📄 Giấy Phép (License)

* Dự án được phân phối dưới giấy phép **MIT License**. Bạn hoàn toàn tự do sử dụng cho mục đích cá nhân, học tập hoặc thương mại.
* Mọi đóng góp từ cộng đồng đều được hoan nghênh nhiệt liệt!
