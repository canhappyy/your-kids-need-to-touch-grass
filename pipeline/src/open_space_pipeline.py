"""
Open Space Dataset - Wrangling & Cleaning Pipeline
Raising Healthy Kids
 
For full documentation, category meanings, and design decisions, see open_space_data_pipeline.md
 
Source: Victorian Government Open Space dataset (https://discover.data.vic.gov.au/dataset/open-space)
 
Output: open_space_location_db.csv (open_space_id, name, latitude, longitude, category)
"""
 
import geopandas as gpd
import pandas as pd
import numpy as np
import re
 
RAW_FILE = "open_space.geojson"
MIN_AREA_HA = 0.1  # size rule for green buffer / median park, see doc
 
# Victoria's real border, plus a small buffer for safety. See doc for source.
VIC_LAT_MIN, VIC_LAT_MAX = -39.2, -33.9
VIC_LON_MIN, VIC_LON_MAX = 140.9, 150.0
 
 
# STEP 1: Load raw file and check it looks correct
gdf = gpd.read_file(RAW_FILE)
print(f"[Step 1] Loaded {len(gdf)} rows. Coordinate system: {gdf.crs}")
 
required_raw_columns = ["VPA_ID", "PARK_NAME", "OS_CATEGOR", "OS_CATEG_2", "OS_TYPE", "OS_ACCESS", "LGA", "HA"]
missing_cols = [c for c in required_raw_columns if c not in gdf.columns]
if missing_cols:
    raise ValueError(f"STOP: raw file is missing expected columns: {missing_cols}")
 
 
# STEP 2: Convert each shape to a single lat/lon point for location
gdf["centroid"] = gdf.geometry.centroid
centroids_wgs84 = gpd.GeoSeries(gdf["centroid"], crs=gdf.crs).to_crs(epsg=4326)
gdf["longitude"] = centroids_wgs84.x
gdf["latitude"] = centroids_wgs84.y
print(f"[Step 2] Converted shapes to lat/lon points")
 
 
# STEP 3: Remove categories that are not play spaces
NOT_PLAY_SPACE = [
    "Government schools", "Non-government schools", "Tertiary institutions",
    "Cemeteries", "Public housing reserves", "Services and utilities reserves",
]
is_not_play_space = gdf["OS_CATEGOR"].isin(NOT_PLAY_SPACE)
print(f"[Step 3] {is_not_play_space.sum()} records are not play spaces")
 
 
# STEP 4: Exclude unsafe-by-name records (overrides every other rule)
names = gdf["PARK_NAME"].astype(str)
is_unsafe_name = names.str.contains("Roundabout|Traffic Island|Median Strip", case=False, na=False)
print(f"[Step 4] {is_unsafe_name.sum()} records excluded for safety")
 
 
# STEP 5: Find specific types by name keyword
is_playground = names.str.contains("Playground", case=False, na=False)
is_wetland = names.str.contains("Wetland", case=False, na=False)
is_bushland = names.str.contains("Bushland", case=False, na=False)
print(f"[Step 5] Found by name: {is_playground.sum()} playgrounds, "
      f"{is_wetland.sum()} wetlands, {is_bushland.sum()} bushland areas")
 
 
# STEP 6: Find trail records by subcategory (link type)
# Only trusted for Recreation corridor / Civic squares and promenades. See doc for why.
TRAIL_SUBCATEGORIES = ["Regional link", "Metropolitan link", "Local link", "Neighbourhood link"]
TRAIL_SAFE_MAIN_CATEGORIES = ["Recreation corridor", "Civic squares and promenades"]
is_trail_subcat = (
    gdf["OS_CATEG_2"].isin(TRAIL_SUBCATEGORIES)
    & gdf["OS_CATEGOR"].isin(TRAIL_SAFE_MAIN_CATEGORIES)
)
print(f"[Step 6] Identified {is_trail_subcat.sum()} trail records "
      f"(only for Recreation corridor / Civic squares and promenades)")
 
 
# STEP 7: Decide ambiguous subcategories by size with HA threshold
SIZE_UNCLEAR_SUBCATEGORIES = ["Green buffer", "Median park"]
is_size_unclear = gdf["OS_CATEG_2"].isin(SIZE_UNCLEAR_SUBCATEGORIES)
is_big_enough = gdf["HA"] >= MIN_AREA_HA
print(f"[Step 7] Of {is_size_unclear.sum()} size-unclear records, "
      f"{(is_size_unclear & is_big_enough).sum()} are big enough to keep")
 
 
# STEP 7b: Split "Civic squares and promenades" by name. See doc for why.
is_civic_square = gdf["OS_CATEGOR"] == "Civic squares and promenades"
is_civic_promenade = is_civic_square & names.str.contains("Promenade|Walk", case=False, na=False)
is_civic_park_like = (
    is_civic_square
    & names.str.contains("Park|Reserve", case=False, na=False)
    & ~is_civic_promenade
)
print(f"[Step 7b] Of {is_civic_square.sum()} civic squares/promenades records: "
      f"{is_civic_promenade.sum()} are walkable promenades, "
      f"{is_civic_park_like.sum()} are named park/reserve, "
      f"the rest (plazas, forecourts, civic centres) are excluded")
 
 
# STEP 8: Assign final category (order matters - first match wins)
conditions = [
    is_not_play_space,
    is_unsafe_name,
    is_playground,
    is_wetland,
    is_bushland,
    is_trail_subcat,
    is_size_unclear & is_big_enough,
    is_size_unclear & ~is_big_enough,
    is_civic_promenade,
    is_civic_park_like,
    is_civic_square,  # anything left in this category: plaza, forecourt, jetty, etc.
    gdf["OS_CATEGOR"].isin(["Natural and semi-natural open space", "Conservation reserves"]),
    gdf["OS_CATEGOR"].isin(["Parks and gardens", "Recreation corridor"]),
    gdf["OS_CATEGOR"] == "Sportsfields and organised recreation",
]
choices = [
    "EXCLUDE", "EXCLUDE", "playground", "wetland", "bushland",
    "trail", "trail", "EXCLUDE", "trail", "park", "EXCLUDE", "nature", "park", "active_sport",
]
gdf["category"] = np.select(conditions, choices, default="EXCLUDE")
print(f"[Step 8] Category assigned to every record")
 
 
# STEP 9: Keep only genuinely public, open-access places
before_access_check = (gdf["category"] != "EXCLUDE").sum()
gdf.loc[
    (gdf["OS_TYPE"] != "Public open space") | (gdf["OS_ACCESS"] != "Open"),
    "category"
] = "EXCLUDE"
after_access_check = (gdf["category"] != "EXCLUDE").sum()
print(f"[Step 9] Removed {before_access_check - after_access_check} more records (private/restricted)")
 
gdf = gdf[gdf["category"] != "EXCLUDE"].copy()
print(f"[Step 9] {len(gdf)} records remain")
 
 
# STEP 9a: Fix names with broken encoding, e.g. "Childrenâ€™s Centre"
# should be "Children's Centre". Re-encode as cp1252, decode as UTF-8.
# If a name is not broken this way, it fails and stays unchanged.
def fix_mojibake(name):
    if not isinstance(name, str):
        return name
    try:
        return name.encode("cp1252").decode("utf-8")
    except (UnicodeDecodeError, UnicodeEncodeError):
        return name
 
names_before_fix = gdf["PARK_NAME"].astype(str)
gdf["PARK_NAME"] = names_before_fix.apply(fix_mojibake)
was_actually_repaired = names_before_fix.apply(lambda x: isinstance(x, str)) & (names_before_fix != gdf["PARK_NAME"])
print(f"[Step 9a] Repaired {was_actually_repaired.sum()} names with broken characters")
 
 
# STEP 9b: Fix ALL-CAPS names to Title Case. 
# some places appear twice, once in caps and once normal (e.g. "RUFFEY LAKE PARK" vs "Ruffey Lake Park"), 
# so Step 11a's merge missed them as duplicates.
def fix_caps_name(name):
    # Protect short all-caps codes in brackets, e.g. "(MMCLP)" - these are
    # council abbreviations, not real words, and should not become "(Mmclp)".
    codes = re.findall(r"\([A-Z]{2,6}\)", name)
    protected = name
    for i, code in enumerate(codes):
        protected = protected.replace(code, f"@@{i}@@", 1)
 
    result = protected.title()
 
    # Fix "'S" -> "'s" (title() wrongly capitalises a single letter after an apostrophe, e.g. a name ending in "'s"). 
    result = re.sub(r"'([A-Za-z])\b", lambda m: "'" + m.group(1).lower(), result)
 
    # Lowercase small connector words, unless they start the name -
    # matches the council's own style (example: "Sports and Aquatic Complex").
    connectors = {"and", "of", "the", "on", "in", "at", "to", "for", "from"}
    words = result.split(" ")
    words = [w if i == 0 or w.lower() not in connectors else w.lower() for i, w in enumerate(words)]
    result = " ".join(words)
 
    for i, code in enumerate(codes):
        result = result.replace(f"@@{i}@@", code)
    return result
 
names_stripped = gdf["PARK_NAME"].astype(str).str.strip()
has_letter = names_stripped.str.contains("[A-Za-z]", regex=True)
is_all_caps = has_letter & (names_stripped == names_stripped.str.upper()) & (names_stripped != names_stripped.str.lower())
gdf.loc[is_all_caps, "PARK_NAME"] = names_stripped[is_all_caps].apply(fix_caps_name)
print(f"[Step 9b] Fixed {is_all_caps.sum()} ALL-CAPS names to Title Case")
 
 
# STEP 10: Fix blank/junk placeholder names before merging. See doc for the plan-number trick.
gdf["PARK_NAME"] = gdf["PARK_NAME"].astype(str).str.strip()
known_junk_words = ["", "NAN", "NO DATA", "N/A"]
is_junk_word = gdf["PARK_NAME"].str.upper().isin(known_junk_words)
is_too_short = gdf["PARK_NAME"].str.len() <= 2
is_unnamed = is_junk_word | is_too_short
 
# VM_PARCEL_ stores "LOT\PLAN". Same plan + LGA + category = likely one real place split across land titles. 
# Group these before the placeholder step below.
parcel_str = gdf["VM_PARCEL_"].astype(str)
plan = parcel_str.str.split("\\").str[-1].str.strip()
has_valid_plan = (
    gdf["VM_PARCEL_"].notna()
    & (parcel_str.str.upper() != "NO DATA")
    & parcel_str.str.contains("\\\\", regex=True)
    & (plan != "")
)
gdf["_plan_group_key"] = np.where(
    has_valid_plan,
    gdf["category"] + "_" + gdf["LGA"].astype(str) + "_" + plan,
    "",  # no usable plan number -> not grouped
)
plan_group_sizes = gdf.loc[is_unnamed, "_plan_group_key"].value_counts()
is_real_plan_group = is_unnamed & has_valid_plan & gdf["_plan_group_key"].map(plan_group_sizes).fillna(0).gt(1)
 
# Temporary internal name only, so Step 11 merges correctly. Step 11b replaces it.
is_unique_placeholder = is_unnamed & ~is_real_plan_group
gdf.loc[is_unique_placeholder, "PARK_NAME"] = (
    "UNNAMED_TEMP_" + gdf.loc[is_unique_placeholder, "category"] + "_"
    + gdf.loc[is_unique_placeholder, "LGA"] + "_" + gdf.loc[is_unique_placeholder, "VPA_ID"].astype(str)
)
gdf.loc[is_real_plan_group, "PARK_NAME"] = (
    "UNNAMED_TEMP_" + gdf.loc[is_real_plan_group, "category"] + "_"
    + gdf.loc[is_real_plan_group, "LGA"] + "_PLAN_" + plan[is_real_plan_group]
)
print(f"[Step 10] Flagged {is_unnamed.sum()} unnamed/junk-named records for renaming "
      f"({is_real_plan_group.sum()} of these grouped as split parcels of the same place by land title plan)")
 
 
# STEP 11a: Merge split land parcels into one row per real place
before_merge = len(gdf)
 
def merge_parcels(group):
    # Location: HA-weighted average of every parcel's centroid. See doc for why
    # this is better than just using the largest parcel's point.
    total_ha = group["HA"].sum()
    if total_ha > 0:
        weighted_lat = (group["latitude"] * group["HA"]).sum() / total_ha
        weighted_lon = (group["longitude"] * group["HA"]).sum() / total_ha
    else:
        weighted_lat = group["latitude"].mean()
        weighted_lon = group["longitude"].mean()
    largest = group.loc[group["HA"].idxmax()]
    return pd.Series({
        "latitude": weighted_lat,
        "longitude": weighted_lon,
        "VPA_ID": largest["VPA_ID"],
        "HA": total_ha,  # kept for the Step 11c size check
    })
 
merged = (
    gdf.groupby(["PARK_NAME", "LGA", "category"], as_index=False)
    .apply(merge_parcels, include_groups=False)
)
merged = merged.reset_index(drop=True)
merged = merged.rename(columns={"PARK_NAME": "name"})
merged = merged.sort_values("VPA_ID").reset_index(drop=True)  # stable row order, lowest ID first
print(f"[Step 11] Merged {before_merge} parcels into {len(merged)} real places")
 
 
# STEP 11b: Turn temporary placeholders into clean, ready-to-use names.
# Repeats are allowed on purpose (no "(2)", "(3)" counter) - see doc for why.
CATEGORY_DISPLAY_NAME = {
    "playground": "Playground",
    "wetland": "Wetland",
    "bushland": "Bushland Area",
    "nature": "Nature Reserve",
    "park": "Park",
    "trail": "Walking Trail",
    "active_sport": "Active Sport Facility",
}
 
is_temp_placeholder = merged["name"].str.startswith("UNNAMED_TEMP_")
merged.loc[is_temp_placeholder, "name"] = (
    merged.loc[is_temp_placeholder, "category"].map(CATEGORY_DISPLAY_NAME)
    + " - " + merged.loc[is_temp_placeholder, "LGA"].str.title()
)
print(f"[Step 11b] Gave {is_temp_placeholder.sum()} previously-unnamed records a clean name (no suffix)")
 
 
# STEP 11c: Remove places too small to be playable, using the final combined HA. See doc for thresholds.
before_size_filter = len(merged)
 
is_tiny_park = (merged["category"] == "park") & (merged["HA"] < 0.01)
is_tiny_active_sport = (merged["category"] == "active_sport") & (merged["HA"] < 0.01)
is_tiny_nature = (merged["category"] == "nature") & (merged["HA"] <= 0.001)
merged = merged[~(is_tiny_park | is_tiny_active_sport | is_tiny_nature)].copy()
 
print(f"[Step 11c] Removed {is_tiny_park.sum()} tiny parks, "
      f"{is_tiny_active_sport.sum()} tiny active_sport records, "
      f"{is_tiny_nature.sum()} tiny nature records")
print(f"[Step 11c] {before_size_filter - len(merged)} records removed, {len(merged)} remain")
 
 
# STEP 12: Quality checks before saving
duplicate_vpa_id_count = merged["VPA_ID"].duplicated().sum()
if duplicate_vpa_id_count > 0:
    raise ValueError(f"STOP: {duplicate_vpa_id_count} duplicate VPA_ID values found, "
                      f"each place should have a unique VPA_ID")
print("[Step 12] Passed: every VPA_ID is unique")
 
final_columns = ["VPA_ID", "name", "latitude", "longitude", "category"]
output = merged[final_columns].copy()
 
missing_counts = output.isna().sum()
if missing_counts.sum() > 0:
    raise ValueError(f"STOP: missing values found:\n{missing_counts}")
print("[Step 12] Passed: no missing values")
 
duplicate_count = output.duplicated().sum()
if duplicate_count > 0:
    raise ValueError(f"STOP: {duplicate_count} exact duplicate rows found")
print("[Step 12] Passed: no duplicate rows")
 
lat_ok = output["latitude"].between(VIC_LAT_MIN, VIC_LAT_MAX).all()
lon_ok = output["longitude"].between(VIC_LON_MIN, VIC_LON_MAX).all()
if not (lat_ok and lon_ok):
    raise ValueError("STOP: some coordinates fall outside Victoria")
print("[Step 12] Passed: all coordinates inside Victoria")
 
allowed_categories = {"playground", "wetland", "bushland", "nature", "park", "trail", "active_sport"}
bad_categories = set(output["category"].unique()) - allowed_categories
if bad_categories:
    raise ValueError(f"STOP: unexpected category values: {bad_categories}")
print("[Step 12] Passed: all categories are valid")
 
output = output.rename(columns={"VPA_ID": "open_space_id"})
 
 
# STEP 13: Save output file
output.to_csv("open_space_location_db.csv", index=False)
print(f"\n[Step 13] Saved open_space_location_db.csv - {len(output)} rows")
print(output["category"].value_counts())
 