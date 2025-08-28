let qstashClient: any

export const getQStashClient = async () => {
  if (qstashClient) return qstashClient

  const { Client } = await import("@upstash/qstash")

  const qstashToken = process.env.QSTASH_TOKEN

  if (!qstashToken) {
    console.error("Missing QStash env vars:", {
      QSTASH_TOKEN: qstashToken ? "SET" : "MISSING",
    })
    throw new Error("Missing QStash env vars")
  }

  qstashClient = new Client({
    token: qstashToken,
  })

  return qstashClient
}