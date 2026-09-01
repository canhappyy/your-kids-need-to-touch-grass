import {
  AgeRangeSlider,
  type AgeRange,
} from "@/components/home/age-range-slider";

type AgeRangeFieldProps = {
  value: AgeRange;
  onChange: (value: AgeRange) => void;
};

export function AgeRangeField({ value, onChange }: AgeRangeFieldProps) {
  return (
    <fieldset className="mt-8">
      <legend className="sr-only">Child&apos;s age range</legend>
      <div className="mb-4 flex items-center justify-between gap-4">
        <span
          aria-hidden="true"
          className="text-xs font-medium tracking-wide text-zinc-600 uppercase"
        >
          Child&apos;s age range
        </span>
        <output
          aria-live="polite"
          className="text-sm font-semibold tabular-nums text-zinc-900"
        >
          {value[0]} - {value[1]} years
        </output>
      </div>
      <AgeRangeSlider onValueChange={onChange} value={value} />
      <input name="ageMin" type="hidden" value={value[0]} />
      <input name="ageMax" type="hidden" value={value[1]} />
    </fieldset>
  );
}
