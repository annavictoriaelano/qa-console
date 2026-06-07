import Link from "next/link";
import { db, testCases, type TestCase } from "@/db";
import { asc } from "drizzle-orm";
import { Drawer } from "./_components/drawer";
import { bulkAction } from "./actions";

export const dynamic = "force-dynamic";

const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 20;

const runStatusStyles: Record<string, string> = {
  PASSED: "bg-green-100 text-green-800 ring-green-600/20",
  FAILED: "bg-red-100 text-red-800 ring-red-600/20",
  BLOCKED: "bg-yellow-100 text-yellow-800 ring-yellow-600/20",
  MANUAL: "bg-gray-100 text-gray-800 ring-gray-600/20",
};

const automationStatusStyles: Record<string, string> = {
  true_pass: "bg-emerald-100 text-emerald-800 ring-emerald-600/20",
  scripted: "bg-blue-100 text-blue-800 ring-blue-600/20",
  in_progress: "bg-amber-100 text-amber-800 ring-amber-600/20",
  not_automated: "bg-gray-100 text-gray-600 ring-gray-400/20",
};

function Badge({
  value,
  styles,
}: {
  value: string | null;
  styles: Record<string, string>;
}) {
  if (!value) return <span className="text-gray-400">-</span>;
  const cls = styles[value] ?? "bg-gray-100 text-gray-700 ring-gray-300";
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}
    >
      {value}
    </span>
  );
}

type ModuleStat = { module: string; feature: string | null; count: number };

type HrefOpts = {
  module?: string;
  ts?: string;
  tc?: string;
  q?: string;
  edit?: boolean;
  page?: number;
  size?: number;
};

function buildHref(opts: HrefOpts = {}) {
  const params = new URLSearchParams();
  if (opts.module) params.set("module", opts.module);
  if (opts.ts) params.set("ts", opts.ts);
  if (opts.tc) params.set("tc", opts.tc);
  if (opts.q) params.set("q", opts.q);
  if (opts.edit) params.set("edit", "1");
  if (opts.page && opts.page > 1) params.set("page", String(opts.page));
  if (opts.size && opts.size !== DEFAULT_PAGE_SIZE)
    params.set("size", String(opts.size));
  const qs = params.toString();
  return qs ? `/test-case-library?${qs}` : `/test-case-library`;
}

function parsePageSize(raw: string | undefined): number {
  if (raw === "50") return 50;
  if (raw === "100") return 100;
  return DEFAULT_PAGE_SIZE;
}

function parsePage(raw: string | undefined): number {
  const p = parseInt(raw ?? "1", 10);
  return Number.isFinite(p) && p > 0 ? p : 1;
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    module?: string;
    ts?: string;
    tc?: string;
    q?: string;
    edit?: string;
    page?: string;
    size?: string;
  }>;
}) {
  const params = await searchParams;
  const selectedModule = params.module;
  const ts = params.ts;
  const tc = params.tc;
  const qRaw = params.q?.trim();
  const q = qRaw && qRaw.length > 0 ? qRaw : undefined;
  const qLower = q?.toLowerCase();
  const isEditing = params.edit === "1";
  const size = parsePageSize(params.size);
  const requestedPage = parsePage(params.page);

  const allRows = await db.select().from(testCases).orderBy(asc(testCases.key));

  const moduleStats = new Map<string, { feature: string | null; count: number }>();
  for (const r of allRows) {
    const existing = moduleStats.get(r.module);
    if (existing) {
      existing.count++;
    } else {
      moduleStats.set(r.module, { feature: r.feature, count: 1 });
    }
  }
  const modules: ModuleStat[] = Array.from(moduleStats.entries())
    .map(([module, { feature, count }]) => ({ module, feature, count }))
    .sort((a, b) => a.module.localeCompare(b.module));

  const filtered: TestCase[] = allRows.filter(
    (r) =>
      (!selectedModule || r.module === selectedModule) &&
      (!ts || r.testSuite === ts) &&
      (!qLower || r.title.toLowerCase().includes(qLower)),
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / size));
  const page = Math.min(requestedPage, totalPages);
  const start = (page - 1) * size;
  const visible = filtered.slice(start, start + size);

  const tsScope = selectedModule
    ? allRows.filter((r) => r.module === selectedModule)
    : allRows;
  const suites = Array.from(
    new Set(tsScope.map((r) => r.testSuite).filter(Boolean)),
  ).sort();

  const totalByStatus = filtered.reduce<Record<string, number>>((acc, r) => {
    const k = r.lastRunStatus ?? "(none)";
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});

  const selectedModuleStat = selectedModule
    ? modules.find((m) => m.module === selectedModule)
    : null;

  const selectedTc = tc ? allRows.find((r) => r.key === tc) : null;

  const baseFilterOpts: HrefOpts = {
    module: selectedModule,
    ts,
    q,
    size: size === DEFAULT_PAGE_SIZE ? undefined : size,
  };

  const bulkRedirectTo = buildHref({
    ...baseFilterOpts,
    page: page === 1 ? undefined : page,
  });

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <h1 className="text-2xl font-semibold tracking-tight">Test Case Library</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {allRows.length} TCs in Neon
            {selectedModuleStat &&
              ` · viewing ${selectedModuleStat.module}${
                selectedModuleStat.feature ? " " + selectedModuleStat.feature : ""
              } (${selectedModuleStat.count})`}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {Object.entries(totalByStatus).map(([k, v]) => (
              <span
                key={k}
                className="rounded bg-zinc-100 px-2 py-1 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              >
                {k}: {v}
              </span>
            ))}
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-6 py-6">
        <aside className="w-56 shrink-0">
          <div className="sticky top-6 overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-200 px-3 py-2 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
              Modules
            </div>
            <nav className="flex flex-col p-1">
              <Link
                href={buildHref({ size: size === DEFAULT_PAGE_SIZE ? undefined : size })}
                className={`flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
                  !selectedModule
                    ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                }`}
              >
                <span>All modules</span>
                <span className="text-xs text-zinc-500">{allRows.length}</span>
              </Link>
              {modules.map((m) => {
                const active = selectedModule === m.module;
                return (
                  <Link
                    key={m.module}
                    href={buildHref({
                      module: m.module,
                      size: size === DEFAULT_PAGE_SIZE ? undefined : size,
                    })}
                    className={`flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
                      active
                        ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                    }`}
                  >
                    <span className="truncate">
                      <span className="font-mono text-xs text-zinc-500">{m.module}</span>{" "}
                      {m.feature ?? ""}
                    </span>
                    <span className="text-xs text-zinc-500">{m.count}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <form className="mb-4 flex flex-wrap items-center gap-3">
            {selectedModule && (
              <input type="hidden" name="module" value={selectedModule} />
            )}
            <input
              type="search"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Search title..."
              className="rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
            <label htmlFor="ts" className="text-sm font-medium">
              Test suite:
            </label>
            <select
              id="ts"
              name="ts"
              defaultValue={ts ?? ""}
              className="rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option value="">All ({tsScope.length})</option>
              {suites.map((s) => {
                const count = tsScope.filter((r) => r.testSuite === s).length;
                return (
                  <option key={s} value={s!}>
                    {s} ({count})
                  </option>
                );
              })}
            </select>
            <label htmlFor="size" className="text-sm font-medium">
              Per page:
            </label>
            <select
              id="size"
              name="size"
              defaultValue={String(size)}
              className="rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              {PAGE_SIZE_OPTIONS.map((opt) => (
                <option key={opt} value={String(opt)}>
                  {opt}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded bg-zinc-900 px-3 py-1.5 text-sm text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              Apply
            </button>
            {(ts || q) && (
              <Link
                href={buildHref({
                  module: selectedModule,
                  size: size === DEFAULT_PAGE_SIZE ? undefined : size,
                })}
                className="text-sm text-zinc-500 underline hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                Clear
              </Link>
            )}
            <span className="ml-auto text-sm text-zinc-500">
              {filtered.length === 0
                ? "0 results"
                : `Showing ${start + 1}-${start + visible.length} of ${filtered.length}`}
            </span>
          </form>

          <form action={bulkAction}>
            <input type="hidden" name="redirectTo" value={bulkRedirectTo} />
            <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <table className="min-w-full text-sm">
              <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-800/50">
                <tr>
                  <th className="w-10 px-4 py-3"></th>
                  <th className="px-4 py-3 font-medium">ID</th>
                  <th className="px-4 py-3 font-medium">Screen</th>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Automation</th>
                  <th className="px-4 py-3 font-medium">Last Run</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {visible.map((row) => {
                  const openHref = buildHref({
                    ...baseFilterOpts,
                    page: page === 1 ? undefined : page,
                    tc: row.key,
                  });
                  return (
                    <tr
                      key={row.id}
                      className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/30"
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          name="selected"
                          value={row.key}
                          className="h-4 w-4 rounded border-zinc-300"
                        />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">
                        <Link
                          href={openHref}
                          className="text-zinc-700 hover:text-zinc-900 hover:underline dark:text-zinc-300 dark:hover:text-zinc-100"
                        >
                          {String(row.id).padStart(3, "0")}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                        {row.screen}
                      </td>
                      <td className="max-w-2xl px-4 py-3">
                        <Link
                          href={openHref}
                          className="text-zinc-900 hover:underline dark:text-zinc-100"
                        >
                          {row.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          value={row.automationStatus}
                          styles={automationStatusStyles}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Badge value={row.lastRunStatus} styles={runStatusStyles} />
                      </td>
                    </tr>
                  );
                })}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                      No test cases match the current filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filtered.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-zinc-300 bg-white px-4 py-3 text-sm dark:border-zinc-700 dark:bg-zinc-900">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                Bulk:
              </span>
              <button
                type="submit"
                name="op"
                value="markReviewed"
                className="rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Mark reviewed
              </button>
              <button
                type="submit"
                name="op"
                value="markUnreviewed"
                className="rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Mark unreviewed
              </button>
              <span className="text-zinc-300 dark:text-zinc-700">|</span>
              <label htmlFor="tagInput" className="font-medium text-zinc-700 dark:text-zinc-300">
                Add tag:
              </label>
              <input
                id="tagInput"
                name="tagInput"
                type="text"
                placeholder="regression"
                className="rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              />
              <button
                type="submit"
                name="op"
                value="addTag"
                className="rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Add tag to selected
              </button>
              <span className="ml-auto text-xs text-zinc-500">
                Applies to checked rows on this page.
              </span>
            </div>
          )}
          </form>

          {filtered.length > 0 && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-zinc-500">
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                {page > 1 ? (
                  <Link
                    href={buildHref({
                      ...baseFilterOpts,
                      page: page - 1 === 1 ? undefined : page - 1,
                    })}
                    className="rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  >
                    ← Prev
                  </Link>
                ) : (
                  <span className="cursor-not-allowed rounded border border-zinc-200 px-3 py-1.5 text-sm text-zinc-300 dark:border-zinc-800 dark:text-zinc-700">
                    ← Prev
                  </span>
                )}
                {page < totalPages ? (
                  <Link
                    href={buildHref({
                      ...baseFilterOpts,
                      page: page + 1,
                    })}
                    className="rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  >
                    Next →
                  </Link>
                ) : (
                  <span className="cursor-not-allowed rounded border border-zinc-200 px-3 py-1.5 text-sm text-zinc-300 dark:border-zinc-800 dark:text-zinc-700">
                    Next →
                  </span>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {selectedTc && (
        <Drawer
          tc={selectedTc}
          closeHref={buildHref({
            ...baseFilterOpts,
            page: page === 1 ? undefined : page,
          })}
          editHref={buildHref({
            ...baseFilterOpts,
            page: page === 1 ? undefined : page,
            tc: selectedTc.key,
            edit: true,
          })}
          saveRedirectTo={buildHref({
            ...baseFilterOpts,
            page: page === 1 ? undefined : page,
            tc: selectedTc.key,
          })}
          isEditing={isEditing}
          buildTcHref={(k) =>
            buildHref({
              ...baseFilterOpts,
              page: page === 1 ? undefined : page,
              tc: k,
            })
          }
        />
      )}
    </div>
  );
}
