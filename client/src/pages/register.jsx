import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { BadgeCheck, Eye, EyeOff, House, ArrowRight, Smartphone, Coins } from "lucide-react";
import { getOAuthUrl, loginUser, registerUser, forgotPassword, resetPassword, updateProfile } from "../services/api";

const getOAuthTokenFromUrl = () => {
  return new URLSearchParams(window.location.search).get("token");
};

const getOAuthErrorFromUrl = () => {
  return new URLSearchParams(window.location.search).get("error");
};

const Auth = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("signin");
  const [message, setMessage] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);

  // Forgot Password / OTP Recovery State
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState("email"); // "email" (send OTP), "otp" (verify & reset)

  // Ask Details State
  const [showDetails, setShowDetails] = useState(false);
  const [phone, setPhone] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [bio, setBio] = useState("");

  useEffect(() => {
    const oauthToken = getOAuthTokenFromUrl();
    const oauthError = getOAuthErrorFromUrl();

    // Handle OAuth error redirect
    if (oauthError) {
      setMessage(oauthError);
      window.history.replaceState({}, "", "/auth");
      return;
    }

    // Handle OAuth success redirect
    if (oauthToken) {
      localStorage.setItem("token", oauthToken);
      window.history.replaceState({}, "", "/auth");
      navigate("/dashboard");
      return;
    }

    // Only auto-redirect if there's an existing token and no OAuth flow happening
    const existingToken = localStorage.getItem("token");
    if (existingToken) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleSignUp = async (e) => {
    e.preventDefault();

    if (!email || !password || !fullName) {
      setMessage("Please fill in all fields.");
      return;
    }

    // Front-end password check: min 8 chars, 1 num, 1 upper, 1 lower, 1 special char
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!passwordRegex.test(password)) {
      setMessage("Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&#).");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await registerUser({
        name: fullName,
        email,
        password
      });

      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        setShowDetails(true); // Switch to asking basic details!
      } else {
        setMessage(res.data.message || "Account created successfully.");
      }
    } catch (error) {
      setMessage(error.response?.data?.message || "Sign up failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setMessage("Please enter your email and password.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await loginUser({
        email,
        password
      });

      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        navigate("/dashboard"); // Redirect to Dashboard
      } else {
        setMessage(res.data.message || "Signed in successfully.");
      }
    } catch (error) {
      setMessage(error.response?.data?.message || "Sign in failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      setMessage("Please enter your email address.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await forgotPassword(email);
      setMessage(res.data.message || "OTP code sent to email!");
      setStep("otp");
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to send reset code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!email || !otp || !newPassword) {
      setMessage("Please fill in all fields.");
      return;
    }

    // Front-end complexity check
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setMessage("Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&#).");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await resetPassword(email, otp, newPassword);
      setMessage("Password reset successfully! Redirecting to sign in...");
      setTimeout(() => {
        setShowForgotPassword(false);
        setStep("email");
        setOtp("");
        setNewPassword("");
        setMessage("");
      }, 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || "Password reset failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleDetailsSubmit = async (e) => {
    e.preventDefault();
    if (phone.length !== 10) {
      setMessage("Mobile number must be exactly 10 digits.");
      return;
    }
    
    setLoading(true);
    setMessage("");
    try {
      // Save details to the backend database!
      await updateProfile({ phone, currency, bio });
      localStorage.setItem("user_details", JSON.stringify({ phone, currency, bio }));
      navigate("/dashboard"); // Redirect to Dashboard after setup!
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to complete profile setup.");
    } finally {
      setLoading(false);
    }
  };

  const selectTab = (tab) => {
    setActiveTab(tab);
    setShowForgotPassword(false);
    setMessage("");
  };

  const handleOAuth = (provider) => {
    window.location.href = getOAuthUrl(provider);
  };

  return (
    <div className="h-screen max-h-screen bg-[#F7F7FF] text-[#27187E] relative overflow-hidden flex flex-col items-center justify-center">
      {/* Decorative blurs */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
      <div className="absolute top-0 -left-40 w-96 h-96 bg-indigo-200/40 rounded-full blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-violet-200/40 rounded-full blur-3xl opacity-50 pointer-events-none" />

      <Link
        to="/"
        className="absolute left-8 top-5 inline-flex items-center gap-2 text-[15px] font-bold text-[#27187E] no-underline transition hover:text-[#5C4BD6] z-20"
      >
        <House className="h-4 w-4" aria-hidden="true" />
        Home
      </Link>

      <div className="flex h-full items-center justify-center px-4 py-0 w-full relative z-10 overflow-hidden">
        <div className="w-[min(100%,440px)] rounded-2xl border border-[#27187E]/15 bg-white px-6 py-5 shadow-[0_28px_70px_rgba(39,24,126,0.14)] max-sm:px-4 max-sm:py-4 transition-all duration-350">
          
          {showDetails ? (
            /* 🛠️ STEP 2: ASK BASIC DETAILS FOR REGISTRATION */
            <div className="flex flex-col gap-4 animate-fadeIn">
              <div className="text-center">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#758BFD]/10 text-[#27187E] mb-2">
                  <BadgeCheck className="h-4 w-4" />
                </span>
                <h1 className="m-0 text-xl font-black leading-tight text-[#27187E]">
                  Complete Your Profile
                </h1>
                <p className="mt-1 text-xs text-[#5C5783]">
                  A few details to personalize your experience
                </p>
              </div>

              <form onSubmit={handleDetailsSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block mb-1 text-[11px] font-extrabold uppercase tracking-wider text-[#5C5783]" htmlFor="phone">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5C5783]" />
                    <input
                      id="phone"
                      type="tel"
                      placeholder="10-digit Mobile Number"
                      value={phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        setPhone(val.slice(0, 10));
                      }}
                      pattern="\d{10}"
                      maxLength={10}
                      required
                      className="h-[42px] w-full rounded-lg border border-[#27187E]/20 bg-white pl-10 pr-3 text-sm font-medium text-[#27187E] outline-none focus:border-[#758BFD] transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-1 text-[11px] font-extrabold uppercase tracking-wider text-[#5C5783]" htmlFor="currency">
                    Default Currency
                  </label>
                  <div className="relative">
                    <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5C5783]" />
                    <select
                      id="currency"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="h-[42px] w-full rounded-lg border border-[#27187E]/20 bg-white pl-10 pr-3 text-sm font-extrabold text-[#27187E] outline-none focus:border-[#758BFD] transition cursor-pointer appearance-none"
                    >
                      <option value="INR">INR (₹) - Indian Rupee</option>
                      <option value="USD">USD ($) - US Dollar</option>
                      <option value="EUR">EUR (€) - Euro</option>
                      <option value="GBP">GBP (£) - British Pound</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block mb-1 text-[11px] font-extrabold uppercase tracking-wider text-[#5C5783]" htmlFor="bio">
                    Short Bio
                  </label>
                  <textarea
                    id="bio"
                    placeholder="e.g., Roommates sharing rent"
                    value={bio}
                    rows="2"
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full rounded-lg border border-[#27187E]/20 bg-white p-3 text-sm font-medium text-[#27187E] outline-none focus:border-[#758BFD] transition resize-none"
                  />
                </div>

                {message ? (
                  <p className="m-0 rounded-lg border border-[#27187E]/15 bg-[#F0EFFF] px-3 py-2 text-xs font-bold text-[#27187E]">
                    {message}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="h-[44px] w-full rounded-lg border-0 bg-gradient-to-r from-[#27187E] to-[#5C4BD6] text-sm font-extrabold text-[#F7F7FF] shadow-md shadow-[#27187E]/20 transition-all hover:bg-[#1F1368] cursor-pointer flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Completing Profile..." : "Continue to Dashboard"}
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </button>
              </form>
            </div>
          ) : (
            /* 🔐 STEP 1: GENERAL SIGN IN / SIGN UP */
            <>
              <div className="mb-4 text-center">
                <h1 className="m-0 text-xl font-black leading-tight text-[#27187E]">
                  SplitEase
                </h1>
                <p className="mt-1 text-sm leading-snug text-[#5C5783]">
                  Split bills with ease
                </p>
              </div>

              {showForgotPassword ? (
                <div className="flex flex-col gap-6">
                  <div className="text-center">
                    <h2 className="m-0 text-[22px] font-extrabold text-[#27187E]">
                      {step === "email" ? "Reset Password" : "Enter Verification OTP"}
                    </h2>
                    <p className="mt-2 text-[15px] text-[#5C5783]">
                      {step === "email" 
                        ? "Enter your email to receive a 6-digit verification code" 
                        : "Enter the OTP code sent to your inbox and set your new password"}
                    </p>
                  </div>

                  {step === "email" ? (
                    <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
                      <label className="block" htmlFor="reset-email">
                        <span className="mb-1 block text-[13px] font-extrabold text-[#27187E]">
                          Email
                        </span>
                        <input
                          id="reset-email"
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="h-[44px] w-full rounded-lg border border-[#27187E]/20 bg-white px-3 text-sm text-[#27187E] outline-none transition placeholder:text-[#7B75A7] focus:border-[#27187E]"
                        />
                      </label>

                      {message ? (
                        <p className="m-0 rounded-lg border border-[#27187E]/15 bg-[#F0EFFF] px-3 py-2 text-xs font-bold text-[#27187E]">
                          {message}
                        </p>
                      ) : null}

                      <button
                        type="submit"
                        className="h-[44px] w-full rounded-lg border-0 bg-[#27187E] text-sm font-extrabold text-[#F7F7FF] transition hover:bg-[#1F1368] disabled:cursor-not-allowed disabled:bg-[#9D98C5] cursor-pointer"
                        disabled={loading}
                      >
                        {loading ? "Sending OTP..." : "Send OTP"}
                      </button>

                      <button
                        type="button"
                        className="h-9 w-full rounded-lg border-0 bg-transparent text-[13px] font-bold text-[#27187E] transition hover:bg-[#F0EFFF] cursor-pointer"
                        onClick={() => {
                          setShowForgotPassword(false);
                          setMessage("");
                        }}
                      >
                        ← Back to Sign In
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleResetPasswordSubmit} className="flex flex-col gap-4">
                      <label className="block" htmlFor="otp">
                        <span className="mb-1 block text-[11px] font-extrabold uppercase tracking-wider text-[#5C5783]">
                          6-Digit OTP Code
                        </span>
                        <input
                          id="otp"
                          type="text"
                          maxLength={6}
                          placeholder="e.g. 123456"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          required
                          className="h-[44px] w-full rounded-lg border border-[#27187E]/20 bg-white px-3 text-base font-black tracking-widest text-[#27187E] outline-none focus:border-[#758BFD] transition"
                        />
                      </label>

                      <label className="block" htmlFor="new-password">
                        <span className="mb-1 block text-[11px] font-extrabold uppercase tracking-wider text-[#5C5783]">
                          New Secure Password
                        </span>
                        <input
                          id="new-password"
                          type="password"
                          placeholder="Enter secure password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          className="h-[44px] w-full rounded-lg border border-[#27187E]/20 bg-white px-3 text-sm font-medium text-[#27187E] outline-none focus:border-[#758BFD] transition"
                        />
                        <span className="text-[9px] text-gray-400 font-bold mt-0.5 block">
                          Uppercase, lowercase, number & special char required.
                        </span>
                      </label>

                      {message ? (
                        <p className="m-0 rounded-lg border border-[#27187E]/15 bg-[#F0EFFF] px-3 py-2 text-xs font-bold text-[#27187E]">
                          {message}
                        </p>
                      ) : null}

                      <button
                        type="submit"
                        className="h-[44px] w-full rounded-lg border-0 bg-gradient-to-r from-[#27187E] to-[#5C4BD6] text-xs font-extrabold text-white shadow-md shadow-[#27187E]/10 cursor-pointer hover:bg-[#1F1368] transition"
                        disabled={loading}
                      >
                        {loading ? "Verifying..." : "Verify OTP & Update Password"}
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          className="h-9 rounded-lg border-0 bg-transparent text-[11px] font-bold text-gray-400 hover:text-[#27187E] cursor-pointer transition"
                          onClick={() => {
                            setStep("email");
                            setOtp("");
                            setNewPassword("");
                            setMessage("");
                          }}
                        >
                          Resend OTP
                        </button>
                        <button
                          type="button"
                          className="h-9 rounded-lg border border-[#27187E]/15 bg-[#F7F7FF] text-[11px] font-bold text-[#27187E] hover:bg-[#ECEAFE] cursor-pointer transition"
                          onClick={() => {
                            setShowForgotPassword(false);
                            setStep("email");
                            setOtp("");
                            setNewPassword("");
                            setMessage("");
                          }}
                        >
                          ← Back to Sign In
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                <>
                  <div className="mb-3 grid grid-cols-2 rounded-lg bg-[#ECEAFE] p-1">
                    <button
                      type="button"
                      onClick={() => selectTab("signin")}
                      className={
                        activeTab === "signin"
                          ? "h-9 rounded-md border-0 bg-white text-sm font-bold text-[#27187E] shadow-sm transition cursor-pointer"
                          : "h-9 rounded-md border-0 bg-transparent text-sm font-bold text-[#5C5783] transition hover:text-[#27187E] cursor-pointer"
                      }
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => selectTab("signup")}
                      className={
                        activeTab === "signup"
                          ? "h-9 rounded-md border-0 bg-white text-sm font-bold text-[#27187E] shadow-sm transition cursor-pointer"
                          : "h-9 rounded-md border-0 bg-transparent text-sm font-bold text-[#5C5783] transition hover:text-[#27187E] cursor-pointer"
                      }
                    >
                      Sign Up
                    </button>
                  </div>

                  <div className="mb-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleOAuth("google")}
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[#27187E]/15 bg-white text-[12px] font-extrabold text-[#27187E] transition hover:border-[#27187E] hover:bg-[#F7F7FF] cursor-pointer"
                    >
                      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                      </svg>
                      Google
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOAuth("github")}
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[#27187E]/15 bg-white text-[12px] font-extrabold text-[#27187E] transition hover:border-[#27187E] hover:bg-[#F7F7FF] cursor-pointer"
                    >
                      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" width="24" height="24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                      </svg>
                      GitHub
                    </button>
                  </div>

                  <div className="mb-4 flex items-center gap-3 text-[11px] font-black uppercase text-[#7B75A7]">
                    <span className="h-px flex-1 bg-[#27187E]/15" />
                    Email
                    <span className="h-px flex-1 bg-[#27187E]/15" />
                  </div>

                  {activeTab === "signin" ? (
                    <form onSubmit={handleSignIn} className="flex flex-col gap-3">
                      <label className="block" htmlFor="signin-email">
                        <span className="mb-1 block text-[13px] font-extrabold text-[#27187E]">
                          Email
                        </span>
                        <input
                          id="signin-email"
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="h-[44px] w-full rounded-lg border border-[#27187E]/20 bg-white px-3 text-sm text-[#27187E] outline-none transition placeholder:text-[#7B75A7] focus:border-[#27187E]"
                        />
                      </label>

                      <label className="block" htmlFor="signin-password">
                        <span className="mb-1 block text-[13px] font-extrabold text-[#27187E]">
                          Password
                        </span>
                        <div className="relative">
                          <input
                            id="signin-password"
                            type={showSignInPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="h-[44px] w-full rounded-lg border border-[#27187E]/20 bg-white px-3 pr-11 text-sm text-[#27187E] outline-none transition placeholder:text-[#7B75A7] focus:border-[#27187E]"
                          />
                          <button
                            type="button"
                            className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md border-0 bg-transparent text-[#27187E] transition hover:bg-[#F0EFFF]"
                            onClick={() => setShowSignInPassword((visible) => !visible)}
                            aria-label={
                              showSignInPassword ? "Hide password" : "Show password"
                            }
                          >
                            {showSignInPassword ? (
                              <EyeOff className="h-4 w-4" aria-hidden="true" />
                            ) : (
                              <Eye className="h-4 w-4" aria-hidden="true" />
                            )}
                          </button>
                        </div>
                      </label>

                      {message ? (
                        <p className="m-0 rounded-lg border border-[#27187E]/15 bg-[#F0EFFF] px-3 py-2 text-xs font-bold text-[#27187E]">
                          {message}
                        </p>
                      ) : null}

                      <button
                        type="submit"
                        className="h-[44px] w-full rounded-lg border-0 bg-[#27187E] text-sm font-extrabold text-[#F7F7FF] transition hover:bg-[#1F1368] disabled:cursor-not-allowed disabled:bg-[#9D98C5] cursor-pointer"
                        disabled={loading}
                      >
                        {loading ? "Signing in..." : "Sign In"}
                      </button>

                      <button
                        type="button"
                        className="h-8 w-full rounded-lg border-0 bg-transparent text-[12px] font-bold text-[#27187E] transition hover:bg-[#F0EFFF] cursor-pointer"
                        onClick={() => {
                          setShowForgotPassword(true);
                          setMessage("");
                        }}
                      >
                        Forgot your password?
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleSignUp} className="flex flex-col gap-3">
                      <label className="block" htmlFor="signup-name">
                        <span className="mb-1 block text-[13px] font-extrabold text-[#27187E]">
                          Full Name
                        </span>
                        <input
                          id="signup-name"
                          type="text"
                          placeholder="Enter your full name"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                          className="h-[44px] w-full rounded-lg border border-[#27187E]/20 bg-white px-3 text-sm text-[#27187E] outline-none transition placeholder:text-[#7B75A7] focus:border-[#27187E]"
                        />
                      </label>

                      <label className="block" htmlFor="signup-email">
                        <span className="mb-1 block text-[13px] font-extrabold text-[#27187E]">
                          Email
                        </span>
                        <input
                          id="signup-email"
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="h-[44px] w-full rounded-lg border border-[#27187E]/20 bg-white px-3 text-sm text-[#27187E] outline-none transition placeholder:text-[#7B75A7] focus:border-[#27187E]"
                        />
                      </label>

                      <label className="block" htmlFor="signup-password">
                        <span className="mb-1 block text-[13px] font-extrabold text-[#27187E]">
                          Password
                        </span>
                        <div className="relative">
                          <input
                            id="signup-password"
                            type={showSignUpPassword ? "text" : "password"}
                            placeholder="Create a password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="h-[44px] w-full rounded-lg border border-[#27187E]/20 bg-white px-3 pr-11 text-sm text-[#27187E] outline-none transition placeholder:text-[#7B75A7] focus:border-[#27187E]"
                          />
                          <button
                            type="button"
                            className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md border-0 bg-transparent text-[#27187E] transition hover:bg-[#F0EFFF]"
                            onClick={() => setShowSignUpPassword((visible) => !visible)}
                            aria-label={
                              showSignUpPassword ? "Hide password" : "Show password"
                            }
                          >
                            {showSignUpPassword ? (
                              <EyeOff className="h-4 w-4" aria-hidden="true" />
                            ) : (
                              <Eye className="h-4 w-4" aria-hidden="true" />
                            )}
                          </button>
                        </div>
                      </label>

                      {message ? (
                        <p className="m-0 rounded-lg border border-[#27187E]/15 bg-[#F0EFFF] px-3 py-2 text-xs font-bold text-[#27187E]">
                          {message}
                        </p>
                      ) : null}

                      <button
                        type="submit"
                        className="h-[44px] w-full rounded-lg border-0 bg-[#27187E] text-sm font-extrabold text-[#F7F7FF] transition hover:bg-[#1F1368] disabled:cursor-not-allowed disabled:bg-[#9D98C5] cursor-pointer"
                        disabled={loading}
                      >
                        {loading ? "Creating account..." : "Sign Up"}
                      </button>
                    </form>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
