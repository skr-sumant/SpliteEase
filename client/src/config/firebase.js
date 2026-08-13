import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  GithubAuthProvider,
  signOut
} from "firebase/auth";

// Firebase Configuration from Vite Environment Variables (with fallbacks for production Vercel builds)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDPFabfpH5rhDaPX1Dry4q731EzAuriWQ4",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "sumant-s.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "sumant-s",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "sumant-s.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "184005723287",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:184005723287:web:6cfe76435b77c7a9fbd5d2"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth & Providers
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn("Firebase persistence configuration notice:", err);
});

export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();

// Firebase Auth Helper Functions for Social OAuth (Google & GitHub)
export const loginWithGoogleFirebase = async () => {
  try {
    const userCredential = await signInWithPopup(auth, googleProvider);
    const token = await userCredential.user.getIdToken();
    return { user: userCredential.user, token };
  } catch (error) {
    console.warn("Google popup login encountered error, falling back to redirect:", error);
    try {
      await signInWithRedirect(auth, googleProvider);
      return { redirecting: true };
    } catch (redirectErr) {
      throw error;
    }
  }
};

export const loginWithGithubFirebase = async () => {
  try {
    const userCredential = await signInWithPopup(auth, githubProvider);
    const token = await userCredential.user.getIdToken();
    return { user: userCredential.user, token };
  } catch (error) {
    console.warn("GitHub popup login encountered error, falling back to redirect:", error);
    try {
      await signInWithRedirect(auth, githubProvider);
      return { redirecting: true };
    } catch (redirectErr) {
      throw error;
    }
  }
};

export const checkRedirectAuthResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result && result.user) {
      const token = await result.user.getIdToken();
      const firstProvider = result.user.providerData?.[0]?.providerId || "";
      const provider = firstProvider.includes("google") ? "google" : firstProvider.includes("github") ? "github" : "google";
      return { user: result.user, token, provider };
    }
  } catch (error) {
    console.error("Firebase getRedirectResult error:", error);
  }
  return null;
};

export const logoutFirebase = async () => {
  await signOut(auth);
};

export default app;

