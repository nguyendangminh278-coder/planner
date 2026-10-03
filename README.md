# Planner

Ứng dụng React + Vite với giao diện pastel, dùng Firebase project `calendar-f3d1b`.

## Mở ứng dụng bằng một lần bấm

Bấm đúp **start-planner.cmd** trong thư mục dự án. Script khởi động máy chủ Vite và tự mở đúng địa chỉ trong trình duyệt; giữ cửa sổ đó đang chạy khi sử dụng Planner. Có thể chạy `npm run start` với kết quả tương tự. Nếu cổng 5173 đang bận, Vite chọn cổng tiếp theo và mở đúng URL đó.

Đừng mở trực tiếp `index.html` bằng `file://`: đây là mã nguồn React/JSX, cần máy chủ Vite hoặc bản build được phục vụ qua HTTP. Trang HTML hiện có thông báo hướng dẫn thay cho màn hình trắng nếu mở trực tiếp.

Chọn **Khám phá bản demo** để xem ngay bố cục lịch tuần, timeline công việc và các bước. Đăng nhập Google để sử dụng dữ liệu Firebase riêng của bạn (cần hoàn tất thiết lập Firebase ở phần bên dưới).

## Chạy trên máy

Yêu cầu Node.js 24 (hoặc phiên bản được Vite hỗ trợ).

```bash
npm ci
npm run dev
```

Mở địa chỉ do Vite hiển thị. Firebase web config đã được tích hợp trong `src/lib/firebase.js`; không cần tạo `.env` để dùng project đã cung cấp. `.env.example` cho phép ghi đè config hoặc cấu hình API lịch nhóm.

```bash
npm run build
npm run preview
```

## Tính năng đã nối Firebase

- Đăng nhập/đăng xuất Google; khôi phục phiên đăng nhập.
- Thêm, sửa, xóa lịch và đồng bộ realtime bằng Firestore.
- Tạo, sửa, xóa công việc, các bước, tiến độ và nội dung/ghi chú bậc 3.
- Chia sẻ toàn bộ lịch theo email Google đã xác minh; người xem không sửa được lịch và không xem được công việc/ghi chú. Có thể thu hồi quyền xem.
- Hồ sơ người dùng chỉ chủ tài khoản truy cập được.
- Firebase Analytics với measurement ID đã cung cấp; không làm gián đoạn ứng dụng khi trình duyệt không hỗ trợ hoặc chặn analytics.
- Chế độ demo tách riêng khỏi dữ liệu thật. Thay đổi demo chỉ tồn tại trong phiên hiện tại.
- Lịch tuần Thứ 2–Thứ 7, hiển thị 24 giờ; cuộn mặc định đến 08:00.
- Lịch nhóm từ API tùy chọn, có kiểm tra phản hồi và thông báo lỗi.

## Giao diện và thời tiết cảm xúc từ todolist-main

Bố cục, font Nunito, nền slate nhạt, điểm nhấn cyan và màu cột ngày được chuyển từ dự án `C:\Users\Admin\OneDrive\Pictures\todolist-main\todolist-main`. Thứ 2–Thứ 7 lần lượt dùng rose, orange, amber, emerald, cyan, indigo. Chọn màu cho lịch, công việc và từng bước trong biểu mẫu chỉnh sửa.

- Mặc định xem lịch theo cột ngày, mở rộng cột bằng nút tiêu đề/hover. Có thể chuyển về **Lưới giờ** để xem lịch theo thời gian.
- Todo ba cấp vẫn có timeline nối các bước; thêm danh sách **Hôm nay / Sắp tới / Đã hoàn thành** và cột tổng quan/mốc cần chú ý theo format dự án mẫu.
- **Thời tiết cảm xúc** là nhật ký tâm trạng giống dự án mẫu, không phải dự báo khí tượng và không cần vị trí hay API thời tiết.
- Sáu trạng thái: Trời nắng, Có mây, Mưa nhẹ, Giông bão, Cầu vồng, Sương mù. Chọn nhanh hôm nay hoặc mở lịch tháng để chọn một ngày và thêm ghi chú (tối đa 4.000 ký tự).
- Lịch tháng bắt đầu từ Thứ 2, có dấu ghi chú, thống kê số ngày từng cảm xúc và cảm xúc ghi nhận nhiều nhất. Ngày chưa lưu không được tính vào thống kê.
- Với tài khoản Google, nhật ký đồng bộ Firestore qua `moodEntries/{uid}_{YYYY-MM-DD}` với ownerId, date, moodId, note, updatedAt. Mood/ghi chú riêng tư, không được chia sẻ khi chia sẻ lịch. Chế độ demo chỉ lưu trong phiên.

**Cần triển khai bản `firestore.rules` mới để tài khoản thật lưu được nhật ký cảm xúc:**

```bash
npx firebase login
npx firebase deploy --only firestore --project calendar-f3d1b
```

Đã kiểm thử bộ lịch tháng/thống kê và rules riêng tư bằng emulator. Cấu hình backend thật vẫn cần hoàn tất như mục Firebase Console bên dưới; không tự nhập dữ liệu hoặc tài khoản từ dự án mẫu.

## Thiết lập cần hoàn tất trong Firebase Console

Mã frontend và rules đã hoàn thiện, nhưng Firebase CLI trên máy chưa xác thực được nên chưa triển khai rules/indexes lên project thật và chưa xác minh cấu hình Google/Firestore của project.

1. Mở https://console.firebase.google.com/project/calendar-f3d1b/overview.
2. Authentication → Sign-in method → bật **Google**, chọn email hỗ trợ và lưu.
3. Authentication → Settings → Authorized domains → thêm `localhost` để chạy local. Thêm tên miền website nếu triển khai sau này.
4. Firestore Database → tạo database **(default)** ở chế độ production nếu chưa có. Không bật rules cho phép mọi người đọc/ghi.
5. Đăng nhập tài khoản có quyền project rồi triển khai rules và indexes:

```bash
npx firebase login
npx firebase deploy --only firestore --project calendar-f3d1b
```

Config web Firebase là cấu hình công khai, không phải khóa Admin/service-account. Quyền dữ liệu được bảo vệ bởi Authentication và `firestore.rules`. Không đưa service-account JSON, mật khẩu hay API secret vào frontend/Git.

Đăng nhập bằng hai tài khoản Google để kiểm tra lưu dữ liệu sau reload, chia sẻ, thu hồi quyền và dữ liệu riêng tư sau khi hoàn tất các bước trên.

## Dữ liệu Firestore

- `events/{id}`: lịch riêng của `ownerId`, thời gian ISO UTC, title, color, owner, timestamps.
- `tasks/{id}`: công việc riêng của `ownerId`, ngày `YYYY-MM-DD`, progress, details, color, timestamps và mảng steps. Mỗi công việc tối đa 30 bước.
- `profiles/{uid}`: displayName, email, photoURL, updatedAt.
- `calendarShares/{ownerUid}/viewers/{emailLowercase}`: ownerId, ownerName, viewerEmail, permission=`read`, createdAt.

Indexes cho truy vấn collection group `viewers` được định nghĩa trong `firestore.indexes.json`. Dữ liệu demo không được tự động ghi vào database. Thiết kế hiện tại đọc toàn bộ lịch/công việc của mỗi chủ tài khoản; nếu dữ liệu lớn, cần thêm phân trang và truy vấn theo khoảng ngày. Các bước được lưu cùng document công việc, nên chỉnh sửa đồng thời cùng một công việc dùng cơ chế lần lưu sau cùng.

## API lịch nhóm (tùy chọn)

Tạo `.env` rồi đặt `VITE_GROUP_CALENDAR_API_URL` thành URL API hỗ trợ CORS. API trả về mảng hoặc `{ "events": [...] }`, mỗi event có id, title, start, end và tùy chọn owner/color. start/end là ISO date-time có timezone. Không đặt secret/API token trong biến `VITE_*`. Nếu API cần secret, dùng backend proxy riêng.

Nếu chưa cấu hình API, tài khoản thật hiển thị thông báo; chỉ bản demo dùng lịch nhóm mẫu.

## Xem lịch và task của lớp từ Supabase

Chọn **Xem lịch & task lớp** trên thanh công cụ để mở bảng riêng bên dưới timeline. Chỉ khi mở mục này, ứng dụng mới đọc nguồn Supabase; có nút làm mới, chọn nhóm, loại mục và khoảng ngày. Nguồn đọc là `https://dafylvuvlknoebamxxvr.supabase.co`, dùng khóa publishable đã cung cấp. Có thể ghi đè bằng `VITE_CLASS_SUPABASE_URL` và `VITE_CLASS_SUPABASE_PUBLISHABLE_KEY` trong `.env`.

- `deadlines`: đọc id, title, due_date, link, type, group_id, assignee, color, item_kind.
- `item_kind=event`: lịch theo ngày; `item_kind=task`: công việc có ngày đến hạn.
- `groups`: chỉ đọc id/name để hiển thị bộ lọc và nhãn nhóm.
- Chỉ đọc các mục `type=general`; bỏ các mục nội bộ có tên bắt đầu `__`. Mặc định hiển thị mục chung không thuộc nhóm. Người dùng có thể chọn nhóm công khai khác.
- Không gửi dữ liệu/tokens Firebase sang Supabase, không ghi/sửa/xóa trên database lớp và không chuyển các mục lớp vào Firestore.
- Các mục từ nguồn này chưa có giờ bắt đầu/kết thúc, tiến độ hoặc bước con. Giao diện hiển thị ngày đúng dữ liệu và chi tiết/tài liệu gốc, không tạo giờ hoặc tiến độ giả.
- Lịch lớp dùng cùng tuần Thứ 2–Thứ 7 đang xem. Deadline ngoài tuần này (bao gồm Chủ nhật) có thể xem qua bộ lọc Từ hôm nay hoặc Tất cả ngày.

Khóa publishable chỉ hoạt động trong quyền SELECT/RLS của Supabase; nếu quyền đọc thay đổi, bảng lớp hiển thị lỗi riêng, còn planner cá nhân tiếp tục hoạt động. Không cần cài SDK Supabase để đọc REST API này.

Đã kiểm tra đọc thành công nguồn thật, phân trang, bộ lọc nhóm, loại mục, chi tiết/tài liệu và trường hợp lỗi. `npm test` chạy các kiểm thử bộ chuyển đổi/đọc nguồn lớp bằng dữ liệu giả, không ghi vào database thật.

## Kiểm thử

```bash
npm run build
npm run test:rules
npm audit --omit=dev
```

`test:rules` cần Java 21 trở lên và tải emulator ở lần chạy đầu. Kiểm thử dùng **demo-planner**, không đọc/ghi project thật: quyền chủ tài khoản, chặn truy cập trái phép, chống đổi ownerId, kiểm tra dữ liệu, chia sẻ chỉ đọc, thu hồi quyền và hồ sơ riêng tư. Mẫu GitHub Actions ở `docs/github-actions-check.yml.example`. Token GitHub hiện tại thiếu scope `workflow`, nên chưa bật Actions; muốn dùng, tạo file `.github/workflows/check.yml` từ mẫu bằng GitHub web hoặc tài khoản có quyền workflow.

Các phụ thuộc frontend có kết quả audit không phát hiện lỗ hổng ở lần kiểm tra hiện tại. Firebase CLI là công cụ dev và vẫn có cảnh báo từ một số phụ thuộc bắc cầu; không dùng `npm audit fix --force` để hạ SDK/công cụ mà chưa kiểm tra tương thích.

Dự án chỉ được đẩy lên GitHub theo yêu cầu; chưa triển khai website lên Vercel hay GitHub Pages.
