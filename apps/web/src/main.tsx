import "./index.css"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import React from "react"
import ReactDOM from "react-dom/client"

import App from "./App"
import { AuthProvider } from "./lib/auth-context"
import { ThemeProvider } from "./lib/theme-context"
import { createTRPCReactClient, trpc } from "./lib/trpc"

/**
 * Create React Query client with sensible defaults
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Increase stale time for better UX
      staleTime: 60 * 1000, // 1 minute
      // Retry failed requests
      retry: (failureCount, error: any) => {
        // Don't retry 4xx errors (client errors)
        if (error?.data?.httpStatus >= 400 && error?.data?.httpStatus < 500) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});

/**
 * Create tRPC client - URL is determined automatically
 */
const trpcClient = createTRPCReactClient();

/**
 * Main App Component with Providers
 */
const AppWithProviders: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <App />
          </QueryClientProvider>
        </trpc.Provider>
      </AuthProvider>
    </ThemeProvider>
  );
}

/**
 * Render the app
 */
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AppWithProviders />
  </React.StrictMode>
);
