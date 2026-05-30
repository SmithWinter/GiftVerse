# Pixverse CLI Engine for Video Processor

Tài liệu hướng dẫn cài đặt, cấu hình và sử dụng Pixverse CLI Engine cho hệ thống tạo video GiftVerse.

## 1. Giới thiệu
Engine này tích hợp Pixverse CLI vào dự án để tạo video từ văn bản (text-to-video). Nó được thiết kế tương thích với cả Windows và Unix-like (macOS/Linux).

## 2. Cấu hình trước khi chạy

### Yêu cầu hệ thống
- Node.js v20+
- Đã cài đặt Pixverse CLI toàn cục (global):
  ```bash
  npm install -g pixverse
  ```
- Đã đăng nhập Pixverse:
  ```bash
  pixverse auth login
  ```
- Đăng ký gói trả phí trên Pixverse để tạo video (CLI cần gói trả phí để hoạt động)

### Biến môi trường
Bạn không cần thiết lập biến môi trường cho CLI, nhưng hãy đảm bảo rằng `pixverse` có trong PATH hệ thống.

## 3. Sử dụng Engine

Engine được tích hợp vào `VideoProcessorModule` và được gọi tự động khi bạn tạo job tạo video thông qua API.

### Các tham số job:
| Tham số | Kiểu dữ liệu | Mô tả | Bắt buộc |
|---------|--------------|-------|----------|
| `prompt` | `string` | Nội dung văn bản để tạo video | Có |
| `userId` | `string` | ID người dùng (dành cho ghi chú) | Không |
| `ratio` | `string` | Tỷ lệ khung hình (vd: 16:9, 9:16, 1:1) | Không (mặc định 16:9) |
| `durationSeconds` | `number` | Thời lượng video (giây) | Không (mặc định 5) |

## 4. Cách test chi tiết

### Bước 1: Khởi động backend server
Mở terminal, di chuyển đến thư mục `backend`:
```bash
cd backend
npm run start:dev
```
Server sẽ chạy trên `http://localhost:3000` (hoặc cổng bạn đã cấu hình).

### Bước 2: Tạo job tạo video (POST request)
Mở Postman (hoặc một công cụ test API khác):
- **Method**: `POST`
- **URL**: `http://localhost:3000/video-processor`
- **Headers**:
  ```json
  {
    "Content-Type": "application/json"
  }
  ```
- **Body** (chọn `raw` → `JSON`):
  ```json
  {
    "prompt": "A birthday present being given to a woman, heartwarming moment",
    "userId": "test-user-123",
    "ratio": "16:9",
    "durationSeconds": 5
  }
  ```
- Nhấn **Send**

→ Bạn sẽ nhận được phản hồi dạng:
```json
{
  "jobId": "abc123-def456-ghi789",
  "status": "QUEUED"
}
```
Lưu `jobId` lại để kiểm tra trạng thái sau.

### Bước 3: Kiểm tra trạng thái job (GET request)
Tạo request mới:
- **Method**: `GET`
- **URL**: `http://localhost:3000/video-processor/{jobId}` (thay `{jobId}` bằng giá trị nhận được ở bước 2)
- Không cần headers hay body
- Nhấn **Send** nhiều lần để xem trạng thái thay đổi:
  - `QUEUED`: Job đang chờ xử lý
  - `REWRITE_DONE`: Đã xử lý prompt
  - `GENERATING`: Đang tạo video (thường mất vài phút)
  - `UPLOADING`: Đang tải lên video
  - `SUCCEEDED`: Thành công
  - `FAILED`: Lỗi (xem chi tiết trong trường `error`)

### Bước 4: Tải video (nếu thành công)
Khi trạng thái là `SUCCEEDED`:
- **Method**: `GET`
- **URL**: `http://localhost:3000/video-processor/{jobId}/file`
- Bạn sẽ nhận được file video để tải về!

## 5. Các lỗi thường gặp và khắc phục

| Lỗi | Nguyên nhân | Khắc phục |
|-----|-------------|-----------|
| `spawn pixverse ENOENT` | Không tìm thấy Pixverse CLI | Đảm bảo đã cài đặt `npm install -g pixverse` và kiểm tra PATH |
| `You need an active subscription` | Chưa đăng ký gói trả phí Pixverse | Đăng ký gói trả phí trên trang web Pixverse |
| `error: too many arguments` | Prompt quá dài hoặc có ký tự đặc biệt | Rút ngắn prompt và loại bỏ ký tự đặc biệt |

## 6. Lưu ý về hiệu suất
- Tạo video thường mất **2-5 phút** tuỳ theo độ dài và chất lượng
- Đừng gửi nhiều yêu cầu liên tục quá nhanh để tránh giới hạn tốc độ
- Hãy đảm bảo máy tính có kết nối internet ổn định

## 7. Vị trí file trong dự án
- Engine chính: `backend/src/video-processor/engines/pixverse-cli.engine.ts`
- Service xử lý job: `backend/src/video-processor/video-processor.service.ts`
- Controller API: `backend/src/video-processor/video-processor.controller.ts`

---
*Tài liệu được cập nhật lần cuối: 2026-05-30*
