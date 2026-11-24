export type StrategyInput = {
  businessName: string
  category: string
  description: string
  targetAudience: string
  brandTone: string
  platforms: string[]
}

export function buildStarterStrategy(input: StrategyInput) {
  const platforms = input.platforms.length > 0 ? input.platforms.join(", ") : "no platforms selected yet"
  const outline = [
    `Starter outline for ${input.businessName}`,
    "This outline is assembled from the business profile. It is not an AI generation.",
    "",
    `Audience: ${input.targetAudience}`,
    `Tone: ${input.brandTone}`,
    `Category: ${input.category}`,
    `Platforms: ${platforms}`,
    "",
    "Weekly rhythm",
    `- Three posts that teach something specific about ${input.category.toLowerCase()}.`,
    `- One post that shows the work behind ${input.businessName}.`,
    `- One offer or visit prompt, written in a ${input.brandTone.toLowerCase()} voice.`,
    "",
    "What the business actually does",
    input.description.trim(),
    "",
    "Guardrails",
    "- Do not promise results the business cannot deliver.",
    "- Keep captions specific to the audience instead of generic motivation.",
    "- Match the brand tone on every network instead of rewriting the personality per platform.",
  ].join("\n")

  return { outline, source: "STARTER" as const }
}
