import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { collection, query, where, getDocs, orderBy, deleteDoc, doc, addDoc, serverTimestamp, updateDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { 
  Plus, 
  FileText, 
  Trash2, 
  Pencil, 
  Download, 
  Zap, 
  Clock, 
  Target,
  Copy,
  Eye,
  Type,
  Settings,
  ArrowRight
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";

import { usePremiumStatus } from "../hooks/usePremiumStatus";
import { handleFirestoreError, OperationType } from "../lib/firestoreErrorHandler";

// Types
interface Resume {
  id: string;
  title: string;
  updatedAt: any;
  createdAt?: any;
  atsScore: number;
  template?: string;
  content: any;
}

// Reuse the TemplateThumbnail component for visual consistency
function TemplateThumbnail({ templateId, title, content }: { templateId: string, title: string, content: any }) {
  const themes: Record<string, string> = {
    modern: "bg-indigo-600",
    minimal: "bg-slate-950",
    tech: "bg-emerald-600",
    creative: "bg-fuchsia-600",
    executive: "bg-amber-600",
    student: "bg-sky-600",
    professional: "bg-slate-800",
    designer: "bg-rose-500",
  };

  return (
    <div className={cn("w-full h-full relative overflow-hidden flex flex-col p-4", themes[templateId] || themes.modern)}>
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.8),transparent)]" />
      <div className="relative z-10 space-y-2">
        <div className="h-1.5 w-1/3 bg-white/40 rounded-full" />
        <h4 className="text-[10px] font-black text-white uppercase tracking-tighter truncate leading-none">{title || "YOUR NAME"}</h4>
        <div className="space-y-1 pt-2">
          <div className="h-1 w-full bg-white/20 rounded-full" />
          <div className="h-1 w-full bg-white/20 rounded-full" />
          <div className="h-1 w-2/3 bg-white/20 rounded-full" />
        </div>
        <div className="grid grid-cols-2 gap-2 pt-4">
          <div className="h-8 bg-white/10 rounded-lg" />
          <div className="h-8 bg-white/10 rounded-lg" />
        </div>
      </div>
      <div className="mt-auto relative z-10 flex justify-between items-end">
        <div className="w-6 h-6 bg-white/20 rounded-lg" />
        <div className="text-[8px] font-black text-white/40 uppercase tracking-widest">{templateId}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { plan, loading: planLoading, hasPlan, isPremium } = usePremiumStatus();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"recent" | "score">("recent");
  const [stats, setStats] = useState({
    total: 0,
    avgScore: 0,
    downloads: 12
  });

  useEffect(() => {
    if (!planLoading && !hasPlan) {
      navigate("/pricing");
    }
  }, [planLoading, hasPlan, navigate]);

  useEffect(() => {
    if (!auth.currentUser) return;

    setLoading(true);
    // Use onSnapshot for real-time updates
    const q = query(
      collection(db, "resumes"),
      where("userId", "==", auth.currentUser.uid),
      orderBy("updatedAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Resume));
      
      setResumes(data);
      
      if (data.length > 0) {
        const sum = data.reduce((acc, curr) => acc + (curr.atsScore || 0), 0);
        setStats(prev => ({
          ...prev,
          total: data.length,
          avgScore: Math.round(sum / data.length)
        }));
      }
      setLoading(false);
    }, (err) => {
      console.error("Resume fetch error:", err);
      // We don't throw here to avoid crashing the whole component if it's just a query error (e.g. index missing)
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth.currentUser]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this resume? This action cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, "resumes", id));
      setResumes(resumes.filter(r => r.id !== id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `resumes/${id}`);
    }
  };

  const handleDuplicate = async (resume: Resume) => {
    try {
      const { id, ...data } = resume;
      const newDoc = await addDoc(collection(db, "resumes"), {
        ...data,
        title: `${resume.title} (Copy)`,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        userId: auth.currentUser?.uid
      });
      // snapshot will pick this up automatically
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "resumes");
    }
  };

  const handleRename = async (id: string, currentTitle: string) => {
    const newTitle = prompt("Enter new resume title:", currentTitle);
    if (!newTitle || newTitle === currentTitle) return;
    
    try {
      await updateDoc(doc(db, "resumes", id), {
        title: newTitle,
        updatedAt: serverTimestamp()
      });
      setResumes(resumes.map(r => r.id === id ? { ...r, title: newTitle } : r));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `resumes/${id}`);
    }
  };

  const filteredResumes = useMemo(() => {
    let result = [...resumes];

    if (sortBy === "score") {
      result.sort((a, b) => (b.atsScore || 0) - (a.atsScore || 0));
    }

    return result;
  }, [resumes, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Total Resumes</p>
              <h3 className="text-3xl font-bold text-slate-900">{stats.total}</h3>
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Avg ATS Score</p>
              <h3 className="text-3xl font-bold text-slate-900">{stats.avgScore}%</h3>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-indigo-600 p-8 rounded-3xl text-white shadow-xl shadow-indigo-200"
        >
          <h4 className="text-xl font-bold mb-1">Elite Templates</h4>
          <p className="text-indigo-100 text-sm mb-4">Unlock 20+ professional designs.</p>
          <Link to="/pricing" className="inline-block bg-white text-indigo-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all">
            Go Premium
          </Link>
        </motion.div>
      </div>

      <div className="mb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2 uppercase tracking-tight">
              Recent Resumes
              <span className={cn(
                "ml-4 px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] inline-flex items-center gap-2 align-middle",
                isPremium ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200" : "bg-slate-100 text-slate-500"
              )}>
                {isPremium ? (
                  <>
                    <Zap className="w-3 h-3 fill-current" />
                    Premium Plan
                  </>
                ) : (
                  "Free Plan"
                )}
              </span>
            </h2>
            <p className="text-slate-500 font-serif italic text-lg">Your latest career refinements.</p>
          </div>
          <div className="flex gap-4">
            <Link 
              to="/resumes"
              className="px-8 py-4 rounded-2xl font-bold text-slate-600 hover:text-indigo-600 transition-all active:scale-95 border border-slate-200 hover:border-indigo-600 flex items-center gap-2"
            >
              View All
            </Link>
            <Link 
              to="/templates"
              className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-900/10"
            >
              <Plus className="w-5 h-5" />
              New
            </Link>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1,2,3].map(i => (
            <div key={i} className="h-[450px] bg-slate-100 animate-pulse rounded-[2.5rem]" />
          ))}
        </div>
      ) : filteredResumes.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-[3rem] border-2 border-dashed border-slate-200 p-24 text-center"
        >
          <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-300">
            <FileText className="w-16 h-16" />
          </div>
          <h3 className="text-3xl font-bold text-slate-900 mb-3 uppercase tracking-tight">No Resumes</h3>
          <p className="text-slate-500 mb-10 max-w-sm mx-auto text-lg leading-relaxed font-serif italic">
            Your professional journey starts here. Create your first resume to see it on your dashboard.
          </p>
          <Link 
            to="/templates"
            className="inline-flex items-center gap-3 bg-indigo-600 text-white px-10 py-5 rounded-[2rem] font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200"
          >
            <Plus className="w-6 h-6" />
            Pick a Template
          </Link>
        </motion.div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredResumes.slice(0, 3).map((r) => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={r.id} 
                className="group bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all overflow-hidden flex flex-col"
              >
                {/* Visual Preview Area */}
                <div className="h-48 relative overflow-hidden group-hover:scale-105 transition-transform duration-700">
                  <TemplateThumbnail 
                    templateId={r.template || "modern"} 
                    title={r.content?.sections?.find((s: any) => s.type === 'personal')?.data?.fullName || r.title}
                    content={r.content}
                  />
                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 z-20">
                     <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/builder/${r.id}?preview=true`);
                      }}
                      className="p-4 bg-white text-slate-900 rounded-full shadow-lg hover:bg-indigo-600 hover:text-white transition-all transform translate-y-4 group-hover:translate-y-0 duration-300"
                      title="Quick Preview"
                    >
                      <Eye className="w-6 h-6" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/builder/${r.id}`);
                      }}
                      className="p-4 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-white hover:text-indigo-600 transition-all transform translate-y-4 group-hover:translate-y-0 duration-500"
                      title="Edit Resume"
                    >
                      <Pencil className="w-6 h-6" />
                    </button>
                  </div>
                  {/* ATS Badge */}
                  <div className={cn(
                    "absolute top-4 right-4 px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-md border shadow-sm z-20",
                    r.atsScore >= 90 ? "bg-emerald-500/90 text-white border-emerald-400" : "bg-white/95 text-slate-900 border-slate-200"
                  )}>
                    <Target className="w-3.5 h-3.5" />
                    {r.atsScore}% Ready
                  </div>
                </div>

                <div className="p-8 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex-1 cursor-pointer group/title" onClick={() => navigate(`/builder/${r.id}`)}>
                      <h4 className="text-xl font-bold text-slate-900 truncate mb-1 group-hover/title:text-indigo-600 transition-colors uppercase tracking-tight">{r.title}</h4>
                      <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                         <Type className="w-3 h-3 text-indigo-500" />
                         <span>{r.template || "Modern"} Template</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-1 relative z-30">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicate(r);
                        }}
                        className="p-2 text-slate-300 hover:text-indigo-600 transition-colors"
                        title="Duplicate"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(r.id);
                        }}
                        className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-50 mt-auto">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        Modified
                      </p>
                      <p className="text-[11px] font-bold text-slate-600">
                        {r.updatedAt?.toDate ? formatDistanceToNow(r.updatedAt.toDate()) : "Just now"} ago
                      </p>
                    </div>
                    <div className="space-y-1 text-right">
                       <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Created</p>
                       <p className="text-[11px] font-bold text-slate-500">
                         {r.createdAt?.toDate ? format(r.createdAt.toDate(), 'MMM dd, yyyy') : "Recently"}
                       </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-6 relative z-30">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/builder/${r.id}?download=true`);
                      }}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-900/10"
                    >
                      <Download className="w-4 h-4" />
                      PDF
                    </button>
                    <button 
                       onClick={(e) => {
                         e.stopPropagation();
                         navigate(`/builder/${r.id}?tab=design`);
                       }}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-50 text-indigo-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all active:scale-95 border border-indigo-100"
                    >
                      <Settings className="w-4 h-4" />
                      Manage
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* AI Audit & Notifications Grid */}
      <div className="mt-24 grid lg:grid-cols-3 gap-8">
        {/* Neural Career Engine */}
        <div className="lg:col-span-2 bg-slate-950 text-white rounded-[4rem] p-12 relative overflow-hidden group shadow-2xl shadow-indigo-500/10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 blur-[100px] rounded-full group-hover:bg-indigo-600/20 transition-all duration-700" />
          <div className="relative z-10">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/20 rounded-full mb-6 border border-indigo-500/30">
                <Zap className="w-4 h-4 text-indigo-400 fill-current" />
                <span className="text-xs font-black uppercase tracking-widest text-indigo-200">Neural Career Engine</span>
              </div>
              <h3 className="text-4xl lg:text-5xl font-black mb-6 leading-tight tracking-tight">Master your <br /><span className="text-indigo-400 italic font-serif">trajectory.</span></h3>
              <p className="text-slate-400 text-lg leading-relaxed mb-8 font-medium">
                Our neural engine scans industry benchmarks to ensure your profile outranks 98% of applicants. Boost your interview rate by up to 45%.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    if (resumes.length > 0) {
                      navigate(`/builder/${resumes[0].id}?tab=ai`);
                    } else {
                      navigate('/templates');
                    }
                  }}
                  className="bg-indigo-600 text-white px-10 py-5 rounded-[2.5rem] font-black text-lg hover:bg-indigo-700 transition-all hover:shadow-2xl hover:shadow-indigo-500/40 active:scale-95 flex items-center gap-3"
                >
                  <Zap className="w-5 h-5 fill-current" />
                  Launch Audit
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* System Notifications */}
        <div className="bg-white rounded-[4rem] p-10 border border-slate-200 flex flex-col shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Branding & News</h4>
            <span className="flex h-2.5 w-2.5 rounded-full bg-indigo-500 animate-pulse" />
          </div>
          
          <div className="space-y-8 flex-1">
            {[
              { 
                title: "SmartResume AI Team", 
                msg: "Your data is now secured with SmartResume AI infrastructure. All emails are dispatched via @smartresume.ai servers.",
                time: "Just now"
              },
              { 
                title: "Neural Engine Update", 
                msg: "Gemini 1.5 Flash integration complete. Resume analysis is now 3x faster.",
                time: "2h ago"
              },
              { 
                title: "Premium Access", 
                msg: "Enjoy priority processing and exclusive access to the 'Executive' template suite.",
                time: "6h ago"
              }
            ].map((n, i) => (
              <div key={i} className="group cursor-default">
                <div className="flex justify-between items-center mb-1.5">
                  <p className="text-xs font-black text-indigo-600 uppercase tracking-tighter text-[10px]">{n.title}</p>
                  <span className="text-[10px] font-bold text-slate-300 uppercase">{n.time}</span>
                </div>
                <p className="text-sm font-bold text-slate-600 leading-tight group-hover:text-slate-900 transition-colors">
                  {n.msg}
                </p>
              </div>
            ))}
          </div>

          <Link to="/support" className="mt-10 pt-8 border-t border-slate-100 flex items-center justify-between group">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-600 transition-colors">Contact Expert Support</span>
            <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
          </Link>
        </div>
      </div>
    </div>
  );
}
