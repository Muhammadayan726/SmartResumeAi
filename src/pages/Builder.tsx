import { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate, useSearchParams } from "react-router-dom";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { 
  Save, 
  Eye, 
  Settings, 
  Layout as LayoutIcon, 
  Plus, 
  Trash2, 
  ChevronUp, 
  ChevronDown,
  Sparkles,
  Download,
  Share2,
  ChevronLeft,
  Search,
  Type,
  Palette,
  FileText,
  Briefcase,
  GraduationCap,
  Award,
  Link as LinkIcon,
  Globe,
  Star,
  Users,
  Target,
  BookOpen,
  Heart,
  FolderLock
} from "lucide-react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";

import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

// Types
type SectionType = 
  | 'personal' 
  | 'summary' 
  | 'experience' 
  | 'education' 
  | 'skills' 
  | 'projects' 
  | 'certifications' 
  | 'languages' 
  | 'awards' 
  | 'achievements' 
  | 'references' 
  | 'interests' 
  | 'publications' 
  | 'volunteer' 
  | 'internships' 
  | 'social' 
  | 'portfolio' 
  | 'custom';

interface ResumeSection {
  id: string;
  type: SectionType;
  title: string;
  data: any;
}

interface ResumeContent {
  sections: ResumeSection[];
}

const SECTION_LABELS: Record<string, { label: string, icon: any }> = {
  experience: { label: "Work Experience", icon: Briefcase },
  education: { label: "Education", icon: GraduationCap },
  skills: { label: "Skills", icon: Star },
  projects: { label: "Projects", icon: Target },
  certifications: { label: "Certifications", icon: Award },
  languages: { label: "Languages", icon: Globe },
  awards: { label: "Awards", icon: Award },
  achievements: { label: "Achievements", icon: Star },
  references: { label: "References", icon: Users },
  interests: { label: "Interests", icon: Heart },
  publications: { label: "Publications", icon: BookOpen },
  volunteer: { label: "Volunteer Work", icon: Users },
  internships: { label: "Internships", icon: Briefcase },
  social: { label: "Social Links", icon: LinkIcon },
  portfolio: { label: "Portfolio", icon: FolderLock },
  summary: { label: "Professional Summary", icon: Type },
  custom: { label: "Custom Section", icon: FileText }
};

import { usePremiumStatus } from "../hooks/usePremiumStatus";
import { Crown, Lock } from "lucide-react";
import { handleFirestoreError, OperationType } from "../lib/firestoreErrorHandler";

// ... (keep types and labels)

const initialContent: ResumeContent = {
  sections: [
    { 
      id: "personal", 
      type: "personal", 
      title: "Personal Info", 
      data: { fullName: "", email: "", phone: "", location: "", website: "", jobTitle: "" } 
    },
    { 
      id: "skills", 
      type: "skills", 
      title: "Skills", 
      data: [] 
    }
  ]
};

export default function Builder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isPremium, loading: planLoading, hasPlan } = usePremiumStatus();

  // Onboarding guard
  useEffect(() => {
    // Only apply guard if not in preview mode and not loading
    if (!planLoading && !hasPlan && !window.location.search.includes("preview=true")) {
      navigate("/pricing");
    }
  }, [planLoading, hasPlan, navigate]);
  const [content, setContent] = useState<ResumeContent>(initialContent);
  const [title, setTitle] = useState("Untitled Resume");
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("content"); // content, design, ai
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [currentTemplate, setCurrentTemplate] = useState("modern");
  
  // AI Status
  const [aiLoading, setAiLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [jd, setJd] = useState("");
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [matchFeedback, setMatchFeedback] = useState<string>("");
  const [showAddSection, setShowAddSection] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize data
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const templateId = params.get("template");
    const isPreview = params.get("preview") === "true";
    const shouldDownload = params.get("download") === "true";
    const requestedTab = params.get("tab");

    setIsPreviewMode(isPreview);
    if (requestedTab && ["content", "design", "ai"].includes(requestedTab)) {
      setActiveTab(requestedTab);
    }
    
    if (templateId) setCurrentTemplate(templateId);

    if (id) {
      const fetchResume = async () => {
        const docRef = doc(db, "resumes", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Migration check for old data structure
          if (data.content && !data.content.sections) {
            const old = data.content;
            const migrated: ResumeContent = {
              sections: ([
                { id: "personal", type: "personal", title: "Personal Info", data: old.personalInfo || initialContent.sections[0].data },
                { id: "summary", type: "summary", title: "Summary", data: old.summary || "" },
                { id: "experience", type: "experience", title: "Experience", data: old.experience || [] },
                { id: "education", type: "education", title: "Education", data: old.education || [] },
                { id: "skills", type: "skills", title: "Skills", data: old.skills || [] },
              ] as ResumeSection[]).filter(s => {
                if (Array.isArray(s.data)) return s.data.length > 0;
                if (typeof s.data === 'string') return s.data.length > 0;
                return true;
              })
            };
            setContent(migrated);
          } else {
            setContent(data.content || initialContent);
          }
          setTitle(data.title);
          if (data.template) setCurrentTemplate(data.template);
        }
        setLoading(false);
      };
      fetchResume();
    } else if (templateId) {
      setTitle(`${templateId.charAt(0).toUpperCase() + templateId.slice(1)} Resume`);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [id]);

  // Handle automatic download from query param
  useEffect(() => {
    if (!loading && searchParams.get("download") === "true") {
      // Small delay to ensure DOM is rendered
      const timer = setTimeout(() => {
        handleDownload();
        // Remove the parameter to avoid re-triggering on state changes
        const newParams = new URLSearchParams(window.location.search);
        newParams.delete("download");
        navigate(`${window.location.pathname}?${newParams.toString()}`, { replace: true });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, id]);

  // Auto-save
  useEffect(() => {
    if (!id || loading) return;

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

    autoSaveTimerRef.current = setTimeout(() => {
      handleSave();
    }, 3000);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [content, title, id, loading]);

  const handleSave = async () => {
    if (!auth.currentUser) return;
    setSaving(true);
    const resumeId = id || Math.random().toString(36).substring(7);
    try {
      await setDoc(doc(db, "resumes", resumeId), {
        userId: auth.currentUser.uid,
        title,
        content,
        template: currentTemplate,
        updatedAt: serverTimestamp(),
        atsScore: matchScore || 85,
        ...(id ? {} : { createdAt: serverTimestamp() })
      }, { merge: true });
      if (!id) navigate(`/builder/${resumeId}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `resumes/${resumeId}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAiGenerateSummary = async () => {
    if (!isPremium) {
      navigate("/pricing");
      return;
    }
    const personalSection = content.sections.find(s => s.type === 'personal');
    const expSection = content.sections.find(s => s.type === 'experience');
    const skillsSection = content.sections.find(s => s.type === 'skills');

    setAiLoading(true);
    try {
      const resp = await fetch("/api/ai/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          jobTitle: personalSection?.data.jobTitle || "Professional", 
          experience: expSection?.data?.map((e: any) => e.description).join(". ") || "",
          skills: skillsSection?.data || []
        })
      });
      const data = await resp.json();
      if (data.summary) {
        setContent(prev => {
          const sections = [...prev.sections];
          const summaryIdx = sections.findIndex(s => s.type === 'summary');
          if (summaryIdx > -1) {
            sections[summaryIdx].data = data.summary.trim();
          } else {
            sections.push({ id: "summary", type: "summary", title: "Professional Summary", data: data.summary.trim() });
          }
          return { ...prev, sections };
        });
      }
    } catch (err) {
      console.error("AI Gen Failed", err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleDownload = async () => {
    const element = document.getElementById("resume-preview");
    if (!element) return;
    
    setDownloading(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        onclone: (clonedDoc) => {
          // Workaround for html2canvas failing on oklch() colors
          // We'll replace problematic Tailwind 4 styles in the clone
          const styleTags = clonedDoc.getElementsByTagName('style');
          for (let i = 0; i < styleTags.length; i++) {
            const style = styleTags[i];
            if (style.innerHTML.includes('oklch')) {
              // Simple replacement for common indigo/slate oklch variants
              // In a real scenario we'd do a more robust regex replacement
              style.innerHTML = style.innerHTML.replace(/oklch\([^)]+\)/g, '#4f46e5'); 
            }
          }
        }
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });
      
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${title.replace(/\s+/g, "_")}.pdf`);
    } catch (error) {
      console.error("PDF generation failed", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const handleAiJobMatch = async () => {
    if (!isPremium) {
      navigate("/pricing");
      return;
    }
    if (!jd.trim()) return;
    setAiLoading(true);
    try {
      const resp = await fetch("/api/ai/analyze-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          resume: JSON.stringify(content),
          jobDescription: jd
        })
      });
      const data = await resp.json();
      setMatchScore(data.score);
      setMatchFeedback(data.feedback);
    } catch (err) {
      console.error("AI Match Analysis Failed", err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert("Link copied to clipboard!");
  };

  const addSection = (type: SectionType) => {
    const newSection: ResumeSection = {
      id: Math.random().toString(36).substring(7),
      type,
      title: SECTION_LABELS[type]?.label || "New Section",
      data: type === 'experience' || type === 'education' || type === 'projects' || type === 'certifications' || type === 'volunteer' || type === 'internships' 
        ? [] 
        : type === 'personal'
        ? { fullName: "", email: "", phone: "", location: "", website: "", jobTitle: "" }
        : type === 'skills' || type === 'languages' || type === 'awards' || type === 'achievements' || type === 'interests' || type === 'social' || type === 'publications' || type === 'references'
        ? []
        : ""
    };
    
    // Add first item if it's a list type
    if (type === 'experience') newSection.data = [{ id: "1", company: "", position: "", duration: "", description: "" }];
    if (type === 'education') newSection.data = [{ id: "1", school: "", degree: "", duration: "" }];
    if (type === 'projects') newSection.data = [{ id: "1", title: "", link: "", description: "" }];

    setContent(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
    setShowAddSection(false);
  };

  const removeSection = (id: string) => {
    setContent(prev => ({
      ...prev,
      sections: prev.sections.filter(s => s.id !== id)
    }));
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...content.sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSections.length) return;
    
    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;
    
    setContent(prev => ({ ...prev, sections: newSections }));
  };

  const togglePreviewMode = () => {
    setIsPreviewMode(!isPreviewMode);
  };

  const updateSectionData = (sectionId: string, newData: any) => {
    setContent(prev => ({
      ...prev,
      sections: prev.sections.map(s => s.id === sectionId ? { ...s, data: newData } : s)
    }));
  };

  const updateSectionTitle = (sectionId: string, newTitle: string) => {
    setContent(prev => ({
      ...prev,
      sections: prev.sections.map(s => s.id === sectionId ? { ...s, title: newTitle } : s)
    }));
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      <p className="font-bold text-slate-600 animate-pulse">Initializing Smart Builder...</p>
    </div>
  );

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-slate-50">
      {/* Builder Header */}
      {!isPreviewMode && (
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm z-30">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
              <ChevronLeft className="w-5 h-5 text-slate-500" />
            </Link>
            <div className="flex flex-col">
              <input 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                className="font-bold text-sm text-slate-900 border-none focus:ring-0 p-0 w-48"
              />
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Auto-saving locally...</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsPreviewMode(true)}
              className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors"
              title="Full Preview"
            >
              <Eye className="w-5 h-5" />
            </button>
            <div className="h-8 w-px bg-slate-200 mx-1" />
            <button 
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Resume"}
            </button>
            <div className="h-8 w-px bg-slate-200 mx-1" />
            <button 
              onClick={handleDownload}
              disabled={downloading}
              className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50"
              title="Download PDF"
            >
              {downloading ? <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /> : <Download className="w-5 h-5" />}
            </button>
            <button 
              onClick={handleShare}
              className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors"
              title="Share Link"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </header>
      )}

      <div className="flex-1 flex overflow-hidden relative">
        <AnimatePresence>
          {isPreviewMode && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-auto"
            >
              <button 
                onClick={() => setIsPreviewMode(false)}
                className="bg-slate-900 text-white px-6 py-3 rounded-full font-bold shadow-2xl flex items-center gap-2 hover:bg-indigo-600 transition-all active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
                Exit Preview
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sidebar Controls */}
        {!isPreviewMode && (
          <div className="w-16 bg-white border-r border-slate-200 flex flex-col items-center py-6 gap-6 z-20">
            <button 
              onClick={() => setActiveTab("content")}
              className={cn("p-3 rounded-xl transition-all", activeTab === "content" ? "bg-indigo-50 text-indigo-600" : "text-slate-400 hover:text-slate-600")}
            >
              <FileText className="w-6 h-6" />
            </button>
            <button 
              onClick={() => setActiveTab("design")}
              className={cn("p-3 rounded-xl transition-all", activeTab === "design" ? "bg-indigo-50 text-indigo-600" : "text-slate-400 hover:text-slate-600")}
            >
              <LayoutIcon className="w-6 h-6" />
            </button>
            <button 
              onClick={() => setActiveTab("ai")}
              className={cn("p-3 rounded-xl transition-all", activeTab === "ai" ? "bg-indigo-50 text-indigo-600" : "text-slate-400 hover:text-slate-600")}
            >
              <Sparkles className="w-6 h-6" />
            </button>
            <div className="mt-auto">
              <button className="p-3 text-slate-400 hover:text-slate-600">
                <Settings className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}

        {/* Editor Area */}
        {!isPreviewMode && (
          <div className="w-[450px] bg-white border-r border-slate-200 overflow-y-auto custom-scrollbar shadow-inner z-10">
            <div className="p-8 pb-32">
            <AnimatePresence mode="wait">
              {activeTab === "content" && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-12"
                >
                  {content.sections.map((section, sIdx) => (
                    <section key={section.id} className="space-y-6 relative group/section pb-6 border-b border-slate-50 last:border-0">
                      {/* Section Header */}
                      <div className="flex justify-between items-center bg-white/50 sticky top-0 py-2 backdrop-blur-sm z-10">
                        <div className="flex items-center gap-3">
                          {section.type === 'custom' ? (
                            <input 
                              value={section.title}
                              onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                              className="text-xl font-bold text-slate-900 border-none p-0 focus:ring-0 w-48 bg-transparent"
                              placeholder="Section Name"
                            />
                          ) : (
                            <h3 className="text-xl font-bold text-slate-900">{section.title}</h3>
                          )}
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover/section:opacity-100 transition-opacity">
                          <button 
                            onClick={() => moveSection(sIdx, 'up')}
                            disabled={sIdx === 0}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 disabled:opacity-20"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => moveSection(sIdx, 'down')}
                            disabled={sIdx === content.sections.length - 1}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 disabled:opacity-20"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => removeSection(section.id)}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 ml-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Section Content Editor */}
                      {section.type === 'personal' && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5 flex flex-col">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Full Name</label>
                            <input 
                              value={section.data.fullName}
                              onChange={(e) => updateSectionData(section.id, { ...section.data, fullName: e.target.value })}
                              className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none"
                            />
                          </div>
                          <div className="space-y-1.5 flex flex-col">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Job Title</label>
                            <input 
                              value={section.data.jobTitle}
                              onChange={(e) => updateSectionData(section.id, { ...section.data, jobTitle: e.target.value })}
                              className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none"
                              placeholder="e.g. Senior Product Designer"
                            />
                          </div>
                          <div className="space-y-1.5 flex flex-col col-span-2">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email</label>
                            <input 
                              value={section.data.email}
                              onChange={(e) => updateSectionData(section.id, { ...section.data, email: e.target.value })}
                              className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none"
                            />
                          </div>
                          <div className="space-y-1.5 flex flex-col">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phone</label>
                            <input 
                              value={section.data.phone}
                              onChange={(e) => updateSectionData(section.id, { ...section.data, phone: e.target.value })}
                              className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none"
                            />
                          </div>
                          <div className="space-y-1.5 flex flex-col">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Location</label>
                            <input 
                              value={section.data.location}
                              onChange={(e) => updateSectionData(section.id, { ...section.data, location: e.target.value })}
                              className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none"
                            />
                          </div>
                        </div>
                      )}

                      {section.type === 'summary' && (
                        <div className="space-y-4">
                           <button 
                            onClick={handleAiGenerateSummary}
                            disabled={aiLoading}
                            className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-all disabled:opacity-50"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            {aiLoading ? "Generating..." : "Generate with AI"}
                          </button>
                          <textarea 
                            value={section.data}
                            onChange={(e) => updateSectionData(section.id, e.target.value)}
                            rows={4}
                            className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-sm leading-relaxed focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none"
                            placeholder="Brief professional overview..."
                          />
                        </div>
                      )}

                      {['experience', 'education', 'projects', 'certifications', 'volunteer', 'internships'].includes(section.type) && (
                        <div className="space-y-4">
                          {section.data.map((item: any, idx: number) => (
                            <div key={item.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4 relative group/item">
                              <button 
                                onClick={() => {
                                  const newData = section.data.filter((d: any) => d.id !== item.id);
                                  updateSectionData(section.id, newData);
                                }}
                                className="absolute top-4 right-4 opacity-0 group-hover/item:opacity-100 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <div className="space-y-4">
                                <input 
                                  placeholder={section.type === 'experience' ? "Company" : section.type === 'education' ? "School" : section.type === 'projects' ? "Project Title" : "Title / Org"}
                                  value={item.company || item.school || item.title || ""}
                                  onChange={(e) => {
                                    const newData = [...section.data];
                                    if (section.type === 'experience') newData[idx].company = e.target.value;
                                    else if (section.type === 'education') newData[idx].school = e.target.value;
                                    else newData[idx].title = e.target.value;
                                    updateSectionData(section.id, newData);
                                  }}
                                  className="bg-transparent font-bold text-slate-900 outline-none w-full"
                                />
                                <div className="grid grid-cols-2 gap-4">
                                  <input 
                                    placeholder={section.type === 'experience' ? "Position" : section.type === 'education' ? "Degree" : "Role / Subtitle"}
                                    value={item.position || item.degree || item.role || ""}
                                    onChange={(e) => {
                                      const newData = [...section.data];
                                      if (section.type === 'experience') newData[idx].position = e.target.value;
                                      else if (section.type === 'education') newData[idx].degree = e.target.value;
                                      else newData[idx].role = e.target.value;
                                      updateSectionData(section.id, newData);
                                    }}
                                    className="bg-white p-2 rounded-lg text-xs outline-none"
                                  />
                                  <input 
                                    placeholder="Duration / Date"
                                    value={item.duration || ""}
                                    onChange={(e) => {
                                      const newData = [...section.data];
                                      newData[idx].duration = e.target.value;
                                      updateSectionData(section.id, newData);
                                    }}
                                    className="bg-white p-2 rounded-lg text-xs outline-none"
                                  />
                                </div>
                                {(section.type === 'experience' || section.type === 'projects' || section.type === 'volunteer' || section.type === 'internships') && (
                                  <textarea 
                                    placeholder="Brief description..."
                                    value={item.description || ""}
                                    onChange={(e) => {
                                      const newData = [...section.data];
                                      newData[idx].description = e.target.value;
                                      updateSectionData(section.id, newData);
                                    }}
                                    rows={2}
                                    className="w-full bg-white p-3 rounded-xl text-xs leading-relaxed outline-none"
                                  />
                                )}
                              </div>
                            </div>
                          ))}
                          <button 
                            onClick={() => {
                              const newItem = { id: Math.random().toString(), company: "", position: "", duration: "", description: "", school: "", degree: "", title: "", role: "" };
                              updateSectionData(section.id, [...section.data, newItem]);
                            }}
                            className="w-full py-2 border-2 border-dashed border-slate-100 rounded-xl text-slate-400 hover:border-indigo-100 hover:text-indigo-600 transition-all text-xs font-bold flex items-center justify-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Add Item
                          </button>
                        </div>
                      )}

                      {(['skills', 'languages', 'interests', 'awards', 'achievements', 'social'].includes(section.type) || section.type === 'custom') && !Array.isArray(section.data[0]) && (
                        <div className="space-y-4">
                          <div className="flex flex-wrap gap-2">
                            {Array.isArray(section.data) && section.data.map((tag: string, tidx: number) => (
                              <span key={tidx} className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 group/tag">
                                {tag}
                                <button 
                                  onClick={() => updateSectionData(section.id, section.data.filter((_: any, i: number) => i !== tidx))}
                                  className="hover:text-red-500 opacity-0 group-hover/tag:opacity-100 transition-opacity"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                          <div className="relative">
                            <Plus className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  const val = (e.target as HTMLInputElement).value.trim();
                                  if (val) {
                                    const current = Array.isArray(section.data) ? section.data : [];
                                    updateSectionData(section.id, [...current, val]);
                                    (e.target as HTMLInputElement).value = "";
                                  }
                                }
                              }}
                              placeholder="Add item & press Enter..."
                              className="w-full bg-slate-50 border border-slate-100 py-3 pl-12 pr-6 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all text-sm"
                            />
                          </div>
                        </div>
                      )}
                    </section>
                  ))}

                  {/* Add Section Button */}
                  <div className="pt-4 pb-12 relative">
                    <button 
                      onClick={() => setShowAddSection(!showAddSection)}
                      className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
                    >
                      <Plus className="w-5 h-5" />
                      Add Section
                    </button>

                    <AnimatePresence>
                      {showAddSection && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute bottom-full left-0 right-0 mb-4 bg-white border border-slate-100 shadow-2xl rounded-3xl p-6 grid grid-cols-2 gap-2 z-40 max-h-[400px] overflow-y-auto custom-scrollbar"
                        >
                          <h4 className="col-span-2 text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2 px-3">Select Section to Add</h4>
                          {Object.entries(SECTION_LABELS).map(([type, info]) => (
                            <button 
                              key={type}
                              onClick={() => addSection(type as SectionType)}
                              className="text-left p-3 rounded-2xl hover:bg-indigo-50/50 text-xs font-bold text-slate-600 hover:text-indigo-600 transition-all flex items-center gap-3 border border-transparent hover:border-indigo-100"
                            >
                              <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-indigo-100/50 transition-colors">
                                <info.icon className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                              </div>
                              {info.label}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}

      {activeTab === "design" && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-10"
                >
                  <section className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                       Templates
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { id: "modern", name: "Modern", color: "bg-indigo-600" },
                        { id: "minimal", name: "Minimal", color: "bg-slate-900" },
                        { id: "tech", name: "Tech", color: "bg-emerald-600" },
                        { id: "creative", name: "Creative", color: "bg-fuchsia-600" },
                        { id: "executive", name: "Executive", color: "bg-amber-600" },
                        { id: "student", name: "Student", color: "bg-sky-600" },
                        { id: "professional", name: "Corporate", color: "bg-slate-800" },
                        { id: "designer", name: "Designer", color: "bg-rose-500" },
                      ].map(tpl => (
                        <button 
                          key={tpl.id}
                          onClick={() => setCurrentTemplate(tpl.id)}
                          className={cn(
                            "flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all group",
                            currentTemplate === tpl.id ? "border-indigo-600 bg-indigo-50" : "border-slate-100 bg-slate-50 hover:border-slate-200"
                          )}
                        >
                          <div className={cn("w-full aspect-[3/4] rounded-lg shadow-sm group-hover:shadow-md transition-shadow flex items-center justify-center overflow-hidden relative")}>
                             <div className={cn("absolute inset-0 opacity-20", tpl.color)} />
                             <LayoutIcon className={cn("w-8 h-8", currentTemplate === tpl.id ? "text-indigo-600" : "text-slate-400")} />
                          </div>
                          <span className={cn("text-[10px] font-black uppercase tracking-widest", currentTemplate === tpl.id ? "text-indigo-600" : "text-slate-500")}>
                            {tpl.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </section>
                </motion.div>
              )}

              {activeTab === "ai" && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <h3 className="text-xl font-bold text-slate-900">AI Assistant</h3>
                  <div className="space-y-4">
                    <div className="p-6 bg-indigo-600 rounded-[2rem] text-white overflow-hidden relative">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16" />
                      <p className="text-sm font-medium mb-4 text-indigo-100 italic">"I can help you optimize your resume for specific job descriptions. Paste one below!"</p>
                      <textarea 
                        value={jd}
                        onChange={(e) => setJd(e.target.value)}
                        placeholder="Paste target job description here..."
                        className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-xs text-white placeholder:text-white/40 focus:outline-none mb-4 min-h-[120px]"
                      />
                      <button 
                        onClick={handleAiJobMatch}
                        disabled={aiLoading || !jd.trim()}
                        className="w-full bg-white text-indigo-600 py-3 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {aiLoading ? <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        Analyze Match Score
                      </button>
                    </div>

                    {matchScore !== null && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-6 bg-emerald-50 border border-emerald-100 rounded-2xl"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Match Score</span>
                          <span className="text-2xl font-black text-emerald-600">{matchScore}%</span>
                        </div>
                        <div className="w-full h-2 bg-emerald-100 rounded-full overflow-hidden mb-4">
                          <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${matchScore}%` }} />
                        </div>
                        <p className="text-xs text-emerald-800 leading-relaxed font-medium">{matchFeedback}</p>
                      </motion.div>
                    )}
                    
                    <div className="grid grid-cols-1 gap-3">
                      <button 
                        onClick={handleAiGenerateSummary}
                        disabled={aiLoading}
                        className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/5 transition-all text-left"
                      >
                        <div>
                          <p className="text-sm font-bold text-slate-900">Suggest Global Summary</p>
                          <p className="text-[10px] text-slate-400">Based on your entire document</p>
                        </div>
                        <Sparkles className="w-5 h-5 text-indigo-600" />
                      </button>
                      <button 
                        className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/5 transition-all text-left"
                      >
                        <div>
                          <p className="text-sm font-bold text-slate-900">Improve Language</p>
                          <p className="text-[10px] text-slate-400">Scan for power verbs (Coming soon)</p>
                        </div>
                        <Settings className="w-5 h-5 text-slate-300" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Preview Area */}
        <div className="flex-1 bg-slate-200 overflow-y-auto p-12 flex justify-center shadow-inner relative">
          <div className="sticky top-0 z-10 w-full flex justify-center mb-8 pointer-events-none">
            <div className="bg-white/80 backdrop-blur px-4 py-2 rounded-full shadow-lg border border-white/50 flex gap-4 pointer-events-auto">
              <button 
                onClick={() => setPreviewMode("desktop")}
                className={cn("p-1.5 rounded-lg transition-colors", previewMode === "desktop" ? "bg-indigo-600 text-white" : "text-slate-400")}
              >
                <Eye className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setPreviewMode("mobile")}
                className={cn("p-1.5 rounded-lg transition-colors", previewMode === "mobile" ? "bg-indigo-600 text-white" : "text-slate-400")}
              >
                <LayoutIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div 
            id="resume-preview"
            className={cn(
              "bg-white shadow-2xl transition-all duration-500 ease-in-out font-sans overflow-hidden",
              previewMode === "desktop" ? "w-[210mm] min-h-[297mm]" : "w-[375px] min-h-[667px]"
            )}
          >
            {/* Dynamic Content Preview */}
            <div className={cn(
              "flex flex-col h-full bg-white",
              currentTemplate === 'tech' && "font-mono",
              currentTemplate === 'minimal' && "tracking-tight",
              currentTemplate === 'elegant' && "font-serif"
            )}>
              {content.sections.map((section) => {
                if (section.type === 'personal') {
                  const data = section.data;
                  if (currentTemplate === 'minimal') {
                    return (
                      <div key={section.id} className="p-12 border-b-2 border-slate-900 text-center">
                        {data.fullName && <h1 className="text-5xl font-black text-slate-900 mb-4 tracking-tighter uppercase">{data.fullName}</h1>}
                        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                          {[data.jobTitle, data.email, data.phone].filter(Boolean).map((item, i, arr) => (
                            <span key={i} className="flex items-center gap-4">
                              {item}
                              {i < arr.length - 1 && <span>•</span>}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  if (currentTemplate === 'tech') {
                    return (
                      <div key={section.id} className="bg-emerald-950 text-emerald-400 p-12 border-b-4 border-emerald-500">
                         <div className="flex justify-between items-end">
                            <div>
                               <div className="text-emerald-500 text-[10px] mb-2 font-mono">{"> "} SYSTEM_USER_PROMPT</div>
                               <h1 className="text-4xl font-bold uppercase">{data.fullName || "GUEST_USER"}</h1>
                               {data.jobTitle && <div className="text-emerald-500/60 text-sm mt-1">{data.jobTitle}</div>}
                            </div>
                            <div className="text-right text-[10px] space-y-1">
                               {data.email && <p>{data.email}</p>}
                               {data.phone && <p>{data.phone}</p>}
                               {data.location && <p>{data.location}</p>}
                            </div>
                         </div>
                      </div>
                    );
                  }

                  if (currentTemplate === 'creative') {
                    return (
                      <div key={section.id} className="p-12 bg-fuchsia-600 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -mr-32 -mt-32 blur-3xl" />
                        {data.fullName && <h1 className="text-6xl font-black mb-2 relative z-10">{data.fullName}</h1>}
                        {data.jobTitle && <p className="text-2xl font-medium opacity-80 relative z-10">{data.jobTitle}</p>}
                        <div className="mt-8 flex flex-wrap gap-6 text-xs font-bold relative z-10">
                           {data.email && <span>{data.email}</span>}
                           {data.phone && <span>{data.phone}</span>}
                           {data.location && <span>{data.location}</span>}
                        </div>
                      </div>
                    );
                  }

                  if (currentTemplate === 'executive') {
                    return (
                      <div key={section.id} className="p-16 border-b border-slate-200">
                         <div className="max-w-3xl mx-auto text-center space-y-6">
                            {data.fullName && <h1 className="text-4xl font-serif text-slate-900 border-y py-4 border-slate-900">{data.fullName}</h1>}
                            <div className="flex flex-wrap justify-center gap-8 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                               {data.email && <span>{data.email}</span>}
                               {data.phone && <span>{data.phone}</span>}
                               {data.location && <span>{data.location}</span>}
                            </div>
                         </div>
                      </div>
                    );
                  }

                  if (currentTemplate === 'student') {
                    return (
                      <div key={section.id} className="p-12 bg-sky-600 text-white">
                        {data.fullName && <h1 className="text-4xl font-bold mb-2">{data.fullName}</h1>}
                        {data.jobTitle && <p className="text-sky-100 text-lg">{data.jobTitle}</p>}
                        <div className="mt-4 flex flex-wrap gap-4 text-xs opacity-80">
                           {data.email && <span>{data.email}</span>}
                           {data.phone && <span>{data.phone}</span>}
                           {data.location && <span>{data.location}</span>}
                        </div>
                      </div>
                    );
                  }

                  if (currentTemplate === 'designer') {
                    return (
                      <div key={section.id} className="p-12 bg-white border-l-8 border-rose-500">
                        {data.fullName && <h1 className="text-5xl font-black text-slate-900 mb-2 tracking-tighter">{data.fullName}</h1>}
                        {data.jobTitle && <p className="text-rose-500 text-xl font-medium mb-6">{data.jobTitle}</p>}
                        <div className="flex flex-wrap gap-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                           {data.email && <span>{data.email}</span>}
                           {data.phone && <span>{data.phone}</span>}
                           {data.location && <span>{data.location}</span>}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={section.id} className={cn(
                      "p-12",
                      currentTemplate === 'professional' ? "bg-slate-800 text-white" : "bg-slate-900 text-white"
                    )}>
                      <div className="flex justify-between items-start">
                        <div>
                          {data.fullName && <h1 className="text-4xl font-bold tracking-tight mb-2 uppercase">{data.fullName}</h1>}
                          {data.jobTitle && <p className="text-indigo-400 text-lg font-medium">{data.jobTitle}</p>}
                        </div>
                        <div className="text-right text-xs space-y-1 text-slate-300">
                          {data.email && <p className="flex items-center justify-end gap-2">{data.email}</p>}
                          {data.phone && <p className="flex items-center justify-end gap-2">{data.phone}</p>}
                          {data.location && <p className="flex items-center justify-end gap-2">{data.location}</p>}
                        </div>
                      </div>
                    </div>
                  );
                }

                // Skip sections with no data
                const hasData = Array.isArray(section.data) 
                  ? section.data.some(item => {
                      if (typeof item === 'object') {
                        return Object.values(item).some(v => v && v !== "");
                      }
                      return item && item !== "";
                    })
                  : (typeof section.data === 'string' ? section.data.trim().length > 0 : !!section.data);

                if (!hasData) return null;

                return (
                  <div key={section.id} className={cn(
                    "px-12 py-8",
                    currentTemplate === 'executive' && "max-w-3xl mx-auto w-full"
                  )}>
                    <h2 className={cn(
                      "text-xs font-black uppercase tracking-[0.2em] mb-6 pb-1",
                      currentTemplate === 'tech' ? "text-emerald-600 border-l-4 border-emerald-500 pl-4" : 
                      currentTemplate === 'minimal' ? "text-slate-900 border-b-2 border-slate-900 inline-block" :
                      currentTemplate === 'creative' ? "text-fuchsia-600 underline decoration-4 underline-offset-8" :
                      currentTemplate === 'executive' ? "text-slate-900 border-b border-slate-200 block text-center" :
                      currentTemplate === 'student' ? "text-sky-600 border-b-2 border-sky-400 inline-block" :
                      currentTemplate === 'designer' ? "text-rose-500 border-l-4 border-rose-500 pl-4 uppercase" :
                      "text-slate-900 border-b-2 border-indigo-600 inline-block"
                    )}>
                      {section.title}
                    </h2>

                    {section.type === 'summary' && (
                      <p className={cn(
                        "text-slate-600 text-[11px] leading-relaxed whitespace-pre-wrap",
                        currentTemplate === 'tech' && "font-mono text-emerald-800",
                        currentTemplate === 'executive' && "text-center italic"
                      )}>{section.data}</p>
                    )}

                    {['experience', 'education', 'projects', 'certifications', 'volunteer', 'internships'].includes(section.type) && (
                      <div className="space-y-8">
                        {section.data.map((item: any) => {
                          const hasItemData = Object.values(item).some(v => v && v !== "" && v !== item.id);
                          if (!hasItemData) return null;

                          return (
                            <div key={item.id} className="group">
                              <div className={cn(
                                "flex justify-between items-start mb-2",
                                currentTemplate === 'executive' && "flex-col md:flex-row"
                              )}>
                                <div>
                                  <h4 className={cn(
                                    "font-bold text-slate-900 text-sm",
                                    currentTemplate === 'tech' && "text-emerald-900",
                                    currentTemplate === 'executive' && "text-base font-serif"
                                  )}>
                                    {item.company || item.school || item.title || "Untitled Item"}
                                  </h4>
                                  <p className={cn(
                                    "text-[10px] font-bold",
                                    currentTemplate === 'tech' ? "text-emerald-600" : 
                                    currentTemplate === 'creative' ? "text-fuchsia-500" :
                                    currentTemplate === 'student' ? "text-sky-500" :
                                    currentTemplate === 'designer' ? "text-rose-400 font-black italic" :
                                    "text-indigo-600"
                                  )}>
                                    {item.position || item.degree || item.role || ""}
                                  </p>
                                </div>
                                {item.duration && <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.duration}</span>}
                              </div>
                              {item.description && (
                                <p className={cn(
                                  "text-[10px] text-slate-500 leading-relaxed whitespace-pre-wrap mt-2",
                                  currentTemplate === 'tech' ? "border-l border-emerald-100 pl-4 font-mono" : 
                                  "border-l border-slate-100 pl-4"
                                )}>
                                  {item.description}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {(['skills', 'languages', 'interests', 'awards', 'achievements', 'social'].includes(section.type) || section.type === 'custom') && Array.isArray(section.data) && (
                      <div className={cn(
                        "flex flex-wrap gap-2",
                        currentTemplate === 'executive' && "justify-center"
                      )}>
                        {section.data.map((tag: string, tidx: number) => (
                          <span key={tidx} className={cn(
                            "px-3 py-1.5 text-[10px] font-black uppercase tracking-widest",
                            currentTemplate === 'tech' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                            currentTemplate === 'creative' ? "bg-fuchsia-50 text-fuchsia-600 rounded-full" :
                            currentTemplate === 'minimal' ? "bg-white text-slate-900 border-2 border-slate-900" :
                            currentTemplate === 'student' ? "bg-sky-50 text-sky-600 rounded-lg" :
                            currentTemplate === 'designer' ? "bg-rose-50 text-rose-600 border-b-2 border-rose-500" :
                            "bg-slate-50 text-slate-600 border border-slate-100 rounded-xl"
                          )}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  );
}
