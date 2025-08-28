export const VIRAL_MARKETING_TEMPLATES = 200
export const SUPPORT_EMAIL = "support@shraylabs.co"
export const LEGAL_EMAIL = "legal@shraylabs.co"
export const TEAM_EMAIL = "legal@shraylabs.co"
export const PRIVACY_EMAIL = "legal@shraylabs.co"

export const MAX_VIDEO_DURATION_SEC = 90 * 60 // 1 hour 30 minutes in seconds
export const MAX_VIDEO_FILE_SIZE = 1024 * 1024 * 1024 // 1GB
export const ALLOWED_CONTENT_TYPES = [
  // Audio formats
  "audio/mp3",
  "audio/mp4",
  "audio/wav",
  "audio/mpeg",
  "audio/x-wav",
  "audio/x-aiff",
  "audio/aiff",
  "audio/x-m4a",
  "audio/x-caf",
  "audio/m4a",
  "audio/aac",
  "audio/ogg",
  "audio/webm",
  "audio/flac",

  // Video formats
  "video/quicktime",
  "video/x-m4v",
  "video/mp4",
  "video/m4a",
  "video/m4v",
  "video/webm",
  "video/ogg",
  "video/avi",
  "video/x-matroska",
  "video/x-flv",
  "video/x-msvideo",
  "video/x-ms-wmv",
  "video/mpeg",

  "image/png",
  "image/jpeg",
  "image/jpg",
]

export interface OverlayEffect {
  id: string
  name: string
  url: string
}
