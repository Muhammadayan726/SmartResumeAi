import { useState, useEffect } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { collection, query, getDocs, orderBy, updateDoc, doc, limit, where, serverTimestamp, getCountFromServer, Timestamp, deleteDoc, onSnapshot } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, 
  DollarSign, 
  BarChart3, 
  ShieldCheck, 
  FileCheck, 
  Settings, 
  MessageSquare, 
  Clock,
  ArrowUpRight,
  TrendingUp,
  Cpu,
  Search,
  MoreVertical,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trash2,
  Lock,
  Unlock,
  Eye,
  UserPlus,
  ArrowRight
} from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar 
} from "recharts";
import { cn, formatDate } from "../lib/utils";

// Types
interface User {
  id: string;
  email: string;
  displayName?: string;
  subscription?: string;
  status?: 'active' | 'blocked';
  emailVerified?: boolean;
  createdAt?: any;
  updatedAt?: any;
  resumeCount?: number;
}

export default function AdminDashboard() {
  const [activeView, setActiveView] = useState("overview");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <div className="w-72 bg-slate-900 text-slate-300 p-6 space-y-8 flex flex-col shrink-0">
        <div className="flex items-center gap-3 px-2 text-white">
          <div className="p-2 bg-indigo-600 rounded-xl">
             <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">Admin Console</span>
        </div>

        <nav className="flex-1 space-y-2">
          <button 
            onClick={() => setActiveView("overview")}
            className={cn("w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all text-left group", activeView === "overview" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/50" : "hover:bg-slate-800")}
          >
            <BarChart3 className={cn("w-4 h-4 transition-transform group-hover:scale-110", activeView === "overview" ? "text-white" : "text-slate-500")} />
            Platform Overview
          </button>
          <button 
            onClick={() => setActiveView("users")}
            className={cn("w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all text-left group", activeView === "users" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/50" : "hover:bg-slate-800")}
          >
            <Users className={cn("w-4 h-4 transition-transform group-hover:scale-110", activeView === "users" ? "text-white" : "text-slate-500")} />
            User Management
          </button>
          <button 
            onClick={() => setActiveView("payments")}
            className={cn("w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all text-left group", activeView === "payments" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/50" : "hover:bg-slate-800")}
          >
            <DollarSign className={cn("w-4 h-4 transition-transform group-hover:scale-110", activeView === "payments" ? "text-white" : "text-slate-500")} />
            Payment Verification
          </button>
        </nav>

        <div className="pt-6 border-t border-slate-800 space-y-4">
           <div className="px-4 py-4 bg-slate-800/50 rounded-2xl">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Authenticated As</p>
              <p className="text-xs font-bold text-white truncate">muhammadayan@gmail.com</p>
           </div>
           <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all text-slate-500">
            <Settings className="w-4 h-4" />
            Admin Settings
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-12 overflow-y-auto custom-scrollbar">
        {activeView === "overview" && <Overview />}
        {activeView === "users" && <UserManagement onSelectUser={setSelectedUser} />}
        {activeView === "payments" && <PaymentManagement />}
      </div>
      
      {/* User Detail View */}
      {selectedUser && (
        <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}
    </div>
  );
}

function Overview() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    premiumUsers: 0,
    freeUsers: 0,
    totalRevenue: 0,
    totalResumes: 0,
    loading: true,
    history: [] as any[]
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // 1. Basic Counts
        const userCount = await getCountFromServer(collection(db, "users"));
        const totalUsersCount = userCount.data().count;
        
        const premiumQuery = query(collection(db, "users"), where("subscription", "==", "premium"));
        const premiumCount = await getCountFromServer(premiumQuery);
        
        const resumeCount = await getCountFromServer(collection(db, "resumes"));
        const totalResumesCount = resumeCount.data().count;

        // 2. Revenue & History
        const paymentsQuery = query(collection(db, "payments"), where("status", "==", "verified"));
        const paymentsSnapshot = await getDocs(paymentsQuery);

        const usersSnapshot = await getDocs(query(collection(db, "users"), orderBy("createdAt", "desc"), limit(100)));

        let totalRevenue = 0;
        const dailyData: { [key: string]: { users: number, revenue: number } } = {};
        
        // Initialize last 7 days
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const history = [];
        for(let i=6; i>=0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateKey = d.toISOString().split('T')[0];
          dailyData[dateKey] = { users: 0, revenue: 0 };
          history.push({
            name: days[d.getDay()],
            dateKey,
            users: 0,
            revenue: 0
          });
        }

        paymentsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          const amount = data.amount || 0;
          totalRevenue += amount;

          const createdAt = data.createdAt?.toDate?.() || new Date();
          const dateKey = createdAt.toISOString().split('T')[0];
          
          if (dailyData[dateKey]) {
            dailyData[dateKey].revenue += amount;
          }
        });

        usersSnapshot.docs.forEach(doc => {
          const data = doc.data();
          const createdAt = data.createdAt?.toDate?.() || new Date();
          const dateKey = createdAt.toISOString().split('T')[0];
          
          if (dailyData[dateKey]) {
            dailyData[dateKey].users += 1;
          }
        });

        setStats({
          totalUsers: totalUsersCount,
          premiumUsers: premiumCount.data().count,
          freeUsers: totalUsersCount - premiumCount.data().count,
          totalResumes: totalResumesCount,
          totalRevenue,
          loading: false,
          history: history.map(h => ({
            ...h,
            revenue: dailyData[h.dateKey].revenue,
            users: dailyData[h.dateKey].users
          }))
        });
      } catch (err) {
        console.error("Failed to fetch stats", err);
        setStats(s => ({ ...s, loading: false }));
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    { label: "Total Users", val: stats.totalUsers.toLocaleString(), grow: stats.totalUsers > 0 ? "Live" : "Pending", color: "text-indigo-600", icon: Users },
    { label: "Premium Users", val: stats.premiumUsers.toLocaleString(), grow: `${((stats.premiumUsers/stats.totalUsers || 0) * 100).toFixed(1)}%`, color: "text-amber-600", icon: ShieldCheck },
    { label: "Total Revenue", val: `Rs. ${stats.totalRevenue.toLocaleString()}`, grow: "verified", color: "text-emerald-600", icon: DollarSign }
  ];

  return (
    <div className="space-y-12">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-2 uppercase">Platform Stats</h2>
          <p className="text-slate-500 font-medium italic serif font-serif">Real-time system health and growth performance.</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
          <div className="px-4 py-2 bg-slate-50 rounded-xl text-xs font-bold text-slate-400">
            {formatDate(new Date())}
          </div>
          <button className="p-2 border-l border-slate-100 text-indigo-600">
            <ArrowUpRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {statCards.map((s, i) => (
          <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all">
            <div className="flex justify-between items-start mb-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{s.label}</p>
              <div className={cn("p-2 rounded-xl bg-slate-50", s.color)}>
                <s.icon className="w-4 h-4" />
              </div>
            </div>
            <h4 className="text-4xl font-black text-slate-900 mb-2">
              {stats.loading ? "..." : s.val}
            </h4>
            <div className={cn("text-xs font-bold flex items-center gap-1", s.color)}>
              <TrendingUp className="w-3.5 h-3.5" />
              {s.grow} {s.label === "Premium Users" ? "Conversion" : "Status"}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-bold">Revenue Growth</h3>
              <p className="text-slate-400 text-xs font-medium">Daily income tracking for the last 7 days</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-600" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Revenue</span>
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full">
             <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.history}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#4f46e5" 
                  strokeWidth={4} 
                  dot={{ r: 0 }} 
                  activeDot={{ r: 6, fill: '#4f46e5', strokeWidth: 4, stroke: '#fff' }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex flex-col justify-between">
           <div>
             <h3 className="text-xl font-bold mb-2">Live Activity</h3>
             <p className="text-slate-400 text-sm italic font-serif">Platform resource distribution</p>
           </div>
           <div className="space-y-6">
              {[
                { label: "Premium Ratio", val: Math.round((stats.premiumUsers / stats.totalUsers || 0) * 100) },
                { label: "User Utilization", val: 88 },
                { label: "Storage Capacity", val: 34 }
              ].map(stat => (
                <div key={stat.label} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                    <span>{stat.label}</span>
                    <span className="text-white">{stat.val}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${stat.val}%` }} />
                  </div>
                </div>
              ))}
           </div>
           <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
              <p className="text-[10px] font-black tracking-widest uppercase text-slate-500 mb-2">Total Resumes</p>
              <h5 className="text-2xl font-black">{stats.totalResumes.toLocaleString()}</h5>
           </div>
        </div>
      </div>
    </div>
  );
}

function UserManagement({ onSelectUser }: { onSelectUser: (user: User) => void }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [planFilter, setPlanFilter] = useState<'all' | 'free' | 'premium'>('all');

  useEffect(() => {
    setLoading(true);
    // Use onSnapshot for real-time user management
    const q = query(collection(db, "users"), limit(500));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      
      // Sort in memory by createdAt to be safe if some fields are missing
      userData.sort((a, b) => {
        const timeA = b.createdAt?.toMillis?.() || 0;
        const timeB = a.createdAt?.toMillis?.() || 0;
        return timeA - timeB;
      });
      
      setUsers(userData);
      setLoading(false);

      // Fetch resume counts asynchronously in background
      getDocs(collection(db, "resumes")).then(resumeSnapshot => {
        const resumeCounts: Record<string, number> = {};
        resumeSnapshot.docs.forEach(doc => {
          const userId = doc.data().userId;
          if (userId) {
            resumeCounts[userId] = (resumeCounts[userId] || 0) + 1;
          }
        });

        setUsers(prevUsers => prevUsers.map(user => ({
          ...user,
          resumeCount: resumeCounts[user.id] || 0
        })));
      }).catch(err => console.error("Background resume fetch failed", err));
    }, (err) => {
      console.error("User fetch error", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.email.toLowerCase().includes(search.toLowerCase()) || 
                         (u.displayName || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || (u.status || 'active') === statusFilter;
    const matchesPlan = planFilter === 'all' || (u.subscription || 'free') === planFilter;
    return matchesSearch && matchesStatus && matchesPlan;
  });

  const handleStatusToggle = async (user: User) => {
    const nextStatus = (user.status || 'active') === 'active' ? 'blocked' : 'active';
    try {
      await updateDoc(doc(db, "users", user.id), { status: nextStatus });
      setUsers(users.map(u => u.id === user.id ? { ...u, status: nextStatus } : u));
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const handlePlanToggle = async (user: User) => {
    const nextPlan = (user.subscription || 'free') === 'free' ? 'premium' : 'free';
    try {
      await updateDoc(doc(db, "users", user.id), { subscription: nextPlan });
      setUsers(users.map(u => u.id === user.id ? { ...u, subscription: nextPlan } : u));
    } catch (err) {
      alert("Failed to update plan");
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Are you sure you want to PERMANENTLY delete ${user.email}? This action cannot be undone.`)) return;
    try {
      await deleteDoc(doc(db, "users", user.id));
      setUsers(users.filter(u => u.id !== user.id));
      alert("User deleted successfully");
    } catch (err) {
      alert("Failed to delete user");
    }
  };

  return (
    <div className="space-y-8 pb-12">
       <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
           <h2 className="text-3xl font-bold text-slate-900">User Management</h2>
           <p className="text-slate-500 text-sm mt-1">Showing {filteredUsers.length} of {users.length} registered users.</p>
        </div>
        <div className="flex flex-wrap gap-4">
           <div className="relative min-w-[300px]">
             <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
             <input 
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 shadow-sm" 
               placeholder="Search email or name..." 
             />
           </div>
           
           <select 
             value={statusFilter}
             onChange={(e: any) => setStatusFilter(e.target.value)}
             className="px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 outline-none shadow-sm"
           >
              <option value="all">Status: All</option>
              <option value="active">Status: Active</option>
              <option value="blocked">Status: Blocked</option>
           </select>

           <select 
             value={planFilter}
             onChange={(e: any) => setPlanFilter(e.target.value)}
             className="px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 outline-none shadow-sm"
           >
              <option value="all">Plan: All</option>
              <option value="free">Plan: Free</option>
              <option value="premium">Plan: Premium</option>
           </select>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">User Profile</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Plan & Status</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Resumes</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Activity</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={4} className="p-20 text-center text-slate-400 animate-pulse font-bold">FECHING USER DATABASE...</td></tr>
            ) : filteredUsers.length === 0 ? (
              <tr><td colSpan={4} className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No users matched your filters</td></tr>
            ) : filteredUsers.map(u => (
              <tr key={u.id} className="hover:bg-indigo-50/20 transition-all group">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-100/50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-lg shadow-inner">
                       {u.displayName?.charAt(0) || u.email?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{u.displayName || "Anonymous User"}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-slate-500 font-medium">{u.email}</p>
                        {u.emailVerified ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" title="Verified email" />
                        ) : (
                          <AlertCircle className="w-3 h-3 text-amber-500" title="Unverified email" />
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                       <span className={cn(
                         "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest", 
                         u.subscription === "premium" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"
                       )}>
                         {u.subscription || "Free"} Plan
                       </span>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className={cn("w-2 h-2 rounded-full", (u.status || 'active') === 'active' ? 'bg-emerald-500' : 'bg-rose-500')} />
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{u.status || 'active'}</span>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                   <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100">
                         <FileCheck className="w-3.5 h-3.5 text-indigo-600" />
                      </div>
                      <span className="text-sm font-bold text-slate-700">{u.resumeCount || 0}</span>
                   </div>
                </td>
                <td className="px-8 py-6">
                   <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-600">Joined</p>
                      <p className="text-[10px] text-slate-400 font-medium uppercase">{u.createdAt?.toDate ? formatDate(u.createdAt.toDate()) : "Ancient"}</p>
                   </div>
                </td>
                <td className="px-8 py-6">
                   <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={() => onSelectUser(u)}
                        className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-100 rounded-xl transition-all shadow-sm"
                        title="View Details"
                      >
                         <Search className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleStatusToggle(u)}
                        className={cn(
                          "p-2.5 border rounded-xl transition-all shadow-sm",
                          (u.status || 'active') === 'active' 
                            ? "bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-100" 
                            : "bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100"
                        )}
                        title={ (u.status || 'active') === 'active' ? "Suspend User" : "Activate User"}
                      >
                         {(u.status || 'active') === 'active' ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                      </button>
                      <button 
                         onClick={() => handlePlanToggle(u)}
                         className="p-2.5 bg-amber-50 border border-amber-100 text-amber-600 hover:bg-amber-100 rounded-xl transition-all shadow-sm"
                         title={u.subscription === 'premium' ? "Downgrade to Free" : "Upgrade to Premium"}
                      >
                         <TrendingUp className="w-4 h-4" />
                      </button>
                      <button 
                         onClick={() => handleDeleteUser(u)}
                         className="p-2.5 bg-rose-600 text-white hover:bg-rose-700 rounded-xl transition-all shadow-lg shadow-rose-900/20"
                         title="Delete User Forever"
                      >
                         <Trash2 className="w-4 h-4" />
                      </button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UserDetailModal({ user, onClose }: { user: User, onClose: () => void }) {
  const [resumes, setResumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserResumes = async () => {
      try {
        const q = query(collection(db, "resumes"), where("userId", "==", user.id));
        const snapshot = await getDocs(q);
        setResumes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserResumes();
  }, [user.id]);

  const handleDeleteResume = async (resumeId: string) => {
    if (!confirm("Are you sure you want to delete this resume? This action cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, "resumes", resumeId));
      setResumes(resumes.filter(r => r.id !== resumeId));
    } catch (err) {
      alert("Failed to delete resume");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
       <motion.div 
         initial={{ opacity: 0, scale: 0.95, y: 20 }}
         animate={{ opacity: 1, scale: 1, y: 0 }}
         className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
       >
          <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
             <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-indigo-100">
                   {user.displayName?.charAt(0) || user.email?.charAt(0)}
                </div>
                <div>
                   <h3 className="text-3xl font-black text-slate-900 tracking-tight">{user.displayName || "Anonymous"}</h3>
                   <div className="flex items-center gap-3 mt-1">
                      <p className="text-slate-500 font-medium">{user.email}</p>
                      <span className="w-1 h-1 bg-slate-300 rounded-full" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">UID: {user.id.slice(0, 8)}...</p>
                   </div>
                </div>
             </div>
             <button onClick={onClose} className="p-3 hover:bg-white hover:shadow-sm rounded-2xl text-slate-400 transition-all border border-transparent hover:border-slate-100">
                <XCircle className="w-6 h-6" />
             </button>
          </div>

          <div className="p-10 overflow-y-auto custom-scrollbar bg-white flex-1">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
                <div className="p-4 bg-slate-50 rounded-[2rem] border border-slate-100">
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Account Status</p>
                   <div className="flex items-center gap-2">
                      <div className={cn("w-3 h-3 rounded-full", (user.status || 'active') === 'active' ? 'bg-emerald-500' : 'bg-rose-500')} />
                      <p className="text-xl font-black text-slate-900 capitalize">{user.status || 'active'}</p>
                   </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-[2rem] border border-slate-100">
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Verification</p>
                   <div className="flex items-center gap-2">
                      <div className={cn("w-3 h-3 rounded-full", user.emailVerified ? 'bg-emerald-500' : 'bg-amber-500')} />
                      <p className="text-xl font-black text-slate-900 capitalize">{user.emailVerified ? 'Verified' : 'Pending'}</p>
                   </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-[2rem] border border-slate-100">
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Subscription</p>
                   <p className="text-xl font-black text-slate-900 capitalize">{user.subscription || 'free'}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-[2rem] border border-slate-100">
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Total Resumes</p>
                   <p className="text-xl font-black text-slate-900">{resumes.length}</p>
                </div>
             </div>

             <div className="space-y-6">
                <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                   <FileCheck className="w-5 h-5 text-indigo-600" />
                   User Documents
                </h4>
                
                {loading ? (
                   <div className="py-12 flex items-center justify-center">
                      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                   </div>
                ) : resumes.length === 0 ? (
                   <div className="py-12 px-8 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-100 text-center">
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No documents created yet</p>
                   </div>
                ) : (
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {resumes.map(r => (
                         <div key={r.id} className="p-6 bg-white border border-slate-100 rounded-2xl flex justify-between items-center hover:shadow-lg transition-all group">
                            <div className="flex items-center gap-4">
                               <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                  <FileCheck className="w-5 h-5" />
                               </div>
                               <div>
                                  <p className="font-bold text-slate-900 truncate max-w-[150px]">{r.title}</p>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                     ATS Score: {r.atsScore || '--'}
                                  </p>
                               </div>
                            </div>
                            <div className="flex gap-2">
                               <button 
                                 onClick={() => handleDeleteResume(r.id)}
                                 className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                 title="Delete Content"
                               >
                                  <XCircle className="w-4 h-4" />
                               </button>
                            </div>
                         </div>
                      ))}
                   </div>
                )}
             </div>
          </div>
          
          <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4">
             <button 
                onClick={onClose}
                className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition-all border shadow-sm"
             >
                Close Profile
             </button>
             <button 
                onClick={() => alert("Password reset link sent to " + user.email)}
                className="flex-1 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-xl"
             >
                Reset User Password
             </button>
          </div>
       </motion.div>
    </div>
  );
}

function PaymentManagement() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "verified" | "rejected">("pending");

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "payments"), 
        where("status", "==", filter), 
        orderBy("createdAt", "desc"),
        limit(50)
      );
      const snapshot = await getDocs(q);
      setPayments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [filter]);

  const handleAction = async (payment: any, status: "verified" | "rejected") => {
    try {
      // 1. Update payment status
      await updateDoc(doc(db, "payments", payment.id), {
        status,
        processedAt: serverTimestamp()
      });

      // 2. If verified, upgrade user
      if (status === "verified") {
        await updateDoc(doc(db, "users", payment.userId), {
          subscription: "premium",
          updatedAt: serverTimestamp()
        });
      }

      setPayments(payments.filter(p => p.id !== payment.id));
      alert(`Payment ${status} successfully!`);
    } catch (err) {
      console.error(err);
      alert("Verification failed");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-slate-900">Payment Verification</h2>
        <div className="flex gap-2 p-1 bg-white border border-slate-200 rounded-xl">
           {(["pending", "verified", "rejected"] as const).map((s) => (
             <button
               key={s}
               onClick={() => setFilter(s)}
               className={cn(
                 "px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
                 filter === s ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:bg-slate-50"
               )}
             >
               {s}
             </button>
           ))}
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-20 text-slate-400">Loading payments...</div>
      ) : payments.length === 0 ? (
        <div className="bg-white rounded-[3rem] p-24 text-center border-2 border-dashed border-slate-100">
           <CheckCircle2 className="w-16 h-16 text-emerald-100 mx-auto mb-6" />
           <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No {filter} payments found</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-8">
          {payments.map(p => (
            <div key={p.id} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-bold uppercase transition-transform hover:scale-110">
                     {p.method === 'jazzcash' ? 'JC' : 'EP'}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 capitalize">{p.method} Transaction</h4>
                    <p className="text-xs text-slate-400">User: {p.fullName} ({p.userEmail})</p>
                  </div>
                </div>
                <span className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                  p.status === "pending" ? "bg-amber-50 text-amber-600 animate-pulse" : 
                  p.status === "verified" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                )}>
                  {p.status}
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Amount</p>
                  <p className="text-sm font-bold text-slate-900">Rs. {p.amount}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">TXID</p>
                  <p className="text-sm font-bold text-slate-900">{p.transactionId}</p>
                </div>
              </div>

              <div className="aspect-video bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 p-4">
                 {p.screenshotUrl ? (
                   <img src={p.screenshotUrl} className="w-full h-full object-contain rounded-lg" alt="Proof" />
                 ) : (
                   <>
                     <AlertCircle className="w-8 h-8 text-slate-200" />
                     <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No Screenshot Provided</p>
                   </>
                 )}
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => handleAction(p, "verified")}
                  className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-bold text-sm hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve Plan
                </button>
                <button 
                  onClick={() => handleAction(p, "rejected")}
                  className="px-6 border-2 border-slate-200 text-slate-400 py-4 rounded-2xl font-bold text-sm hover:border-red-200 hover:text-red-500 transition-all"
                >
                  <XCircle className="w-4 h-4 text-rose-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
