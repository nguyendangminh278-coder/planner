import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { db, collection, onSnapshot, setDoc, doc, deleteDoc, serverTimestamp, firebaseError } from '../lib/firebase';

export default function ShareModal({ user, demo, onClose }) {
  const [email, setEmail] = useState(''), [shares, setShares] = useState([]), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  useEffect(() => {
    if (demo || !user) return;
    return onSnapshot(collection(db, 'calendarShares', user.uid, 'viewers'), s => setShares(s.docs.map(d => ({ ...d.data(), id: d.id }))), err => setError(firebaseError(err)));
  }, [user, demo]);
  async function submit(e) {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (value === user.email?.toLowerCase()) return setError('Bạn đã có quyền xem lịch của mình.');
    if (!value || value.includes('/')) return setError('Email không hợp lệ.');
    setBusy(true); setError('');
    try {
      await setDoc(doc(db, 'calendarShares', user.uid, 'viewers', value), { ownerId: user.uid, ownerName: user.displayName || '', viewerEmail: value, permission: 'read', createdAt: serverTimestamp() });
      setEmail('');
    } catch (err) { setError(firebaseError(err)); } finally { setBusy(false); }
  }
  async function revoke(id) {
    if (!window.confirm(`Thu hồi quyền xem lịch của ${id}?`)) return;
    setBusy(true); setError('');
    try { await deleteDoc(doc(db, 'calendarShares', user.uid, 'viewers', id)); } catch (err) { setError(firebaseError(err)); } finally { setBusy(false); }
  }
  return <div className="modal-backdrop" onClick={() => !busy && onClose()}><section className="modal share-modal" role="dialog" aria-modal="true" aria-label="Chia sẻ lịch" onClick={e => e.stopPropagation()}>
    <button className="icon-btn close" aria-label="Đóng" onClick={onClose} disabled={busy}><X size={20}/></button><span className="eyebrow">CALENDAR SHARING</span><h2>Chia sẻ lịch</h2>
    <p>Người được chia sẻ có thể xem toàn bộ lịch của bạn khi đăng nhập Google bằng email này. Công việc và ghi chú vẫn riêng tư.</p>
    {demo ? <p className="notice">Đăng nhập Google để chia sẻ lịch thật.</p> : <><form onSubmit={submit}><label>Email người xem<input type="email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)}/></label><button className="primary-btn" disabled={busy}>{busy ? 'Đang lưu…' : 'Cho phép xem lịch'}</button></form>
      <ul className="share-list">{shares.map(share => <li key={share.id}><span>{share.viewerEmail}</span><button className="text-btn danger" disabled={busy} onClick={() => revoke(share.id)}>Thu hồi</button></li>)}</ul>{!shares.length && <small>Chưa chia sẻ với ai.</small>}</>}
    {error && <p className="error-message" role="alert">{error}</p>}
  </section></div>;
}
