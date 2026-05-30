## Skill: Gửi — MVP Flow (Business + Tech)

### 0) Thiết lập môi trường (.env)
- Tạo `.env` bằng cách copy từ `.env.example` ở thư mục root.
- Chỉ commit `.env.example`; không commit `.env` (chứa secret).

Các biến môi trường hiện có:
- `PORT`: cổng chạy backend (NestJS). Nếu không set thì backend sẽ dùng `3000`.
- `DB_NAME`: tên database MySQL.
- `DB_ENDPOINT`: host (hoặc host:port) MySQL.
- `USER`: user đăng nhập MySQL.
- `PASSWORD`: mật khẩu MySQL.

Ví dụ:
```
PORT=19880
DB_NAME=giftverse
DB_ENDPOINT=localhost
USER=root
PASSWORD=change_me
```

### 1) Mục tiêu MVP
- Tạo và gửi gift voucher kèm video cá nhân hoá 15s (13s nội dung + 2s cuối hiển thị QR redeem trong video).
- Trải nghiệm nhận quà “cinematic + tin cậy”: có trust gate, user gesture để phát video có âm, redeem bằng QR.
- Chứng minh 3 giá trị: wow moment, kiểm soát chất lượng AI (director control), delivery & trust.

### 2) Phạm vi
#### In-scope
- Luồng người tặng: nhập người nhận (email/phone), chọn voucher/dịp, viết lời chúc, chọn mood/intent, tạo video, gửi link.
- Luồng người nhận: confirm danh tính, mở quà, xem video 15s, QR xuất hiện ở 2s cuối trong video, replay QR, gửi lời cảm ơn (mock).
- Fail-safe: nếu video chưa sẵn sàng/lỗi, fallback sang bản chuẩn theo dịp nhưng vẫn giữ end-card QR trong video.

#### Out-of-scope
- Thanh toán thật, inventory voucher thật, chống gian lận production-grade.
- Dashboard campaign/analytics đầy đủ.
- Nhiều phong cách video phức tạp; MVP chỉ cần 2–3 mood demo nổi bật.

### 3) Personas & Giá trị
#### Người tặng (Buyer/Giver)
- Nhu cầu: tặng voucher nhưng muốn người nhận “cảm thấy được trân trọng”.
- Giá trị: director control giúp tạo video ý nghĩa mà không cần biết viết prompt.

#### Người nhận (Receiver)
- Nhu cầu: xác nhận quà đúng người, trải nghiệm ngắn, redeem rõ ràng.
- Giá trị: trust gate + end-card QR rõ ràng, có replay QR nếu scan không kịp.

#### Brand/Stakeholder (Future)
- Nhu cầu: tăng completion (xem tới đoạn QR) và tăng redeem conversion.
- Giá trị: format 15s chuẩn hoá + kiểm soát end-card QR + có trust gate.

### 4) Flow người tặng (Create → Generate → Send)
#### Bước 1 — Người nhận (Delivery identity)
- Bắt buộc: email/phone người nhận.
- Tuỳ chọn khuyến khích: tên người nhận.
- Kết quả: hệ thống biết gửi cho ai và dùng để render trust gate cho người nhận.

#### Bước 2 — Chọn quà (Gift selection)
- Chọn voucher (brand/value).
- Chọn dịp (occasion).
- Kết quả: xác định bối cảnh để dựng video.

#### Bước 3 — Lời chúc (Message)
- Lời chúc ngắn 1–2 câu, giới hạn ký tự.
- Kết quả: chất liệu chính cho 13s nội dung.

#### Bước 4 — Director Mode (Kiểm soát AI)
- Mood (bắt buộc): tone cảm xúc.
- Intent (tuỳ chọn): tác động mong muốn lên người nhận.
- Optional: 1 ảnh + 1 câu chi tiết riêng.
- Kết quả: prompt có cấu trúc, giảm rủi ro lệch vibe/cringe.

#### Bước 5 — Preview kịch bản 15s (Preflight check)
- Tóm tắt để xác nhận:
  - Người nhận dạng mask (****1234 / a***@).
  - Voucher/dịp.
  - Mood/Intent.
  - Lời chúc.
  - Timeline rõ: 13s nội dung + 2s cuối QR redeem.
- Kết quả: giảm nhập nhầm, giảm kỳ vọng sai.

#### Bước 6 — Generate & Send
- Tạo video (mục tiêu chờ 15–60s).
- Gửi link tới email/phone.
- Kết quả: time-to-send nhanh, có trạng thái generating/success/fail.

### 5) Flow người nhận (Open → Confirm → Watch → Redeem)
#### Màn 1 — Trust gate (Đúng người nhận)
- Hiển thị: “Món quà này được gửi tới ****1234. Đây có phải bạn không?”
- Hành động:
  - “Đúng là tôi” → vào trải nghiệm mở quà.
  - “Không phải tôi” → màn an toàn (không phát video, không hiển thị QR).
- Mục tiêu: tăng trust, giảm forward nhầm/phishing.

#### Màn 2 — User gesture “Mở quà”
- Nút “Mở quà” để bắt đầu video (cho phép phát có âm và tạo nghi thức).

#### Màn 3 — Video 15s (Core experience)
- Fullscreen, mobile-first.
- 2s cuối (t=13→15) hiển thị QR redeem trong chính video (end-card).

#### Màn 4 — Hậu video (Giảm rủi ro scan không kịp)
- “Xem lại QR (2s cuối)” hoặc “Phát lại”.
- “Gửi lời cảm ơn” (mock).

### 6) Cấu trúc nội dung video 15s (Chuẩn hoá)
#### 13s nội dung (AI-controlled)
- 0–2s: Title/To (tên người nhận + dịp).
- 2–9s: Mood sequence (nhịp/visual theo mood).
- 9–13s: Message highlight (lời chúc như caption điện ảnh).

#### 2s cuối redeem (Standardized end-card)
- QR + brand/value rõ ràng + hướng dẫn scan.
- Mood chỉ ảnh hưởng transition vào end-card; layout end-card nhất quán để scan tốt và đáng tin.

### 7) Trạng thái & Fail-safe
- Generating: progress rõ ràng.
- Success: có preview và xác nhận đã gửi.
- Fail video: fallback bản chuẩn theo dịp (vẫn giữ 15s và end-card QR).
- Wrong recipient: chặn trước khi vào video/QR.
- Scan fail: có replay 2s cuối.

### 8) KPI demo (MVP)
- Time-to-send: tạo & gửi trong < 60s.
- Completion: tỉ lệ xem tới đoạn QR.
- Redeem intent: scan hoặc bấm “xem lại QR”.
- Delight: tỉ lệ gửi lời cảm ơn.

### 9) Thuật ngữ
- Mood: cảm xúc tone của video.
- Intent: tác động mong muốn lên người nhận.
- Trust gate: màn xác nhận danh tính trước khi vào video/QR.
- End-card QR: 2s cuối trong video dành cho redeem.
