import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../lib/firebase";
import { updateProfile, updateEmail, sendEmailVerification, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useState, useEffect, type FormEvent } from "react";
import { User, Mail, Shield, Save, Loader2, CheckCircle2, AlertCircle, Crown, Zap, LogOut } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";
import { usePremiumStatus } from "../hooks/usePremiumStatus";
import { Link, useNavigate } from "react-router-dom";

export default function Profile() {
  const [user] = useAuthState(auth);
  const { isPremium, loading: statusLoading } = usePremiumStatus();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    setMessage(null);
    
    try {
      if (displayName !== user.displayName) {
        await updateProfile(user, { displayName });
      }
      
      // Update in Firestore too
      await setDoc(doc(db, "users", user.uid), {
        displayName,
        email: user.email,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!user) return;
    try {
      await sendEmailVerification(user);
      setMessage({ type: "success", text: "Verification email sent! Please check your inbox." });
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    }
  };

  if (!user) return null;

  return (
    <div className="bg-slate-50 min-h-screen py-12 px-8 lg:px-24">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Account Settings</h1>
          <p className="text-slate-500">Manage your profile information and account security.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* General Profile */}
            <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="text-xl font-bold">General Information</h2>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="space-y-1.5 flex flex-col">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Display Name</label>
                  <input 
                    type="text" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 py-4 px-6 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  />
                </div>

                <div className="space-y-1.5 flex flex-col opacity-60">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Email Address (Primary)</label>
                  <input 
                    type="email" 
                    disabled
                    value={email}
                    className="w-full bg-slate-100 border border-slate-200 py-4 px-6 rounded-2xl cursor-not-allowed"
                  />
                </div>

                {message && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "p-4 rounded-2xl flex items-center gap-3 text-sm font-medium",
                      message.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"
                    )}
                  >
                    {message.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {message.text}
                  </motion.div>
                )}

                <button 
                  type="submit"
                  disabled={loading}
                  className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
              </form>
            </div>

            {/* Email Verification */}
            {!user.emailVerified && (
              <div className="bg-amber-50 border border-amber-100 rounded-[2rem] p-8">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-amber-900 mb-1">Verify your email</h3>
                    <p className="text-amber-700 mb-6 font-medium">Please confirm your email address to secure your account.</p>
                    <button 
                      onClick={handleVerifyEmail}
                      className="bg-amber-600 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-amber-700 transition-all"
                    >
                      Resend Verification Email
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-8">
            <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm text-center relative overflow-hidden group">
              {isPremium && (
                <div className="absolute top-0 right-0 p-4">
                   <Crown className="w-6 h-6 text-amber-400 animate-bounce" />
                </div>
              )}
              <div className={cn(
                "w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center overflow-hidden border-4 border-white shadow-xl transition-all duration-500",
                isPremium ? "ring-4 ring-amber-400 group-hover:scale-110" : "bg-indigo-50"
              )}>
                 <img src={user.photoURL || `https://ui-avatars.com/api/?name=${displayName || user.email}&background=6366f1&color=fff&size=200`} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <div className="flex items-center justify-center gap-2 mb-1">
                <h3 className="text-xl font-bold text-slate-900">{displayName || "Anonymous User"}</h3>
                {isPremium && <CheckCircle2 className="w-5 h-5 text-blue-500 fill-current bg-white rounded-full" />}
              </div>
              <p className="text-slate-400 text-sm font-medium mb-6">{user.email}</p>
              
              {isPremium ? (
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100">
                  <Crown className="w-3 h-3" />
                  Premium Subscriber
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    <Shield className="w-3 h-3" />
                    Free Plan
                  </div>
                  <Link 
                    to="/pricing"
                    className="flex justify-center items-center gap-2 w-full p-4 bg-indigo-600 text-white rounded-2xl text-xs font-bold hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-100"
                  >
                    <Zap className="w-3 h-3 fill-current" />
                    Upgrade to Premium
                  </Link>
                </div>
              )}
            </div>

            <div className="bg-slate-900 rounded-[2rem] p-8 text-white">
              <h3 className="text-lg font-bold mb-4">Need help?</h3>
              <p className="text-slate-400 text-sm mb-6">Our support team is available 24/7 to help you with any issues.</p>
              <a href="mailto:03004292351muhammadayan@gmail.com" className="block text-center bg-white/10 hover:bg-white/20 py-4 rounded-xl text-sm font-bold transition-all">
                Contact Support
              </a>
            </div>

            <div className="bg-white rounded-[2rem] border border-red-100 p-8 shadow-sm text-center">
              <h3 className="text-lg font-bold text-slate-950 mb-2">Logout</h3>
              <p className="text-slate-500 text-xs mb-6 font-medium">Ready to sign out of your active session?</p>
              <button 
                onClick={async () => {
                  await signOut(auth);
                  navigate("/");
                }}
                className="w-full py-4 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 active:scale-95 flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
