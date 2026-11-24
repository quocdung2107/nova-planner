import { TagInput } from "#components/ui/tag-input"

interface WorkLogTagInputProps {
  tags:        string[]
  suggestions: string[]
  onChange:    (tags: string[]) => void
}

export function WorkLogTagInput({ tags, suggestions, onChange }: WorkLogTagInputProps) {
  return <TagInput tags={tags} suggestions={suggestions} onChange={onChange} />
}
