// import winston from "winston";
// import { userAgentData } from "./helpers";
import { head, map, join, isNumber } from "lodash-es"

import { reportErrorToSentry } from "./sentry"
import { blg } from "./logging"

const _options: any = {
  delimiter: {
    error: " <> ",
  },
  transform: ({ errorMessage, index }: any) => `Error #${index + 1}: ${errorMessage}`,
}

export const formatZodError = (zodError: any) => {
  const customErrorMessages = map(zodError?.issues, (issue, idx) => {
    // Example: templates.[31].fullText
    const path = map(issue.path, (path, _i) => {
      return isNumber(path) ? `[${path}]` : path
    }).join(".")

    // Example: String must contain at least 10 character(s)
    return `${idx + 1}) ${path}: ${issue.message}`
  })
  const errorMessageString = `Validation Error: ${join(customErrorMessages, " ")}`

  // const zodErrorMessage = generateErrorMessage(zodError?.issues, options);
  // // const firstErrorMessage = zodError?.issues?.[0]?.message;

  // const pathRegex = /Path: (\w+)/;
  // const messageRegex = /Message: (.+)$/;

  // const pathMatch = zodErrorMessage.match(pathRegex);
  // const messageMatch = zodErrorMessage.match(messageRegex);

  // const path = pathMatch ? pathMatch[1] : null;
  // const message = messageMatch ? messageMatch[1] : null;

  return {
    allErrorMessage: errorMessageString,
    formattedErrors: customErrorMessages,
    firstErrorMessage: head(customErrorMessages),
  }
}

export const ignoredTRPCErrors = ["BAD_REQUEST", "UNAUTHORIZED"]

export const generateDebugContext = (req: any, message = "") => {
  return {
    // @ts-ignore
    userAgent: userAgentData(req?.useragent),
    params: req?.params,
    body: req?.body,
    query: req?.query,
    auth: {
      userId: req?.auth?.userId,
      artistBrandId: req?.auth?.artistBrandId,
    },
    url: `${req?.method} ${req?.url}`,
    headers: req?.headers,
    environment: process.env.ENVIRONMENT,
    appType: process.env.APP_NAME,
    message,
  }
}
export const sentryErrorWrapper = (job: any, err: any, message = "", _log?: any) => {
  blg.error(`${message}: ${err.message} [${err.code}] --- ${err.stack}`)

  const sentryContext = {
    extra: {
      job: JSON.stringify(job),
      environment: process.env.ENVIRONMENT,
      appType: process.env.APP_NAME,
    },
  }
  reportErrorToSentry(err, "", sentryContext)
}
