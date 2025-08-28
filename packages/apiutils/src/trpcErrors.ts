import { TRPCError } from "@trpc/server"

/**
 * CUSTOM ERRORS
 */

export const BadDataError = (message: string) => {
  return new TRPCError({
    code: "BAD_REQUEST",
    message: message,
  })
}

export const RateLimitError = (message: string) => {
  return new TRPCError({
    code: "TOO_MANY_REQUESTS",
    message: message,
  })
}

export const NotFoundError = (message: string) => {
  return new TRPCError({
    code: "NOT_FOUND",
    message: message,
  })
}

export const DuplicateContentError = (message: string) => {
  return new TRPCError({
    code: "CONFLICT",
    message: message,
  })
}

export const UnauthorizedError = (message: string) => {
  return new TRPCError({
    code: "UNAUTHORIZED",
    message: message,
  })
}

export const ForbiddenError = (message: string) => {
  return new TRPCError({
    code: "FORBIDDEN",
    message: message,
  })
}

export const InternalServerError = (message: string) => {
  return new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: message,
  })
}

export const mapTRPCErrorToErrorCode = (error: TRPCError) => {
  console.log("error", error)
  switch (error.code) {
    case "BAD_REQUEST":
      return 400
    case "TOO_MANY_REQUESTS":
      return 429
    case "NOT_FOUND":
      return 404
    case "CONFLICT":
      return 409
    case "UNAUTHORIZED":
      return 401
    case "FORBIDDEN":
      return 403
    case "INTERNAL_SERVER_ERROR":
      return 500
    default:
      return 500
  }
}
