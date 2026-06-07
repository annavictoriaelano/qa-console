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

const MODULES = ["M02", "M05", "M10", "M12", "M13", "M15"] as const;

async function main() {
  let totalInserted = 0;
  let totalSkipped = 0;

  for (const module of MODULES) {
    const jsonPath = resolve(__dirname, "..", "data", `${module.toLowerCase()}.json`);
    const records: NewTestCase[] = JSON.parse(readFileSync(jsonPath, "utf-8"));

    console.log(`\n== ${module} ==`);
    console.log(`Loaded ${records.length} records from ${jsonPath}`);

    const existing = await db
      .select({ key: testCases.key })
      .from(testCases)
      .where(eq(testCases.module, module));

    if (existing.length > 0) {
      console.log(
        `SKIP: ${existing.length} ${module} rows already in DB. Re-seed manually with: DELETE FROM test_cases WHERE module = '${module}';`
      );
      totalSkipped += records.length;
      continue;
    }

    const inserted = await db.insert(testCases).values(records).returning({
      id: testCases.id,
      key: testCases.key,
    });

    console.log(`Inserted ${inserted.length} rows.`);
    console.log(`  First key: ${inserted[0].key}`);
    console.log(`  Last key:  ${inserted[inserted.length - 1].key}`);
    totalInserted += inserted.length;
  }

  console.log(`\n== Summary ==`);
  console.log(`Inserted: ${totalInserted}`);
  console.log(`Skipped (already present): ${totalSkipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
