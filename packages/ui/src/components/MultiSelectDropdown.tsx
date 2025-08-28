import React, { useState } from "react"
import { Check } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../shadcnBase"

interface MultiSelectDropdownProps {
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
}

export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({ options, selected, onChange }) => {
  const [isOpen, setIsOpen] = useState(false)

  const toggleOption = (option: string) => {
    const newSelected = selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option]
    onChange(newSelected)
  }

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="border p-2">
        {selected.length > 0 ? selected.join(", ") : "Select options..."}
      </button>
      {isOpen && (
        <div className="absolute border bg-white">
          {options.map((option) => (
            <div key={option} className="flex items-center p-2">
              <input type="checkbox" checked={selected.includes(option)} onChange={() => toggleOption(option)} />
              <span className="ml-2">{option}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
