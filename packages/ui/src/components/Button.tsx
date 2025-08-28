import type { ReactNode } from "react"
import { forwardRef } from "react"

import { cn } from "../lib"
import type { ButtonProps as BaseButtonProps } from "../shadcnBase/ShadcnButton"
import { Button as BaseButton, buttonVariants } from "../shadcnBase/ShadcnButton"
import { Loader } from "./Loader"

export type ButtonProps = BaseButtonProps & {
  loading?: boolean
  leftIcon?: ReactNode
  loaderIconSize?: number
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, className, loading, leftIcon, disabled, loaderIconSize, ...p }, ref) => {
    return (
      <BaseButton className={cn("gap-1", className)} ref={ref} disabled={disabled || loading} {...p}>
        {loading && <Loader className="pointer-events-none" size={loaderIconSize} />}

        {!loading && !!leftIcon && <div className="pointer-events-none">{leftIcon}</div>}
        {children}
      </BaseButton>
    )
  },
)

Button.displayName = "shray-button"

export { buttonVariants }
