import { useEffect, useState } from 'react';
import { db, collection, query, where, onSnapshot, setDoc, doc, serverTimestamp, firebaseError } from './firebase';
import { validMoodEntry } from './mood';

export default function useMoodJournal(user, demo) {
  const [entries, setEntries] = useState({}), [ready, setReady] = useState(demo), [busy, setBusy] = useState(false), [error, setError] = useState('');
  useEffect(() => {
    if (demo || !user) { setReady(true); return; }
    return onSnapshot(query(collection(db, 'moodEntries'), where('ownerId', '==', user.uid)), snapshot => {
      setEntries(Object.fromEntries(snapshot.docs.map(d => d.data()).filter(entry => validMoodEntry(entry.date, entry.moodId, entry.note)).map(entry => [entry.date, entry])));
      setReady(true); setError('');
    }, err => { setReady(true); setError(firebaseError(err)); });
  }, [user, demo]);

  async function save(date, moodId, noteValue) {
    const note = noteValue === undefined ? entries[date]?.note || '' : noteValue;
    if (!validMoodEntry(date, moodId, note)) { setError('Chọn ngày, cảm xúc hợp lệ và ghi chú tối đa 4.000 ký tự.'); return false; }
    setBusy(true); setError('');
    try {
      if (demo) setEntries(current => ({ ...current, [date]: { date, moodId, note } }));
      else {
        if (!user) throw new Error('Sign in required');
        await setDoc(doc(db, 'moodEntries', `${user.uid}_${date}`), { ownerId: user.uid, date, moodId, note, updatedAt: serverTimestamp() });
        // Reflect the successful save even if the realtime listener is still catching up.
        setEntries(current => ({ ...current, [date]: { date, moodId, note } }));
      }
      return true;
    } catch (err) { setError(firebaseError(err)); return false; }
    finally { setBusy(false); }
  }
  return { entries, ready, busy, error, save };
}
