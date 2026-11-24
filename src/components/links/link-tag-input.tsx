import { TagInput } from "#components/ui/tag-input"

interface LinkTagInputProps {
  tags:        string[]
  suggestions: string[]
  onChange:    (tags: string[]) => void
}

export function LinkTagInput({ tags, suggestions, onChange }: LinkTagInputProps) {
  return <TagInput tags={tags} suggestions={suggestions} onChange={onChange} />
}
