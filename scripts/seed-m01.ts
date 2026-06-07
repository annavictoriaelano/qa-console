import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { testCases, type NewTestCase } from "../src/db/schema";

const sql = neon(process.env.DIRECT_URL!);
const db = drizzle(sql);

async function main() {
  const jsonPath = resolve(__dirname, "..", "data", "m01.json");
  const records: NewTestCase[] = JSON.parse(readFileSync(jsonPath, "utf-8"));

  console.log(`Loaded ${records.length} records from ${jsonPath}`);

  const existing = await db
    .select({ key: testCases.key })
    .from(testCases)
    .where(eq(testCases.module, "M01"));

  if (existing.length > 0) {
    console.log(
      `WARN: ${existing.length} M01 rows already in DB. Aborting to avoid duplicates.`
    );
    console.log(
      "If you want to re-seed: DELETE FROM test_cases WHERE module = 'M01'; then re-run."
    );
    process.exit(1);
  }

  console.log("Inserting...");
  const inserted = await db.insert(testCases).values(records).returning({
    id: testCases.id,
    key: testCases.key,
  });

  console.log(`Inserted ${inserted.length} rows.`);
  console.log(`First key: ${inserted[0].key}`);
  console.log(`Last key:  ${inserted[inserted.length - 1].key}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
