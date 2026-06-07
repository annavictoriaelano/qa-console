import { type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import {
  AUTOMATION_STATUS,
  COUNTRY,
  LAST_RUN_STATUS,
  TC_STATUS,
  getTestCase,
  updateTestCase,
  type TestCasePatch,
} from "@/lib/test-cases";

function asEnum<T extends readonly string[]>(
  value: unknown,
  valid: T,
): T[number] | undefined {
  if (typeof value !== "string") return undefined;
  return (valid as readonly string[]).includes(value)
    ? (value as T[number])
    : undefined;
}

function asNullableString(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.filter((x): x is string => typeof x === "string");
}

function asNullableDate(value: unknown): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function buildPatch(body: Record<string, unknown>): TestCasePatch {
  const patch: TestCasePatch = {};
  if (typeof body.title === "string" && body.title.trim() !== "")
    patch.title = body.title.trim();
  const status = asEnum(body.status, TC_STATUS);
  if (status) patch.status = status;
  if (typeof body.reviewed === "boolean") patch.reviewed = body.reviewed;

  const feature = asNullableString(body.feature);
  if (feature !== undefined) patch.feature = feature;
  const screen = asNullableString(body.screen);
  if (screen !== undefined) patch.screen = screen;
  const testSuite = asNullableString(body.testSuite);
  if (testSuite !== undefined) patch.testSuite = testSuite;
  const preconditions = asNullableString(body.preconditions);
  if (preconditions !== undefined) patch.preconditions = preconditions;
  const expectedResult = asNullableString(body.expectedResult);
  if (expectedResult !== undefined) patch.expectedResult = expectedResult;

  const tags = asStringArray(body.tags);
  if (tags !== undefined) patch.tags = tags;

  const userRole = asNullableString(body.userRole);
  if (userRole !== undefined) patch.userRole = userRole;
  const plan = asNullableString(body.plan);
  if (plan !== undefined) patch.plan = plan;
  const country = asEnum(body.country, COUNTRY);
  if (country) patch.country = country;
  const state = asNullableString(body.state);
  if (state !== undefined) patch.state = state;

  const automationStatus = asEnum(body.automationStatus, AUTOMATION_STATUS);
  if (automationStatus) patch.automationStatus = automationStatus;

  const jiraTicket = asNullableString(body.jiraTicket);
  if (jiraTicket !== undefined) patch.jiraTicket = jiraTicket;
  const sourceOfTruthLink = asNullableString(body.sourceOfTruthLink);
  if (sourceOfTruthLink !== undefined)
    patch.sourceOfTruthLink = sourceOfTruthLink;

  const lastRunAt = asNullableDate(body.lastRunAt);
  if (lastRunAt !== undefined) patch.lastRunAt = lastRunAt;
  const lastRunStatusRaw = body.lastRunStatus;
  if (lastRunStatusRaw === null) {
    patch.lastRunStatus = null;
  } else {
    const lastRunStatus = asEnum(lastRunStatusRaw, LAST_RUN_STATUS);
    if (lastRunStatus) patch.lastRunStatus = lastRunStatus;
  }

  return patch;
}

export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ key: string }> },
) {
  const { key } = await ctx.params;
  const tc = await getTestCase(key);
  if (!tc) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json(tc);
}

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ key: string }> },
) {
  const { key } = await ctx.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return Response.json({ error: "body_must_be_object" }, { status: 400 });
  }
  const patch = buildPatch(body as Record<string, unknown>);
  if (Object.keys(patch).length === 0) {
    return Response.json(
      { error: "no_valid_fields_in_patch" },
      { status: 400 },
    );
  }
  const updated = await updateTestCase(key, patch);
  if (!updated) return Response.json({ error: "not_found" }, { status: 404 });
  revalidatePath("/test-case-library");
  return Response.json(updated);
}
