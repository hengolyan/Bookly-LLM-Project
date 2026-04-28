---
name: discovery
description: Search and recommend BOOKLY stories, books, authors, posts, and related content using titles, genres, tags, LLM metadata, and user behavior. Use for search requests, recommendation lists, similar content suggestions, and personalized discovery.
---

# Discovery

Use this skill for BOOKLY search and recommendation workflows.

## Workflow

1. Determine whether the request is `search` or `recommendation`.
2. Analyze the query, content metadata, or user activity.
3. Match candidates by:
   - title
   - author
   - genre
   - tags
   - themes
   - LLM summaries/categories
   - saves, likes, reading progress, follows, or ratings
4. Rank results by relevance.
5. Add short explanation text when recommendations are user-visible.
6. Return best matches.

## Rules

- Prioritize relevance.
- Avoid unrelated results.
- Do not invent unavailable books, stories, or authors.
- Use real database records when available.
- Keep recommendation explanations grounded in actual content/user signals.
- Do not expose sensitive user behavior beyond what is appropriate for the user themself.

## Output

Return this shape:

```json
{
  "results": [],
  "type": "search | recommendation"
}
```
