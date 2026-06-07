"""Fetch M01 TCs from Gsheet, transform per agreed mapping, write to data/m01.json."""

import json
import os
import sys
from pathlib import Path

import gspread
from google.oauth2.service_account import Credentials

SHEET_NAME = "Hub - QA Test Case Masterlist"
TAB_NAME = "Hub_M01_Authentication"
MODULE = "M01"
FEATURE = "Authentication"
KEY_FILE = Path(
    os.path.expanduser(
        "~/Documents/ase-workspace/SSF/hazardco-gsheet-connect-652145f75de1.json"
    )
)

OUTPUT = Path(__file__).resolve().parent.parent / "data" / "m01.json"


def derive_status(f: str) -> str:
    """status enum: draft | ready | automated | deprecated."""
    if f in ("PASSED", "FAILED", "BLOCKED"):
        return "automated"
    return "ready"


def derive_automation_status(f: str) -> str:
    """automation_status enum: not_automated | in_progress | scripted | true_pass."""
    if f == "PASSED":
        return "true_pass"
    if f in ("FAILED", "BLOCKED"):
        return "scripted"
    return "not_automated"


def main() -> None:
    scopes = [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive",
    ]
    creds = Credentials.from_service_account_file(str(KEY_FILE), scopes=scopes)
    client = gspread.authorize(creds)
    sh = client.open(SHEET_NAME)
    ws = sh.worksheet(TAB_NAME)

    rows = ws.get_all_values()
    sheet_url = sh.url

    current_screen = None
    records = []

    for row in rows:
        padded = (row + [""] * 6)[:6]
        _, b, c, d, _e, f = padded
        b, c, d, f = b.strip(), c.strip(), d.strip(), f.strip()

        if not b and not c:
            continue

        # Section header: B=TSnn, C=screen name (not TCnn)
        if b.startswith("TS") and c and not c.startswith("TC"):
            current_screen = c
            continue

        # TC row: B=TSnn, C=TCnn
        if b.startswith("TS") and c.startswith("TC"):
            try:
                tc_num = int(c.replace("TC", ""))
            except ValueError:
                print(f"WARN: bad TC code '{c}' in row {row}", file=sys.stderr)
                continue

            f_norm = f if f in ("PASSED", "FAILED", "BLOCKED", "MANUAL") else None

            record = {
                "key": f"HUB-{MODULE}-{b}-TC{tc_num:03d}",
                "title": d,
                "status": derive_status(f),
                "module": MODULE,
                "feature": FEATURE,
                "screen": current_screen,
                "testSuite": b,
                "automationStatus": derive_automation_status(f),
                "lastRunStatus": f_norm,
                "sourceOfTruthLink": sheet_url,
            }
            records.append(record)

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(records, indent=2, ensure_ascii=False))

    print(f"Wrote {len(records)} records to {OUTPUT}")

    # Summary
    from collections import Counter
    status_counts = Counter(r["status"] for r in records)
    auto_counts = Counter(r["automationStatus"] for r in records)
    run_counts = Counter(r["lastRunStatus"] for r in records)
    ts_counts = Counter(r["testSuite"] for r in records)

    print(f"\nBy test_suite: {dict(ts_counts)}")
    print(f"By status: {dict(status_counts)}")
    print(f"By automation_status: {dict(auto_counts)}")
    print(f"By last_run_status: {dict(run_counts)}")


if __name__ == "__main__":
    main()
