# BOOKLY LLM System

BOOKLY uses LLMs as structured infrastructure, not as a chatbot.

## When AI Runs

AI analysis runs automatically when users publish or create major content:

- stories
- book records
- recommendation posts
- reviews
- discussion posts

The current implementation exposes this behavior through `src/lib/ai.ts` and the `/api/ai/analyze`, `/api/stories`, and `/api/posts` routes.

## What AI Produces

The app asks the model for structured JSON-like output:

- short summary
- genres
- themes
- target audience
- mood
- moderation flags
- recommendation explanation

This data is stored in `AIContentAnalysis`.

## How Recommendations Work

Recommendations should combine:

- explicit signals: saves, likes, follows, ratings, selected genres
- implicit signals: reading progress, abandoned stories, completed books
- content signals: AI genres, themes, mood, audience, and summaries

The user-facing explanation should be short and grounded, for example:

`AI match: you recently saved cozy fantasy stories with found-family themes and magical-library settings.`

## Safety And Accuracy

The AI instructions require the model to ground analysis in the supplied text. It should not invent book facts, author facts, ratings, or publication information.

For moderation, the AI can flag content for review, but human moderators should make final enforcement decisions.

## OpenAI Configuration

Set these environment variables:

```bash
OPENAI_API_KEY="your-openai-key"
OPENAI_MODEL="gpt-4.1-mini"
```

If `OPENAI_API_KEY` is missing, the development build returns a small heuristic fallback so the UI and API flow can still be demonstrated.
