import { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { collection, query, where, deleteDoc, doc, addDoc, serverTimestamp, updateDoc, onSnapshot, orderBy } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { 
  Plus, 
  FileText, 
  Trash2, 
  Pencil, 
  Download, 
  Search,
  Copy,
  Eye,
  Type,
  Settings,
  Target,
  Clock,
  Zap,
  MoreVertical
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

function TemplateThumbnail({ templateId, title }: { templateId: string, title: string, content?: any }) {
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
      </div>
      <div className="mt-auto relative z-10 flex justify-between items-end">
        <div className="w-6 h-6 bg-white/20 rounded-lg" />
        <div className="text-[8px] font-black text-white/40 uppercase tracking-widest">{templateId}</div>
      </div>
    </div>
  );
}

export default function MyResumes() {
  const navigate = useNavigate();
  const { isPremium, loading: planLoading, hasPlan } = usePremiumStatus();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "score">("recent");

  useEffect(() => {
    if (!planLoading && !hasPlan) {
      navigate("/pricing");
    }
  }, [planLoading, hasPlan, navigate]);

  useEffect(() => {
    if (!auth.currentUser) return;

    setLoading(true);
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
      setLoading(false);
    }, (err) => {
      console.error("Resume fetch error:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth.currentUser]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this resume?")) return;
    try {
      await deleteDoc(doc(db, "resumes", id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `resumes/${id}`);
    }
  };

  const handleDuplicate = async (resume: Resume) => {
    try {
      const { id, ...data } = resume;
      await addDoc(collection(db, "resumes"), {
        ...data,
        title: `${resume.title} (Copy)`,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        userId: auth.currentUser?.uid
      });
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
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `resumes/${id}`);
    }
  };

  const filteredResumes = useMemo(() => {
    let result = resumes.filter(r => 
      r.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (sortBy === "score") {
      result.sort((a, b) => (b.atsScore || 0) - (a.atsScore || 0));
    }
    return result;
  }, [resumes, searchTerm, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">My Resumes</h1>
          <p className="text-slate-500 font-serif italic text-lg mt-1">Manage, edit, and refine your professional portfolio.</p>
        </div>
        <Link 
          to="/templates"
          className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-black transition-all active:scale-95 shadow-xl shadow-indigo-100"
        >
          <Plus className="w-5 h-5" />
          Create New Resume
        </Link>
      </div>

      {/* Search & Tabs */}
      <div className="bg-white p-4 rounded-[2.5rem] border border-slate-100 shadow-sm mb-10 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            placeholder="Search resumes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border-none pl-14 pr-6 py-4 rounded-2xl focus:ring-2 focus:ring-indigo-600/10 focus:bg-white transition-all font-medium"
          />
        </div>
        <div className="flex gap-2">
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-50 border-none px-6 py-4 rounded-2xl focus:ring-2 focus:ring-indigo-600/10 text-slate-600 text-xs font-black uppercase tracking-widest cursor-pointer"
          >
            <option value="recent">Recent First</option>
            <option value="score">Top ATS Score</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1,2,3].map(i => (
            <div key={i} className="h-96 bg-slate-100 animate-pulse rounded-[3rem]" />
          ))}
        </div>
      ) : filteredResumes.length === 0 ? (
        <div className="bg-white rounded-[4rem] border-2 border-dashed border-slate-200 p-20 text-center">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
            <FileText className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">No resumes created yet</h2>
          <p className="text-slate-500 mb-8 max-w-xs mx-auto font-serif italic text-lg leading-relaxed">
            Start building your career today with our AI-powered templates.
          </p>
          <Link 
            to="/templates"
            className="inline-flex items-center gap-3 bg-indigo-600 text-white px-10 py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-xl shadow-indigo-200"
          >
            <Plus className="w-5 h-5" />
            Build Your First Resume
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredResumes.map((r) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={r.id} 
                className="group bg-white rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all flex flex-col overflow-hidden"
              >
                {/* Preview Thumbnail */}
                <div className="h-56 relative overflow-hidden">
                  <TemplateThumbnail 
                    templateId={r.template || "modern"} 
                    title={r.content?.sections?.find((s: any) => s.type === 'personal')?.data?.fullName || r.title}
                  />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 z-10">
                     <button 
                      onClick={() => navigate(`/builder/${r.id}?preview=true`)}
                      className="p-4 bg-white text-slate-900 rounded-full shadow-lg hover:scale-110 transition-all"
                      title="Preview"
                    >
                      <Eye className="w-6 h-6" />
                    </button>
                    <button 
                      onClick={() => navigate(`/builder/${r.id}`)}
                      className="p-4 bg-indigo-600 text-white rounded-full shadow-lg hover:scale-110 transition-all"
                      title="Edit"
                    >
                      <Pencil className="w-6 h-6" />
                    </button>
                  </div>
                  {/* ATS Pill */}
                  <div className="absolute top-6 right-6 px-4 py-2 bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-white/50 z-20">
                    <div className="flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-indigo-600" />
                      <span className="text-xs font-black text-slate-900">{r.atsScore}%</span>
                    </div>
                  </div>
                </div>

                <div className="p-8 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors truncate max-w-[180px] uppercase tracking-tight">{r.title}</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">{r.template || "Modern"} Template</p>
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRename(r.id, r.title);
                        }} 
                        className="p-2 text-slate-300 hover:text-indigo-600 transition-all hover:scale-110"
                        title="Rename"
                      >
                        <Type className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicate(r);
                        }} 
                        className="p-2 text-slate-300 hover:text-indigo-600 transition-all hover:scale-110"
                        title="Duplicate"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(r.id);
                        }} 
                        className="p-2 text-slate-300 hover:text-rose-500 transition-all hover:scale-110"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50 mb-6">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Updated
                      </p>
                      <p className="text-xs font-bold text-slate-600">
                        {r.updatedAt?.toDate ? formatDistanceToNow(r.updatedAt.toDate()) : "Just now"} ago
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                      <p className="text-xs font-bold text-emerald-500">Ready</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-auto">
                    <button 
                      onClick={() => navigate(`/builder/${r.id}?download=true`)}
                      className="flex items-center justify-center gap-2 py-4 bg-slate-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-900/10"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                    <button 
                      onClick={() => navigate(`/builder/${r.id}`)}
                      className="flex items-center justify-center gap-2 py-4 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all border border-indigo-100"
                    >
                      <Pencil className="w-4 h-4" />
                      Edit
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
