import { CalendarDays, CheckCircle2, Users } from 'lucide-react';
import { firebaseReady, auth, googleProvider, signInWithPopup } from '../lib/firebase';

export default function Login({ onDemo }) {
  const login = async () => {
    if (!firebaseReady) return onDemo();
    await signInWithPopup(auth, googleProvider);
  };
  return <div className="login-shell">
    <div className="login-art">
      <span className="blob blob-a"></span><span className="blob blob-b"></span><span className="blob blob-c"></span>
      <div className="brand-mark">p</div>
      <h1>Pastel Planner</h1>
      <p>Lịch tuần + todo phân cấp, đủ nhẹ để nhìn nhanh và đủ sâu để quản lý cả quy trình.</p>
      <div className="login-points">
        <span><CalendarDays size={18}/> Lịch Thứ 2 → Thứ 7</span>
        <span><CheckCircle2 size={18}/> Công việc 3 tầng</span>
        <span><Users size={18}/> Xem lịch chia sẻ & lịch nhóm</span>
      </div>
      <button className="google-btn" onClick={login}>
        <span className="google-g">G</span>{firebaseReady ? 'Tiếp tục với Google' : 'Mở bản demo (chưa cấu hình Firebase)'}
      </button>
      {!firebaseReady && <small>Điền Firebase config trong <b>.env</b> để bật đăng nhập Google thật.</small>}
    </div>
  </div>
}
