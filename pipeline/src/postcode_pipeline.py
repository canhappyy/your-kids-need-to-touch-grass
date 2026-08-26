"""
Australian Postcodes Dataset - Wrangling & Cleaning Pipeline
Raising Healthy Kids

For full documentation: see postcode_data_pipeline.md
This file just runs the pipeline.

Source: Australian Postcodes (https://www.matthewproctor.com/australian_postcodes)

Output: postcode_location_db.csv (postcode, latitude, longitude)
"""

import pandas as pd

RAW_FILE = "australian_postcodes.csv"


# STEP 1: Load the raw file
df = pd.read_csv(RAW_FILE)
print(f"[Step 1] Loaded {len(df)} rows")


# STEP 2: Filter to Victoria only, matching the project's Melbourne scope
before = len(df)
df = df[df["state"] == "VIC"].copy()
print(f"[Step 2] Filtered to VIC: {len(df)} rows (removed {before - len(df)})")


# STEP 3: Drop rows with missing coordinates or postcode
before = len(df)
df = df.dropna(subset=["lat", "long", "postcode"])
print(f"[Step 3] Removed {before - len(df)} rows with missing data")


# STEP 3b: Remove a known bad coordinate found in the source data
# for example, Postcode 3989 ("St Helier, VIC") has a latitude of -31.8 in the raw file. 
# This does not match any real Victorian location. It is closer to southern NSW than Victoria. 
# This looks like a data entry mistake in the source file.  
before = len(df)
df = df[~((df["postcode"] == 3989) & ~df["lat"].between(-39.5, -33.5))]
print(f"[Step 3b] Removed {before - len(df)} row(s) with a known bad coordinate (postcode 3989)")

 
# STEP 4: Collapse to one row per postcode
# One postcode often covers several suburbs.
# For example, postcode 3401 covers both "Horsham" and "Rocklands". These are genuinely different places, several kilometres apart.
# If a parent searches by postcode alone, there must be exactly one answer, not several.
# When every suburb under a postcode shares the same coordinate, we just use that coordinate directly, 
# such as "Clayton, Notting Hill" for postcode 3168. 
# When suburbs genuinely differ, we use the coordinate shared by the MOST suburbs, 
# since this is usually the postcode's main town (for postcode 3401, most suburbs share Horsham's exact coordinate, so Horsham is used, 
# not a blind average that could land somewhere between Horsham and Rocklands where nothing actually is).
# The suburb names are still kept. They are joined into one list, such as "Clayton, Notting Hill" for postcode 3168.
# This way, the result can still show which areas the postcode covers.
 
def find_representative_point(group):
    coord_counts = group.groupby(["lat", "long"]).size().reset_index(name="count")
    top = coord_counts.loc[coord_counts["count"].idxmax()]
    suburb_list = ", ".join(sorted(set(name.title() for name in group["locality"])))
    return pd.Series({
        "latitude": top["lat"],
        "longitude": top["long"],
        "suburbs": suburb_list,
    })
 
postcode_db = (
    df.groupby("postcode", as_index=False)
    .apply(find_representative_point, include_groups=False)
)
print(f"[Step 4] Collapsed to {len(postcode_db)} unique postcodes")
 
 
# STEP 5: Quality checks before saving
duplicate_count = postcode_db["postcode"].duplicated().sum()
if duplicate_count > 0:
    raise ValueError(f"STOP: {duplicate_count} duplicate postcodes found")
print("[Step 5] Passed: every postcode is unique")
 
missing_counts = postcode_db.isna().sum()
if missing_counts.sum() > 0:
    raise ValueError(f"STOP: missing values found:\n{missing_counts}")
print("[Step 5] Passed: no missing values")
 
blank_suburbs = (postcode_db["suburbs"].str.strip() == "").sum()
if blank_suburbs > 0:
    raise ValueError(f"STOP: {blank_suburbs} postcodes have a blank suburb list")
print("[Step 5] Passed: every postcode has at least one suburb name")
 
lat_ok = postcode_db["latitude"].between(-39.5, -33.5).all()
lon_ok = postcode_db["longitude"].between(140.5, 150.5).all()
if not (lat_ok and lon_ok):
    raise ValueError("STOP: some coordinates fall outside Victoria")
print("[Step 5] Passed: all coordinates inside Victoria")
 

# STEP 6: Save output file
postcode_db.to_csv("postcode_location_db.csv", index=False)
print(f"\n[Step 6] Saved postcode_location_db.csv - {len(postcode_db)} rows")
