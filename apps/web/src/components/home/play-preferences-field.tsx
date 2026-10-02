import { cn } from "@/lib/utils";
import type { PlayPreferencesFieldProps } from "@/types/play-preferences";

/**
 * Form fieldset containing segmented toggle switches with animated sliding indicators and in-switch mode labels.
 *
 * @param props - Component properties configuring play style, supervision state, and toggle handlers.
 */
export function PlayPreferencesField({
  playStyle,
  canSupervise,
  onPlayStyleChange,
  onSupervisionChange,
}: PlayPreferencesFieldProps) {
  return (
    <fieldset className="mt-7 space-y-4">
      <legend className="mb-2 text-xs font-medium tracking-wide text-zinc-600 uppercase">
        Play preferences
      </legend>

      <div className="space-y-1.5">
        <span className="text-xs font-medium text-zinc-700">Playing style</span>
        <div
          aria-label="Playing style"
          className="relative grid grid-cols-2 overflow-hidden rounded-full border border-zinc-200 bg-[#F0B6A31F] p-1"
          role="radiogroup"
        >
          {/* Animated sliding active indicator */}
          <div
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-[#E4633C] shadow-xs transition-transform duration-300 ease-out",
              playStyle === "group" ? "translate-x-full" : "translate-x-0",
            )}
          />

          <label className="cursor-pointer">
            <input
              aria-label="Solo play"
              checked={playStyle === "solo"}
              className="peer sr-only"
              name="playStyle"
              onChange={() => onPlayStyleChange("solo")}
              type="radio"
              value="solo"
            />
            <span
              className={cn(
                "relative z-10 flex h-10 items-center justify-center rounded-full text-sm font-semibold select-none transition-colors duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-[#E4633C]/30 peer-focus-visible:ring-offset-2",
                playStyle === "solo"
                  ? "text-white"
                  : "text-zinc-600 hover:text-zinc-900",
              )}
            >
              Solo
            </span>
          </label>
          <label className="cursor-pointer">
            <input
              aria-label="Group play"
              checked={playStyle === "group"}
              className="peer sr-only"
              name="playStyle"
              onChange={() => onPlayStyleChange("group")}
              type="radio"
              value="group"
            />
            <span
              className={cn(
                "relative z-10 flex h-10 items-center justify-center rounded-full text-sm font-semibold select-none transition-colors duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-[#E4633C]/30 peer-focus-visible:ring-offset-2",
                playStyle === "group"
                  ? "text-white"
                  : "text-zinc-600 hover:text-zinc-900",
              )}
            >
              Group
            </span>
          </label>
        </div>
      </div>

      <div className="space-y-1.5">
        <span className="text-xs font-medium text-zinc-700">Supervision</span>
        <div
          aria-label="Supervision"
          className="relative grid grid-cols-2 overflow-hidden rounded-full border border-zinc-200 bg-[#F0B6A31F] p-1"
          role="radiogroup"
        >
          {/* Animated sliding active indicator */}
          <div
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-[#E4633C] shadow-xs transition-transform duration-300 ease-out",
              canSupervise ? "translate-x-full" : "translate-x-0",
            )}
          />

          <label className="cursor-pointer">
            <input
              aria-label="Independent play"
              checked={!canSupervise}
              className="peer sr-only"
              name="canSupervise"
              onChange={() => onSupervisionChange(false)}
              type="radio"
              value="independent"
            />
            <span
              className={cn(
                "relative z-10 flex h-10 items-center justify-center rounded-full text-sm font-semibold select-none transition-colors duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-[#E4633C]/30 peer-focus-visible:ring-offset-2",
                !canSupervise
                  ? "text-white"
                  : "text-zinc-600 hover:text-zinc-900",
              )}
            >
              Independent
            </span>
          </label>
          <label className="cursor-pointer">
            <input
              aria-label="Supervised play"
              checked={canSupervise}
              className="peer sr-only"
              name="canSupervise"
              onChange={() => onSupervisionChange(true)}
              type="radio"
              value="supervised"
            />
            <span
              className={cn(
                "relative z-10 flex h-10 items-center justify-center rounded-full text-sm font-semibold select-none transition-colors duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-[#E4633C]/30 peer-focus-visible:ring-offset-2",
                canSupervise
                  ? "text-white"
                  : "text-zinc-600 hover:text-zinc-900",
              )}
            >
              Supervised
            </span>
          </label>
        </div>
      </div>
    </fieldset>
  );
}
