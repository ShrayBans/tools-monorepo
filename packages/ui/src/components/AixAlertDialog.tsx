import type { ComponentPropsWithoutRef, FC, MouseEventHandler, ReactNode } from "react"

import { cn } from "../lib"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../shadcnBase"
import { Loader } from "./Loader"
import { useHotkeys } from "react-hotkeys-hook"

export type AixAlertDialogProp = {
  title: string | ReactNode
  description?: ReactNode
  cancelLabel?: string
  closePopup?: ReactNode
  className?: string
  size?: string
  actionLabel?: string
  actionClassName?: string
  onActionClick?: MouseEventHandler<HTMLButtonElement>
  icon?: ReactNode
  loading?: boolean
} & ComponentPropsWithoutRef<typeof AlertDialog>

export const AixAlertDialog: FC<AixAlertDialogProp> = ({
  title,
  description,
  cancelLabel = "Cancel",
  actionLabel = "",
  actionClassName,
  onActionClick,
  icon,
  loading,
  className,
  size = "lg",
  ...p
}) => {
  useHotkeys("enter", (e) => {
    if (p?.open) {
      e.preventDefault()
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      onActionClick?.(e as any)
    }
  }, { enableOnFormTags: true })

  return (
    <AlertDialog {...p}>
      <AlertDialogContent className={cn(className, `max-w-${size}`)}>
        <AlertDialogHeader className="flex flex-row items-start pb-4">
          <div className="flex-shrink-0 pt-2">{icon}</div>
          <div className={cn({ "pl-3": !!icon })}>
            <AlertDialogTitle className="pb-1 text-start text-xl">{title}</AlertDialogTitle>
            <AlertDialogDescription className="text-start">{description}</AlertDialogDescription>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{cancelLabel}</AlertDialogCancel>

          {actionLabel && (
            <AlertDialogAction className={actionClassName} onClick={onActionClick} disabled={loading}>
              {loading && <Loader className="mr-1" />}
              <span>{actionLabel}</span>
              <kbd className="ml-2 px-2 py-1 text-xs font-mono bg-muted rounded border">
                ↵
              </kbd>
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export const AixAlertDialogV2: FC<AixAlertDialogProp> = ({
  title,
  description,
  icon,
  closePopup,
  className,
  size = "lg",
  ...p
}) => {

  return (
    <AlertDialog {...p}>
      <AlertDialogContent className={cn(className, `max-w-${size}`)}>
        <AlertDialogHeader className="relative flex flex-col">
          <div className="flex justify-between items-start w-full">
            <div className={cn({ "pl-3": !!icon })}>
              <AlertDialogTitle className="pb-1 text-start font-medium text-gray-500">{title}</AlertDialogTitle>
              <AlertDialogDescription className="text-start mt-1">{description}</AlertDialogDescription>
            </div>
            <div className="absolute -top-[2px] -right-3 cursor-pointer">{closePopup}</div>
          </div>
        </AlertDialogHeader>
      </AlertDialogContent>
    </AlertDialog>
  )
}