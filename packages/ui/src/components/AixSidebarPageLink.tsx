import { ComponentPropsWithoutRef, MouseEventHandler, ReactNode, memo } from "react"
import { SidebarMenuButton, SidebarMenuItem, Tooltip, TooltipContent, TooltipTrigger } from "../shadcnBase"
import { cn } from "../lib"
import { Link, useLocation } from "@tanstack/react-router"
import { split } from "lodash-es"

export type SidebarPageLink = {
  title: React.ReactNode
  url?: string
  icon: ReactNode
}

export type AixSidebarPageLinkProps = {
  className?: string
  item: SidebarPageLink
  type?: "link" | "button"
  onClick?: MouseEventHandler<HTMLButtonElement>
  onLinkClick?: MouseEventHandler<HTMLAnchorElement>
} & Pick<ComponentPropsWithoutRef<typeof SidebarMenuButton>, "isActive"> &
  Pick<TooltipWrapperProps, "tooltip" | "tooltipAlign" | "tooltipSide">

export const AixSidebarPageLink = memo(({ item, type = "link", ...p }: AixSidebarPageLinkProps) => {
  const location = useLocation()
  const pathname = location.pathname
  const firstPath = `/${split(pathname, "/")[1]}`
  const isActive = p.isActive !== undefined ? p.isActive : item.url === pathname || pathname.startsWith(`${item.url}/`)

  return (
    <TooltipWrapper tooltip={p.tooltip} tooltipAlign={p.tooltipAlign} tooltipSide={p.tooltipSide}>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive}>
          <TypeWrapper
            href={item.url}
            onClick={p.onClick}
            onLinkClick={p.onLinkClick}
            type={type}
            className={cn(
              "flex items-center gap-3 font-medium hover:text-sidebar-foreground active:text-sidebar-foreground group-data-[collapsible=icon]:justify-center",
              p.className,
            )}
          >
            {item.icon}

            <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
          </TypeWrapper>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </TooltipWrapper>
  )
})

type TypeWrapperProps = {
  type?: AixSidebarPageLinkProps["type"]
  children?: ReactNode
  className?: string
  href?: string
} & Pick<AixSidebarPageLinkProps, "onClick" | "onLinkClick">

const TypeWrapper = ({ href = "/", type = "link", onClick, children, onLinkClick, ...p }: TypeWrapperProps) => {
  switch (type) {
    case "link":
      return (
        <Link to={href} onClick={onLinkClick} {...p}>
          {children}
        </Link>
      )

    case "button":
      return (
        <button type="button" onClick={onClick} {...p}>
          {children}
        </button>
      )

    default:
      return null
  }
}

type TooltipWrapperProps = {
  tooltip?: ReactNode
  children?: ReactNode
  tooltipSide?: ComponentPropsWithoutRef<typeof TooltipContent>["side"]
  tooltipAlign?: ComponentPropsWithoutRef<typeof TooltipContent>["align"]
}

const TooltipWrapper = ({ tooltipSide = "right", tooltipAlign = "center", ...p }: TooltipWrapperProps) => {
  if (p.tooltip)
    return (
      <Tooltip>
        <TooltipTrigger asChild>{p.children}</TooltipTrigger>
        <TooltipContent side={tooltipSide} align={tooltipAlign}>
          {p.tooltip}
        </TooltipContent>
      </Tooltip>
    )

  return <>{p.children}</>
}

export default AixSidebarPageLink
