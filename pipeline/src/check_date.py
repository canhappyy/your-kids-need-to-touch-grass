"""
Call the Victorian Government Important Dates API live, and classify a date
(default: today, in Melbourne time) as one of:

    public_holiday  -- it's a VIC public holiday
    school_holiday  -- not a public holiday, but falls outside every school term
    neither         -- a normal school-term day

Scope: VIC (Melbourne) only. This app's data scope is Melbourne, so the VIC
Government dataset is the right source -- no need for an Australia-wide feed.

Also returns a label to show on screen:
    public_holiday -> the real holiday name (e.g. "Melbourne Cup")
    school_holiday -> the fixed text "School Holiday" (the dataset has no
                       per-day name for this, so we just say what it is)
    neither         -> no label (just a normal day)

No API key required.

Usage:
    pip install requests
    python check_date.py                  # checks today (Melbourne time)
    python check_date.py 2026-11-03        # checks a specific date

Important Date BUG Workaround:
The live API's `important_date` field is typed as a timestamp server-side,
and whatever converts it assumes M/D/Y even though the source data is D/M/Y.
Whenever BOTH the day and month are <= 12, it silently swaps them (e.g. the
source "5/11/2019" -- 5 November -- comes back as "2019-05-11", 11 May).
Verified against the real dataset: Melbourne Cup Day, Queen's Birthday and
Labour Day all came back wrong; only dates where the day is >12 (unambiguous)
came back correct. fix_swapped_date() below undoes this.
"""
import sys
from datetime import date, datetime
from zoneinfo import ZoneInfo

import requests

API_URL = "https://discover.data.vic.gov.au/api/3/action/datastore_search"
RESOURCE_ID = "caaa47de-8626-46a6-aa28-3d948c15c5d9"
MELBOURNE = ZoneInfo("Australia/Melbourne")

# Get all rows of one type from the government website.
# Example: date_type = "PUBLIC_HOLIDAY" or "SCHOOL_TERM".
# We must set our own limit as the website's default is only 100 rows, which is NOT enough (there are 143 public holiday rows).
# We ask for 500 each time, then ask again for the next page, until a reply comes back with fewer rows than we asked for.
def fetch_all(date_type: str) -> list[dict]:
    records = []
    offset = 0
    limit = 500
    while True:
        resp = requests.get(API_URL, params={
            "resource_id": RESOURCE_ID,
            "filters": f'{{"dateType":"{date_type}"}}',
            "limit": limit,
            "offset": offset,
        }, timeout=15)
        resp.raise_for_status()
        payload = resp.json()
        if not payload.get("success"):
            raise RuntimeError(f"API returned success=false: {payload}")
        batch = payload["result"]["records"]
        records.extend(batch)
        if len(batch) < limit:
            break
        offset += limit
    return records


def fix_swapped_date(timestamp_str: str) -> date:
    # Note: The website has a bug. It sometimes mixes up day and month.
    # Example: it should say "5 November" but it sends "11 May" instead.
    # This function checks and fixes that, so we get the correct date.
    dt = datetime.fromisoformat(timestamp_str)
    y, m, d = dt.year, dt.month, dt.day
    if d <= 12:
        # Note: if day is 12 or less, we cannot be sure as it could be swapped. So we swap it back, to be safe.
        m, d = d, m
    return date(y, m, d)


# Make a dict of every public holiday date -> its real name.
# Example: {date(2026, 11, 3): "Melbourne Cup"}
# A dict works like a set (fast to check "is this date inside?"), but also keeps the name, which the calendar screen needs to show.
def build_holiday_set() -> dict[date, str]:
    records = fetch_all("PUBLIC_HOLIDAY")
    return {
        fix_swapped_date(r["important_date"]): r["name"].strip()
        for r in records
    }

# Make a list of school terms. Each term is one pair: (start date, end date). 
# Example: Term 1 2026 = (27 Jan, 2 Apr).
# we must read the name ("Term 1 2026 - Start") and match Start with End for the same term and year.
def build_term_ranges() -> list[tuple[date, date]]:
    import re
    from collections import defaultdict

    records = fetch_all("SCHOOL_TERM")
    pairs = defaultdict(dict)
    pattern = re.compile(r"Term\s+(\d)\s+(\d{4}).*?-\s*(Start|End)", re.IGNORECASE)
    for r in records:
        m = pattern.search(r["name"])
        if not m:
            continue
        term, year, which = int(m.group(1)), int(m.group(2)), m.group(3).lower()
        pairs[(year, term)][which] = fix_swapped_date(r["important_date"])

    ranges = []
    for (year, term), d in pairs.items():
        if "start" in d and "end" in d:
            ranges.append((d["start"], d["end"]))
        # Note: if a term is missing Start or End, we just skip it quietly.
    return ranges


# Decide what kind of day "d" is, and what label to show for it.
# Returns a pair: (status, label).
#   status is always one of: public_holiday / school_holiday / neither
#   label is the text to show on screen, or None if there is nothing to show
# Check holiday first, because a public holiday can fall inside a school term (e.g. Melbourne Cup), and holiday should win in that case.
def classify(d: date, holidays: dict[date, str], terms: list[tuple[date, date]]) -> tuple[str, str | None]:
    if d in holidays:
        return "public_holiday", holidays[d]
    for start, end in terms:
        if start <= d <= end:
            return "neither", None  # Note: normal day, inside a school term
    # Note: not a holiday, and before the first term start or after the last term end, so we just label as a school holiday.
    return "school_holiday", "School Holiday"


def main():
    # Note: Read the date from the command line (if given), otherwise use today's date in Melbourne.
    if len(sys.argv) > 1:
        target = date.fromisoformat(sys.argv[1])
    else:
        target = datetime.now(MELBOURNE).date()

    holidays = build_holiday_set()
    terms = build_term_ranges()

    status, label = classify(target, holidays, terms)
    if label:
        print(f"{target.isoformat()} -> {status} ({label})")
    else:
        print(f"{target.isoformat()} -> {status}")


if __name__ == "__main__":
    main()
