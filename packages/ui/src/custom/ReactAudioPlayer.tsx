import { useState, useCallback } from "react"
import WavesurferPlayer from "@wavesurfer/react"
import { Volume2, VolumeX, Play, Pause } from "lucide-react"
import { formatTime } from "../utils/format-time"
import { Button } from "../.."

interface ReactAudioPlayerProps {
  url: string
  onPlay?: () => void
  onPause?: () => void
  initWavesurfer?: (ws: any) => void
}

export const ReactAudioPlayer = ({ url, onPlay, onPause, initWavesurfer }: ReactAudioPlayerProps) => {
  const [wavesurfer, setWavesurfer] = useState<any>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)

  const onReady = useCallback((ws: any) => {
    setWavesurfer(ws)
    setDuration(ws.getDuration())
    setIsPlaying(false)
    initWavesurfer?.(ws)
  }, [])

  const togglePlayPause = useCallback(() => {
    if (wavesurfer) {
      wavesurfer.playPause()
    }
  }, [wavesurfer])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        {/* Play/Pause button */}
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full shrink-0"
          onClick={togglePlayPause}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
        </Button>

        {/* Waveform container */}
        <div className="relative flex-1 group">
          <WavesurferPlayer
            height={100}
            dragToSeek
            waveColor="#94a3b8"
            progressColor="#10b981"
            // waveColor={{
            //   gradient: ["#94a3b8", "#cbd5e1"],
            //   type: "gradient",
            // }}
            // progressColor={{
            //   gradient: ["#10b981", "#34d399"],
            //   type: "gradient",
            // }}
            url={url}
            onReady={onReady}
            onPlay={() => {
              setIsPlaying(true)
              onPlay?.()
            }}
            onPause={() => {
              setIsPlaying(false)
              onPause?.()
            }}
          />

          {/* Time displays */}
          <div className="absolute left-0 top-1/2 z-20 -translate-y-1/2 text-xs bg-black/75 px-1 py-0.5 text-gray-300">
            {formatTime(currentTime)}
          </div>
          <div className="absolute right-0 top-1/2 z-20 -translate-y-1/2 text-xs bg-black/75 px-1 py-0.5 text-gray-300">
            {formatTime(duration)}
          </div>

          {/* Volume control - only show on hover */}
          {/* <div className="absolute right-0 top-0 h-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-2 pr-2">
            <div className="flex items-center gap-2 bg-black/75 px-2 py-1 rounded">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-8 w-8"
                onClick={toggleMute}
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-24"
                aria-label="Volume"
              />
            </div>
          </div> */}
        </div>
      </div>
    </div>
  )
}
