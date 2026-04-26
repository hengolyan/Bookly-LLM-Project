import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeContent } from "@/lib/ai";

const analyzeSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  contentType: z.enum(["story", "book", "post"])
});

export async function POST(request: Request) {
  const body = analyzeSchema.parse(await request.json());
  const analysis = await analyzeContent(body);
  return NextResponse.json({ analysis });
}
