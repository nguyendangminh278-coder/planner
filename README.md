# Pastel Planner — Calendar + 3-level Todo

Prototype React/Vite theo brief:
- Đăng nhập Google bằng Firebase Authentication.
- Firestore lưu lịch, task và quyền chia sẻ.
- Lịch tuần từ **Thứ 2 đến Thứ 7**, event theo giờ bắt đầu/kết thúc.
- Todo phân cấp: **Bậc 1 (project/task lớn) → Bậc 2 (step) → Bậc 3 (nội dung/checklist/notes)**.
- Timeline task: bậc 1 nằm trên, các step bậc 2 nối theo thời gian bên dưới.
- Xem lịch người khác qua cơ chế `calendarShares`.
- Overlay **lịch chung nhóm từ API/database khác**.
- Màu pastel nhạt, ít card/box, ưu tiên đường kẻ và khoảng trắng.

## 1. Chạy ngay
```bash
npm install
npm run dev
```
Nếu chưa cấu hình Firebase, nút đăng nhập sẽ mở **demo mode** với dữ liệu mẫu.

## 2. Bật đăng nhập Google + Firestore thật
1. Tạo Firebase project.
2. Authentication → Sign-in method → bật Google.
3. Firestore Database → Create database.
4. Tạo Firebase Web App và copy config.
5. Copy `.env.example` thành `.env`, điền `VITE_FIREBASE_*`.
6. Deploy `firestore.rules` (hoặc paste rules trong Firebase Console).

## 3. Cấu trúc dữ liệu đề xuất
### `profiles/{uid}`
```json
{ "displayName": "Nguyen Minh", "email": "...", "photoURL": "..." }
```

### `events/{eventId}`
```json
{
  "ownerId": "uid",
  "title": "Review tài liệu",
  "start": "2026-10-06T14:00:00+07:00",
  "end": "2026-10-06T15:30:00+07:00",
  "color": "#f7d8e6"
}
```

### `tasks/{taskId}`
Khuyến nghị một document cho task bậc 1, step bậc 2 là subcollection nếu quy mô lớn:
```json
{
  "ownerId": "uid",
  "title": "Hoàn thành quy trình thẻ",
  "start": "2026-10-01",
  "end": "2026-10-10",
  "progress": 62,
  "details": "..."
}
```
`tasks/{taskId}/steps/{stepId}`:
```json
{
  "title": "Vận hành",
  "start": "2026-10-03",
  "end": "2026-10-07",
  "progress": 70,
  "details": "Đây là nội dung bậc 3 / checklist / link tài liệu"
}
```

### `calendarShares/{shareId}`
```json
{
  "ownerId": "uid-A",
  "viewerUid": "uid-B",
  "viewerEmail": "b@example.com",
  "permission": "read"
}
```
Trong production, khi B xem lịch A, backend/Cloud Function nên resolve quyền share rồi chỉ trả các event được phép xem.

## 4. API lịch chung nhóm
Set biến:
```env
VITE_GROUP_CALENDAR_API_URL=https://your-api.example.com/group-calendar
```
Expected response:
```json
{
  "events": [
    {
      "id": "group-1",
      "title": "Sync sprint",
      "start": "2026-10-07T15:00:00+07:00",
      "end": "2026-10-07T16:00:00+07:00",
      "owner": "Team Ops"
    }
  ]
}
```
Nếu API khác schema, sửa adapter trong `loadExternal()` ở `src/App.jsx`.

## 5. Production architecture nên dùng
Browser → Firebase Auth → Firestore (private calendars/tasks)

Browser → Cloud Function / API Gateway → External Team DB/API

Không nên để secret/API key của database ngoài trực tiếp ở frontend. Nếu API lịch nhóm cần key bí mật, hãy gọi qua Firebase Cloud Functions hoặc backend proxy.

## 6. Việc còn nên làm khi đưa vào dùng thật
- CRUD task/step đầy đủ + reorder/drag.
- Query lịch được share theo user/email.
- Invite/accept share thay vì share trực tiếp.
- Firestore composite indexes cho owner/date range.
- Timezone field chuẩn (IANA, ví dụ `Asia/Ho_Chi_Minh`).
- Recurring events, notification, reminder.
- Cloud Function proxy cho API lịch nhóm và cache.
