# BOOKLY Database Schema

The database is modeled around four main areas: identity, reading/writing content, social interaction, and AI-powered discovery.

## Identity

`User` stores login credentials, profile information, and the account badge shown in the interface. `AccountKind` distinguishes normal reader-writers from verified authors, publishers, independent authors, moderators, and admins.

`Follow` supports social graphs between users. `Notification` supports future activity alerts.

`UserSettings` stores private user preferences such as the BOOKLY visual mood. Current moods are `NIGHT` and `GARDEN`.

## Reading And Writing

`Story` represents user-generated fiction. It supports `DRAFT`, `PUBLISHED`, and `ARCHIVED` states, so writers can save work before publishing.

`Chapter` belongs to a story. Users can read chaptered stories, but comments are attached to the whole story rather than individual chapters, matching the requested behavior.

`Book` represents already-published real-world books. A book can be created manually or linked to an external catalog through `externalSource` and `externalId`.

`ReadingProgress` connects a user to either a story or a book and stores the current chapter, progress percentage, and last-opened time.

`SavedItem` lets users save stories, published books, or social posts. Each saved item belongs to one user and one target item.

## Social Feed

`Post` represents social timeline content. `PostKind` supports reviews, recommendations, quotes, discussion prompts, and reading updates.

Posts may connect to a real `Book`, include images, and receive `Like` and `Comment` records. The model also leaves room for repost/share behavior through future extension.

## Discovery And Classification

`Tag` and `ContentTag` create reusable genre/topic labels across stories, books, and posts.

`AIContentAnalysis` stores the result of automatic LLM processing: summary, genres, themes, audience, mood, moderation flags, and embedding-ready text.

`Recommendation` stores personalized recommendations with a score and a visible explanation. This is what powers the requested "why was this recommended?" experience.
