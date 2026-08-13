import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  signOut
} from "firebase/auth";

// Firebase Configuration from Vite Environment Variables (with fallback)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth & Providers
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();

// Firebase Auth Helper Functions for Social OAuth (Google & GitHub)
export const loginWithGoogleFirebase = async () => {
  const userCredential = await signInWithPopup(auth, googleProvider);
  const token = await userCredential.user.getIdToken();
  return { user: userCredential.user, token };
};

export const loginWithGithubFirebase = async () => {
  const userCredential = await signInWithPopup(auth, githubProvider);
  const token = await userCredential.user.getIdToken();
  return { user: userCredential.user, token };
};

export const logoutFirebase = async () => {
  await signOut(auth);
};

export default app;
