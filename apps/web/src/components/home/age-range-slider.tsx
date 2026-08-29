"use client"

import { Slider as SliderPrimitive } from "@base-ui/react/slider"

type AgeRange = [number, number]

type AgeRangeSliderProps = {
  value: AgeRange
  onValueChange: (value: AgeRange) => void
  min?: number
  max?: number
}

function AgeRangeSlider({
  value,
  onValueChange,
  min = 5,
  max = 12,
}: AgeRangeSliderProps) {
  return (
    <SliderPrimitive.Root
      aria-label="Child's age range"
      className="w-full"
      min={min}
      max={max}
      minStepsBetweenValues={1}
      onValueChange={(nextValue) =>
        onValueChange([nextValue[0], nextValue[1]])
      }
      step={1}
      thumbCollisionBehavior="none"
      value={value}
    >
      <SliderPrimitive.Control className="relative flex h-7 w-full touch-none items-center select-none">
        <SliderPrimitive.Track className="h-1 w-full rounded-full bg-zinc-200">
          <SliderPrimitive.Indicator className="h-full rounded-full bg-emerald-600" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          className="size-5 rounded-full border-2 border-emerald-600 bg-white shadow-sm outline-none transition-shadow focus-visible:ring-4 focus-visible:ring-emerald-600/20"
          getAriaLabel={() => "Minimum age"}
          getAriaValueText={(_, age) => `${age} years`}
          index={0}
        />
        <SliderPrimitive.Thumb
          className="size-5 rounded-full border-2 border-emerald-600 bg-white shadow-sm outline-none transition-shadow focus-visible:ring-4 focus-visible:ring-emerald-600/20"
          getAriaLabel={() => "Maximum age"}
          getAriaValueText={(_, age) => `${age} years`}
          index={1}
        />
      </SliderPrimitive.Control>

      <div
        aria-hidden="true"
        className="mt-2 flex justify-between text-xs text-muted-foreground"
      >
        <span>{min} yrs</span>
        <span>{max} yrs</span>
      </div>
    </SliderPrimitive.Root>
  )
}

export { AgeRangeSlider, type AgeRange }
