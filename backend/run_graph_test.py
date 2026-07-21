import os
import sys
import json
from pathlib import Path

# Add project root to sys.path
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from dotenv import load_dotenv
env_path = Path(__file__).resolve().parent / '.env'
load_dotenv(dotenv_path=env_path)

from backend.app.agents.graph import app as graph_app

def main():
    sys.stdout.reconfigure(encoding='utf-8')
    print("="*60)
    print("     STARTING MOCK TEST OF NARRATIVE AGENTS & STATE SCHEMA")
    print("="*60)
    
    # Define initial state
    initial_state = {
        "theme": "sharing honey",
        "target_motifeme_skeleton": ["Lack", "Violation", "Consequence"],
        "max_iterations": 3,
        "generator_result": {},
        "classifier_result": {},
        "critic_result": {},
        "completed_nodes": []
    }
    
    print("\nInitial State:")
    print(json.dumps(initial_state, indent=2))
    
    # Setup configuration with a thread ID for MemorySaver checkpointing
    config = {"configurable": {"thread_id": "mock_test_run"}}
    
    print("\nInvoking compiled LangGraph workflow...")
    print("--- Execution Trace ---")
    
    try:
        # We will stream the state updates at each node
        for event in graph_app.stream(initial_state, config=config):
            for node_name, state_update in event.items():
                print(f"\n[Node: {node_name.upper()} completed]")
                print("State Updates:")
                print(json.dumps(state_update, indent=2))
                
        # Retrieve final state
        final_state = graph_app.get_state(config).values
        
        print("\n" + "="*60)
        print("                 FINAL RESULTING STATE SCHEMA")
        print("="*60)
        print(json.dumps(final_state, indent=2))
        
    except Exception as e:
        print(f"\nError running graph: {e}")

if __name__ == "__main__":
    main()
