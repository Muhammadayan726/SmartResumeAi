import { motion, AnimatePresence } from "motion/react";
import { X, Crown, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PremiumRestrictionModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
}

export default function PremiumRestrictionModal({ isOpen, onClose, featureName }: PremiumRestrictionModalProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl text-center relative overflow-hidden"
        >
          {/* Top light effects */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 via-indigo-500 to-fuchsia-500" />
          
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Crown className="w-10 h-10 fill-current" />
          </div>

          <h3 className="text-2xl font-black text-slate-900 mb-2">
            {featureName ? `Unlock ${featureName}` : "Upgrade to Premium to Access This Feature"}
          </h3>
          
          <p className="text-slate-500 mb-8 leading-relaxed text-sm">
            This premium template or AI optimization feature is currently locked. Upgrade to our Premium Plan to unlock unlimited resumes, premium templates, and full AI Resume generation.
          </p>

          <div className="flex gap-4">
            <button 
              onClick={onClose}
              className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all text-sm"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                onClose();
                navigate("/pricing");
              }}
              className="flex-1 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
            >
              Buy Premium
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
