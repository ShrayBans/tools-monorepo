import React from "react"

import { useTheme } from "../lib/theme-context"

const DarkModeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme()

  React.useEffect(() => {
    function handleHotkey(e: KeyboardEvent) {
      // Cmd + Shift + .
      if (
        (e.metaKey || e.ctrlKey) && // Cmd on Mac, Ctrl on Windows/Linux
        e.shiftKey &&
        e.key === "."
      ) {
        e.preventDefault()
        toggleTheme()
      }
    }
    window.addEventListener("keydown", handleHotkey)
    return () => window.removeEventListener("keydown", handleHotkey)
  }, [toggleTheme])

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-foregroundx dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className=" dark:text-gray-300"
        >
          <path
            d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="currentColor"
          />
        </svg>
      ) : (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className=" dark:text-gray-300"
        >
          <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" fill="currentColor" />
          <path
            d="m12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      )}
    </button>
  )
}

export default DarkModeToggle
