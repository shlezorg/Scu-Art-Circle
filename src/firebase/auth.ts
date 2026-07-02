import { 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail, 
  onAuthStateChanged,
  updatePassword,
  updateEmail
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from './config';

/**
 * Sign in an administrator using email and password.
 */
export async function signInAdmin(email: string, pass: string): Promise<User> {
  const userCredential = await signInWithEmailAndPassword(auth, email, pass);
  return userCredential.user;
}

/**
 * Sign out the current administrator.
 */
export async function signOutAdmin(): Promise<void> {
  await signOut(auth);
}

/**
 * Send a password recovery link to the given administrator email.
 */
export async function sendPasswordRecovery(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

/**
 * Update the logged-in administrator's password credentials.
 */
export async function changeAdminPassword(newPassword: string): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('AuthError: No active user session.');
  await updatePassword(currentUser, newPassword);
}

/**
 * Update the logged-in administrator's email profile.
 */
export async function changeAdminEmail(newEmail: string): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('AuthError: No active user session.');
  await updateEmail(currentUser, newEmail);
}

/**
 * Subscribe to authentication state changes.
 */
export function subscribeAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
