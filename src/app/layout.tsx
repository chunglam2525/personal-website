import type { Metadata } from "next";
import { Inconsolata } from "next/font/google";
import "./globals.css";
import ThreeBackground from "@/components/ThreeBackground";
import DockMenu from "@/components/dockmenu/DockMenu";
import QueryProvider from "@/components/context/QueryProvider";
import { TerminalProvider } from '@/components/context/TerminalContext';
import { Analytics } from "@vercel/analytics/next";
import { GoogleAnalytics } from '@next/third-parties/google'

const inconsolata = Inconsolata({
  variable: "--font-inconsolata",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "My Personal Website",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ background: "#5a13a5" }}>
      <Analytics />
      <GoogleAnalytics gaId="G-7M0CXZXJZ8" />
      <body
        className={`${inconsolata.variable} antialiased`}
      >
        <QueryProvider>
          <TerminalProvider>
            <ThreeBackground />
            <div className="w-screen h-screen relative flex flex-col">
              <DockMenu />
              <div className="flex-1 overflow-y-auto">
                {children}
              </div>
            </div>
          </TerminalProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
