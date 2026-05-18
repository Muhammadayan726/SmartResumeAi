import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, FileText, Gem, FolderHeart, User, ShieldCheck } from "lucide-react";
import { cn } from "../lib/utils";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../lib/firebase";

export default function MobileNav() {
  const location = useLocation();
  const [user] = useAuthState(auth);
  const isAdmin = user?.email === "03004292351muhammadayan@gmail.com";

  if (location.pathname.startsWith("/builder")) return null;

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { label: "Templates", icon: FileText, path: "/templates" },
    { label: "Pricing", icon: Gem, path: "/pricing" },
    { label: "Resumes", icon: FolderHeart, path: "/resumes" },
    { label: "Profile", icon: User, path: "/profile" },
  ];

  if (isAdmin) {
    navItems.splice(4, 0, { label: "Admin", icon: ShieldCheck, path: "/admin" });
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 z-50 pt-3 pb-6 px-4 safe-area-bottom shadow-[0_-1px_10px_rgba(0,0,0,0.05)]">
      <div className="flex justify-between items-center max-w-lg mx-auto gap-1">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.label}
              to={item.path}
              className="flex-1 flex flex-col items-center gap-1.5 group relative"
            >
              <div className={cn(
                "w-full h-8 rounded-2xl flex items-center justify-center transition-all duration-300 max-w-[64px]",
                isActive ? "bg-indigo-600/10 text-indigo-600" : "text-slate-400 group-active:scale-90"
              )}>
                <Icon className={cn("w-5 h-5", isActive ? "stroke-[2.5px]" : "stroke-2")} />
              </div>
              <span className={cn(
                "text-[9px] font-black uppercase tracking-tighter transition-all duration-300",
                isActive ? "text-indigo-600 scale-100" : "text-slate-400 scale-95 opacity-60"
              )}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-600 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
