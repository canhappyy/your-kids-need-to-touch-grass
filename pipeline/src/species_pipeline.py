import os
import galah
import pandas as pd

badge_mapping = {
    # Streak Badges
    'Koala': {'badge_type': 'streak', 'target_metric': 'consecutive_days', 'target_value': '3'},
    'Green Turtle': {'badge_type': 'streak', 'target_metric': 'consecutive_days', 'target_value': '5'},
    'Saltwater Crocodile': {'badge_type': 'streak', 'target_metric': 'consecutive_days', 'target_value': '7'},
    'Red Kangaroo': {'badge_type': 'streak', 'target_metric': 'consecutive_days', 'target_value': '14'},
    
    # Weekly Variety Tag Badges
    'Sugar Glider': {'badge_type': 'variety', 'target_metric': 'variety_tag', 'target_value': 'Quiet'},
    'Tasmanian Devil': {'badge_type': 'variety', 'target_metric': 'variety_tag', 'target_value': 'Energised Activity'},
    'Dingo': {'badge_type': 'variety', 'target_metric': 'variety_tag', 'target_value': 'Exploration'},
    'Australian Hump-backed Dolphin': {'badge_type': 'variety', 'target_metric': 'variety_tag', 'target_value': 'Water Play'},
    
    # Milestone & Frequency Badges
    'Platypus': {'badge_type': 'milestone', 'target_metric': 'total_activities', 'target_value': '1'},
    'Quokka': {'badge_type': 'frequency', 'target_metric': 'daily_activities', 'target_value': '2'},
    
    # Attribute-Based Badges
    'Short-beaked Echidna': {'badge_type': 'duration', 'target_metric': 'duration_minutes', 'target_value': '15'},
    'Sulphur-crested Cockatoo': {'badge_type': 'social', 'target_metric': 'social_tag', 'target_value': 'Group/Family'},
    
    # Discovery Badges (First time completing specific tags)
    'Southern Emu-wren': {'badge_type': 'discovery', 'target_metric': 'variety_tag', 'target_value': 'Nature'},
    'Blue-winged Kookaburra': {'badge_type': 'discovery', 'target_metric': 'variety_tag', 'target_value': 'Creative'},
    'Rainbow Lorikeet': {'badge_type': 'discovery', 'target_metric': 'variety_tag', 'target_value': 'Coordination'}
}

galah.galah_config(email=os.environ["GALAH_EMAIL"])
animals = galah.atlas_species(taxa="Chordata")

if "Vernacular Name" in animals.columns:
    names_df = animals[["Vernacular Name"]].dropna().drop_duplicates()
    badge_animals = names_df[names_df['Vernacular Name'].isin(badge_mapping.keys())].copy()
    
    # Map the three new database-friendly columns
    badge_animals['badge_type'] = badge_animals['Vernacular Name'].map(lambda x: badge_mapping[x]['badge_type'])
    badge_animals['target_metric'] = badge_animals['Vernacular Name'].map(lambda x: badge_mapping[x]['target_metric'])
    badge_animals['target_value'] = badge_animals['Vernacular Name'].map(lambda x: badge_mapping[x]['target_value'])
    
    # Clean up column names for the CSV output (e.g., vernacular_name)
    badge_animals.rename(columns={'Vernacular Name': 'vernacular_name'}, inplace=True)
    
    # Ensure the directory exists before saving
    os.makedirs("pipeline/data/processed", exist_ok=True)
    badge_animals.to_csv("pipeline/data/processed/species_badge_db.csv", index=False)

else:
    print("API response error:", animals.columns.tolist())