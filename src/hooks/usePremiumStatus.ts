import { useState, useEffect } from "react";
import { auth, db } from "../lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";

export function usePremiumStatus() {
  const [user, authLoading] = useAuthState(auth);
  const [isPremium, setIsPremium] = useState(false);
  const [plan, setPlan] = useState<"free" | "premium" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setIsPremium(false);
      setPlan(null);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(doc(db, "users", user.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const sub = data.subscription || null;
        setPlan(sub);
        setIsPremium(sub === "premium");
      } else {
        setPlan(null);
        setIsPremium(false);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching premium status:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading]);

  return { isPremium, plan, loading, hasPlan: !!plan };
}
