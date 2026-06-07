import { type NextRequest } from "next/server";
import {
  AUTOMATION_STATUS,
  LAST_RUN_STATUS,
  TC_STATUS,
  listTestCases,
  type ListFilters,
  type AutomationStatus,
  type LastRunStatus,
  type TcStatus,
} from "@/lib/test-cases";

function pickEnum<T extends readonly string[]>(
  value: string | null,
  valid: T,
): T[number] | undefined {
  if (value === null) return undefined;
  return (valid as readonly string[]).includes(value)
    ? (value as T[number])
    : undefined;
}

function pickInt(value: string | null): number | undefined {
  if (value === null) return undefined;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : undefined;
}

function pickBool(value: string | null): boolean | undefined {
  if (value === null) return undefined;
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const filters: ListFilters = {
    module: params.get("module") ?? undefined,
    status: pickEnum<typeof TC_STATUS>(params.get("status"), TC_STATUS) as
      | TcStatus
      | undefined,
    automationStatus: pickEnum<typeof AUTOMATION_STATUS>(
      params.get("automation_status"),
      AUTOMATION_STATUS,
    ) as AutomationStatus | undefined,
    lastRunStatus: pickEnum<typeof LAST_RUN_STATUS>(
      params.get("last_run_status"),
      LAST_RUN_STATUS,
    ) as LastRunStatus | undefined,
    reviewed: pickBool(params.get("reviewed")),
    feature: params.get("feature") ?? undefined,
    testSuite: params.get("test_suite") ?? undefined,
    limit: pickInt(params.get("limit")),
    offset: pickInt(params.get("offset")),
  };

  const result = await listTestCases(filters);
  return Response.json(result);
}
