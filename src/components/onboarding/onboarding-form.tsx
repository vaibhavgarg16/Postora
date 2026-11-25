"use client"

import { startTransition, useActionState, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { BRAND_TONES, BUSINESS_CATEGORIES, PLATFORM_LABELS, SOCIAL_PLATFORMS, TIMEZONES } from "@/lib/constants"
import { onboardingSchema, type OnboardingValues } from "@/lib/forms"
import { completeOnboardingAction, type ActionState } from "@/server/actions/workspace"
import { ActionNote } from "@/components/action-note"
import { buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "cn"

const initial: ActionState = {}

export function OnboardingForm() {
  const [step, setStep] = useState(0)
  const [logo, setLogo] = useState<File | null>(null)
  const [state, action, pending] = useActionState(completeOnboardingAction, initial)
  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      businessName: "",
      category: "Local brand",
      website: "",
      description: "",
      targetAudience: "",
      brandTone: "Friendly",
      platforms: ["INSTAGRAM"],
      primaryColor: "#4338ca",
      secondaryColor: "#111827",
      timezone: "Asia/Kolkata",
    },
  })

  const values = step === 2 ? form.getValues() : null

  function next() {
    const fields: Array<keyof OnboardingValues> =
      step === 0
        ? ["businessName", "category", "website", "description"]
        : ["targetAudience", "brandTone", "platforms", "primaryColor", "secondaryColor", "timezone"]
    void form.trigger(fields).then((valid) => {
      if (valid) setStep((current) => current + 1)
    })
  }

  function createWorkspace() {
    void form.handleSubmit((data) => {
      const payload = new FormData()
      payload.set("businessName", data.businessName)
      payload.set("category", data.category)
      payload.set("website", data.website ?? "")
      payload.set("description", data.description)
      payload.set("targetAudience", data.targetAudience)
      payload.set("brandTone", data.brandTone)
      payload.set("primaryColor", data.primaryColor)
      payload.set("secondaryColor", data.secondaryColor)
      payload.set("timezone", data.timezone)
      data.platforms.forEach((platform) => payload.append("platforms", platform))
      if (logo) payload.set("logo", logo)
      startTransition(() => {
        action(payload)
      })
    })()
  }

  return (
    <div className="grid gap-6">
      <ol className="flex gap-2 text-xs text-muted-foreground">
        {["Business", "Voice", "Review"].map((label, index) => (
          <li key={label} className={index === step ? "font-semibold text-foreground" : undefined}>
            {index + 1}. {label}
          </li>
        ))}
      </ol>

      {step === 0 ? (
        <div className="grid gap-4">
          <TextField label="Business name" error={form.formState.errors.businessName?.message} {...form.register("businessName")} />
          <div className="grid gap-1.5">
            <Label htmlFor="category">Category</Label>
            <select id="category" className="h-10 rounded-lg border bg-background px-3" {...form.register("category")}>
              {BUSINESS_CATEGORIES.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </div>
          <TextField label="Website" error={form.formState.errors.website?.message} {...form.register("website")} />
          <div className="grid gap-1.5">
            <Label htmlFor="description">What does the business do?</Label>
            <Textarea id="description" rows={4} {...form.register("description")} />
            {form.formState.errors.description ? <p className="text-sm text-destructive">{form.formState.errors.description.message}</p> : null}
          </div>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="targetAudience">Who are you talking to?</Label>
            <Textarea id="targetAudience" rows={3} {...form.register("targetAudience")} />
            {form.formState.errors.targetAudience ? (
              <p className="text-sm text-destructive">{form.formState.errors.targetAudience.message}</p>
            ) : null}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="brandTone">Brand tone</Label>
            <select id="brandTone" className="h-10 rounded-lg border bg-background px-3" {...form.register("brandTone")}>
              {BRAND_TONES.map((tone) => (
                <option key={tone}>{tone}</option>
              ))}
            </select>
          </div>
          <fieldset className="grid gap-2">
            <legend className="text-sm font-medium">Preferred platforms</legend>
            {SOCIAL_PLATFORMS.map((platform) => (
              <label key={platform} className="flex items-center gap-2 text-sm">
                <input type="checkbox" value={platform} {...form.register("platforms")} />
                {PLATFORM_LABELS[platform]}
              </label>
            ))}
            {form.formState.errors.platforms ? <p className="text-sm text-destructive">{form.formState.errors.platforms.message}</p> : null}
          </fieldset>
          <div className="grid grid-cols-2 gap-3">
            <ColorField label="Primary color" {...form.register("primaryColor")} />
            <ColorField label="Secondary color" {...form.register("secondaryColor")} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="timezone">Timezone</Label>
            <select id="timezone" className="h-10 rounded-lg border bg-background px-3" {...form.register("timezone")}>
              {TIMEZONES.map((zone) => (
                <option key={zone}>{zone}</option>
              ))}
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="logo">Logo</Label>
            <Input
              id="logo"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="h-10"
              onChange={(event) => setLogo(event.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-muted-foreground">PNG, JPG, or WebP. 2 MB maximum.</p>
          </div>
        </div>
      ) : null}

      {step === 2 && values ? (
        <form
          className="grid gap-6"
          onSubmit={(event) => {
            event.preventDefault()
            createWorkspace()
          }}
        >
          <div className="grid gap-2 text-sm">
            <p>
              <span className="text-muted-foreground">Business. </span>
              {values.businessName} · {values.category}
            </p>
            <p>
              <span className="text-muted-foreground">Tone. </span>
              {values.brandTone} for {values.targetAudience}
            </p>
            <p>
              <span className="text-muted-foreground">Platforms. </span>
              {values.platforms.map((platform) => PLATFORM_LABELS[platform]).join(", ")}
            </p>
            <p className="text-muted-foreground">
              Creating the workspace saves a starter outline from this profile. It is labeled as a starter outline
              unless the server can reach OpenAI.
            </p>
          </div>
          <ActionNote error={state.error} />
          <div className="flex justify-between">
            <button
              type="button"
              className={cn(buttonVariants({ variant: "outline" }), "h-10 px-4")}
              disabled={pending}
              onClick={() => setStep(1)}
            >
              Back
            </button>
            <button type="submit" className={cn(buttonVariants(), "h-10 px-4")} disabled={pending}>
              {pending ? "Creating workspace…" : "Create workspace"}
            </button>
          </div>
        </form>
      ) : (
        <>
          <ActionNote error={state.error} />
          <div className="flex justify-between">
            <button
              type="button"
              className={cn(buttonVariants({ variant: "outline" }), "h-10 px-4")}
              disabled={step === 0}
              onClick={() => setStep((current) => current - 1)}
            >
              Back
            </button>
            <button type="button" className={cn(buttonVariants(), "h-10 px-4")} onClick={next}>
              Continue
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function TextField({ label, error, ...props }: React.ComponentProps<"input"> & { label: string; error?: string }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={props.name}>{label}</Label>
      <Input id={props.name} className="h-10" {...props} />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  )
}

function ColorField({ label, ...props }: React.ComponentProps<"input"> & { label: string }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={props.name}>{label}</Label>
      <Input id={props.name} type="color" className="h-10" {...props} />
    </div>
  )
}
