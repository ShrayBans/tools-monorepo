

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "../lib/utils"
import { ScrollArea } from "./ShadcnScrollArea"
import { ComponentProps } from "react"
import { ReactNode } from "react"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

type DialogContentProps = {
  showClose?: boolean
  scrollable?: boolean
  closeClassName?: string
  contentClassName?: string
} & React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>

const DialogContent = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Content>, DialogContentProps>(
  ({ className, children, showClose = true, closeClassName, scrollable, contentClassName, ...props }, ref) => (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
          className,
        )}
        onOpenAutoFocus={(e) => {
          const currentTarget = e.currentTarget as HTMLElement
          if (currentTarget) {
            const focusableElements = currentTarget.querySelectorAll(
              'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
            )
            if (focusableElements.length > 0) {
              const hasOpenDropdowns = document.querySelector('[data-state="open"][role="menu"]')
              if (hasOpenDropdowns) {
                e.preventDefault()
              }
            }
          }
        }}
        onCloseAutoFocus={(e) => {
          const activeElement = document.activeElement
          if (
            activeElement &&
            (activeElement.closest('[role="menu"]') ||
              activeElement.closest('[role="dialog"]') ||
              activeElement.closest("[data-radix-focus-scope]"))
          ) {
            e.preventDefault()
          }
        }}
        onPointerDownOutside={(e) => {
          const target = e.target as Element
          if (target?.closest('[role="menu"]') || target?.closest("[data-radix-focus-scope]")) {
            e.preventDefault()
          }
          props.onPointerDownOutside?.(e)
        }}
        onInteractOutside={(e) => {
          const target = e.target as Element
          if (target?.closest('[role="menu"]') || target?.closest("[data-radix-focus-scope]")) {
            e.preventDefault()
          }
          props.onInteractOutside?.(e)
        }}
        {...props}
      >
        {scrollable ? (
          <ScrollArea className={cn("max-h-[90vh]", contentClassName)}>{children}</ScrollArea>
        ) : (
          <div className={contentClassName}>{children}</div>
        )}
        {showClose && (
          <DialogPrimitive.Close
            className={cn(
              "absolute right-4 top-4 rounded-full opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground",
              closeClassName,
            )}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  ),
)
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left pb-4", className)} {...props} />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4", className)} {...props} />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export type DialogProps = {
  title?: string
  description?: string
  children?: ReactNode
  scrollable?: boolean
  open?: boolean
  contentClassName?: string
} & ComponentProps<typeof Dialog> &
  Pick<ComponentProps<typeof DialogContent>, "closeClassName">

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
