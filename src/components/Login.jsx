import { useState } from 'react';
import { CalendarDays, CheckCircle2, Users } from 'lucide-react';
import { auth, googleProvider, signInWithPopup, firebaseError } from '../lib/firebase';

export default function Login({ onDemo }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function login() {
    setBusy(true); setError('');
    try { await signInWithPopup(auth, googleProvider); }
    catch (err) { setError(firebaseError(err)); }
    finally { setBusy(false); }
  }
  return <div className="login-shell"><div className="login-art">
    <span className="blob blob-a"/><span className="blob blob-b"/><span className="blob blob-c"/>
    <div className="brand-mark">p</div><h1>Planner</h1>
    <p>Lịch tuần + todo phân cấp, đủ nhẹ để nhìn nhanh và đủ sâu để quản lý cả quy trình.</p>
    <div className="login-points"><span><CalendarDays size={18}/> Lịch Thứ 2 → Thứ 7</span><span><CheckCircle2 size={18}/> Công việc 3 tầng</span><span><Users size={18}/> Xem lịch chia sẻ & lịch nhóm</span></div>
    <button className="google-btn" onClick={login} disabled={busy}><span className="google-g">G</span>{busy ? 'Đang đăng nhập…' : 'Tiếp tục với Google'}</button>
    {error && <p className="error-message" role="alert">{error}</p>}
    <button className="text-btn demo-btn" onClick={onDemo} disabled={busy}>Khám phá bản demo</button>
    <small>Đăng nhập để lưu lịch và công việc vào tài khoản của bạn.</small>
  </div></div>;
}
