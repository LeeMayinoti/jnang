"""
Canonical Narrative Graph Schema & Mappings
===========================================
Defines the four theoretical pillars for the Neo4j graph:
  1. Story boundaries (:Story nodes with source & status)
  2. Dundes' 8 canonical motifemes (:Motifeme nodes + move mappings)
  3. Lévi-Strauss's Camp / Bush / Liminal spatial domains on :Location
  4. Sydow's cultural oicotype categories on entities
"""

from __future__ import annotations

import re
from typing import Dict, Optional

# ---------------------------------------------------------------------------
# 1. Dundes' 8 Canonical Motifemes
# ---------------------------------------------------------------------------

DUNDES_MOTIFEME_DEFS: Dict[str, str] = {
    "Lack": "A need, absence, hoarding, or deficiency exists in the community.",
    "Interdiction": "A prohibition, warning, or taboo is stated by an elder or authority.",
    "Violation": "The interdiction, taboo, or communal sharing norm is broken.",
    "Consequence": "A result follows the violation (punishment, transformation, loss, or death).",
    "Mediation": "A helper, trickster, elder, or ancestral spirit intervenes.",
    "Lack Liquidated": "The original lack is resolved and communal sharing or life is restored.",
    "Departure": "A character leaves camp for the bush or embarks on a journey.",
    "Return": "A character returns from the bush or journey to camp or home.",
}

# ---------------------------------------------------------------------------
# 2. Canonical Story Metadata (11 stories in context/data/folktales_ontology.ttl)
# ---------------------------------------------------------------------------

CANONICAL_STORIES: Dict[str, Dict[str, str]] = {
    "S1": {"title": "The Moon Dies and Lives Again", "theme": "death rebirth moon cycle"},
    "S2": {"title": "The Honey and the Flies", "theme": "sharing honey imitation whistling magic"},
    "S3": {"title": "A Woman First Found Fire", "theme": "fire cooking sharing theft"},
    "S4": {"title": "The Elephant First Found Water", "theme": "water hoarding rainmaking sharing"},
    "S8": {"title": "The Sun's Child", "theme": "greed sharing sun child transformation"},
    "S9": {"title": "The God and the Dance", "theme": "secret eating hoarding dance punishment"},
    "S10": {"title": "Tug-of-War", "theme": "cattle sharing refusal foraging usurpation"},
    "S11": {"title": "Eyes-on-his-Ankles", "theme": "digging roots deception monster bush"},
    "S12": {"title": "The Two Boys and the Lions", "theme": "hunting eland lions resurrection tracking"},
    "S13": {"title": "The Haregirl and the Moon", "theme": "abandonment waterhole moon death message"},
    "S14": {"title": "The Beautiful Elephant Girl", "theme": "kinship murder blood regrowth vengeance"},
}

# ---------------------------------------------------------------------------
# 3. Lévi-Strauss Spatial Domains on :Location
# ---------------------------------------------------------------------------

CANONICAL_LOCATION_DOMAINS: Dict[str, str] = {
    "AbandonedVillage": "Liminal",
    "Anthill_S14": "Bush",
    "Bush_S10": "Bush",
    "Bush_S9": "Bush",
    "CampFireSite": "Camp",
    "Campfire_S11": "Camp",
    "DanceFire_S9": "Camp",
    "DiggingGround_S11": "Bush",
    "ElandDeathPlace": "Bush",
    "EldersVillage": "Camp",
    "ForestBush": "Bush",
    "Ground": "Camp",
    "HomeCamp": "Camp",
    "HomeVillage_S12": "Camp",
    "InLawsVillage": "Camp",
    "MoonHole": "Liminal",
    "MotherVillage_S14": "Camp",
    "NewVillage": "Camp",
    "SecretWaterhole": "Bush",
    "Shade_S8": "Liminal",
    "Sky": "Liminal",
    "Sky_S8": "Liminal",
    "TheDarkness": "Liminal",
    "Trail_S12": "Liminal",
    "Tree": "Bush",
    "Village_S10": "Camp",
}

# ---------------------------------------------------------------------------
# 4. Canonical NarrativeFunction → Dundes Motifeme Mapping (all 91 moves)
# ---------------------------------------------------------------------------

CANONICAL_MOVE_MOTIFEMES: Dict[str, str] = {
    # S1: The Moon Dies and Lives Again
    "S1_Move1_Death": "Lack",
    "S1_Move2_Darkness": "Departure",
    "S1_Move3_SunSets": "Consequence",
    "S1_Move4_Rebirth": "Return",
    "S1_Move5_Message": "Lack Liquidated",
    # S2: The Honey and the Flies
    "S2_Move1_Harvest": "Lack",
    "S2_Move2_WhistleDishes": "Mediation",
    "S2_Move3_Imitation": "Violation",
    "S2_Move4_Failure": "Consequence",
    "S2_Move5_Fall": "Consequence",
    "S2_Move6_Rescue": "Mediation",
    # S3: A Woman First Found Fire
    "S3_Move1_Discovery": "Lack Liquidated",
    "S3_Move2_Nurturing": "Mediation",
    "S3_Move3_HusbandDeprived": "Lack",
    "S3_Move4_Theft": "Violation",
    "S3_Move5_Propagation": "Lack Liquidated",
    # S4: The Elephant First Found Water
    "S4_Move1_Hoarding": "Lack",
    "S4_Move2_Exposure": "Violation",
    "S4_Move3_Tracking": "Departure",
    "S4_Move4_Sabotage": "Mediation",
    "S4_Move5_Confrontation": "Consequence",
    "S4_Move6_Slaying": "Consequence",
    "S4_Move7_Rainmaking": "Lack Liquidated",
    # S8: The Sun's Child
    "S8_Move1_Roast": "Mediation",
    "S8_Move2_Greed": "Violation",
    "S8_Move3_LeftInShade": "Consequence",
    "S8_Move4_Refusal": "Violation",
    "S8_Move5_Ascension": "Departure",
    "S8_Move6_Sunbird": "Consequence",
    # S9: The God and the Dance
    "S9_Move1_Gathering": "Lack",
    "S9_Move2_Deception": "Violation",
    "S9_Move3_SecretEating": "Violation",
    "S9_Move4_PreparesWeapon": "Violation",
    "S9_Move5_Demand": "Interdiction",
    "S9_Move6_Refusals": "Violation",
    "S9_Move7_Dance": "Mediation",
    "S9_Move8_Murder": "Consequence",
    "S9_Move9_SelfPraise": "Consequence",
    # S10: Tug-of-War
    "S10_Move1_Ownership": "Lack",
    "S10_Move2_Inquiry": "Departure",
    "S10_Move3_HerdToVillage": "Return",
    "S10_Move4_Milking": "Mediation",
    "S10_Move5_PotRefusal": "Violation",
    "S10_Move6_TugOfWar": "Consequence",
    "S10_Move7_Usurpation": "Consequence",
    "S10_Move8_Origin": "Consequence",
    # S11: Eyes-on-his-Ankles
    "S11_Move1_Digging": "Departure",
    "S11_Move2_Suspicion": "Lack",
    "S11_Move3_Test": "Mediation",
    "S11_Move4_Ruse": "Mediation",
    "S11_Move5_Wariness": "Interdiction",
    "S11_Move6_Killing": "Lack Liquidated",
    # S12: The Two Boys and the Lions
    "S12_Move1_Hunt": "Departure",
    "S12_Move2_Villainy": "Lack",
    "S12_Move3_Tracking": "Departure",
    "S12_Move4_HotCoals": "Mediation",
    "S12_Move5_Pretense": "Mediation",
    "S12_Move6_BirdsSing": "Mediation",
    "S12_Move7_AnimalsDance": "Mediation",
    "S12_Move8_Meteor": "Mediation",
    "S12_Move9_Resurrection": "Lack Liquidated",
    "S12_Move10_Feast": "Return",
    # S13: The Haregirl and the Moon
    "S13_Move1_Disappearance": "Lack",
    "S13_Move2_Relocation": "Departure",
    "S13_Move3_Deception": "Violation",
    "S13_Move4_Abandonment": "Consequence",
    "S13_Move5_FalseAnswer": "Consequence",
    "S13_Move6_Enticement": "Interdiction",
    "S13_Move7_Capture": "Consequence",
    "S13_Move8_Message": "Mediation",
    "S13_Move9_DistortedMessage": "Violation",
    "S13_Move10_Punishment": "Consequence",
    "S13_Move11_Retaliation": "Consequence",
    # S14: The Beautiful Elephant Girl
    "S14_Move1_Marriage": "Lack Liquidated",
    "S14_Move2_Journey": "Departure",
    "S14_Move3_SkyBirth": "Mediation",
    "S14_Move4_Warning": "Interdiction",
    "S14_Move5_ThornRuse": "Violation",
    "S14_Move6_Murder": "Consequence",
    "S14_Move7_BloodWind": "Mediation",
    "S14_Move8_Cannibalism": "Violation",
    "S14_Move9_AnthillHiding": "Mediation",
    "S14_Move10_FailedRevenge": "Consequence",
    "S14_Move11_Accusation": "Lack",
    "S14_Move12_Regrowth": "Mediation",
    "S14_Move13_Adornment": "Mediation",
    "S14_Move14_Recognition": "Return",
    "S14_Move15_Donation": "Mediation",
    "S14_Move16_Journey": "Departure",
    "S14_Move17_Vengeance": "Consequence",
    "S14_Move18_Return": "Return",
}

# ---------------------------------------------------------------------------
# 5. Sydow Cultural Oicotype Categories
# ---------------------------------------------------------------------------

OICOTYPE_BY_LABEL: Dict[str, str] = {
    "Person": "SocialActor",
    "Animal": "KalahariFauna",
    "Object": "SubsistenceItem",
    "MagicalAgent": "SupernaturalAgent",
    "ProppianRole": "NarrativeRole",
    "Location": "EcologicalSetting",
}


def extract_story_id(node_id: str) -> Optional[str]:
    """Extracts canonical story ID (e.g. 'S14') from a node id if present."""
    if not node_id:
        return None
    m = re.search(r"(?:^|_)(S\d+)(?:_|$)", node_id)
    return m.group(1) if m else None


def infer_location_domain(label: str) -> str:
    """Infers Camp / Bush / Liminal domain from a location label."""
    low = (label or "").lower()
    if any(w in low for w in ("camp", "village", "fire", "kraal", "home")):
        return "Camp"
    if any(w in low for w in ("bush", "waterhole", "tree", "digging", "anthill", "forest", "veldt", "dune")):
        return "Bush"
    return "Liminal"


def infer_oicotype_category(node_type: str) -> str:
    """Maps a node label to its Sydow cultural oicotype category."""
    return OICOTYPE_BY_LABEL.get(node_type, "CulturalElement")
