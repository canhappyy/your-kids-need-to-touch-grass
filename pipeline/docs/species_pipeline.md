# Species Badge Dataset: Wrangling & Cleaning

**Nurturing Healthy Kids, FIT5120**
Objective: Epic 6 (Activity Tracking & Rewards)

## What this does

Queries the Atlas of Living Australia (ALA) for vertebrate species, matches them against a fixed list of badge animals, and maps each to the specific app milestone needed to unlock it. Output: `species_badge_db.csv`, with columns `Vernacular Name, Badge Category, Requirement`.

### Badge Mechanics & Selected Species

**1. Streak Badges**
Awarded for daily consistency. Unlocked when a user logs at least one activity for a specific number of consecutive days. These animals were chosen to match existing frontend UI icons:

* **3 Days:** Koala
* **5 Days:** Green Turtle
* **7 Days:** Saltwater Crocodile
* **14 Days:** Red Kangaroo


## Possible option if we have time
**2. Variety Tag Badges**
Awarded for themed engagement. Unlocked when a user completes four activities sharing the exact same `variety_tag` within a single week. These animals were chosen to reflect the nature of the specific activity type:
* **Quiet:** Sugar Glider *(Note: Swapped from Koala as it is now used for Streaks)*
* **Energised Activity:** Tasmanian Devil
* **Exploration:** Dingo
* **Water Play:** Australian Hump-backed Dolphin


## How to run it

**1. Install requirements**

```bash
pip install galah pandas --break-system-packages

```

**2. Set your ALA email for this terminal session**

```powershell
$env:GALAH_EMAIL="your-email@example.com"

```

*(Note: This only lasts for the current terminal window)*

**3. Run it**

```bash
python pipeline/src/species_pipeline.py

```

## Output

One file saved to: `pipeline/data/processed/species_badge_db.csv`

| Column | Meaning |
| --- | --- |
| Vernacular Name | The animal's common name (e.g. "Green Turtle") |
| Badge Category | `Streak` or `Variety Tag` — the mechanic used to earn the badge |
| Requirement | The target needed: either the number of consecutive days (Streak) or the specific activity tag (Variety Tag) |

## Database table

Loaded into `species_badge` via `seed.sql`. See `schema.sql` for the table
definition (`SPECIES_BADGE`, with `BADGE_CATEGORY` as its lookup table).