"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { SignInModal } from "@/components/auth/SignInModal";

const PUBLIC_PATHS = ["/"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showSignIn, setShowSignIn] = useState(false);

  useEffect(() => {
    if (loading) return;

    const isPublic = PUBLIC_PATHS.some(
      (p) => pathname === p || pathname.startsWith(p + "/")
    );

    if (!user && !isPublic) {
      router.replace("/");
      return;
    }

    if (!user && pathname === "/") {
      setShowSignIn(true);
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen">
        <p className="text-sm text-muted font-sans">Loading...</p>
      </div>
    );
  }

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  if (!user && !isPublic) {
    return null;
  }

  return (
    <>
      {children}
      <SignInModal open={showSignIn} onOpenChange={setShowSignIn} />
    </>
  );
}
