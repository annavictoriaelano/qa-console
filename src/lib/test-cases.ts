import "server-only";
import { and, asc, eq, inArray, type SQL } from "drizzle-orm";
import { db, testCases, type TestCase } from "@/db";

export const TC_STATUS = ["draft", "ready", "automated", "deprecated"] as const;
export const AUTOMATION_STATUS = [
  "not_automated",
  "in_progress",
  "scripted",
  "true_pass",
] as const;
export const LAST_RUN_STATUS = ["PASSED", "FAILED", "BLOCKED", "MANUAL"] as const;
export const COUNTRY = ["NZ", "AU", "UK", "ANY"] as const;

export type TcStatus = (typeof TC_STATUS)[number];
export type AutomationStatus = (typeof AUTOMATION_STATUS)[number];
export type LastRunStatus = (typeof LAST_RUN_STATUS)[number];
export type Country = (typeof COUNTRY)[number];

export type ListFilters = {
  module?: string;
  status?: TcStatus;
  automationStatus?: AutomationStatus;
  lastRunStatus?: LastRunStatus;
  reviewed?: boolean;
  feature?: string;
  testSuite?: string;
  limit?: number;
  offset?: number;
};

export type ListResult = {
  items: TestCase[];
  limit: number;
  offset: number;
};

export type TestCasePatch = Partial<{
  title: string;
  status: TcStatus;
  reviewed: boolean;
  feature: string | null;
  screen: string | null;
  testSuite: string | null;
  preconditions: string | null;
  expectedResult: string | null;
  tags: string[];
  userRole: string | null;
  plan: string | null;
  country: Country;
  state: string | null;
  automationStatus: AutomationStatus;
  jiraTicket: string | null;
  sourceOfTruthLink: string | null;
  lastRunAt: Date | null;
  lastRunStatus: LastRunStatus | null;
}>;

export type RunResultInput = {
  key: string;
  status: LastRunStatus;
  ranAt?: Date;
};

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

export async function listTestCases(
  filters: ListFilters = {},
): Promise<ListResult> {
  const conditions: SQL[] = [];
  if (filters.module) conditions.push(eq(testCases.module, filters.module));
  if (filters.status) conditions.push(eq(testCases.status, filters.status));
  if (filters.automationStatus)
    conditions.push(eq(testCases.automationStatus, filters.automationStatus));
  if (filters.lastRunStatus)
    conditions.push(eq(testCases.lastRunStatus, filters.lastRunStatus));
  if (typeof filters.reviewed === "boolean")
    conditions.push(eq(testCases.reviewed, filters.reviewed));
  if (filters.feature) conditions.push(eq(testCases.feature, filters.feature));
  if (filters.testSuite)
    conditions.push(eq(testCases.testSuite, filters.testSuite));

  const limit = Math.min(filters.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
  const offset = Math.max(filters.offset ?? 0, 0);

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const items = await db
    .select()
    .from(testCases)
    .where(where)
    .orderBy(asc(testCases.key))
    .limit(limit)
    .offset(offset);

  return { items, limit, offset };
}

export async function getTestCase(key: string): Promise<TestCase | null> {
  const rows = await db
    .select()
    .from(testCases)
    .where(eq(testCases.key, key))
    .limit(1);
  return rows[0] ?? null;
}

export async function updateTestCase(
  key: string,
  patch: TestCasePatch,
): Promise<TestCase | null> {
  if (Object.keys(patch).length === 0) {
    return getTestCase(key);
  }
  const rows = await db
    .update(testCases)
    .set(patch)
    .where(eq(testCases.key, key))
    .returning();
  return rows[0] ?? null;
}

export async function bulkSetReviewed(
  keys: string[],
  reviewed: boolean,
): Promise<number> {
  if (keys.length === 0) return 0;
  const rows = await db
    .update(testCases)
    .set({ reviewed })
    .where(inArray(testCases.key, keys))
    .returning({ key: testCases.key });
  return rows.length;
}

export async function bulkAddTag(keys: string[], tag: string): Promise<number> {
  if (keys.length === 0 || !tag) return 0;
  const rows = await db
    .select({ key: testCases.key, tags: testCases.tags })
    .from(testCases)
    .where(inArray(testCases.key, keys));

  let updated = 0;
  for (const row of rows) {
    const existing = row.tags ?? [];
    if (existing.includes(tag)) continue;
    await db
      .update(testCases)
      .set({ tags: [...existing, tag] })
      .where(eq(testCases.key, row.key));
    updated++;
  }
  return updated;
}

export async function recordRunResults(
  results: RunResultInput[],
): Promise<{ updated: number; missing: string[] }> {
  if (results.length === 0) return { updated: 0, missing: [] };
  const now = new Date();
  const missing: string[] = [];
  let updated = 0;
  for (const result of results) {
    const rows = await db
      .update(testCases)
      .set({
        lastRunStatus: result.status,
        lastRunAt: result.ranAt ?? now,
      })
      .where(eq(testCases.key, result.key))
      .returning({ key: testCases.key });
    if (rows.length === 0) missing.push(result.key);
    else updated++;
  }
  return { updated, missing };
}
