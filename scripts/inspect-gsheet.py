"""Inspect Hub_M01_Authentication tab structure before designing import."""

import json
import os
import sys
from pathlib import Path

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
    if not KEY_FILE.exists():
        sys.exit(f"Key file not found: {KEY_FILE}")

    scopes = [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive",
    ]
    creds = Credentials.from_service_account_file(str(KEY_FILE), scopes=scopes)
    client = gspread.authorize(creds)

    sh = client.open(SHEET_NAME)

    print(f"== Sheet: {sh.title} ==")
    print(f"  ID: {sh.id}")
    print(f"  URL: {sh.url}")
    print(f"  Worksheets ({len(sh.worksheets())}):")
    for w in sh.worksheets():
        print(f"    - {w.title}  ({w.row_count} rows x {w.col_count} cols)")

    ws = sh.worksheet(TAB_NAME)
    print(f"\n== Tab: {TAB_NAME} ==")
    print(f"  Rows: {ws.row_count}, Cols: {ws.col_count}")

    all_values = ws.get_all_values()
    print(f"  Non-empty rows (incl. headers): {len(all_values)}")
    print(f"  First 10 rows (raw):")
    for i, row in enumerate(all_values[:10]):
        print(f"    [{i}] {row}")


if __name__ == "__main__":
    main()
