import { useClickAway, useHover } from "ahooks"
import { ComponentPropsWithoutRef, CSSProperties, ReactNode, useEffect, useRef } from "react"

import { useIsTouchDevice, useScreenSize } from "../hooks"
import { cn } from "../lib"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarProvider, useSidebar } from "../shadcnBase"

export const AixMainContent = (
  p: {
    children?: ReactNode
    iconFloat?: boolean
    className?: string
    noSidebar?: boolean
  } & Pick<ComponentPropsWithoutRef<typeof Sidebar>, "collapsible">,
) => {
  const { breakpoint } = useScreenSize()

  return (
    <main
      className={cn(
        "flex min-h-[100dvh] w-full flex-col",
        {
          "md:pl-[var(--sidebar-width-icon)]":
            (p.iconFloat || breakpoint.lg) && p.collapsible === "icon" && !p.noSidebar,
        },
        p.className,
      )}
    >
      {p.children}
    </main>
  )
}

type AixSidebarProps = {
  children?: ReactNode
  header?: ReactNode
  mobileHeader?: ReactNode
  content?: ReactNode
  footer?: ReactNode
  iconFloat?: boolean
  className?: string
  footerClassName?: string
} & Pick<ComponentPropsWithoutRef<typeof Sidebar>, "collapsible"> &
  Pick<ComponentPropsWithoutRef<typeof AixMainContent>, "noSidebar">

const AixSidebar = ({ collapsible = "icon", ...p }: AixSidebarProps) => {
  const sidebarRef = useRef<HTMLDivElement | null>(null)
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { breakpoint } = useScreenSize()
  const { setOpen, open } = useSidebar()
  const isTouchDevice = useIsTouchDevice()
  const isHovering = useHover(sidebarRef)

  useEffect(() => {
    if (!isTouchDevice && (p.iconFloat || breakpoint.lg)) {
      if (isHovering) {
        // Clear any pending close timeout when hovering
        if (closeTimeoutRef.current) {
          clearTimeout(closeTimeoutRef.current)
          closeTimeoutRef.current = null
        }
        setOpen(true)
      } else {
        // Delay closing when not hovering
        closeTimeoutRef.current = setTimeout(() => {
          setOpen(false)
        }, 50)
      }
    }
  }, [isHovering, setOpen, p.iconFloat, breakpoint, isTouchDevice])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current)
      }
    }
  }, [])

  useClickAway(() => {
    if (isTouchDevice && (p.iconFloat || breakpoint.lg)) setOpen(false)
  }, sidebarRef)

  if (p.noSidebar)
    return (
      <AixMainContent noSidebar={p.noSidebar} collapsible={collapsible}>
        {p.children}
      </AixMainContent>
    )

  return (
    <>
      <Sidebar
        collapsible={p.iconFloat ? "icon" : collapsible}
        outerClassName={cn({
          "absolute left-0": p.iconFloat || breakpoint.lg,
          "shadow-2xl": (p.iconFloat || breakpoint.lg) && open,
        })}
        innerClassName="duration-300 [transition-timing-function:cubic-bezier(0.25,1,0.5,1)]"
        className={cn("duration-300 [transition-timing-function:cubic-bezier(0.25,1,0.5,1)]", p.className)}
        sheetContentClassName="data-[state=open]:duration-300 data-[state=open]:[transition-timing-function:cubic-bezier(0.25,1,0.5,1)]"
        ref={sidebarRef}
      >
        {!!p.header && <SidebarHeader className="min-h-[var(--sidebar-header-height)]">{p.header}</SidebarHeader>}

        <SidebarContent>{p.content}</SidebarContent>

        {!!p.footer && <SidebarFooter className={p.footerClassName}>{p.footer}</SidebarFooter>}
      </Sidebar>

      <AixMainContent iconFloat={p.iconFloat} collapsible={collapsible}>
        {breakpoint.md && (
          <div className="flex min-h-[var(--sidebar-header-height)] px-4 items-center gap-2 border-b sticky top-0 z-10 bg-background">
            {p.mobileHeader}
          </div>
        )}

        {p.children}
      </AixMainContent>
    </>
  )
}

type OuterProps = { children: ReactNode; style?: CSSProperties; className?: string } & Pick<
  AixSidebarProps,
  "iconFloat"
>

export const AixSidebarProvider = (p: OuterProps) => {
  const { breakpoint } = useScreenSize()

  return (
    <SidebarProvider
      defaultOpen={!p.iconFloat && !breakpoint.lg}
      className={cn("bg-background/60", p.className)}
      style={
        {
          "--sidebar-header-height": "46px",
          "--sidebar-width": "300px",
          "--sidebar-width-mobile": "300px",
          "--sidebar-width-icon": "65px",
          "--content-max-width": "960px",
          ...p.style,
        } as CSSProperties
      }
    >
      {p.children}
    </SidebarProvider>
  )
}

export type AixMainLayoutProps = Omit<AixSidebarProps, "className"> & {
  outerStyle?: OuterProps["style"]
  sidebarClassName?: AixSidebarProps["className"]
}

export const AixMainLayout = ({ children, outerStyle, sidebarClassName, ...p }: AixMainLayoutProps) => {
  return (
    <AixSidebarProvider style={outerStyle} iconFloat={p.iconFloat}>
      <AixSidebar className={sidebarClassName} {...p}>
        {children}
      </AixSidebar>
    </AixSidebarProvider>
  )
}
