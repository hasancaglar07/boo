import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "flex min-h-[48px] w-full rounded-[20px] border border-input bg-card px-5 text-[15px] text-foreground shadow-[0_1px_0_rgba(255,255,255,0.35)_inset] outline-none transition-all duration-160 placeholder:text-muted-foreground focus:border-ring/50 focus:ring-2 focus:ring-ring/20 focus:scale-[1.01]",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
