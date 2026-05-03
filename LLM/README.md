# BOOKLY

BOOKLY is a production-shaped reading and content discovery platform that combines:

- user-written stories with chapters, drafts, comments, ratings, saves, and reading progress
- a social recommendation feed for reviews, quotes, discussions, and reading updates
- published-book discovery through manually created or externally sourced book records
- author, independent-author, publisher, moderator, admin, and reader-writer account badges
- LLM-backed genre classification, summaries, moderation flags, related-content signals, and visible recommendation explanations

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma ORM
- PostgreSQL
- Cookie-based authentication with hashed passwords and signed JWT sessions
- OpenAI API for structured content analysis

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example` and set:

```bash
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres?schema=public&sslmode=require"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres?schema=public&sslmode=require"
JWT_SECRET="replace-with-a-long-random-secret"
OPENAI_API_KEY="your-openai-key"
OPENAI_MODEL="gpt-4.1-mini"
```

3. Create the Supabase tables:

Open `supabase-schema.sql`, paste it into Supabase SQL Editor, and run it.

4. Prepare Prisma and optional seed data:

```bash
npm run db:generate
npm run db:seed
```

5. Start the app:

```bash
npm run dev
```

Demo login after seeding:

- Email: `maya@bookly.test`
- Password: `bookly-demo-123`

## Main Screens

- `/` - personalized home with current read and recommendations
- `/discover` - search and AI-explained discovery
- `/feed` - social feed for reviews, recommendations, quotes, discussions, and reading updates
- `/write` - story drafting and publishing workspace
- `/library` - saved and currently reading items
- `/profile/maya_pages` - user page with stories and recommendation blog
- `/stories/the-lantern-archive` - reader view
- `/login` and `/register` - real auth entry points

## Production Notes

This implementation is a strong first version for a university project and a realistic base for production. Before public launch, add email verification, password reset, image upload storage, stricter moderation queues, rate limiting, CSRF protection for mutation endpoints, payment/verification workflows for publishers if needed, and background jobs for long-running AI analysis.
