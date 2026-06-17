import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <div className="w-full max-w-xl text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Calm
        </h1>

        <p className="mx-auto mt-6 max-w-md text-lg leading-relaxed text-muted">
          A quiet space to understand your carbon footprint. Answer a few gentle questions, and see your impact clearly.
        </p>

        <div className="mt-12">
          <Link
            href="/interview"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Begin Your Interview
          </Link>
        </div>
      </div>
    </main>
  );
}
