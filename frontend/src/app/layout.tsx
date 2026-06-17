import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Calm — Your Carbon Footprint",
  description:
    "A calm carbon awareness platform. Answer a few questions about your lifestyle, and see your footprint clearly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
