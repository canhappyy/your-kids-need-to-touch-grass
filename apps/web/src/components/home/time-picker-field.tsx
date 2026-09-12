import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { minuteOptions } from "@/lib/home-search";

type TimePickerFieldProps = {
  hours?: number;
  minutes: number;
  timeError: string;
  onHoursChange?: (value: number) => void;
  onMinutesChange: (value: number) => void;
};

export function TimePickerField({
  minutes,
  timeError,
  onMinutesChange,
}: TimePickerFieldProps) {
  return (
    <fieldset className="mt-7">
      <legend className="mb-2 text-xs font-medium tracking-wide text-zinc-600 uppercase">
        Time available
      </legend>
      <div>
        <Select
          id="minutes"
          items={minuteOptions}
          name="minutes"
          onValueChange={(value) => {
            if (value !== null) onMinutesChange(value);
          }}
          value={minutes}
        >
          <SelectTrigger className="h-[52px] data-[size=default]:h-[52px] w-full rounded-xl border-zinc-200 bg-[#F0B6A31F] px-4 text-base font-semibold focus-visible:border-[#E4633C] focus-visible:ring-[#E4633C]/20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="start">
            {minuteOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <p className="mt-2 text-xs text-zinc-500">15-90 minutes (15 min steps)</p>
      {timeError && (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {timeError}
        </p>
      )}
    </fieldset>
  );
}
