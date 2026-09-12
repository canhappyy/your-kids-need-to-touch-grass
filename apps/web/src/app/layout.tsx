import type { Metadata } from "next";
import { Comfortaa, Geist_Mono } from "next/font/google";
import "./globals.css";
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

export const metadata: Metadata = {
  title: "PlayGo",
  description: "Find something fun for your child, fast.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        "font-sans",
        comfortaa.variable,
        geistMono.variable
      )}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
