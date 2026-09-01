import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { hourOptions, minuteOptions } from "@/lib/home-search";

type TimePickerFieldProps = {
  hours: number;
  minutes: number;
  timeError: string;
  onHoursChange: (value: number) => void;
  onMinutesChange: (value: number) => void;
};

export function TimePickerField({
  hours,
  minutes,
  timeError,
  onHoursChange,
  onMinutesChange,
}: TimePickerFieldProps) {
  return (
    <fieldset className="mt-7">
      <legend className="mb-2 text-xs font-medium tracking-wide text-zinc-600 uppercase">
        Time available
      </legend>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="sr-only" htmlFor="hours">
            Hours
          </Label>
          <Select
            id="hours"
            items={hourOptions}
            name="hours"
            onValueChange={(value) => {
              if (value !== null) onHoursChange(value);
            }}
            value={hours}
          >
            <SelectTrigger className="h-[52px] w-full rounded-xl border-zinc-200 bg-zinc-50 px-4 text-base font-semibold shadow-xs focus-visible:border-emerald-600 focus-visible:ring-emerald-600/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              {hourOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="sr-only" htmlFor="minutes">
            Minutes
          </Label>
          <Select
            id="minutes"
            items={minuteOptions}
            name="minutes"
            onValueChange={(value) => {
              if (value !== null) onMinutesChange(value);
            }}
            value={minutes}
          >
            <SelectTrigger className="h-[52px] w-full rounded-xl border-zinc-200 bg-zinc-50 px-4 text-base font-semibold shadow-xs focus-visible:border-emerald-600 focus-visible:ring-emerald-600/20">
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
      </div>
      <p className="mt-2 text-xs text-zinc-500">
        Hours: 0-12 (1hr steps)
        <span aria-hidden="true" className="px-2">
          ·
        </span>
        Minutes: 0-55 (5min steps)
      </p>
      {timeError && (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {timeError}
        </p>
      )}
    </fieldset>
  );
}
