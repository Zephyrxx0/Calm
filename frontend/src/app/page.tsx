import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <div className="w-full max-w-2xl text-center">
        {/* Masthead */}
        <p className="font-mono text-sm tracking-widest uppercase text-muted-foreground mb-4">
          Est. 2026
        </p>

        <h1 className="text-5xl font-bold tracking-tight leading-tight text-ink sm:text-6xl md:text-7xl">
          Calm
        </h1>

        {/* Decorative rule */}
        <hr className="mx-auto my-8 w-24 border-t-2 border-ink" />

        <p className="mx-auto max-w-md text-lg leading-relaxed text-muted-foreground">
          A carbon awareness platform. Answer a few questions about your
          lifestyle, and we&apos;ll typeset your footprint as a personalized
          vintage broadsheet.
        </p>

        {/* CTA — outline style per UI-SPEC */}
        <div className="mt-12">
          <Link
            href="/interview"
            className="inline-block border-2 border-ink px-8 py-3 font-mono text-sm tracking-wide uppercase text-ink transition-colors hover:bg-ink hover:text-paper"
          >
            Begin Your Interview
          </Link>
        </div>
      </div>
    </main>
  );
}
