"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isAnonymous ? "Save your progress" : mode === "signin" ? "Sign in to Calm" : "Create account"}
          </DialogTitle>
          <DialogDescription>
            {isAnonymous
              ? "Link your anonymous session to an account so your data syncs across devices."
              : "Sign in to sync your carbon tracking across devices."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleGitHub}
            disabled={loading}
          >
            <GithubIcon />
            Continue with GitHub
          </Button>

          {isAnonymous ? null : (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">or</span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={handleAnonymous}
                disabled={loading}
              >
                Continue as guest
              </Button>
            </>
          )}
        </div>

        {!isAnonymous && (
          <>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  or with email
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={mode === "signin" ? "default" : "ghost"}
                  className="flex-1"
                  onClick={() => setMode("signin")}
                >
                  Sign In
                </Button>
                <Button
                  type="button"
                  variant={mode === "signup" ? "default" : "ghost"}
                  className="flex-1"
                  onClick={() => setMode("signup")}
                >
                  Sign Up
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={loading}
                />
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading
                  ? "Please wait..."
                  : isAnonymous
                    ? "Link Account"
                    : mode === "signin"
                      ? "Sign In"
                      : "Create Account"}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
