import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import * as React from "react"

import { cn } from "../lib/utils"

import type { VariantProps } from "class-variance-authority"
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors keyboard-focus disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        icon: "",
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        defaultGradient:
          "bg-gradient-to-r from-primary to-primary-gradient-1 text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        outlinePrimary: "border border-primary/40 bg-background text-primary hover:bg-primary/10 hover:text-primary",
        outlineDestructive:
          "border border-destructive/40 bg-background text-destructive hover:bg-destructive/10 hover:text-destructive",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:text-secondary-foreground/70",
        secondaryDestructive:
          "bg-secondary hover:bg-secondary/80 text-destructive hover:bg-accent hover:text-destructive",
        gray: "bg-gray-200 text-primary hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        ghostPrimary: "text-primary hover:bg-accent hover:text-primary/80",
        ghostDestructive: "text-destructive hover:bg-accent hover:text-destructive",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-2.5",
        xs: "h-6 px-2",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
        iconSm: "h-8 w-8",
        iconXs: "h-6 w-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
