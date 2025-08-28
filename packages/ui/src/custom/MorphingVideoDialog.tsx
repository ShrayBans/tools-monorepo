import { XIcon } from "lucide-react"
import React, { useRef, useCallback } from "react"
import {
  MorphingDialog,
  MorphingDialogTrigger,
  MorphingDialogContainer,
  MorphingDialogContent,
  MorphingDialogClose,
} from "./MorphingDialog"
import { cn } from "../lib/utils"

interface MorphingVideoDialogProps {
  src: string
  previewClassName?: string
  dialogClassName?: string
}

export const MorphingVideoDialog: React.FC<MorphingVideoDialogProps> = ({
  src,
  previewClassName = "aspect-video w-full",
  dialogClassName = "aspect-video h-[50vh] w-full md:h-[70vh]",
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const dialogVideoRef = useRef<HTMLVideoElement>(null)

  const handleDialogOpen = useCallback(() => {
    setTimeout(() => {
      if (videoRef.current && dialogVideoRef.current) {
        dialogVideoRef.current.currentTime = videoRef.current.currentTime
      }
    }, 0)
  }, [])

  return (
    <div className="relative">
      <MorphingDialog
        transition={{
          type: "spring",
          bounce: 0.2,
          duration: 0.4,
        }}
        onOpen={handleDialogOpen}
      >
        <div className="relative rounded-2xl overflow-hidden bg-background shadow-[0_8px_16px_rgb(0_0_0_/_0.1),_0_1px_2px_rgb(0_0_0_/_0.1)] transform transition-all duration-300">
          <MorphingDialogTrigger className="block w-full overflow-hidden rounded-2xl">
            <video
              ref={videoRef}
              src={src}
              autoPlay
              loop
              muted
              playsInline
              className={cn(
                "cursor-zoom-in w-full rounded-2xl transform transition-transform duration-300 hover:scale-[1.02]",
                previewClassName,
              )}
            />
          </MorphingDialogTrigger>
        </div>

        <MorphingDialogContainer>
          <div className="relative rounded-2xl overflow-hidden bg-background/80 backdrop-blur-sm shadow-[0_8px_32px_rgb(0_0_0_/_0.1),_0_2px_4px_rgb(0_0_0_/_0.1)]">
            <MorphingDialogContent className="relative rounded-2xl overflow-hidden">
              <video
                ref={dialogVideoRef}
                src={src}
                autoPlay
                loop
                muted
                playsInline
                className={cn("rounded-2xl", dialogClassName)}
              />
            </MorphingDialogContent>
          </div>
          <MorphingDialogClose
            className="fixed top-6 right-6 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
            variants={{
              initial: { opacity: 0, scale: 0.8 },
              animate: {
                opacity: 1,
                scale: 1,
                transition: { delay: 0.2, duration: 0.2 },
              },
              exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } },
            }}
          >
            <XIcon className="h-5 w-5 text-foreground/80" />
          </MorphingDialogClose>
        </MorphingDialogContainer>
      </MorphingDialog>
    </div>
  )
}
