import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../shadcnBase/ShadcnSelect"

interface ILanguageSelectorProps {
  acceptedLanguages?: string[]
}

export const LanguageSelector = ({ acceptedLanguages = ["en"] }: ILanguageSelectorProps) => {
  const [language, setLanguage] = useState(() => {
    // Get locale from localStorage or default to 'en'
    return localStorage.getItem('locale') || 'en'
  })

  const filteredOptions = [
    { value: "en", label: "EN 🇺🇸" },
    { value: "fr", label: "FR 🇫🇷" },
    { value: "es", label: "ES 🇪🇸" },
    { value: "de", label: "DE 🇩🇪" },
    { value: "ja", label: "JA 🇯🇵" },
    { value: "ko", label: "KO 🇰🇷" },
    { value: "pt", label: "PT 🇵🇹" },
    { value: "tw", label: "TW 🇹🇼" },
    { value: "vi", label: "VI 🇻🇳" },
    { value: "zh", label: "ZH 🇨🇳" },
  ].filter((option) => acceptedLanguages.includes(option.value))

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage)
    localStorage.setItem('locale', newLanguage)
    // Dispatch custom event for app-wide locale changes
    window.dispatchEvent(new CustomEvent('localeChange', { detail: newLanguage }))
  }

  // Listen for external locale changes
  useEffect(() => {
    const handleLocaleChange = (event: CustomEvent) => {
      setLanguage(event.detail)
    }
    window.addEventListener('localeChange', handleLocaleChange as EventListener)
    return () => window.removeEventListener('localeChange', handleLocaleChange as EventListener)
  }, [])

  return (
    <div>
      <Select value={language} onValueChange={handleLanguageChange}>
        <SelectTrigger className="text-sm font-medium">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {filteredOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
