export const getSessionCookieFromReq = (req?: any) => {
  if (!req) return null

  let cookie = req?.cookies["__Secure-next-auth.session-token"] || req.cookies["next-auth.session-token"]

  if (!cookie && req?.cookies?.get) {
    cookie = req.cookies.get("__Secure-next-auth.session-token") || req.cookies.get("next-auth.session-token")
  }

  return cookie
}

/**
 * {
  "x-matched-path": "/api/trpc/[trpc]",
  "accept-language": "en-US,en;q=0.9",
  "x-vercel-ip-timezone": "America/Los_Angeles",
  "x-vercel-ip-as-number": "14061",
  "x-forwarded-host": "lunchbreak-bttl9r66z-ai-x-labs.vercel.app",
  "x-vercel-id": "sfo1::2g8d6-1742252781069-ded52368f5c7",
  "x-vercel-deployment-url": "lunchbreak-bttl9r66z-ai-x-labs.vercel.app",
  "x-vercel-ip-continent": "NA",
  "x-vercel-sc-headers": "{\"Authorization\": \"Bearer xxx\"}",
  "x-vercel-proxy-signature-ts": "1742253081",
  "x-vercel-proxy-signature": "Bearer b0eec41bfe2b7752b9bf7fa58645e86091f0b3ef7beead614097bcf41c41a5e5",
  "sec-fetch-site": "same-origin",
  "x-vercel-ip-postal-code": "94142",
  "sec-fetch-dest": "empty",
  "x-vercel-ja4-digest": "t13d1516h2_8daaf6152771_d8a2da3f94cd",
  "x-vercel-ip-country": "US",
  "x-vercel-ip-latitude": "37.7794",
  "x-vercel-sc-host": "iad1.suspense-cache.vercel-infra.com",
  "host": "lunchbreak-bttl9r66z-ai-x-labs.vercel.app",
  "x-real-ip": "209.38.150.232",
  "forwarded": "for=209.38.150.232;host=lunchbreak-bttl9r66z-ai-x-labs.vercel.app;proto=https;sig=0QmVhcmVyIGIwZWVjNDFiZmUyYjc3NTJiOWJmN2ZhNTg2NDVlODYwOTFmMGIzZWY3YmVlYWQ2MTQwOTdiY2Y0MWM0MWE1ZTU=;exp=1742253081",
  "x-vercel-ip-city": "San%20Francisco",
  "x-vercel-ip-longitude": "-122.4176",
  "referer": "https://lunchbreak-bttl9r66z-ai-x-labs.vercel.app/",
  "x-vercel-sc-basepath": "",
  "x-vercel-forwarded-for": "209.38.150.232",
  "priority": "u=1, i",
  "x-forwarded-proto": "https",
  "cookie": "_vercel_jwt=eyJhbGciOiJxxxxxxxx; ph_phc_N8Y2LCM0COotgkQC1fQuIY1xLiNmMjJrbhRXpJYvXqU_posthog=%7B%22distinct_id%22%3A%220195a65b-acbe-7e66-ab3b-0746c04046ab%22%2C%22%24sesid%22%3A%5B1742252780850%2C%220195a65b-acbc-75b4-abf9-349e6e40da72%22%2C1742252780732%5D%2C%22%24initial_person_info%22%3A%7B%22r%22%3A%22%24direct%22%2C%22u%22%3A%22https%3A%2F%2Flunchbreak-bttl9r66z-ai-x-labs.vercel.app%2F%22%7D%7D",
  "x-vercel-ip-country-region": "CA",
  "sec-fetch-mode": "cors",
  "user-agent": "vercel-screenshot/1.0",
  "accept-encoding": "gzip, deflate, br, zstd",
  "x-vercel-proxied-for": "209.38.150.232",
  "content-type": "application/json",
  "x-vercel-internal-ingress-bucket": "bucket017",
  "x-forwarded-for": "209.38.150.232",
  "connection": "close"
}

 */

export interface IVercelRequestHeaders {
  "x-matched-path": string
  "accept-language": string
  "x-vercel-ip-timezone": string
  "x-vercel-ip-as-number": string
  "x-forwarded-host": string
  "x-vercel-id": string
  "x-vercel-deployment-url": string
  "x-vercel-ip-continent": string
  "x-vercel-sc-headers": string
  "x-vercel-proxy-signature-ts": string
  "x-vercel-proxy-signature": string
  "sec-fetch-site": string
  "x-vercel-ip-postal-code": string
  "sec-fetch-dest": string
  "x-vercel-ja4-digest": string
  "x-vercel-ip-country": string
  "x-vercel-ip-latitude": string
  "x-vercel-sc-host": string
  host: string
  "x-real-ip": string
  forwarded: string
  "x-vercel-ip-city": string
  "x-vercel-ip-longitude": string
  referer: string
  "x-vercel-sc-basepath": string
  "x-vercel-forwarded-for": string
  priority: string
  "x-forwarded-proto": string
  cookie: string
  "x-vercel-ip-country-region": string
  "sec-fetch-mode": string
  "user-agent": string
  "accept-encoding": string
  "x-vercel-proxied-for": string
  "content-type": string
  "x-vercel-internal-ingress-bucket": string
  "x-forwarded-for": string
  connection: string
  authorization: string
}
