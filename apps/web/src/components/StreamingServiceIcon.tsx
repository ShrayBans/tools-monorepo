import {
  SiAlamy,
  SiApple,
  SiCrunchyroll,
  SiDmm,
  SiHbomax,
  SiHtop,
  SiNetflix,
  SiParamountplus,
  SiPiped,
  SiProton,
  SiSpotify,
  SiTubi,
  SiYoutube,
} from "@icons-pack/react-simple-icons"
import React from "react"

export interface StreamingServiceIconProps {
  providerName: string
  size?: number
  className?: string
}

const STREAMING_ICONS: Record<string, React.ComponentType<any>> = {
  // Exact matches
  Netflix: SiNetflix,
  "Amazon Prime Video": SiAlamy,
  Hulu: SiHtop,
  "Disney Plus": SiDmm,
  "Disney+": SiDmm,
  "HBO Max": SiHbomax,
  "Apple TV Plus": SiApple,
  "Apple TV+": SiApple,
  YouTube: SiYoutube,
  "YouTube Premium": SiYoutube,
  Spotify: SiSpotify,
  Peacock: SiPiped,
  "Peacock Premium": SiPiped,
  "Paramount Plus": SiParamountplus,
  "Paramount+": SiParamountplus,
  "Amazon Video": SiAlamy,
  "Prime Video": SiAlamy,
  Crunchyroll: SiCrunchyroll,
  "Pluto TV": SiProton,
  Tubi: SiTubi,

  // Fuzzy matches for common variations
  amazon: SiAlamy,
  prime: SiAlamy,
  netflix: SiNetflix,
  hulu: SiHtop,
  disney: SiDmm,
  hbo: SiHbomax,
  apple: SiApple,
  youtube: SiYoutube,
  peacock: SiPiped,
  paramount: SiParamountplus,
  crunchyroll: SiCrunchyroll,
  pluto: SiProton,
  tubi: SiTubi,
}

export const StreamingServiceIcon: React.FC<StreamingServiceIconProps> = ({
  providerName,
  size = 16,
  className = "",
}) => {
  // Try exact match first
  let IconComponent = STREAMING_ICONS[providerName]

  // If no exact match, try fuzzy matching
  if (!IconComponent) {
    const normalizedName = providerName.toLowerCase().trim()
    IconComponent = STREAMING_ICONS[normalizedName]

    // Try partial matches
    if (!IconComponent) {
      for (const [key, icon] of Object.entries(STREAMING_ICONS)) {
        if (normalizedName.includes(key.toLowerCase()) || key.toLowerCase().includes(normalizedName)) {
          IconComponent = icon
          break
        }
      }
    }
  }

  // Return the icon with default brand color if found
  if (IconComponent) {
    return <IconComponent size={size} className={className} color="default" />
  }

  // Fallback to generic streaming icon (📺) if no match found
  return (
    <span
      className={`inline-flex items-center justify-center ${className}`}
      style={{ fontSize: size, width: size, height: size }}
    >
      📺
    </span>
  )
}

export default StreamingServiceIcon
