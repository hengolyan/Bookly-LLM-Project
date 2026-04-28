---
name: social-feed
description: Handle BOOKLY social feed posts, book recommendations, reviews, quotes, reading updates, likes, comments, save counts, and feed generation. Use when creating posts, loading the feed, sorting feed items, or interacting with posts.
---

# Social Feed

Use this skill for BOOKLY timeline behavior: recommendation posts, reviews, quotes, discussion prompts, reading updates, likes, comments, and feed results.

## Workflow

1. Validate post or interaction input.
2. Fetch posts from the database.
3. Exclude deleted or hidden content.
4. Sort by recent, popularity, following, genre, or personalized ranking depending on the request.
5. Attach counts:
   - likes
   - comments
   - saves
   - reposts/shares when implemented
6. Return a structured feed result.
7. Trigger content processing for new or edited post text when available.

## Rules

- Do not return deleted content.
- Validate user input before writing.
- Prevent empty posts.
- Reject obvious spam patterns when possible.
- Do not expose private user data in feed responses.
- Keep post content, interaction records, and derived counts separate.

## Output

Return this shape:

```json
{
  "posts": [],
  "count": 0
}
```
