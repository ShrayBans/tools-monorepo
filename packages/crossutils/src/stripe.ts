/**
 * Client side stripe library
 */
import type { Stripe } from "@stripe/stripe-js"

let stripePromise: Stripe | null

export const getStripeWeb = async () => {
  if (!stripePromise) {
    const { loadStripe } = await import("@stripe/stripe-js")

    stripePromise = await loadStripe(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE ?? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
    )
  }

  return stripePromise
}

export const getVidmaxStripeWeb = async () => {
  if (!stripePromise) {
    const { loadStripe } = await import("@stripe/stripe-js")

    stripePromise = await loadStripe(process.env.NEXT_PUBLIC_VIDMAX_STRIPE_PUBLISHABLE_KEY ?? "")
  }

  return stripePromise
}

export const getInkvisionStripeWeb = async () => {
  if (!stripePromise) {
    const { loadStripe } = await import("@stripe/stripe-js")

    stripePromise = await loadStripe(process.env.NEXT_PUBLIC_INKVISION_STRIPE_PUBLISHABLE_KEY ?? "")
  }

  return stripePromise
}

export const getArtmaxStripeWeb = async () => {
  if (!stripePromise) {
    const { loadStripe } = await import("@stripe/stripe-js")

    stripePromise = await loadStripe(process.env.NEXT_PUBLIC_ARTMAX_STRIPE_PUBLISHABLE_KEY ?? "")
  }

  return stripePromise
}

export const getTooldexStripeWeb = async () => {
  if (!stripePromise) {
    const { loadStripe } = await import("@stripe/stripe-js")

    stripePromise = await loadStripe(process.env.NEXT_PUBLIC_TOOLDEX_STRIPE_PUBLISHABLE_KEY ?? "")
  }

  return stripePromise
}

export const getUntangleStripeWeb = async () => {
  if (!stripePromise) {
    const { loadStripe } = await import("@stripe/stripe-js")

    stripePromise = await loadStripe(process.env.NEXT_PUBLIC_UNTANGLE_STRIPE_PUBLISHABLE_KEY ?? "")
  }

  return stripePromise
}
export const getPebbleStripeWeb = async () => {
  if (!stripePromise) {
    const { loadStripe } = await import("@stripe/stripe-js")

    stripePromise = await loadStripe(process.env.NEXT_PUBLIC_UNTANGLE_STRIPE_PUBLISHABLE_KEY ?? "")
  }

  return stripePromise
}
