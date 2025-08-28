import { useState } from "react"
import { ArrowRight, X } from "lucide-react"

import { Button, buttonVariants } from "../components"
import { cn } from "../lib"
import { ReactNode } from "react"

interface IFooterBannerProps {
  primaryText?: string
  secondaryText?: ReactNode | string
  buttonText?: string
  onClick?: () => void
  onClose?: () => void
  style: "destructive" | "secondary" | "outline" | "gradient"
}
export const FooterBanner = ({
  style,
  primaryText,
  secondaryText,
  buttonText,
  onClick,
  onClose,
}: IFooterBannerProps) => {
  const [showFooterBanner, setShowFooterBanner] = useState(true)

  if (!showFooterBanner) return null

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 flex min-h-12 shrink-0 items-center gap-x-6 overflow-hidden bg-muted/50 px-6 py-2.5 sm:px-3.5 sm:before:flex-1",
        {
          "bg-destructive text-destructive-foreground": style === "destructive",
          "bg-secondary": style === "secondary",
          "": style === "outline",
        },
      )}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="flex-row items-center text-sm leading-6">
          <strong className="font-semibold">{primaryText}</strong>
          {secondaryText && (
            <span>
              {" • "}
              {secondaryText}
            </span>
          )}
        </p>

        {buttonText && onClick && (
          <a
            onClick={onClick}
            className={cn(buttonVariants({ variant: "secondary", size: "xs" }), "cursor-pointer", {
              "border-destructive": style === "destructive",
            })}
          >
            {buttonText}
            <ArrowRight className="ml-2" size={16} />
          </a>
        )}
      </div>

      <div className="flex flex-1 justify-end self-start">
        <Button
          size="iconXs"
          variant="ghost"
          type="button"
          onClick={() => {
            setShowFooterBanner(false)
            onClose?.()
          }}
        >
          <span className="sr-only">Dismiss</span>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
