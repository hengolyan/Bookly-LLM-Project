---
name: story-management
description: Manage BOOKLY user stories, chapters, drafts, edits, publishing, ownership checks, and database persistence. Use when creating a story, editing a story, saving a draft, publishing content, or handling story/chapter data.
---

# Story Management

Use this skill for BOOKLY story lifecycle work: create, edit, save draft, publish, and prepare story data for reading pages.

## Workflow

1. Validate required fields:
   - `title`
   - story/chapter content
   - `author_id`
2. Check ownership before editing, deleting, or publishing existing content.
3. Assign timestamps:
   - `created_at` for new records
   - `updated_at` for edits
   - `published_at` when publishing
4. Save as `draft` or `published`.
5. Store story and chapter data in the database.
6. Trigger content processing after publish or major edits when available.

## Rules

- Only the owner can edit or delete a story.
- Do not allow empty title or empty content.
- Do not overwrite existing story/chapter content without confirmation when data loss is possible.
- Preserve drafts unless the user explicitly publishes or deletes them.
- Keep story metadata separate from chapter body content.
- Prefer transactions when saving story and chapter records together.

## Output

Return this shape:

```json
{
  "status": "success | error",
  "story_id": "...",
  "message": "..."
}
```
