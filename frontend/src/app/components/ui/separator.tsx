"use client";
import * as React from "react";
import { cn } from "./utils";

function Separator({
  className,
  orientation = "horizontal" as "horizontal" | "vertical",
  decorative = true,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { orientation?: "horizontal" | "vertical"; decorative?: boolean }) {
  return (
    <div
      data-slot="separator-root"
      data-orientation={orientation}
      className={cn(
        "bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
        className,
      )}
      {...props}
    />
  );
}

export { Separator };