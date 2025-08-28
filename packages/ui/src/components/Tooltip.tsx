import type { ComponentPropsWithoutRef, FC, PropsWithChildren, ReactNode } from "react"

import { Tooltip as ShadcnTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../shadcnBase"
import { cn } from "../.."

const DEFAULT_TOOLTIP_MAX_WIDTH = "max-w-[500px]"

export type TooltipProps = {
  content: ReactNode | string
  contentClassName?: string
} & Pick<
  ComponentPropsWithoutRef<typeof ShadcnTooltip>,
  "defaultOpen" | "delayDuration" | "disableHoverableContent" | "onOpenChange"
> &
  Pick<ComponentPropsWithoutRef<typeof TooltipContent>, "side" | "sideOffset" | "alignOffset" | "align">

export const Tooltip: FC<PropsWithChildren<TooltipProps>> = ({
  children,
  side,
  sideOffset,
  content,
  align,
  alignOffset,
  ...p
}) => {
  return (
    <ShadcnTooltip {...p}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        className={cn(DEFAULT_TOOLTIP_MAX_WIDTH, p.contentClassName)}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
        align={align}
        side={side}
      >
        {content}
      </TooltipContent>
    </ShadcnTooltip>
  )
}

/** add tooltip provider at the root of the project to use this component */
export { TooltipProvider }
