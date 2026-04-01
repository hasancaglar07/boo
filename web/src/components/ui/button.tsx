"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-[18px] text-[15px] font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.985]",
  {
    variants: {
      variant: {
        primary:
          "bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_96%,white_4%),color-mix(in_srgb,var(--primary)_84%,#7f351e_16%))] text-primary-foreground shadow-[0_10px_28px_rgba(188,104,67,0.24)] hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(188,104,67,0.30)] active:translate-y-0 active:shadow-[0_8px_18px_rgba(188,104,67,0.22)]",
        secondary: "border border-border bg-secondary text-secondary-foreground shadow-sm hover:bg-muted hover:-translate-y-0.5 active:translate-y-0",
        ghost: "bg-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        outline:
          "border border-input bg-background/88 text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground hover:-translate-y-0.5 active:translate-y-0",
      },
      size: {
        default: "h-11 px-4",
        sm: "h-9 px-3 text-xs",
        lg: "h-14 px-6 text-[15px]",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Yükleniyor...
          </>
        ) : (
          children
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
