---
name: content-processing
description: Analyze BOOKLY story, chapter, book, review, or social post text to generate grounded summaries, genres, tags, themes, confidence levels, and LLM metadata. Use when content is created or edited, when summarization is needed, or when assigning genres/tags for discovery.
---

# Content Processing

Use this skill to classify and summarize text content for BOOKLY. The LLM must support organization and discovery only; do not turn this into a chatbot workflow.

## Workflow

1. Read the full supplied text.
2. Identify the main topic, premise, genre signals, mood, and themes.
3. Generate a short summary in 2-3 sentences.
4. Assign one primary genre.
5. Extract 3-6 relevant tags.
6. Set confidence to `high`, `medium`, or `low`.

## Rules

- Use only the provided text.
- Do not invent plot points, book facts, author facts, ratings, or publication information.
- Keep summaries short and accurate.
- Prefer user-visible tags that improve discovery.
- If the content is too short, vague, or contradictory, set confidence to `low`.
- If moderation concerns appear, mention them separately from genre/tag output when the implementation supports moderation metadata.

## Output

Return this shape:

```json
{
  "summary": "...",
  "genre": "...",
  "tags": ["...", "..."],
  "confidence": "high | medium | low"
}
```
