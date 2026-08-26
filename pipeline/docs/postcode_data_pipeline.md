# Australian Postcodes Dataset: Wrangling & Cleaning

**Raising Healthy Kids, FIT5120**
Objective: Epic 2 (Play Preferences), User Story 2.2. This dataset
turns a parent's typed postcode into a location the Recommendation
Engine can use, when GPS is unavailable or declined.

## What this does

Cleans the Australian Postcodes dataset (Matthew Proctor) into a
simple, ready-to-use file: `postcode_location_db.csv`, with columns
`postcode, latitude, longitude, surburbs`.

## How to run it

**1. Install requirements**
```bash
pip install pandas --break-system-packages
```

**2. Get the raw data**
Download the CSV from:
https://www.matthewproctor.com/australian_postcodes

**3. Set up your folder**
Put the script and the downloaded CSV in the same folder. Update the
`RAW_FILE` variable at the top of the script if your file has a
different name.

**4. Run it**
```bash
python postcode_pipeline.py
```

## Output

One file: `postcode_location_db.csv`

| Column | Meaning |
|---|---|
| postcode | A 4-digit Victorian postcode. Always unique, exactly one row per postcode. |
| latitude | GPS latitude, representing the postcode as a whole |
| longitude | GPS longitude, representing the postcode as a whole |
| suburbs | A comma-separated list of every suburb sharing this postcode, for example "Clayton, Notting Hill". Useful for showing the user which area a postcode covers. |

## Data quality checks

Before saving, the pipeline checks four things. If any check fails,
the script stops instead of saving a bad file.

- No missing values in any required column
- Every postcode is unique
- Every postcode has at least one suburb name listed
- All coordinates fall inside Victoria's real range

## Key decisions made

**Coordinate bounds are sourced, not guessed.**
The check for "is this inside Victoria" uses real extreme points, not
an arbitrary range. Source: Victorian Year Book 1884 (Victorian
Government), which records Victoria's actual extremities: Wilsons
Promontory at 39.13S (south), the Murray River border at 34.03S
(north), the South Australian border at 140.97E (west), and Cape
Howe at 149.98E (east). A small buffer is added on each side for
safety, since this is a sanity check, not an exact boundary line.

**Filtered to Victoria only.**
The raw file covers all of Australia (18,559 rows). Since this
project's scope is metropolitan Melbourne, only the 3,539 VIC rows
are kept. This also matches how the team's other location datasets
(Open Space, Sports & Rec Facilities) were scoped.

**One row per postcode, not one row per suburb.**
A single postcode often covers many suburbs. For example, postcode
3401 covers both "Horsham" and "Rocklands." These are genuinely
different places, several kilometres apart. Checked directly in the
VIC data: out of 750 postcodes, 522 cover more than one suburb. Of
those, 131 have suburbs with genuinely different coordinates, not the
same point repeated.

If a parent searches by postcode alone, per Epic 2's design, there
must be exactly one answer. The fix: when every suburb sharing a
postcode has the same coordinate, that coordinate is used directly.
When suburbs genuinely differ, the coordinate shared by the most
suburbs is used instead, since this is usually the postcode's main
town. For example, postcode 3401 has 47 suburbs, but most of them
share the exact coordinate of "Horsham," the main town. That
coordinate is used for the whole postcode, rather than an average of
all 47 points, which could land somewhere between Horsham and a
smaller, distant suburb like Rocklands, where nothing actually is.
The suburb names are still kept, combined into one list, so the
result can show the user which areas the postcode covers (for
example, "Clayton, Notting Hill" for postcode 3168) without breaking
the "exactly one answer" rule.

For the 131 postcodes where suburbs genuinely differ, this still
means smaller suburbs (like Rocklands) resolve to their postcode's
main town's coordinate, not their own. This is a known trade-off for
keeping postcode search simple and always giving one answer.

**Removed one known bad coordinate, found by the pipeline's own check.**
Postcode 3989 ("St Helier, VIC") has a latitude of -31.8 in the raw
file. This does not match any real Victorian location. It is closer
to southern NSW than Victoria. This looks like a data entry mistake in
the source file. It was found because the Step 5 quality check
failed, then confirmed by checking the specific record, not by
loosening the check to let it through.

## Limitations

- For the 131 postcodes where suburbs genuinely differ, the postcode's
  coordinate is set to whichever suburb is shared by the most other
  suburbs, not necessarily the exact suburb the parent lives in. A
  parent searching postcode 3401 always gets Horsham's coordinate,
  even if they actually live in Rocklands. This is accepted for now,
  since Epic 2's design only needs a postcode-to-location lookup, not
  suburb-level precision. A future iteration could revisit this if the
  app ever needs to confirm a parent's exact suburb.
- If the government or Matthew Proctor updates the source file, this
  script can be re-run to produce a fresh output. There is no
  automatic trigger yet.
- Only one bad coordinate was found and fixed. If the source file is
  updated, a new spot check should be done rather than assuming no
  other errors exist.
