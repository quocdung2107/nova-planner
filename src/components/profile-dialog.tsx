import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { Button } from "#components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "#components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "#components/ui/form"
import { Input } from "#components/ui/input"
import { Textarea } from "#components/ui/textarea"
import { Separator } from "#components/ui/separator"
import { getProfile, saveProfile, type UserProfile } from "#lib/profile"
import { getPdfFooterTemplate, setPdfFooterTemplate, DEFAULT_PDF_FOOTER_TEMPLATE } from "#lib/export-settings"

const schema = z.object({
  name:  z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
  pdfFooter: z.string(),
})

type Values = z.infer<typeof schema>

interface ProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: (profile: UserProfile) => void
}

export function ProfileDialog({ open, onOpenChange, onSaved }: ProfileDialogProps) {
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", pdfFooter: DEFAULT_PDF_FOOTER_TEMPLATE },
  })

  useEffect(() => {
    if (open) {
      Promise.all([getProfile(), getPdfFooterTemplate()]).then(([p, pdfFooter]) => {
        form.reset({ name: p?.name ?? "", email: p?.email ?? "", pdfFooter })
      })
    }
  }, [open, form])

  async function handleSubmit(values: Values) {
    const profile: UserProfile = { name: values.name, email: values.email }
    await Promise.all([
      saveProfile(profile),
      setPdfFooterTemplate(values.pdfFooter),
    ])
    onSaved(profile)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField control={form.control} name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full name</FormLabel>
                  <FormControl><Input placeholder="Alex Johnson" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField control={form.control} name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input type="email" placeholder="alex@example.com" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            <FormField control={form.control} name="pdfFooter"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>PDF export footer</FormLabel>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                      onClick={() => form.setValue("pdfFooter", DEFAULT_PDF_FOOTER_TEMPLATE, { shouldDirty: true })}
                    >
                      Reset to default
                    </button>
                  </div>
                  <FormControl>
                    <Textarea
                      rows={2}
                      className="resize-none font-mono text-xs"
                      placeholder={DEFAULT_PDF_FOOTER_TEMPLATE}
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Shown at the bottom of every exported note PDF. Use <code>{"{date}"}</code> and{" "}
                    <code>{"{author}"}</code> as placeholders, or clear this field to remove the footer. The date
                    can be overridden per export.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
