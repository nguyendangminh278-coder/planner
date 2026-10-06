# Planner

Website: **https://nguyendangminh278-coder.github.io/planner/**
Mã nguồn: https://github.com/nguyendangminh278-coder/planner (public).

Ứng dụng React + Vite với giao diện pastel, dùng Firebase project `calendar-f3d1b`.

## Mở ứng dụng bằng một lần bấm

Bấm đúp **start-planner.cmd** trong thư mục dự án. Script khởi động máy chủ Vite và tự mở đúng địa chỉ trong trình duyệt; giữ cửa sổ đó đang chạy khi sử dụng Planner. Có thể chạy `npm run start` với kết quả tương tự. Nếu cổng 5173 đang bận, Vite chọn cổng tiếp theo và mở đúng URL đó.

Đừng mở trực tiếp `index.html` bằng `file://`: đây là mã nguồn React/JSX, cần máy chủ Vite hoặc bản build được phục vụ qua HTTP. Trang HTML hiện có thông báo hướng dẫn thay cho màn hình trắng nếu mở trực tiếp.

Chọn **Khám phá bản demo** để xem ngay bố cục lịch tuần, timeline công việc và các bước. Đăng nhập Google để sử dụng dữ liệu Firebase riêng của bạn. Google sign-in và database mặc định đã được cấu hình trên project đã cung cấp.

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
- Ô tròn bên trái đánh dấu hoàn thành/bỏ hoàn thành; công việc hoàn thành vẫn ở danh sách với chữ xám gạch ngang. Nút thùng rác đỏ bên phải xóa công việc và các bước sau khi xác nhận.
- Chia sẻ toàn bộ lịch và công việc ba cấp theo email Google đã xác minh, gồm các bước và ghi chú. Người nhận chọn chủ lịch để xem riêng, với quyền chỉ đọc. Có thể thu hồi quyền xem.
- Hồ sơ người dùng chỉ chủ tài khoản truy cập được.
- Firebase Analytics với measurement ID đã cung cấp; không làm gián đoạn ứng dụng khi trình duyệt không hỗ trợ hoặc chặn analytics.
- Chế độ demo tách riêng khỏi dữ liệu thật. Thay đổi demo chỉ tồn tại trong phiên hiện tại.
- Lịch tuần Thứ 2–Thứ 7, có thể bật Chủ nhật, hiển thị 24 giờ; cuộn mặc định đến 08:00.
- Lịch cả ngày/nhiều ngày và lịch lặp theo ngày, tuần, tháng, năm với thời điểm kết thúc tùy chỉnh.
- Lịch nhóm từ API tùy chọn, có kiểm tra phản hồi và thông báo lỗi.

## Lặp lại lịch

Trong **Thêm lịch / Sửa lịch**, menu **Lặp lại** có Không lặp lại, Hằng ngày, Hằng tuần vào thứ đang chọn, Hằng tháng vào thứ thứ n của tháng, Hằng năm và Mọi ngày trong tuần (T2–T6).

Chọn **Tùy chỉnh…** để đặt khoảng lặp 1–99 ngày/tuần/tháng/năm, chọn nhiều thứ T2–CN nếu lặp theo tuần, hoặc chọn ngày trong tháng / thứ thứ n nếu lặp theo tháng. Kết thúc **Không bao giờ**, **Vào ngày** (bao gồm ngày đó) hoặc **Sau** 1–1.000 lần xuất hiện. Số lần tính từ lần xuất hiện đầu tiên khớp quy tắc, không khởi động lại khi chuyển tuần.

Mỗi chuỗi lưu một document Firestore, cùng `timeZone` IANA và map `recurrence`; ứng dụng chỉ dựng các lần xuất hiện thuộc tuần đang xem bằng RRule. Giờ lặp giữ theo múi giờ lúc tạo, kể cả khi đổi giờ mùa hè. Ngày 31 và ngày 29/2 bỏ qua tháng/năm không có ngày đó. Thứ thứ năm của tháng chỉ xuất hiện ở tháng có lần thứ năm đó.

**Cả ngày** có ngày kết thúc bao gồm ngày đang chọn; dữ liệu lưu mốc kết thúc ở đầu ngày kế tiếp. Lịch cả ngày giữ cùng ngày lịch khi người xem ở múi giờ khác. **Hiện Chủ nhật** thêm cột thứ bảy của tuần; tự bật khi lưu lịch bắt đầu hoặc lặp vào Chủ nhật.

Lịch lặp xuất hiện trong cả hai kiểu xem và planner được chia sẻ. Đối chiếu và khoảng trống chung tính cả từng lần lặp và lịch cả ngày. Sửa/xóa từ bất kỳ lần xuất hiện nào hiện áp dụng cho **toàn bộ chuỗi**; chưa hỗ trợ ngoại lệ cho một lần riêng lẻ.

## Hoàn thành và xóa công việc

**Việc đang chạy** có nút **Timeline / Lưới giờ**; **Việc cần làm** có **Danh sách / Lưới giờ**, áp dụng cùng bộ lọc Hôm nay/Sắp tới/Đã hoàn thành. Lưới giữ màu từng ngày như lịch tuần, mặc định cuộn tới 08:00, hỗ trợ Chủ nhật khi bật cột đó. Chọn **Công việc**, **Các bước** hoặc **Công việc & các bước** trong lưới. Mục cả ngày ở hàng trên; mục có giờ nằm đúng ngày/giờ của người xem, được chia khi qua đêm. Các mục trùng giờ có cột riêng; có thể mở chi tiết và tích hoàn thành ngay trong lưới.

Danh sách và timeline có vùng cuộn riêng, tối đa năm công việc trong khung và cao tối đa 520px. Tất cả công việc vẫn có trong danh sách; cuộn lên/xuống để xem tiếp, dùng Tab rồi phím mũi tên/Page Up/Page Down để cuộn bằng bàn phím. Mở các bước vẫn được giữ trong vùng cuộn. Lưới giờ có chiều cao giới hạn và cuộn theo giờ; danh sách cả ngày cũng cuộn khi dài.

Trong **Thêm/Cập nhật công việc**, chọn ngày bắt đầu–kết thúc và **Cả ngày** hoặc bỏ tích để nhập **Từ giờ / Đến giờ**. Mỗi bước cũng có lựa chọn riêng. Múi giờ áp dụng cho cả công việc và các bước. Ngày kết thúc của mục cả ngày được tính bao gồm ngày đó; mục có giờ dùng đúng mốc bắt đầu và kết thúc đã chọn, kể cả khi qua đêm/nhiều ngày. Nếu qua đêm, chọn ngày kết thúc là ngày hôm sau.

Mốc thời gian xuất hiện trên **Việc cần làm**, các bước, nhãn và thanh timeline **Việc đang chạy**, cùng chi tiết planner được chia sẻ. Bước cần nằm trọn trong thời gian công việc; một bước cả ngày không thể nằm trong công việc chỉ dài vài giờ. Giờ lưu ở `startTime` / `endTime` (HH:mm), cùng `allDay` và `timeZone`; ngày `start` / `end` vẫn giữ định dạng YYYY-MM-DD. Công việc cũ mặc định cả ngày và tiếp tục dùng được. Đánh dấu hoàn thành/bỏ hoàn thành vẫn giữ các mốc giờ.

Trong **Việc cần làm**, mỗi công việc có danh sách các bước với ô tròn riêng. Tích một bước đặt tiến độ bước ở 100%, chữ gạch ngang màu xám và giữ bước trên danh sách. Tiến độ công việc cập nhật theo trung bình tiến độ các bước; chỉ khi mọi bước đều xong mới đạt 100%. Bỏ tích một bước khôi phục tiến độ cũ của bước và đưa công việc về chưa hoàn thành. Có thể thu gọn danh sách bằng dòng số bước hoàn thành.

Ô tròn của **công việc** hoàn thành luôn toàn bộ các bước. Bấm lại để khôi phục trạng thái trước đó; bước đã hoàn thành trước lần tích cả công việc vẫn giữ nguyên. Các ghi chú/nội dung bậc 3 được giữ lại. Công việc vẫn ở tab Hôm nay/Sắp tới theo ngày bắt đầu, có chữ xám gạch ngang và cũng xuất hiện trong tab Đã hoàn thành.

Các ô tích cũng có ở timeline và bảng chi tiết. Danh sách/timeline lưu ngay vào Firebase; trong bảng chỉnh sửa, bấm **Lưu cập nhật** để lưu cùng nội dung đang chỉnh sửa. Khi có bước, ô tiến độ công việc được tính theo bước; công việc không có bước vẫn có thể nhập tiến độ riêng. Checkbox dùng transaction trên document mới nhất để hai thao tác ở các bước khác nhau không ghi đè nhau. Người xem lịch chia sẻ chỉ đọc trạng thái.

Nút thùng rác đỏ mở xác nhận xóa. Xác nhận sẽ xóa document công việc cùng các bước/ghi chú khỏi Firestore và loại bỏ khỏi danh sách, timeline và tổng quan. Khi xem planner được chia sẻ, người nhận chỉ xem trạng thái; không có quyền tích hoặc xóa.

Task trong **Lịch & công việc của lớp** có cùng hai nút ở cả bảng tuần và danh sách deadline. Hoàn thành giữ task với chữ xám gạch ngang; xóa chỉ bỏ khỏi Planner của tài khoản hiện tại, theo lựa chọn của chủ dự án. Trạng thái lưu riêng trong `profiles/{uid}/classTaskStates/{class:id}` (sourceId, completed, deleted, updatedAt), đồng bộ Firebase giữa các thiết bị và còn sau khi làm mới/mở lại. Supabase tiếp tục chỉ được đọc, dữ liệu chung của lớp không bị sửa/xóa. Trạng thái riêng này không nằm trong quyền chia sẻ planner. Bản demo lưu trạng thái trong phiên và không ghi Firebase.

## Giao diện và thời tiết cảm xúc từ todolist-main

Bố cục, font Nunito, nền slate nhạt, điểm nhấn cyan và màu cột ngày được chuyển từ dự án `C:\Users\Admin\OneDrive\Pictures\todolist-main\todolist-main`. Thứ 2–Thứ 7 lần lượt dùng rose, orange, amber, emerald, cyan, indigo. Chọn màu cho lịch, công việc và từng bước trong biểu mẫu chỉnh sửa.

- Mặc định xem lịch theo cột ngày, mở rộng cột bằng nút tiêu đề/hover. Có thể chuyển về **Lưới giờ** để xem lịch theo thời gian.
- Todo ba cấp vẫn có timeline nối các bước; thêm danh sách **Hôm nay / Sắp tới / Đã hoàn thành** và cột tổng quan/mốc cần chú ý theo format dự án mẫu.
- **Thời tiết cảm xúc** là nhật ký tâm trạng giống dự án mẫu, không phải dự báo khí tượng và không cần vị trí hay API thời tiết.
- Sáu trạng thái: Trời nắng, Có mây, Mưa nhẹ, Giông bão, Cầu vồng, Sương mù. Chọn nhanh hôm nay hoặc mở lịch tháng để chọn một ngày và thêm ghi chú (tối đa 4.000 ký tự).
- Lịch tháng bắt đầu từ Thứ 2, có dấu ghi chú, thống kê số ngày từng cảm xúc và cảm xúc ghi nhận nhiều nhất. Ngày chưa lưu không được tính vào thống kê.
- Với tài khoản Google, nhật ký đồng bộ Firestore qua `moodEntries/{uid}_{YYYY-MM-DD}` với ownerId, date, moodId, note, updatedAt. Mood/ghi chú riêng tư, không được chia sẻ khi chia sẻ lịch. Chế độ demo chỉ lưu trong phiên.

Rules cho nhật ký cảm xúc đã được áp dụng trên project thật. Khi thay đổi rules hoặc dùng project khác, triển khai lại bằng:

```bash
npx firebase login
npx firebase deploy --only firestore --project calendar-f3d1b
```

Đã kiểm thử bộ lịch tháng/thống kê và rules riêng tư bằng emulator. Backend thật đã được cấu hình trong Firebase Console; không tự nhập dữ liệu hoặc tài khoản từ dự án mẫu.

## Cấu hình Firebase hiện tại và hướng dẫn thiết lập lại

Đã khởi tạo Firebase Authentication, bật Google với tên public-facing Planner và cho phép `localhost`, `127.0.0.1`, `calendar-f3d1b.firebaseapp.com`, `calendar-f3d1b.web.app`, `nguyendangminh278-coder.github.io`. Đã tạo Firestore `(default)` Standard ở `asia-southeast1` (Singapore), production mode; áp dụng `firestore.rules` và cấu hình chỉ mục `viewers.viewerEmail` cho collection group.

Lỗi đăng nhập trước đó đã được xác định bằng API là `CONFIGURATION_NOT_FOUND`: project chưa có cấu hình Authentication/Google. Sau khi cấu hình, API đã tạo được URL Google và tài khoản người dùng đã đăng nhập Planner thành công. Firebase CLI vẫn chưa có phiên đăng nhập; cấu hình được thực hiện qua Firebase Console bằng tài khoản chủ dự án.

Các bước dưới đây dành cho việc thiết lập lại hoặc chuyển project:

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

## Xem planner người khác và tìm khoảng trống chung

1. Chủ planner chọn **Chia sẻ lịch & việc**, nhập email Google của người xem rồi cấp quyền.
2. Người nhận đăng nhập bằng đúng email đó, chọn tên chủ planner trong **Xem lịch của**.
3. Bảng lịch tuần, timeline, danh sách việc, tiến độ, các bước và ghi chú đều thuộc planner đang chọn. Người nhận chỉ xem; các thao tác tạo/sửa/xóa bị ẩn và Firestore cũng từ chối ghi lên dữ liệu người khác.
4. Mặc định xem riêng planner người đó. Bật **Đối chiếu với lịch của tôi** để hiển thị hai lịch cùng tuần: lịch của mình màu cyan, lịch người kia màu indigo. Lưới giờ chia hai cột nhỏ để hai nguồn không che nhau. Công việc vẫn hiển thị riêng theo chủ planner đang xem.
5. Mục **Cả hai cùng trống** lấy hợp các thời gian bận của hai lịch rồi tìm phần trống còn lại. Có thể chọn giờ bắt đầu/kết thúc và khoảng trống tối thiểu 15/30/60 phút; mặc định 08:00–18:00, ít nhất 30 phút.

Khoảng trống tính từ lịch cá nhân lưu trong Planner, gồm từng lần xuất hiện của lịch lặp và lịch cả ngày. Công việc kéo dài nhiều ngày không được coi là bận cả ngày; nguồn lịch lớp/API xem riêng không dùng để suy ra thời gian bận cá nhân. Chỉ hiển thị kết quả khi đã tải đủ hai lịch. Nếu dữ liệu lịch có thời gian hoặc cấu hình lặp không hợp lệ, hiển thị lỗi thay vì cho rằng cả hai đều trống.

Khi thu hồi quyền, người nhận không đọc được lịch/công việc nữa; giao diện ngừng hiển thị planner đã thu hồi và trở về planner của mình. Các tài khoản khác không có grant vẫn bị chặn. Nhật ký cảm xúc và hồ sơ tài khoản vẫn riêng tư. Grant hiện tại `permission=read` bao gồm lịch, công việc và nội dung trong các bước.

Chế độ demo có một planner Bùi Duy Tiến để thử xem riêng, đối chiếu, khoảng trống và công việc chỉ đọc; không ghi dữ liệu mẫu vào Firebase.

## Dữ liệu Firestore

- `events/{id}`: lịch riêng của `ownerId`, thời gian ISO UTC, title, color, owner, timestamps; tùy chọn allDay, timeZone và recurrence (frequency, interval, weekdays ISO 1–7, monthlyMode, endType, untilDate, count). Lịch cũ không có trường mới vẫn dùng được.
- `tasks/{id}`: công việc riêng của `ownerId`, ngày `YYYY-MM-DD`, allDay, startTime/endTime (HH:mm hoặc null khi cả ngày), timeZone, progress, previousProgress tùy chọn (để bỏ hoàn thành), details, color, timestamps và mảng steps có cùng mốc ngày/giờ. Mỗi công việc tối đa 30 bước.
- `profiles/{uid}`: displayName, email, photoURL, updatedAt.
- `profiles/{uid}/classTaskStates/{class:id}`: trạng thái hoàn thành/xóa task lớp của riêng tài khoản, không chia sẻ và không ghi sang nguồn lớp.
- `calendarShares/{ownerUid}/viewers/{emailLowercase}`: ownerId, ownerName, viewerEmail, permission=`read`, createdAt.

Indexes cho truy vấn collection group `viewers` được định nghĩa trong `firestore.indexes.json`. Dữ liệu demo không được tự động ghi vào database. Thiết kế hiện tại đọc toàn bộ lịch/công việc của mỗi chủ tài khoản; nếu dữ liệu lớn, cần thêm phân trang và truy vấn theo khoảng ngày. Các bước được lưu cùng document công việc. Dấu tích dùng transaction; chỉnh sửa toàn bộ biểu mẫu đồng thời cùng một công việc vẫn dùng cơ chế lần lưu sau cùng.

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
- Lịch lớp dùng cùng tuần đang xem, gồm Chủ nhật khi bật cột đó. Deadline ngoài tuần có thể xem qua bộ lọc Từ hôm nay hoặc Tất cả ngày.

Khóa publishable chỉ hoạt động trong quyền SELECT/RLS của Supabase; nếu quyền đọc thay đổi, bảng lớp hiển thị lỗi riêng, còn planner cá nhân tiếp tục hoạt động. Không cần cài SDK Supabase để đọc REST API này.

Đã kiểm tra đọc thành công nguồn thật, phân trang, bộ lọc nhóm, loại mục, chi tiết/tài liệu và trường hợp lỗi. `npm test` chạy các kiểm thử bộ chuyển đổi/đọc nguồn lớp bằng dữ liệu giả, không ghi vào database thật.

## Triển khai GitHub Pages

Repo đã được chuyển sang public theo xác nhận của chủ repo. GitHub Pages đã bật, dùng nhánh `codex/pages` và thư mục `/ (root)`, HTTPS được bật. Đã xác minh website trả HTTP 200, tải được giao diện và dữ liệu lớp từ Supabase.

Bản Pages được build riêng với đường dẫn nền `/planner/`, không dùng trực tiếp mã JSX trên nhánh main:

```bash
npm run build:pages
npm run preview:pages
```

Preview: `http://127.0.0.1:4174/planner/`. File tĩnh nằm trong `dist-pages/` và được bỏ qua trong nhánh mã nguồn. JavaScript, CSS và module lịch lớp đã được kiểm tra ở đúng đường dẫn này.

Cập nhật website sau khi sửa mã nguồn:

```bash
npm run publish:pages
```

Lệnh này build rồi đẩy các file tĩnh lên nhánh `codex/pages`, thêm `.nojekyll`. GitHub Settings → Pages → Deploy from a branch → chọn `codex/pages` và `/ (root)`. Cách này dùng bản build sẵn, không cần tạo workflow bằng token có scope `workflow`.

Website: `https://nguyendangminh278-coder.github.io/planner/`. Miền `nguyendangminh278-coder.github.io` đã được thêm vào Firebase Authentication → Authorized domains; API đã tạo được URL Google sign-in cho địa chỉ website này.

## Kiểm thử

```bash
npm run build
npm test
npm run test:rules
npm audit --omit=dev
```

`test:rules` cần Java 21 trở lên và tải emulator ở lần chạy đầu. Kiểm thử dùng **demo-planner**, không đọc/ghi project thật: quyền chủ tài khoản, chặn truy cập trái phép, chống đổi ownerId, kiểm tra dữ liệu, chia sẻ chỉ đọc, thu hồi quyền và hồ sơ riêng tư. Mẫu GitHub Actions ở `docs/github-actions-check.yml.example`. Token GitHub hiện tại thiếu scope `workflow`, nên chưa bật Actions; muốn dùng, tạo file `.github/workflows/check.yml` từ mẫu bằng GitHub web hoặc tài khoản có quyền workflow.

Các phụ thuộc frontend có kết quả audit không phát hiện lỗ hổng ở lần kiểm tra hiện tại. Firebase CLI là công cụ dev và vẫn có cảnh báo từ một số phụ thuộc bắc cầu; không dùng `npm audit fix --force` để hạ SDK/công cụ mà chưa kiểm tra tương thích.

Website đang chạy trên GitHub Pages: https://nguyendangminh278-coder.github.io/planner/. Repo mã nguồn public: https://github.com/nguyendangminh278-coder/planner. Có thể tiếp tục chạy local bằng `start-planner.cmd` hoặc `npm run start`.
