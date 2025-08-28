import * as React from "react"
import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"

import { cn } from "../lib/utils"

const inputCn =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:border-solid focus-visible:border-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/[0.14] focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"

const inputVariants = cva(inputCn, {
  variants: {
    inputSize: {
      lg: "h-11",
      default: "h-10",
      sm: "h-8",
      xs: "h-6",
    },
  },
  defaultVariants: {
    inputSize: "default",
  },
})

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & VariantProps<typeof inputVariants>

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, inputSize, type, ...props }, ref) => {
  return <input type={type} className={cn(inputVariants({ inputSize, className }))} ref={ref} {...props} />
})
Input.displayName = "Input"

export { Input, inputCn }
