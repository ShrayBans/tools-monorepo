import type { FC, PropsWithChildren } from "react"
import { cn } from "../lib"

export interface AixContentBodyProps {
  className?: string
  innerClassName?: string
}

export const AixContentBodyOuter = ({ className, children }: PropsWithChildren<{ className?: string }>) => {
  return <div className={cn("align-center flex flex-1 flex-col p-5 px-4 pb-20", className)}>{children}</div>
}

export const AixContentBodyInner = ({ className, children }: PropsWithChildren<{ className?: string }>) => {
  return (
    <div className={cn("flex w-full flex-1 flex-col self-center max-w-[var(--content-max-width)]", className)}>
      {children}
    </div>
  )
}

export const AixContentBody: FC<PropsWithChildren<AixContentBodyProps>> = ({ ...p }) => {
  return (
    <AixContentBodyOuter className={p.className}>
      <AixContentBodyInner className={p.innerClassName}>{p.children}</AixContentBodyInner>
    </AixContentBodyOuter>
  )
}
