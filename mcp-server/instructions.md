# Hướng dẫn Thiết kế Sơ đồ Quy trình Wode (Best Practices for AI Agents)

Wode là công cụ trực quan hóa quy trình theo dạng phân làn bơi (Swimlane Workflow Diagram) kết hợp phân đoạn thời gian (Frames). Để tạo sơ đồ chuyên nghiệp, gọn gàng, trực quan và không bị chồng chéo luồng, AI Agent cần tuân thủ các nguyên tắc thiết kế sau:

---

## 1. Cấu trúc Phân làn (Swimlanes / Roles)
- **Mỗi làn bơi là một Actor / Role / Service / Môi trường:** Đại diện cho một bên tham gia (Người dùng, Nhân viên, AI Agent, Hệ thống Backend, Cơ sở dữ liệu, Môi trường Staging/Prod...).
- **Thứ tự sắp xếp làn từ trên xuống dưới:** Hãy sắp xếp theo chiều tương tác tự nhiên:
  1. *Phía trên cùng:* Người khởi xướng / Stakeholder / Khách hàng / Giao diện người dùng.
  2. *Ở giữa:* Nhân sự nghiệp vụ, AI Agent điều phối, Backend Services, Hệ thống thiết kế.
  3. *Phía dưới cùng:* Cơ sở dữ liệu, Factory/Dev, Hạ tầng môi trường (Staging, Production...).
- **Màu sắc làn:** Mỗi làn nên có màu nhận diện riêng (Hex code), Wode đã cài sẵn bảng màu Luminous chuẩn.

---

## 2. Cấu trúc Phân đoạn (Frames / Milestones)
- **Frame là các giai đoạn theo thời gian:** Đại diện cho các cột mốc tuần tự của quy trình (ví dụ: "Giai đoạn 1: Khởi tạo yêu cầu", "Giai đoạn 2: Triage & Làm rõ", "Giai đoạn 3: Thiết kế & Duyệt", "Giai đoạn 4: Triển khai", "Giai đoạn 5: Go-live").
- **Frame là lớp Decor độc lập:** Giúp người xem phân biệt nhịp độ quy trình mà không làm giới hạn việc kéo thả node.

---

## 3. Nguyên tắc Căn thẳng hàng dọc (Vertical Alignment) vs Chuyển ngang (Horizontal)
ĐÂY LÀ YẾU TỐ QUAN TRỌNG NHẤT ĐỂ SƠ ĐỒ ĐẸP VÀ GỌN GÀNG:

### A. Chuyển giao giữa 2 làn khác nhau trong cùng giai đoạn (Vertical Flow)
- **Tình huống:** Bước ở Làn A bàn giao hoặc gọi bước ở Làn B (ví dụ: `[Kênh mới (Stakeholder)] -> [UX/UI Agent (UX/UI)]` hoặc `[Dev review (Factory)] -> [Staging (Môi trường)]`).
- **Cách vẽ tối ưu:** Xếp 2 node này ở **CÙNG MỘT CỘT DỌC** (hoặc đặt cùng `column`).
- **Hiệu quả:** Đường nối sẽ đi **THẲNG ĐỨNG TỪ TRÊN XUỐNG** (`M x y1 L x y2`), không bị chéo luồng sang ngang, giúp frame thu hẹp kích thước tối đa và luồng quy trình cực kỳ trực quan.

### B. Bước tiếp theo trong cùng một làn (Horizontal Progression)
- **Tình huống:** Cùng một Actor/Làn thực hiện bước tiếp theo (ví dụ: `[Coding Agent]` -> `[Dev review]` trong cùng Làn Factory).
- **Cách vẽ tối ưu:** Bước tiếp theo phải tiến sang cột bên phải (`column + 1`) để không bị đè lên bước trước.

---

## 4. Đường nối (Edges) và Nhãn thông điệp (Labels)
- **Kiểu nét vẽ (`flowType`):**
  - `'solid'`: Luồng công việc chính (Happy path / Thuận quy trình).
  - `'dashed'`: Luồng phản hồi, từ chối, yêu cầu sửa (Feedback / Reject / Revision loop). Wode sẽ tự động vẽ đường uốn cong lên trên để không đè vào luồng chính.
  - `'dotted'`: Luồng thông báo, sự kiện bất đồng bộ (Notification / Async Event).
- **Nhãn đường nối (`label`):**
  - **Phải ngắn gọn, súc tích (2 - 4 từ):** Ví dụ: `"gửi yêu cầu"`, `"ping agent"`, `"duyệt order"`, `"tạo PR"`, `"yêu cầu sửa"`, `"approve"`, `"link staging"`, `"release prod"`.
  - **Tránh câu văn dài:** Chi tiết nội dung nên đưa vào `customLabel` của Node thay vì nhét cả câu văn vào nhãn của đường nối.
- **Màu sắc đường nối (`color`):**
  - Luồng thành công/duyệt: `#10B981` (Xanh lá).
  - Luồng từ chối/sửa: `#EF4444` (Đỏ).
  - Mặc định: Để trống để Wode tự áp dụng màu theo theme.

---

## 5. Ví dụ Mẫu Chuẩn Khi Gọi `wode_create_diagram`

```json
{
  "projectName": "Quy trình Phát triển Tính năng — Human + Agent",
  "roles": [
    { "name": "Stakeholder & Khách hàng", "color": "#3B82F6" },
    { "name": "UX/UI Leader & Agent", "color": "#8B5CF6" },
    { "name": "Factory — Coding Agent & Dev", "color": "#10B981" },
    { "name": "Môi trường Staging & Prod", "color": "#F59E0B" }
  ],
  "frames": [
    { "title": "Giai đoạn 1: Tiếp nhận", "order": 1 },
    { "title": "Giai đoạn 2: Triage & Làm rõ", "order": 2 },
    { "title": "Giai đoạn 3: Code & Staging", "order": 3 }
  ],
  "nodes": [
    { "frame": "Giai đoạn 1: Tiếp nhận", "role": "Stakeholder & Khách hàng", "title": "Gửi yêu cầu", "customLabel": "Form yêu cầu tính năng" },
    { "frame": "Giai đoạn 2: Triage & Làm rõ", "role": "Stakeholder & Khách hàng", "title": "Mở kênh trao đổi", "customLabel": "Tạo kênh riêng", "column": 0 },
    { "frame": "Giai đoạn 2: Triage & Làm rõ", "role": "UX/UI Leader & Agent", "title": "UX/UI Agent phân tích", "customLabel": "Tạo spec & wireframe", "column": 0 },
    { "frame": "Giai đoạn 3: Code & Staging", "role": "Factory — Coding Agent & Dev", "title": "Coding Agent", "customLabel": "Tạo PR", "column": 0 },
    { "frame": "Giai đoạn 3: Code & Staging", "role": "Factory — Coding Agent & Dev", "title": "Dev Review", "customLabel": "Review & merge", "column": 1 },
    { "frame": "Giai đoạn 3: Code & Staging", "role": "Môi trường Staging & Prod", "title": "Deploy Staging", "customLabel": "URL staging kiểm thử", "column": 1 }
  ],
  "edges": [
    { "from": "Gửi yêu cầu", "to": "Mở kênh trao đổi", "label": "tiếp nhận" },
    { "from": "Mở kênh trao đổi", "to": "UX/UI Agent phân tích", "label": "ping agent" },
    { "from": "UX/UI Agent phân tích", "to": "Coding Agent", "label": "handoff spec" },
    { "from": "Coding Agent", "to": "Dev Review", "label": "tạo PR" },
    { "from": "Dev Review", "to": "Coding Agent", "label": "yêu cầu sửa", "flowType": "dashed", "color": "#EF4444" },
    { "from": "Dev Review", "to": "Deploy Staging", "label": "approve & push" }
  ]
}
```
*Ghi chú:* Wode tích hợp cơ chế **Auto-Column** thông minh: nếu agent không truyền `column`, Wode vẫn tự động phân tích đồ thị luồng để căn thẳng đứng các bước nối giữa 2 làn khác nhau và tự động tách các đường phản hồi `dashed` vòng lên trên để chống đè chữ!
