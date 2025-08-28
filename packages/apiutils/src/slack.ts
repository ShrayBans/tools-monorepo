import { isProdVercelEnv, isTestEnv } from "@shray/env"
import axios from "axios"
import { isObject } from "lodash-es"

import { blg } from "./logging"
import { reportErrorToSentry } from "./sentry"

const channels = {
  "#alert-uptime": "https://hooks.slack.com/services/xxxxx",
}

/**
 * To do a shoutout use, <!here>
 * In order to add another webhook, go to (please ask for access in #eng):
 * AIx Labs:  https://api.slack.com/apps/A05FQKLRV7H/incoming-webhooks to add a channel and paste the webhook here
 * LUNCHBREak: https://api.slack.com/apps/A06687U0U68/incoming-webhooks
 * Reference (for formatting): https://api.slack.com/reference/surfaces/formatting
 * @param message - can either be a string or an object with a text property
 * @param channel
 */
export async function slackMessage(
  message: object | string,
  channel: keyof typeof channels,
  devChannel?: keyof typeof channels,
) {
  if (!message) {
    reportErrorToSentry(new Error(`No message provided to slackMessage for channel: ${channel}`))
    return
  }

  const requestBody = isObject(message) ? message : { text: `${isProdVercelEnv ? "[PROD] " : "[DEV] "}${message}` }
  const devUrl = devChannel ? channels[devChannel] : null

  // Obtained from App integration and webhook creation - #streaming-notifications channel
  const prodUrl = channels[channel]
  const url = isProdVercelEnv ? prodUrl : devUrl || prodUrl

  if (!url) throw new Error("No Slack Channel Available")
  if (isTestEnv) {
    return
  }

  try {
    blg.info(`Sending Slack Message: ${JSON.stringify(message)} to ${channel}`)
    await axios.post(url, requestBody)
    blg.info(`SUCCESSFUL: Slack Message sent: ${JSON.stringify(message)} to ${channel}`)
  } catch (err) {
    if (err instanceof Error) {
      console.log("Error sending message to Slack", JSON.stringify(err.message))
    }
    reportErrorToSentry(err, "slackMessage", {
      context: "SlackMessage",
      message: JSON.stringify(message),
      channel: channel,
    })
  }

  // `res` contains information about the posted message
}
