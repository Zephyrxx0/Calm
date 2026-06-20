import type { Metadata } from "next";
import { Instrument_Serif, Geist, Geist_Mono, Playfair_Display, PT_Serif } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Agentation } from "agentation";

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: "700",
  variable: "--font-newspaper-headline",
  display: "block",
});

const ptSerif = PT_Serif({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-newspaper-body",
  display: "block",
});

export const metadata: Metadata = {
  title: "Calm — Your Carbon Footprint",
  description:
    "A quiet space to understand your carbon footprint. Answer a few gentle questions, and see your impact clearly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${geist.variable} ${geistMono.variable} ${playfairDisplay.variable} ${ptSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <AuthProvider>
          <AuthGuard>{children}</AuthGuard>
        </AuthProvider>
        {process.env.NODE_ENV === "development" && <Agentation />}
      </body>
    </html>
  );
}
