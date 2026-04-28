# AGENT.md

## 1. Project Context

BOOKLY is an enhanced reading and content discovery platform that combines user-generated fictional stories with a social feed for real book recommendations.

The main goal is to help users discover, read, publish, recommend, and discuss stories and books in one shared environment.

The app should feel like a combination of:

- Wattpad for user-generated stories
- Goodreads for book recommendations and reviews
- a social media feed for community interaction

The system includes LLM-based features, but the LLM should support content organization and discovery only. It should not function as a general chatbot.

Main app areas:

- user authentication
- story publishing
- story reading
- book recommendation feed
- likes, comments, and saved items
- search and discovery
- user profiles and mood/theme settings
- LLM summaries, genre classification, tags, and related content

## 2. Tech Stack

Use a simple modern web stack.

Recommended stack:

- Frontend: React / Next.js
- Styling: Tailwind CSS
- Database: Supabase PostgreSQL
- Authentication: Supabase Auth
- Storage: Supabase Storage if images/files are needed
- AI/LLM: OpenAI API or another LLM provider
- Deployment: Vercel or Netlify

Database should store:

- users
- stories
- chapters
- posts
- books
- comments
- likes
- saved items
- genres
- tags
- LLM summaries
- LLM categories
- related content connections
- user mood/theme preference

Suggested tables:

- `users`
- `stories`
- `story_chapters`
- `posts`
- `books`
- `comments`
- `likes`
- `saved_items`
- `genres`
- `tags`
- `story_tags`
- `post_tags`
- `recommendations`
- `llm_metadata`
- `user_settings`

## 3. Product Rules

The home page should stay focused. It should show:

- the current book/story the user is reading
- personalized recommendations based on taste

Other major areas should be separate pages or routes:

- library
- writing/story studio
- reader/book detail page
- social recommendation feed
- user profile
- settings
- login/register

Users should be able to choose the visual mood of the app from settings. Current planned moods:

- Night Enchantment: dark navy, gold magic, mysterious reading rituals
- Celestial Garden: soft florals, warm parchment, dreamy fairy-tale light

## 4. LLM Rules

LLM features should be structured and grounded in content.

Use LLMs for:

- summaries
- genre classification
- theme extraction
- tag suggestions
- content moderation flags
- related story/book recommendations
- short recommendation explanations

Do not use the LLM as:

- a general chatbot
- an ungrounded writing authority
- a source of invented book facts
- a replacement for human moderation decisions

LLM output should be stored in structured database fields when possible.

## 5. Workflow Rules

Work in small, safe steps.

Before making changes:

- understand the current codebase structure
- check existing files before creating new ones
- reuse existing components when possible
- do not rewrite the entire project unless necessary

When coding:

- keep changes focused and organized
- create reusable components
- use clear file names
- keep UI, logic, and database code separated
- add comments only when they help explain complex logic
- do not leave unused code
- do not create duplicated components
- do not hardcode fake data if database data exists

After making changes:

- check for errors
- make sure the app still runs when tooling is available
- update documentation if needed
- keep the design consistent across pages

Priority order:

1. Basic layout and navigation
2. Authentication
3. Database connection
4. Story creation and reading
5. Book recommendation feed
6. Likes, comments, and saved items
7. Search and discovery
8. LLM summaries and categorization
9. Related content recommendations
10. Responsive design and polish

## 6. Coding Conventions

Use clean, readable code.

Rules:

- use meaningful variable and function names
- use consistent naming
- use PascalCase for React components
- use camelCase for variables and functions
- keep components small and focused
- avoid very large files
- separate reusable UI components into a `components` folder
- separate database/API logic into a `services` or `lib` folder
- avoid repeating code
- avoid unnecessary complexity
- prefer simple solutions

Suggested folder structure:

```txt
/src
  /components
  /app
  /lib
  /services
  /styles
  /types
  /utils
```

## 7. Design Direction

BOOKLY should feel magical, readable, and cozy.

Design principles:

- keep the interface useful first
- use strong visual mood without hiding content
- keep text readable on mobile
- avoid cluttering the home page
- make navigation clear
- keep profile/settings easy to find
- use icons for navigation where possible
- keep mood/theme styles consistent across pages

The current visual direction includes:

- dark enchanted navy and gold
- soft celestial garden parchment and floral tones
- bookish typography
- simple line icons
- rounded panels with subtle borders
- visible AI recommendation explanations

## 8. GitHub And Deployment Notes

The project is stored in the GitHub repository:

```txt
hengolyan/LLM-Tasks
```

The BOOKLY app should live under:

```txt
LLM/
```

When updating GitHub:

- only replace or edit files inside `LLM/` unless explicitly asked
- do not delete unrelated repository root files
- keep commits focused and descriptive
- verify pushed files when possible
