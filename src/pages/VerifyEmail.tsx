import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { auth, db } from "../lib/firebase";
import { 
  applyActionCode, 
  sendEmailVerification, 
  onAuthStateChanged,
  verifyPasswordResetCode,
  confirmPasswordReset
} from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Sparkles, 
  ArrowRight, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff,
  AlertCircle
} from "lucide-react";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "expired" | "error" | "reset-password" | "reset-success">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  
  // Custom states for password resets
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const oobCode = searchParams.get("oobCode");
  const mode = searchParams.get("mode");

  useEffect(() => {
    // 1. Instantly check if user is already logged in and verified (Self-healing redirection logic)
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await user.reload();
        if (user.emailVerified) {
          setStatus("success");
          try {
            const userDocRef = doc(db, "users", user.uid);
            await updateDoc(userDocRef, { emailVerified: true });
          } catch (e) {
            console.warn("Failed to update firestore profile verification flag:", e);
          }
        }
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleAuthAction = async () => {
      if (!oobCode) {
        // Fallback: Check if current active login is already verified
        if (auth.currentUser) {
          await auth.currentUser.reload();
          if (auth.currentUser.emailVerified) {
            setStatus("success");
            try {
              const userDocRef = doc(db, "users", auth.currentUser.uid);
              await updateDoc(userDocRef, { emailVerified: true });
            } catch (e) {
              console.warn(e);
            }
            return;
          }
        }
        setStatus("error");
        setErrorMsg("Invalid action code or link. Please check your email and try again.");
        return;
      }

      if (mode === "verifyEmail") {
        try {
          await applyActionCode(auth, oobCode);
          setStatus("success");
          if (auth.currentUser) {
            await auth.currentUser.reload();
            try {
              const userDocRef = doc(db, "users", auth.currentUser.uid);
              await updateDoc(userDocRef, { emailVerified: true });
            } catch (e) {
              console.warn(e);
            }
          }
        } catch (err: any) {
          console.error("Verification error:", err);
          // Standard check: if currentUser is already verified, count as success!
          if (auth.currentUser) {
            await auth.currentUser.reload();
            if (auth.currentUser.emailVerified) {
              setStatus("success");
              return;
            }
          }

          if (err.code === "auth/expired-action-code") {
            setStatus("expired");
            setErrorMsg("This verification link has expired.");
          } else if (err.code === "auth/invalid-action-code") {
            setStatus("error");
            setErrorMsg("Your request to verify your email has expired or the link has already been used.");
          } else {
            setStatus("error");
            setErrorMsg("An unexpected error occurred during email verification. Please check your connection.");
          }
        }
      } else if (mode === "resetPassword") {
        try {
          const userEmail = await verifyPasswordResetCode(auth, oobCode);
          setEmail(userEmail);
          setStatus("reset-password");
        } catch (err: any) {
          console.error("Password reset code validation error:", err);
          if (err.code === "auth/expired-action-code") {
            setStatus("expired");
            setErrorMsg("This link has expired.");
          } else if (err.code === "auth/invalid-action-code") {
            setStatus("error");
            setErrorMsg("Your request to reset your password has expired or the link has already been used.");
          } else {
            setStatus("error");
            setErrorMsg("This password reset link is invalid or has expired.");
          }
        }
      } else {
        setStatus("error");
        setErrorMsg("Unknown actions mode. Please try requesting a new link from the login page.");
      }
    };

    handleAuthAction();
  }, [oobCode, mode]);

  const handleResend = async () => {
    if (!auth.currentUser) {
      navigate("/login");
      return;
    }
    setResending(true);
    try {
      const actionCodeSettings = {
        url: window.location.origin + '/verify-email',
        handleCodeInApp: true,
      };
      await sendEmailVerification(auth.currentUser, actionCodeSettings);
      setResent(true);
    } catch (err: any) {
      console.warn("Retrying native verification mail send without custom origin...", err);
      try {
        await sendEmailVerification(auth.currentUser);
        setResent(true);
      } catch (stdErr: any) {
        setErrorMsg("Could not resend verification email. Please try again later.");
      }
    } finally {
      setResending(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oobCode) return;
    
    if (newPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setResetLoading(true);
    setErrorMsg("");

    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setStatus("reset-success");
    } catch (err: any) {
      console.error("Password confirm error:", err);
      if (err.code === "auth/expired-action-code") {
        setStatus("expired");
        setErrorMsg("This link has expired.");
      } else {
        setErrorMsg(err.message || "Failed to update your password. Please try again.");
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-200/20 blur-[120px] rounded-full -mr-64 -mt-64" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-200/20 blur-[120px] rounded-full -ml-64 -mb-64" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[32px] shadow-2xl shadow-slate-200/60 p-10 text-center relative z-10 border border-white"
      >
        <AnimatePresence mode="wait">
          {status === "loading" && (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-black text-slate-900">Verifying Identity</h1>
                <p className="text-slate-500">Please wait while we secure your account...</p>
              </div>
            </motion.div>
          )}

          {status === "success" && (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              <div className="relative">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }}
                  className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-200"
                >
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </motion.div>
                <div className="absolute -top-2 -right-2">
                  <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                   <h1 className="text-3xl font-black text-slate-900 leading-tight">Congratulations!</h1>
                   <p className="text-lg font-bold text-emerald-600">Your email has been verified successfully. 🎉</p>
                </div>
                <p className="text-slate-500 leading-relaxed text-sm">
                  Your identity has been successfully confirmed. You now have full access to our professional ecosystem.
                </p>
              </div>

              <div className="space-y-4 bg-slate-50 rounded-2xl p-6 text-left">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 text-center">Your Premium Access Ready</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    "AI Resume Builder",
                    "ATS Optimizer",
                    "Smart Templates",
                    "Expert Feedback"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm font-bold text-slate-600">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => navigate("/login")}
                className="w-full h-16 bg-slate-950 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all hover:shadow-xl hover:shadow-indigo-500/20 active:scale-95 group"
              >
                Login to SmartResume AI
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          )}

          {status === "expired" && (
            <motion.div 
              key="expired"
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mx-auto border-2 border-amber-100 animate-bounce">
                <AlertCircle className="w-12 h-12 text-amber-500" />
              </div>

              <div className="space-y-3">
                <h1 className="text-2xl font-black text-slate-900">Expired link</h1>
                <p className="text-slate-500 leading-relaxed text-sm">
                  {errorMsg || "This link has expired."}
                </p>
              </div>

              <div className="space-y-4 pt-4">
                {mode === "verifyEmail" && (
                  resent ? (
                    <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      New verification link sent!
                    </div>
                  ) : (
                    <button 
                      onClick={handleResend}
                      disabled={resending}
                      className="w-full h-14 bg-white border-2 border-slate-200 text-slate-900 rounded-xl font-bold flex items-center justify-center gap-3 hover:border-indigo-600 hover:text-indigo-600 transition-all disabled:opacity-50"
                    >
                      {resending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
                      Resend Verification Email
                    </button>
                  )
                )}
                
                <Link 
                  to="/login"
                  className="block w-full h-14 bg-slate-950 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-95 text-center text-sm"
                >
                  Back to Login
                </Link>
              </div>
            </motion.div>
          )}

          {status === "error" && (
            <motion.div 
              key="error"
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto border-2 border-red-100">
                <XCircle className="w-12 h-12 text-red-500" />
              </div>

              <div className="space-y-3">
                <h1 className="text-2xl font-black text-slate-900">Action Failed</h1>
                <p className="text-slate-500 leading-relaxed text-sm">
                  {errorMsg}
                </p>
              </div>

              <div className="space-y-4 pt-4">
                {mode === "verifyEmail" && (
                  resent ? (
                    <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      New verification link sent!
                    </div>
                  ) : (
                    <button 
                      onClick={handleResend}
                      disabled={resending}
                      className="w-full h-14 bg-white border-2 border-slate-200 text-slate-900 rounded-xl font-bold flex items-center justify-center gap-3 hover:border-indigo-600 hover:text-indigo-600 transition-all disabled:opacity-50"
                    >
                      {resending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
                      Resend Verification Email
                    </button>
                  )
                )}
                
                <Link 
                  to="/login"
                  className="block w-full h-14 bg-slate-950 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-95 text-center text-sm"
                >
                  Back to Login
                </Link>
              </div>
            </motion.div>
          )}

          {status === "reset-password" && (
            <motion.div 
              key="reset-password"
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6 text-left"
            >
              <div className="text-center">
                <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-10 h-10 text-indigo-600" />
                </div>
                <h1 className="text-2xl font-black text-slate-900 leading-tight">Reset Password</h1>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-1">{email}</p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-1.5 flex flex-col">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">New Password</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required
                      placeholder="At least 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 py-4 pl-6 pr-12 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-sm font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 flex flex-col">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Confirm Password</label>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 py-4 px-6 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-sm font-bold"
                  />
                </div>

                {errorMsg && (
                  <div className="p-4 bg-red-50 text-red-700 border border-red-100 rounded-2xl text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {errorMsg}
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={resetLoading}
                  className="w-full h-14 bg-indigo-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-indigo-100"
                >
                  {resetLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Update Password"}
                </button>
              </form>

              <div className="text-center pt-2">
                <Link 
                  to="/login"
                  className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
                >
                  Cancel and Back to Login
                </Link>
              </div>
            </motion.div>
          )}

          {status === "reset-success" && (
            <motion.div 
              key="reset-success"
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-200">
                <CheckCircle2 className="w-12 h-12 text-white" />
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl font-black text-slate-900 leading-tight">Done!</h1>
                <p className="text-lg font-bold text-emerald-600">Your password has been updated successfully. ✨</p>
                <p className="text-slate-500 text-sm leading-relaxed">
                  You can now log in to your account with your newly updated password security credentials.
                </p>
              </div>

              <Link 
                to="/login"
                className="block w-full h-16 bg-slate-950 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all hover:shadow-xl hover:shadow-indigo-500/20 active:scale-95 group"
              >
                Back to Login
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
