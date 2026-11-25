export const BUSINESS_CATEGORIES = [
  "Restaurant",
  "Local brand",
  "Influencer",
  "Marketing agency",
  "Retail",
  "Professional services",
  "Other",
] as const

export const BRAND_TONES = [
  "Professional",
  "Friendly",
  "Funny",
  "Promotional",
  "Educational",
  "Inspirational",
] as const

export const SOCIAL_PLATFORMS = [
  "INSTAGRAM",
  "FACEBOOK",
  "LINKEDIN",
  "X",
  "TIKTOK",
  "YOUTUBE",
] as const

export const PLATFORM_LABELS: Record<(typeof SOCIAL_PLATFORMS)[number], string> = {
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook Pages",
  LINKEDIN: "LinkedIn",
  X: "X",
  TIKTOK: "TikTok",
  YOUTUBE: "YouTube",
}

export const TIMEZONES = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
  "UTC",
] as const

export const APP_NAV = [
  { href: "/dashboard", label: "Overview" },
  { href: "/content-studio", label: "Content Studio" },
  { href: "/calendar", label: "Calendar" },
  { href: "/posts", label: "Posts" },
  { href: "/social-accounts", label: "Social Accounts" },
  { href: "/analytics", label: "Analytics" },
  { href: "/competitors", label: "Competitors" },
  { href: "/recommendations", label: "AI Recommendations" },
  { href: "/team", label: "Team" },
  { href: "/settings", label: "Settings" },
  { href: "/billing", label: "Billing" },
] as const
