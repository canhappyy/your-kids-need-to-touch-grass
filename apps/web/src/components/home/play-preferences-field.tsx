import { Switch } from "@/components/ui/switch";
import type { PlayPreferencesFieldProps } from "@/types/play-preferences";

/**
 * Form fieldset containing toggle switches for play style (Solo vs Group) and supervision level.
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
      <legend className="mb-3 text-xs font-medium uppercase text-zinc-600">
        Play preferences
      </legend>
      <div className="flex items-center justify-between gap-4">
        <label
          id="play-style-label"
          htmlFor="play-style"
          className="cursor-pointer text-sm"
        >
          Playing style
          <span className="block text-xs text-zinc-500">
            {playStyle === "group" ? "Group / Family Play" : "Solo Play"}
          </span>
        </label>
        <Switch
          id="play-style"
          aria-labelledby="play-style-label"
          checked={playStyle === "group"}
          onCheckedChange={(checked) =>
            onPlayStyleChange(checked ? "group" : "solo")
          }
          className="data-checked:bg-orange-500 data-unchecked:bg-zinc-300"
        />
      </div>
      <div className="flex items-center justify-between gap-4">
        <label
          id="supervision-label"
          htmlFor="supervision"
          className="cursor-pointer text-sm"
        >
          Supervision
          <span className="block text-xs text-zinc-500">
            {canSupervise
              ? "I can watch my kids"
              : "I need them to play independently"}
          </span>
        </label>
        <Switch
          id="supervision"
          aria-labelledby="supervision-label"
          checked={canSupervise}
          onCheckedChange={onSupervisionChange}
          className="data-checked:bg-orange-500 data-unchecked:bg-zinc-300"
        />
      </div>
    </fieldset>
  );
}
