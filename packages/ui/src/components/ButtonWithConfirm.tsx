import { Check } from "lucide-react"
import { useCallback, useRef, useState } from "react"

import { Tooltip, TooltipContent, TooltipTrigger } from "../shadcnBase"
import { Button } from "./Button"

import type { ComponentPropsWithoutRef, MouseEventHandler, ReactNode } from "react"
import type { ButtonProps } from "./Button"
type ButtonWithConfirmProps = ButtonProps & {
  tooltipContent?: (confirm: boolean) => ReactNode
  confirmDuration?: number
  render?: (confirm: boolean) => ReactNode
  confirmIconSize?: number
  align?: ComponentPropsWithoutRef<typeof TooltipContent>["align"]
  onClick?: MouseEventHandler<HTMLButtonElement>
  type?: "button" | "submit" | "reset"
}

export const ButtonWithConfirm = ({
  leftIcon,
  onClick,
  type = "button",
  tooltipContent,
  confirmDuration = 2500,
  render,
  confirmIconSize = 16,
  ...p
}: ButtonWithConfirmProps) => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const [confirm, setConfirm] = useState(false)

  const onTriggerClick: MouseEventHandler<HTMLButtonElement> = useCallback(
    (e) => {
      e.preventDefault()
      clearTimeout(timeoutRef.current)

      if (confirm) {
        setConfirm(false)
        return onClick?.(e)
      }

      setConfirm(true)

      timeoutRef.current = setTimeout(() => {
        setConfirm(false)
      }, confirmDuration)
    },
    [confirm, confirmDuration, onClick],
  )

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          {...p}
          type={type}
          ref={triggerRef}
          onClick={onTriggerClick}
          leftIcon={leftIcon && confirm ? <Check size={confirmIconSize} /> : leftIcon}
        >
          {!!render && <div className="pointer-events-none">{render(confirm)}</div>}
        </Button>
      </TooltipTrigger>

      <TooltipContent
        align={p.align}
        onPointerDownOutside={(ev) => {
          if (ev.target === triggerRef.current) ev.preventDefault()
        }}
      >
        {tooltipContent?.(confirm)}
      </TooltipContent>
    </Tooltip>
  )
}

export default ButtonWithConfirm
