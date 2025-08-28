import type { ComponentProps, ReactNode } from "react"

import { cn } from "../lib"
import {
  Dialog as ShacdnDialog,
  DialogContent as ShacdnDialogContent,
  DialogDescription as ShacdnDialogDescription,
  DialogHeader as ShacdnDialogHeader,
  DialogTitle as ShacdnDialogTitle,
} from "../shadcnBase"

export type DialogProps = {
  title?: string
  description?: string
  children?: ReactNode
  scrollable?: boolean
  open?: boolean
  contentClassName?: string
} & ComponentProps<typeof ShacdnDialog> &
  Pick<ComponentProps<typeof ShacdnDialogContent>, "closeClassName">

export const Dialog = ({ title, description, children, contentClassName, scrollable, ...p }: DialogProps) => {
  return (
    <ShacdnDialog {...p}>
      <ShacdnDialogContent scrollable={scrollable} className={cn(contentClassName)} closeClassName={p.closeClassName}>
        {(!!title || !!description) && (
          <ShacdnDialogHeader>
            {!!title && <ShacdnDialogTitle className="text-xl">{title}</ShacdnDialogTitle>}

            {!!description && <ShacdnDialogDescription>{description}</ShacdnDialogDescription>}
          </ShacdnDialogHeader>
        )}

        {children}
      </ShacdnDialogContent>
    </ShacdnDialog>
  )
}
