import type { ReactNode } from "react"

import { cn } from "../lib/utils"

export function AnimatedGradientText({
  children,
  className,
  withBorder,
}: {
  children: ReactNode
  className?: string
  withBorder?: boolean
}) {
  return (
    <div
      className={cn(
        "group relative mx-auto flex max-w-fit flex-row items-center justify-center transition-shadow duration-500 ease-out [--bg-size:300%]",
        className,
      )}
    >
      {withBorder && (
        <div
          className={
            "absolute inset-0 block h-full w-full animate-gradient bg-gradient-to-r from-primary/50 via-violet-500/50 to-orange-400/50 bg-[length:var(--bg-size)_100%] p-[1px] ![mask-composite:subtract] [border-radius:inherit] [mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)]"
          }
        />
      )}

      <div className="inline animate-gradient bg-gradient-to-r from-primary via-violet-500 to-primary bg-[length:var(--bg-size)_100%] bg-clip-text text-transparent">
        {children}
      </div>
    </div>
  )
}
