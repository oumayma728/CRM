"use client";
import * as React from "react";
import { cn } from "./utils";

const Slider = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { 
    value?: number[]; 
    onValueChange?: (value: number[]) => void;
    min?: number;
    max?: number;
    step?: number;
  }
>(({ className, value = [0], onValueChange, min = 0, max = 100, step = 1, ...props }, ref) => {
  const percentage = max ? ((value[0] - min) / (max - min)) * 100 : 0;
  
  return (
    <div
      ref={ref}
      className={cn("relative flex items-center select-none touch-none w-full h-5", className)}
      {...props}
    >
      <div className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
        <div 
          className="absolute h-full bg-primary"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <input
        type="range"
        value={value[0]}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onValueChange?.([parseInt(e.target.value)])}
        className="absolute w-full h-full opacity-0 cursor-pointer"
      />
    </div>
  );
});
Slider.displayName = "Slider";

export { Slider };