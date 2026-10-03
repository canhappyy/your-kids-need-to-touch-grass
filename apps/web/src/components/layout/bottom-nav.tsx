"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Compass, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  /** Accessible label displayed under the icon. */
  label: string;
  /** Navigation destination URL. */
  href: string;
  /** Lucide icon component representing the tab. */
  icon: typeof CalendarDays;
  /** Predicate determining whether this item is currently active. */
  isActive: (pathname: string) => boolean;
};

const navItems: NavItem[] = [
  {
    label: "Planner",
    href: "/planner",
    icon: CalendarDays,
    isActive: (pathname) => pathname.startsWith("/planner"),
  },
  {
    label: "Get Activity",
    href: "/",
    icon: Compass,
    isActive: (pathname) => pathname === "/" || pathname.startsWith("/result"),
  },
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    isActive: (pathname) => pathname.startsWith("/dashboard"),
  },
];

/**
 * Bottom navigation bar providing primary tab switching across Planner, Get Activity, and Dashboard.
 *
 * Fixed at the bottom of the viewport with mobile safe area support and active tab highlighting.
 */
export function BottomNav() {
  const pathname = usePathname() || "";

  return (
    <nav
      aria-label="Bottom Navigation"
      className="fixed bottom-0 inset-x-0 z-30 border-t border-zinc-200/80 bg-white/90 pb-[max(0.25rem,env(safe-area-inset-bottom))] shadow-[0_-2px_10px_rgba(0,0,0,0.03)] backdrop-blur-md"
    >
      <div className="mx-auto flex h-16 w-full max-w-md items-center justify-around px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive(pathname);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex flex-1 flex-col items-center justify-center gap-0.5 py-1 text-center transition-colors select-none",
                "focus-visible:rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#93AB63]",
                active
                  ? "font-semibold text-[#728A46]"
                  : "font-medium text-zinc-400 hover:text-zinc-600",
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center rounded-full px-3 py-1 transition-all duration-200",
                  active
                    ? "bg-[#93AB63]/15 text-[#728A46]"
                    : "text-zinc-400 group-hover:bg-black/5 group-hover:text-zinc-600",
                )}
              >
                <Icon
                  aria-hidden="true"
                  className={cn(
                    "size-5 transition-transform duration-200",
                    active && "scale-105 stroke-[2.25]",
                  )}
                />
              </div>
              <span className="text-[11px] leading-tight tracking-tight sm:text-xs">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
