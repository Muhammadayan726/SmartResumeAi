/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { type ReactNode, useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "./lib/firebase";
import { AlertCircle, LogOut } from "lucide-react";
import { motion } from "motion/react";

// Pages
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import MyResumes from "./pages/MyResumes";
import Builder from "./pages/Builder";
import AdminDashboard from "./pages/AdminDashboard";
import Login from "./pages/Login";
import Templates from "./pages/Templates";
import Pricing from "./pages/Pricing";
import Profile from "./pages/Profile";
import VerifyEmail from "./pages/VerifyEmail";
import Support from "./pages/Support";
import Navbar from "./components/Navbar";
import MobileNav from "./components/MobileNav";
import PlanGuard from "./components/PlanGuard";

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }: { children: ReactNode; adminOnly?: boolean }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        try {
          const userDocRef = doc(db, "users", u.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.status === "blocked") {
              setIsBlocked(true);
            }
            if (u.email === "03004292351muhammadayan@gmail.com") {
              setIsAdmin(true);
            }

            // Sync verification status to Firestore for admin visibility
            if (u.emailVerified && data.emailVerified !== true) {
              await updateDoc(userDocRef, { emailVerified: true });
            }
          }
        } catch (err) {
          console.error("Failed to fetch user status", err);
        }
      } else {
        setUser(null);
        setIsAdmin(false);
        setIsBlocked(false);
      }
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
       <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
       <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] animate-pulse">Checking credentials...</p>
    </div>
  );

  if (!user) return <Navigate to="/login" />;

  if (isBlocked) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-white max-w-md w-full rounded-[2.5rem] p-12 text-center shadow-2xl"
        >
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
            <AlertCircle className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Access Denied</h2>
          <p className="text-slate-500 font-medium mb-10 leading-relaxed italic font-serif">
            "Your account has been suspended. Please contact support if you believe this is a mistake."
          </p>
          <button 
            onClick={() => auth.signOut()}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </motion.div>
      </div>
    );
  }

  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" />;

  return <>{children}</>;
};

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24 md:pb-0">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Login isSignup />} />
            <Route 
              path="/templates" 
              element={
                <ProtectedRoute>
                  <PlanGuard>
                    <Templates />
                  </PlanGuard>
                </ProtectedRoute>
              } 
            />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/support" element={<Support />} />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <PlanGuard>
                    <Dashboard />
                  </PlanGuard>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/resumes" 
              element={
                <ProtectedRoute>
                  <PlanGuard>
                    <MyResumes />
                  </PlanGuard>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/builder/:id?" 
              element={
                <ProtectedRoute>
                  <PlanGuard>
                    <Builder />
                  </PlanGuard>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/*" 
              element={
                <ProtectedRoute adminOnly>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </main>
        <MobileNav />
      </div>
    </Router>
  );
}

