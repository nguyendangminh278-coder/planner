export const authSetupErrors = new Set(['auth/configuration-not-found', 'auth/operation-not-allowed', 'auth/unauthorized-domain', 'auth/app-not-authorized']);

export function firebaseError(error) {
  const code = (error?.code || '').replace('auth/', '').replace('firestore/', '');
  const messages = {
    'ANDROID_GOOGLE_SETUP': 'Bản Android cần được đăng ký trong Firebase với đúng package và SHA-1 của APK để đăng nhập Google.',
    'ANDROID_GOOGLE_AUTH': 'Đăng nhập Google trên Android chưa hoàn tất. Chọn tài khoản và thử lại; nếu vẫn lỗi, kiểm tra cấu hình Firebase của APK.',
    'configuration-not-found': 'Firebase chưa có cấu hình Authentication cho đăng nhập Google. Mở Firebase Console → Authentication → Get started, sau đó bật Google trong Sign-in method và lưu.',
    'popup-closed-by-user': 'Bạn đã đóng cửa sổ đăng nhập. Hãy thử lại.',
    'popup-blocked': 'Trình duyệt chặn cửa sổ đăng nhập. Hãy cho phép popup cho Planner rồi thử lại.',
    'cancelled-popup-request': 'Một cửa sổ đăng nhập khác đang mở.',
    'unauthorized-domain': 'Địa chỉ đang mở Planner chưa được cho phép đăng nhập. Thêm tên miền này vào Firebase Authentication → Settings → Authorized domains.',
    'operation-not-allowed': 'Google sign-in chưa được bật. Mở Firebase Authentication → Sign-in method → Google, bật Enable, chọn email hỗ trợ và lưu.',
    'app-not-authorized': 'Ứng dụng chưa được Firebase cho phép đăng nhập. Kiểm tra cấu hình web app, API key và Authorized domains.',
    'invalid-api-key': 'API key Firebase không hợp lệ. Kiểm tra lại cấu hình web app và các biến VITE_FIREBASE_*.',
    'web-storage-unsupported': 'Trình duyệt đang chặn bộ nhớ cần cho đăng nhập. Hãy cho phép cookie và bộ nhớ của website rồi thử lại.',
    'network-request-failed': 'Không kết nối được Firebase. Hãy kiểm tra mạng và thử lại.',
    'permission-denied': 'Không có quyền truy cập dữ liệu. Hãy kiểm tra tài khoản và triển khai firestore.rules.',
    'failed-precondition': 'Firestore chưa sẵn sàng. Hãy kiểm tra database và triển khai firestore.indexes.json.',
    'unavailable': 'Firebase đang không khả dụng. Hãy thử lại khi có kết nối.',
  };
  return messages[code] || 'Thao tác chưa thành công. Hãy thử lại.';
}
