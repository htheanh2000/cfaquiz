"use client"

import * as React from "react"
import { cn } from "@/lib/utils/cn"

export interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  value?: number
  onValueChange?: (value: number) => void
  min?: number
  max?: number
  step?: number
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, value = 50, onValueChange, min = 10, max = 150, step = 1, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseInt(e.target.value);
      onValueChange?.(newValue);
    };

    const percentage = ((value - min) / (max - min)) * 100;

    return (
      <div className="relative w-full">
        <input
          type="range"
          ref={ref}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          className={cn(
            "w-full h-2 bg-muted rounded-xl appearance-none cursor-pointer",
            "accent-primary",
            className
          )}
          style={{
            background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${percentage}%, hsl(var(--muted)) ${percentage}%, hsl(var(--muted)) 100%)`
          }}
          {...props}
        />
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>{min} Qs</span>
          <span>{max} Qs</span>
        </div>
      </div>
    )
  }
)
Slider.displayName = "Slider"

export { Slider }
