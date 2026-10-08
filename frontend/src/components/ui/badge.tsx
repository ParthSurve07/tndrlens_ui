import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-accent text-white",
        secondary:
          "border-slate-border bg-card-bg text-[var(--text-color)]",
        destructive:
          "border-transparent bg-danger-custom text-white",
        outline: "text-[var(--text-color)] border-slate-border",
        success: "border-[#10B981]/25 bg-[#10B981]/10 text-success-custom",
        warning: "border-[#F59E0B]/25 bg-[#F59E0B]/10 text-warning-custom",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
