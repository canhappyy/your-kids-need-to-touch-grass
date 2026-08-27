# Database

This folder sets up the PostgreSQL database 
## Files

| File | What it does |
|---|---|
| `schema.sql` | Drops and recreates every table. Also seeds the small fixed lookup values (location categories, tags, etc.) that never change. |
| `seed.sql` | Loads the data — postcodes, open spaces, activities, and activity-category links — from the processed CSVs. |

## Requirements

- PostgreSQL running, with a database created and ready to connect to
- `psql` installed (used to run both files)
- These CSV files in the **same folder** you run `psql` from:
  - `postcode_location_db.csv`
  - `open_space_location_db.csv`
  - `activities_db.csv`
  - `Activity_LocationCategory.csv`

## How to run

Run in this order

```bash
psql -d your_database_name -f schema.sql
psql -d your_database_name -f seed.sql
```


## Notes

- `seed.sql` uses `\copy`, a `psql`-only command — it must be run through `psql`, not through a generic SQL tool or linter.
- A few tables (`open_space`, `activity`) get loaded via small temporary staging tables in `seed.sql`, used to reshape a couple of CSV columns (e.g. splitting `activities_db.csv`'s pipe-separated `variety_tags` into individual rows) before they land in their final tables. These staging tables are dropped automatically once loading is done.