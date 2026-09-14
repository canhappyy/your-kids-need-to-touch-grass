# Open Space Dataset: Wrangling & Cleaning

**Raising Healthy Kids, FIT5120**
Objective: Epic 1 (Recommendation Engine), Epic 2 (Play Preferences), Epic 3 (Content Library)

## What this does

Cleans the Victorian Government's Open Space dataset into a simple,
ready-to-use file: `open_space_location_db.csv`.

## How to run it

**1. Install requirements**
```bash
pip install geopandas shapely pyproj pandas --break-system-packages
```
If `pip install geopandas` fails on Windows, use `conda install -c conda-forge geopandas` instead. It handles the GDAL dependency more reliably.

**2. Get the raw data**
Download the Open Space GeoJSON from:
https://discover.data.vic.gov.au/dataset/open-space

**3. Set up your folder**
Put the script and the downloaded `.geojson` file in the same folder.
Update the `RAW_FILE` variable at the top of the script to match your
file's exact name.

**4. Run it**
```bash
python open_space_pipeline.py
```
The script prints its progress at every step. It stops with a clear
error message if any quality check fails.

## Output

One file: `open_space_location_db.csv`, with 5 columns.

| Column | Meaning |
|---|---|
| open_space_id | The government's own VPA_ID for this place. Kept in the output so a record can be traced back to the source data if needed. |
| name | Place name (or a clean generated name like "Active Sport Facility - Bayside" if the government data had no name) |
| latitude | GPS latitude |
| longitude | GPS longitude |
| category | One of: playground, wetland, bushland, nature, park, trail, active_sport |

## Data quality checks

Before saving, the pipeline checks these things. 
If any check fails, the script stops instead of saving a bad file.

- No missing values in any required column
- No exact duplicate rows
- Every open_space_id (the government's VPA_ID) is unique
- All coordinates fall inside Victoria's real range
- Every category is one of the 7 expected values

## Category meanings

| Category | What it means | Example | Activity type it supports |
|---|---|---|---|
| playground | Has real play equipment for young kids | Allambee Park playground | Structured play, such as swings, climbing, and equipment-based missions |
| wetland | Water-based nature area | Alphington Park Wetland | Nature observation, such as spotting a bird or a frog, or a water-themed scavenger hunt |
| bushland | Land-based native nature area | Adam St Rye bushland | Nature exploration, such as leaf or stick collecting, or nature craft material gathering |
| nature | General natural/semi-natural space | Alexander Reserve | General outdoor exploration, open-ended nature missions |
| park | General maintained green space | Ackland Park | Free/unstructured play, such as running, ball games, or general "go outside" missions |
| trail | A walking/cycling route, not a fixed destination | Southbank Promenade | Movement-based missions, such as walking, scooting, or biking a set distance, or counting landmarks along the way |
| active_sport | Organised sport space | A G Gillion Oval | Structured sport, such as ball games, running drills, or sport-specific missions |

Note: the "Activity type" column is a proposed mapping. It is based on what each space physically offers.

## Key decisions made

**VPA_ID is used for tracing records, not FID.**
The raw data has two ID-like fields. FID turned out to be a simple row counter (1, 2, 3, 4, and so on), 
most likely created automatically when the file was exported. This is not stable. 
If the government re-exports the dataset with rows added, removed, or reordered, FID values would shift, even for the exact same real park. 
VPA_ID does not follow this pattern and is more likely to be the government's own persistent identifier for each record, 
so it was used instead, and is kept in the output as `open_space_id`.

**Category mostly comes from OS_CATEGOR, not OS_CATEG_2.**
But this rule is now scoped, not absolute. The raw data has two category-like fields. 
They are not a clean parent-child pair. The same word can appear in both fields for unrelated reasons. 
OS_CATEG_2 (the subcategory) is only allowed to override the main category in specific, tested cases:
- **Trail links** ("Regional link", "Metropolitan link", "Local link", "Neighbourhood link"). 
  This only applies when the main category is "Recreation corridor" or "Civic squares and promenades". 
  These two categories are linear/walkway features by definition, so the override makes sense there. 
  For other main categories (Parks and gardens, Natural/semi-natural, Conservation reserves, Sportsfields),
  checking real sizes showed a problem: a "link" tag does not reliably mean a small path. 
  Some very large, named reserves also carry this tag. 
  Example: Eastfield Park, 25.9 ha, tagged as a "Regional link" under Sportsfields. 
  Letting the subcategory win here would mislabel real facilities as walking trails. 
  So for these four categories, the main category decides instead.
- **Green buffer / Median park sizing** - see below.

Everywhere else, OS_CATEG_2 is ignored.

**Some categories needed fixing. Found by spot-checking real place names, not just trusting labels.**

- **"Civic squares and promenades" mixes two very different kinds of place. It is now split by name.** 
  This category was first fixed by mapping the whole thing to `trail`. 
  That fix was needed because the category was being silently dropped, which would have excluded
  real, well-known walkways like Southbank Promenade. 
  But checking the actual list showed a problem: most of this category is not walkable or playable space. 
  It is mostly paved civic plazas, shopping centre forecourts, and cathedral surrounds. 
  Examples: Federation Square, Queensbridge Square, St Pauls Cathedral, Boronia Shopping Centre forecourt. 
  These places are built for gathering or shopping, not for a kid to walk, scoot, or play in. 
  The fix now splits by name, the same way playgrounds, wetlands, and bushland are found by keyword:
  - Name contains "Promenade" or "Walk" -> `trail` (a real walkway)
  - Name contains "Park" or "Reserve" (and not already a promenade) -> `park`
  - Everything else in this category -> excluded
  One known gap: a real park like "Birrarung Marr" has neither keyword in its name, 
  so it is still excluded by this rule. There is no reliable way to catch a name like this without listing it by hand. 
  It was left excluded, to keep the rule consistent.

- **"Median park" (a government subcategory) mixes genuine small parks with narrow, unsafe road-median strips.** 
  A blanket include/exclude rule based on the label alone was not reliable enough. 
  Fixed by using a minimum size (0.1 hectare) as the deciding factor instead.

- **A handful of places are literally named "Roundabout".** 
  These are traffic islands, unsafe regardless of size or category. 
  Added an explicit name-based safety exclusion that overrides every other rule.

**Names with broken characters or ALL-CAPS spelling are cleaned up before merging.**
Two small text problems in the raw names turned out to affect real merging, not just how the name looks:
- Some names have a character that was inproper. 
  Example: "Gwendoline Family & Children**â€™**s Centre" should be "Children**'**s Centre". 
  Re-encoding the text as cp1252, then decoding it as UTF-8, reverses this specific mistake.
  Only 1 real place in the whole dataset was affected.
- About 1,400 names are written in ALL CAPS. These are converted to Title Case. 
  This is not just cosmetic. The merge step (below) groups records by their exact name text. 
  So "KISMET CREEK RESERVE" and "Kismet Creek Reserve" were treated as two different places. 
  They never merged, even though they are the same real reserve, in the same council area and category. 
  Fixing the casing lets them merge correctly.

**Merging groups by name AND council area AND category together, not just name.**
This means the same real place can correctly appear more than once in the output. 
This happens if it offers more than one type of activity.
Example: Ruffey Lake Park (Manningham) appears as one `park` row (the general green space), 
and a separate `active_sport` row (a sports facility within the same park). 
This is by design, not a bug. 
A parent should be able to find either the park or the sports facility as its own destination.

**Unnamed or junk-named records (about 5,600 of them) need care.**
This matters both when merging records and when naming them.

Grouping same-named places together helps merge split land parcels into one place. 
But if we group all blank names together, that would wrongly merge unrelated unnamed places into one fake giant place.
This is handled in two steps:

1. Each unnamed record first gets a temporary, internal-only name.
   This lets the merge step (which groups by name) work safely. 
   Most unnamed records get a name unique to that one record. 
   This stops them being wrongly merged with an unrelated unnamed place in the same council area. 
   But some unnamed records are actually the same real place, just split across multiple land titles. 
   The raw `VM_PARCEL_` field stores "LOT\PLAN" (example: "34\LP6222").
   Records that share the same PLAN, council area, and category almost certainly came from splitting one original block of land.
   Example: Boroondara, plan LP6222, four separate "parks and gardens" parcels that are really one 0.39 ha park. 
   These records get a shared temporary name instead, so they merge into one row.
2. After merging, the temporary name is replaced with a clean, final name. 
   The name is based on category and council area (example: "Active Sport Facility - Bayside"). 
   Different unnamed places in the same council area and category can end up with the exact same final name. 
   Example: several separate "Walking Trail - Maroondah" records at different coordinates. 
   No "(2)", "(3)" counter is added to force the names apart. This was tried before and removed. 
   The number never carried real meaning. In the worst real case, it would have reached "(429)" for one group. 
   `open_space_id` and location already make every record identifiable. The name does not need to do that job too.

**When several land parcels merge into one place, the location is an area-weighted average.**
It is not just the biggest parcel's point. 
Using only the largest parcel's centre point can put the map pin off to one side of the real place. 
Example: Olympic Park's biggest single piece sits at one end of a much larger precinct. 
Weighting every parcel's centre point by its own size keeps the pin closer to the true centre of the whole merged shape.

**Very small records are removed, but only when checking showed they are data mistakes, not real small places.**
The size limits below came from checking real borderline records, not from a formula. 
The depth of checking was different for each category: 
park and nature were checked against the record's name and its position in the size distribution; 
active_sport was checked against an actual map, place by place, 
since a size cutoff alone was shown to be unreliable there.
- **trail, bushland, wetland, playground: no size limit.** 
  A trail's small size comes from its shape (long and thin), not from being too small. 
  Small wetland, bushland, and playground spots are normal and real. 
  Example: playgrounds as small as 0.003 ha exist and are real.
- **park: removed if under 0.01 ha (100 sqm).** 
  Below this size, records look like leftover slivers, not places a child could play in.
- **active_sport: removed if under 0.01 ha.** 
  All borderline cases near this line were checked by hand on a map. 
  Mirabooka Reserve (0.0155 ha) and Thomas Carroll Reserve (0.0130 ha) are real, so they were kept. 
  Olympic Park's two smallest pieces (0.0079 ha and 0.0054 ha) were checked 
  and found to not be real destinations on their own, so they were removed.
- **nature: removed if at or under 0.001 ha (10 sqm).** 
  This only catches clear data mistakes that still have a generic, never-named placeholder label. 
  Example: "Nature Reserve - Yarra Ranges" at 0.0001 ha. Small but real NAMED reserves just above this line are kept. 
  Example: "Plenty River Reserve" at 0.0014 ha. Nature reserves do not need to be big enough for play, unlike a park.

## Limitations

- The 0.1ha size rule for Green buffer/Median park is a reasonable estimate, 
  not a perfect test of whether the place is a real destination.
- Name keywords are used to find playgrounds, wetlands, bushland, and (inside Civic squares and promenades) 
  promenades and park-like places. A real place of one of these types may not use that word in its name. 
  If so, it falls back to a broader category instead.
- Only land parcels that share an exact name, or an exact land title plan number, get merged into one place. 
  A real place split across differently-worded names is not caught. 
  Example: "Olympic Park" and "Olympic Park - part" stay as two separate records, 
  since nothing in the data proves they are the same place beyond their location.
  Merging by location alone was considered, and rejected. 
  Real examples showed unrelated places can sit close together. 
  Some Maroondah trail segments over 2km apart still count as each other's "nearest" record. 
  So distance alone is not reliable proof.
- If the government updates the source file, this script can be
  re-run to produce a fresh output. There is no automatic trigger yet.
  A future iteration could add a scheduled check or a file-change alert.
- The minimum-size limits (see Key decisions above) came from checking a sample of real borderline records by hand
  a map lookup for active_sport, name and size patterns for park and nature. 
  If the government re-exports the dataset with different records near these limits, 
  it is worth spot-checking a few again. Don't assume the same cutoffs still hold.
