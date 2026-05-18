import { useState, FormEvent, ChangeEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Upload, CheckCircle2, ShieldCheck, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { db, auth } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { cn } from "../lib/utils";

import { handleFirestoreError, OperationType } from "../lib/firestoreErrorHandler";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
  amount: string;
}

export default function PaymentModal({ isOpen, onClose, planName, amount }: PaymentModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    txid: "",
    screenshot: "",
    screenshotUrl: ""
  });

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800000) { // Limit to ~800KB for Firestore
        setError("Image size too large. Please upload a smaller file (under 800KB).");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          screenshot: file.name,
          screenshotUrl: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    if (formData.txid.length < 8) {
      setError("Please enter a valid Transaction ID.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await addDoc(collection(db, "payments"), {
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        fullName: formData.fullName, // matches AdminDashboard expectation
        planName: planName,
        amount: parseFloat(amount.replace(/,/g, '')),
        transactionId: formData.txid,
        screenshotUrl: formData.screenshotUrl,
        method: "jazzcash",
        status: "pending",
        createdAt: serverTimestamp(),
      });
      setSuccess(true);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, "payments");
      setError("Failed to submit request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative bg-white w-[94%] sm:w-full max-w-xl rounded-[2.5rem] sm:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-8 sm:right-8 p-2 sm:p-3 hover:bg-slate-100 rounded-xl sm:rounded-2xl text-slate-400 transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {success ? (
          <div className="p-8 sm:p-16 text-center overflow-y-auto custom-scrollbar">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-emerald-50 rounded-2xl sm:rounded-[2rem] flex items-center justify-center mx-auto mb-6 sm:mb-8 text-emerald-600">
              <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-4">Verification Sent</h2>
            <p className="text-slate-500 mb-8 sm:mb-10 leading-relaxed text-base sm:text-lg font-serif italic">
              We've received your {planName} plan payment request. Our team will verify your transaction (TXID: {formData.txid}) and activate your premium access within 2 hours.
            </p>
            <button 
              onClick={onClose}
              className="w-full bg-slate-950 text-white py-5 rounded-[2rem] font-bold text-lg hover:bg-indigo-600 transition-all shadow-xl"
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="p-8 sm:p-12 pb-0">
               <div className="flex items-center gap-3 mb-4 sm:mb-6">
                  <div className="p-2.5 sm:p-3 bg-indigo-50 text-indigo-600 rounded-xl sm:rounded-2xl">
                    <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">Upgrade to {planName}</h2>
               </div>

               <div className="flex gap-2 sm:gap-4 p-1 bg-slate-100 rounded-xl sm:rounded-2xl mb-6 sm:mb-8">
                  <button 
                    onClick={() => setStep(1)}
                    className={cn(
                      "flex-1 py-2 sm:py-3 text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-lg sm:rounded-xl transition-all",
                      step === 1 ? "bg-white text-slate-900 shadow-sm" : "text-slate-400"
                    )}
                  >
                    1. Send Payment
                  </button>
                  <button 
                    onClick={() => setStep(2)}
                    className={cn(
                      "flex-1 py-2 sm:py-3 text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-lg sm:rounded-xl transition-all",
                      step === 2 ? "bg-white text-slate-900 shadow-sm" : "text-slate-400"
                    )}
                  >
                    2. Submit Proof
                  </button>
               </div>
            </div>

            <div className="p-8 sm:p-12 pt-0 overflow-y-auto custom-scrollbar flex-1">
              {step === 1 ? (
                <div className="space-y-6 sm:space-y-8">
                  <div className="bg-slate-900 rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-10 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/20 rounded-full -mr-16 -mt-16 blur-2xl" />
                    <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-2">Manual JazzCash Payment</p>
                    <h3 className="text-2xl sm:text-3xl font-black mb-4 sm:mb-6 leading-tight">Send Rs. {amount} <br /> to JazzCash</h3>
                    <div className="space-y-2 sm:space-y-3">
                       <div className="flex justify-between items-center bg-white/5 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-white/5">
                          <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 tracking-wider">Account Name</span>
                          <span className="font-bold text-xs sm:text-sm">Saima Bibi</span>
                       </div>
                       <div className="flex justify-between items-center bg-white/5 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-white/5">
                          <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 tracking-wider">Number</span>
                          <span className="font-bold text-base sm:text-lg tracking-tighter">0301-4523780</span>
                       </div>
                    </div>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                     <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-400">Follow these steps:</p>
                     <ul className="space-y-2 sm:space-y-3">
                        {[
                          "Open your JazzCash App",
                          "Send the exact amount for your plan",
                          "Keep a screenshot of the receipt",
                          "Note down the 12-digit TXID"
                        ].map((item, i) => (
                          <li key={i} className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-slate-600 font-medium">
                            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
                            {item}
                          </li>
                        ))}
                     </ul>
                  </div>

                  <button 
                    onClick={() => setStep(2)}
                    className="w-full bg-slate-950 text-white py-4 sm:py-5 rounded-2xl sm:rounded-[2rem] font-bold text-base sm:text-lg hover:bg-indigo-600 transition-all shadow-xl flex items-center justify-center gap-3"
                  >
                    I've Sent the Payment
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                  <div className="space-y-1 sm:space-y-2">
                    <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 ml-3 sm:ml-4">Full Name</label>
                    <input 
                      required
                      value={formData.fullName}
                      onChange={e => setFormData({...formData, fullName: e.target.value})}
                      placeholder="Enter your name"
                      className="w-full px-6 sm:px-8 py-4 sm:py-5 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl sm:rounded-3xl transition-all outline-none"
                    />
                  </div>

                  <div className="space-y-1 sm:space-y-2">
                    <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 ml-3 sm:ml-4">Transaction ID (TXID)</label>
                    <input 
                      required
                      value={formData.txid}
                      onChange={e => setFormData({...formData, txid: e.target.value})}
                      placeholder="12-digit JazzCash ID"
                      className="w-full px-6 sm:px-8 py-4 sm:py-5 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl sm:rounded-3xl transition-all outline-none"
                    />
                  </div>

                  <div className="space-y-1 sm:space-y-2">
                    <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 ml-3 sm:ml-4">Screenshot Proof</label>
                    <div className="relative group">
                       <input 
                         type="file"
                         accept="image/*"
                         className="hidden"
                         id="photo-upload"
                         onChange={handleFileChange}
                       />
                       <label 
                         htmlFor="photo-upload"
                         className="flex flex-col items-center justify-center gap-3 sm:gap-4 w-full h-32 sm:h-40 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl sm:rounded-3xl cursor-pointer group-hover:border-indigo-600 group-hover:bg-indigo-50/30 transition-all"
                       >
                          <div className="p-2 sm:p-3 bg-white rounded-xl sm:rounded-2xl shadow-sm text-slate-400 group-hover:text-indigo-600">
                            <Upload className="w-5 h-5 sm:w-6 sm:h-6" />
                          </div>
                          <p className="text-[9px] sm:text-[10px] font-black text-slate-400 group-hover:text-indigo-600 uppercase tracking-widest">
                            {formData.screenshot || "Upload digital receipt"}
                          </p>
                       </label>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-3 sm:p-4 bg-red-50 text-red-600 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-bold">
                      <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      {error}
                    </div>
                  )}

                  <div className="flex gap-2 sm:gap-4 pt-2">
                    <button 
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 px-4 sm:px-8 py-3.5 sm:py-5 bg-slate-100 text-slate-600 rounded-xl sm:rounded-[2rem] font-bold text-sm sm:text-base hover:bg-slate-200 transition-all"
                    >
                      Back
                    </button>
                    <button 
                      disabled={loading}
                      type="submit"
                      className="flex-[2] bg-indigo-600 text-white py-3.5 sm:py-5 rounded-xl sm:rounded-[2rem] font-black text-base sm:text-lg hover:bg-indigo-700 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2 sm:gap-3"
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          Submit Now
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
