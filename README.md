# Reeno AI

Reeno AI is a social media workspace for small businesses. This repository currently implements **Phase 1**: the application shell, authentication, workspace onboarding, plan limits, and Razorpay subscription checkout.

Later modules (content generation, official social publishing, analytics ingestion, competitor monitoring, and approval workflows) are visible in the navigation. They do not call external APIs, and they do not invent captions, metrics, or published posts.

## Stack

- Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui
- Auth.js for email/password and optional Google sign-in
- PostgreSQL and Prisma
- Razorpay for Indian monthly and yearly subscriptions
- Vitest for plan, billing, and token-encryption rules

Redis and BullMQ belong to the publishing design and are not required to run Phase 1.

## Setup

1. Create a PostgreSQL database.
2. Copy `.env.example` to `.env` and set `DATABASE_URL`, `AUTH_SECRET`, and `TOKEN_ENCRYPTION_KEY`.
3. Install and prepare the database:

```bash
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

Open the app on one host and stay there. `localhost` and `127.0.0.1` do not share the session cookie. Leave `AUTH_URL` unset unless it is the exact public origin.

Create `AUTH_SECRET` with `openssl rand -base64 32`. `TOKEN_ENCRYPTION_KEY` must be 32 bytes encoded as base64 (`openssl rand -base64 32`).

## What works

- Sign up, email verification, sign in, forgot password, and reset password.
- Google sign-in when `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` are set.
- Without `RESEND_API_KEY`, development shows the verification or reset link on the page. Production refuses to complete signup until email can be sent.
- Onboarding creates a workspace, owner membership, business profile, brand voice, and the Free subscription.
- A strategy outline is saved from the profile and labeled as a starter outline. If `OPENAI_API_KEY` is set and the request succeeds, the saved outline is marked as OpenAI output.
- Dashboard counts come from the database. A separate sample chart is labeled demo data and is not stored.
- Team invites respect the plan seat limit. The Free plan includes one member, so an invite is rejected on the server.
- Billing lists plans from the database. Upgrade opens Razorpay only when the keys are set, and the plan changes only after the payment signature checks out.
- `/admin` is limited to users with the `PLATFORM_ADMIN` role or an email in `PLATFORM_ADMIN_EMAILS`. Plan prices and limits can be edited there. Revenue is calculated from active paid subscriptions only.

## What is not connected

Instagram, Facebook, LinkedIn, X, TikTok, and YouTube OAuth and publishing are not implemented. Engagement charts are not shown because no platform has returned metrics. A post is never described as published until a future publisher records a platform post id.

## Tests

```bash
npm test
```
