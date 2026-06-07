"""Fetch TCs for M02, M05, M10, M12, M13, M15 from Gsheet.

Mirrors the parser in fetch-m01.py. Writes one JSON file per module to data/m0X.json.
No DB writes here; this is a dry-run for inspection before seeding.
"""

import json
import os
import sys
from collections import Counter
from pathlib import Path

import gspread
from google.oauth2.service_account import Credentials

SHEET_NAME = "Hub - QA Test Case Masterlist"
KEY_FILE = Path(
    os.path.expanduser(
        "~/Documents/ase-workspace/SSF/hazardco-gsheet-connect-652145f75de1.json"
    )
)
DATA_DIR = Path(__file__).resolve().parent.parent / "data"

MODULES = [
    ("M02", "Profile", "Hub_M02_Profile"),
    ("M05", "Reports", "Hub_M05_Reports"),
    ("M10", "Templates", "Hub_M10_Templates"),
    ("M12", "Company Settings", "Hub_M12_Company_Settings"),
    ("M13", "Notifications", "Hub_M13_Notifications"),
    ("M15", "Help Centre", "Hub_M15_Help_Centre"),
]


def derive_status(f: str) -> str:
    if f in ("PASSED", "FAILED", "BLOCKED"):
        return "automated"
    return "ready"


def derive_automation_status(f: str) -> str:
    if f == "PASSED":
        return "true_pass"
    if f in ("FAILED", "BLOCKED"):
        return "scripted"
    return "not_automated"


def parse_tab(ws, module: str, feature: str, sheet_url: str) -> list[dict]:
    rows = ws.get_all_values()
    current_screen = None
    records: list[dict] = []

    for row in rows:
        padded = (row + [""] * 6)[:6]
        _, b, c, d, _e, f = padded
        b, c, d, f = b.strip(), c.strip(), d.strip(), f.strip()

        if not b and not c:
            continue

        if b.startswith("TS") and c and not c.startswith("TC"):
            current_screen = c
            continue

        if b.startswith("TS") and c.startswith("TC"):
            try:
                tc_num = int(c.replace("TC", ""))
            except ValueError:
                print(f"WARN [{module}]: bad TC code '{c}' in row {row}", file=sys.stderr)
                continue

            f_norm = f if f in ("PASSED", "FAILED", "BLOCKED", "MANUAL") else None

            records.append(
                {
                    "key": f"HUB-{module}-{b}-TC{tc_num:03d}",
                    "title": d,
                    "status": derive_status(f),
                    "module": module,
                    "feature": feature,
                    "screen": current_screen,
                    "testSuite": b,
                    "automationStatus": derive_automation_status(f),
                    "lastRunStatus": f_norm,
                    "sourceOfTruthLink": sheet_url,
                }
            )

    return records


def main() -> None:
    if not KEY_FILE.exists():
        sys.exit(f"Key file not found: {KEY_FILE}")

    scopes = [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive",
    ]
    creds = Credentials.from_service_account_file(str(KEY_FILE), scopes=scopes)
    client = gspread.authorize(creds)
    sh = client.open(SHEET_NAME)
    sheet_url = sh.url

    DATA_DIR.mkdir(parents=True, exist_ok=True)

    grand_total = 0
    grand_status = Counter()
    grand_auto = Counter()
    grand_run = Counter()

    for module, feature, tab_name in MODULES:
        try:
            ws = sh.worksheet(tab_name)
        except gspread.exceptions.WorksheetNotFound:
            print(f"ERROR: tab '{tab_name}' not found in sheet", file=sys.stderr)
            continue

        records = parse_tab(ws, module, feature, sheet_url)
        out_path = DATA_DIR / f"{module.lower()}.json"
        out_path.write_text(json.dumps(records, indent=2, ensure_ascii=False))

        status_counts = Counter(r["status"] for r in records)
        auto_counts = Counter(r["automationStatus"] for r in records)
        run_counts = Counter(r["lastRunStatus"] for r in records)
        ts_counts = Counter(r["testSuite"] for r in records)

        grand_total += len(records)
        grand_status.update(status_counts)
        grand_auto.update(auto_counts)
        grand_run.update(run_counts)

        print(f"\n== {module} ({feature}) ==")
        print(f"  Wrote {len(records)} records to {out_path.relative_to(DATA_DIR.parent)}")
        print(f"  By test_suite: {dict(ts_counts)}")
        print(f"  By status: {dict(status_counts)}")
        print(f"  By automation_status: {dict(auto_counts)}")
        print(f"  By last_run_status: {dict(run_counts)}")

    print(f"\n== Grand totals across {len(MODULES)} modules ==")
    print(f"  Total records: {grand_total}")
    print(f"  By status: {dict(grand_status)}")
    print(f"  By automation_status: {dict(grand_auto)}")
    print(f"  By last_run_status: {dict(grand_run)}")


if __name__ == "__main__":
    main()
