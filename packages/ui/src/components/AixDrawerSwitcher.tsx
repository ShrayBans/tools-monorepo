import { ComponentPropsWithoutRef, ReactNode } from "react"
import { useScreenSize } from "../hooks"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  Drawer,
  DrawerContent,
  DrawerTrigger,
  NestedDrawer,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../shadcnBase"

export type AixDrawerSwitcherProps = {
  children: ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: ReactNode
  triggerAsChild?: boolean
  triggerClassName?: string
  popoverContentProps?: ComponentPropsWithoutRef<typeof PopoverContent>
  drawerContentProps?: ComponentPropsWithoutRef<typeof DrawerContent>
  dialogContentProps?: ComponentPropsWithoutRef<typeof DialogContent>
  isDrawer?: boolean // Optional override for mobile detection
  isNestedDrawer?: boolean // Optional override to use NestedDrawer instead of regular Drawer
  switchType?: "popover" | "dialog"
  renderCustomWrapper?: React.ComponentType<{ children?: ReactNode }>
}

export const AixDrawerSwitcher = ({
  switchType = "dialog",
  renderCustomWrapper,
  ...p
}: AixDrawerSwitcherProps & { renderCustom?: React.ComponentType<{ children: ReactNode }> }) => {
  const { breakpoint } = useScreenSize()

  // Use provided isDrawer prop or fall back to default detection (breakpoint.md means mobile)
  const showDrawer = p.isDrawer !== undefined ? p.isDrawer : breakpoint.md

  if (showDrawer) {
    // Choose between NestedDrawer and regular Drawer based on isNestedDrawer prop
    const DrawerComponent = p.isNestedDrawer ? NestedDrawer : Drawer

    return (
      <DrawerComponent open={p.open} onOpenChange={p.onOpenChange}>
        {!!p.trigger && (
          <DrawerTrigger asChild={p.triggerAsChild} className={p.triggerClassName}>
            {p.trigger}
          </DrawerTrigger>
        )}

        <DrawerContent {...p.drawerContentProps}>{p.children}</DrawerContent>
      </DrawerComponent>
    )
  }

  if (renderCustomWrapper) {
    const CustomComponent = renderCustomWrapper
    return <CustomComponent>{p.children}</CustomComponent>
  }

  switch (switchType) {
    case "popover":
      return (
        <Popover open={p.open} defaultOpen={p.defaultOpen} onOpenChange={p.onOpenChange}>
          {!!p.trigger && (
            <PopoverTrigger asChild={p.triggerAsChild} className={p.triggerClassName}>
              {p.trigger}
            </PopoverTrigger>
          )}

          <PopoverContent {...p.popoverContentProps}>{p.children}</PopoverContent>
        </Popover>
      )

    default:
      return (
        <Dialog open={p.open} defaultOpen={p.defaultOpen} onOpenChange={p.onOpenChange}>
          {!!p.trigger && (
            <DialogTrigger asChild={p.triggerAsChild} className={p.triggerClassName}>
              {p.trigger}
            </DialogTrigger>
          )}

          <DialogContent {...p.dialogContentProps}>{p.children}</DialogContent>
        </Dialog>
      )
  }
}
