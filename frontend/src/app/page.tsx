import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&q=80"
          alt="Serene forest path"
          fill
          priority
          className="object-cover"
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/40" />
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/50" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
        <h1 className="text-5xl font-semibold text-white tracking-tight sm:text-6xl md:text-7xl drop-shadow-lg">
          Calm
        </h1>

        <p className="mx-auto mt-6 max-w-md text-lg leading-relaxed text-white/90 drop-shadow-md">
          A quiet space to understand your carbon footprint. Answer a few gentle questions, and see your impact clearly.
        </p>

        <div className="mt-12">
          <Link
            href="/interview"
            className="inline-flex items-center gap-2 rounded-lg bg-white/95 px-8 py-3.5 text-sm font-medium text-foreground shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:shadow-xl hover:scale-[1.02]"
          >
            Begin Your Interview
          </Link>
        </div>
      </div>

      {/* Subtle bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
    </main>
  );
}
