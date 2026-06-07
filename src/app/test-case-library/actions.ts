"use server";

import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, testCases } from "@/db";
import { verifySession } from "@/lib/dal";

const TC_STATUS = ["draft", "ready", "automated", "deprecated"] as const;
const AUTOMATION_STATUS = [
  "not_automated",
  "in_progress",
  "scripted",
  "true_pass",
] as const;
const LAST_RUN_STATUS = ["PASSED", "FAILED", "BLOCKED", "MANUAL"] as const;
const COUNTRY = ["NZ", "AU", "UK", "ANY"] as const;

function str(v: FormDataEntryValue | null): string | null {
  if (v === null) return null;
  const trimmed = String(v).trim();
  return trimmed === "" ? null : trimmed;
}

function arr(v: FormDataEntryValue | null): string[] {
  if (v === null) return [];
  const trimmed = String(v).trim();
  if (trimmed === "") return [];
  return trimmed
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function inEnum<T extends readonly string[]>(
  v: FormDataEntryValue | null,
  valid: T,
  fallback: T[number],
): T[number] {
  if (v === null) return fallback;
  const s = String(v);
  return (valid as readonly string[]).includes(s) ? (s as T[number]) : fallback;
}

function nullableEnum<T extends readonly string[]>(
  v: FormDataEntryValue | null,
  valid: T,
): T[number] | null {
  if (v === null) return null;
  const s = String(v).trim();
  if (s === "") return null;
  return (valid as readonly string[]).includes(s) ? (s as T[number]) : null;
}

function dateOrNull(v: FormDataEntryValue | null): Date | null {
  if (v === null) return null;
  const s = String(v).trim();
  if (s === "") return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function updateTestCase(formData: FormData): Promise<void> {
  await verifySession();
  const key = String(formData.get("key") ?? "").trim();
  const redirectTo = String(formData.get("redirectTo") ?? "/test-case-library");

  if (!key) throw new Error("Missing TC key in form submission");

  const title = str(formData.get("title"));
  if (!title) throw new Error("Title cannot be empty");

  await db
    .update(testCases)
    .set({
      title,
      status: inEnum(formData.get("status"), TC_STATUS, "draft"),
      reviewed: formData.get("reviewed") === "on",
      feature: str(formData.get("feature")),
      screen: str(formData.get("screen")),
      testSuite: str(formData.get("testSuite")),
      preconditions: str(formData.get("preconditions")),
      expectedResult: str(formData.get("expectedResult")),
      tags: arr(formData.get("tags")),
      userRole: str(formData.get("userRole")),
      plan: str(formData.get("plan")),
      country: inEnum(formData.get("country"), COUNTRY, "ANY"),
      state: str(formData.get("state")),
      automationStatus: inEnum(
        formData.get("automationStatus"),
        AUTOMATION_STATUS,
        "not_automated",
      ),
      jiraTicket: str(formData.get("jiraTicket")),
      sourceOfTruthLink: str(formData.get("sourceOfTruthLink")),
      lastRunAt: dateOrNull(formData.get("lastRunAt")),
      lastRunStatus: nullableEnum(formData.get("lastRunStatus"), LAST_RUN_STATUS),
    })
    .where(eq(testCases.key, key));

  revalidatePath("/test-case-library");
  redirect(redirectTo);
}

export async function bulkAction(formData: FormData): Promise<void> {
  await verifySession();
  const op = String(formData.get("op") ?? "");
  const keys = formData.getAll("selected").map(String);
  const redirectTo = String(formData.get("redirectTo") ?? "/test-case-library");

  if (keys.length === 0) redirect(redirectTo);

  if (op === "markReviewed") {
    await db
      .update(testCases)
      .set({ reviewed: true })
      .where(inArray(testCases.key, keys));
  } else if (op === "markUnreviewed") {
    await db
      .update(testCases)
      .set({ reviewed: false })
      .where(inArray(testCases.key, keys));
  } else if (op === "addTag") {
    const tag = String(formData.get("tagInput") ?? "").trim();
    if (!tag) redirect(redirectTo);

    const rows = await db
      .select({ key: testCases.key, tags: testCases.tags })
      .from(testCases)
      .where(inArray(testCases.key, keys));

    for (const row of rows) {
      const existing = row.tags ?? [];
      if (!existing.includes(tag)) {
        await db
          .update(testCases)
          .set({ tags: [...existing, tag] })
          .where(eq(testCases.key, row.key));
      }
    }
  }

  revalidatePath("/test-case-library");
  redirect(redirectTo);
}
