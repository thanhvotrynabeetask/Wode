# Đặc Tả Kỹ Thuật Chi Tiết: Offline Workflow Diagram Builder (Rule-Based)

## 1. Tổng Quan & Nguyên Tắc Kiến Trúc

### 1.1. Mục Tiêu Dự Án
Xây dựng một ứng dụng web chạy **100% Offline (Local-first)** trên máy cá nhân, không phụ thuộc internet hay API bên ngoài, dùng để thiết kế và trực quan hóa các quy trình nghiệp vụ phức tạp dạng **Cross-functional Flowchart (Swimlane Diagram)**.

### 1.2. Nguyên Tắc Cốt Lõi (Core Principles)
* **100% Deterministic Rules (Code Thuần):** Không dùng AI Agent ở tầng vận hành. Mọi logic phân làn Swimlane, tính toán tọa độ, sắp xếp thứ tự và nối dây đều xử lý bằng thuật toán xác định.
* **One-way Data-Driven Rendering:** Người dùng tương tác 100% ở thanh công cụ (Toolbar/Sidebar). Vùng biểu đồ (Canvas) ở bên phải chỉ là **Read-only View**, tự động render theo thời gian thực để đảm bảo không bao giờ bị vỡ layout hay lệch dây.
* **Modular & Web-first:** Xây dựng bằng công nghệ web hiện đại, mã nguồn gọn nhẹ, dễ bảo trì và dễ dàng đóng gói thành Desktop App (như Tauri) trong tương lai nếu cần.
* **Strict Local Workspace:** Toàn bộ file sơ đồ, file log thực thi và file session backup đều được quản lý tập trung trong một **Thư mục Workspace** do người dùng tự chỉ định trong phần Cài đặt.

---

## 2. Tech Stack Khuyến Nghị
* **Core Framework:** React 18+ (hoặc Vue 3) + TypeScript + Vite.
* **Giao diện & Styling:** Tailwind CSS + Lucide React (hoặc tương đương) được bundle hoàn toàn offline (không dùng CDN ngoài).
* **Đồ họa & Renderer:** SVG thuần túy kết hợp thư viện toán học/tọa độ nhẹ để vẽ node và đường nối (edges), đảm bảo hiệu năng tối ưu, không độ trễ (< 5ms).
* **Local Storage & File System:** Tận dụng Web File System Access API (hoặc fallback sang cơ chế Download/Upload file chuẩn) để đọc/ghi trực tiếp vào thư mục chỉ định trên máy.

---

## 3. Cấu Trúc Giao Diện & Luồng Vận Hành 3 Tầng Dữ Liệu

### 3.1. Tầng 1: Kho Nhiệm Vụ Theo Role (Role-Grouped Node Palette)
* **Phân nhóm Role:** Hiển thị danh sách các vai trò (ví dụ: *Customer, System, Admin*). Mỗi nhóm có màu sắc nhận diện riêng.
* **Thẻ Node Mẫu (Template):** Mỗi Node có sẵn các thuộc tính: `roleId`, `title`, `color`, `cornerSymbol` (biểu tượng góc phân loại tác vụ như human, bot, check, timer).
* **Quản lý sử dụng:** Hiển thị badge đếm số lần Node được dùng (`x0`, `x1`, `x2`...). Node nào có `x0` sẽ hiển thị viền nét đứt cảnh báo chưa được đưa vào quy trình.

### 3.2. Tầng 2: Trình Xây Dựng Luồng Con & Vĩ Mô (Frame Builder)
* **Frame (Logical Container):** Là các thẻ gom nhóm nằm trên Sidebar, đại diện cho từng phân đoạn quy trình nhỏ (sub-process) cắt ngang các Swimlane.
* **Micro-flow (Bên trong Frame):** 
  * Kéo thả Node từ Kho vào Frame $\rightarrow$ Hệ thống tự động **Clone** ra một `instanceId` độc lập (giữ nguyên base_id nhưng có ID chạy riêng). 
  * Cho phép tùy chỉnh thông tin riêng trên bản clone mà không ảnh hưởng template gốc.
* **Macro-flow (Giữa các Frame):** Sắp xếp thứ tự trước sau giữa các Frame trên Sidebar (`Frame 1 -> Frame 2`). Node cuối Frame trước tự động nối sang Node đầu Frame tiếp theo.
* **Xử lý rẽ nhánh Macro-flow:** Mặc định nối tuyến tính 1-1. Nếu có rẽ nhánh phức tạp (Split/Merge), cấu hình tường minh thông qua thuộc tính `next_frame_target` trên thanh công cụ.

### 3.3. Tầng 3: Vùng Biểu Đồ Trực Quan (Read-only Visual Output Canvas)
* Tự động đọc state từ Sidebar để render sơ đồ Swimlane.
* **Pan & Zoom:** Tích hợp sẵn tính năng Kéo để di chuyển (Pan) và Lăn chuột phóng to/thu nhỏ (Zoom) trên Canvas để render mượt mà khi sơ đồ lớn.
* Hỗ trợ tương tác xem: Click/Hover vào Node để highlight luồng đi qua.

---

## 4. Hệ Thống Cài Đặt, Lưu Trữ & Logging Chi Tiết

### 4.1. Quản Lý Thư Mục Workspace (Settings)
* Trong mục **Cài đặt (Settings)**, người dùng được cấu hình **Đường dẫn thư mục Workspace** trên máy cá nhân.
* Mọi file sơ đồ (`.json`), file HTML xuất ra, và file log đều được tự động lưu vào đây.

### 4.2. Hệ Thống Logging Tự Động (Auto-Logging)
* Ứng dụng tích hợp module `LoggerService`.
* Mọi sự kiện, thao tác quan trọng, cảnh báo hoặc lỗi hệ thống đều được ghi tự động vào file **`app_execution.log`** đặt trong thư mục Workspace.
* **Định dạng dòng log chuẩn:** `[YYYY-MM-DD HH:mm:ss] [LEVEL] [ModuleName] - Nội dung chi tiết.`

### 4.3. Cơ Chế Exit Flow & Backup Session Khi Tắt App
* Khi người dùng đóng ứng dụng/tab mà có thay đổi chưa lưu (`isDirty = true`):
  1. Hiển thị popup xác nhận: *"Bạn có muốn lưu lại lịch sử phiên làm việc này vào thư mục Workspace trước khi thoát không?"*
  2. **[Lưu & Thoát]:** Tự động xuất snapshot phiên hiện tại (`session_YYYYMMDD_HHmmss.json`) vào thư mục Workspace $\rightarrow$ Xóa temp $\rightarrow$ Thoát.
  3. **[Không lưu & Thoát]:** Xóa temp $\rightarrow$ Thoát ngay lập tức.
  4. **[Hủy]:** Quay lại màn hình làm việc.

### 4.4. Cơ Chế Export/Import HTML 2 Chiều & Validation
* **Export HTML:** Xuất toàn bộ biểu đồ thành 1 file `.html` độc lập, bên trong nhúng sẵn code viewer và thẻ ẩn chứa cấu trúc JSON gốc:
  ```html
  <script id="workflow-source-data" type="application/json">
    { /* Toàn bộ state cấu hình */ }
  </script>
  ```
* **Re-import & Validation:** Khi người dùng import lại file `.html` hoặc `.json`, hệ thống chạy khối lệnh `try...catch` để **Validate cú pháp JSON**. Nếu file bị lỗi cú pháp, ứng dụng bắn thông báo lỗi ra màn hình và ghi vào `app_execution.log` thay vì sập app.

---

## 5. Cấu Trúc Dữ Liệu JSON Schema Mẫu

```json
{
  "version": "1.0.0",
  "metadata": {
    "project_name": "Quy trình Mua hàng",
    "updated_at": "2026-11-16T11:00:00Z"
  },
  "settings": {
    "workspace_path": "C:/MyWorkflows/Workspace/"
  },
  "roles": [
    { "id": "role_customer", "name": "Customer", "color": "#3B82F6" },
    { "id": "role_sales", "name": "Sales Admin", "color": "#10B981" }
  ],
  "node_palette": [
    {
      "base_id": "node_01",
      "role_id": "role_customer",
      "title": "Tạo đơn hàng",
      "corner_symbol": "user-action",
      "color": "#3B82F6"
    }
  ],
  "frames": [
    {
      "frame_id": "frame_01",
      "title": "Giai đoạn Đặt hàng",
      "order": 1,
      "nodes": [
        {
          "instance_id": "inst_01_17100000",
          "base_id": "node_01",
          "title": "Tạo đơn hàng",
          "custom_label": null
        }
      ],
      "edges_config": [
        {
          "from_instance": "inst_01_17100000",
          "to_instance": "inst_02_17100001",
          "message_label": "Gửi payload JSON",
          "flow_type": "solid"
        }
      ]
    }
  ]
}
```

---

## 6. Nhật Ký Kiến Trúc & Tiến Độ Xây Dựng (Project Agenda)

### 6.1. Tiến Độ Triển Khai
* [x] **Phase 1: Foundation Setup**:
  * Đã scaffold Vite + React 18 + TypeScript + Tailwind CSS v4.
  * Thiết lập Zustand stores: `useProjectStore`, `useSettingsStore`, `useUIStore`.
  * Giao diện chọn thư mục Workspace lúc mở app (`WorkspacePicker`) bảo đảm an toàn dữ liệu.
* [x] **Phase 2: Core Engine (Palette + Frame Builder)**:
  * **Tầng 1 (Kho Role & Node Palette)**: Quản lý CRUD Role, Node template; hiển thị badge đếm lượt sử dụng `x0`, `x1`...; cảnh báo viền nét đứt khi `x0`; phân loại CornerSymbol (`user-action`, `bot`, `check`, `timer`).
  * **Tầng 2 (Frame Builder)**: Quản lý các phân đoạn Frame; clone instance độc lập; cho phép ghi chú `custom_label` riêng; sắp xếp thứ tự; cấu hình nối dây trong Frame (Micro-flow) và rẽ nhánh liên Frame (Macro-flow qua `next_frame_target`).
* [x] **Phase 3: Visual Canvas (Read-only SVG View)**:
  * Thuật toán `LayoutEngine.calculate()` hoàn toàn xác định (deterministic code), tự động chia làn Swimlane và căn giữa toạ độ node theo Role.
  * Vẽ đường nối Bézier mượt mà bằng SVG thuần túy.
  * Tích hợp Pan & Zoom tương tác tự do, thanh công cụ điều khiển phóng to/thu nhỏ/căn giữa màn hình.
  * Tương tác Hover/Click Node để làm nổi bật luồng hành trình liên quan (`highlightedPath`).
* [x] **Phase 4: Hệ Thống Lưu Trữ, Logging & Export/Import**:
  * `LoggerService`: Tự động ghi nhận định dạng chuẩn `[YYYY-MM-DD HH:mm:ss] [LEVEL] [ModuleName] - Message`.
  * `FileSystemService`: Đọc/ghi trực tiếp vào `app_execution.log` và lưu file dự án `.json` trong thư mục Workspace.
  * `ExportService`: Xuất file `.html` chạy độc lập 100% offline, nhúng sẵn SVG viewer và thẻ script ẩn `#workflow-source-data` chứa JSON gốc để có thể import ngược lại.
  * `ImportService` & `ValidationService`: Kiểm tra tính toàn vẹn của JSON, xử lý `try...catch` thông báo lỗi màn hình và ghi log nếu cú pháp hỏng, bảo vệ ứng dụng không bị crash.
  * `useBeforeUnload` & `ExitFlowDialog`: Kiểm soát trạng thái `isDirty`, cảnh báo khi tắt tab và cho phép xuất bản backup phiên (`session_YYYYMMDD_HHmmss.json`).

### 6.2. Cam Kết Bảo Mật (Zero Leakage Checklist)
* **100% Client-Side:** Không có request mạng (Network I/O), không telemetry, không gửi dữ liệu ra bên ngoài.
* **Không CDN ngoài:** Tất cả font, icons (Lucide tree-shaken), style đều được đóng gói sẵn trong bundle.
* **Content Security Policy (CSP):** Header CSP trong file HTML xuất ra chặn hoàn toàn các kết nối ra ngoài (`connect-src 'none'`).

### 6.3. Cập Nhật Tính Năng Mở Rộng & Tương Tác Visual Canvas (Update Log)
* [x] **1. Smart Anti-overlapping Flow Routing:**
  * Thuật toán phân bổ đa cổng xuất/nhập (Multi-port Staggering): Khi 1 node rẽ nhiều nhánh, các dây xuất phát tại các toạ độ Y khác nhau dọc chiều cao node, không còn xuất phát tại 1 điểm.
  * Tự động uốn cong tách biệt (Adaptive Arc Variation): Các đường cong Bézier được gán độ lệch cung khác nhau, tránh hoàn toàn hiện tượng vẽ đè chập đường dây.
  * Tự động tách vị trí nhãn thông điệp (Label Staggering) để các hộp chữ không che khuất nhau.
* [x] **2. Tùy Chỉnh Khoảng Cách Ngang (Horizontal Spacing):**
  * Thêm thanh trượt điều khiển khoảng cách ngang linh hoạt (từ 16px gọn đến 120px rộng, mặc định 40px) ngay trên thanh công cụ Canvas.
  * Hỗ trợ kéo di chuyển node theo phương ngang trực tiếp trên Canvas, với cơ chế khoá cứng trong làn (Y bị giới hạn trong làn, không thể kéo nhảy sang làn khác).
  * Nút "Căn đều lại vị trí" cho phép reset nhanh về khoảng cách chuẩn.
* [x] **3. Tùy Biến Độc Lập Cho Message Flow:**
  * Mỗi đường nối (flow) được cấu hình độc lập: Tên luồng (`message_label`), Màu sắc riêng (`color` với bảng màu chọn sẵn hoặc mã hex), Kiểu nét vẽ (`flow_type`: Nét liền `solid`, Nét đứt `dashed`, Nét chấm `dotted`).
  * Tích hợp hộp thoại tùy chỉnh trực quan: Click trực tiếp vào bất kỳ đường nối hoặc nhãn trên Canvas để mở popover chỉnh sửa ngay lập tức.
* [x] **4. Trường Node Đặc Biệt (Storage Object / Trung Gian):**
  * Bổ sung loại node `node_kind: 'storage'` (Kho lưu trữ, Cơ sở dữ liệu, Hàng đợi Message Queue, Bộ nhớ đệm Cache).
  * Hình dáng trực quan hình khối trụ (Cylinder) và biểu tượng Database màu xanh cyan riêng biệt.
  * **Cơ chế đặc quyền:** Không bị giới hạn trong 1 làn bơi; người dùng có thể kéo thả trực tiếp trên Canvas để di chuyển và đổi sang làn bơi khác tùy ý.
* [x] **5. Mở Khóa Tương Tác Trực Tiếp Trên Visual Canvas:**
  * Cho phép chỉnh sửa trực tiếp trên vùng Canvas: Kéo chỉnh vị trí ngang node trong làn, kéo node Storage xuyên làn, click flow để đổi màu/nét/tên, double click vào node để đổi tên/ghi chú trực tiếp.
  * Giới hạn an toàn duy nhất được bảo toàn: Các node nghiệp vụ thông thường tuyệt đối không bị kéo nhầm sang làn khác.

### 6.4. Đợt Nâng Cấp UX, Typography & Multi-Selection Mới Nhất
* [x] **1. Cải Tiến Typography & Chiều Cao Tự Động Co Dãn (Fix Hình 1):**
  * Tên của node (Heading, vd: `Request`) luôn nằm ở hàng trên, phông chữ đậm nét và rõ ràng.
  * Phần chú thích / mô tả (`customLabel`) nằm bên dưới. Khi nội dung mô tả dài, hệ thống tự động tăng chiều cao dọc (`height`) của node và mở rộng làn bơi (`laneHeight`) tương ứng, đảm bảo hiển thị 100% nội dung, không còn bị cắt xén hay che dấu bằng `...`.
* [x] **2. Tối Ưu Hiệu Năng Kéo Thả Cực Mượt (60+ FPS):**
  * Áp dụng `requestAnimationFrame` và loại bỏ hoàn toàn render cascade khi di chuyển chuột. Thao tác kéo thả phản hồi tức thì, mượt mà và không còn cảm giác vướng víu.
* [x] **3. Sửa Lỗi Gãy Mũi Tên Dây Nối (Fix Hình 2):**
  * Thiết lập vector tiếp tuyến tiếp cận mép cổng node luôn là phương ngang hoàn hảo ($CP_2.y = y_2$).
  * Dù node ở khác làn bơi hay khoảng cách dọc chênh lệch lớn, đầu mũi tên và thân dây nối luôn tiếp xúc thẳng hàng, vuông góc mép cổng, triệt tiêu hoàn toàn hiện tượng lệch/gãy đầu mũi tên.
* [x] **4. Chọn Cùng Lúc Nhiều Node & Kéo Thao Tác Nhóm:**
  * Giữ `Shift` hoặc `Ctrl/Cmd` + click để chọn/bỏ chọn nhiều node cùng lúc.
  * Nút "Chọn tất cả" trên thanh công cụ cho phép chọn toàn bộ node trong sơ đồ.
  * Khi kéo 1 node trong nhóm đã chọn, toàn bộ các node khác sẽ đồng thời dịch chuyển theo với cùng khoảng cách $\Delta x$.
* [x] **5. Kéo Chuyển Node Sang Frame Khác Kèm Xác Nhận (Confirm Dialog):**
  * Khi kéo thả một node vượt ranh giới sang một phân đoạn (Frame) khác, hệ thống tự động phát hiện và hiển thị hộp thoại xác nhận: *"Bạn có muốn chuyển nhiệm vụ '[Tên node]' sang phân đoạn '[Frame đích]' không?"*.
  * Chỉ khi người dùng bấm xác nhận, node mới được chuyển sang Frame mới; nếu hủy, node tự động quay về vị trí ban đầu.
* [x] **6. Tái Cấu Trúc Thanh Công Cụ & Thêm Sub-Toolbar Trực Quan:**
  * Bổ sung thanh **Canvas Sub-Toolbar** tiện ích nằm ngay trên đầu vùng biểu đồ: chuyển đổi chế độ Chọn / Di chuyển (Pan), hiển thị số lượng node đã chọn, nút chọn tất cả, thanh trượt khoảng cách ngang với 3 preset nhanh (Gọn 24px, Chuẩn 40px, Rộng 72px), nút căn đều tự động, và cụm nút Zoom/Fit màn hình.
  * Giúp giao diện thông thoáng, các thao tác quan trọng luôn sẵn sàng ngay trong tầm mắt mà không cần mở nhiều menu phụ.

### 6.5. Đợt Nâng Cấp Undo/Redo, Dark Mode Glow & Keybinding Management
* [x] **1. Hoàn Tác (Undo) & Làm Lại (Redo):**
  * Hỗ trợ phím tắt `Ctrl + Z` để hoàn tác mọi thao tác (thêm, sửa, xóa, kéo di chuyển vị trí, đổi liên kết flow) và `Ctrl + Y` (hoặc `Ctrl + Shift + Z`) để làm lại (Redo).
  * Bộ nhớ lịch sử lưu tới 40 bước gần nhất, có nút Undo/Redo trực quan trên Sub-toolbar.
* [x] **2. Chọn Nhóm Đột Phá: Ctrl Chọn Lẻ + Shift Chọn Dải Theo Luồng:**
  * Giữ `Ctrl` (hoặc `Cmd`): Chọn/bỏ chọn từng node đơn lẻ linh hoạt.
  * Giữ `Shift` + Click: Tự động chọn nhanh toàn bộ dải node nằm giữa node neo và node vừa click theo thứ tự luồng quy trình (ví dụ chọn A, giữ Shift chọn C => cả chuỗi A, B, C đều được chọn lập tức).
* [x] **3. Chế Độ Dark Mode & Hiệu Ứng Luminous Glow:**
  * Giao diện tối màu chuyên nghiệp (Deep Dark Slate `#0B0F17`), bảo vệ thị giác khi làm việc ban đêm.
  * Hiệu ứng hào quang phát sáng nhẹ (Luminous Glow) cho các node và đường nối theo màu sắc làn bơi, giúp sơ đồ rực rỡ và dễ quan sát.
  * Người dùng có thể bật/tắt hiệu ứng Glow này trong tab *Giao Diện* của mục Cài Đặt.
* [x] **4. Phím Tắt Nhanh Chuyển Chế Độ:**
  * `Ctrl + Q`: Chuyển sang chế độ **Chọn & Kéo Node**.
  * `Ctrl + A`: Chuyển sang chế độ **Di Chuyển Canvas (Pan)**; `Ctrl + Shift + A`: Chọn tất cả.
* [x] **5. Bảng Quản Lý & Thay Đổi Phím Tắt (Keybinding Customizer):**
  * Tích hợp tab *Phím Tắt & Điều Khiển* trong Cài Đặt.
  * Cho phép người dùng click vào phím tắt bất kỳ và bấm tổ hợp phím mới trên bàn phím để gán lại theo thói quen cá nhân. Có nút khôi phục về mặc định.

### 6.6. AI Agent MCP Connector & Live Sync Server (Mới Hoàn Thiện)
* [x] **1. Wode MCP Server Chuẩn Model Context Protocol:**
  * Đóng gói server MCP độc lập trong thư mục `mcp-server/` sử dụng `@modelcontextprotocol/sdk` chính thức.
  * Cung cấp 11 công cụ mạnh mẽ: `wode_create_diagram` (vẽ 1 bước), `wode_get_diagram`, `wode_list_diagrams`, `wode_add_role`, `wode_add_frame`, `wode_add_node`, `wode_connect_nodes`, `wode_update_node`, `wode_delete_node`, `wode_export_html`, `wode_validate_diagram`.
* [x] **2. Cơ Chế Live Sync Thời Gian Thực (WebSocket `ws://localhost:3333`):**
  * Tích hợp hook `useMCPLiveSync` trong ứng dụng Wode React.
  * Bất cứ khi nào Agent ra lệnh vẽ sơ đồ qua MCP, canvas web sẽ tự động nhận diện và cập nhật ngay lập tức mà không cần bấm mở file thủ công.
* [x] **3. Nút Điều Khiển & Modal Hướng Dẫn Trong Header:**
  * Bổ sung nút bấm trạng thái MCP trên Header kèm đèn hiệu hoạt động.
  * Hộp thoại hiển thị cấu hình JSON mẫu cho Claude Desktop, Cursor và Antigravity.

### 6.7. Auto-Alignment & Smart Straight Flow Routing (Mới Hoàn Thiện)
* [x] **1. Cơ Chế Tự Động Align Khi Kéo Thả (Snap-to-Align):**
  * Tự động phát hiện và hít (snap) các node theo trục tâm (Center-to-Center), lề trái (Left) hoặc lề phải (Right) với các node ở trên/dưới bất kể cùng hay khác làn bơi (ngưỡng snap 15px).
  * Hiển thị đường gióng căn chỉnh nét đứt phát sáng (Luminous Alignment Guideline) kèm huy hiệu `✓ Thẳng hàng` trực quan trên Canvas khi người dùng kéo thả có chủ đích.
* [x] **2. Triệt Tiêu Lỗi Dây Nối Méo Mó / Gãy Khúc (Smart Straight Flow):**
  * Tự động phát hiện hai node xếp thẳng hàng dọc hoặc ngang và triệt tiêu hoàn toàn hiện tượng uốn cong chữ S (S-curve) hay zigzag do lượng tử hóa lưới grid.
  * Tự động suy diễn hướng cổng nối (`bottom -> top` khi hai node xếp trên/dưới) và render đường dây thẳng tuyệt đối 100% (`M x y1 L x y2`).
  * Xem trước đường dây nối thẳng mượt mà ngay trong lúc đang giữ chuột kéo node.



