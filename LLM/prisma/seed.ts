import bcrypt from "bcryptjs";
import { PrismaClient, AccountKind, PostKind, StoryStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("bookly-demo-123", 12);

  const maya = await prisma.user.upsert({
    where: { email: "maya@bookly.test" },
    update: {},
    create: {
      email: "maya@bookly.test",
      username: "maya_pages",
      displayName: "Maya Everline",
      passwordHash,
      accountKind: AccountKind.INDEPENDENT_AUTHOR,
      bio: "Writes cozy fantasy and recommends books with impossible libraries."
    }
  });

  const publisher = await prisma.user.upsert({
    where: { email: "press@bookly.test" },
    update: {},
    create: {
      email: "press@bookly.test",
      username: "northline_press",
      displayName: "Northline Press",
      passwordHash,
      accountKind: AccountKind.PUBLISHER,
      bio: "Independent publisher of fantasy, romance, and literary debuts."
    }
  });

  const book = await prisma.book.create({
    data: {
      title: "A Court of Thorns and Roses",
      authorName: "Sarah J. Maas",
      description: "A published fantasy romance title used here as a seed example for recommendation posts.",
      publishedYear: 2015,
      externalSource: "manual",
      averageRating: 4.3,
      aiAnalysis: {
        create: {
          contentType: "BOOK",
          summary: "Fantasy romance with fae courts, danger, bargains, and transformation.",
          genres: ["fantasy", "romance"],
          themes: ["bargains", "survival", "power"],
          audience: "young adult and adult fantasy readers",
          mood: "romantic and dangerous",
          moderationFlags: [],
          embeddingText: "Fantasy romance fae courts bargains survival power"
        }
      }
    }
  });

  const story = await prisma.story.create({
    data: {
      authorId: maya.id,
      title: "The Lantern Archive",
      description: "A cozy fantasy about a hidden library that opens only for readers who are lost.",
      status: StoryStatus.PUBLISHED,
      publishedAt: new Date(),
      chapters: {
        create: [
          {
            number: 1,
            title: "The Library Wakes",
            body: "The library woke only after sunset, when every brass lantern leaned toward the shelves as if listening."
          },
          {
            number: 2,
            title: "A Map Folded Like a Moth",
            body: "Mira opened the map and let the first impossible street unfold at her feet."
          }
        ]
      },
      aiAnalysis: {
        create: {
          contentType: "STORY",
          summary: "A gentle magical-library fantasy about belonging, hidden doors, and impossible maps.",
          genres: ["cozy fantasy", "young adult"],
          themes: ["belonging", "hidden worlds", "found family"],
          audience: "teen and adult fantasy readers",
          mood: "cozy and mysterious",
          moderationFlags: [],
          embeddingText: "cozy fantasy magical library hidden doors belonging found family"
        }
      }
    }
  });

  await prisma.post.createMany({
    data: [
      {
        authorId: maya.id,
        bookId: book.id,
        kind: PostKind.RECOMMENDATION,
        title: "For anyone who loves magical bargains",
        body: "This is for readers who like romantic danger, fae politics, and heroines finding their own power."
      },
      {
        authorId: publisher.id,
        kind: PostKind.READING_UPDATE,
        title: "Three debuts our editors cannot stop talking about",
        body: "Each one blends folklore with modern questions about identity, ambition, and belonging."
      }
    ]
  });

  await prisma.readingProgress.create({
    data: {
      userId: maya.id,
      storyId: story.id,
      currentChapter: 2,
      progress: 68
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
