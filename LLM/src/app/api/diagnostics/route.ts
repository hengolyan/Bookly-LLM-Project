import { NextResponse } from "next/server";
import { runDiagnostics } from "@/lib/runtime-diagnostics";

export const dynamic = "force-dynamic";

export async function GET() {
  const diagnostics = await runDiagnostics();
  return NextResponse.json(diagnostics, { status: diagnostics.ok ? 200 : 500 });
}
