import { useState } from "react"

import { Card, CardContent } from "../components"
import { cn } from "../lib"

import type React from "react"

// Animation types
export type AnimationType = "subtle" | "diagonal" | "vertical" | "horizontal" | "rotate" | "scale" | "fade" | "custom"

// Animation configuration
export interface AnimationConfig {
  type: AnimationType
  distance?: number // pixels to move
  angle?: number // degrees for rotation
  scale?: number // scale factor
  duration?: number // milliseconds
  delay?: number // milliseconds
  easing?: string // CSS easing function
  customStyles?: {
    initial?: React.CSSProperties
    hover?: React.CSSProperties
  }
}

// Default animation configurations
const defaultAnimations: Record<AnimationType, AnimationConfig> = {
  subtle: {
    type: "subtle",
    distance: 16,
    angle: 20,
    duration: 600,
    easing: "cubic-bezier(0.4, 0, 0.2, 1)",
  },
  diagonal: {
    type: "diagonal",
    distance: 32,
    angle: 12,
    duration: 500,
    easing: "cubic-bezier(0.4, 0, 0.2, 1)",
  },
  vertical: {
    type: "vertical",
    distance: 24,
    duration: 400,
    easing: "ease-out",
  },
  horizontal: {
    type: "horizontal",
    distance: 24,
    duration: 400,
    easing: "ease-out",
  },
  rotate: {
    type: "rotate",
    angle: 180,
    duration: 600,
    easing: "cubic-bezier(0.4, 0, 0.2, 1)",
  },
  scale: {
    type: "scale",
    scale: 1.1,
    duration: 400,
    easing: "ease-out",
  },
  fade: {
    type: "fade",
    duration: 300,
    easing: "ease",
  },
  custom: {
    type: "custom",
    customStyles: {
      initial: {},
      hover: {},
    },
  },
}

interface ConfigurableAnimatedCardProps {
  title?: string
  description?: string
  primaryImage: string
  secondaryImage: string
  primaryImageAlt?: string
  secondaryImageAlt?: string
  primaryAnimation?: AnimationConfig
  secondaryAnimation?: AnimationConfig
  horizontal?: boolean
  className?: string
  contentClassName?: string
  imageClassName?: string
}

export default function ConfigurableAnimatedCard({
  title,
  description,
  primaryImage,
  secondaryImage,
  primaryImageAlt = "Primary image",
  secondaryImageAlt = "Secondary image",
  primaryAnimation = defaultAnimations.subtle, // Changed default to subtle
  secondaryAnimation,
  horizontal = false,
  className,
  contentClassName,
  imageClassName,
}: ConfigurableAnimatedCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  // If secondaryAnimation is not provided, mirror the primaryAnimation in the opposite direction
  const secondaryConfig = secondaryAnimation || {
    ...primaryAnimation,
    // Invert direction for diagonal, horizontal, vertical
    distance: primaryAnimation.distance ? -primaryAnimation.distance : undefined,
    // Invert angle for rotation
    angle: primaryAnimation.angle ? -primaryAnimation.angle : undefined,
  }

  // Generate styles based on animation type for primary image
  const getPrimaryImageStyles = () => {
    const config = { ...defaultAnimations[primaryAnimation.type], ...primaryAnimation }
    const baseStyles = "absolute inset-0 transition-all transform-gpu"

    // For custom CSS styles
    if (config.type === "custom" && config.customStyles) {
      return {
        className: baseStyles,
        style: {
          transitionDuration: `${config.duration || 500}ms`,
          transitionTimingFunction: config.easing || "ease-out",
          zIndex: 10,
          ...(isHovered ? config.customStyles.hover : config.customStyles.initial),
        },
      }
    }

    // For the new subtle animation
    if (config.type === "subtle") {
      return {
        className: baseStyles,
        style: {
          transitionDuration: `${config.duration || 600}ms`,
          transitionTimingFunction: config.easing || "cubic-bezier(0.4, 0, 0.2, 1)",
          zIndex: 10,
          transform: isHovered
            ? `translate(${config.distance! / 2}px, -${config.distance!}px) rotate(${config.angle! / 2}deg)`
            : "translate(0, 0) rotate(0deg)",
        },
      }
    }

    // For other animation types
    let transform = ""

    switch (config.type) {
      case "diagonal":
        transform = isHovered
          ? `translate(-${config.distance || 8}px, -${config.distance || 8}px) rotate(-${config.angle || 12}deg)`
          : "translate(0, 0) rotate(0deg)"
        break
      case "vertical":
        transform = isHovered ? `translateY(-${config.distance || 8}px)` : "translateY(0)"
        break
      case "horizontal":
        transform = isHovered ? `translateX(-${config.distance || 8}px)` : "translateX(0)"
        break
      case "rotate":
        transform = isHovered ? `rotate(${config.angle || 180}deg)` : "rotate(0deg)"
        break
      case "scale":
        transform = isHovered ? `scale(${config.scale || 1.1})` : "scale(1)"
        break
      case "fade":
        // Handled separately with opacity
        break
    }

    return {
      className: baseStyles,
      style: {
        transitionDuration: `${config.duration || 500}ms`,
        transitionTimingFunction: config.easing || "ease-out",
        zIndex: 10,
        transform,
        opacity: config.type === "fade" && isHovered ? 0 : 1,
      },
    }
  }

  // Generate styles based on animation type for secondary image
  const getSecondaryImageStyles = () => {
    const config = { ...defaultAnimations[secondaryConfig.type], ...secondaryConfig }
    const baseStyles = "absolute inset-0 transition-all transform-gpu"

    // For custom CSS styles
    if (config.type === "custom" && config.customStyles) {
      return {
        className: baseStyles,
        style: {
          transitionDuration: `${config.duration || 500}ms`,
          transitionTimingFunction: config.easing || "ease-out",
          zIndex: 5,
          ...(isHovered ? config.customStyles.hover : config.customStyles.initial),
        },
      }
    }

    // For the new subtle animation
    if (config.type === "subtle") {
      return {
        className: baseStyles,
        style: {
          transitionDuration: `${config.duration || 600}ms`,
          transitionTimingFunction: config.easing || "cubic-bezier(0.4, 0, 0.2, 1)",
          zIndex: 5,
          transform: isHovered
            ? `translate(${config.distance!}px, -${config.distance! / 2}px) rotate(-${config.angle!}deg)`
            : "translate(0, 0) rotate(0deg)",
        },
      }
    }

    // For other animation types
    let transform = ""

    switch (config.type) {
      case "diagonal":
        transform = isHovered
          ? `translate(${Math.abs(config.distance || 8)}px, -${Math.abs(config.distance || 8)}px) rotate(${Math.abs(
              config.angle || 12,
            )}deg)`
          : "translate(0, 0) rotate(0deg)"
        break
      case "vertical":
        transform = isHovered ? `translateY(-${config.distance || 8}px)` : "translateY(0)"
        break
      case "horizontal":
        transform = isHovered ? `translateX(${Math.abs(config.distance || 8)}px)` : "translateX(0)"
        break
      case "rotate":
        transform = isHovered ? `rotate(${config.angle || 180}deg)` : "rotate(0deg)"
        break
      case "scale":
        transform = isHovered ? `scale(${config.scale || 1.1})` : "scale(1)"
        break
      case "fade":
        // Handled separately with opacity
        break
    }

    return {
      className: baseStyles,
      style: {
        transitionDuration: `${config.duration || 500}ms`,
        transitionTimingFunction: config.easing || "ease-out",
        zIndex: 5,
        transform,
        opacity: config.type === "fade" && isHovered ? 0 : 1,
      },
    }
  }

  const primaryImageStyles = getPrimaryImageStyles()
  const secondaryImageStyles = getSecondaryImageStyles()

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-300",
        horizontal ? "max-w-4xl" : "max-w-md mx-auto",
        className,
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent
        className={cn("p-6", horizontal ? "grid grid-cols-1 md:grid-cols-2 gap-6 items-center" : "", contentClassName)}
      >
        <div className={cn(horizontal ? "order-2 md:order-1" : "")}>
          {title && (
            <h3
              className={cn(
                "font-medium mb-3 transition-all duration-300",
                horizontal ? "text-2xl" : "text-xl text-center",
                isHovered ? "transform -translate-y-1" : "",
              )}
            >
              {title}
            </h3>
          )}

          {description && (
            <p
              className={cn(
                "text-primary transition-all duration-300",
                horizontal ? "" : "text-center text-sm",
                isHovered ? "opacity-100" : "opacity-80",
              )}
            >
              {description}
            </p>
          )}
        </div>

        <div className={cn("relative", horizontal ? "h-64 order-1 md:order-2" : "h-64 w-full mt-4", imageClassName)}>
          <div {...primaryImageStyles}>
            <img
              src={primaryImage || "/placeholder.svg"}
              alt={primaryImageAlt}
              className="w-full h-full object-cover rounded-md shadow-md"
            />
          </div>

          <div {...secondaryImageStyles}>
            <img
              src={secondaryImage || "/placeholder.svg"}
              alt={secondaryImageAlt}
              className="w-full h-full object-cover rounded-md shadow-md"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
