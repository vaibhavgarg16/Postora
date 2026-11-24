import { z } from "zod"

export const passwordSchema = z
  .string()
  .min(8, { error: "Use at least 8 characters." })
  .regex(/[A-Za-z]/, { error: "Include at least one letter." })
  .regex(/[0-9]/, { error: "Include at least one number." })

export const emailSchema = z.email({ error: "Enter a valid email address." })
