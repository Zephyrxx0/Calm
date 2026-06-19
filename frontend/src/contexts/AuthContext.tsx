"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  type User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInAnonymously,
  signInWithPopup,
  GithubAuthProvider,
  linkWithCredential,
  AuthCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInAnonymous: () => Promise<void>;
  signInGitHub: () => Promise<void>;
  logOut: () => Promise<void>;
  isAnonymous: boolean;
  upgradeAnonymous: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signInAnonymous: async () => {},
  signInGitHub: async () => {},
  logOut: async () => {},
  isAnonymous: false,
  upgradeAnonymous: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const signInAnonymous = async () => {
    await signInAnonymously(auth);
  };

  const signInGitHub = async () => {
    const provider = new GithubAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logOut = async () => {
    await signOut(auth);
  };

  const upgradeAnonymous = async (email: string, password: string) => {
    if (!user?.isAnonymous) return;
    const credential = EmailAuthProvider.credential(email, password);
    await linkWithCredential(user, credential);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signInAnonymous,
        signInGitHub,
        logOut,
        isAnonymous: user?.isAnonymous ?? false,
        upgradeAnonymous,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
