import * as React from "react"
import { cn } from "@/lib/utils"

interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4 | 5 | 6
  sm?: 1 | 2 | 3 | 4 | 5 | 6
  md?: 1 | 2 | 3 | 4 | 5 | 6
  lg?: 1 | 2 | 3 | 4 | 5 | 6
  gap?: number
}

const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  ({ className, cols = 1, sm, md, lg, gap = 4, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "grid",
          // Base columns (mobile)
          cols === 1 && "grid-cols-1",
          cols === 2 && "grid-cols-2",
          cols === 3 && "grid-cols-3",
          cols === 4 && "grid-cols-4",
          
          // SM breakpoint
          sm === 1 && "sm:grid-cols-1",
          sm === 2 && "sm:grid-cols-2",
          sm === 3 && "sm:grid-cols-3",
          sm === 4 && "sm:grid-cols-4",
          sm === 5 && "sm:grid-cols-5",
          sm === 6 && "sm:grid-cols-6",

          // MD breakpoint
          md === 1 && "md:grid-cols-1",
          md === 2 && "md:grid-cols-2",
          md === 3 && "md:grid-cols-3",
          md === 4 && "md:grid-cols-4",
          md === 5 && "md:grid-cols-5",
          md === 6 && "md:grid-cols-6",

          // LG breakpoint
          lg === 1 && "lg:grid-cols-1",
          lg === 2 && "lg:grid-cols-2",
          lg === 3 && "lg:grid-cols-3",
          lg === 4 && "lg:grid-cols-4",
          lg === 5 && "lg:grid-cols-5",
          lg === 6 && "lg:grid-cols-6",

          // Gaps
          gap === 0 && "gap-0",
          gap === 1 && "gap-1",
          gap === 2 && "gap-2",
          gap === 3 && "gap-3",
          gap === 4 && "gap-4",
          gap === 6 && "gap-6",
          gap === 8 && "gap-8",
          
          className
        )}
        {...props}
      />
    )
  }
)
Grid.displayName = "Grid"

export { Grid }
