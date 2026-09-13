import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { minuteOptions } from "@/lib/home-search";

/**
 * Props for the `TimePickerField` duration selection component.
 */
export type TimePickerFieldProps = {
  /** Optional hours component of available duration. */
  hours?: number;
  /** Selected duration in minutes. */
  minutes: number;
  /** Validation error message for duration (e.g. minimum 15 minutes). */
  timeError: string;
  /** Optional callback for changing duration hours. */
  onHoursChange?: (value: number) => void;
  /** Callback fired when the parent changes the duration minutes select option. */
  onMinutesChange: (value: number) => void;
};

/**
 * Dropdown selector field for choosing available activity time in minutes.
 *
 * @param props - Component properties configuring selected duration and error feedback.
 */
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
      {timeError && (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {timeError}
        </p>
      )}
    </fieldset>
  );
}
