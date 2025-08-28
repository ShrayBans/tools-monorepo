import { forwardRef } from "react"

import { cn } from "../lib"
import type { InputProps as BasInputProps } from "../shadcnBase"
import { Input as BaseInput, inputCn } from "../shadcnBase"

export type InputProps = BasInputProps & {
  /** if initial state should have no border */
  noBorder?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ noBorder, className, ...p }, ref) => {
  return (
    <BaseInput
      className={cn(
        {
          "bg-transparent border-transparent transition-colors hover:bg-muted/50": noBorder,
        },
        className,
      )}
      ref={ref}
      {...p}
    />
  )
})

export { inputCn }
