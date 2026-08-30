import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
  {
    variants: {
      variant: {
        primary: "border-brand-primary/30 bg-brand-primary/10 text-brand-primary",
        secondary: "border-brand-secondary/40 bg-brand-secondary/20 text-brand-text",
        warning: "border-amber-500/30 bg-amber-500/10 text-amber-400",
        danger: "border-red-500/30 bg-red-500/10 text-red-400",
        success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
        muted: "border-brand-border bg-transparent text-brand-muted",
      },
    },
    defaultVariants: {
      variant: "muted",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
