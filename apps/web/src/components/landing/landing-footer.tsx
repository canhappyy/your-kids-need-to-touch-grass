import Image from "next/image";
import Link from "next/link";
import { Shield } from "lucide-react";

/**
 * Footer component for the PlayGo & Co landing page.
 */
export function LandingFooter() {
  return (
    <footer className="mt-8 border-t border-[#D9C99E]/40 pt-8 pb-12 text-center text-xs text-zinc-500">
      <div className="flex flex-col items-center justify-center gap-4">
        <Link href="/" className="inline-block transition-opacity hover:opacity-80">
          <Image
            src="/playgo&co.svg"
            alt="PlayGo & Co"
            width={140}
            height={28}
            className="h-7 w-auto object-contain"
          />
        </Link>

        <p className="max-w-md text-zinc-500 text-xs sm:text-sm">
          Encouraging active outdoor play and positive physical habits for children across Victoria, Australia.
        </p>

        {/* Quick Nav Links */}
        <nav aria-label="Footer Navigation" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-zinc-600">
          <Link href="/search" className="hover:text-zinc-900 transition-colors">
            Find Activity
          </Link>
          <span className="text-zinc-300" aria-hidden="true">•</span>
          <Link href="/planner" className="hover:text-zinc-900 transition-colors">
            Family Planner
          </Link>
          <span className="text-zinc-300" aria-hidden="true">•</span>
          <Link href="/dashboard" className="hover:text-zinc-900 transition-colors">
            Parent Dashboard
          </Link>
          <span className="text-zinc-300" aria-hidden="true">•</span>
          <Link
            href="/data-governance"
            className="inline-flex items-center gap-1 hover:text-zinc-900 transition-colors underline underline-offset-2"
          >
            <Shield className="size-3 text-[#728A46]" aria-hidden="true" />
            <span>Data Governance & Privacy</span>
          </Link>
        </nav>

        <p className="text-[11px] text-zinc-400 mt-2">
          &copy; {new Date().getFullYear()} PlayGo & Co. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
