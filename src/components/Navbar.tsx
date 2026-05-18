import { Link, useNavigate } from "react-router-dom";
import { auth } from "../lib/firebase";
import { signOut } from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import { Layout, User, LogOut, Menu, X, Sparkles, FileText, ArrowRight, ShieldCheck, Crown } from "lucide-react";
import { useState } from "react";
import { cn } from "../lib/utils";
import { usePremiumStatus } from "../hooks/usePremiumStatus";

export default function Navbar() {
  const [user] = useAuthState(auth);
  const { isPremium } = usePremiumStatus();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="bg-indigo-600 p-2.5 rounded-xl group-hover:rotate-6 transition-transform shadow-lg shadow-indigo-200">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-2xl tracking-tight text-slate-900 uppercase">SmartResume <span className="text-indigo-600 italic font-serif font-light lowercase">ai</span></span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-10">
            <Link to="/templates" className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-widest">Templates</Link>
            <Link to="/pricing" className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-widest">Pricing</Link>
            {user ? (
              <div className="flex items-center gap-6">
                <Link to="/resumes" className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-widest">My Resumes</Link>
                <Link to="/dashboard" className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-widest">Dashboard</Link>
                {user.email === "03004292351muhammadayan@gmail.com" && (
                  <Link to="/admin" className="text-sm font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-lg flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    Admin
                  </Link>
                )}
                <div className="h-6 w-px bg-slate-200" />
                <div className="flex items-center gap-4">
                  <Link to="/profile" className="flex flex-col items-end">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <p className="text-xs font-bold text-slate-900 truncate max-w-[100px]">{user.displayName || "User Profile"}</p>
                      {isPremium && (
                        <div className="bg-amber-100 text-amber-600 p-0.5 rounded-full" title="Premium User">
                          <Crown className="w-2.5 h-2.5 fill-current" />
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Settings</p>
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="p-2.5 bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all shadow-sm group"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </button>
                  <Link to="/profile" className={cn(
                    "w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center overflow-hidden ring-2 ring-white ring-offset-2 border border-indigo-100 shadow-sm hover:scale-105 transition-transform",
                    isPremium && "ring-amber-400 border-amber-200"
                  )}>
                    <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || user.email}&background=6366f1&color=fff`} alt="Profile" className="w-full h-full object-cover" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-8">
                <Link 
                  to="/login"
                  className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-all uppercase tracking-widest"
                >
                  Login
                </Link>
                <Link 
                  to="/signup"
                  className="bg-indigo-600 text-white px-8 py-4 rounded-2xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95 flex items-center gap-2 hover:-translate-y-0.5"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button hidden because of MobileNav */}
          <div className="md:hidden flex items-center gap-3">
            {user && (
              <Link to="/profile" className={cn(
                "w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center overflow-hidden border border-indigo-100",
                isPremium && "ring-2 ring-amber-400 border-amber-200"
              )}>
                <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || user.email}&background=6366f1&color=fff`} alt="Profile" className="w-full h-full object-cover" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
