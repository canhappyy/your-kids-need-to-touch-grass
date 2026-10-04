import os
import galah
import pandas as pd

badge_mapping = {
    'Koala': {'Category': 'Streak', 'Requirement': '3'},
    'Green Turtle': {'Category': 'Streak', 'Requirement': '5'},
    'Saltwater Crocodile': {'Category': 'Streak', 'Requirement': '7'},
    'Red Kangaroo': {'Category': 'Streak', 'Requirement': '14'}
}

galah.galah_config(email=os.environ["GALAH_EMAIL"])
animals = galah.atlas_species(taxa="Chordata")

if "Vernacular Name" in animals.columns:
    names_df = animals[["Vernacular Name"]].dropna().drop_duplicates()
    badge_animals = names_df[names_df['Vernacular Name'].isin(badge_mapping.keys())].copy()
    
    badge_animals['Badge Category'] = badge_animals['Vernacular Name'].map(lambda x: badge_mapping[x]['Category'])
    badge_animals['Requirement'] = badge_animals['Vernacular Name'].map(lambda x: badge_mapping[x]['Requirement'])
    
    # Ensure the directory exists before saving
    os.makedirs("pipeline/data/processed", exist_ok=True)
    badge_animals.to_csv("pipeline/data/processed/species_badge_db.csv", index=False)

else:
    print("API response error:", animals.columns.tolist())