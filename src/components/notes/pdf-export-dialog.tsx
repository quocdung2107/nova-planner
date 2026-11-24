import { useEffect, useState } from "react"

import { Button } from "#components/ui/button"
import { Checkbox } from "#components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#components/ui/dialog"
import { DatePicker } from "#components/ui/date-picker"
import { Label } from "#components/ui/label"
import { Textarea } from "#components/ui/textarea"
import { getPdfFooterTemplate, DEFAULT_PDF_FOOTER_TEMPLATE } from "#lib/export-settings"

interface PdfExportDialogProps {
  open:         boolean
  onOpenChange: (open: boolean) => void
  onConfirm:    (footerTemplate: string, dateOverride: string | undefined) => void
}

export function PdfExportDialog({ open, onOpenChange, onConfirm }: PdfExportDialogProps) {
  const [footerTemplate, setFooterTemplate] = useState(DEFAULT_PDF_FOOTER_TEMPLATE)
  const [useCustomDate,  setUseCustomDate]  = useState(false)
  const [customDate,     setCustomDate]     = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!open) return
    setUseCustomDate(false)
    setCustomDate(undefined)
    getPdfFooterTemplate().then(setFooterTemplate).catch(() => setFooterTemplate(DEFAULT_PDF_FOOTER_TEMPLATE))
  }, [open])

  function handleConfirm() {
    onConfirm(footerTemplate, useCustomDate ? customDate : undefined)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export as PDF</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="pdf-export-custom-date"
                checked={useCustomDate}
                onCheckedChange={checked => setUseCustomDate(checked === true)}
              />
              <Label htmlFor="pdf-export-custom-date" className="font-normal">
                Use a custom date instead of today
              </Label>
            </div>
            {useCustomDate && (
              <DatePicker
                value={customDate}
                onChange={setCustomDate}
                placeholder="Pick a date"
                className="w-full"
              />
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Footer</Label>
              <button
                type="button"
                className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                onClick={() => getPdfFooterTemplate().then(setFooterTemplate)}
              >
                Reset to global setting
              </button>
            </div>
            <Textarea
              rows={2}
              className="resize-none font-mono text-xs"
              placeholder={DEFAULT_PDF_FOOTER_TEMPLATE}
              value={footerTemplate}
              onChange={e => setFooterTemplate(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Only applies to this export. Use <code>{"{date}"}</code> and <code>{"{author}"}</code> as
              placeholders, or clear this field to remove the footer.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm}>Export</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
