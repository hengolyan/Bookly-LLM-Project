import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

export const contentAnalysisSchema = z.object({
  summary: z.string(),
  genres: z.array(z.string()),
  themes: z.array(z.string()),
  audience: z.string(),
  mood: z.string(),
  moderationFlags: z.array(z.string()),
  recommendationReason: z.string()
});

export type ContentAnalysis = z.infer<typeof contentAnalysisSchema>;

const fallbackGenres = ["fantasy", "romance", "mystery", "young adult", "literary"];

export async function analyzeContent(input: {
  title: string;
  body: string;
  contentType: "story" | "book" | "post";
}): Promise<ContentAnalysis> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    const text = `${input.title} ${input.body}`.toLowerCase();
    const genres = fallbackGenres.filter((genre) => text.includes(genre)).slice(0, 3);
    return {
      summary: input.body.slice(0, 220) || input.title,
      genres: genres.length ? genres : ["general fiction"],
      themes: ["community", "discovery"],
      audience: "general readers",
      mood: text.includes("dark") ? "atmospheric" : "cozy",
      moderationFlags: [],
      recommendationReason: "Recommended because its themes and reading mood match your recent activity."
    };
  }

  const client = new OpenAI({ apiKey });
  const response = await client.chat.completions.parse({
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    messages: [
      {
        role: "system",
        content:
          "Classify reading-platform content. Ground every field in the supplied text. Do not invent facts."
      },
      {
        role: "user",
        content: `Content type: ${input.contentType}\nTitle: ${input.title}\nText:\n${input.body}`
      }
    ],
    response_format: zodResponseFormat(contentAnalysisSchema, "content_analysis")
  });

  return response.choices[0]?.message.parsed ?? {
    summary: input.body.slice(0, 220),
    genres: ["general fiction"],
    themes: [],
    audience: "general readers",
    mood: "balanced",
    moderationFlags: [],
    recommendationReason: "Recommended because it shares signals with your reading history."
  };
}
