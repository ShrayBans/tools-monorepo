import type { ComponentPropsWithoutRef, PropsWithChildren, ReactNode } from "react"
import { Link } from "@tanstack/react-router"
import { ChevronLeft } from "lucide-react"
import { Separator, SidebarTrigger, buttonVariants, useSidebar } from "../shadcnBase"
import { cn } from "../lib"
import { useScreenSize } from "../hooks"

interface AixContentHeaderProps {
  className?: string
  innerClassName?: string
  icon?: ReactNode
  title?: string | ReactNode
  right?: ReactNode
  children?: ReactNode
  backUrl?: string
  showSidebarTrigger?: boolean
  noSidebar?: boolean
}

export const contentHeaderTitleClassName = cn("line-clamp-1 text-md font-semibold")
export const contentHeaderDescriptionClassName = cn("text-xs text-muted-foreground block truncate")

export const ContentHeaderOuter = ({
  className,
  children,
  noSidebar,
  ...p
}: PropsWithChildren<{ className?: string }> & Pick<AixContentHeaderProps, "showSidebarTrigger" | "noSidebar">) => {
  const { open } = useSidebar()

  return (
    <div
      className={cn(
        "sticky top-0 min-h-[var(--sidebar-header-height)] flex shrink-0 items-center justify-center bg-background/10 z-[9] backdrop-blur-lg px-4 md:top-0",
        { "pl-[57px]": !open && p.showSidebarTrigger, "top-[var(--sidebar-header-height)]": !noSidebar },
        className,
      )}
    >
      {children}
    </div>
  )
}

export const ContentHeaderInner = ({ className, children }: PropsWithChildren<{ className?: string }>) => {
  return <div className={cn("flex w-full max-w-[var(--content-max-width)]", className)}>{children}</div>
}

const Title = (p: PropsWithChildren<{ className?: string }>) => (
  <h1 className={cn(contentHeaderTitleClassName, p.className)}>{p.children}</h1>
)

const BackCta = (p: ComponentPropsWithoutRef<typeof Link>) => {
  return (
    <Link to={p.href as string} {...(p as any)}>
      <ChevronLeft size={20} />
    </Link>
  )
}

export const AixContentHeader = ({ showSidebarTrigger, ...p }: AixContentHeaderProps) => {
  const { breakpoint } = useScreenSize()
  const { open } = useSidebar()

  return (
    <ContentHeaderOuter className={p.className} showSidebarTrigger={showSidebarTrigger} noSidebar={p.noSidebar}>
      {!open && showSidebarTrigger && (
        <div className="absolute items-center hidden gap-2 left-3 md:flex">
          <SidebarTrigger size="iconSm" />
          <Separator orientation="vertical" className="h-6" />
        </div>
      )}

      <ContentHeaderInner className={p.innerClassName}>
        {p.children ? (
          <div className="flex flex-1 items-center gap-0.5 min-w-[1px] sm:gap-2">
            {p.backUrl && (
              <Link
                to={p.backUrl}
                className={buttonVariants({
                  size: "iconSm",
                  variant: "ghost",
                })}
              >
                <ChevronLeft size={20} />
              </Link>
            )}

            {p.children}
          </div>
        ) : (
          <>
            <div className="flex flex-1 items-center gap-2 min-w-[1px]">
              {p.backUrl && (
                <Link
                  to={p.backUrl}
                  className={buttonVariants({
                    size: "iconSm",
                    variant: "ghost",
                  })}
                >
                  <ChevronLeft size={20} />
                </Link>
              )}

              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  {!breakpoint.sm && p.icon}
                  <Title>{p.title}</Title>
                </div>
              </div>
            </div>

            {p.right}
          </>
        )}
      </ContentHeaderInner>
    </ContentHeaderOuter>
  )
}

AixContentHeader.Title = Title
