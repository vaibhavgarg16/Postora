import { z } from "zod"
import { BRAND_TONES, BUSINESS_CATEGORIES, SOCIAL_PLATFORMS, TIMEZONES } from "@/lib/constants"

export const onboardingSchema = z.object({
  businessName: z.string().trim().min(2, { error: "Enter the business name." }).max(80),
  category: z.enum(BUSINESS_CATEGORIES, { error: "Choose a category." }),
  website: z.string().trim().max(200).optional().or(z.literal("")),
  description: z.string().trim().min(20, { error: "Describe the business in at least 20 characters." }).max(1000),
  targetAudience: z.string().trim().min(10, { error: "Describe who you want to reach." }).max(400),
  brandTone: z.enum(BRAND_TONES, { error: "Choose a tone." }),
  platforms: z.array(z.enum(SOCIAL_PLATFORMS)).min(1, { error: "Select at least one platform." }),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, { error: "Use a hex color." }),
  secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, { error: "Use a hex color." }),
  timezone: z.enum(TIMEZONES, { error: "Choose a timezone." }),
})

export const profileSchema = onboardingSchema.omit({ timezone: true })

export type OnboardingValues = z.infer<typeof onboardingSchema>
