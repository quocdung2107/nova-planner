import { TagInput } from "#components/ui/tag-input"

interface NoteTagInputProps {
  tags:        string[]
  suggestions?: string[]
  onChange:    (tags: string[]) => void
}

export function NoteTagInput({ tags, suggestions, onChange }: NoteTagInputProps) {
  return <TagInput tags={tags} suggestions={suggestions} onChange={onChange} />
}
