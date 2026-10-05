import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type DashboardDisclosureProps = {
  id: string;
  title: string;
  open: boolean;
  onToggle: () => void;
  isNew?: boolean;
  children?: React.ReactNode;
};

/** Accessible in-flow disclosure used by dashboard detail sections. */
export function DashboardDisclosure({
  id,
  title,
  open,
  onToggle,
  isNew = false,
  children,
}: DashboardDisclosureProps) {
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
        className="flex min-h-10 w-full items-center justify-between gap-3 px-3 py-2 text-left font-semibold text-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#93AB63]"
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
          className="border-t border-[#93AB63]/30 p-3"
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
