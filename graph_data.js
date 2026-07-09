// Compiled Narrative Ontology Knowledge Graph Data
const graphData = {
  "nodes": [
    {
      "id": "Move4_Consequence",
      "label": "Glara falls and stomach bursts",
      "type": "NarrativeFunction",
      "properties": {
        "description": "Glara falls and stomach bursts"
      }
    },
    {
      "id": "Glara",
      "label": "Glara",
      "type": "Character",
      "properties": {}
    },
    {
      "id": "Move3_LackOfMagic",
      "label": "Glara fails due to lacking whistling magic",
      "type": "NarrativeFunction",
      "properties": {
        "description": "Glara fails due to lacking whistling magic"
      }
    },
    {
      "id": "Woodpecker",
      "label": "Woodpecker",
      "type": "Character",
      "properties": {}
    },
    {
      "id": "Move2_AttemptedImitation",
      "label": "Glara attempts to imitate Woodpecker",
      "type": "NarrativeFunction",
      "properties": {
        "description": "Glara attempts to imitate Woodpecker"
      }
    },
    {
      "id": "Move1_Lack",
      "label": "Glara desires honey",
      "type": "NarrativeFunction",
      "properties": {
        "description": "Glara desires honey"
      }
    },
    {
      "id": "Move5_Rescue",
      "label": "Flies sew up Glara's stomach",
      "type": "NarrativeFunction",
      "properties": {
        "description": "Flies sew up Glara's stomach"
      }
    },
    {
      "id": "WhistlingMagic",
      "label": "WhistlingMagic",
      "type": "MagicalAgent",
      "properties": {}
    },
    {
      "id": "Honey",
      "label": "Honey",
      "type": "Object",
      "properties": {}
    },
    {
      "id": "Flies",
      "label": "Flies",
      "type": "Character",
      "properties": {}
    },
    {
      "id": "Helper",
      "label": "Helper",
      "type": "ProppianRole",
      "properties": {}
    },
    {
      "id": "FalseHero",
      "label": "FalseHero",
      "type": "ProppianRole",
      "properties": {}
    },
    {
      "id": "SuccessfulModel",
      "label": "SuccessfulModel",
      "type": "ProppianRole",
      "properties": {}
    }
  ],
  "edges": [
    {
      "from": "Glara",
      "to": "Move3_LackOfMagic",
      "label": "performsFunction"
    },
    {
      "from": "Move3_LackOfMagic",
      "to": "Move2_AttemptedImitation",
      "label": "follows"
    },
    {
      "from": "Move2_AttemptedImitation",
      "to": "Move1_Lack",
      "label": "follows"
    },
    {
      "from": "Glara",
      "to": "Move4_Consequence",
      "label": "performsFunction"
    },
    {
      "from": "Glara",
      "to": "WhistlingMagic",
      "label": "lacks"
    },
    {
      "from": "Move5_Rescue",
      "to": "Move4_Consequence",
      "label": "follows"
    },
    {
      "from": "Glara",
      "to": "Move2_AttemptedImitation",
      "label": "performsFunction"
    },
    {
      "from": "Glara",
      "to": "Move1_Lack",
      "label": "performsFunction"
    },
    {
      "from": "Flies",
      "to": "Move5_Rescue",
      "label": "performsFunction"
    },
    {
      "from": "Flies",
      "to": "Helper",
      "label": "hasRole"
    },
    {
      "from": "Move4_Consequence",
      "to": "Move3_LackOfMagic",
      "label": "follows"
    },
    {
      "from": "Glara",
      "to": "FalseHero",
      "label": "hasRole"
    },
    {
      "from": "Woodpecker",
      "to": "SuccessfulModel",
      "label": "hasRole"
    }
  ]
};
