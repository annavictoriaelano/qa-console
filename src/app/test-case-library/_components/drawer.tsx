import Link from "next/link";
import { type TestCase } from "@/db";
import { updateTestCase } from "../actions";

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

const statusStyles: Record<string, string> = {
  draft: "bg-zinc-100 text-zinc-700 ring-zinc-400/30",
  ready: "bg-sky-100 text-sky-800 ring-sky-600/20",
  automated: "bg-violet-100 text-violet-800 ring-violet-600/20",
  deprecated: "bg-rose-100 text-rose-700 ring-rose-600/20",
};

const inputClass =
  "mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:focus:ring-zinc-100";
const labelClass =
  "text-[10px] font-semibold uppercase tracking-wider text-zinc-500";

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

function Empty() {
  return <span className="text-zinc-400">-</span>;
}

function Field({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  const hasValue =
    value !== null &&
    value !== undefined &&
    !(typeof value === "string" && value.trim() === "") &&
    !(Array.isArray(value) && value.length === 0);
  return (
    <div>
      <div className={labelClass}>{label}</div>
      <div className="mt-1 break-words text-sm text-zinc-900 dark:text-zinc-100">
        {hasValue ? value : <Empty />}
      </div>
    </div>
  );
}

function formatTimestamp(ts: Date | null) {
  if (!ts) return null;
  return ts.toISOString().replace("T", " ").slice(0, 16) + " UTC";
}

function toDatetimeLocal(ts: Date | null) {
  if (!ts) return "";
  return ts.toISOString().slice(0, 16);
}

const TC_STATUS_OPTIONS = ["draft", "ready", "automated", "deprecated"];
const AUTOMATION_OPTIONS = [
  "not_automated",
  "in_progress",
  "scripted",
  "true_pass",
];
const RUN_OPTIONS = ["PASSED", "FAILED", "BLOCKED", "MANUAL"];
const COUNTRY_OPTIONS = ["NZ", "AU", "UK", "ANY"];

type Props = {
  tc: TestCase;
  closeHref: string;
  editHref: string;
  saveRedirectTo: string;
  isEditing: boolean;
  buildTcHref: (key: string) => string;
};

export function Drawer(props: Props) {
  return (
    <>
      <Link
        href={props.closeHref}
        aria-label="Close TC detail"
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]"
      />
      <aside
        role="dialog"
        aria-label={`Test case ${props.tc.key}`}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl flex-col border-l border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
      >
        {props.isEditing ? <EditMode {...props} /> : <ViewMode {...props} />}
      </aside>
    </>
  );
}

function ViewMode({
  tc,
  closeHref,
  editHref,
  buildTcHref,
}: Props) {
  return (
    <>
      <div className="flex items-start justify-between gap-4 border-b border-zinc-200 p-6 dark:border-zinc-800">
        <div className="min-w-0">
          <div className="font-mono text-xs text-zinc-500">{tc.key}</div>
          <h2 className="mt-1 break-words text-lg font-semibold tracking-tight">
            {tc.title}
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge value={tc.status} styles={statusStyles} />
            <Badge value={tc.automationStatus} styles={automationStatusStyles} />
            <Badge value={tc.lastRunStatus} styles={runStatusStyles} />
            <span
              className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                tc.reviewed
                  ? "bg-emerald-100 text-emerald-800 ring-emerald-600/20"
                  : "bg-amber-100 text-amber-800 ring-amber-600/20"
              }`}
            >
              {tc.reviewed ? "reviewed" : "unreviewed"}
            </span>
          </div>
        </div>
        <Link
          href={closeHref}
          aria-label="Close"
          className="shrink-0 rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18 18 6M6 6l12 12"
            />
          </svg>
        </Link>
      </div>

      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-6">
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Module" value={tc.module} />
          <Field label="Feature" value={tc.feature} />
          <Field label="Screen" value={tc.screen} />
          <Field label="Test Suite" value={tc.testSuite} />
        </section>

        <Field
          label="Preconditions"
          value={
            tc.preconditions ? (
              <pre className="whitespace-pre-wrap font-sans text-sm">
                {tc.preconditions}
              </pre>
            ) : null
          }
        />

        <Field
          label="Gherkin Steps"
          value={
            tc.gherkinSteps ? (
              <pre className="overflow-x-auto rounded bg-zinc-50 p-3 text-xs dark:bg-zinc-800/50">
                {JSON.stringify(tc.gherkinSteps, null, 2)}
              </pre>
            ) : null
          }
        />

        <Field
          label="Expected Result"
          value={
            tc.expectedResult ? (
              <pre className="whitespace-pre-wrap font-sans text-sm">
                {tc.expectedResult}
              </pre>
            ) : null
          }
        />

        <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="User Role" value={tc.userRole} />
          <Field label="Plan" value={tc.plan} />
          <Field label="Country" value={tc.country} />
          <Field label="State" value={tc.state} />
        </section>

        <Field
          label="Tags"
          value={
            tc.tags && tc.tags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {tc.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                  >
                    {t}
                  </span>
                ))}
              </div>
            ) : null
          }
        />

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Jira Ticket" value={tc.jiraTicket} />
          <Field
            label="Source of Truth"
            value={
              tc.sourceOfTruthLink ? (
                <a
                  href={tc.sourceOfTruthLink}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all text-sky-700 underline hover:text-sky-900 dark:text-sky-400 dark:hover:text-sky-300"
                >
                  {tc.sourceOfTruthLink}
                </a>
              ) : null
            }
          />
        </section>

        <Field
          label="Related TCs"
          value={
            tc.relatedTcs && tc.relatedTcs.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 font-mono text-xs">
                {tc.relatedTcs.map((k) => (
                  <Link
                    key={k}
                    href={buildTcHref(k)}
                    className="rounded bg-zinc-100 px-2 py-0.5 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  >
                    {k}
                  </Link>
                ))}
              </div>
            ) : null
          }
        />

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Created" value={formatTimestamp(tc.createdAt)} />
          <Field label="Updated" value={formatTimestamp(tc.updatedAt)} />
          <Field label="Last Run" value={formatTimestamp(tc.lastRunAt)} />
        </section>
      </div>

      <div className="flex items-center justify-between border-t border-zinc-200 px-6 py-3 dark:border-zinc-800">
        <span className="text-xs text-zinc-500">Read-only view</span>
        <Link
          href={editHref}
          className="inline-flex items-center gap-2 rounded bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.862 4.487 18.549 2.799a2.121 2.121 0 1 1 3 3L19.862 7.487M16.862 4.487 6.34 15.01a4.5 4.5 0 0 0-1.13 1.897l-.95 3.328a.75.75 0 0 0 .93.93l3.33-.952a4.5 4.5 0 0 0 1.896-1.129L19.862 7.487M16.862 4.487 19.862 7.487"
            />
          </svg>
          Edit
        </Link>
      </div>
    </>
  );
}

function EditMode({ tc, closeHref, saveRedirectTo }: Props) {
  return (
    <form action={updateTestCase} className="flex min-h-0 flex-1 flex-col">
      <input type="hidden" name="key" value={tc.key} />
      <input type="hidden" name="redirectTo" value={saveRedirectTo} />

      <div className="flex items-start justify-between gap-4 border-b border-zinc-200 p-6 dark:border-zinc-800">
        <div className="min-w-0 flex-1">
          <div className="font-mono text-xs text-zinc-500">{tc.key}</div>
          <label className="mt-2 block">
            <span className="sr-only">Title</span>
            <input
              name="title"
              defaultValue={tc.title}
              required
              className="w-full rounded border border-zinc-300 bg-white px-3 py-1.5 text-lg font-semibold tracking-tight focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:focus:ring-zinc-100"
            />
          </label>
        </div>
        <Link
          href={closeHref}
          aria-label="Close without saving"
          className="shrink-0 rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18 18 6M6 6l12 12"
            />
          </svg>
        </Link>
      </div>

      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-6">
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Status</label>
            <select
              name="status"
              defaultValue={tc.status}
              className={inputClass}
            >
              {TC_STATUS_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="reviewed"
                defaultChecked={tc.reviewed}
                className="h-4 w-4 rounded border-zinc-300"
              />
              <span className="font-medium">Mark as reviewed</span>
            </label>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Module (immutable)</label>
            <input
              defaultValue={tc.module}
              disabled
              className={`${inputClass} cursor-not-allowed opacity-60`}
            />
          </div>
          <div>
            <label className={labelClass}>Feature</label>
            <input
              name="feature"
              defaultValue={tc.feature ?? ""}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Screen</label>
            <input
              name="screen"
              defaultValue={tc.screen ?? ""}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Test Suite</label>
            <input
              name="testSuite"
              defaultValue={tc.testSuite ?? ""}
              className={inputClass}
            />
          </div>
        </section>

        <div>
          <label className={labelClass}>Preconditions</label>
          <textarea
            name="preconditions"
            defaultValue={tc.preconditions ?? ""}
            rows={4}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Expected Result</label>
          <textarea
            name="expectedResult"
            defaultValue={tc.expectedResult ?? ""}
            rows={4}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>
            Gherkin Steps (read-only in v1; edit JSON in db:studio)
          </label>
          <pre className="mt-1 overflow-x-auto rounded bg-zinc-50 p-3 text-xs dark:bg-zinc-800/50">
            {tc.gherkinSteps
              ? JSON.stringify(tc.gherkinSteps, null, 2)
              : "(none)"}
          </pre>
        </div>

        <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <label className={labelClass}>User Role</label>
            <input
              name="userRole"
              defaultValue={tc.userRole ?? ""}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Plan</label>
            <input
              name="plan"
              defaultValue={tc.plan ?? ""}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Country</label>
            <select
              name="country"
              defaultValue={tc.country ?? "ANY"}
              className={inputClass}
            >
              {COUNTRY_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>State</label>
            <input
              name="state"
              defaultValue={tc.state ?? ""}
              className={inputClass}
            />
          </div>
        </section>

        <div>
          <label className={labelClass}>Tags (comma-separated)</label>
          <input
            name="tags"
            defaultValue={tc.tags ? tc.tags.join(", ") : ""}
            placeholder="regression, smoke, p1"
            className={inputClass}
          />
        </div>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Automation Status</label>
            <select
              name="automationStatus"
              defaultValue={tc.automationStatus}
              className={inputClass}
            >
              {AUTOMATION_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Last Run Status</label>
            <select
              name="lastRunStatus"
              defaultValue={tc.lastRunStatus ?? ""}
              className={inputClass}
            >
              <option value="">(none)</option>
              {RUN_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Jira Ticket</label>
            <input
              name="jiraTicket"
              defaultValue={tc.jiraTicket ?? ""}
              placeholder="STA-123"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Last Run At</label>
            <input
              type="datetime-local"
              name="lastRunAt"
              defaultValue={toDatetimeLocal(tc.lastRunAt)}
              className={inputClass}
            />
          </div>
        </section>

        <div>
          <label className={labelClass}>Source of Truth URL</label>
          <input
            type="url"
            name="sourceOfTruthLink"
            defaultValue={tc.sourceOfTruthLink ?? ""}
            placeholder="https://..."
            className={inputClass}
          />
        </div>

        <div className="text-xs text-zinc-500">
          Related TCs editor coming in a later iteration. Current value:{" "}
          {tc.relatedTcs && tc.relatedTcs.length > 0
            ? tc.relatedTcs.join(", ")
            : "(none)"}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-zinc-200 px-6 py-3 dark:border-zinc-800">
        <Link
          href={closeHref}
          className="rounded px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Cancel
        </Link>
        <button
          type="submit"
          className="rounded bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Save
        </button>
      </div>
    </form>
  );
}
