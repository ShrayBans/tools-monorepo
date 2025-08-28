import ReactPlayer from "react-player"
import { useCallback, useState } from "react"
import { cn } from ".."

interface ReactVideoPlayerProps {
  url: string
  onPlay?: () => void
  onPause?: () => void
  onProgress?: (state: { played: number; playedSeconds: number }) => void
  onDuration?: (duration: number) => void
  playerRef?: React.RefObject<ReactPlayer>
  seekTo?: number
  className?: string
}

export const ReactVideoPlayer = ({
  url,
  onPlay,
  onPause,
  onProgress,
  onDuration,
  playerRef,
  seekTo,
  ...p
}: ReactVideoPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false)

  const handleProgress = useCallback(
    (state: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => {
      onProgress?.(state)
    },
    [onProgress],
  )

  const handlePlay = useCallback(() => {
    setIsPlaying(true)
    onPlay?.()
  }, [onPlay])

  const handlePause = useCallback(() => {
    setIsPlaying(false)
    onPause?.()
  }, [onPause])

  return (
    <div className={cn("relative bg-white rounded-lg shadow-sm aspect-video", p.className)}>
      <ReactPlayer
        ref={playerRef}
        url={url}
        width="100%"
        height="100%"
        controls={true}
        playing={isPlaying}
        onPlay={handlePlay}
        onPause={handlePause}
        onProgress={handleProgress}
        onDuration={onDuration}
        config={{
          youtube: {
            playerVars: {
              modestbranding: 1,
              rel: 0,
            },
          },
        }}
      />
    </div>
  )
}
