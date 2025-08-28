import { Promise as BPromise } from "bluebird"
import { times } from "lodash-es"
import { ImageSize, KlingAIImageGenerationModelType, VideoGenerationModelType } from "../llms"
import { generateKlingAnimation } from "../models/replicate/kling"

/**
 * Can handle both text to video as well as image to video
 */
export const generateAIVideo = async (
  prompt: string,
  model: VideoGenerationModelType,
  n = 1,
  size: ImageSize = ImageSize.Size1024x1024,
  options?: {
    start_image?: string
    duration?: 5 | 10
    cfg_scale?: number
  },
): Promise<string[]> => {
  if (model === KlingAIImageGenerationModelType.KLING_STANDARD) {
    const output = await BPromise.map(times(n), async () => {
      return await generateKlingAnimation({
        prompt,
        size,
        start_image: options?.start_image,
        duration: options?.duration || 5,
        cfg_scale: options?.cfg_scale || 0.5,
      })
    })
    return output
  }

  throw new Error("Unsupported video generation model")
}
