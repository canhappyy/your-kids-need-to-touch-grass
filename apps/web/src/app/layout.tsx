import type { Metadata } from "next";
import { Comfortaa, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/layout/bottom-nav";
import { cn } from "@/lib/utils";

const comfortaa = Comfortaa({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Global application metadata defining title, description, and branding.
 */
export const metadata: Metadata = {
  title: "PlayGo & Co",
  description: "Find something fun for your child, fast.",
};

/**
 * Root HTML layout component that configures global typography, viewport attributes, and bottom navigation.
 *
 * Configures:
 * 1. Comfortaa font for playful, friendly headings and brand typography.
 * 2. Geist Mono font for clean numeric statistics and tabular displays.
 * 3. Mobile safe-area paddings and full-viewport flex column structure.
 * 4. Persistent `BottomNav` bar enabling effortless thumb navigation across key screens.
 *
 * @param props - Layout props containing the child page elements.
 * @returns The rendered root HTML shell.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        "font-sans",
        comfortaa.variable,
        geistMono.variable,
      )}
    >
      <body
        className="min-h-full flex flex-col"
        suppressHydrationWarning
      >
        {/* Child page content */}
        {children}

        {/* Global bottom navigation bar */}
        <BottomNav />
      </body>
    </html>
  );
}

