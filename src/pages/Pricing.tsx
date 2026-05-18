import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, Zap, Sparkles, Star, ArrowRight, Rocket, Loader2, CheckCircle2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import PaymentModal from "../components/PaymentModal";
import { usePremiumStatus } from "../hooks/usePremiumStatus";

import { handleFirestoreError, OperationType } from "../lib/firestoreErrorHandler";

const plans = [
  {
    name: "Free",
    price: "0",
    desc: "Perfect for students and early career professionals.",
    features: [
      "1 ATS-Friendly Resume",
      "Basic Templates",
      "Limited AI Suggestions",
      "PDF Download",
      "Community Support"
    ],
    cta: "Start for Free",
    popular: false,
    color: "bg-slate-50"
  },
  {
    name: "Premium",
    price: "1,500",
    period: "month",
    currency: "Rs.",
    desc: "Most popular for experienced job seekers.",
    features: [
      "Unlimited Resumes",
      "Premium Templates",
      "Full AI Resume Writer",
      "ATS Score Analysis",
      "No Watermark",
      "Priority Support",
      "Cover Letter Generator"
    ],
    cta: "Go Premium",
    popular: true,
    color: "bg-white"
  },
  {
    name: "Lifetime",
    price: "5,000",
    period: "one-time",
    currency: "Rs.",
    desc: "Best value for serial career growers.",
    features: [
      "Everything in Premium",
      "Lifetime Access",
      "AI Interview Prep",
      "Portfolio Website Builder",
      "Custom Domain Support",
      "Early Access to Features"
    ],
    cta: "Get Lifetime",
    popular: false,
    color: "bg-slate-50"
  }
];

export default function Pricing() {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const { plan } = usePremiumStatus();
  const [selectedPlan, setSelectedPlan] = useState<{name: string, price: string} | null>(null);
  const [showConfirmFree, setShowConfirmFree] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activating, setActivating] = useState(false);

  const handlePlanClick = (planData: typeof plans[0]) => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (planData.name === "Free") {
      if (plan === "free" || plan === "premium") return;
      setShowConfirmFree(true);
      return;
    }

    if (plan === "premium" && planData.name === "Premium") return;

    setSelectedPlan({ name: planData.name, price: planData.price });
  };

  const handleActivateFree = async () => {
    if (!user) return;
    setActivating(true);
    try {
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        subscription: "free",
        planActivatedAt: serverTimestamp(),
      }, { merge: true });
      setShowConfirmFree(false);
      setShowSuccess(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    } finally {
      setActivating(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-24 px-8 lg:px-24">
      <div className="max-w-7xl mx-auto text-center mb-20">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full mb-6">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Special Launch Pricing</span>
        </div>
        <h1 className="text-5xl lg:text-7xl font-bold text-slate-900 tracking-tight mb-6">Invest in <span className="text-indigo-600 font-serif italic text-light">yourself.</span></h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">Land your dream job with AI-powered tools that give you the professional edge you deserve.</p>
      </div>

      <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-8">
        {plans.map((planData, i) => (
          <motion.div 
            key={planData.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={cn(
              "relative rounded-[3rem] p-10 border-2 transition-all flex flex-col",
              planData.popular ? "border-indigo-600 shadow-2xl shadow-indigo-200 scale-105 z-10 bg-white" : "border-slate-100 bg-white"
            )}
          >
            {planData.popular && (
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-6 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-2">
                <Star className="w-4 h-4 fill-current" />
                MOST SEARCHED
              </div>
            )}

            <div className="mb-10">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">{planData.name}</h3>
              <p className="text-slate-500 text-sm">{planData.desc}</p>
            </div>

            <div className="mb-10 flex items-baseline gap-1">
              <span className="text-sm font-bold text-slate-400">{planData.currency || "$"}</span>
              <span className="text-6xl font-black text-slate-900 tracking-tighter">{planData.price}</span>
              {planData.period && <span className="text-slate-400 font-medium italic serif font-serif ml-1">/{planData.period}</span>}
            </div>

            <div className="space-y-4 mb-12 flex-1">
              {planData.features.map(f => (
                <div key={f} className="flex items-start gap-3">
                  <div className="mt-1 w-5 h-5 bg-indigo-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-indigo-600" />
                  </div>
                  <span className="text-sm text-slate-600 font-medium">{f}</span>
                </div>
              ))}
            </div>

            <button 
              onClick={() => handlePlanClick(planData)}
              disabled={(planData.name === "Free" && !!plan) || (planData.name === "Premium" && plan === "premium")}
              className={cn(
                "w-full py-4 rounded-2xl font-bold text-center transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
                planData.popular ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl" : "bg-slate-900 text-white hover:bg-slate-800"
              )}
            >
              {(planData.name === "Free" && !!plan) || (planData.name === "Premium" && plan === "premium") ? "Current Plan" : planData.cta}
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedPlan && (
          <PaymentModal 
            isOpen={!!selectedPlan}
            onClose={() => setSelectedPlan(null)}
            planName={selectedPlan.name}
            amount={selectedPlan.price}
          />
        )}

        {showConfirmFree && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl text-center"
            >
              <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Rocket className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Activate Free Plan?</h3>
              <p className="text-slate-500 mb-8 leading-relaxed">
                Connect your account to our standard features. You can upgrade to Premium anytime for AI-powered optimization.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowConfirmFree(false)}
                  className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleActivateFree}
                  disabled={activating}
                  className="flex-1 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center"
                >
                  {activating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Activation"}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showSuccess && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-[2.5rem] p-12 max-w-md w-full shadow-2xl text-center"
            >
              <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">🎉 Welcome Aboard!</h3>
              <p className="text-slate-500 mb-8 text-lg font-serif italic">
                Your Free Plan is now active. You have full access to our standard resume building tools.
              </p>
              <button 
                onClick={() => navigate("/dashboard")}
                className="w-full px-8 py-5 bg-slate-950 text-white rounded-[2rem] font-bold text-lg hover:bg-indigo-600 transition-all shadow-xl shadow-slate-950/20"
              >
                Go to Dashboard
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto mt-32 bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden text-center lg:text-left flex flex-col lg:flex-row items-center gap-12">
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
         <div className="relative z-10 flex-1">
           <h3 className="text-3xl font-bold mb-4 font-serif italic">Need assistance?</h3>
           <p className="text-slate-400 text-lg leading-relaxed">Our dedicated support team is available round the clock to help you navigate your career journey. Reach out for personal guidance, bulk discounts, or any technical inquiries.</p>
         </div>
         <div className="relative z-10 w-full lg:w-auto">
            <div className="bg-white/10 px-8 py-6 rounded-[2rem] backdrop-blur-md border border-white/10 shadow-2xl">
               <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-2">Primary Support Channel</p>
               <p className="text-xl font-bold">03004292351muhammadayan@gmail.com</p>
               <div className="mt-4 flex items-center gap-2 text-slate-500 text-xs font-serif italic">
                 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                 Typically responds within 2 hours
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
