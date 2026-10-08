# Species Badge Dataset: Wrangling & Cleaning

**Nurturing Healthy Kids, FIT5120**
Objective: Epic 6 (Activity Tracking & Rewards)

## What this does

Queries the Atlas of Living Australia (ALA) for vertebrate species, verifies that the configured badge animals exist, and writes the deterministic database-ready badge definitions used by the rewards system. Output: `species_badge_db.csv`.

### Badge Mechanics & Selected Species

**1. Streak Badges**
Awarded for daily consistency. Unlocked when a user logs at least one activity for a specific number of consecutive days. These animals were chosen to match existing frontend UI icons:

* **3 Days:** Koala
* **5 Days:** Green Turtle
* **7 Days:** Saltwater Crocodile
* **14 Days:** Red Kangaroo

**2. Activity and milestone badges**
Awarded for completing the configured activity, social, duration, frequency, or total-activity requirement:

* **First Activity:** Platypus
* **15 Minutes Or Less:** Short-beaked Echidna
* **Nature:** Southern Emu-wren
* **Creative:** Blue-winged Kookaburra
* **Group/Family:** Sulphur-crested Cockatoo
* **Quiet:** Sugar Glider
* **Exploration:** Dingo
* **Energised Activity:** Tasmanian Devil
* **Water Play:** Australian Hump-backed Dolphin
* **Two In One Day:** Quokka
* **Coordination:** Rainbow Lorikeet

The CSV also stores the rule type, field, operator, value, earned and locked SVG filenames, and progression metadata. `unlock_priority` controls which eligible badge is released next; `unlock_tier` groups the progression into starter, intermediate, and advanced stages. The first two priorities are the starter badges.

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
| Badge Category | The UI category for the badge |
| Requirement | Human-readable unlock requirement |
| badge_id | Stable identifier used by the application |
| rule_type | Reward rule evaluated by the frontend |
| rule_field | Activity field used by the rule, when applicable |
| rule_operator | Comparison operator such as `gte`, `lte`, `equals`, or `contains` |
| rule_value | Value passed to the reward rule |
| description | Text shown when the badge is locked or earned |
| image_earned / image_locked | SVG filenames in the public badge assets directory |
| unlock_priority | Deterministic order for controlled badge progression |
| unlock_tier | Progression group for the badge |

## Database table

Loaded into `species_badge` via `seed.sql`. See `schema.sql` for the table
definition (`SPECIES_BADGE`, with `BADGE_CATEGORY` as its lookup table).