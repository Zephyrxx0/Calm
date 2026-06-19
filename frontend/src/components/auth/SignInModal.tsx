"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

function GithubIcon() {
  return (
    <svg
      style={{ marginRight: 8, width: 16, height: 16 }}
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

  const buttonBase = {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    border: "1px solid rgba(26, 26, 26, 0.15)",
    background: "#FFFFFF",
    padding: "12px 20px",
    fontSize: 14,
    fontFamily: "var(--font-sans), sans-serif",
    color: "#1A1A1A",
    cursor: "pointer",
  };

  const inputStyle = {
    width: "100%",
    border: "1px solid rgba(26, 26, 26, 0.15)",
    background: "#FFFFFF",
    padding: "8px 12px",
    fontSize: 14,
    fontFamily: "var(--font-sans), sans-serif",
    color: "#1A1A1A",
    outline: "none",
    boxSizing: "border-box" as const,
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Backdrop */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
        onClick={() => onOpenChange(false)}
      />

      {/* Auth panel */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          maxWidth: 400,
          margin: "0 16px",
          background: "#FDFCF7",
          padding: "40px 48px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          border: "1px solid rgba(26, 26, 26, 0.1)",
        }}
      >
        {/* Masthead */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              display: "inline-block",
              borderTop: "1px solid rgba(26, 26, 26, 0.2)",
              borderBottom: "1px solid rgba(26, 26, 26, 0.2)",
              padding: "12px 32px",
              marginBottom: 16,
            }}
          >
            <h2
              style={{
                fontSize: 18,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                fontFamily: "var(--font-serif), Georgia, serif",
                color: "#1A1A1A",
                margin: 0,
              }}
            >
              Calm
            </h2>
          </div>
          <p
            style={{
              fontSize: 12,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "#8a8a7a",
              margin: 0,
            }}
          >
            {isAnonymous ? "Save Your Progress" : mode === "signin" ? "Sign In" : "Create Account"}
          </p>
        </div>

        {/* Providers */}
        <div style={{ marginBottom: 32 }}>
          <button
            onClick={handleGitHub}
            disabled={loading}
            style={{
              ...buttonBase,
              marginBottom: 12,
              opacity: loading ? 0.5 : 1,
            }}
          >
            <GithubIcon />
            Continue with GitHub
          </button>

          <button
            onClick={handleAnonymous}
            disabled={loading}
            style={{
              ...buttonBase,
              opacity: loading ? 0.5 : 1,
            }}
          >
            Continue as guest
          </button>
        </div>

        {/* Divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 32,
          }}
        >
          <div style={{ flex: 1, height: 1, background: "rgba(26, 26, 26, 0.15)" }} />
          <span
            style={{
              fontSize: 12,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "#8a8a7a",
            }}
          >
            or with email
          </span>
          <div style={{ flex: 1, height: 1, background: "rgba(26, 26, 26, 0.15)" }} />
        </div>

        {/* Email form */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          <button
            type="button"
            onClick={() => setMode("signin")}
            style={{
              flex: 1,
              fontSize: 12,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              padding: "8px 0",
              border: 0,
              borderBottom: `2px solid ${mode === "signin" ? "#c2856b" : "transparent"}`,
              background: "transparent",
              color: mode === "signin" ? "#1A1A1A" : "#8a8a7a",
              fontFamily: "var(--font-sans), sans-serif",
              cursor: "pointer",
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            style={{
              flex: 1,
              fontSize: 12,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              padding: "8px 0",
              border: 0,
              borderBottom: `2px solid ${mode === "signup" ? "#c2856b" : "transparent"}`,
              background: "transparent",
              color: mode === "signup" ? "#1A1A1A" : "#8a8a7a",
              fontFamily: "var(--font-sans), sans-serif",
              cursor: "pointer",
            }}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label
              htmlFor="email"
              style={{
                display: "block",
                fontSize: 12,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                marginBottom: 8,
                color: "#8a8a7a",
                fontFamily: "var(--font-sans), sans-serif",
              }}
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
              placeholder="you@example.com"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label
              htmlFor="password"
              style={{
                display: "block",
                fontSize: 12,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                marginBottom: 8,
                color: "#8a8a7a",
                fontFamily: "var(--font-sans), sans-serif",
              }}
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
              placeholder="••••••"
              style={inputStyle}
            />
          </div>

          {error && (
            <p
              style={{
                fontSize: 12,
                color: "#c2856b",
                fontFamily: "var(--font-sans), sans-serif",
                margin: "0 0 16px 0",
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px 0",
              fontSize: 14,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              background: "#c2856b",
              color: "#FDFCF7",
              fontFamily: "var(--font-sans), sans-serif",
              border: 0,
              cursor: "pointer",
              opacity: loading ? 0.5 : 1,
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
  );
}
