CREATE TYPE "public"."automation_status" AS ENUM('not_automated', 'in_progress', 'scripted', 'true_pass');--> statement-breakpoint
CREATE TYPE "public"."country" AS ENUM('NZ', 'AU', 'UK', 'ANY');--> statement-breakpoint
CREATE TYPE "public"."last_run_status" AS ENUM('PASSED', 'FAILED', 'BLOCKED', 'MANUAL');--> statement-breakpoint
CREATE TYPE "public"."tc_status" AS ENUM('draft', 'ready', 'automated', 'deprecated');--> statement-breakpoint
CREATE TABLE "test_cases" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(48) NOT NULL,
	"title" text NOT NULL,
	"status" "tc_status" DEFAULT 'draft' NOT NULL,
	"module" varchar(8) NOT NULL,
	"feature" varchar(64),
	"screen" varchar(64),
	"test_suite" varchar(16),
	"preconditions" text,
	"gherkin_steps" jsonb,
	"expected_result" text,
	"tags" text[],
	"user_role" varchar(32),
	"plan" varchar(16),
	"country" "country" DEFAULT 'ANY',
	"state" varchar(8),
	"automation_status" "automation_status" DEFAULT 'not_automated' NOT NULL,
	"jira_ticket" varchar(32),
	"source_of_truth_link" text,
	"related_tcs" text[],
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_run_at" timestamp with time zone,
	"last_run_status" "last_run_status",
	CONSTRAINT "test_cases_key_unique" UNIQUE("key")
);
