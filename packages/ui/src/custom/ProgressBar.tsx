import type React from "react"
import { useMemo } from "react"

export const ProgressBar: React.FC<{
  progress: number // Percentage
}> = ({ progress }) => {
  const style: React.CSSProperties = useMemo(() => {
    return {
      width: "100%",
      height: 10,
      borderRadius: 5,
      appearance: "none",
      backgroundColor: "gray",
      marginTop: 10,
      marginBottom: 25,
    }
  }, [])

  const fill: React.CSSProperties = useMemo(() => {
    return {
      // backgroundColor: "var(--foreground)",
      backgroundColor: "red",
      color: "white",
      height: 10,
      borderRadius: 5,
      transition: "width 0.1s ease-in-out",
      width: `${progress * 100}%`,
    }
  }, [progress])

  return (
    <div>
      <div style={style}>
        <div style={fill} />
      </div>
    </div>
  )
}
