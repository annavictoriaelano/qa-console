import { type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import {
  LAST_RUN_STATUS,
  recordRunResults,
  type LastRunStatus,
  type RunResultInput,
} from "@/lib/test-cases";

function isLastRunStatus(v: unknown): v is LastRunStatus {
  return typeof v === "string" && (LAST_RUN_STATUS as readonly string[]).includes(v);
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return Response.json({ error: "body_must_be_object" }, { status: 400 });
  }
  const raw = (body as Record<string, unknown>).results;
  if (!Array.isArray(raw)) {
    return Response.json(
      { error: "results_must_be_array" },
      { status: 400 },
    );
  }

  const results: RunResultInput[] = [];
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    if (!item || typeof item !== "object") {
      return Response.json(
        { error: "invalid_result_item", index: i },
        { status: 400 },
      );
    }
    const obj = item as Record<string, unknown>;
    const key = typeof obj.key === "string" ? obj.key.trim() : "";
    if (!key) {
      return Response.json(
        { error: "missing_key", index: i },
        { status: 400 },
      );
    }
    if (!isLastRunStatus(obj.status)) {
      return Response.json(
        { error: "invalid_status", index: i, allowed: LAST_RUN_STATUS },
        { status: 400 },
      );
    }
    let ranAt: Date | undefined;
    if (typeof obj.ranAt === "string") {
      const d = new Date(obj.ranAt);
      if (Number.isNaN(d.getTime())) {
        return Response.json(
          { error: "invalid_ranAt", index: i },
          { status: 400 },
        );
      }
      ranAt = d;
    }
    results.push({ key, status: obj.status, ranAt });
  }

  const outcome = await recordRunResults(results);
  revalidatePath("/test-case-library");
  return Response.json(outcome);
}
