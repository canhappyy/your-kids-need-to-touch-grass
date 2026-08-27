# Open Space Dataset: Wrangling & Cleaning

**Raising Healthy Kids, FIT5120**
Objective: Epic 1 (Recommendation Engine), Epic 2 (Play Preferences), Epic 3 (Content Library)

## What this does

Cleans the Victorian Government's Open Space dataset into a simple,
ready-to-use file: `open_space_location_db.csv`, with columns
`open_space_id, name, latitude, longitude, category`.

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

One file: `open_space_location_db.csv`

| Column | Meaning |
|---|---|
| open_space_id | The Victorian Planning Authority's own identifier for this record (originally called VPA_ID). Renamed so it is clear which dataset this ID belongs to once other datasets are added. |
| name | Place name (or a clean generated name like "Active Sport Facility - Bayside" if the government data had no name) |
| latitude | GPS latitude |
| longitude | GPS longitude |
| category | One of: playground, wetland, bushland, nature, park, trail, active_sport |


## Data quality checks

Before saving, the pipeline checks several things. If any check fails, the
script stops instead of saving a bad file.

- No missing values in any required column
- No exact duplicate rows
- open_space_id (checked as VPA_ID) is unique, so no two different real places were accidentally combined
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

Note: the "Activity type" column is a proposed mapping. It is based on
what each space physically offers, and has not yet been confirmed with
the Epic 3 (Content Library).

## Key decisions made

**Coordinate bounds are sourced, not guessed.**
The check for "is this inside Victoria" uses real extreme points, not
an arbitrary range. Source: Victorian Year Book 1884 (Victorian
Government), which records Victoria's actual extremities: Wilsons
Promontory at 39.13S (south), the Murray River border at 34.03S
(north), the South Australian border at 140.97E (west), and Cape
Howe at 149.98E (east). A small buffer is added on each side for
safety, since this is a sanity check, not an exact boundary line.

**VPA_ID is used for tracing records, not FID.**
The raw data has two ID-like fields. FID turned out to be a simple
row counter (1, 2, 3, 4, and so on), most likely created automatically
when the file was exported. This is not stable. If the government
re-exports the dataset with rows added, removed, or reordered, FID
values would shift, even for the exact same real park. VPA_ID does
not follow this pattern and is more likely to be the government's
own persistent identifier for each record, so it was used instead.

**Renamed to open_space_id in the final output.**
VPA_ID is kept in the output, not removed, since the schema and ERD
work need a stable reference back to each record. It is renamed to
open_space_id in the last step, so it is clear which dataset this ID
belongs to once other datasets are added, such as Sports & Rec
Facilities and Playgrounds.

**Category comes from the government's OS_CATEGOR field, not OS_CATEG_2.**
The raw data has two category-like fields. They are not a clean parent-child
pair. The same word (for example, "Parks and gardens") can appear in
both fields for unrelated reasons. OS_CATEG_2 is only used to override
the main decision in two specific, tested cases: trail identification,
and the Green Buffer/Median Park size rule below. Everywhere else, it
is ignored.

**Some categories were wrong on the first attempt. They were found by spot-checking real place names, not just trusting labels.**
- "Civic squares and promenades" was silently being excluded by default.
  This would have wrongly dropped real, well-known places like Southbank
  Promenade and Yarra Promenade. Fixed by explicitly mapping this category
  to `trail`.
- "Median park" (a government subcategory) turned out to mix genuine
  small parks with narrow, unsafe road-median strips. A blanket
  include/exclude rule based on the label alone was not reliable enough.
  Fixed by using a minimum size (0.1 hectare) as the deciding factor
  instead.
- A handful of places are literally named "Roundabout". These are
  traffic islands, unsafe regardless of size or category. Added an
  explicit name-based safety exclusion that overrides every other rule.
- About 5,600 records had a blank, "NO DATA", "N/A", or single-letter
  junk name in the raw data. Left as is, grouping same-named places
  together (to merge split land parcels) would have wrongly merged all
  of these junk-named records into one fake giant "park". Fixed in two
  steps: first, each record is given a temporary unique internal name
  so the merge step works correctly. After merging, this is replaced
  with a clean, ready-to-use name based on its category and council
  area, such as "Active Sport Facility - Bayside". A number is added
  only when needed to keep repeated names unique, such as "Active
  Sport Facility - Cardinia (2)". This means the output is ready to
  show a user directly, without needing further cleanup. The number
  follows the record's VPA_ID, lowest first, so the order always
  follows the same clear rule instead of being unexplained.

## Limitations

- The 0.1ha size rule is a reasonable estimate. It is not a perfect
  test of whether a green buffer or median strip is a real destination.
- Only 3 name keywords (Playground, Wetland, Bushland) are used to find
  these specific types. Other playgrounds without that word in the name
  are labelled as "park" instead, since the raw government data has no
  dedicated playground field.
- This only cleans Open Space. It has not yet been combined with the
  team's Playgrounds or Sports & Rec Facilities datasets. Those have a
  different "grain" (points vs. polygons) and need their own cleaning
  pass before a combined Location DB can be built.
- If the government updates the source file, this script can be
  re-run to produce a fresh output. There is no automatic trigger yet.
  A future iteration could add a scheduled check or a file-change alert.

