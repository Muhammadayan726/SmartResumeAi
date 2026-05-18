import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { auth } from "../lib/firebase";
import { applyActionCode, sendEmailVerification } from "firebase/auth";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, XCircle, Loader2, Sparkles, ArrowRight, Mail } from "lucide-react";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const oobCode = searchParams.get("oobCode");
  const mode = searchParams.get("mode");

  useEffect(() => {
    const handleVerification = async () => {
      if (!oobCode || mode !== "verifyEmail") {
        setStatus("error");
        setErrorMsg("Invalid verification link. Please check your email for the correct link.");
        return;
      }

      try {
        await applyActionCode(auth, oobCode);
        setStatus("success");
      } catch (err: any) {
        setStatus("error");
        if (err.code === "auth/invalid-action-code") {
          setErrorMsg("This verification link is invalid or has already been used.");
        } else if (err.code === "auth/expired-action-code") {
          setErrorMsg("This verification link has expired.");
        } else {
          setErrorMsg("An unexpected error occurred during verification.");
        }
      }
    };

    handleVerification();
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
      setErrorMsg("Could not resend verification email. Please try again later.");
    } finally {
      setResending(false);
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
                   <h1 className="text-3xl font-black text-slate-900">Email Verified!</h1>
                   <p className="text-lg font-bold text-indigo-600">Welcome to SmartResume AI 🎉</p>
                </div>
                <p className="text-slate-500 leading-relaxed">
                  Your identity has been successfully confirmed. You now have full access to our professional ecosystem.
                </p>
              </div>

              <div className="space-y-4 bg-slate-50 rounded-2xl p-6 text-left">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 text-center">Your Premium Access</h3>
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
                Launch Dashboard
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
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
                <h1 className="text-2xl font-black text-slate-900">Verification Failed</h1>
                <p className="text-slate-500 leading-relaxed">
                  {errorMsg}
                </p>
              </div>

              <div className="space-y-4 pt-4">
                {resent ? (
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
                )}
                
                <Link 
                  to="/login"
                  className="block text-sm font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
                >
                  Back to Login
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
