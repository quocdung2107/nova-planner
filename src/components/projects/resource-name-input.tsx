import { KeyboardEvent, useState } from "react"
import { Input } from "#components/ui/input"
import { cn } from "#lib/utils"

interface ResourceNameInputProps {
  value:       string
  suggestions: string[]
  onChange:    (value: string) => void
}

export function ResourceNameInput({ value, suggestions, onChange }: ResourceNameInputProps) {
  const [showDropdown, setShowDropdown] = useState(false)

  const filtered = suggestions.filter(
    s => s.toLowerCase().includes(value.toLowerCase()) && s.toLowerCase() !== value.toLowerCase()
  )

  function select(name: string) {
    onChange(name)
    setShowDropdown(false)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") setShowDropdown(false)
    else if (e.key === "Enter") setShowDropdown(false)
  }

  return (
    <div className="relative">
      <Input
        placeholder="Person name"
        value={value}
        onChange={e => { onChange(e.target.value); setShowDropdown(true) }}
        onKeyDown={handleKeyDown}
        onFocus={() => setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
      />

      {showDropdown && filtered.length > 0 && (
        <div className={cn(
          "absolute left-0 top-full z-50 mt-1 w-full max-h-48 overflow-y-auto",
          "rounded-md border bg-popover shadow-md",
          "py-1 text-sm"
        )}>
          {filtered.map(name => (
            <button
              key={name}
              type="button"
              className="w-full px-3 py-1.5 text-left hover:bg-accent transition-colors"
              onMouseDown={e => { e.preventDefault(); select(name) }}
            >
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
