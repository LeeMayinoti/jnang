import json
import pandas as pd
import re

# Load dictionary
xls_path = r"c:\Users\lmy\source\repos\jnang\context\data\ju_dictionary.xls"
df = pd.read_excel(xls_path)

# Dictionary lookup function
def lookup_word(term_searchable):
    # Search for exact or substring match in Searchable or Entry
    res = df[df['Searchable'].astype(str) == term_searchable]
    if res.empty:
        # Fallback to substring
        res = df[df['Searchable'].astype(str).str.contains(term_searchable, case=False, na=False) |
                 df['Entry'].astype(str).str.contains(term_searchable, case=False, na=False)]
    
    if not res.empty:
        # Return first match details
        row = res.iloc[0]
        return {
            "entry": str(row['Entry']),
            "searchable": str(row['Searchable']),
            "sense": str(row['Sense']),
            "pos": str(row['POS']) if pd.notna(row['POS']) else "N/A"
        }
    return None

# Dictionary lookup by English Sense
def lookup_sense(sense_keyword):
    res = df[df['Sense'].astype(str).str.contains(sense_keyword, case=False, na=False)]
    if not res.empty:
        row = res.iloc[0]
        return {
            "entry": str(row['Entry']),
            "searchable": str(row['Searchable']),
            "sense": str(row['Sense']),
            "pos": str(row['POS']) if pd.notna(row['POS']) else "N/A"
        }
    return None

# Define terms we want to map and link to the graph
words_to_extract = {
    # Honey & Flies
    "zo": "zo",                 # honey
    "zoanzoan": "zoanzoan",     # flies
    "g!ai": "g!ai",             # sew
    "!'aun!'aun": "!'aun!'aun", # woodpecker
    "g!u_stomach": "g!u",       # stomach
    
    # Moon
    "n!ui": "n!ui",             # moon
    "|am": "/am",               # sun
    "ju": "ju",                 # person/people
    "!ai": "!ai",               # die
    
    # Fire
    "da'a": "da'a",             # fire
    "!'hoan": "!'hoan",         # husband
    "dshau": "dshau",           # woman
    
    # Water & Elephant
    "!xo": "!xo",               # elephant
    "g!u_water": "g!u",         # water
    "tzama": "tzama",           # bird
    "waq": "waq",               # urine
    "!u": "!u",                 # spear/iron point
    
    # Ostrich & Tortoise
    "g//oe": "g//oe",           # tortoise
    "dsuu": "dsuu",             # ostrich
    "Gu": "Gu",                 # pot
    "n!u": "n!u",               # egg
    "tshu": "tshu",             # vomit
    
    # Springhare
    "n/oqm": "n/oqm",           # springhare
    "n!ham": "n!ham",           # hook springhare
    "g=ui": "g=ui",             # hooking pole
    
    # Cultural General
    "n!ore": "n!ore",           # land
    "n/om": "n/om",             # medicine/magic/power
    "g//aoan": "g//aoan"        # God/spirit
}

resolved_words = {}
for key, term in words_to_extract.items():
    info = lookup_word(term)
    if info:
        # Override sense or entry if needed for context
        if key == "g!u_stomach":
            info["sense"] = "Stomach, belly (used in the bursting stomach of G!ara)."
        elif key == "g!u_water":
            info["sense"] = "Water, juice of fruits etc. (hoarded by the elephant)."
        resolved_words[key] = info
    else:
        resolved_words[key] = {
            "entry": term,
            "searchable": term,
            "sense": "Not found in dictionary, but culturally significant in Ju|'hoansi folktales.",
            "pos": "N/A"
        }

# Define the stories, their metadata, character roles, and functions
stories_data = [
    {
        "id": "story_1",
        "title": "The Moon Dies and Lives Again",
        "type": "Cosmological / Mythological Narrative",
        "speaker": "GUkxa N!a’an",
        "recorded": "Dobe, Botswana, 1971",
        "summary": "This story describes the waning of the moon as a death, and its re-growth as the promise of eternally renewed life.",
        "theme": "Death, rebirth, continuity of life, cyclical time",
        "moral": "Death is temporary or cyclical; renewal follows loss.",
        "propp_functions": [
            {"order": 1, "event": "Moon disappears", "function": "Absentation", "desc": "Main figure leaves/disappears"},
            {"order": 2, "event": "Moon 'dies'", "function": "Lack/Loss", "desc": "Absence creates change"},
            {"order": 3, "event": "Darkness occurs", "function": "Consequence / Villainy-like state", "desc": "World enters dark phase"},
            {"order": 4, "event": "Moon returns", "function": "Return", "desc": "Central figure comes back"},
            {"order": 5, "event": "Moon becomes full again", "function": "Restoration", "desc": "Recovery/completion"},
            {"order": 6, "event": "People remember prophecy", "function": "Recognition", "desc": "Meaning understood"},
            {"order": 7, "event": "Cycle repeats", "function": "Renewal", "desc": "Recurrent narrative closure (episodic loop)"}
        ],
        "characters": [
            {"name": "Moon (N!ui)", "role": "Hero", "explanation": "Central figure experiencing transformation and representing eternal renewal.", "word": "n!ui"},
            {"name": "People (Ju)", "role": "Witnesses / Community", "explanation": "Observe the cycle, interpret events, and hold the collective memory.", "word": "ju"},
            {"name": "Darkness / Night", "role": "Environmental Challenge", "explanation": "Represents the lack/loss of light and the temporary phase of death.", "word": "|am"}
        ]
    },
    {
        "id": "story_2",
        "title": "The Honey and the Flies",
        "type": "Mythological Narrative",
        "speaker": "Dahm Ti N!a’an",
        "recorded": "Kauri, Botswana, 1971",
        "summary": "When the god G!ara was still on the earth, he wanted to imitate the cardinal woodpecker by chopping out honey from a hive high in a tree. But he did not have the whistling magic or the ability to fly possessed by the woodpecker, so he fell to the ground and his stomach burst. Flies came and sewed up his stomach, and G!ara thanked the flies.",
        "theme": "Humility, limits of imitation, interdependence, communal help",
        "moral": "One should not imitate abilities they do not possess; help comes through cooperation.",
        "propp_functions": [
            {"order": 1, "event": "G!ara sees woodpecker harvesting honey", "function": "Preparation / Observation", "desc": "Hero observes another model"},
            {"order": 2, "event": "G!ara imitates woodpecker", "function": "Attempt / Counteraction", "desc": "Hero undertakes action"},
            {"order": 3, "event": "Failure to whistle magic items", "function": "Lack / Deficiency", "desc": "Missing ability or power"},
            {"order": 4, "event": "Tries to fly", "function": "Test / Trial", "desc": "Hero attempts difficult action"},
            {"order": 5, "event": "Falls and stomach bursts", "function": "Punishment / Villainy", "desc": "Crisis occurs, displaying G!ara's vulnerability"},
            {"order": 6, "event": "Flies arrive", "function": "Helper Appears", "desc": "Assistance introduced"},
            {"order": 7, "event": "Flies sew stomach", "function": "Aid / Repair", "desc": "Hero receives help from communal creatures"},
            {"order": 8, "event": "G!ara thanks them and rises", "function": "Resolution / Return", "desc": "Story resolves with restoration"}
        ],
        "characters": [
            {"name": "G!ara", "role": "Hero", "explanation": "Main actor undergoing experience, creator god but subject to failure and dependency.", "word": "g//aoan"},
            {"name": "Cardinal Woodpecker (!'Aun!'Aun)", "role": "Donor / Model", "explanation": "Demonstrates a skill; indirectly tests G!ara by showcasing the power of honey harvesting.", "word": "!'aun!'aun"},
            {"name": "Flies (Zoaqzoaq)", "role": "Helper", "explanation": "Repair and restore G!ara's split stomach through cooperative effort.", "word": "zoanzoan"},
            {"name": "G!ara's lack of ability", "role": "Villain-like force", "explanation": "Internal limitation that causes the downfall and requires external repair.", "word": "g!u_stomach"}
        ]
    },
    {
        "id": "story_3",
        "title": "A Woman First Found Fire",
        "type": "Etiological Narrative",
        "speaker": "FAsa N!a’an",
        "recorded": "Kauri, Botswana, 1971",
        "summary": "The first person to find fire was a woman. She sat by the fire and fed her children cooked food, while her husband slept in the dark and ate raw food. After waiting a long time, the husband stole the fire and ran off, and since then fire has been known throughout the world. It was a woman who first found fire because 'a woman naturally is a great thing.'",
        "theme": "Discovery, gender roles, sharing, distribution of resources",
        "moral": "Sharing resources benefits the community; women are the foundation of societal discovery.",
        "propp_functions": [
            {"order": 1, "event": "Woman sits by fire and feeds cooked food to children", "function": "Initial Situation", "desc": "The finder of fire uses it responsibly"},
            {"order": 2, "event": "Husband sleeps in dark and eats raw food", "function": "Lack", "desc": "The husband has no fire and suffers deficiency"},
            {"order": 3, "event": "Husband waits and watches wife", "function": "Observation / Mediation", "desc": "The resource is discovered by the non-owner"},
            {"order": 4, "event": "Husband steals the fire", "function": "Theft / Villainy", "desc": "The resource is taken secretly from the woman"},
            {"order": 5, "event": "Husband runs off and makes fire elsewhere", "function": "Flight / Escape", "desc": "The wrongdoer flees to establish own base"},
            {"order": 6, "event": "Fire becomes known throughout the world", "function": "Restoration / Etiological Closure", "desc": "Resource is distributed globally; people can make fire"}
        ],
        "characters": [
            {"name": "Woman (Dshau)", "role": "Hero / First Finder", "explanation": "First to discover fire; nurtures children and represents primary discovery.", "word": "dshau"},
            {"name": "Husband (!'Hoan)", "role": "Villain / Stealer", "explanation": "Stole fire due to jealousy or lack, leading to its dispersion.", "word": "!'hoan"},
            {"name": "Children (Da'ama)", "role": "Helper / Co-beneficiaries", "explanation": "Nourished by the fire; represent the community.", "word": "da'a"}
        ]
    },
    {
        "id": "story_4",
        "title": "The Elephant First Found Water",
        "type": "Etiological / Moral Narrative",
        "speaker": "FAsa N!a’an",
        "recorded": "Kauri, Botswana, 1971",
        "summary": "The elephant was the one who first found water. He hid it from people and drank it alone. But the mud from the water stuck to his ankles and his wife, the Beautiful Aardvark Girl, asked the others how he could have found water. Her brothers tracked him, saw him drinking water, drank it all up, and filled the waterhole with their urine. When the elephant returned, he tried to drink but it refused. He tried to grab his wife, but the brothers stabbed him to death with spears. The brothers were swallows that come with the rain.",
        "theme": "Anti-hoarding, justice, communal sharing, environmental resource",
        "moral": "Hoarding vital resources leads to destruction; sharing and community cooperation are essential for survival.",
        "propp_functions": [
            {"order": 1, "event": "Elephant finds water and hides it from people", "function": "Initial Situation / Lack", "desc": "Water is hoarded; the community is in state of lack"},
            {"order": 2, "event": "Mud sticks to elephant's ankles", "function": "Deceptive Clue", "desc": "Evidence of water is left behind"},
            {"order": 3, "event": "Wife notices mud and asks about it; elephant denies", "function": "Interdiction / Warning", "desc": "Confrontation of the hoarder"},
            {"order": 4, "event": "Wife alerts brothers; they track elephant's spoor", "function": "Beginning Counteraction", "desc": "Investigation of the hoarding"},
            {"order": 5, "event": "Brothers find waterhole and drink all water", "function": "Observation / Receipt of Aid", "desc": "The source is discovered and reclaimed"},
            {"order": 6, "event": "Brothers urinate in waterhole to ruin it", "function": "Trickery / Retaliation", "desc": "Stingy hoarder is taught a lesson"},
            {"order": 7, "event": "Elephant returns; urine water refuses him", "function": "Frustration / Warning", "desc": "Consequence of hoarding"},
            {"order": 8, "event": "Elephant tries to grab wife in anger", "function": "Struggle / Assault", "desc": "Villain attempts violence"},
            {"order": 9, "event": "Brothers stab elephant to death with spears", "function": "Struggle / Victory", "desc": "Villain is executed by the community"},
            {"order": 10, "event": "Brothers become swallows; rain falls for all", "function": "Restoration / Etiological Closure", "desc": "Water is freed; swallows bring the rain"}
        ],
        "characters": [
            {"name": "Elephant (!Xo)", "role": "Villain / Hoarder", "explanation": "Hoarded the water, lied to his wife, and was killed for his selfishness.", "word": "!xo"},
            {"name": "Aardvark Girl (G!kunG'homdima)", "role": "Helper / Dispatcher", "explanation": "Wife of the elephant who noticed the mud and alerted her brothers, prioritizing community over husband.", "word": "dshau"},
            {"name": "Brothers (!o-sin)", "role": "Hero / Avengers", "explanation": "Tracked the elephant, ruined his stash, and killed him to free the water. Transformed into swallow-birds.", "word": "tzama"}
        ]
    },
    {
        "id": "story_5",
        "title": "The Ostrich and the Tortoise",
        "type": "Trickster / Adaptational Narrative",
        "speaker": "N!ani F’Kun",
        "recorded": "Tsumkwe, Namibia, 2006",
        "summary": "Tortoise and Ostrich were arguing. Tortoise told Ostrich, 'If I cook myself, you’ll eat me.' Ostrich said he would never do that. But Tortoise fooled him into eating from a pot of cooked tortoise eggs. When he learned what he had done, Ostrich vomited, kicked the pot, and has had red, split shins ever since.",
        "theme": "Deception, pride, broken interdiction, physical evolution",
        "moral": "Arrogance and greed expose one to deception; actions have permanent physical consequences.",
        "propp_functions": [
            {"order": 1, "event": "Tortoise and Ostrich argue about eating each other", "function": "Initial Situation", "desc": "Setup of conflict and competition"},
            {"order": 2, "event": "Tortoise challenges: 'if I cook myself you will eat me'", "function": "Test / Challenge", "desc": "Deceptive proposition is made"},
            {"order": 3, "event": "Ostrich swears: 'I will never eat you'", "function": "Interdiction", "desc": "Rule is established"},
            {"order": 4, "event": "Tortoise cooks his eggs in a pot", "function": "Deception", "desc": "Trick is set up using eggs instead of body"},
            {"order": 5, "event": "Ostrich finds pot and eats all eggs", "function": "Violation", "desc": "Ostrich breaks his word due to greed"},
            {"order": 6, "event": "Tortoise reveals Ostrich ate his eggs/himself", "function": "Exposure", "desc": "The deceit is revealed, causing shock"},
            {"order": 7, "event": "Ostrich vomits and kicks the pot in anger", "function": "Consequence", "desc": "Immediate physical and emotional reaction"},
            {"order": 8, "event": "Ostrich gets red split shins", "function": "Etiological Closure", "desc": "Permanent physical marker explaining ostrich shins"}
        ],
        "characters": [
            {"name": "Tortoise (Go'a)", "role": "Hero / Trickster", "explanation": "Clever figure who wins the argument through cunning and egg-cooking.", "word": "g//oe"},
            {"name": "Ostrich (Dsuu)", "role": "False Hero / Target", "explanation": "Arrogant, easily fooled, breaks his promise and suffers physical deformation.", "word": "dsuu"}
        ]
    },
    {
        "id": "story_6",
        "title": "Springhare Dances",
        "type": "Moral / Etiological Narrative",
        "speaker": "Dahm Ti N!a’an",
        "recorded": "Kauri, Botswana, 1971",
        "summary": "Springhare was playing and dancing, making rhythmic sounds. God watched him and decided to fetch a dancing skin from his son !Xuma. He gave it to Springhare, who danced all day. When rain began to fall, God asked for the skin back. Springhare refused and kept dancing. The heavy rain destroyed the skin, and Springhare fled into a hole. God used a hook to pull him out and beat him with a digging stick, explaining why people hunt springhares with hooks today.",
        "theme": "Disobedience, greed, consequences, origin of hunting practices",
        "moral": "Refusing authority and selfishness lead to severe consequences; resources given must be respected.",
        "propp_functions": [
            {"order": 1, "event": "God observes Springhare playing and dancing", "function": "Initial Situation", "desc": "Narrative setup"},
            {"order": 2, "event": "God fetches dancing skin from !Xuma", "function": "Provision / Donor Function", "desc": "Special object obtained"},
            {"order": 3, "event": "Dancing skin is given to Springhare", "function": "Receipt of Magical Aid", "desc": "Hero receives the gift"},
            {"order": 4, "event": "Springhare dances all day", "function": "Use of Magical Object", "desc": "Object used to perform actions"},
            {"order": 5, "event": "Rain approaches and God asks for skin back", "function": "Warning / Command", "desc": "Instruction given to avoid danger"},
            {"order": 6, "event": "Springhare refuses and continues dancing", "function": "Violation", "desc": "Rule is ignored due to obsession/greed"},
            {"order": 7, "event": "Rain destroys the dancing skin", "function": "Punishment / Consequence", "desc": "Loss of the magical object due to misbehavior"},
            {"order": 8, "event": "Springhare hides in a hole in fear", "function": "Flight / Escape", "desc": "Attempted evasion of authority"},
            {"order": 9, "event": "God hooks Springhare out of the hole", "function": "Capture / Confrontation", "desc": "Wrongdoer is caught using a hooking pole"},
            {"order": 10, "event": "God beats Springhare on the back with digging stick", "function": "Punishment", "desc": "Physical justice is enacted"},
            {"order": 11, "event": "Humans repeat this practice to hunt springhares", "function": "Etiological Closure", "desc": "Origin of current cultural/hunting reality"}
        ],
        "characters": [
            {"name": "Springhare (N/oqm)", "role": "Hero / False Hero", "explanation": "Central actor who is talented at dancing but succumbs to greed and disobedience, leading to punishment.", "word": "n/oqm"},
            {"name": "God (G!ara)", "role": "Donor / Authority", "explanation": "Provides the magical skin, warns of danger, and enforces order/justice when violated.", "word": "g//aoan"},
            {"name": "!Xuma", "role": "Indirect Donor", "explanation": "God's son and the original owner/creator of the dancing skin.", "word": "g//aoan"},
            {"name": "Rain", "role": "Villain-like force / Natural Punisher", "explanation": "Acts as the physical force that destroys the skin and threatens Springhare.", "word": "/am"}
        ]
    }
]

# Generate Graph Structure (Nodes & Edges)
nodes = []
edges = []
node_ids = set()

def add_node(nid, label, ntype, properties):
    if nid not in node_ids:
        nodes.append({
            "id": nid,
            "label": label,
            "type": ntype,
            "properties": properties
        })
        node_ids.add(nid)

def add_edge(source, target, etype, properties=None):
    edges.append({
        "from": source,
        "to": target,
        "label": etype,
        "properties": properties or {}
    })

# Add General Cultural Concepts as Nodes
cultural_concepts = {
    "camp": {"label": "The Camp", "desc": "Safe space, human society, egalitarian sharing, social order."},
    "bush": {"label": "The Bush", "desc": "Wild nature, danger, isolation, supernatural power, animal transformation."},
    "num": {"label": "N|um (Power)", "desc": "Shamanic medicine, healing energy, and spiritual power."},
    "sharing": {"label": "Egalitarian Distribution", "desc": "The core cultural requirement of sharing meat, water, and resources."},
    "transmutation": {"label": "Transmutation", "desc": "Human-animal zoomorphism, cyclical boundary dissolution."}
}

for cid, info in cultural_concepts.items():
    add_node(f"concept_{cid}", info["label"], "Cultural_Concept", {
        "description": info["desc"]
    })

# Loop over stories and populate
for story in stories_data:
    story_id = story["id"]
    # Story Node
    add_node(story_id, story["title"], "Story", {
        "title": story["title"],
        "type": story["type"],
        "speaker": story["speaker"],
        "recorded": story["recorded"],
        "summary": story["summary"],
        "theme": story["theme"],
        "moral": story["moral"]
    })
    
    # Link story to spatial concept (e.g. Camp vs Bush transitions)
    if story_id in ["story_1", "story_2", "story_6"]:
        add_edge(story_id, "concept_bush", "SETTING_INCLUDES")
        add_edge(story_id, "concept_camp", "SETTING_INCLUDES")
    elif story_id == "story_3":
        add_edge(story_id, "concept_camp", "SETTING_INCLUDES")
    elif story_id == "story_4":
        add_edge(story_id, "concept_bush", "SETTING_INCLUDES")
        add_edge(story_id, "concept_sharing", "THEME_RELATED_TO")
    elif story_id == "story_5":
        add_edge(story_id, "concept_bush", "SETTING_INCLUDES")
        
    # Link story to theme concept
    if "sharing" in story["theme"].lower() or "hoarding" in story["theme"].lower():
        add_edge(story_id, "concept_sharing", "THEME_RELATED_TO")
    if "transformation" in story["theme"].lower() or "rebirth" in story["theme"].lower() or "zoomor" in story["theme"].lower() or "swallow" in story["summary"].lower():
        add_edge(story_id, "concept_transmutation", "THEME_RELATED_TO")

    # Functions (Nodes and Edges)
    prev_func_id = None
    for item in story["propp_functions"]:
        func_id = f"{story_id}_func_{item['order']}"
        func_label = f"{item['order']}. {item['function']}"
        add_node(func_id, func_label, "Propp_Function", {
            "function": item["function"],
            "event": item["event"],
            "description": item["desc"],
            "order": item["order"]
        })
        add_edge(story_id, func_id, "HAS_FUNCTION", {"order": item["order"]})
        
        # Chronological edge between sequence functions
        if prev_func_id:
            add_edge(prev_func_id, func_id, "NEXT_FUNCTION")
        prev_func_id = func_id

    # Characters (Nodes and Edges)
    for char in story["characters"]:
        # Character names might be shared, let's create a unique ID based on name
        char_slug = re.sub(r'[^a-zA-Z0-9]', '_', char["name"].lower())
        char_id = f"char_{char_slug}"
        
        add_node(char_id, char["name"], "Character", {
            "name": char["name"],
            "explanation": char["explanation"]
        })
        add_edge(story_id, char_id, "HAS_CHARACTER")
        
        # Role representation (Propp Roles)
        role_id = f"role_{char['role'].lower().replace(' ', '_').replace('/', '_')}"
        # Standardize Role description
        role_descriptions = {
            "hero": "Main character who seeks something, solves a problem, or undergoes transformation.",
            "villain": "Creates conflict, hoards resources, or acts as an obstacle for the hero.",
            "donor": "Provides a magic aid, tool, or wisdom after testing or observing the hero.",
            "helper": "Assists the hero during the journey or performs repairs/restoration.",
            "witnesses___community": "Observe, interpret events, and hold the collective memory.",
            "environmental_challenge": "Represents nature's barriers or challenges (e.g. night, storm).",
            "hero___false_hero": "Talented actor who starts as hero but violates rules, becoming a warning.",
            "villain___hoarder": "Hoards community resources (water/fire) and suffers community punishment.",
            "hero___first_finder": "Discovers resources first, benefiting the community.",
            "hero___avengers": "Frees community resources and enforces justice.",
            "false_hero___target": "Prideful opponent who violates interdictions and gets tricked."
        }
        clean_role_name = char["role"]
        add_node(role_id, clean_role_name, "Propp_Role", {
            "role": clean_role_name,
            "definition": role_descriptions.get(role_id.replace("role_", ""), "A Proppian character archetype.")
        })
        
        # Link Character to Role in context of Story
        add_edge(char_id, role_id, "PLAYS_ROLE", {"story": story["title"]})
        
        # Link Character to Dictionary word
        word_key = char["word"]
        if word_key in resolved_words:
            word_id = f"word_{word_key}"
            w_info = resolved_words[word_key]
            
            # Dictionary Word Node
            add_node(word_id, w_info["entry"], "Linguistic_Term", {
                "entry": w_info["entry"],
                "searchable": w_info["searchable"],
                "sense": w_info["sense"],
                "pos": w_info["pos"]
            })
            add_edge(char_id, word_id, "ASSOCIATED_WORD")

# Add some other dictionary words that appear in the texts
for word_key, w_info in resolved_words.items():
    word_id = f"word_{word_key}"
    if word_id not in node_ids:
        add_node(word_id, w_info["entry"], "Linguistic_Term", {
            "entry": w_info["entry"],
            "searchable": w_info["searchable"],
            "sense": w_info["sense"],
            "pos": w_info["pos"]
        })
    # Link words to cultural concepts
    if word_key == "n/om":
        add_edge(word_id, "concept_num", "REPRESENTS")
    if word_key == "n!ore":
        add_edge(word_id, "concept_camp", "RELATED_TO")
    if word_key == "g//aoan":
        add_edge(word_id, "concept_num", "RELATED_TO")

# Write JSON
graph_data = {
    "nodes": nodes,
    "edges": edges
}

# Write knowledge_graph.json
json_out_path = r"c:\Users\lmy\source\repos\jnang\context\knowledge_graph.json"
with open(json_out_path, 'w', encoding='utf-8') as f:
    json.dump(graph_data, f, indent=2, ensure_ascii=False)

# Write graph_data.js for local browser loading
js_out_path = r"c:\Users\lmy\source\repos\jnang\graph_data.js"
with open(js_out_path, 'w', encoding='utf-8') as f:
    f.write("// Compiled Ju|'hoansi & Proppian Morphology Knowledge Graph Data\n")
    f.write("const graphData = ")
    json.dump(graph_data, f, indent=2, ensure_ascii=False)
    f.write(";\n")

print(f"Extraction successful! Nodes: {len(nodes)}, Edges: {len(edges)}")
