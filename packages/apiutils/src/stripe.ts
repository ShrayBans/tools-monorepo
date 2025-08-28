export const isSubscriptionFailedPayment = (stripeSubscriptionStatus: string) => {
  return ["incomplete", "incomplete_expired", "past_due", "unpaid"].includes(stripeSubscriptionStatus)
}
