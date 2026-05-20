import { auth, googleProvider, githubProvider, db } from "../lib/firebase";
import { 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult,
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail, 
  updateProfile, 
  sendEmailVerification 
} from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import { Sparkles, ArrowRight, Mail, Lock, User as UserIcon, Github, ChevronLeft } from "lucide-react";
import { useState, useEffect, type FormEvent } from "react";
import { cn } from "../lib/utils";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "../lib/firestoreErrorHandler";

export default function Login({ isSignup = false }: { isSignup?: boolean }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">(isSignup ? "signup" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Handle getRedirectResult on load to support redirect flows
  useEffect(() => {
    let active = true;
    const checkRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && active) {
          setLoading(true);
          const user = result.user;
          const userDoc = await getDoc(doc(db, "users", user.uid));
          let hasPlan = false;
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data && (data.subscription === "free" || data.subscription === "premium")) {
              hasPlan = true;
            }
          } else {
            try {
              await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || user.email?.split("@")[0] || "User",
                photoURL: user.photoURL,
                subscription: null,
                status: "active",
                emailVerified: user.emailVerified,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              });
            } catch (err) {
              handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}`);
            }
          }
          
          if (hasPlan) {
            navigate("/dashboard");
          } else {
            navigate("/pricing");
          }
        }
      } catch (error: any) {
        console.error("Redirect auth error:", error);
        if (active) {
          if (error.code === "auth/popup-closed-by-user") {
            setError("Authentication popup was closed before completing sign in. Please try again.");
          } else if (error.code === "auth/unauthorized-domain") {
            setError("Domain not authorized. Please add this domain to your Firebase Console under Authentication > Settings > Authorized domains.");
          } else {
            setError(error.message);
          }
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    checkRedirect();
    return () => {
      active = false;
    };
  }, [navigate]);

  const handleGithubLogin = async () => {
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, githubProvider);
      const user = result.user;
      
      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      let hasPlan = false;
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data && (data.subscription === "free" || data.subscription === "premium")) {
          hasPlan = true;
        }
      } else {
        try {
          await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email?.split("@")[0] || "GitHub User",
            photoURL: user.photoURL,
            subscription: null,
            status: "active",
            emailVerified: user.emailVerified,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}`);
        }
      }
      
      if (hasPlan) {
        navigate("/dashboard");
      } else {
        navigate("/pricing");
      }
    } catch (error: any) {
      console.error("Github login error:", error);
      if (error.code === "auth/popup-closed-by-user") {
        setError("Authentication popup was closed before completing sign in. Please try again.");
      } else if (error.code === "auth/popup-blocked") {
        setMessage("Popup blocked by your browser. Redirecting you to GitHub login...");
        try {
          await signInWithRedirect(auth, githubProvider);
        } catch (redirectErr: any) {
          setError(`Failed to redirect: ${redirectErr.message}`);
        }
      } else if (error.code === "auth/unauthorized-domain") {
        setError("Domain not authorized. Please add this domain to your Firebase Console under Authentication > Settings > Authorized domains.");
      } else {
        // Offer redirect fallback for other failures/closed popup / browser quirks
        setError(`${error.message || "Failed to authenticate via GitHub."}`);
        setMessage("Attempting fallback redirect login in 3 seconds...");
        setTimeout(async () => {
          try {
            await signInWithRedirect(auth, githubProvider);
          } catch (redirectErr: any) {
            setError(`Redirect fallback failed: ${redirectErr.message}`);
          }
        }, 3500);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      let hasPlan = false;
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data && (data.subscription === "free" || data.subscription === "premium")) {
          hasPlan = true;
        }
      } else {
        try {
          await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            subscription: null,
            status: "active",
            emailVerified: user.emailVerified,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}`);
        }
      }
      
      if (hasPlan) {
        navigate("/dashboard");
      } else {
        navigate("/pricing");
      }
    } catch (error: any) {
      if (error.code === "auth/unauthorized-domain") {
        setError("Domain not authorized. Please add this domain to your Firebase Console under Authentication > Settings > Authorized domains.");
      } else {
        setError(error.message);
      }
    }
  };

  const handleEmailAuth = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      if (mode === "signup") {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        const user = result.user;

        // Update profile with name
        await updateProfile(user, { displayName: name });

        // Create user document in Firestore
        try {
          await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            email: user.email,
            displayName: name,
            subscription: null,
            status: "active",
            emailVerified: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}`);
        }

        // Send verification email safely
        let emailSent = false;
        try {
          const actionCodeSettings = {
            url: window.location.origin + '/verify-email',
            handleCodeInApp: true,
          };
          await sendEmailVerification(user, actionCodeSettings);
          emailSent = true;
        } catch (verifyErr: any) {
          console.warn("In-app verification link failed to send: ", verifyErr);
          try {
            // Fallback to standard Firebase verification which doesn't check current origin configuration
            await sendEmailVerification(user);
            emailSent = true;
          } catch (stdVerifyErr: any) {
            console.error("Standard email verification failed too:", stdVerifyErr);
          }
        }

        if (emailSent) {
          setMessage("Account created and verification email sent! Please check your inbox.");
        } else {
          setMessage("Account created successfully! We couldn't deliver the verification email. You can verify your email later from your profile.");
        }
        
        // Wait a bit so they can see the message before navigating
        setTimeout(() => {
          navigate("/pricing");
        }, 2500);
      } else if (mode === "login") {
        const result = await signInWithEmailAndPassword(auth, email, password);
        const userDoc = await getDoc(doc(db, "users", result.user.uid));
        const data = userDoc.exists() ? userDoc.data() : null;
        const hasPlan = data && (data.subscription === "free" || data.subscription === "premium");
        if (hasPlan) {
          navigate("/dashboard");
        } else {
          navigate("/pricing");
        }
      } else {
        const actionCodeSettings = {
          url: window.location.origin + '/verify-email',
          handleCodeInApp: true,
        };
        await sendPasswordResetEmail(auth, email, actionCodeSettings);
        setMessage("Password reset email sent! Check your inbox.");
      }
    } catch (error: any) {
      // If it's a JSON error from handleFirestoreError, parse it for better display
      try {
        const jsonError = JSON.parse(error.message);
        setError(`Database Error: ${jsonError.error} (Path: ${jsonError.path})`);
      } catch {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white overflow-y-auto">
      {/* Left side - Visuals */}
      <div className="hidden lg:flex flex-1 bg-indigo-600 relative overflow-hidden flex-col justify-between p-12 text-white">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -ml-48 -mb-48" />
        
        <Link to="/" className="relative z-10 flex items-center gap-3">
          <div className="bg-white p-2 rounded-xl">
            <Sparkles className="w-6 h-6 text-indigo-600" />
          </div>
          <span className="font-bold text-2xl tracking-tight">SmartResume AI</span>
        </Link>

        <div className="relative z-10">
          <h1 className="text-7xl font-bold leading-tight mb-8">
            {mode === "signup" ? "Start your " : "Build your "}
            <span className="text-indigo-200 italic font-serif font-light">future</span> faster.
          </h1>
          <p className="text-indigo-100 text-lg max-w-md">
            Join thousands of professionals using AI to land their dream jobs with ATS-optimized resumes.
          </p>
        </div>

        <div className="relative z-10 text-xs uppercase tracking-widest text-indigo-300 font-medium">
          © 2026 SMARTRESUME AI — ALL RIGHTS RESERVED
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-8 lg:px-24 py-10 md:py-16">
        <div className="max-w-md w-full mx-auto">
          <div className="mb-12">
            {mode === "forgot" && (
              <button 
                onClick={() => setMode("login")}
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-indigo-600 mb-6 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to Login
              </button>
            )}
            <h2 className="text-4xl font-bold text-slate-900 mb-4 whitespace-nowrap">
              {mode === "login" ? "Welcome back" : mode === "signup" ? "Create account" : "Reset password"}
            </h2>
            <p className="text-slate-500">
              {mode === "login" ? "Sign in to continue building your profile." : 
               mode === "signup" ? "Create your professional career story today." :
               "Enter your email to receive a password reset link."}
            </p>
          </div>

          <div className="space-y-6">
            {mode !== "forgot" && (
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={handleGoogleLogin}
                  className="flex items-center justify-center gap-2 bg-white border border-slate-200 py-3.5 px-4 rounded-xl font-medium text-slate-700 hover:bg-slate-50 transition-all hover:shadow-lg active:scale-95 text-xs truncate"
                >
                  <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
                  Google
                </button>
                <button 
                  onClick={handleGithubLogin}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 bg-slate-900 border border-slate-900 py-3.5 px-4 rounded-xl font-medium text-white hover:bg-slate-800 transition-all hover:shadow-lg active:scale-95 text-xs truncate disabled:opacity-50"
                >
                  <Github className="w-4 h-4" />
                  GitHub
                </button>
              </div>
            )}

            {mode !== "forgot" && (
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-slate-100"></div>
                <span className="flex-shrink mx-4 text-slate-400 text-xs italic font-serif">or via email</span>
                <div className="flex-grow border-t border-slate-100"></div>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleEmailAuth}>
              {mode === "signup" && (
                <div className="space-y-1.5 flex flex-col">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Full Name</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      required
                      type="text" 
                      placeholder="John Doe" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 py-4 pl-12 pr-6 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-sm"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5 flex flex-col">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    required
                    type="email" 
                    placeholder="name@company.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 py-4 pl-12 pr-6 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-sm"
                  />
                </div>
              </div>

              {mode !== "forgot" && (
                <div className="space-y-1.5 flex flex-col">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Password</label>
                    {mode === "login" && (
                      <button 
                        type="button" 
                        onClick={() => setMode("forgot")}
                        className="text-[10px] font-bold text-indigo-600 hover:underline underline-offset-4"
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      required
                      type="password" 
                      placeholder="••••••••" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 py-4 pl-12 pr-6 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-sm"
                    />
                  </div>
                </div>
              )}

              {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
              {message && <p className="text-xs text-emerald-500 font-medium">{message}</p>}

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all hover:shadow-lg active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? "Please wait..." : mode === "login" ? "Sign In" : mode === "signup" ? "Create Account" : "Send Reset Link"}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          </div>

          <div className="mt-8 text-center text-sm font-medium">
            <p className="text-slate-400">
              {mode === "login" ? "Don't have an account? " : "Already have an account? "}
              <button 
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
                className="text-indigo-600 hover:underline underline-offset-4 font-bold"
              >
                {mode === "login" ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>

          <p className="mt-12 text-center text-[10px] text-slate-400 leading-relaxed max-w-xs mx-auto">
            By continuing, you agree to our <span className="text-slate-900 font-bold underline underline-offset-4 pointer-events-none">Terms of Service</span> and <span className="text-slate-900 font-bold underline underline-offset-4 pointer-events-none">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
