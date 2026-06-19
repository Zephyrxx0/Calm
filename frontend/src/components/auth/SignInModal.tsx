"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

function GithubIcon() {
  return (
    <svg
      className="mr-2 h-4 w-4"
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.009-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 1.752.652A6.098 6.098 0 0 1 12 6.844a6.11 6.11 0 0 1 1.608.216c.912-.92 1.752-.652 1.752-.652.544 1.377.201 2.394.098 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
    </svg>
  );
}

interface SignInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SignInModal({ open, onOpenChange }: SignInModalProps) {
  const { signIn, signUp, signInAnonymous, signInGitHub, isAnonymous, upgradeAnonymous } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isAnonymous && mode === "signup") {
        await upgradeAnonymous(email, password);
      } else if (mode === "signin") {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
      onOpenChange(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred";
      if (message.includes("auth/email-already-in-use")) {
        setError("Email already registered. Try signing in instead.");
      } else if (message.includes("auth/weak-password")) {
        setError("Password must be at least 6 characters.");
      } else if (message.includes("auth/user-not-found") || message.includes("auth/wrong-password")) {
        setError("Invalid email or password.");
      } else if (message.includes("auth/invalid-email")) {
        setError("Please enter a valid email address.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymous = async () => {
    setLoading(true);
    try {
      await signInAnonymous();
      onOpenChange(false);
    } catch {
      setError("Failed to sign in anonymously.");
    } finally {
      setLoading(false);
    }
  };

  const handleGitHub = async () => {
    setLoading(true);
    try {
      await signInGitHub();
      onOpenChange(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred";
      if (message.includes("auth/popup-closed-by-user")) {
        setError("");
      } else {
        setError("GitHub sign-in failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-md"
        onClick={() => onOpenChange(false)}
      />

      {/* Auth panel — centered */}
      <div className="relative z-10 w-full max-w-md mx-4 animate-fade-in">
        <div
          className="p-10 md:p-12 shadow-2xl"
          style={{ backgroundColor: "#FDFCF7" }}
        >
          {/* Masthead */}
          <div className="text-center mb-8">
            <div className="inline-block border-t border-b border-[#1A1A1A]/20 py-3 px-8 mb-4">
              <h2
                className="text-lg tracking-[0.15em] uppercase"
                style={{
                  fontFamily: "var(--font-serif), Georgia, serif",
                  color: "#1A1A1A",
                }}
              >
                Calm
              </h2>
            </div>
            <p
              className="text-xs tracking-[0.15em] uppercase"
              style={{ color: "#8a8a7a" }}
            >
              {isAnonymous ? "Save Your Progress" : mode === "signin" ? "Sign In" : "Create Account"}
            </p>
          </div>

          {/* Providers */}
          <div className="space-y-3 mb-8">
            <button
              onClick={handleGitHub}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 border border-[#1A1A1A]/15 px-5 py-3 text-sm font-sans text-[#1A1A1A] hover:bg-[#1A1A1A]/[0.04] transition-colors disabled:opacity-50"
              style={{ fontFamily: "var(--font-sans), sans-serif" }}
            >
              <GithubIcon />
              Continue with GitHub
            </button>

            <button
              onClick={handleAnonymous}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 border border-[#1A1A1A]/15 px-5 py-3 text-sm font-sans text-[#1A1A1A] hover:bg-[#1A1A1A]/[0.04] transition-colors disabled:opacity-50"
              style={{ fontFamily: "var(--font-sans), sans-serif" }}
            >
              Continue as guest
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-[#1A1A1A]/15" />
            <span className="text-xs tracking-[0.15em] uppercase" style={{ color: "#8a8a7a" }}>
              or with email
            </span>
            <div className="flex-1 h-px bg-[#1A1A1A]/15" />
          </div>

          {/* Email form */}
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className="flex-1 text-xs tracking-[0.15em] uppercase py-2 border-b-2 transition-colors"
              style={{
                fontFamily: "var(--font-sans), sans-serif",
                borderBottomColor: mode === "signin" ? "#c2856b" : "transparent",
                color: mode === "signin" ? "#1A1A1A" : "#8a8a7a",
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className="flex-1 text-xs tracking-[0.15em] uppercase py-2 border-b-2 transition-colors"
              style={{
                fontFamily: "var(--font-sans), sans-serif",
                borderBottomColor: mode === "signup" ? "#c2856b" : "transparent",
                color: mode === "signup" ? "#1A1A1A" : "#8a8a7a",
              }}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-xs tracking-[0.15em] uppercase mb-2"
                style={{ color: "#8a8a7a", fontFamily: "var(--font-sans), sans-serif" }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full border border-[#1A1A1A]/15 bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/30 focus:border-[#c2856b] focus:outline-none transition-colors disabled:opacity-50"
                style={{ fontFamily: "var(--font-sans), sans-serif" }}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs tracking-[0.15em] uppercase mb-2"
                style={{ color: "#8a8a7a", fontFamily: "var(--font-sans), sans-serif" }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={loading}
                className="w-full border border-[#1A1A1A]/15 bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/30 focus:border-[#c2856b] focus:outline-none transition-colors disabled:opacity-50"
                style={{ fontFamily: "var(--font-sans), sans-serif" }}
                placeholder="••••••"
              />
            </div>

            {error && (
              <p
                className="text-xs"
                style={{ color: "#c2856b", fontFamily: "var(--font-sans), sans-serif" }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-sm tracking-[0.1em] uppercase transition-colors disabled:opacity-50"
              style={{
                fontFamily: "var(--font-sans), sans-serif",
                backgroundColor: "#c2856b",
                color: "#FDFCF7",
              }}
            >
              {loading
                ? "Please wait..."
                : isAnonymous
                  ? "Link Account"
                  : mode === "signin"
                    ? "Sign In"
                    : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
