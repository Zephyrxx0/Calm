"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useInView } from "@/hooks/use-in-view";
import { DoodleLeaf, DoodleBranch, DoodleSun, DoodlePebbles } from "@/components/OrganicDoodles";
import { useAuth } from "@/contexts/AuthContext";
import { SignInModal } from "@/components/auth/SignInModal";

/* ─── Grain Overlay ─── */

function Grain() {
  return <div className="grain" aria-hidden="true" />;
}

/* ─── Floating Nav ─── */
function Nav() {
  return (
    <nav className="fixed top-6 left-6 right-6 md:left-1/2 md:right-auto md:-translate-x-1/2 z-40">
      <div className="flex items-center justify-between md:justify-start md:gap-12 rounded-full bg-white/40 backdrop-blur-3xl border border-white/30 px-8 py-4 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
        <span className="text-base font-medium text-white font-serif text-xl tracking-[-0.01em]">Calm</span>
        <div className="hidden md:flex items-center gap-10">
          <a
            href="#manifesto"
            className="text-base text-white/80"
          >
            About
          </a>
          <a
            href="#process"
            className="text-base text-white/80"
          >
            How it works
          </a>
        </div>
      </div>
    </nav>
  );
}

/* ─── Hero Section ─── */
function Hero({ onSignIn }: { onSignIn: () => void }) {
  const { user, loading } = useAuth();

  return (
    <section className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden">
      {/* Forest Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/forest.jpg"
          alt="Serene forest path with golden sunbeams"
          fill
          priority
          className="object-cover scale-105"
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/30" />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
        {/* Massive Heading */}
        <h1
          className="text-[clamp(3.5rem,9vw,7rem)] font-normal leading-[1.02] tracking-[-0.03em] text-white mb-8 animate-fade-up"
          style={{ animationDelay: "0.2s", opacity: 0 }}
        >
          Calm
        </h1>

        {/* Subtitle */}
        <p
          className="mx-auto max-w-lg text-lg leading-relaxed text-white/85 mb-12 animate-fade-up font-sans"
          style={{ animationDelay: "0.35s", opacity: 0 }}
        >
          A quiet space to understand your carbon footprint. Answer a few gentle questions, and see your impact clearly.
        </p>

        {/* CTA Button with Button-in-Button */}
        <div
          className="animate-fade-up"
          style={{ animationDelay: "0.35s", opacity: 0 }}
        >
          {loading ? (
            <span className="inline-flex items-center gap-3 rounded-full bg-white/25 backdrop-blur-2xl border border-white/40 px-8 py-4 text-sm font-medium text-white">
              Loading...
            </span>
          ) : user ? (
            <Link
              href="/interview"
              className="group inline-flex items-center gap-3 rounded-full bg-white/25 backdrop-blur-2xl border border-white/40 px-8 py-4 text-sm font-medium text-white shadow-[0_4px_24px_rgba(0,0,0,0.15)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white/35 hover:shadow-[0_8px_32px_rgba(0,0,0,0.2)] hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Begin Your Interview</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/25 backdrop-blur-sm transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:-translate-y-[1px] group-hover:scale-105">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-white">
                  <path
                    d="M5.25 10.5L8.75 7L5.25 3.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </Link>
          ) : (
            <button
              onClick={onSignIn}
              className="group inline-flex items-center gap-3 rounded-full bg-white/25 backdrop-blur-2xl border border-white/40 px-8 py-4 text-sm font-medium text-white shadow-[0_4px_24px_rgba(0,0,0,0.15)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white/35 hover:shadow-[0_8px_32px_rgba(0,0,0,0.2)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <span>Sign in to begin</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/25 backdrop-blur-sm transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:-translate-y-[1px] group-hover:scale-105">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-white">
                  <path
                    d="M5.25 10.5L8.75 7L5.25 3.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
    </section>
  );
}

/* ─── Manifesto Section (Editorial Split) ─── */
function Manifesto() {
  const { ref: headingRef, isInView: headingVisible } = useInView({ threshold: 0.15 });
  const { ref: cardsRef, isInView: cardsVisible } = useInView({ threshold: 0.1 });

  return (
    <section id="manifesto" className="relative py-32 md:py-40 px-6 md:px-12 overflow-hidden">
      {/* Decorative Doodles */}
      <DoodleBranch className="absolute top-10 -left-20 w-64 h-64 text-accent/5 rotate-12" />
      <DoodleLeaf className="absolute bottom-20 -right-10 w-48 h-48 text-accent/5 -rotate-45" />

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24 items-start">
          {/* Left: Massive Typography */}
          <div
            ref={headingRef}
            className={`transition-all duration-800 ease-[cubic-bezier(0.32,0.72,0,1)] ${
              headingVisible ? "translate-y-0 opacity-100 blur-0" : "translate-y-12 opacity-0 blur-sm"
            }`}
          >
            <span className="inline-block rounded-full bg-accent/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium text-accent mb-6">
              Our Philosophy
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-normal leading-[1.08] tracking-[-0.02em] text-foreground">
              Understand your impact.
              <br />
              <span className="text-muted">Without the noise.</span>
            </h2>
            <p className="mt-8 text-lg leading-relaxed text-muted max-w-[65ch] font-sans">
              Most carbon tools overwhelm you with data, guilt, and complexity. Calm is different. We ask gentle questions, one at a time, and present your footprint with clarity — not anxiety.
            </p>
          </div>

          {/* Right: Feature Cards */}
          <div
            ref={cardsRef}
            className={`space-y-6 transition-all duration-800 ease-[cubic-bezier(0.32,0.72,0,1)] delay-200 ${
              cardsVisible ? "translate-y-0 opacity-100 blur-0" : "translate-y-12 opacity-0 blur-sm"
            }`}
          >
            {/* Card 1 */}
            <div className="p-2 rounded-[2rem]">
              <div className="bg-surface rounded-[calc(2rem-0.5rem)] p-8 h-full">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 flex-shrink-0">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-accent">
                      <path
                        d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M10 6V10L13 13"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-2 font-sans">Gentle Questions</h3>
                    <p className="text-sm leading-relaxed text-muted font-sans">
                      One question at a time. No forms. No friction. Just a calm conversation about your lifestyle.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="p-2 rounded-[2rem]">
              <div className="bg-surface rounded-[calc(2rem-0.5rem)] p-8 h-full">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 flex-shrink-0">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-accent">
                      <path
                        d="M4 16L8 12L12 14L16 8"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M13 8H16V11"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-2 font-sans">Clear Results</h3>
                    <p className="text-sm leading-relaxed text-muted font-sans">
                      See your footprint in a format worth pausing for. No dashboards. Just clarity.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Process Section (Asymmetrical Bento) ─── */
function Process() {
  const { ref: headingRef, isInView: headingVisible } = useInView({ threshold: 0.15 });
  const { ref: card1Ref, isInView: card1Visible } = useInView({ threshold: 0.1 });
  const { ref: card2Ref, isInView: card2Visible } = useInView({ threshold: 0.1 });
  const { ref: card3Ref, isInView: card3Visible } = useInView({ threshold: 0.1 });

  return (
    <section id="process" className="relative py-32 md:py-40 px-6 md:px-12 bg-secondary/30 overflow-hidden">
      {/* Decorative Doodles */}
      <DoodleSun className="absolute top-20 right-[10%] w-56 h-56 text-accent/5" />
      <DoodlePebbles className="absolute bottom-10 left-[5%] w-40 h-40 text-accent/5 opacity-40" />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Section Header */}
        <div
          ref={headingRef}
          className={`text-center mb-20 transition-all duration-800 ease-[cubic-bezier(0.32,0.72,0,1)] ${
            headingVisible ? "translate-y-0 opacity-100 blur-0" : "translate-y-12 opacity-0 blur-sm"
          }`}
        >
          <span className="inline-block rounded-full bg-accent/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium text-accent mb-6">
            How It Works
          </span>
          <h2 className="text-4xl md:text-5xl font-normal leading-[1.1] tracking-[-0.02em] text-foreground">
            Three simple steps
          </h2>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-6">
          {/* Card 1: Interview (Large, spans 2 rows) */}
          <div
            ref={card1Ref}
            className={`md:col-span-2 md:row-span-2 transition-all duration-800 ease-[cubic-bezier(0.32,0.72,0,1)] ${
              card1Visible ? "translate-y-0 opacity-100 blur-0" : "translate-y-12 opacity-0 blur-sm"
            }`}
          >
            <div className="p-2 rounded-[2rem] h-full">
              <div className="bg-surface rounded-[calc(2rem-0.5rem)] p-10 md:p-12 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-xs font-medium text-accent uppercase tracking-wider font-sans">Step 01</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 mb-6">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-accent">
                      <path
                        d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-normal tracking-[-0.02em] text-foreground mb-4">
                    The Interview
                  </h3>
                  <p className="text-base leading-relaxed text-muted max-w-[65ch] font-sans">
                    Answer gentle questions about your lifestyle. Your commute, your diet, your energy use. One at a time, with no rush. The AI coach adapts to your answers, skipping what doesn't apply.
                  </p>
                </div>
                <div className="mt-8 pt-6 border-t border-border">
                  <p className="text-xs text-muted-light font-sans">~10 minutes</p>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Calculate (Small, top right) */}
          <div
            ref={card2Ref}
            className={`transition-all duration-800 ease-[cubic-bezier(0.32,0.72,0,1)] delay-150 ${
              card2Visible ? "translate-y-0 opacity-100 blur-0" : "translate-y-12 opacity-0 blur-sm"
            }`}
          >
            <div className="p-2 rounded-[2rem]">
              <div className="bg-surface rounded-[calc(2rem-0.5rem)] p-8 h-full">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-medium text-accent uppercase tracking-wider font-sans">Step 02</span>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 mb-4">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-accent">
                    <path
                      d="M4 4H16V16H4V4Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M8 8H12M8 12H12M10 8V12"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2 font-sans">The Calculation</h3>
                <p className="text-sm leading-relaxed text-muted font-sans">
                  We compute your footprint using validated carbon coefficients. Simple, transparent, honest.
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: Summary (Small, bottom right) */}
          <div
            ref={card3Ref}
            className={`transition-all duration-800 ease-[cubic-bezier(0.32,0.72,0,1)] delay-300 ${
              card3Visible ? "translate-y-0 opacity-100 blur-0" : "translate-y-12 opacity-0 blur-sm"
            }`}
          >
            <div className="p-2 rounded-[2rem]">
              <div className="bg-surface rounded-[calc(2rem-0.5rem)] p-8 h-full">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-medium text-accent uppercase tracking-wider font-sans">Step 03</span>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 mb-4">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-accent">
                    <path
                      d="M6 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V16C16 16.5304 15.7893 17.0391 15.4142 17.4142C15.0391 17.7893 14.5304 18 14 18H6C5.46957 18 4.96086 17.7893 4.58579 17.4142C4.21071 17.0391 4 16.5304 4 16V4C4 3.46957 4.21071 2.96086 4.58579 2.58579C4.96086 2.21071 5.46957 2 6 2Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M7 6H13M7 10H13M7 14H10"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2 font-sans">Your Summary</h3>
                <p className="text-sm leading-relaxed text-muted font-sans">
                  A clear, beautiful overview of your impact. With actionable next steps you can actually take.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Footer ─── */
function Footer() {
  return (
    <footer className="py-16 px-6 md:px-12 border-t border-border">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <span className="text-lg font-serif text-foreground">Calm</span>
          <span className="text-xs text-muted-light font-sans">—</span>
          <span className="text-xs text-muted-light font-sans">Carbon awareness, quietly.</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#manifesto" className="text-xs text-muted hover:text-foreground transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] font-sans">
            About
          </a>
          <a href="#process" className="text-xs text-muted hover:text-foreground transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] font-sans">
            How it works
          </a>
        </div>
      </div>
    </footer>
  );
}

/* ─── Main Page ─── */
export default function Home() {
  const [showAuth, setShowAuth] = useState(false);

  return (
    <>
      <Grain />
      <Nav />
      <Hero onSignIn={() => setShowAuth(true)} />
      {!showAuth && (
        <>
          <Manifesto />
          <Process />
          <Footer />
        </>
      )}
      <SignInModal open={showAuth} onOpenChange={setShowAuth} />
    </>
  );
}
