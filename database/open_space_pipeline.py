"""
Open Space Dataset - Wrangling & Cleaning Pipeline
Raising Healthy Kids
 
For full documentation, category meanings, and design decisions, see open_space_data_pipeline.md
 
Source: Victorian Government Open Space dataset (https://discover.data.vic.gov.au/dataset/open-space)
 
Output: open_space_location_db.csv (name, latitude, longitude, category)
"""
 
import geopandas as gpd
import pandas as pd
import numpy as np
 
RAW_FILE = "open_space.geojson"  
MIN_AREA_HA = 0.1  # size rule for green buffer/median strip testing 
 
# Victoria's real extent, with a small buffer added for safety.
# Source: Victorian Year Book 1884 (Victorian Government), which
# states the actual extreme points: Wilsons Promontory at 39.13S
# (south), the Murray River border at 34.03S (north), the South
# Australian border at 140.97E (west), and Cape Howe at 149.98E
# (east). A small buffer is added on each side, since this is a
# sanity check, not an exact boundary line.
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
 
 
# STEP 6: Identify trail-type records regardless of main category
TRAIL_SUBCATEGORIES = ["Regional link", "Metropolitan link", "Local link", "Neighbourhood link"]
is_trail_subcat = gdf["OS_CATEG_2"].isin(TRAIL_SUBCATEGORIES)
print(f"[Step 6] Identified {is_trail_subcat.sum()} trail records")
 
 
# STEP 7: Decide ambiguous subcategories by size with HA threshold
SIZE_UNCLEAR_SUBCATEGORIES = ["Green buffer", "Median park"]
is_size_unclear = gdf["OS_CATEG_2"].isin(SIZE_UNCLEAR_SUBCATEGORIES)
is_big_enough = gdf["HA"] >= MIN_AREA_HA
print(f"[Step 7] Of {is_size_unclear.sum()} size-unclear records, "
      f"{(is_size_unclear & is_big_enough).sum()} are big enough to keep")
 
 
# STEP 8: Assign final category (order matters)
conditions = [
    is_not_play_space,
    is_unsafe_name,
    is_playground,
    is_wetland,
    is_bushland,
    is_trail_subcat,
    is_size_unclear & is_big_enough,
    is_size_unclear & ~is_big_enough,
    gdf["OS_CATEGOR"] == "Civic squares and promenades",
    gdf["OS_CATEGOR"].isin(["Natural and semi-natural open space", "Conservation reserves"]),
    gdf["OS_CATEGOR"].isin(["Parks and gardens", "Recreation corridor"]),
    gdf["OS_CATEGOR"] == "Sportsfields and organised recreation",
]
choices = [
    "EXCLUDE", "EXCLUDE", "playground", "wetland", "bushland",
    "trail", "trail", "EXCLUDE", "trail", "nature", "park", "active_sport",
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
 
 
# STEP 10: Fix blank/junk placeholder names before merging
gdf["PARK_NAME"] = gdf["PARK_NAME"].astype(str).str.strip()
known_junk_words = ["", "NAN", "NO DATA", "N/A"]
is_junk_word = gdf["PARK_NAME"].str.upper().isin(known_junk_words)
is_too_short = gdf["PARK_NAME"].str.len() <= 2
is_unnamed = is_junk_word | is_too_short
 
# This placeholder is only used to keep the merge step (Step 11) safe - NOT the final name that gets saved. 
# Without a unique value here, two different unnamed parks in the same LGA and category would look identical to Step 11 
# and get wrongly merged into one fake place.
# Step 11b below replaces this with a clean, presentable name.
gdf.loc[is_unnamed, "PARK_NAME"] = (
    "UNNAMED_TEMP_" + gdf.loc[is_unnamed, "category"] + "_"
    + gdf.loc[is_unnamed, "LGA"] + "_" + gdf.loc[is_unnamed, "VPA_ID"].astype(str)
)
print(f"[Step 10] Flagged {is_unnamed.sum()} unnamed/junk-named records for renaming")
 
 
# STEP 11a: Merge split land parcels into one row per real place
before_merge = len(gdf)
 
def merge_parcels(group):
    largest = group.loc[group["HA"].idxmax()]
    return pd.Series({
        "latitude": largest["latitude"],
        "longitude": largest["longitude"],
        "VPA_ID": largest["VPA_ID"],
    })
 
merged = (
    gdf.groupby(["PARK_NAME", "LGA", "category"], as_index=False)
    .apply(merge_parcels, include_groups=False)
)
merged = merged.reset_index(drop=True)
merged = merged.rename(columns={"PARK_NAME": "name"})
print(f"[Step 11] Merged {before_merge} parcels into {len(merged)} real places")
 
 
# STEP 11b: Turn temporary placeholders into clean, ready-to-use names
# The output should be ready to show a parent directly, without needing another cleanup step later. 
# A category like "active_sport" is turned into readable text, combined with the LGA 
# (for example, "Active Sport Facility - Bayside"). 
# If more than one clean name would repeat within the same LGA and category, a number is added to keep each one unique
# (for example, "Active Sport Facility - Bayside (2)").
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

# Note: 
# Add a "(2)", "(3)", and so on suffix only where the same clean name would otherwise repeat, so every row still has a unique name.
# Sorted by VPA_ID first, so the numbering always follows the same
# clear rule (lowest original government ID gets no number, then 2, 3, and so on) instead of an unexplained order.
merged = merged.sort_values("VPA_ID").reset_index(drop=True)
duplicate_rank = merged.groupby("name").cumcount() + 1
needs_suffix = merged.duplicated(subset="name", keep=False) & (duplicate_rank > 1)
merged.loc[needs_suffix, "name"] = (
    merged.loc[needs_suffix, "name"] + " (" + duplicate_rank[needs_suffix].astype(str) + ")"
)
print(f"[Step 11b] Gave {is_temp_placeholder.sum()} previously-unnamed records "
      f"a clean, ready-to-use name")
 
 

# STEP 12: Quality checks before saving
# VPA_ID is checked here for uniqueness (an internal safeguard), then
# dropped from the saved file - the final output only needs the 4
# columns the team agreed on: name, latitude, longitude, category.
duplicate_vpa_id_count = merged["VPA_ID"].duplicated().sum()
if duplicate_vpa_id_count > 0:
    raise ValueError(f"STOP: {duplicate_vpa_id_count} duplicate VPA_ID values found, "
                      f"each place should have a unique VPA_ID")
print("[Step 12] Passed: every VPA_ID is unique (checked, not saved to output)")
 
final_columns = ["name", "latitude", "longitude", "category"]
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
 
 
# STEP 13: Save output file
output.to_csv("open_space_location_db.csv", index=False)
print(f"\n[Step 13] Saved open_space_location_db.csv - {len(output)} rows")
print(output["category"].value_counts())
 