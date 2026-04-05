import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-[120px] w-full rounded-[20px] border border-input bg-card px-5 py-4 text-[15px] text-foreground shadow-[0_1px_0_rgba(255,255,255,0.35)_inset] outline-none transition placeholder:text-muted-foreground focus:border-ring/50 focus:ring-2 focus:ring-ring/20",
          className,
        )}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
