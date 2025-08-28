/**
 * Meta Creative Service
 * Handles creative asset uploads and management for Meta Ads API
 */

import { axiosGet, axiosPost } from "../axios"
import { blg } from "../logging"

// Meta API configuration
const META_BASE_URL = "https://graph.facebook.com"
const META_API_VERSION = "v19.0"

export interface MetaImageUploadResponse {
  images: {
    [filename: string]: {
      hash: string
      url?: string
    }
  }
}

export interface MetaVideoUploadResponse {
  id: string
  success: boolean
}

export interface MetaVideoStatus {
  id: string
  status: {
    video_status: 'ready' | 'processing' | 'error'
    uploading_phase: {
      status: 'complete' | 'in_progress' | 'error'
      errors?: Array<{
        code: number
        message: string
      }>
    }
    processing_phase?: {
      status: 'complete' | 'in_progress' | 'error'
      errors?: Array<{
        code: number
        message: string
      }>
    }
  }
  created_time: string
  updated_time: string
}

export interface CreativeUploadResult {
  success: boolean
  type: 'image' | 'video'
  metaId?: string // hash for images, id for videos
  url?: string
  thumbnailUrl?: string
  error?: string
}

export interface MetaAdImage {
  hash: string
  url: string
  created_time: string
}

export interface MetaAdVideo {
  id: string
  title: string
  created_time: string
  updated_time: string
}

/**
 * Upload image to Meta Ad Account
 */
export async function uploadImage(
  accessToken: string,
  accountId: string,
  imageBuffer: Buffer,
  filename: string
): Promise<string> {
  try {
    blg.info("Uploading image to Meta", { accountId, filename, size: imageBuffer.length })

    // Create form data
    const formData = new FormData()
    const imageBlob = new Blob([new Uint8Array(imageBuffer)], { type: 'image/jpeg' })
    formData.append('filename', imageBlob, filename)

    const response = await fetch(`${META_BASE_URL}/${META_API_VERSION}/act_${accountId}/adimages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: formData
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json() as MetaImageUploadResponse

    const imageHash = result.images[filename]?.hash
    if (!imageHash) {
      throw new Error('No image hash returned from Meta API')
    }

    blg.info("Successfully uploaded image to Meta", { 
      accountId, 
      filename, 
      imageHash 
    })

    return imageHash
  } catch (error: any) {
    blg.error("Error uploading image to Meta", { 
      accountId, 
      filename, 
      error: error.message 
    })
    throw new Error(`Failed to upload image: ${error.message}`)
  }
}

/**
 * Upload video to Meta Ad Account
 */
export async function uploadVideo(
  accessToken: string,
  accountId: string,
  videoBuffer: Buffer,
  filename: string
): Promise<string> {
  try {
    blg.info("Uploading video to Meta", { accountId, filename, size: videoBuffer.length })

    // Create form data
    const formData = new FormData()
    const videoBlob = new Blob([new Uint8Array(videoBuffer)], { type: 'video/mp4' })
    formData.append('source', videoBlob, filename)

    const response = await fetch(`${META_BASE_URL}/${META_API_VERSION}/act_${accountId}/advideos`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: formData
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json() as MetaVideoUploadResponse

    if (!result.success || !result.id) {
      throw new Error('Failed to upload video to Meta')
    }

    blg.info("Successfully uploaded video to Meta", { 
      accountId, 
      filename, 
      videoId: result.id 
    })

    return result.id
  } catch (error: any) {
    blg.error("Error uploading video to Meta", { 
      accountId, 
      filename, 
      error: error.message 
    })
    throw new Error(`Failed to upload video: ${error.message}`)
  }
}

/**
 * Upload video from URL to Meta Ad Account
 */
export async function uploadVideoFromUrl(
  accessToken: string,
  accountId: string,
  videoUrl: string,
  name: string
): Promise<string> {
  try {
    blg.info("Uploading video from URL to Meta", { accountId, videoUrl, name })

    const response = await axiosPost<MetaVideoUploadResponse>(
      `${META_BASE_URL}/${META_API_VERSION}/act_${accountId}/advideos`,
      {
        source: videoUrl,
        name: name
      },
      {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      "meta-video-upload-url",
      { timeout: 60000 } // Longer timeout for video uploads
    )

    if (!response.success || !response.id) {
      throw new Error('Failed to upload video from URL to Meta')
    }

    blg.info("Successfully uploaded video from URL to Meta", { 
      accountId, 
      videoUrl, 
      name,
      videoId: response.id 
    })

    return response.id
  } catch (error: any) {
    blg.error("Error uploading video from URL to Meta", { 
      accountId, 
      videoUrl, 
      name,
      error: error.message 
    })
    throw new Error(`Failed to upload video from URL: ${error.message}`)
  }
}

/**
 * Get video upload status
 */
export async function getVideoStatus(
  accessToken: string,
  videoId: string
): Promise<MetaVideoStatus> {
  try {
    const response = await axiosGet<MetaVideoStatus>(
      `${META_BASE_URL}/${META_API_VERSION}/${videoId}`,
      {
        Authorization: `Bearer ${accessToken}`,
      },
      "meta-video-status",
      {
        params: {
          fields: 'id,status,created_time,updated_time'
        },
        timeout: 30000
      }
    )

    return response
  } catch (error: any) {
    blg.error("Error getting video status", { videoId, error: error.message })
    throw new Error(`Failed to get video status: ${error.message}`)
  }
}

/**
 * Get all uploaded images for an ad account
 */
export async function getAdImages(
  accessToken: string,
  accountId: string,
  limit: number = 25
): Promise<MetaAdImage[]> {
  try {
    const response = await axiosGet<{data: MetaAdImage[]}>(
      `${META_BASE_URL}/${META_API_VERSION}/act_${accountId}/adimages`,
      {
        Authorization: `Bearer ${accessToken}`,
      },
      "meta-ad-images",
      {
        params: {
          fields: 'hash,url,created_time',
          limit: limit
        },
        timeout: 30000
      }
    )

    return response.data
  } catch (error: any) {
    blg.error("Error fetching ad images", { accountId, error: error.message })
    throw new Error(`Failed to fetch ad images: ${error.message}`)
  }
}

/**
 * Get all uploaded videos for an ad account
 */
export async function getAdVideos(
  accessToken: string,
  accountId: string,
  limit: number = 25
): Promise<MetaAdVideo[]> {
  try {
    const response = await axiosGet<{data: MetaAdVideo[]}>(
      `${META_BASE_URL}/${META_API_VERSION}/act_${accountId}/advideos`,
      {
        Authorization: `Bearer ${accessToken}`,
      },
      "meta-ad-videos",
      {
        params: {
          fields: 'id,title,created_time,updated_time',
          limit: limit
        },
        timeout: 30000
      }
    )

    return response.data
  } catch (error: any) {
    blg.error("Error fetching ad videos", { accountId, error: error.message })
    throw new Error(`Failed to fetch ad videos: ${error.message}`)
  }
}

/**
 * Delete an image from Meta ad account
 */
export async function deleteAdImage(
  accessToken: string,
  accountId: string,
  imageHash: string
): Promise<boolean> {
  try {
    await axiosPost(
      `${META_BASE_URL}/${META_API_VERSION}/act_${accountId}/adimages`,
      {
        hash: imageHash
      },
      {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      "meta-delete-image"
    )

    blg.info("Successfully deleted image from Meta", { accountId, imageHash })
    return true
  } catch (error: any) {
    blg.error("Error deleting image from Meta", { accountId, imageHash, error: error.message })
    return false
  }
}

/**
 * Batch upload multiple images
 */
export async function batchUploadImages(
  accessToken: string,
  accountId: string,
  images: Array<{buffer: Buffer, filename: string}>
): Promise<CreativeUploadResult[]> {
  const results: CreativeUploadResult[] = []

  for (const image of images) {
    try {
      const hash = await uploadImage(accessToken, accountId, image.buffer, image.filename)
      results.push({
        success: true,
        type: 'image',
        metaId: hash
      })
    } catch (error: any) {
      results.push({
        success: false,
        type: 'image',
        error: error.message
      })
    }
  }

  return results
}

/**
 * Batch upload multiple videos
 */
export async function batchUploadVideos(
  accessToken: string,
  accountId: string,
  videos: Array<{buffer: Buffer, filename: string}>
): Promise<CreativeUploadResult[]> {
  const results: CreativeUploadResult[] = []

  for (const video of videos) {
    try {
      const videoId = await uploadVideo(accessToken, accountId, video.buffer, video.filename)
      results.push({
        success: true,
        type: 'video',
        metaId: videoId
      })
    } catch (error: any) {
      results.push({
        success: false,
        type: 'video',
        error: error.message
      })
    }
  }

  return results
}

/**
 * Wait for video processing to complete
 */
export async function waitForVideoProcessing(
  accessToken: string,
  videoId: string,
  maxWaitTime: number = 300000, // 5 minutes
  pollInterval: number = 10000 // 10 seconds
): Promise<MetaVideoStatus> {
  const startTime = Date.now()

  while (Date.now() - startTime < maxWaitTime) {
    const status = await getVideoStatus(accessToken, videoId)

    if (status.status.video_status === 'ready') {
      return status
    }

    if (status.status.video_status === 'error') {
      throw new Error(`Video processing failed: ${JSON.stringify(status.status)}`)
    }

    // Wait before polling again
    await new Promise(resolve => setTimeout(resolve, pollInterval))
  }

  throw new Error('Video processing timeout - video may still be processing')
}