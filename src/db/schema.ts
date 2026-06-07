import {
  boolean,
  pgTable,
  serial,
  text,
  varchar,
  jsonb,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

export const tcStatusEnum = pgEnum("tc_status", [
  "draft",
  "ready",
  "automated",
  "deprecated",
]);

export const automationStatusEnum = pgEnum("automation_status", [
  "not_automated",
  "in_progress",
  "scripted",
  "true_pass",
]);

export const lastRunStatusEnum = pgEnum("last_run_status", [
  "PASSED",
  "FAILED",
  "BLOCKED",
  "MANUAL",
]);

export const countryEnum = pgEnum("country", ["NZ", "AU", "UK", "ANY"]);

export const testCases = pgTable("test_cases", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 48 }).notNull().unique(),
  title: text("title").notNull(),
  status: tcStatusEnum("status").notNull().default("draft"),
  reviewed: boolean("reviewed").notNull().default(false),

  module: varchar("module", { length: 8 }).notNull(),
  feature: varchar("feature", { length: 64 }),
  screen: varchar("screen", { length: 64 }),
  testSuite: varchar("test_suite", { length: 16 }),

  preconditions: text("preconditions"),
  gherkinSteps: jsonb("gherkin_steps"),
  expectedResult: text("expected_result"),
  tags: text("tags").array(),

  userRole: varchar("user_role", { length: 32 }),
  plan: varchar("plan", { length: 16 }),
  country: countryEnum("country").default("ANY"),
  state: varchar("state", { length: 8 }),

  automationStatus: automationStatusEnum("automation_status")
    .notNull()
    .default("not_automated"),

  jiraTicket: varchar("jira_ticket", { length: 32 }),
  sourceOfTruthLink: text("source_of_truth_link"),
  relatedTcs: text("related_tcs").array(),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  lastRunAt: timestamp("last_run_at", { withTimezone: true }),
  lastRunStatus: lastRunStatusEnum("last_run_status"),
});

export type TestCase = typeof testCases.$inferSelect;
export type NewTestCase = typeof testCases.$inferInsert;
