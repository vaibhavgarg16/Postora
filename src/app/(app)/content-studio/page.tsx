import { UnavailableModule } from "@/components/modules/unavailable"

export const metadata = { title: "Content Studio" }

export default function ContentStudioPage() {
  return (
    <UnavailableModule
      title="Content Studio"
      body="Caption, hashtag, post, and image generation are not built in this phase. Brand tone is already saved on the workspace and will be available to the studio when generation is connected."
    />
  )
}
