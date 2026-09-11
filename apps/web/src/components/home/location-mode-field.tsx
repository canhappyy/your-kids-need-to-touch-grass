import type { LocationMode } from "@/types/home-search";

type LocationModeFieldProps = {
  value: LocationMode;
  onChange: (value: LocationMode) => void;
};

const locationModes: Array<{ label: string; value: LocationMode }> = [
  { label: "Near me", value: "nearby" },
  { label: "At home", value: "home" },
];

export function LocationModeField({ value, onChange }: LocationModeFieldProps) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-medium tracking-wide text-zinc-600 uppercase">
        Activity location
      </legend>
      <div className="grid grid-cols-2 gap-3">
        {locationModes.map((mode) => (
          <label className="cursor-pointer" key={mode.value}>
            <input
              checked={value === mode.value}
              className="peer sr-only"
              name="locationMode"
              onChange={() => onChange(mode.value)}
              type="radio"
              value={mode.value}
            />
            <span className="flex h-[52px] items-center justify-center rounded-xl border border-zinc-200 bg-[#F0B6A31F] px-4 text-sm font-semibold text-zinc-700 shadow-xs transition-colors peer-checked:border-[#E4633C] peer-checked:bg-[#E4633C] peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-[#E4633C]/30 peer-focus-visible:ring-offset-2">
              {mode.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
