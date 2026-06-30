<div align="center">
  <img src="/public/logo/nextvoters.png" alt="Next Voters logo" />
</div>

---

[![Live Demo](https://img.shields.io/badge/Live%20Demo-nextvoters.com-2F80ED)](https://nextvoters.com)
[![License](https://img.shields.io/badge/License-MIT-00BFFF)](LICENSE-CODE)

**Non-partisan, AI-powered civic education for the next generation of voters.**

Next Voters helps young citizens cut through political misinformation by delivering fact-based, citation-backed policy analysis across multiple political perspectives.

---

## Features

- **AI Policy Chat** — Ask any civic question and get streaming, multi-perspective answers grounded in official party platforms via RAG
- **Multi-Region Support** — Coverage for Canadian (Liberal/Conservative) and U.S. (Democrat/Republican) politics
- **Topic-Based Learning** — Immigration, Civil Rights, and Economy tracks with curated document embeddings
- **Subscription Tiers** — Free Basic plan (1 topic) and Pro plan ($2/mo) for full access
- **Civic Email Alerts** — Automated weekly updates on legislation and policy via [civic-line-cli](https://pypi.org/project/civic-line-cli/)
- **Admin Tools** — PDF document embedding and region management for content administrators

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + Shadcn/ui |
| AI/LLM | OpenAI (gpt-4o-mini) via Vercel AI SDK |
| Vector Search | Qdrant (text-embedding-3-small) |
| Database | Neon PostgreSQL + Kysely |
| Auth | Supabase |
| Payments | Stripe |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Setup

```bash
pnpm install
cp .env.example .env  # configure environment variables
pnpm dev
```

### Environment Variables

Configure the following in `.env`:

- `OPENAI_API_BASE_URL` / `OPENAI_API_KEY` — LLM access via GitHub Models
- `QDRANT_URL` / `QDRANT_API_KEY` — Vector database
- `DATABASE_URL` — Neon PostgreSQL
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Authentication
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` — Payments

---

## License

[MIT](LICENSE-CODE)
