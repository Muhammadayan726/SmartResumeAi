import { motion, AnimatePresence } from "motion/react";
import { X, Crown, Eye, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PremiumTemplateOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateId: string;
  templateName: string;
}

export function PremiumTemplateOptionsModal({ 
  isOpen, 
  onClose, 
  templateId, 
  templateName 
}: PremiumTemplateOptionsModalProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
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
            Proceed with {templateName}
          </h3>
          
          <p className="text-slate-500 mb-8 leading-relaxed text-sm">
            This premium design template can be previewed for free, or unlocked with an active Premium subscription.
          </p>

          <div className="flex flex-col gap-3">
            <button 
              onClick={() => {
                onClose();
                navigate(`/builder?template=${templateId}&preview=true`);
              }}
              className="w-full px-6 py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all text-sm flex items-center justify-center gap-2 shadow-lg"
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
            <button 
              onClick={() => {
                onClose();
                navigate("/pricing");
              }}
              className="w-full px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
            >
              Buy Premium
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

interface UpgradeToPremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateName: string;
}

export function UpgradeToPremiumModal({
  isOpen,
  onClose,
  templateName
}: UpgradeToPremiumModalProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl text-center relative overflow-hidden"
        >
          {/* Top light effects */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-500 via-indigo-500 to-amber-550" />
          
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Sparkles className="w-10 h-10" />
          </div>

          <h3 className="text-2xl font-black text-slate-900 mb-2 leading-tight">
            Upgrade to Premium <br />to Use This Template
          </h3>
          
          <p className="text-slate-500 mb-8 leading-relaxed text-sm">
            You cannot apply or build resumes with {templateName} until you have active Premium status.
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
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

interface ActivateFreePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
}

export function ActivateFreePlanModal({
  isOpen,
  onClose,
  message
}: ActivateFreePlanModalProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl text-center relative overflow-hidden"
        >
          {/* Top light effects */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500" />
          
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Sparkles className="w-10 h-10 animate-pulse" />
          </div>

          <h3 className="text-2xl font-black text-slate-900 mb-2 leading-tight">
            Please activate your Free Plan first.
          </h3>
          
          <p className="text-slate-500 mb-8 leading-relaxed text-sm">
            Before using templates or starting your resume, you must select and activate a workspace plan.
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
              Go to Pricing
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

