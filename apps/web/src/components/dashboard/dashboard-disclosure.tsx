import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Properties for the `DashboardDisclosure` accordion panel component.
 */
type DashboardDisclosureProps = {
  /** Unique HTML id prefix for binding `aria-controls` and `aria-labelledby`. */
  id: string;
  /** Header title displayed on the disclosure trigger button. */
  title: string;
  /** Whether the disclosure panel is currently expanded. */
  open: boolean;
  /** Toggle event handler invoked when user clicks the header button. */
  onToggle: () => void;
  /** Optional badge flag highlighting newly unlocked rewards or discoveries. */
  isNew?: boolean;
  /** Child content rendered inside the expandable container. */
  children?: React.ReactNode;
};

/**
 * Accessible in-flow collapsible disclosure panel used by dashboard deep-dive sections.
 *
 * Adheres strictly to WAI-ARIA Disclosure pattern:
 * - Employs a native `<button>` with `aria-expanded` and `aria-controls`.
 * - Links expandable content region via `<div role="region" aria-labelledby={id}>`.
 * - Optional "NEW" pill notification badge alerting parents to newly unlocked rewards.
 *
 * @param props - Disclosure configuration including id, title, open status, and toggle callback.
 * @returns The rendered accessible disclosure section.
 */
export function DashboardDisclosure({
  id,
  title,
  open,
  onToggle,
  isNew = false,
  children,
}: DashboardDisclosureProps) {
  // Generate corresponding panel ID for aria-controls linkage
  const panelId = id + "-panel";


  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border bg-white/50",
        isNew ? "border-[#E4633C]" : "border-[#93AB63]/60",
      )}
    >
      <button
        aria-controls={panelId}
        aria-expanded={open}
        className="flex min-h-11 w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left font-semibold text-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#93AB63] sm:px-4 sm:py-3"
        id={id}
        onClick={onToggle}
        type="button"
      >
        <span className="flex items-center gap-2">
          {title}
          {isNew ? (
            <span className="rounded-full bg-[#E4633C] px-1.5 py-0.5 text-[10px] font-bold text-white">
              NEW
            </span>
          ) : null}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn("size-4 transition-transform", open && "rotate-180")}
        />
      </button>
      {open ? (
        <div
          aria-labelledby={id}
          className="border-t border-[#93AB63]/30 p-3.5 sm:p-4"
          id={panelId}
          role="region"
        >
          {children}
        </div>
      ) : null}
    </section>
  );
}

export type { DashboardDisclosureProps };
