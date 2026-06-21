# BrandBridge AI

AI-powered platform that connects brands with influencers, student ambassadors, college events, and local businesses. Brands run campaigns, discover creators, sign digital contracts, generate affiliate referral codes, and track partnership performance — all in one product.

## Stack

- **TanStack Start** (React 19, Vite 7) — file-based routing + server functions
- **Lovable Cloud / Supabase** — Postgres + Auth (email + Google OAuth) + Storage + Realtime
- **Tailwind CSS v4** + **shadcn/ui** + **Recharts**
- **Lovable AI Gateway** (Gemini) for matchmaking, trust scoring, and content generation

## Features

- 5 user roles: brand, influencer, student, organizer, business
- Campaign CRUD with applications and status workflow (`draft → open → in_progress → completed / cancelled`)
- Creator discovery with name / niche / location / followers / engagement filters (brand & business only)
- Public creator portfolio pages at `/p/$id`
- Campus sponsorship hub: events with funding goals + tiered sponsorships
- E-contracts with double-signature workflow and printable PDF view
- Affiliate codes with `/r/$code` public redirect + click tracking
- Real-time in-app messaging
- Analytics dashboard (reach, engagement, conversions, CPE, revenue per code)
- AI Content Studio (captions, briefs, proposals, emails, LinkedIn posts)

## Getting started

```bash
bun install
bun run dev
```

Open <http://localhost:5173>.

## Environment

Public, committed to `.env`:

| Variable | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | Backend URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Browser-safe anon key |
| `VITE_SUPABASE_PROJECT_ID` | Project ref |

Server-only (managed by Lovable Cloud, never exposed to the browser):

- `SUPABASE_SERVICE_ROLE_KEY`
- `LOVABLE_API_KEY` — AI Gateway credential used by the `ai-engine` edge function

## Scripts

```bash
bun run dev      # vite dev server
bun run build    # production build
bun run lint     # eslint
bun run format   # prettier
```

## Database

Schema lives in `supabase/migrations/`. Key tables:

- `profiles`, `user_roles`
- `campaigns`, `applications`
- `events`, `sponsorships`
- `contracts` (double-sign workflow)
- `affiliate_codes` (click + conversion + revenue tracking)
- `campaign_analytics`
- `messages` (realtime)
- `notifications`

Row Level Security is enabled on every table.

## License

Proprietary — © BrandBridge AI.
