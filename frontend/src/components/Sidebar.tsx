"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthButton } from "@/components/auth/AuthButton";
import { DoodleLeaf } from "@/components/OrganicDoodles";
import { MessageSquare, Calendar, Home, Share2 } from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  const links = [
    { href: "/interview", label: "The Interview", icon: MessageSquare },
    { href: "/daily", label: "Daily Tracking", icon: Calendar },
    { href: "/share", label: "Share", icon: Share2 },
  ];

  return (
    <aside className="w-64 border-r border-border bg-background flex flex-col h-full shrink-0 relative z-30 font-sans">
      {/* Decorative background leaf */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.02] z-0">
        <DoodleLeaf className="absolute -left-12 bottom-12 w-64 h-64 rotate-[45deg]" />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        {/* Brand Header */}
        <div className="p-6 pb-2">
          <Link href="/" className="inline-block mb-1">
            <img src="/icon.svg" alt="Calm" className="w-8 h-8" />
          </Link>
          <Link
            href="/"
            className="text-3xl font-serif tracking-tight text-foreground hover:text-accent transition-colors block"
          >
            Calm
          </Link>
          <span className="text-[9px] uppercase tracking-[0.25em] text-muted-light font-medium block mt-1">
            Carbon Awareness Platform
          </span>
        </div>

        {/* Broadsheet double rule */}
        <div className="px-6 my-3">
          <div className="border-t-4 border-double border-border w-full h-1" />
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 space-y-1">
          {links.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all group ${
                  isActive
                    ? "bg-accent/15 text-accent-hover font-semibold"
                    : "text-muted hover:text-foreground hover:bg-surface/50"
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 transition-transform ${
                  isActive ? "text-accent-hover" : "text-muted-light group-hover:text-muted"
                }`} />
                <span className="tracking-wide">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="px-6 my-3">
          <div className="border-t border-border/60 w-full" />
        </div>

        {/* Bottom Profile / Sync */}
        <div className="p-6 pt-2 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <AuthButton />
          </div>
          <Link
            href="/"
            className="text-[11px] font-medium text-muted-light hover:text-muted tracking-wider uppercase inline-flex items-center gap-1.5 transition-colors mt-1"
          >
            <Home className="h-3.5 w-3.5" />
            Landing Page
          </Link>
        </div>
      </div>
    </aside>
  );
}
