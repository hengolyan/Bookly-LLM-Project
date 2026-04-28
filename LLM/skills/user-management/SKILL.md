---
name: user-management
description: Handle BOOKLY authentication, registration, login, profiles, account badges, saved content, follows, user settings, and mood/theme preferences. Use when registering or logging in users, fetching/updating profiles, saving content, or changing user settings.
---

# User Management

Use this skill for BOOKLY user identity, profile, and settings workflows.

## Workflow

1. Validate input.
2. Authenticate the user when the action requires identity.
3. Fetch or update user data.
4. Apply authorization checks for private profile/settings changes.
5. Save profile, saved items, follows, or mood/theme settings.
6. Return a safe response.

## Rules

- Never expose passwords, password hashes, tokens, API keys, session cookies, or sensitive account data.
- Ensure secure authentication.
- Only let users update their own private settings.
- Keep public profile data separate from private account data.
- Validate mood/theme values before saving.
- Use account badges consistently:
  - reader-writer
  - verified author
  - publisher
  - independent author
  - moderator
  - admin

## Output

Return this shape:

```json
{
  "status": "success | error",
  "user_id": "...",
  "message": "..."
}
```
