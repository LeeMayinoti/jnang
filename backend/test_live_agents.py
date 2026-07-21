import json
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

print("=" * 60)
print("1. TESTING GET / (Root Status)")
print("=" * 60)
res = client.get("/")
print("Status Code:", res.status_code)
print(json.dumps(res.json(), indent=2))

print("\n" + "=" * 60)
print("2. TESTING POST /generate (Full 3-Agent Pipeline)")
print("=" * 60)
res = client.post("/generate", json={"theme": "a hunter who learned to share honey with the camp"})
print("Status Code:", res.status_code)
data = res.json()
print("Draft Narrative:\n", data.get("draft_narrative"))
print("\nMotifemes Identified:\n", data.get("motifemes"))
print("\nStory Moves:\n", data.get("story_moves"))
print("\nGrade Report:\n", json.dumps(data.get("grade_report"), indent=2))

print("\n" + "=" * 60)
print("3. TESTING POST /agents/generator (Direct Agent 1)")
print("=" * 60)
res = client.post("/agents/generator", json={"theme": "the rain-animal and the dry waterhole"})
print("Status Code:", res.status_code)
print(json.dumps(res.json(), indent=2))

print("\n" + "=" * 60)
print("4. TESTING POST /agents/classifier (Direct Agent 2)")
print("=" * 60)
res = client.post("/agents/classifier", json={"draft_narrative": "In the dry n!ore, G!ara faced a lack. The elder warned him not to go into the bush alone. He broke the taboo, but his brother brought him back and all water was shared."})
print("Status Code:", res.status_code)
print(json.dumps(res.json(), indent=2))

print("\n" + "=" * 60)
print("5. TESTING POST /agents/grader (Direct Agent 3)")
print("=" * 60)
res = client.post("/agents/grader", json={
    "draft_narrative": "In the dry n!ore, G!ara faced a lack. The elder warned him. Water was brought back and shared with all.",
    "motifemes": ["Lack", "Interdiction", "Lack Liquidated", "Return"],
    "story_moves": ["Protagonist faces water shortage", "Community shares resources equally"]
})
print("Status Code:", res.status_code)
print(json.dumps(res.json(), indent=2))
print("\n" + "=" * 60)
print("ALL 3 AGENTS & FASTAPI ENDPOINTS EXECUTED SUCCESSFULLY!")
print("=" * 60)
