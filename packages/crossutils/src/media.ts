import { capitalize, includes } from "lodash-es"

import { checkYouTubeForId } from "./youtube"

export enum EMediaType {
  AUDIO = "audio",
  IMAGE = "image",
  VIDEO = "video",
  TEXT = "text",
  PDF = "pdf",
}

export const getMediaType = (urlOrPath: string): EMediaType => {
  let fileType: string | undefined

  try {
    // Attempt to treat the input as a URL
    const url = new URL(urlOrPath)

    // Check if the URL is a YouTube link
    if (url.hostname === "www.youtube.com" || url.hostname === "youtu.be") {
      return EMediaType.VIDEO
    }

    fileType = url.pathname.split(".").pop()
  } catch (_error) {
    // If it fails, treat it as a file path
    fileType = urlOrPath.split(".").pop()
  }
  switch (fileType) {
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
      return EMediaType.IMAGE
    case "mp4":
    case "avi":
    case "mov":
    case "ogg":
    case "m4v":
    case "x-msvideo":
    case "x-ms-wmv":
    case "mpeg":
    case "quicktime":
    case "x-matroska":
    case "x-flv":
      return EMediaType.VIDEO
    case "mp3":
    case "m4a":
    case "wav":
    case "flac":
    case "aac":
    case "webm":
    case "x-m4a":
    case "x-caf":
    case "x-wav":
    case "x-aiff":
    case "aiff":
      return EMediaType.AUDIO
    case "pdf":
      return EMediaType.PDF
    default:
      return EMediaType.TEXT
  }
}

export const getMediaDuration = (file: File): Promise<number> => {
  return new Promise<number>((resolve) => {
    const element = file.type.startsWith("video") ? document.createElement("video") : document.createElement("audio")
    element.preload = "metadata"
    element.onloadedmetadata = () => {
      window.URL.revokeObjectURL(element.src)
      resolve(element.duration)
    }
    element.src = URL.createObjectURL(file)
  })
}

export const ALL_UPLOAD_URL_TYPES = [
  "youtube",
  "loom",
  "vimeo",
  "dailymotion",
  "facebook",
  "instagram",
  "tiktok",
  "twitter",
  "twitch",
  "linkedin",
  "googleDrive",
  "dropbox",
]

export const getUrlUploadType = (url: string) => {
  let sourceType = "upload"
  let cleanedUrl = url

  if (checkYouTubeForId(url)) {
    sourceType = "youtube"
  } else if (includes(url, "loom.com")) {
    sourceType = "loom"
  } else if (includes(url, "vimeo.com")) {
    sourceType = "vimeo"
  } else if (includes(url, "dailymotion.com")) {
    sourceType = "dailymotion"
  } else if (includes(url, "facebook.com") && includes(url, "/videos/")) {
    sourceType = "facebook"
  } else if (includes(url, "instagram.com") && (includes(url, "/p/") || includes(url, "/reel/"))) {
    sourceType = "instagram"
  } else if (includes(url, "tiktok.com")) {
    sourceType = "tiktok"
  } else if ((includes(url, "twitter.com") || includes(url, "x.com")) && includes(url, "/status/")) {
    sourceType = "twitter"
  } else if (includes(url, "twitch.tv")) {
    sourceType = "twitch"
  } else if (includes(url, "dropbox.com")) {
    sourceType = "dropbox"
    cleanedUrl = url.replace("dl=0", "dl=1")
  } else if (includes(url, "drive.google.com")) {
    // https://drive.google.com/file/d/14o5m8ILa0l9H0CClkAs7rPEMU7TPVewn/view?usp=drive_link
    sourceType = "googleDrive"
    const fileId = url.match(/[-\w]{25,}/)
    cleanedUrl = `https://drive.google.com/uc?export=download&id=${fileId}`
  } else if (includes(url, "linkedin.com")) {
    // https://www.linkedin.com/posts/malhotra-neha_leadership-management-workplaceculture-activity-7227136587824775168-KD4S?utm_source=share&utm_medium=member_desktop
    sourceType = "linkedin"
    throw new Error("LinkedIn is not supported yet")
  }

  return {
    cleanedUrl,
    sourceType,
    defaultName: sourceType !== "upload" ? `${capitalize(sourceType)} Video` : "Transcript",
  }
}
