import type { FC } from "react"

import { cn } from "../lib"
import type { AvatarProps as BaseAvatarProps } from "../shadcnBase/ShadcnAvatar"
import { Avatar, AvatarFallback, AvatarImage } from "../shadcnBase/ShadcnAvatar"

export type AixAvatarProps = {
  src?: string
  fallback: string
  className?: string
  fallbackClassName?: string
} & Pick<BaseAvatarProps, "size">

export const AixAvatar: FC<AixAvatarProps> = ({ size, ...p }) => {
  return (
    <Avatar className={p.className} size={size}>
      <AvatarImage src={p.src} />
      <AvatarFallback className={cn("font-bold", p.fallbackClassName)}>{p.fallback}</AvatarFallback>
    </Avatar>
  )
}
