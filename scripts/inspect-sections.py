"""List all section headers and TC counts per TS for M01."""

import os
from pathlib import Path
from collections import defaultdict

import gspread
from google.oauth2.service_account import Credentials

SHEET_NAME = "Hub - QA Test Case Masterlist"
TAB_NAME = "Hub_M01_Authentication"
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
    ws = client.open(SHEET_NAME).worksheet(TAB_NAME)

    rows = ws.get_all_values()

    section_headers = []
    tc_counts = defaultdict(int)
    f_status_counts = defaultdict(int)
    total_tcs = 0

    for i, row in enumerate(rows):
        padded = (row + [""] * 6)[:6]
        _, b, c, d, _e, f = padded
        b, c, f = b.strip(), c.strip(), f.strip()

        if not b and not c:
            continue

        if c.startswith("TC"):
            tc_counts[b] += 1
            total_tcs += 1
            f_status_counts[f or "(empty)"] += 1
        elif b.startswith("TS") and c and not c.startswith("TC"):
            section_headers.append((i, b, c))

    print(f"Total TC rows: {total_tcs}")
    print(f"\nSection headers ({len(section_headers)}):")
    for i, b, c in section_headers:
        print(f"  Row {i:3d}: {b} -> screen='{c}'")

    print(f"\nTC count per TS:")
    for ts in sorted(tc_counts):
        print(f"  {ts}: {tc_counts[ts]} TCs")

    print(f"\nAutomation Status (col F) distribution:")
    for status in sorted(f_status_counts):
        print(f"  {status}: {f_status_counts[status]}")


if __name__ == "__main__":
    main()
