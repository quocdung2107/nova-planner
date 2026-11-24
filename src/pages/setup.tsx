// NOVA v1 is local-only: cloud sync (Turso) is intentionally disabled in this
// setup UI. The supporting code remains in #lib/config, #lib/turso and
// #lib/sync so cloud mode can be re-enabled in a future release.
import { useState } from "react"
import { useNavigate } from "react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { DatabaseZap, HardDrive, UserCircle } from "lucide-react"

import { setAppMode } from "#lib/config"
import { saveProfile } from "#lib/profile"
import { Button } from "#components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "#components/ui/form"
import { Input } from "#components/ui/input"
import { cn } from "#lib/utils"

// ── Schemas ───────────────────────────────────────────────────────
const profileSchema = z.object({
  name:  z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
})

type ProfileValues = z.infer<typeof profileSchema>
type Step = "choose" | "profile"

export default function SetupPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>("choose")

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", email: "" },
  })

  function handleLocalOnly() {
    setAppMode("local")
    setStep("profile")
  }

  async function handleProfileSubmit(values: ProfileValues) {
    await saveProfile({ name: values.name, email: values.email })
    navigate("/dashboard", { replace: true })
  }

  const stepTitle: Record<Step, string> = {
    "choose":  "Welcome to NOVA Planner",
    "profile": "Your profile",
  }

  const stepSub: Record<Step, string> = {
    "choose":  "Your planner lives on this device — private by design. No account, no cloud.",
    "profile": "Just your name and email — stored locally, never shared.",
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              {step === "profile" ? <UserCircle className="size-6" /> : <DatabaseZap className="size-6" />}
            </div>
          </div>
          <h1 className="text-2xl font-semibold">{stepTitle[step]}</h1>
          <p className="text-sm text-muted-foreground">{stepSub[step]}</p>
        </div>

        {/* Step 1 — Local only */}
        {step === "choose" && (
          <button
            onClick={handleLocalOnly}
            className={cn(
              "flex w-full flex-col items-center gap-3 rounded-xl border p-8 text-center transition-colors",
              "hover:bg-muted hover:border-foreground/20"
            )}
          >
            <HardDrive className="size-8 text-muted-foreground" />
            <div>
              <p className="font-semibold text-sm">Local only</p>
              <p className="text-xs text-muted-foreground mt-1">
                Your tasks, notes and plans are stored locally in SQLite on this
                device — never sent anywhere. You can back up or restore your
                data at any time, and export / import to move between devices.
              </p>
            </div>
          </button>
        )}

        {/* Step 2 — Profile */}
        {step === "profile" && (
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-4">
              <FormField control={profileForm.control} name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name</FormLabel>
                    <FormControl>
                      <Input placeholder="Alex Johnson" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={profileForm.control} name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="alex@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <p className="text-xs text-muted-foreground">
                Your email is used to load your{" "}
                <a href="https://gravatar.com" target="_blank" rel="noreferrer"
                  className="underline underline-offset-4 hover:text-foreground">
                  Gravatar
                </a>{" "}
                avatar. It is stored only on this device.
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep("choose")}
                >
                  Back
                </Button>
                <Button type="submit" className="flex-1">
                  Get started
                </Button>
              </div>
            </form>
          </Form>
        )}
      </div>
    </div>
  )
}
