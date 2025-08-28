

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"

import { cn } from "../lib"

const Tabs = TabsPrimitive.Root

const tablistVariants = cva(
  "inline-flex h-10 items-center justify-center rounded-md bg-muted p-[2px] text-muted-foreground",
  {
    variants: {
      size: {
        default: "h-10",
        sm: "h-8",
        xs: "h-6",
        lg: "h-11",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
)

type TabsListProps = React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & VariantProps<typeof tablistVariants>

const TabsList = React.forwardRef<React.ElementRef<typeof TabsPrimitive.List>, TabsListProps>(
  ({ className, size, ...props }, ref) => (
    <TabsPrimitive.List ref={ref} className={cn(tablistVariants({ size, className }))} {...props} />
  ),
)
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "keyboard-focus inline-flex h-full items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      className,
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content ref={ref} className={cn("keyboard-focus mt-2 ring-offset-background", className)} {...props} />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsContent, TabsList, TabsTrigger }
