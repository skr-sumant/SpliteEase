import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Sparkles, House, ShieldCheck, ArrowRight, Zap, CheckCircle2, AlertCircle } from "lucide-react";
import { syncFirebaseAuth } from "../services/api";
import { loginWithGoogleFirebase, loginWithGithubFirebase, checkRedirectAuthResult } from "../config/firebase";

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState("");
  const [message, setMessage] = useState("");
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  useEffect(() => {
    // Check if user is completing sign-in via redirect fallback (e.g. when popup is blocked)
    const handleRedirectResult = async () => {
      try {
        const redirectRes = await checkRedirectAuthResult();
        if (redirectRes && redirectRes.user) {
          setLoading(true);
          setMessage("Completing sign in...");
          const { user, provider } = redirectRes;
          const syncRes = await syncFirebaseAuth({
            email: user.email || `${user.uid}@firebase.user`,
            name: user.displayName || user.email?.split("@")[0] || "User",
            provider: provider || "google",
            providerId: user.uid,
            avatar: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.email || user.uid)}`
          });

          if (syncRes.data && syncRes.data.token) {
            localStorage.setItem("token", syncRes.data.token);
            if (syncRes.data.user) {
              localStorage.setItem("user_details", JSON.stringify(syncRes.data.user));
            }
            navigate("/dashboard");
            return;
          }
        }
      } catch (err) {
        console.error("Firebase redirect result handling failed:", err);
      }
    };

    handleRedirectResult();

    // Auto-redirect if there's an existing token
    const existingToken = localStorage.getItem("token");
    if (existingToken) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleSocialAuth = async (providerType) => {
    setLoading(true);
    setLoadingProvider(providerType);
    setMessage("");

    try {
      let result;
      if (providerType === "google") {
        result = await loginWithGoogleFirebase();
      } else {
        result = await loginWithGithubFirebase();
      }

      if (result && result.redirecting) {
        setMessage("Popup was blocked by your browser. Redirecting to provider login...");
        return;
      }

      if (!result || !result.user) {
        setMessage("Sign in failed. Please try again.");
        return;
      }

      const { user } = result;

      // Synchronize authenticated Firebase user with backend MongoDB database
      const syncRes = await syncFirebaseAuth({
        email: user.email || `${user.uid}@firebase.user`,
        name: user.displayName || user.email?.split("@")[0] || "User",
        provider: providerType,
        providerId: user.uid,
        avatar: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.email || user.uid)}`
      });

      if (syncRes.data && syncRes.data.token) {
        localStorage.setItem("token", syncRes.data.token);
        if (syncRes.data.user) {
          localStorage.setItem("user_details", JSON.stringify(syncRes.data.user));
        }
        navigate("/dashboard");
      } else {
        setMessage("Authentication succeeded but backend synchronization failed.");
      }
    } catch (error) {
      console.error(`Firebase ${providerType} Auth Error:`, error);

      const errCode = error.code || "";
      if (errCode === "auth/popup-blocked") {
        setMessage("Popup blocked by browser. Please allow popups for this domain or wait while we redirect you.");
      } else if (errCode === "auth/popup-closed-by-user" || error.message?.includes("closed")) {
        setMessage("Sign-in popup was closed before completing.");
      } else if (errCode === "auth/unauthorized-domain") {
        setMessage(`Domain (${window.location.hostname}) is not authorized in Firebase Console -> Authentication -> Settings -> Authorized Domains.`);
        setShowSetupGuide(true);
      } else if (errCode === "auth/operation-not-allowed") {
        setMessage(`${providerType === "google" ? "Google" : "GitHub"} sign-in is not enabled in your Firebase Auth Console yet.`);
        setShowSetupGuide(true);
      } else if (errCode === "auth/invalid-api-key" || errCode === "auth/api-key-not-valid") {
        setMessage("Firebase API Key in client environment variables is invalid.");
        setShowSetupGuide(true);
      } else {
        setMessage(error.message || `${providerType} sign in failed.`);
      }
    } finally {
      setLoading(false);
      setLoadingProvider("");
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7FF] text-[#27187E] relative overflow-hidden flex flex-col items-center justify-center p-4">
      {/* Background aesthetics */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:16px_24px] pointer-events-none" />
      <div className="absolute top-0 -left-40 w-96 h-96 bg-indigo-200/40 rounded-full blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-violet-200/40 rounded-full blur-3xl opacity-50 pointer-events-none" />

      {/* Top Navbar Back Link */}
      <Link
        to="/"
        className="absolute left-6 top-6 inline-flex items-center gap-2 text-sm font-bold text-[#27187E] hover:text-[#5C4BD6] transition no-underline z-20"
      >
        <House className="h-4 w-4" />
        Back to Home
      </Link>

      <div className="w-full max-w-md relative z-10 animate-fadeIn">
        {/* Main Authentication Card */}
        <div className="rounded-3xl border border-[#27187E]/15 bg-white p-7 md:p-9 shadow-[0_28px_70px_rgba(39,24,126,0.12)] flex flex-col gap-6">

          {/* Header */}
          <div className="flex flex-col items-center text-center gap-2">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#27187E] to-[#758BFD] text-white shadow-lg shadow-[#27187E]/20 mb-1">
              <Sparkles className="h-6 w-6 animate-pulse" />
            </span>
            <h1 className="m-0 text-2xl font-black tracking-tight text-[#27187E]">
              Welcome to Split<span className="text-[#758BFD]">Ease</span>
            </h1>

          </div>

          {/* Alert Message */}
          {message && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-2xl flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="flex-1">{message}</div>
            </div>
          )}

          {/* Social Sign-In Buttons */}
          <div className="flex flex-col gap-3.5 my-2">
            {/* Google Firebase Sign In */}
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSocialAuth("google")}
              className="h-13 w-full rounded-2xl border-2 border-gray-100 bg-white hover:bg-gray-50 hover:border-indigo-200 text-sm font-black text-[#27187E] transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer shadow-sm active:scale-[0.98] disabled:opacity-60"
            >
              {loadingProvider === "google" ? (
                <span className="text-xs font-bold text-gray-400">Connecting to Google...</span>
              ) : (
                <>
                  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" width="24" height="24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            {/* GitHub Firebase Sign In */}
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSocialAuth("github")}
              className="h-13 w-full rounded-2xl border-2 border-gray-900 bg-[#111827] hover:bg-black text-sm font-black text-white transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer shadow-md active:scale-[0.98] disabled:opacity-60"
            >
              {loadingProvider === "github" ? (
                <span className="text-xs font-bold text-gray-400">Connecting to GitHub...</span>
              ) : (
                <>
                  <svg className="h-5 w-5 shrink-0 fill-white" viewBox="0 0 24 24" width="24" height="24">
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                  </svg>
                  <span>Continue with GitHub</span>
                </>
              )}
            </button>




          </div>

          {/* Security Features Badges */}
          <div className="flex flex-col gap-2 bg-[#F8F9FA] p-3.5 rounded-2xl border border-gray-100 mt-1">
            <div className="flex items-center gap-2 text-[11px] font-bold text-[#27187E]">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Firebase Auth 256-bit Encrypted Token Verification</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-bold text-[#27187E]">
              <Zap className="h-4 w-4 text-amber-500 shrink-0" />
              <span>Instant 1-Click Access — No passwords to remember!</span>
            </div>
          </div>




        </div>
      </div>
    </div>
  );
};

export default Auth;
