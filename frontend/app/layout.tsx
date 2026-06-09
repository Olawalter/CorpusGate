import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CorpusGate — Research Quality Gate",
  description: "GenLayer-powered research paper relevance and quality gate",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-[#0B0D10] text-[#F4EFE7]">
        {children}
      </body>
    </html>
  );
}
