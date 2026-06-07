"""Peek at non-M01 module tabs to check parser compatibility with fetch-m01.py.

For each Hub_M0X_* tab (excluding M01), print:
- Total non-empty rows
- Counts of TC rows / section headers / unrecognised rows using the M01 parser logic
- TS distribution + F (automation status) distribution
- First 8 non-empty rows so we can eyeball layout
"""

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


def main() -> None:
    scopes = [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive",
    ]
    creds = Credentials.from_service_account_file(str(KEY_FILE), scopes=scopes)
    client = gspread.authorize(creds)
    sh = client.open(SHEET_NAME)

    tabs = [
        w.title
        for w in sh.worksheets()
        if w.title.startswith("Hub_M") and w.title != "Hub_M01_Authentication"
    ]

    for tab in tabs:
        ws = sh.worksheet(tab)
        rows = ws.get_all_values()
        non_empty = [r for r in rows if any(c.strip() for c in r)]

        tc_rows = 0
        section_headers = []
        unrecognised = 0
        ts_counts = Counter()
        f_status_counts = Counter()

        for row in non_empty:
            padded = (row + [""] * 6)[:6]
            _, b, c, _d, _e, f = padded
            b, c, f = b.strip(), c.strip(), f.strip()

            if not b and not c:
                continue
            if b.startswith("TS") and c.startswith("TC"):
                tc_rows += 1
                ts_counts[b] += 1
                f_status_counts[f or "(empty)"] += 1
            elif b.startswith("TS") and c and not c.startswith("TC"):
                section_headers.append((b, c))
            else:
                unrecognised += 1

        print(f"\n=== {tab} ===")
        print(f"  Non-empty rows: {len(non_empty)}")
        print(f"  TC rows: {tc_rows}")
        print(f"  Section headers: {len(section_headers)}  {section_headers[:10]}")
        print(f"  Unrecognised rows: {unrecognised}")
        print(f"  TS distribution: {dict(ts_counts)}")
        print(f"  F (automation status) distribution: {dict(f_status_counts)}")
        print(f"  First 8 non-empty rows (cols A-F):")
        for i, row in enumerate(non_empty[:8]):
            padded = (row + [""] * 6)[:6]
            print(f"    [{i}] {padded}")


if __name__ == "__main__":
    main()
