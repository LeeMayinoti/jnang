import json
import os

json_path = r"c:\Users\lmy\source\repos\jnang\context\knowledge_graph.json"

if not os.path.exists(json_path):
    print("Error: knowledge_graph.json does not exist!")
    exit(1)

try:
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    print("Success: Valid JSON loaded!")
    
    nodes = data.get("nodes", [])
    edges = data.get("edges", [])
    
    print(f"Total Nodes: {len(nodes)}")
    print(f"Total Edges: {len(edges)}")
    
    # Check node types
    node_types = {}
    for n in nodes:
        node_types[n["type"]] = node_types.get(n["type"], 0) + 1
    
    print("\nNode distribution by type:")
    for nt, count in node_types.items():
        print(f"  {nt}: {count}")
        
    # Check if all 6 stories are present
    stories = [n for n in nodes if n["type"] == "Story"]
    print(f"\nStories found ({len(stories)}):")
    for s in stories:
        print(f"  - {s['label']} (ID: {s['id']})")
        
    if len(stories) == 6:
        print("\nVerification Pass: All 6 stories are present in the knowledge graph!")
    else:
        print(f"\nVerification Fail: Expected 6 stories, found {len(stories)}")
        
except Exception as e:
    print("Verification Error:", e)
    exit(1)
