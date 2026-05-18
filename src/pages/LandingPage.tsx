import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle, 
  PenTool, 
  Target, 
  Search, 
  Briefcase, 
  Cpu,
  Star
} from "lucide-react";
import { cn } from "../lib/utils";

const features = [
  {
    title: "AI Resume Writer",
    desc: "Generate professional summaries and achievements in seconds with Gemini AI.",
    icon: PenTool,
    color: "bg-blue-500"
  },
  {
    title: "ATS Optimizer",
    desc: "Get score analysis and keyword suggestions to beat applicant tracking systems.",
    icon: Target,
    color: "bg-indigo-500"
  },
  {
    title: "Expert Templates",
    desc: "Choose from 20+ professional, ATS-friendly templates designed by recruiters.",
    icon: Sparkles,
    color: "bg-purple-500"
  },
  {
    title: "Live Preview",
    desc: "Watch your resume update in real-time as you edit content and styles.",
    icon: Search,
    color: "bg-pink-500"
  }
];

const steps = [
  { id: "01", title: "Input Details", desc: "Add your basic info, work history, and skills." },
  { id: "02", title: "AI Generation", desc: "Let Gemini craft high-impact bullet points." },
  { id: "03", title: "Choose Design", desc: "Pick a professional template and customize colors." },
  { id: "04", title: "Ready to Apply", desc: "Download as high-quality PDF in one click." }
];

export default function LandingPage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative h-[calc(100vh-64px)] grid lg:grid-cols-2">
        <div className="flex flex-col justify-center px-8 lg:px-24">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full mb-8">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">New: Gemini 1.5 Powered</span>
            </div>
            <h1 className="text-6xl lg:text-7xl font-bold leading-tight tracking-tight mb-8 text-slate-900">
              Create Professional <br />
              <span className="text-indigo-600 font-serif italic font-light">AI-Powered</span> Resumes <br />
              in Minutes.
            </h1>
            <p className="text-xl text-slate-600 mb-10 max-w-lg leading-relaxed">
              Fast resume creation with professional, recruiter-tested templates. Start building your future today.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link 
                to="/signup"
                className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold text-lg flex items-center gap-2 hover:bg-indigo-700 transition-all hover:shadow-xl hover:-translate-y-1 active:scale-95"
              >
                Build Resume
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link 
                to="/templates"
                className="bg-white border-2 border-slate-200 text-slate-900 px-8 py-4 rounded-2xl font-bold text-lg hover:border-slate-300 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                View Templates
              </Link>
              <Link 
                to="/templates"
                className="bg-slate-100 text-slate-600 px-6 py-4 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all active:scale-95 flex items-center justify-center"
              >
                Try Demo
              </Link>
            </div>
            
            <div className="mt-12 flex items-center gap-6">
              <div className="flex -space-x-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?u=${i}`} alt="user" />
                  </div>
                ))}
              </div>
              <div className="text-sm">
                <div className="flex items-center gap-1 text-yellow-500 mb-0.5">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 fill-current" />)}
                </div>
                <p className="font-semibold text-slate-900">Trusted by 10k+ users</p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="hidden lg:flex bg-slate-50 items-center justify-center relative overflow-hidden p-12">
          {/* Abstract visual decor */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 border border-slate-300 rounded-2xl rotate-12" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 border border-indigo-300 rounded-2xl -rotate-6" />
          </div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
            animate={{ opacity: 1, scale: 1, rotate: 2 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="w-full max-w-lg bg-white rounded-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.12)] p-10 relative z-10 border border-slate-100"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="space-y-1.5">
                <div className="h-4 w-32 bg-slate-100 rounded-full" />
                <div className="h-4 w-24 bg-slate-100 rounded-full opacity-50" />
              </div>
              <div className="w-12 h-12 bg-indigo-50 rounded-xl" />
            </div>
            <div className="space-y-6">
              {[1,2,3].map(i => (
                <div key={i} className="space-y-3">
                  <div className="h-3 w-1/4 bg-slate-100 rounded-full" />
                  <div className="h-3 w-full bg-slate-50 rounded-full" />
                  <div className="h-3 w-3/4 bg-slate-50 rounded-full" />
                </div>
              ))}
              <div className="pt-8 border-t border-slate-100 flex justify-between items-center">
                <div className="h-4 w-20 bg-indigo-50 rounded-full" />
                <div className="h-4 w-32 bg-indigo-600 rounded-full" />
              </div>
            </div>
            
            {/* AI badge override */}
            <div className="absolute -top-4 -right-4 bg-slate-900 text-white p-4 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce">
              <Cpu className="w-5 h-5 text-indigo-400" />
              <span className="text-sm font-bold tracking-tight">AI Optimization Active</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 px-8 lg:px-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6 tracking-tight">Everything you need to <br />get hired.</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">Our tools are designed to give you a competitive edge in today's competitive job market.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((f, idx) => (
              <motion.div 
                key={f.title}
                whileHover={{ y: -8 }}
                className="p-8 rounded-3xl bg-slate-50 border border-slate-100 transition-all hover:bg-white hover:shadow-2xl hover:shadow-indigo-500/10"
              >
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6 text-white", f.color)}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{f.title}</h3>
                <p className="text-slate-600 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works (Recipe 5 inspired headers) */}
      <section className="py-32 bg-slate-900 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-8 lg:px-24">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-24 gap-8">
            <h2 className="text-5xl lg:text-7xl font-bold tracking-tight">From blank page <br /><span className="text-indigo-400">to dream job.</span></h2>
            <p className="text-slate-400 text-xl max-w-md">Our streamlined process takes the stress out of resume writing, so you can focus on interviewing.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
            {steps.map((step) => (
              <div key={step.id} className="relative group">
                <div className="text-6xl font-serif italic text-white/10 mb-6 transition-colors group-hover:text-indigo-500/20">{step.id}</div>
                <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                <p className="text-slate-400 leading-relaxed">{step.desc}</p>
                {step.id !== "04" && (
                  <div className="hidden lg:block absolute top-[15%] -right-8 text-white/5">
                    <ArrowRight className="w-12 h-12" />
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-32 text-center">
            <Link 
              to="/signup"
              className="inline-flex items-center gap-2 text-indigo-400 font-bold text-2xl hover:text-indigo-300 transition-colors group"
            >
              Get started for free
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-32 px-8 lg:px-24">
        <div className="max-w-4xl mx-auto text-center bg-indigo-600 rounded-[3rem] p-16 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -ml-32 -mb-32" />
          
          <div className="relative z-10">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-8">Ready to land that interview?</h2>
            <Link 
              to="/signup"
              className="bg-white text-indigo-600 px-10 py-5 rounded-2xl font-bold text-xl hover:bg-slate-50 transition-all hover:shadow-2xl active:scale-95 inline-block shadow-lg shadow-indigo-900/50"
            >
              Build Professional Resume
            </Link>
          </div>
        </div>
      </section>

      <footer className="py-12 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-8 lg:px-24 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 grayscale brightness-0 opacity-40">
            <Sparkles className="w-5 h-5" />
            <span className="font-bold text-lg">SmartResume AI</span>
          </div>
          <div className="flex gap-8 text-sm font-medium text-slate-400">
            <Link to="#" className="hover:text-slate-900">Privacy</Link>
            <Link to="#" className="hover:text-slate-900">Terms</Link>
            <Link to="/support" className="hover:text-slate-900">Support</Link>
            <Link to="#" className="hover:text-slate-900">Blog</Link>
          </div>
          <div className="text-sm text-slate-400 font-bold uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
            SmartResume AI Team
          </div>
        </div>
      </footer>
    </div>
  );
}
