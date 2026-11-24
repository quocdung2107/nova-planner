import { Pin } from "lucide-react"
import { cn } from "#lib/utils"

interface NoteListItemProps {
  title: string
  date: string
  selected?: boolean
  pinned?: boolean
  masked?: boolean
  onClick?: () => void
  onTogglePin?: () => void
}

export function NoteListItem({ title, date, selected, pinned, masked, onClick, onTogglePin }: NoteListItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-3 py-2.5 rounded-lg transition-colors group relative",
        "hover:bg-accent",
        selected && "bg-accent"
      )}
    >
      {onTogglePin && (
        <span
          role="button"
          tabIndex={-1}
          onClick={e => { e.stopPropagation(); onTogglePin() }}
          className={cn(
            "absolute right-2 top-2.5 p-1 rounded-md hover:bg-background/60",
            pinned ? "text-foreground" : "text-muted-foreground opacity-0 group-hover:opacity-100"
          )}
        >
          <Pin className={cn("size-3", pinned && "fill-current")} />
        </span>
      )}
      <p
        className={cn(
          "text-sm font-medium leading-snug truncate pr-5",
          selected ? "text-accent-foreground" : "text-foreground",
          masked && "blur-[2px] select-none"
        )}
      >
        {title}
      </p>
      <p className={cn("text-xs text-muted-foreground mt-0.5", masked && "blur-[2px] select-none")}>{date}</p>
    </button>
  )
}
