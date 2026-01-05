"use client";

import { useAuth } from "@/firebase";
import { initiateAnonymousSignIn } from "@/firebase/non-blocking-login";
import { useEffect, useState } from "react";

export function AuthProvider({ children }) {
  const auth = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(true);

  useEffect(() => {
    if (auth) {
      const unsubscribe = auth.onAuthStateChanged(user => {
        if (!user) {
          // If there's no user, sign in anonymously.
          initiateAnonymousSignIn(auth);
        } else {
          // If there is a user, we're done with the initial sign-in process.
          setIsSigningIn(false);
        }
      });

      // Cleanup subscription on unmount
      return () => unsubscribe();
    }
  }, [auth]);

  // While checking auth state and signing in, you might want to show a loader
  if (isSigningIn) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  // Once sign-in process is complete, render the children
  return children;
}
