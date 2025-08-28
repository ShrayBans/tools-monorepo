// export const sha256 = (arrayBuffer: ArrayBuffer) => {
//   const buffer = Buffer.from(arrayBuffer)
//   const hmac = createHmac("sha256", buffer)
//   return hmac.digest("hex")
// }

// export const create256HashedString = (str?: string) => {
//   if (!str) return ""

//   return createHash("sha256").update(str).digest("hex")
// }
