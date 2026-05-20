import { type ReactNode, useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../lib/firebase";
import { usePremiumStatus } from "../hooks/usePremiumStatus";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import { Lock, Rocket, ArrowRight, Loader2 } from "lucide-react";

export default function PlanGuard({ children }: { children: ReactNode }) {
  const [user, authLoading] = useAuthState(auth);
  const { plan, loading: planLoading, hasPlan } = usePremiumStatus();
  const navigate = useNavigate();
  const location = useLocation();

  if (authLoading || planLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] animate-pulse">
          Verifying account entitlements...
        </p>
      </div>
    );
  }

  // If user is not authenticated, let ProtectedRoute or general routing handle it (or render nothing/children)
  if (!user) {
    return <>{children}</>;
  }

  // If user does not have an active plan, block access and show the restriction view
  if (!hasPlan) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6 bg-slate-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="bg-white max-w-lg w-full rounded-[2.5rem] border border-slate-100 p-10 md:p-12 text-center shadow-xl shadow-slate-200/50 relative overflow-hidden"
        >
          {/* Top aesthetic accent line */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          
          <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
            <Lock className="w-10 h-10" />
          </div>

          <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">
            Please activate a plan first.
          </h2>
          
          <p className="text-slate-500 font-medium mb-10 leading-relaxed text-sm">
            To explore premium designs, build resumes, and leverage AI optimization, you must start your Free Plan or upgrade to Premium. Set up your workspace first!
          </p>

          <button
            onClick={() => navigate("/pricing")}
            className="w-full py-5 bg-slate-950 text-white rounded-2xl font-black text-base flex items-center justify-center gap-3 hover:bg-indigo-600 hover:shadow-xl hover:shadow-indigo-500/20 active:scale-95 transition-all group"
          >
            <span>Go to Pricing</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}
