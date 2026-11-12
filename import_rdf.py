import os
import json
from rdflib import Graph, RDF, RDFS, OWL, URIRef
from neo4j import GraphDatabase
from dotenv import load_dotenv

load_dotenv()
# Also pick up backend/.env (where the app's Neo4j credentials live)
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend", ".env"))

NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER") or os.getenv("NEO4J_USERNAME", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "password")

def get_local_name(uri):
    uri_str = str(uri)
    for sep in ['#', '/']:
        if sep in uri_str:
            return uri_str.split(sep)[-1]
    return uri_str

def parse_rdf_file():
    g = Graph()
    ttl_path = "context/data/folktales_ontology.ttl"
    print(f"Parsing RDF Turtle file: {ttl_path}")
    g.parse(ttl_path, format="turtle")

    # Helper function to check if a URI belongs to any story instance namespace
    # (i.e. starts with narrative ontology base but is not the schema namespace)
    def is_story_uri(uri):
        uri_str = str(uri)
        return (uri_str.startswith("http://ontology.narrative.org/") and 
                not uri_str.startswith("http://ontology.narrative.org/propp#"))

    nodes = {}
    edges = []

    # Map of URIs to types
    uri_types = {}

    # Identify explicit types from the graph
    for s, p, o in g.triples((None, RDF.type, None)):
        if is_story_uri(s) and str(o).startswith("http://ontology.narrative.org/propp#"):
            uri_types[s] = get_local_name(o)

    # Inferred types based on property usage
    PROPP_HAS_ROLE = URIRef("http://ontology.narrative.org/propp#hasRole")
    for s, p, o in g.triples((None, PROPP_HAS_ROLE, None)):
        uri_types[o] = "ProppianRole"

    # Gather nodes and their properties
    for s, p, o in g.triples((None, None, None)):
        if not is_story_uri(s):
            continue

        # Get subject node info
        s_id = get_local_name(s)
        if s_id not in nodes:
            nodes[s_id] = {
                "id": s_id,
                "label": s_id,
                "type": uri_types.get(s, "Entity"),
                "properties": {}
            }

        # If predicate is a data property / literal description
        if isinstance(o, URIRef):
            # If object is not in the story namespace, it's a schema class/property, skip creating an edge
            if not is_story_uri(o):
                continue
                
            o_id = get_local_name(o)
            rel_label = get_local_name(p)
            
            # Make sure target node is initialized
            if o_id not in nodes:
                nodes[o_id] = {
                    "id": o_id,
                    "label": o_id,
                    "type": uri_types.get(o, "Entity"),
                    "properties": {}
                }
            
            # Avoid duplicate edges
            edge = {"from": s_id, "to": o_id, "label": rel_label}
            if edge not in edges:
                edges.append(edge)
        else:
            # Literal value, set as property
            prop_name = get_local_name(p)
            if prop_name == "label":
                # Use literal as label (e.g., "Glara desires honey")
                nodes[s_id]["label"] = str(o)
            else:
                nodes[s_id]["properties"][prop_name] = str(o)

    # Post-process types and descriptions
    for node in nodes.values():
        if node["type"] == "Entity":
            # Check if it has a role or function
            if node["id"].startswith("Move") or "_Move" in node["id"]:
                node["type"] = "NarrativeFunction"
            elif node["id"] in ["FalseHero", "SuccessfulModel", "Helper"]:
                node["type"] = "ProppianRole"
            elif node["id"] == "WhistlingMagic":
                node["type"] = "MagicalAgent"
            elif node["id"] == "Honey":
                node["type"] = "Object"
        
        # Ensure a description property exists
        if "description" not in node["properties"] and node["label"] != node["id"]:
            node["properties"]["description"] = node["label"]

    return list(nodes.values()), edges

def generate_js_data(nodes, edges):
    print("Writing graph data directly to graph_data.js...")
    graph_data = {
        "nodes": nodes,
        "edges": edges
    }
    
    js_content = f"// Compiled Narrative Ontology Knowledge Graph Data\nconst graphData = {json.dumps(graph_data, indent=2)};\n"
    
    with open("graph_data.js", "w", encoding="utf-8") as f:
        f.write(js_content)
    print("Successfully generated graph_data.js!")

def import_to_neo4j(nodes, edges):
    print(f"Connecting to Neo4j at {NEO4J_URI}...")
    try:
        driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
        # Test connection
        driver.verify_connectivity()
        print("Connected to Neo4j successfully!")
    except Exception as e:
        print(f"\n[WARNING] Could not connect to Neo4j. Error: {e}")
        print("Ensure Neo4j is running. Proceeding with offline compilation of graph_data.js...\n")
        return False

    with driver.session() as session:
        from backend.app.utils.graph_schema import (
            CANONICAL_LOCATION_DOMAINS,
            CANONICAL_MOVE_MOTIFEMES,
            CANONICAL_STORIES,
            DUNDES_MOTIFEME_DEFS,
            extract_story_id,
            infer_location_domain,
            infer_oicotype_category,
        )

        # Remove only stale canonical relationships/links if desired? No—use idempotent MERGE
        # so archived generated/user_submitted stories are NEVER deleted.
        print("Seeding canonical :Motifeme nodes...")
        for motifeme_name, desc in DUNDES_MOTIFEME_DEFS.items():
            session.run(
                """
                MERGE (m:Motifeme {id: $id})
                SET m.label = $id, m.type = 'Motifeme', m.description = $desc
                """,
                {"id": motifeme_name, "desc": desc},
            )

        print("Seeding canonical :Story nodes...")
        for story_id, meta in CANONICAL_STORIES.items():
            session.run(
                """
                MERGE (s:Story {id: $id})
                SET s.label = $title,
                    s.title = $title,
                    s.theme = $theme,
                    s.type = 'Story',
                    s.source = 'canonical',
                    s.status = 'accepted'
                """,
                {"id": story_id, "title": meta["title"], "theme": meta["theme"]},
            )

        # Create/merge nodes idempotently
        print("Importing canonical nodes (idempotent MERGE)...")
        for node in nodes:
            label = node["type"]
            # Neo4j labels must be valid identifiers, fallback to Entity if empty
            if not label:
                label = "Entity"

            # Build cypher query to merge node
            query = f"""
            MERGE (n:{label} {{id: $id}})
            SET n.label = $label, n.type = $type, n.source = coalesce(n.source, 'canonical')
            """
            params = {
                "id": node["id"],
                "label": node["label"],
                "type": node["type"],
            }
            if label == "Location":
                domain = CANONICAL_LOCATION_DOMAINS.get(node["id"], infer_location_domain(node["label"]))
                query += ", n.domain = $domain"
                params["domain"] = domain
            elif label in ("Person", "Animal", "Object", "MagicalAgent", "ProppianRole"):
                query += ", n.oicotype = $oicotype"
                params["oicotype"] = infer_oicotype_category(label)

            for k, v in node["properties"].items():
                query += f", n.{k} = $prop_{k}"
                params[f"prop_{k}"] = v

            session.run(query, params)

            # Link NarrativeFunction to its :Story and :Motifeme
            if label == "NarrativeFunction":
                story_id = extract_story_id(node["id"])
                if story_id and story_id in CANONICAL_STORIES:
                    session.run(
                        """
                        MATCH (s:Story {id: $story_id}), (nf:NarrativeFunction {id: $nf_id})
                        MERGE (s)-[:HAS_MOVE]->(nf)
                        """,
                        {"story_id": story_id, "nf_id": node["id"]},
                    )
                motifeme = CANONICAL_MOVE_MOTIFEMES.get(node["id"])
                if motifeme:
                    session.run(
                        """
                        MATCH (nf:NarrativeFunction {id: $nf_id}), (m:Motifeme {id: $motifeme})
                        MERGE (nf)-[:INSTANTIATES]->(m)
                        """,
                        {"nf_id": node["id"], "motifeme": motifeme},
                    )

        # Create edges
        print("Importing relationships...")
        for edge in edges:
            rel_type = edge["label"]
            # Convert predicate to standard uppercase UPPER_CASE relationship type
            # E.g. performsFunction -> PERFORMS_FUNCTION
            upper_rel_type = "".join([f"_{c}" if c.isupper() else c for c in rel_type]).upper().strip("_")

            query = f"""
            MATCH (a {{id: $from_id}}), (b {{id: $to_id}})
            MERGE (a)-[r:{upper_rel_type}]->(b)
            SET r.label = $label
            """
            session.run(query, {
                "from_id": edge["from"],
                "to_id": edge["to"],
                "label": rel_type
            })
            
        print("Successfully imported RDF data into Neo4j!")
        
        # Verify query and export back
        print("Querying Neo4j database to verify data export...")
        result = session.run("MATCH (n) RETURN n")
        exported_nodes = []
        for record in result:
            n = record["n"]
            # Map Neo4j node back to frontend format
            # Get node labels to find the main type
            labels = list(n.labels)
            node_type = labels[0] if labels else "Entity"
            exported_nodes.append({
                "id": n.get("id"),
                "label": n.get("label", n.get("id")),
                "type": node_type,
                "properties": {k: v for k, v in n.items() if k not in ["id", "label", "type"]}
            })
            
        result_edges = session.run("MATCH (a)-[r]->(b) RETURN a.id as from_id, b.id as to_id, type(r) as type, r.label as label")
        exported_edges = []
        for record in result_edges:
            exported_edges.append({
                "from": record["from_id"],
                "to": record["to_id"],
                "label": record["label"] if record["label"] else record["type"].lower()
            })
            
        generate_js_data(exported_nodes, exported_edges)
        
    driver.close()
    return True

if __name__ == "__main__":
    nodes, edges = parse_rdf_file()
    print(f"Parsed {len(nodes)} nodes and {len(edges)} edges.")
    
    # Try importing into Neo4j first
    success = import_to_neo4j(nodes, edges)
    if not success:
        # Fallback: compile graph_data.js directly from parsed RDF
        generate_js_data(nodes, edges)
