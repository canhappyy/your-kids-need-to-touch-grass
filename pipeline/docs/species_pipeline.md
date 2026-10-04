# Species Badge Dataset: Wrangling & Cleaning

**Nurturing Healthy Kids, FIT5120**
Objective: Epic 6 (Activity Tracking & Rewards), User Story 6.2

## What this does

Queries the Atlas of Living Australia (ALA) for vertebrate species, matches
them against a fixed list of 9 badge animals, and tags each one with the
milestone requirement needed to unlock it (a streak length, or a variety
tag). Output: `species_badge_db.csv`, with columns `Vernacular Name, Badge
Category, Requirement`.

## How to run it

**1. Install requirements**
```bash
pip install galah pandas --break-system-packages
```

**2. Set your ALA email for this terminal session**
```powershell
$env:GALAH_EMAIL="your-email@example.com"
```
This only lasts for the current terminal window

**3. Run it**
```bash
python species_badge_pipeline.py
```

## Output

One file: `species_badge_db.csv`

| Column | Meaning |
|---|---|
| Vernacular Name | The animal's common name (e.g. "Koala") |
| Badge Category | `Streak` or `Variety Tag` — how the badge is earned |
| Requirement | For Streak badges, the number of consecutive days needed. For Variety Tag badges, the tag name that unlocks it |

## Database table

Loaded into `species_badge` via `seed.sql`. See `schema.sql` for the table
definition (`SPECIES_BADGE`, with `BADGE_CATEGORY` as its lookup table).

