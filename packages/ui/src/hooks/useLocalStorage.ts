import { useEffect, useState } from "react"

const useLocalStorage = <T>(key: string, initialValue: T): [T, (value: T) => void] => {
  const [storedValue, setStoredValue] = useState(initialValue)

  useEffect(() => {
    // Retrieve from localStorage
    const item = window.localStorage.getItem(key)

    if (item) {
      try {
        setStoredValue(JSON.parse(item))
      } catch (error) {
        console.error("Error parsing localStorage value", error)
        setStoredValue(initialValue)
      }
    }
  }, [key])

  const setValue = (value: T) => {
    // Save state
    setStoredValue(value)
    // Save to localStorage
    window.localStorage.setItem(key, JSON.stringify(value))
  }
  return [storedValue, setValue]
}

export default useLocalStorage
