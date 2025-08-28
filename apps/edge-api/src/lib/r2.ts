import { blg } from "@shray/apiutils/src/logging"

let r2Client: any

export const getR2Client = async () => {
  if (r2Client) return r2Client

  const { AwsClient } = await import("aws4fetch")

  const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID
  const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY

  if (!r2AccessKeyId || !r2SecretAccessKey) {
    blg.error("Missing R2 env vars:", {
      R2_ACCESS_KEY_ID: r2AccessKeyId ? "SET" : "MISSING",
      R2_SECRET_ACCESS_KEY: r2SecretAccessKey ? "SET" : "MISSING",
    })
    throw new Error("Missing R2 environment variables: R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY are required")
  }

  r2Client = new AwsClient({
    region: "auto",
    accessKeyId: r2AccessKeyId,
    secretAccessKey: r2SecretAccessKey,
  })

  blg.info("R2 client initialized successfully")
  return r2Client
}