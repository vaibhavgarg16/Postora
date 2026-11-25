import { canManageWorkspace } from "@/lib/access"
import { Live } from "@/components/live"
import {
  AccountNameForm,
  BrandVoiceForm,
  BusinessProfileForm,
  WorkspaceSettingsForm,
} from "@/components/settings/settings-forms"
import { requireWorkspace } from "@/server/session"

export const metadata = { title: "Settings" }

export default function SettingsPage() {
  return (
    <Live>
      <SettingsContent />
    </Live>
  )
}

async function SettingsContent() {
  const context = await requireWorkspace()
  const profile = context.workspace.profile
  const manager = canManageWorkspace(context.role)
  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
      <section className="rounded-2xl border bg-card p-5">
        <h2 className="font-semibold">Account</h2>
        <p className="mt-1 text-sm text-muted-foreground">{context.user.email}</p>
        <div className="mt-4">
          <AccountNameForm name={context.user.name ?? ""} />
        </div>
      </section>
      {manager && profile ? (
        <>
          <section className="rounded-2xl border bg-card p-5">
            <h2 className="font-semibold">Workspace</h2>
            <div className="mt-4">
              <WorkspaceSettingsForm name={context.workspace.name} timezone={context.workspace.timezone} />
            </div>
          </section>
          <section className="rounded-2xl border bg-card p-5">
            <h2 className="font-semibold">Business profile</h2>
            {profile.logoPath ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src="/api/brand-logo" alt="" className="mt-4 size-16 rounded-xl object-cover" />
            ) : null}
            <div className="mt-4">
              <BusinessProfileForm
                profile={{
                  businessName: profile.businessName,
                  category: profile.category,
                  website: profile.website ?? "",
                  description: profile.description,
                  targetAudience: profile.targetAudience,
                  brandTone: profile.brandTone,
                  platforms: profile.platforms,
                  primaryColor: profile.brandColors[0] ?? "#4338ca",
                  secondaryColor: profile.brandColors[1] ?? "#111827",
                }}
              />
            </div>
          </section>
          <section className="rounded-2xl border bg-card p-5">
            <h2 className="font-semibold">Brand voice</h2>
            <div className="mt-4">
              <BrandVoiceForm
                instructions={context.workspace.brandVoice?.customInstructions ?? ""}
                enabled={Boolean(context.limits?.brandVoice)}
              />
            </div>
          </section>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">You can view this workspace. Editing is limited to owners and admins.</p>
      )}
    </div>
  )
}
