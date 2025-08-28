import type { ReactNode } from "react"

import { cn } from "../lib"

export default function MaxWidthWrapper({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return <div className={cn("mx-auto w-full max-w-screen-xl px-4 md:px-10 lg:px-20", className)}>{children}</div>
}
