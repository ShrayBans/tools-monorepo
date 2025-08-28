import { appRouter } from "../routers/_app"

// import { generateOpenAPISpec } from "./trpc-to-openapi"

const WHITELISTED_ROUTES = ["info.health"]
// // Generate OpenAPI spec
// export const openApiSpec = generateOpenAPISpec(appRouter, {
//   title: 'AixLabs API',
//   version: '1.0.0',
//   baseUrl: 'https://api-agent.shraylabs.co'
// }, WHITELISTED_ROUTES);
