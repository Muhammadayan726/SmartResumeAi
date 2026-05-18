import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Filter, Sparkles, Star, Layout, Eye, ArrowRight, X, Lock } from "lucide-react";
import { cn } from "../lib/utils";

import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../lib/firebase";
import { usePremiumStatus } from "../hooks/usePremiumStatus";
import { Crown } from "lucide-react";

const TEMPLATE_CATEGORIES = [
  "All",
  "Modern",
  "Professional",
  "Minimal",
  "Creative",
  "Executive",
  "Student",
  "Tech",
  "Designer"
];

const templates = [
  { id: "modern", name: "Modern Professional", category: "Modern", premium: false },
  { id: "minimal", name: "Clean Minimalist", category: "Minimal", premium: false },
  { id: "tech", name: "Tech Focused", category: "Tech", premium: true },
  { id: "creative", name: "Designer Portfolio", category: "Creative", premium: true },
  { id: "executive", name: "Executive Suite", category: "Executive", premium: true },
  { id: "student", name: "Entry Level", category: "Student", premium: false },
  { id: "professional", name: "Corporate Gold", category: "Professional", premium: true },
  { id: "designer", name: "Studio Minimal", category: "Designer", premium: true }
];

function TemplateThumbnail({ id }: { id: string }) {
  const isTech = id === 'tech';
  const isMinimal = id === 'minimal';
  const isCreative = id === 'creative';
  const isExecutive = id === 'executive';
  const isProfessional = id === 'professional';

  return (
    <div className={cn(
      "w-full h-full bg-white flex flex-col overflow-hidden origin-top",
      isTech && "font-mono bg-emerald-950",
      isExecutive && "font-serif"
    )} style={{ fontSize: '4px' }}>
      {/* Header Preview */}
      {id === 'modern' && (
        <div className="bg-slate-900 p-4 shrink-0">
          <div className="h-4 w-1/2 bg-white/20 rounded-full mb-2" />
          <div className="h-2 w-1/3 bg-indigo-400/40 rounded-full" />
        </div>
      )}
      {isProfessional && (
        <div className="bg-slate-800 p-4 shrink-0">
          <div className="h-4 w-1/2 bg-white/20 rounded-full mb-2" />
          <div className="h-2 w-1/3 bg-indigo-400/40 rounded-full" />
        </div>
      )}
      {isMinimal && (
        <div className="p-8 text-center border-b border-slate-900 shrink-0">
          <div className="h-6 w-3/4 bg-slate-900 mx-auto rounded-sm mb-4" />
          <div className="flex justify-center gap-2">
            <div className="h-1 w-8 bg-slate-200" />
            <div className="h-1 w-8 bg-slate-200" />
            <div className="h-1 w-8 bg-slate-200" />
          </div>
        </div>
      )}
      {isTech && (
        <div className="p-4 bg-emerald-950 border-b border-emerald-500 shrink-0">
          <div className="h-4 w-1/2 bg-emerald-400/50 rounded-sm mb-2" />
          <div className="h-2 w-1/3 bg-emerald-700/50 rounded-sm" />
        </div>
      )}
      {isCreative && (
        <div className="p-6 bg-fuchsia-600 shrink-0">
          <div className="h-6 w-2/3 bg-white rounded-sm mb-2" />
          <div className="h-3 w-1/2 bg-white/40 rounded-sm" />
        </div>
      )}
      {isExecutive && (
        <div className="p-8 border-b border-slate-200 shrink-0">
          <div className="h-5 w-2/3 bg-slate-900 mx-auto rounded-sm mb-4 border-y border-slate-900" />
          <div className="flex justify-center gap-2">
            <div className="h-1 w-8 bg-slate-400" />
            <div className="h-1 w-8 bg-slate-400" />
          </div>
        </div>
      )}
      {id === 'student' && (
         <div className="p-6 bg-sky-600 shrink-0">
           <div className="h-5 w-2/3 bg-white rounded-sm mb-2" />
           <div className="h-2 w-1/2 bg-white/40 rounded-sm" />
         </div>
      )}
      {id === 'designer' && (
         <div className="p-6 bg-rose-500 shrink-0">
           <div className="h-5 w-2/3 bg-white rounded-sm mb-2" />
           <div className="h-2 w-1/2 bg-white/40 rounded-sm" />
         </div>
      )}

      {/* Body Preview */}
      <div className="p-4 space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="space-y-1">
             <div className={cn(
               "h-1.5 w-12 mb-2",
               isTech ? "bg-emerald-500" : 
               isCreative ? "bg-fuchsia-400" :
               "bg-indigo-600"
             )} />
             <div className="flex justify-between items-center">
               <div className="h-2 w-20 bg-slate-200 rounded-px" />
               <div className="h-1.5 w-10 bg-slate-100 rounded-px" />
             </div>
             <div className="space-y-1">
               <div className="h-1.5 w-full bg-slate-50" />
               <div className="h-1.5 w-5/6 bg-slate-50" />
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Templates() {
  const [user] = useAuthState(auth);
  const { isPremium } = usePremiumStatus();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "free" | "premium">("all");

  const filteredTemplates = useMemo(() => {
    return templates.filter(tpl => {
      const matchesSearch = tpl.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           tpl.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "All" || tpl.category === selectedCategory;
      const matchesType = filterType === "all" || (filterType === "free" ? !tpl.premium : tpl.premium);
      
      return matchesSearch && matchesCategory && matchesType;
    });
  }, [searchTerm, selectedCategory, filterType]);

  const handleUseTemplate = (tpl: typeof templates[0]) => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (tpl.premium && !isPremium) {
      navigate("/pricing");
      return;
    }

    navigate(`/builder?template=${tpl.id}`);
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-24">
      {/* Header */}
      <section className="bg-white border-b border-slate-200 pt-20 pb-16 px-8 lg:px-24">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-12">
            <div className="max-w-2xl">
              <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tight mb-6">
                Pick your <br /><span className="text-indigo-600 italic">career canvas.</span>
              </h1>
              <p className="text-xl text-slate-500 max-w-lg">
                Curated by HR experts and design nerds. All templates are ATS-optimized and fully editable.
              </p>
            </div>
            <div className="flex flex-col gap-4 w-full md:w-auto">
              <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100 shadow-inner">
                <div className="relative flex-1 md:flex-none">
                  <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 pr-4 py-3 bg-transparent text-sm font-medium focus:outline-none w-full md:w-64" 
                    placeholder="Search blueprints..." 
                  />
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full transition-colors"
                    >
                      <X className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                  )}
                </div>
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn(
                    "flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all border",
                    showFilters ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  )}
                >
                  <Filter className="w-4 h-4" />
                  Filter
                </button>
              </div>

              <AnimatePresence>
                {showFilters && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex gap-2 p-2 bg-white rounded-2xl border border-slate-100 shadow-xl"
                  >
                    {(["all", "free", "premium"] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => setFilterType(type)}
                        className={cn(
                          "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                          filterType === type ? "bg-indigo-50 text-indigo-600" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex flex-nowrap md:flex-wrap gap-2 lg:gap-4 overflow-x-auto md:overflow-visible pb-4 md:pb-0 custom-scrollbar">
             {TEMPLATE_CATEGORIES.map(cat => (
               <button 
                key={cat} 
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-6 lg:px-8 py-3 rounded-2xl text-sm font-bold transition-all whitespace-nowrap border-2",
                  cat === selectedCategory 
                    ? "bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-200" 
                    : "bg-white text-slate-500 border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30"
                )}
              >
                 {cat}
               </button>
             ))}
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="px-8 lg:px-24 py-16">
        <div className="max-w-7xl mx-auto">
          {filteredTemplates.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 lg:gap-12">
              <AnimatePresence mode="popLayout">
                {filteredTemplates.map((tpl, i) => (
                  <motion.div 
                    layout
                    key={tpl.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: i * 0.05 }}
                    className="group bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden hover:shadow-2xl hover:shadow-indigo-500/10 transition-all flex flex-col h-full relative"
                  >
                    <div className="relative aspect-[3.5/4.5] overflow-hidden bg-slate-100">
                      <TemplateThumbnail id={tpl.id} />
                      
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center gap-4 backdrop-blur-[4px] p-8">
                         <h4 className="text-white text-xl font-black text-center mb-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">{tpl.name}</h4>
                         <Link 
                          to={user ? `/builder?template=${tpl.id}&preview=true` : "/login"} 
                          className="bg-white/10 text-white border border-white/20 px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-white hover:text-slate-900 transition-all w-full justify-center active:scale-95"
                         >
                           <Eye className="w-4 h-4" />
                           Live Preview
                         </Link>
                         <button 
                          onClick={() => handleUseTemplate(tpl)}
                          className={cn(
                            "px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all w-full justify-center active:scale-95",
                            tpl.premium && !isPremium ? "bg-amber-600 text-white hover:bg-amber-500" : "bg-indigo-600 text-white hover:bg-indigo-500"
                          )}
                         >
                           {tpl.premium && !isPremium && <Lock className="w-3 h-3" />}
                           {tpl.premium && !isPremium ? "Unlock Premium" : "Use Template"}
                         </button>
                      </div>

                      {tpl.premium && (
                        <div className={cn(
                          "absolute top-6 right-6 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 border border-white/10",
                          isPremium ? "bg-indigo-900/40 text-indigo-400" : "bg-slate-900/40 text-amber-400"
                        )}>
                          {isPremium ? <Crown className="w-3 h-3" /> : <Star className="w-3 h-3 fill-current" />}
                          Premium
                        </div>
                      )}
                    </div>
                    
                    <div className="p-8 flex flex-col flex-1">
                      <div className="text-[10px] uppercase font-black tracking-[0.2em] text-indigo-500 mb-2">{tpl.category}</div>
                      <h3 className="text-xl font-black text-slate-900 mb-6">{tpl.name}</h3>
                      <div className="mt-auto pt-8 border-t border-slate-50 flex items-center justify-between text-slate-400">
                        <div className="flex items-center gap-2 ">
                          <Layout className="w-4 h-4" />
                          <span className="text-[10px] font-black uppercase tracking-widest">ATS Ready</span>
                        </div>
                        <ArrowRight className="w-5 h-5 group-hover:text-indigo-600 transform group-hover:translate-x-2 transition-all duration-500" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-32 text-center"
            >
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-300">
                <Search className="w-12 h-12" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">No templates found</h3>
              <p className="text-slate-500">We couldn't find anything matching your filters. Try a different search!</p>
              <button 
                onClick={() => { setSearchTerm(""); setSelectedCategory("All"); setFilterType("all"); }}
                className="mt-8 text-indigo-600 font-bold hover:underline"
              >
                Clear all filters
              </button>
            </motion.div>
          )}
        </div>
      </section>

      {/* CTA section with same style */}
      <section className="px-8 lg:px-24">
         <div className="max-w-7xl mx-auto bg-slate-950 rounded-[4rem] p-24 text-center text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] -mr-64 -mt-64 group-hover:bg-indigo-600/30 transition-colors duration-1000" />
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-5xl lg:text-6xl font-black mb-8 leading-tight">Need a <span className="text-indigo-400">custom design?</span></h2>
              <p className="text-slate-400 text-xl leading-relaxed mb-12">Our design team can craft a bespoke blueprint tailored to your specific industry or personal brand. Stand out from the crowd.</p>
              <button className="bg-indigo-600 text-white px-10 py-5 rounded-[2rem] font-black text-lg hover:bg-indigo-700 transition-all hover:shadow-2xl hover:shadow-indigo-500/20 active:scale-x-95">
                Join Design Waitlist
              </button>
            </div>
         </div>
      </section>
    </div>
  );
}
