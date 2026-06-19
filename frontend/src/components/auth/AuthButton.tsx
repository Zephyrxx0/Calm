"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SignInModal } from "./SignInModal";
import { User, LogOut } from "lucide-react";

export function AuthButton() {
  const { user, loading, logOut, isAnonymous } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);

  if (loading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        Loading...
      </Button>
    );
  }

  if (!user) {
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setModalOpen(true)}
        >
          Sign In to Sync
        </Button>
        <SignInModal open={modalOpen} onOpenChange={setModalOpen} />
      </>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <User className="h-4 w-4" />
            {isAnonymous ? "Guest" : user.email || user.displayName || "User"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isAnonymous && (
            <>
              <DropdownMenuItem onClick={() => setModalOpen(true)}>
                Save your progress
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem onClick={logOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <SignInModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}
