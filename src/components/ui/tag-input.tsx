import { useEffect, useRef, useState } from "react"
import type { KeyboardEvent } from "react"
import { X } from "lucide-react"

import { Badge } from "#components/ui/badge"
import { Input } from "#components/ui/input"
import { cn } from "#lib/utils"

export function normalizeTagName(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, "-")
}

export function TagBadge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <Badge
      variant="secondary"
      className={cn("text-[10px] px-1.5 py-0 h-4 font-normal", className)}
      {...props}
    />
  )
}

interface TagInputProps {
  tags: string[]
  suggestions?: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
}

export function TagInput({ tags, suggestions = [], onChange, placeholder }: TagInputProps) {
  const [inputValue, setInputValue] = useState("")
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = suggestions.filter(
    s => s.toLowerCase().includes(inputValue.toLowerCase()) && !tags.includes(s)
  )

  // Clamp when the filtered list shrinks (e.g. typing narrows suggestions
  // or a tag is added) so Enter/highlight never reads out of bounds.
  const safeIndex = filtered.length === 0 ? 0 : Math.min(activeIndex, filtered.length - 1)

  const showDropdown = open && filtered.length > 0

  // Capture-phase Escape handler: Radix DismissableLayer (Dialog) listens on
  // document during capture and dismisses unless defaultPrevented. React's
  // onKeyDown runs later at bubble phase, so it can never win inside a modal.
  // Listening on window capture runs before any document listener regardless
  // of registration order; preventDefault + stopPropagation keeps the Dialog
  // open and closes only the suggestion list. The React onKeyDown Escape
  // branch below remains as fallback for the non-Dialog case.
  useEffect(() => {
    if (!showDropdown) return
    const onWindowKeyDownCapture = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        e.stopPropagation()
        setOpen(false)
      }
    }
    window.addEventListener("keydown", onWindowKeyDownCapture, true)
    return () => window.removeEventListener("keydown", onWindowKeyDownCapture, true)
  }, [showDropdown])

  function addTag(raw: string) {
    const name = normalizeTagName(raw)
    if (!name || tags.includes(name)) {
      setInputValue("")
      setOpen(false)
      return
    }
    onChange([...tags, name])
    setInputValue("")
    setOpen(false)
    setActiveIndex(0)
  }

  function removeTag(name: string) {
    onChange(tags.filter(t => t !== name))
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" && filtered.length > 0) {
      e.preventDefault()
      setOpen(true)
      setActiveIndex(prev => (prev + 1) % filtered.length)
    } else if (e.key === "ArrowUp" && filtered.length > 0) {
      e.preventDefault()
      setActiveIndex(prev => (prev - 1 + filtered.length) % filtered.length)
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (showDropdown && filtered[safeIndex]) {
        addTag(filtered[safeIndex])
      } else {
        addTag(inputValue)
      }
    } else if (e.key === ",") {
      e.preventDefault()
      addTag(inputValue)
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }

  // Plain inline dropdown (no portal): the previous Radix Popover rendered
  // its content into document.body, where the modal Dialog's focus trap and
  // the popover's own DismissableLayer treated the anchor input as an
  // "outside" interaction and closed the list ~a beat after it opened.
  // An absolutely-positioned list has no focus management of its own, so
  // focusing/typing can never dismiss it by itself.
  return (
    <div className="relative">
      <div
        className="flex items-center gap-1.5 flex-wrap min-h-[28px] cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
          {tags.map(tag => (
            <TagBadge key={tag} className="gap-1 pl-2 pr-1 text-xs h-5">
              {tag}
              <button
                type="button"
                className="rounded-sm opacity-60 hover:opacity-100 transition-opacity"
                onClick={e => { e.stopPropagation(); removeTag(tag) }}
              >
                <X className="size-2.5" />
              </button>
            </TagBadge>
          ))}
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={e => { setInputValue(e.target.value); setOpen(true); setActiveIndex(0) }}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (filtered.length > 0) setOpen(true) }}
            onBlur={() => { if (inputValue.trim()) addTag(inputValue); else setOpen(false) }}
            className="h-5 w-28 border-none shadow-none bg-transparent px-1 text-xs focus-visible:ring-0 placeholder:text-muted-foreground/50"
            placeholder={placeholder ?? (tags.length === 0 ? "Add tag…" : "")}
          />
        </div>
      {showDropdown && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full min-w-[140px] rounded-md border bg-popover p-1 shadow-md">
          <div className="max-h-48 overflow-y-auto text-xs">
            {filtered.map((tag, i) => (
              <button
                key={tag}
                type="button"
                className={cn(
                  "w-full px-3 py-1.5 text-left transition-colors",
                  i === safeIndex ? "bg-accent" : "hover:bg-accent"
                )}
                onMouseDown={e => e.preventDefault()}
                onClick={() => addTag(tag)}
                onMouseEnter={() => setActiveIndex(i)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
