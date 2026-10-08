import { Capacitor, registerPlugin } from '@capacitor/core';
import {signInWithCredential,GoogleAuthProvider} from 'firebase/auth';
export const isAndroid = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
export const PlannerAndroid = registerPlugin('PlannerAndroid');

export async function googleLogin(auth, provider, popup) {
  if (!isAndroid) return popup(auth, provider);
  const { idToken } = await PlannerAndroid.googleSignIn();
  try { return await signInWithCredential(auth, GoogleAuthProvider.credential(idToken)); }
  catch (error) { await PlannerAndroid.clearSession().catch(() => {}); throw error; }
}
