import os
import galah
import pandas as pd

badge_mapping = {
    'Sugar Glider': {'Category': 'Streak', 'Requirement': '3'},
    'Bare-nosed Wombat': {'Category': 'Streak', 'Requirement': '7'},
    'Laughing Kookaburra': {'Category': 'Streak', 'Requirement': '10'},
    'Emu': {'Category': 'Streak', 'Requirement': '20'},
    'Red Kangaroo': {'Category': 'Streak', 'Requirement': '50'},
    'Koala': {'Category': 'Variety Tag', 'Requirement': 'Quiet'},
    'Tasmanian Devil': {'Category': 'Variety Tag', 'Requirement': 'Energised Activity'},
    'Dingo': {'Category': 'Variety Tag', 'Requirement': 'Exploration'},
    'Australian Hump-backed Dolphin': {'Category': 'Variety Tag', 'Requirement': 'Water Play'}
}

galah.galah_config(email=os.environ["GALAH_EMAIL"])
animals = galah.atlas_species(taxa="Chordata")

if "Vernacular Name" in animals.columns:
    names_df = animals[["Vernacular Name"]].dropna().drop_duplicates()
    badge_animals = names_df[names_df['Vernacular Name'].isin(badge_mapping.keys())].copy()
    
    badge_animals['Badge Category'] = badge_animals['Vernacular Name'].map(lambda x: badge_mapping[x]['Category'])
    badge_animals['Requirement'] = badge_animals['Vernacular Name'].map(lambda x: badge_mapping[x]['Requirement'])
    badge_animals.to_csv("pipeline/data/processed/species_badge_db.csv", index=False)

else:
    print("API response error:", animals.columns.tolist())