import { PostHog } from "posthog-node"
import { isProdVercelEnv } from "@shray/env"

let posthogApiInstance: PostHog | null = null

export const initPostHogInstance = (apiKey: string) => {
  if (!posthogApiInstance && apiKey) {
    posthogApiInstance = new PostHog(apiKey, {
      flushAt: 1,
      flushInterval: 0,
    })
  }
  return posthogApiInstance
}

export const _phCaptureApiUtil = async (event: string, data: any, userId?: string, timestamp?: Date) => {
  if (!posthogApiInstance) {
    console.warn("PostHog not initialized")
    return
  }

  /*
    setOnce is useful for setting values that should only be set once - stored at posthog person level
    {
      first_render_at: new Date().toISOString(),
    },
  */
  let setOnce = {}
  if (data.setOnce) {
    setOnce = {
      ...data.setOnce,
    }
  }

  /*
    add is useful for accumulating values over time - stored at posthog person level
    {
      total_renders: 1,
    },
  */
  let add = {}
  if (data.add) {
    add = {
      ...data.add,
    }
  }

  console.log(`PH CAPTURE: ${userId} = ${event}: `, data)
  const formattedData = {
    ...data,
    environment: isProdVercelEnv ? "prod" : "dev",
  }
  posthogApiInstance.capture({
    distinctId: userId ?? "anonymous",
    event,
    properties: formattedData,
    ...(setOnce && { $set_once: setOnce }),
    ...(add && { $add: add }),
    timestamp: timestamp,
    // https://posthog.com/docs/experiments/adding-experiment-code#method-2-set-send_feature_flags-to-true
    sendFeatureFlags: true,
  })
  await posthogApiInstance.shutdownAsync()
}

export const phCheckFeatureFlagEnabled = async (featureFlag: string, userId: string) => {
  if (!posthogApiInstance) return false
  return await posthogApiInstance.isFeatureEnabled(featureFlag, userId)
}

export const phGetFeatureFlag = async (featureFlag: string, userId: string) => {
  if (!posthogApiInstance) return null
  return await posthogApiInstance.getFeatureFlag(featureFlag, userId)
}

export const phGetFeatureFlagPayload = async (featureFlag: string, userId: string): Promise<any> => {
  if (!posthogApiInstance) return null
  return await posthogApiInstance.getFeatureFlagPayload(featureFlag, userId)
}

export const _phIdentify = async (userId: string, properties: any) => {
  if (!posthogApiInstance) return
  await posthogApiInstance.identify({
    distinctId: userId,
    properties,
  })
}
