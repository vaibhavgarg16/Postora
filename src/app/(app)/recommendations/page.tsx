import { UnavailableModule } from "@/components/modules/unavailable"

export const metadata = { title: "AI recommendations" }

export default function RecommendationsPage() {
  return (
    <UnavailableModule
      title="AI recommendations"
      body="Daily ideas, trending topics, and weekly plans are not generated here yet. The onboarding outline on Overview is the only strategy text saved for this workspace."
    />
  )
}
