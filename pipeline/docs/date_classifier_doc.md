# Date Classifier

## What it does

`check_date.py` looks at one date (today, Melbourne time, if no date is given) and says what kind of day it is, plus a label to show on screen:

- **public_holiday** — a VIC public holiday. Label = the real holiday name (e.g. "Melbourne Cup Day").
- **school_holiday** — not a holiday, but outside every school term. Label = "School Holiday" (the dataset has no per-day name for this, so we just say what it is).
- **neither** — a normal school-term day. No label.

Scope: **VIC (Melbourne) only.** The app's data scope is Melbourne, so we use the Victorian Government dataset, not an Australia-wide feed.
Also returns a label to show on screen:
    public_holiday -> the real holiday name (e.g. "Melbourne Cup")
    school_holiday -> the fixed text "School Holiday" (the dataset has no
                       per-day name for this, so we just say what it is)
    neither         -> no label (just a normal day)

## Data Source

- **API:** `https://discover.data.vic.gov.au/api/3/action/datastore_search` (no key needed)
- **Resource ID:** `caaa47de-8626-46a6-aa28-3d948c15c5d9`
- **Filter by `dateType`:** `PUBLIC_HOLIDAY` or `SCHOOL_TERM`
- **Fields we checked are real:** `_id, arun, dateType, name, important_date, publisher, description, source`
- There is no `year` field. So we cannot ask the API for "just 2026" — we get all rows and check the year ourselves. The dataset is small, so this is fine.

## Bug Found and Fixed

The website has a bug. The `important_date` field should be D/M/Y (day first), but the server reads it as M/D/Y (month first). So, when day and month are **both** 12 or less, it quietly swaps them.

**Example:** the real date is 5 November. But the API sends back `2019-05-11`, which means 11 May. Wrong.

We checked this against real holidays: Melbourne Cup Day, Queen's Birthday, and Labour Day all came back wrong. Only dates where day is above 12 (so there is no mix-up possible) came back correct.

**Fix:** if day is 12 or less, swap day and month back. See `fix_swapped_date()` below.

## Known Data Limits

Checked live on 2026-10-04:

- 143 public holiday rows
- 102 school term rows
- The API's own default is only 100 rows per request. That is not enough — we would lose 2 school term rows if we used the default. So we ask for more rows ourselves (500, safely more than we need), and keep asking for the next page until a reply has fewer rows than we asked for.
- Some school term rows are missing a Start or End date. We skip these quietly — we do not use them, and we do not show an error.

## Test Cases

| Input date | Expected result | Why |
|---|---|---|
| 2026-11-03 | public_holiday ("Melbourne Cup") | Melbourne Cup Day |
| 2026-10-04 | school_holiday ("School Holiday") | One day before Term 4 starts (Term 4 2026 starts 5 Oct) |
| 2026-10-05 | neither | First day of Term 4 |
| 2026-12-25 | public_holiday ("Christmas Day") | A holiday always wins, even if it is also outside term |

Checked live, run from the actual script:
(base) PS C:\Downloads> python3 check_date.py 2026-02-10
2026-11-03 -> public_holiday (Melbourne Cup)
(base) PS C:\Downloads> python3 check_date.py 2026-10-04
2026-10-04 -> school_holiday (School Holiday)
(base) PS C:\Downloads> python3 check_date.py 2026-10-05
2026-10-05 -> neither
(base) PS C:\Downloads> python3 check_date.py 2026-12-25
2026-12-25 -> public_holiday (Christmas Day)

## Core Logic

These two functions are the important part. Everything else in the script is just code to fetch the raw data from the website.

```python
def fix_swapped_date(timestamp_str):
    # Fix the day/month bug described above.
    dt = datetime.fromisoformat(timestamp_str)
    y, m, d = dt.year, dt.month, dt.day
    if d <= 12:
        m, d = d, m
    return date(y, m, d)

def classify(d, holidays, terms):
    # holidays: a dict of {date: holiday name}.
    # terms: a list of (start date, end date) pairs.
    if d in holidays:
        return "public_holiday", holidays[d]
    for start, end in terms:
        if start <= d <= end:
            return "neither", None
    return "school_holiday", "School Holiday"
```

Full working script (get data + fix the bug + decide the answer, already tested live) is attached on its own: `check_date.py`.
