import { useState } from "react"
import { ArrowRight, X } from "lucide-react"

import { Button, buttonVariants } from "../components"
import { cn } from "../lib"

interface IFooterProps {
  primaryText?: string
  secondaryText?: string | React.ReactNode
  buttonText?: string
  onClick?: () => void
  style: "destructive" | "secondary" | "outline" | "gradient"
}
export const Footer = ({ style, primaryText, secondaryText, buttonText, onClick }: IFooterProps) => {
  const [showFooter, setShowFooter] = useState(true)

  if (!showFooter) return null

  let bgColor = "aspect-[577/310] w-[36.0625rem] bg-gradient-to-r from-[#ff80b5] to-[#9089fc]"
  if (style === "destructive") {
    bgColor = "bg-red-500"
  } else if (style === "secondary") {
    bgColor = "bg-secondary"
  } else if (style === "outline") {
    bgColor = ""
  }

  return (
    <div
      className={`relative isolate flex h-14 shrink-0 items-center gap-x-6 overflow-hidden bg-muted/50 px-6 py-2.5 sm:px-3.5 sm:before:flex-1 ${bgColor} fixed bottom-0 w-full`}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="flex flex-row items-center text-sm leading-6">
          <strong className="font-semibold">{primaryText}</strong>

          {secondaryText && (
            <>
              <svg viewBox="0 0 2 2" className="mx-2 inline h-0.5 w-0.5 fill-current" aria-hidden="true">
                <circle cx={1} cy={1} r={1} />
              </svg>
              {secondaryText}
            </>
          )}
        </p>

        {buttonText && onClick && (
          <a
            onClick={onClick}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "h-[30px] cursor-pointer rounded-full bg-transparent py-0",
            )}
          >
            {buttonText}
            <ArrowRight className="ml-2" size={16} />
          </a>
        )}
      </div>

      <div className="flex flex-1 justify-end self-start">
        <Button size="icon" variant="ghost" type="button" className="h-[30px]" onClick={() => setShowFooter(false)}>
          <span className="sr-only">Dismiss</span>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
