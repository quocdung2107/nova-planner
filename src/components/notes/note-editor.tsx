import { useEffect, useRef, useState } from "react"
import { Eye, Pencil, Trash2, Check, Loader2, Minus, Plus, ListTodo, Download, FileText, FileCode2, FileDown, Pin, PinOff } from "lucide-react"
import { useDebounce } from "use-debounce"
import { toast } from "sonner"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"
import { Button } from "#components/ui/button"
import { Separator } from "#components/ui/separator"
import { Textarea } from "#components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "#components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "#components/ui/alert-dialog"
import { NoteTagInput } from "./note-tag-input"
import { PdfExportDialog } from "./pdf-export-dialog"
import { getNoteById, updateNote, deleteNote, setTagsForNote } from "#lib/notes"
import { createTodo } from "#lib/todos"
import { exportNoteAsTxt, exportNoteAsMarkdown, exportNoteAsPdf } from "#lib/export-note"
import { useNotesStore } from "#store/notes"
import { useTodosStore } from "#store/todos"
import type { NoteWithTags } from "#lib/types/note"
import { cn } from "#lib/utils"

const TODO_TITLE_MAX_LENGTH = 100

type Mode       = "edit" | "preview"
type SaveStatus = "idle" | "saving" | "saved"

interface NoteEditorProps {
  noteId: string
}

const FONT_SIZE_KEY = "note-editor-font-size"
const FONT_SIZE_MIN = 11
const FONT_SIZE_MAX = 24
const FONT_SIZE_DEFAULT = 14

function loadFontSize(): number {
  const stored = Number(localStorage.getItem(FONT_SIZE_KEY))
  return stored >= FONT_SIZE_MIN && stored <= FONT_SIZE_MAX ? stored : FONT_SIZE_DEFAULT
}

export function NoteEditor({ noteId }: NoteEditorProps) {
  const { patchNoteInList, removeNote } = useNotesStore.getState()

  const titleInputRef  = useRef<HTMLInputElement>(null)
  const textareaRef    = useRef<HTMLTextAreaElement>(null)
  const previewRef     = useRef<HTMLDivElement>(null)
  const scrollRatioRef = useRef(0)

  const [title,      setTitle]      = useState("")
  const [content,    setContent]    = useState("")
  const [tags,       setTags]       = useState<string[]>([])
  const [mode,       setMode]       = useState<Mode>("edit")
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")
  const [loaded,     setLoaded]     = useState(false)
  const [pinned,     setPinned]     = useState(false)
  const [fontSize,   setFontSize]   = useState(loadFontSize)
  const [selectionButton, setSelectionButton] = useState<{ top: number; left: number; text: string } | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [pdfExportDialogOpen, setPdfExportDialogOpen] = useState(false)

  const selectionButtonRef = useRef<HTMLButtonElement>(null)

  const [debouncedTitle]   = useDebounce(title,   1000)
  const [debouncedContent] = useDebounce(content, 1000)

  // Track last-saved values to avoid redundant writes
  const savedRef  = useRef({ title: "", content: "", tags: [] as string[] })
  // Track latest values for flush-on-note-change
  const latestRef = useRef({ title: "", content: "", tags: [] as string[] })
  const noteIdRef = useRef(noteId)
  // Serialize tag writes per note so rapid add/remove/switch cannot
  // interleave DELETE + INSERT sequences (H3).
  const tagWritesRef = useRef(new Map<string, Promise<void>>())

  function queueTagWrite(targetId: string, tagsToWrite: string[]): Promise<void> {
    const prev = tagWritesRef.current.get(targetId) ?? Promise.resolve()
    const next = prev.catch(() => {}).then(() => setTagsForNote(targetId, tagsToWrite))
    tagWritesRef.current.set(targetId, next.catch(() => {}))
    return next
  }

  function tagsEqual(a: string[], b: string[]): boolean {
    return a.length === b.length && a.every((v, i) => v === b[i])
  }

  useEffect(() => {
    const prevId = noteIdRef.current
    const prev   = latestRef.current
    const saved  = savedRef.current

    if (prevId && (prev.title !== saved.title || prev.content !== saved.content)) {
      updateNote(prevId, {
        title:   prev.title.trim() || null,
        content: prev.content,
      }).catch(console.error)
    }
    if (prevId && !tagsEqual(prev.tags, saved.tags)) {
      void queueTagWrite(prevId, prev.tags).catch(console.error)
    }

    noteIdRef.current = noteId
    setLoaded(false)
    setSaveStatus("idle")
    // Clear stale content immediately so the previous note's data
    // never shows while the new note is loading.
    setTitle("")
    setContent("")
    setTags([])
    setPinned(false)

    getNoteById(noteId).then((note: NoteWithTags | null) => {
      if (!note) return
      setTitle(note.title ?? "")
      setContent(note.content)
      setTags(note.tags)
      setPinned(note.pinned)
      savedRef.current  = { title: note.title ?? "", content: note.content, tags: [...note.tags] }
      latestRef.current = { title: note.title ?? "", content: note.content, tags: [...note.tags] }
      setLoaded(true)
      // Focus title for new notes, textarea for existing ones
      requestAnimationFrame(() => {
        titleInputRef.current?.focus()
      })
    }).catch(console.error)
  }, [noteId])

  // Auto-save when debounced values settle
  useEffect(() => {
    if (!loaded) return
    // Guard: if debounced values haven't caught up with the current note's
    // actual content yet, they're still carrying the previous note's data.
    // Skip until the debounce reflects what the user is actually looking at.
    if (debouncedTitle !== latestRef.current.title || debouncedContent !== latestRef.current.content) return
    const s = savedRef.current
    if (debouncedTitle === s.title && debouncedContent === s.content) return

    setSaveStatus("saving")
    savedRef.current = { title: debouncedTitle, content: debouncedContent, tags: savedRef.current.tags }

    const now = new Date().toISOString()
    updateNote(noteId, {
      title:   debouncedTitle.trim() || null,
      content: debouncedContent,
    }).then(() => {
      // Update the list in the store so title + date reflect immediately
      patchNoteInList(noteId, {
        title:      debouncedTitle.trim() || null,
        updated_at: now,
      })
      setSaveStatus("saved")
      setTimeout(() => setSaveStatus("idle"), 2000)
    }).catch(console.error)
  }, [debouncedTitle, debouncedContent, loaded, noteId, patchNoteInList])

  function handleScroll(e: React.UIEvent<HTMLElement>) {
    const el = e.currentTarget
    const maxScroll = el.scrollHeight - el.clientHeight
    scrollRatioRef.current = maxScroll > 0 ? el.scrollTop / maxScroll : 0
    setSelectionButton(null)
  }

  function handleModeChange(next: Mode) {
    setMode(next)
    setSelectionButton(null)
    requestAnimationFrame(() => {
      const el = next === "edit" ? textareaRef.current : previewRef.current
      if (!el) return
      const maxScroll = el.scrollHeight - el.clientHeight
      el.scrollTop = scrollRatioRef.current * maxScroll
    })
  }

  // Dismiss the floating "Add as todo" button on any click outside of it.
  useEffect(() => {
    if (!selectionButton) return
    function handleDocMouseDown(e: MouseEvent) {
      if (selectionButtonRef.current?.contains(e.target as Node)) return
      setSelectionButton(null)
    }
    document.addEventListener("mousedown", handleDocMouseDown)
    return () => document.removeEventListener("mousedown", handleDocMouseDown)
  }, [selectionButton])

  function handlePreviewSelect() {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed || !previewRef.current) return

    const text = selection.toString()
    if (!text.trim()) return
    if (!selection.anchorNode || !previewRef.current.contains(selection.anchorNode)) return

    const rect = selection.getRangeAt(0).getBoundingClientRect()
    setSelectionButton({ top: rect.top - 40, left: rect.left + rect.width / 2, text })
  }

  async function handleAddSelectionAsTodo(text: string) {
    const trimmed = text.trim().replace(/\s+/g, " ")
    setSelectionButton(null)
    if (!trimmed) return

    const title = trimmed.length > TODO_TITLE_MAX_LENGTH
      ? trimmed.slice(0, TODO_TITLE_MAX_LENGTH).trimEnd() + "…"
      : trimmed
    const description = trimmed.length > TODO_TITLE_MAX_LENGTH ? trimmed : null

    try {
      const created = await createTodo({ title, description })
      useTodosStore.getState().addTodo(created)
      toast.success("Added to todo")
    } catch (err) {
      console.error("Failed to create todo from selection:", err)
      toast.error("Failed to add todo")
    }
  }

  function changeFontSize(delta: number) {
    setFontSize(prev => {
      const next = Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, prev + delta))
      localStorage.setItem(FONT_SIZE_KEY, String(next))
      return next
    })
  }

  function handleTitleChange(v: string) {
    setTitle(v)
    latestRef.current.title = v
  }

  function handleContentChange(v: string) {
    setContent(v)
    latestRef.current.content = v
  }

  function handleTagsChange(next: string[]) {
    setTags(next)
    latestRef.current.tags = next
    void queueTagWrite(noteId, next).then(() => {
      if (noteIdRef.current === noteId) {
        savedRef.current.tags = next
      }
    }).catch(console.error)
  }

  async function handleTogglePin() {
    setPinned(prev => !prev)
    await useNotesStore.getState().togglePin(noteId)
  }

  async function handleDelete() {
    setDeleteDialogOpen(false)
    try {
      await deleteNote(noteId)
      removeNote(noteId)
    } catch (err) {
      console.error("Failed to delete note:", err)
      toast.error(err instanceof Error ? err.message : "Failed to delete note")
    }
  }

  async function handleExportTxt() {
    try {
      const exported = await exportNoteAsTxt(title, content)
      if (exported) toast.success("Exported as .txt")
    } catch (err) {
      console.error("Failed to export note as txt:", err)
      toast.error("Failed to export note")
    }
  }

  async function handleExportMarkdown() {
    try {
      const exported = await exportNoteAsMarkdown(title, content)
      if (exported) toast.success("Exported as .md")
    } catch (err) {
      console.error("Failed to export note as markdown:", err)
      toast.error("Failed to export note")
    }
  }

  async function handleExportPdf(footerTemplate: string, dateOverride: string | undefined) {
    try {
      const exported = await exportNoteAsPdf(title, content, { footerTemplate, dateOverride })
      if (exported) toast.success("Exported as PDF")
    } catch (err) {
      console.error("Failed to export note as PDF:", err)
      toast.error("Failed to export note")
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-3 border-b shrink-0">
        <div className="flex items-center gap-1">
          <Button
            variant={mode === "edit" ? "secondary" : "ghost"}
            size="xs"
            onClick={() => handleModeChange("edit")}
          >
            <Pencil className="size-3" />
            Edit
          </Button>
          <Button
            variant={mode === "preview" ? "secondary" : "ghost"}
            size="xs"
            onClick={() => handleModeChange("preview")}
          >
            <Eye className="size-3" />
            Preview
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => changeFontSize(-1)}
              disabled={fontSize <= FONT_SIZE_MIN}
            >
              <Minus className="size-3" />
            </Button>
            <span className="w-6 text-center text-xs text-muted-foreground tabular-nums">{fontSize}</span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => changeFontSize(1)}
              disabled={fontSize >= FONT_SIZE_MAX}
            >
              <Plus className="size-3" />
            </Button>
          </div>
          <Separator orientation="vertical" className="h-4" />
          {saveStatus === "saving" && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="size-3 animate-spin" />
              Saving…
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Check className="size-3" />
              Saved
            </span>
          )}
          <Separator orientation="vertical" className="h-4" />
          <Button
            variant="ghost"
            size="icon-sm"
            className={cn("text-muted-foreground", pinned && "text-foreground")}
            onClick={handleTogglePin}
          >
            {pinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="text-muted-foreground">
                <Download className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={handleExportTxt}>
                <FileText />
                Save as .txt
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handleExportMarkdown}>
                <FileCode2 />
                Save as .md
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setPdfExportDialogOpen(true)}>
                <FileDown />
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      {/* Title + Tags */}
      <div className="px-5 pt-4 pb-2 shrink-0 space-y-2">
        <input
          ref={titleInputRef}
          className="w-full bg-transparent text-xl font-semibold outline-none placeholder:text-muted-foreground/40"
          placeholder="Untitled"
          value={title}
          onChange={e => handleTitleChange(e.target.value)}
        />
        <NoteTagInput tags={tags} onChange={handleTagsChange} />
      </div>

      <Separator />

      {/* Body */}
      <div className="flex-1 overflow-hidden">
        {mode === "edit" ? (
          <Textarea
            ref={textareaRef}
            className={cn(
              "h-full w-full resize-none rounded-none border-none shadow-none",
              "px-5 py-4 font-note-mono leading-relaxed",
              "focus-visible:ring-0"
            )}
            style={{ fontSize }}
            value={content}
            onChange={e => handleContentChange(e.target.value)}
            onScroll={handleScroll}
            placeholder="Start writing in markdown…"
          />
        ) : (
          <div
            ref={previewRef}
            onScroll={handleScroll}
            onMouseDown={() => setSelectionButton(null)}
            onMouseUp={handlePreviewSelect}
            style={{ fontSize }}
            className={cn(
              "h-full overflow-y-auto px-5 py-4 prose prose-neutral dark:prose-invert max-w-none",
              "font-note-sans prose-code:font-note-mono prose-pre:font-note-mono"
            )}
          >

            {content.trim() ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>{content}</ReactMarkdown>
            ) : (
              <p className="text-muted-foreground italic text-sm">Nothing to preview yet.</p>
            )}
          </div>
        )}
      </div>

      {selectionButton && (
        <Button
          ref={selectionButtonRef}
          size="xs"
          className="fixed z-50 -translate-x-1/2 shadow-md"
          style={{ top: selectionButton.top, left: selectionButton.left }}
          onClick={() => handleAddSelectionAsTodo(selectionButton.text)}
        >
          <ListTodo className="size-3" />
          Add as todo
        </Button>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this note?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{title.trim() || "Untitled"}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PdfExportDialog
        open={pdfExportDialogOpen}
        onOpenChange={setPdfExportDialogOpen}
        onConfirm={handleExportPdf}
      />
    </div>
  )
}
