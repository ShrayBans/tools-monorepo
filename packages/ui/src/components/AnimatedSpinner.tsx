import React from "react"
import { cn } from "../lib"

interface AnimatedSpinnerProps {
  className?: string
}

export function AnimatedSpinner({ className }: AnimatedSpinnerProps) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
    </div>
  )
}
