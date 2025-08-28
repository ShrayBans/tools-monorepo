import type { ComponentPropsWithoutRef, FC } from "react"
import { Loader2 } from "lucide-react"

import { cn } from "../lib"

export type LoaderProp = ComponentPropsWithoutRef<typeof Loader2>

export const Loader: FC<LoaderProp> = ({ className, size = 16, ...p }) => (
  <Loader2 size={size} className={cn("animate-spin", className)} {...p} />
)
