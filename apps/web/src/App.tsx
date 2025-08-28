import { RouterProvider } from "@tanstack/react-router"

import { router } from "./router"
import { PWAInstallPrompt } from "./components/PWAInstallPrompt"

/**
 * Main App Component with TanStack Router
 */
function App() {
  return (
    <>
      <RouterProvider router={router} />
      <PWAInstallPrompt />
    </>
  )
}

export default App
