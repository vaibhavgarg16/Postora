import { UnavailableModule } from "@/components/modules/unavailable"

export const metadata = { title: "Competitors" }

export default function CompetitorsPage() {
  return (
    <UnavailableModule
      title="Competitors"
      body="Public competitor profiles are not fetched in this phase. Reeno does not scrape restricted data, and it does not show estimated engagement."
    />
  )
}
