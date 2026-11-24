"use client"

import { useActionState } from "react"
import { BRAND_TONES, BUSINESS_CATEGORIES, PLATFORM_LABELS, SOCIAL_PLATFORMS, TIMEZONES } from "@/lib/constants"
import {
  updateAccountNameAction,
  updateBrandVoiceAction,
  updateBusinessProfileAction,
  updateWorkspaceSettingsAction,
  type ActionState,
} from "@/server/actions/workspace"
import { ActionNote } from "@/components/action-note"
import { SubmitButton } from "@/components/submit-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const initial: ActionState = {}

export function AccountNameForm({ name }: { name: string }) {
  const [state, action] = useActionState(updateAccountNameAction, initial)
  return (
    <form action={action} className="grid gap-3">
      <Label htmlFor="account-name">Your name</Label>
      <Input id="account-name" name="name" defaultValue={name} className="h-10" />
      <ActionNote error={state.error} message={state.message} />
      <SubmitButton>Save name</SubmitButton>
    </form>
  )
}

export function WorkspaceSettingsForm({ name, timezone }: { name: string; timezone: string }) {
  const [state, action] = useActionState(updateWorkspaceSettingsAction, initial)
  return (
    <form action={action} className="grid gap-3">
      <Label htmlFor="workspace-name">Workspace name</Label>
      <Input id="workspace-name" name="name" defaultValue={name} className="h-10" />
      <Label htmlFor="workspace-timezone">Timezone</Label>
      <select id="workspace-timezone" name="timezone" defaultValue={timezone} className="h-10 rounded-lg border bg-background px-3">
        {TIMEZONES.map((zone) => (
          <option key={zone}>{zone}</option>
        ))}
      </select>
      <ActionNote error={state.error} message={state.message} />
      <SubmitButton>Save workspace</SubmitButton>
    </form>
  )
}

export function BusinessProfileForm({
  profile,
}: {
  profile: {
    businessName: string
    category: string
    website: string
    description: string
    targetAudience: string
    brandTone: string
    platforms: string[]
    primaryColor: string
    secondaryColor: string
  }
}) {
  const [state, action] = useActionState(updateBusinessProfileAction, initial)
  return (
    <form action={action} className="grid gap-3">
      <Label htmlFor="businessName">Business name</Label>
      <Input id="businessName" name="businessName" defaultValue={profile.businessName} className="h-10" />
      <Label htmlFor="category">Category</Label>
      <select id="category" name="category" defaultValue={profile.category} className="h-10 rounded-lg border bg-background px-3">
        {BUSINESS_CATEGORIES.map((category) => (
          <option key={category}>{category}</option>
        ))}
      </select>
      <Label htmlFor="website">Website</Label>
      <Input id="website" name="website" defaultValue={profile.website} className="h-10" />
      <Label htmlFor="description">Description</Label>
      <Textarea id="description" name="description" defaultValue={profile.description} rows={4} />
      <Label htmlFor="targetAudience">Target audience</Label>
      <Textarea id="targetAudience" name="targetAudience" defaultValue={profile.targetAudience} rows={3} />
      <Label htmlFor="brandTone">Brand tone</Label>
      <select id="brandTone" name="brandTone" defaultValue={profile.brandTone} className="h-10 rounded-lg border bg-background px-3">
        {BRAND_TONES.map((tone) => (
          <option key={tone}>{tone}</option>
        ))}
      </select>
      <fieldset className="grid gap-2">
        <legend className="text-sm font-medium">Platforms</legend>
        {SOCIAL_PLATFORMS.map((platform) => (
          <label key={platform} className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="platforms" value={platform} defaultChecked={profile.platforms.includes(platform)} />
            {PLATFORM_LABELS[platform]}
          </label>
        ))}
      </fieldset>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="primaryColor">Primary</Label>
          <Input id="primaryColor" name="primaryColor" type="color" defaultValue={profile.primaryColor} className="h-10" />
        </div>
        <div>
          <Label htmlFor="secondaryColor">Secondary</Label>
          <Input id="secondaryColor" name="secondaryColor" type="color" defaultValue={profile.secondaryColor} className="h-10" />
        </div>
      </div>
      <Label htmlFor="logo">Replace logo</Label>
      <Input id="logo" name="logo" type="file" accept="image/png,image/jpeg,image/webp" className="h-10" />
      <ActionNote error={state.error} message={state.message} />
      <SubmitButton>Save profile</SubmitButton>
    </form>
  )
}

export function BrandVoiceForm({ instructions, enabled }: { instructions: string; enabled: boolean }) {
  const [state, action] = useActionState(updateBrandVoiceAction, initial)
  if (!enabled) {
    return (
      <p className="text-sm text-muted-foreground">
        Custom brand instructions are stored only on Growth and Agency. The tone collected during onboarding is already
        saved for every plan.
      </p>
    )
  }
  return (
    <form action={action} className="grid gap-3">
      <Label htmlFor="customInstructions">Custom instructions</Label>
      <Textarea id="customInstructions" name="customInstructions" defaultValue={instructions} rows={4} />
      <ActionNote error={state.error} message={state.message} />
      <SubmitButton>Save instructions</SubmitButton>
    </form>
  )
}
