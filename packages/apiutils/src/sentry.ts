import { IS_CLOUDFLARE_DEPLOYED, IS_VERCEL_DEPLOYED } from "@shray/env"
import { concat, filter, size } from "lodash-es"
import { Toucan } from "toucan-js"

import { generateDebugContext } from "./errors"
import { blg } from "./logging"

let sentry

export const initSentry = (request: Request, env: any, ctx: any) => {
  if (IS_CLOUDFLARE_DEPLOYED) {
    sentry = new Toucan({
      dsn: "https://00bcc3f1267753602c49ee6a13288474@o235488.ingest.us.sentry.io/4509691351597056",
      context: ctx,
      request,
      // allowedHeaders: ["user-agent"],
      // allowedSearchParams: /(.*)/,
      environment: env.NODE_ENV || "production",
    })
  }

  return sentry
}

// const { LEVEL } = require("triple-beam");
// import * as winston from "winston";
const globalIgnoredErrors = [
  /ENOMEM/,
  /EFAULT/,
  /PEM routines:get_name:no start line/, // Noisy crypto error from Object.getCookies()
  /request aborted/, // Happens in many applications when user presses ESC in the browser, or closes the browser app on mobile. Ignorable.
  /exceeded the maximum number of declines on this card/, // Normal customer-action error
]

const allIgnoredSentryErrors = concat(globalIgnoredErrors, [
  /BAD_REQUEST/,
  /MOMENTIC/, // Ignores errors triggered by Momentic tests
  /Redis connection to /,
  /Request failed with status code 404/,
  /ThrottlingException/,
  /SmartyStreetsError/,
  /Your card.*/,
  /ShopifyExportError/,
  /AuthenticationDeniedError/,
  /OutdatedVersionError/,
  /AccessDeniedError/,
  /RateLimitedError/,
  /NotFoundError/,
  /StripeExpectedError/,
  /MediaExpectedError/,
  /WorldExpectedError/,
  /ThreadsExpectedError/,
  /TaxjarError/,
  /TokenExpiredError/,
  /JsonWebTokenError/,
  /PayPalExpectedError/,
  /ProgressionUserExpectedError/,
  /PaymentExistsError/,
  /LoginError/,
  /StreamNotFoundError/,
  /DefaultMerchCreationError/,
  /The nextToken cannot be/,
  /The provided PaymentMethod was previously used with a PaymentIntent/, // A normal Stripe customer-action error that is not a bug for us.
])

/**
 * Logging Helpers - Adds extra context to the logs so that there is enough information to properly debug errors.
 */
export const reportRequestErrorToSentry = (_e: any, _req: any, _message = "") => {
  // const sentryContext = {
  //   extra: generateDebugContext(req, message),
  // }
  // reportErrorToSentry(e, "requestError", sentryContext)
}
// export const sentryLogger = getLogger("sentry");
export const sentryLogger = console

/**
 * Should mainly be used to send errors.
 *
 * There is a global error handler
 */
export const reportErrorToSentry = (err: Error | any, uniqueId?: string, context: any = {}, skipError = false) => {
  let error = err
  if (typeof error === "string") {
    error = { message: error }
  }
  /**
   * SEND ERROR TO AXIOM
   */
  blg.error(`[Sentry Error] [${uniqueId}]: ${error?.message}`, {
    ...context,
    stack: error.stack,
  })

  // Ignores messages that should be ignored
  const shouldIgnoreError =
    size(
      filter(allIgnoredSentryErrors, (errorRegex) => {
        const errorMessageWithName = `${error?.code}: ${error?.message}`
        const isMatched = errorMessageWithName.match(errorRegex)
        return isMatched
      }),
    ) > 0

  if (shouldIgnoreError && IS_VERCEL_DEPLOYED) {
    blg.info(`[Ignored Err]: ${error?.message}`)
    return
  }
  // const traceMetadata = nr.getTraceMetadata();
  // const traceId = traceMetadata?.traceId;

  /**
   * SEND ERROR TO SENTRY
   */
  const first8LinesStack = error?.stack?.split("\n")?.slice(0, 8)?.join("\n")
  const sentryContext = {
    meta: {
      // traceId,
      uniqueId,
      error: { ...error, stack: first8LinesStack, message: error?.message },
      context,
    },
  }

  if (IS_VERCEL_DEPLOYED) {
    sentryContext.meta.context = context
    sentryLogger.error(`${shouldIgnoreError ? "Ignored " : ""}Sentry Error: ${JSON.stringify(sentryContext)}`)
  } else {
    sentryLogger.error(
      `${
        shouldIgnoreError ? "Ignored " : ""
      }Sentry Error: ${error?.message} - [${uniqueId}] context: ${JSON.stringify(context)}`,
    )
  }

  if (!skipError && sentry) {
    sentry.withScope((scope) => {
      scope.setTags(context.tags)
      scope.setExtras(context.extra)
      sentry.captureException(error)
    })
  }
}

export const reportMessageToSentry = (_msg: any, _context: any = {}) => {
  // if (!isEmpty(msg)) {
  //   sentryLogger.info(`Sentry Message:`, { meta: { message: msg, context } });
  //   Sentry.withScope((scope) => {
  //     scope.setTags(context.tags);
  //     scope.setExtras(context.extra);
  //     Sentry.captureMessage(msg);
  //   });
  // }
}
