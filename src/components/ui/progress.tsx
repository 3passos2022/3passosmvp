
import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  segments?: number;
  activeSegment?: number;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, segments, activeSegment, ...props }, ref) => {
  if (segments && activeSegment !== undefined) {
    // Segmented progress bar
    return (
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(
          "relative h-2 w-full overflow-hidden rounded-full bg-primary/10",
          className
        )}
        {...props}
      >
        <div className="flex w-full h-full">
          {Array.from({ length: segments }).map((_, index) => (
            <div 
              key={index}
              className={cn(
                "flex-1 h-full transition-colors",
                index < activeSegment ? "bg-primary" : 
                index === activeSegment ? "bg-primary/60" : "bg-primary/20",
                index > 0 ? "ml-0.5" : ""
              )}
            />
          ))}
        </div>
      </ProgressPrimitive.Root>
    );
  }

  // Standard progress bar
  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-primary/20",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full w-full flex-1 bg-primary transition-all"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
