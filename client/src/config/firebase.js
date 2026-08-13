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
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDemoKeyForSplitEaseApp12345",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "splitease-ai.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "splitease-ai",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "splitease-ai.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "528579819290",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:528579819290:web:splitease"
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
