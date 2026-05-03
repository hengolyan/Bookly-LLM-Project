-- BOOKLY Supabase PostgreSQL schema
-- Run this in Supabase Dashboard > SQL Editor > New query.
-- It creates the database tables needed for auth, stories, chapters,
-- books, social posts, saves, likes, comments, reading progress, and LLM metadata.

create extension if not exists pgcrypto;

do $$ begin
  create type "AccountKind" as enum (
    'READER_WRITER',
    'VERIFIED_AUTHOR',
    'PUBLISHER',
    'INDEPENDENT_AUTHOR',
    'MODERATOR',
    'ADMIN'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type "StoryStatus" as enum ('DRAFT', 'PUBLISHED', 'ARCHIVED');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type "PostKind" as enum (
    'REVIEW',
    'RECOMMENDATION',
    'QUOTE',
    'DISCUSSION',
    'READING_UPDATE'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type "ContentType" as enum ('STORY', 'BOOK', 'POST');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type "AppMood" as enum ('NIGHT', 'GARDEN');
exception when duplicate_object then null;
end $$;

create or replace function bookly_set_updated_at()
returns trigger as $$
begin
  new."updatedAt" = now();
  return new;
end;
$$ language plpgsql;

create table if not exists "User" (
  "id" text primary key,
  "email" text not null unique,
  "username" text not null unique,
  "displayName" text not null,
  "passwordHash" text not null,
  "bio" text not null default '',
  "avatarUrl" text,
  "accountKind" "AccountKind" not null default 'READER_WRITER',
  "createdAt" timestamp(3) not null default current_timestamp,
  "updatedAt" timestamp(3) not null default current_timestamp
);

create table if not exists "Book" (
  "id" text primary key,
  "title" text not null,
  "authorName" text not null,
  "description" text not null,
  "coverUrl" text,
  "isbn" text,
  "externalSource" text,
  "externalId" text,
  "publishedYear" integer,
  "averageRating" double precision not null default 0,
  "createdAt" timestamp(3) not null default current_timestamp
);

create table if not exists "Story" (
  "id" text primary key,
  "authorId" text not null references "User"("id") on delete cascade on update cascade,
  "title" text not null,
  "description" text not null,
  "coverUrl" text,
  "status" "StoryStatus" not null default 'DRAFT',
  "averageRating" double precision not null default 0,
  "publishedAt" timestamp(3),
  "createdAt" timestamp(3) not null default current_timestamp,
  "updatedAt" timestamp(3) not null default current_timestamp
);

create table if not exists "Chapter" (
  "id" text primary key,
  "storyId" text not null references "Story"("id") on delete cascade on update cascade,
  "number" integer not null,
  "title" text not null,
  "body" text not null,
  "createdAt" timestamp(3) not null default current_timestamp,
  "updatedAt" timestamp(3) not null default current_timestamp,
  constraint "Chapter_storyId_number_key" unique ("storyId", "number")
);

create table if not exists "Post" (
  "id" text primary key,
  "authorId" text not null references "User"("id") on delete cascade on update cascade,
  "bookId" text references "Book"("id") on delete set null on update cascade,
  "kind" "PostKind" not null,
  "title" text not null,
  "body" text not null,
  "imageUrl" text,
  "createdAt" timestamp(3) not null default current_timestamp,
  "updatedAt" timestamp(3) not null default current_timestamp
);

create table if not exists "Comment" (
  "id" text primary key,
  "authorId" text not null references "User"("id") on delete cascade on update cascade,
  "storyId" text references "Story"("id") on delete cascade on update cascade,
  "postId" text references "Post"("id") on delete cascade on update cascade,
  "body" text not null,
  "createdAt" timestamp(3) not null default current_timestamp,
  constraint "Comment_exactly_one_parent" check (
    (case when "storyId" is null then 0 else 1 end) +
    (case when "postId" is null then 0 else 1 end) = 1
  )
);

create table if not exists "Like" (
  "id" text primary key,
  "userId" text not null references "User"("id") on delete cascade on update cascade,
  "postId" text not null references "Post"("id") on delete cascade on update cascade,
  "createdAt" timestamp(3) not null default current_timestamp,
  constraint "Like_userId_postId_key" unique ("userId", "postId")
);

create table if not exists "Follow" (
  "id" text primary key,
  "followerId" text not null references "User"("id") on delete cascade on update cascade,
  "followingId" text not null references "User"("id") on delete cascade on update cascade,
  "createdAt" timestamp(3) not null default current_timestamp,
  constraint "Follow_followerId_followingId_key" unique ("followerId", "followingId"),
  constraint "Follow_not_self" check ("followerId" <> "followingId")
);

create table if not exists "ReadingProgress" (
  "id" text primary key,
  "userId" text not null references "User"("id") on delete cascade on update cascade,
  "storyId" text references "Story"("id") on delete cascade on update cascade,
  "bookId" text references "Book"("id") on delete cascade on update cascade,
  "currentChapter" integer,
  "progress" double precision not null default 0,
  "lastOpenedAt" timestamp(3) not null default current_timestamp,
  constraint "ReadingProgress_exactly_one_target" check (
    (case when "storyId" is null then 0 else 1 end) +
    (case when "bookId" is null then 0 else 1 end) = 1
  )
);

create table if not exists "SavedItem" (
  "id" text primary key,
  "userId" text not null references "User"("id") on delete cascade on update cascade,
  "storyId" text references "Story"("id") on delete cascade on update cascade,
  "bookId" text references "Book"("id") on delete cascade on update cascade,
  "postId" text references "Post"("id") on delete cascade on update cascade,
  "createdAt" timestamp(3) not null default current_timestamp,
  constraint "SavedItem_exactly_one_target" check (
    (case when "storyId" is null then 0 else 1 end) +
    (case when "bookId" is null then 0 else 1 end) +
    (case when "postId" is null then 0 else 1 end) = 1
  )
);

create unique index if not exists "SavedItem_user_story_key"
  on "SavedItem"("userId", "storyId") where "storyId" is not null;
create unique index if not exists "SavedItem_user_book_key"
  on "SavedItem"("userId", "bookId") where "bookId" is not null;
create unique index if not exists "SavedItem_user_post_key"
  on "SavedItem"("userId", "postId") where "postId" is not null;

create table if not exists "UserSettings" (
  "id" text primary key,
  "userId" text not null unique references "User"("id") on delete cascade on update cascade,
  "mood" "AppMood" not null default 'NIGHT',
  "createdAt" timestamp(3) not null default current_timestamp,
  "updatedAt" timestamp(3) not null default current_timestamp
);

create table if not exists "Tag" (
  "id" text primary key,
  "name" text not null unique
);

create table if not exists "ContentTag" (
  "id" text primary key,
  "tagId" text not null references "Tag"("id") on delete cascade on update cascade,
  "storyId" text references "Story"("id") on delete cascade on update cascade,
  "bookId" text references "Book"("id") on delete cascade on update cascade,
  "postId" text references "Post"("id") on delete cascade on update cascade,
  constraint "ContentTag_exactly_one_target" check (
    (case when "storyId" is null then 0 else 1 end) +
    (case when "bookId" is null then 0 else 1 end) +
    (case when "postId" is null then 0 else 1 end) = 1
  )
);

create table if not exists "AIContentAnalysis" (
  "id" text primary key,
  "contentType" "ContentType" not null,
  "storyId" text unique references "Story"("id") on delete cascade on update cascade,
  "bookId" text unique references "Book"("id") on delete cascade on update cascade,
  "postId" text unique references "Post"("id") on delete cascade on update cascade,
  "summary" text not null,
  "genres" text[] not null,
  "themes" text[] not null,
  "audience" text not null,
  "mood" text not null,
  "moderationFlags" text[] not null,
  "embeddingText" text not null,
  "createdAt" timestamp(3) not null default current_timestamp,
  constraint "AIContentAnalysis_exactly_one_target" check (
    (case when "storyId" is null then 0 else 1 end) +
    (case when "bookId" is null then 0 else 1 end) +
    (case when "postId" is null then 0 else 1 end) = 1
  )
);

create table if not exists "Recommendation" (
  "id" text primary key,
  "userId" text not null references "User"("id") on delete cascade on update cascade,
  "storyId" text references "Story"("id") on delete cascade on update cascade,
  "bookId" text references "Book"("id") on delete cascade on update cascade,
  "reason" text not null,
  "score" double precision not null,
  "createdAt" timestamp(3) not null default current_timestamp,
  constraint "Recommendation_exactly_one_target" check (
    (case when "storyId" is null then 0 else 1 end) +
    (case when "bookId" is null then 0 else 1 end) = 1
  )
);

create table if not exists "Notification" (
  "id" text primary key,
  "userId" text not null references "User"("id") on delete cascade on update cascade,
  "body" text not null,
  "read" boolean not null default false,
  "createdAt" timestamp(3) not null default current_timestamp
);

create index if not exists "Book_title_idx" on "Book"("title");
create index if not exists "Story_authorId_status_idx" on "Story"("authorId", "status");
create index if not exists "Post_authorId_createdAt_idx" on "Post"("authorId", "createdAt");
create index if not exists "ReadingProgress_userId_lastOpenedAt_idx" on "ReadingProgress"("userId", "lastOpenedAt");
create index if not exists "Recommendation_userId_score_idx" on "Recommendation"("userId", "score");

drop trigger if exists "User_updatedAt" on "User";
create trigger "User_updatedAt" before update on "User"
for each row execute function bookly_set_updated_at();

drop trigger if exists "Story_updatedAt" on "Story";
create trigger "Story_updatedAt" before update on "Story"
for each row execute function bookly_set_updated_at();

drop trigger if exists "Chapter_updatedAt" on "Chapter";
create trigger "Chapter_updatedAt" before update on "Chapter"
for each row execute function bookly_set_updated_at();

drop trigger if exists "Post_updatedAt" on "Post";
create trigger "Post_updatedAt" before update on "Post"
for each row execute function bookly_set_updated_at();

drop trigger if exists "UserSettings_updatedAt" on "UserSettings";
create trigger "UserSettings_updatedAt" before update on "UserSettings"
for each row execute function bookly_set_updated_at();
