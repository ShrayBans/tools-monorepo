import { useEffect, useState } from "react"

export interface BlurImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string
  alt: string
  width?: number | string
  height?: number | string
  className?: string
}

export default function BlurImage({ src, alt, className, ...props }: BlurImageProps) {
  const [loading, setLoading] = useState(true)
  const [currentSrc, setCurrentSrc] = useState(src)
  
  useEffect(() => {
    setCurrentSrc(src)
    setLoading(true)
  }, [src])

  const handleLoad = () => {
    setLoading(false)
  }

  const handleError = () => {
    setCurrentSrc(`https://avatar.vercel.sh/${alt}`) // if the image fails to load, use the default avatar
    setLoading(false)
  }

  return (
    <img
      {...props}
      src={currentSrc}
      alt={alt}
      className={`transition-all duration-300 ${loading ? "blur-[2px]" : "blur-0"} ${className || ""}`}
      onLoad={handleLoad}
      onError={handleError}
    />
  )
}
