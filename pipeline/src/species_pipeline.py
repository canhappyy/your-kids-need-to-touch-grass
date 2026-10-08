"""Build the database-ready species badge dataset."""

from __future__ import annotations

import os
from pathlib import Path

import galah
import pandas as pd


OUTPUT_COLUMNS = [
    "Vernacular Name",
    "Badge Category",
    "Requirement",
    "badge_id",
    "rule_type",
    "rule_field",
    "rule_operator",
    "rule_value",
    "description",
    "image_earned",
    "image_locked",
    "unlock_priority",
    "unlock_tier",
]


BADGE_MAPPING = [
    {
        "Vernacular Name": "Koala",
        "Badge Category": "Streak",
        "Requirement": "3",
        "badge_id": "koala",
        "rule_type": "streak_days",
        "rule_field": "",
        "rule_operator": "gte",
        "rule_value": "3",
        "description": "You played 3 days in a row!",
        "image_earned": "koala.svg",
        "image_locked": "koala_locked.svg",
        "unlock_priority": 30,
        "unlock_tier": 2,
    },
    {
        "Vernacular Name": "Green Turtle",
        "Badge Category": "Streak",
        "Requirement": "5",
        "badge_id": "green_turtle",
        "rule_type": "streak_days",
        "rule_field": "",
        "rule_operator": "gte",
        "rule_value": "5",
        "description": "You played 5 days in a row!",
        "image_earned": "green_turtle.svg",
        "image_locked": "green_turtle_locked.svg",
        "unlock_priority": 110,
        "unlock_tier": 3,
    },
    {
        "Vernacular Name": "Saltwater Crocodile",
        "Badge Category": "Streak",
        "Requirement": "7",
        "badge_id": "saltwater_crocodile",
        "rule_type": "streak_days",
        "rule_field": "",
        "rule_operator": "gte",
        "rule_value": "7",
        "description": "A whole week of play in a row!",
        "image_earned": "saltwater_crocodile.svg",
        "image_locked": "saltwater_crocodile_locked.svg",
        "unlock_priority": 140,
        "unlock_tier": 4,
    },
    {
        "Vernacular Name": "Red Kangaroo",
        "Badge Category": "Streak",
        "Requirement": "14",
        "badge_id": "red_kangaroo",
        "rule_type": "streak_days",
        "rule_field": "",
        "rule_operator": "gte",
        "rule_value": "14",
        "description": "Two weeks of play in a row!",
        "image_earned": "red_kangaroo.svg",
        "image_locked": "red_kangaroo_locked.svg",
        "unlock_priority": 150,
        "unlock_tier": 4,
    },
    {
        "Vernacular Name": "Sugar Glider",
        "Badge Category": "Variety Tag",
        "Requirement": "Quiet",
        "badge_id": "sugar_glider",
        "rule_type": "first_matching_activity",
        "rule_field": "variety_tags",
        "rule_operator": "contains",
        "rule_value": "Quiet",
        "description": "You tried your first quiet activity.",
        "image_earned": "sugar_glider.svg",
        "image_locked": "sugar_glider_locked.svg",
        "unlock_priority": 70,
        "unlock_tier": 3,
    },
    {
        "Vernacular Name": "Tasmanian Devil",
        "Badge Category": "Variety Tag",
        "Requirement": "Energised Activity",
        "badge_id": "tasmanian_devil",
        "rule_type": "first_matching_activity",
        "rule_field": "variety_tags",
        "rule_operator": "contains",
        "rule_value": "Energised Activity",
        "description": "You tried your first energised activity.",
        "image_earned": "tasmanian_devil.svg",
        "image_locked": "tasmanian_devil_locked.svg",
        "unlock_priority": 90,
        "unlock_tier": 3,
    },
    {
        "Vernacular Name": "Dingo",
        "Badge Category": "Variety Tag",
        "Requirement": "Exploration",
        "badge_id": "dingo",
        "rule_type": "first_matching_activity",
        "rule_field": "variety_tags",
        "rule_operator": "contains",
        "rule_value": "Exploration",
        "description": "You went on your first exploration.",
        "image_earned": "dingo.svg",
        "image_locked": "dingo_locked.svg",
        "unlock_priority": 80,
        "unlock_tier": 3,
    },
    {
        "Vernacular Name": "Australian Hump-backed Dolphin",
        "Badge Category": "Variety Tag",
        "Requirement": "Water Play",
        "badge_id": "humpback_dolphin",
        "rule_type": "first_matching_activity",
        "rule_field": "variety_tags",
        "rule_operator": "contains",
        "rule_value": "Water Play",
        "description": "You tried your first water play activity.",
        "image_earned": "humpback_dolphin.svg",
        "image_locked": "humpback_dolphin_locked.svg",
        "unlock_priority": 100,
        "unlock_tier": 3,
    },
    {
        "Vernacular Name": "Platypus",
        "Badge Category": "Milestone",
        "Requirement": "First Activity",
        "badge_id": "platypus",
        "rule_type": "total_completed",
        "rule_field": "",
        "rule_operator": "gte",
        "rule_value": "1",
        "description": "You finished your very first activity!",
        "image_earned": "platypus.svg",
        "image_locked": "platypus_locked.svg",
        "unlock_priority": 10,
        "unlock_tier": 1,
    },
    {
        "Vernacular Name": "Quokka",
        "Badge Category": "Milestone",
        "Requirement": "Two In One Day",
        "badge_id": "quokka",
        "rule_type": "completed_in_one_day",
        "rule_field": "",
        "rule_operator": "gte",
        "rule_value": "2",
        "description": "You did two activities in one day!",
        "image_earned": "quokka.svg",
        "image_locked": "quokka_locked.svg",
        "unlock_priority": 120,
        "unlock_tier": 3,
    },
    {
        "Vernacular Name": "Short-beaked Echidna",
        "Badge Category": "Milestone",
        "Requirement": "15 Minutes Or Less",
        "badge_id": "echidna",
        "rule_type": "first_matching_activity",
        "rule_field": "duration_minutes",
        "rule_operator": "lte",
        "rule_value": "15",
        "description": "You finished a quick activity.",
        "image_earned": "echidna.svg",
        "image_locked": "echidna_locked.svg",
        "unlock_priority": 20,
        "unlock_tier": 1,
    },
    {
        "Vernacular Name": "Sulphur-crested Cockatoo",
        "Badge Category": "Milestone",
        "Requirement": "Group/Family",
        "badge_id": "cockatoo",
        "rule_type": "first_matching_activity",
        "rule_field": "social_tag",
        "rule_operator": "equals",
        "rule_value": "Group/Family",
        "description": "You played together with others.",
        "image_earned": "cockatoo.svg",
        "image_locked": "cockatoo_locked.svg",
        "unlock_priority": 60,
        "unlock_tier": 2,
    },
    {
        "Vernacular Name": "Southern Emu-wren",
        "Badge Category": "Milestone",
        "Requirement": "Nature",
        "badge_id": "emu_wren",
        "rule_type": "first_matching_activity",
        "rule_field": "variety_tags",
        "rule_operator": "contains",
        "rule_value": "Nature",
        "description": "You tried your first nature activity.",
        "image_earned": "emu_wren.svg",
        "image_locked": "emu_wren_locked.svg",
        "unlock_priority": 40,
        "unlock_tier": 2,
    },
    {
        "Vernacular Name": "Blue-winged Kookaburra",
        "Badge Category": "Milestone",
        "Requirement": "Creative",
        "badge_id": "kookaburra",
        "rule_type": "first_matching_activity",
        "rule_field": "variety_tags",
        "rule_operator": "contains",
        "rule_value": "Creative",
        "description": "You tried your first creative activity.",
        "image_earned": "kookaburra.svg",
        "image_locked": "kookaburra_locked.svg",
        "unlock_priority": 50,
        "unlock_tier": 2,
    },
    {
        "Vernacular Name": "Rainbow Lorikeet",
        "Badge Category": "Milestone",
        "Requirement": "Coordination",
        "badge_id": "rainbow_lorikeet",
        "rule_type": "first_matching_activity",
        "rule_field": "variety_tags",
        "rule_operator": "contains",
        "rule_value": "Coordination",
        "description": "You tried your first coordination activity.",
        "image_earned": "rainbow_lorikeet.svg",
        "image_locked": "rainbow_lorikeet_locked.svg",
        "unlock_priority": 130,
        "unlock_tier": 3,
    },
]


def build_badge_dataframe(available_species: pd.DataFrame) -> pd.DataFrame:
    """Return the deterministic database rows for the configured badge species."""
    if "Vernacular Name" not in available_species.columns:
        raise ValueError("ALA response does not contain 'Vernacular Name'.")

    available_names = set(available_species["Vernacular Name"].dropna())
    missing_names = [
        badge["Vernacular Name"]
        for badge in BADGE_MAPPING
        if badge["Vernacular Name"] not in available_names
    ]
    if missing_names:
        raise ValueError(
            "Configured badge species were not returned by ALA: "
            + ", ".join(missing_names)
        )

    return pd.DataFrame(BADGE_MAPPING, columns=OUTPUT_COLUMNS)


def main() -> None:
    """Query ALA and write the database-ready badge CSV."""
    galah.galah_config(email=os.environ["GALAH_EMAIL"])
    animals = galah.atlas_species(taxa="Chordata")
    badge_animals = build_badge_dataframe(animals)

    output_path = (
        Path(__file__).resolve().parents[2]
        / "data"
        / "processed"
        / "species_badge_db.csv"
    )
    output_path.parent.mkdir(parents=True, exist_ok=True)
    badge_animals.to_csv(output_path, index=False)
    print(f"Saved {len(badge_animals)} badge rows to {output_path}")


if __name__ == "__main__":
    main()
