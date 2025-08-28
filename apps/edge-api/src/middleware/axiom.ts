import { axiomLogger } from "@shray/apiutils/src/axiom/logger"
import { blg } from "@shray/apiutils/src/logging"

import type { Context, Next } from 'hono';
async function httpLoggingMiddleware(c: Context, next: Next): Promise<void> {
  const start = Date.now();

  // Extract request info
  const url = new URL(c.req.url);
  const endpoint = url.pathname;
  const method = c.req.method;
  const userAgent = c.req.header('user-agent') || '';

  // Extract Cloudflare specific headers
  const cfRay = c.req.header('cf-ray') || '';
  const cfRequestId = c.req.header('cf-request-id') || '';
  const cfCountry = c.req.header('cf-ipcountry') || '';
  const cfEdgeLocation = c.req.header('cf-edge-location') || '';

  // Extract trace ID from CF-Ray (format: "123456789abcdef-LAX")
  const traceId = cfRay.split('-')[0] || cfRay;

  // Try to extract user info if available
  const userId = c.req.header('x-user-id') || c.get('userId') || undefined;

  // Continue with the request
  await next();

  const duration = Date.now() - start;
  const status = c.res.status;


  // Only log if status >= 200
  if (status >= 200) {
    const logLevel = status >= 400 ? 'warn' : 'info';
    const message = `${method} ${endpoint} ${status} ${duration}ms`;

    const context = {
      http: {
        method,
        endpoint,
        status,
        duration,
        userAgent
      },
      cloudflare: {
        ray: cfRay,
        requestId: cfRequestId,
        traceId: traceId,
        country: cfCountry,
        edgeLocation: cfEdgeLocation
      },
      userId
    };

    const metadata = {
      requestContext: {
        endpoint,
        userId,
        cfRay,
        cfRequestId,
        traceId
      },
      environment: 'cloudflare-workers'
    };

    // Use the shared application logger
    axiomLogger.log(logLevel, message, context, metadata);

  } else {
    blg.info(`[HTTP Middleware] Status ${status} < 200, skipping log`);
  }
}

// Export a function to flush logs (useful for cleanup)
async function flushAxiomLogs(): Promise<void> {
  await axiomLogger.flush();
}

export { httpLoggingMiddleware, flushAxiomLogs };