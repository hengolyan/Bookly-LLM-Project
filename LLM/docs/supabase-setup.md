# BOOKLY Supabase Setup

BOOKLY uses Supabase PostgreSQL as the real database behind users, stories, chapters, reading progress, saves, posts, comments, likes, recommendations, and LLM metadata.

## 1. Create The Tables

1. Open your Supabase project.
2. Go to **SQL Editor**.
3. Open `supabase-schema.sql` from this project.
4. Paste the full file into Supabase.
5. Click **Run**.

This creates the complete BOOKLY schema.

## 2. Add Environment Variables

In Supabase, go to:

`Project Settings` -> `Database` -> `Connection string`

Use the direct PostgreSQL connection string and place it in `.env`:

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres?schema=public&sslmode=require"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres?schema=public&sslmode=require"
JWT_SECRET="replace-with-a-long-random-secret"
OPENAI_API_KEY=""
OPENAI_MODEL="gpt-4.1-mini"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Use a long random value for `JWT_SECRET`. Do not commit your `.env` file to GitHub.

## 3. Generate Prisma Client

After dependencies are installed:

```bash
npm install
npm run db:generate
```

## 4. Optional Seed Data

To add demo users, a sample story, a book, posts, and reading progress:

```bash
npm run db:seed
```

Demo login after seeding:

- Email: `maya@bookly.test`
- Password: `bookly-demo-123`

## 5. What The Database Supports

- Account registration and login through the `User` table
- User badges such as publisher, verified author, and independent author
- User mood settings through `UserSettings`
- Stories with draft/published status
- Story chapters
- Real published books
- Social recommendation posts
- Likes and comments
- Saved stories, books, and posts through `SavedItem`
- Reading progress for books or stories
- Tags and LLM summaries/classification through `AIContentAnalysis`
- Visible recommendation explanations through `Recommendation.reason`
