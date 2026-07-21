import os
import sys
import json
import argparse
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

# Add project root to sys.path to allow imports from backend
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from dotenv import load_dotenv
# Load environment variables from backend/.env
env_path = Path(__file__).resolve().parent / '.env'
load_dotenv(dotenv_path=env_path)

import pypdf
from langchain_openai import ChatOpenAI
from backend.app.utils.dictionary import JuDictionary

# Pydantic schemas for structured output matching Agent 1 specifications
class SpatialTransition(BaseModel):
    character: str = Field(description="Name of the character")
    from_location: str = Field(alias="from", description="Source location, typically 'Camp' or 'Bush'")
    to_location: str = Field(alias="to", description="Destination location, typically 'Camp' or 'Bush'")
    line: int = Field(description="Approximate line, page, or paragraph index where the transition occurs (1-indexed)")

    model_config = {
        "populate_by_name": True
    }

class CharacterAnalysis(BaseModel):
    name: str = Field(description="Name of the character")
    role: str = Field(description="Role of the character (Hero, Donor, Helper, Witnesses/Community, Environmental Challenge, False Hero/Target, Villain/Hoarder)")
    explanation: str = Field(description="Explanation of why this role was assigned based on narrative behavior")
    linguistic_term: Optional[str] = Field(None, description="Ju|'hoan name or term for the character (e.g. G!ara, !xo) if present in the text")

class ClassificationOutput(BaseModel):
    motifeme_skeleton: List[str] = Field(description="The chain of motifemes, e.g., ['Lack', 'Violation', 'Consequence']")
    characters: List[CharacterAnalysis] = Field(description="List of characters and their roles")
    spatial_transitions: List[SpatialTransition] = Field(description="Transitions between the Camp and the Bush")
    custom_motifs: List[str] = Field(description="Custom motifs detected: [Transmutation], [Egalitarian Distribution], [Ancestral/Nǀum Intervention]")
    linguistic_terms: List[str] = Field(description="Authentic Ju|'hoan words identified in the text")


def extract_text(file_path: str) -> str:
    """Extracts text from a TXT or PDF file."""
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")

    if path.suffix.lower() == '.pdf':
        print(f"Extracting text from PDF: {file_path}...")
        reader = pypdf.PdfReader(path)
        text = ""
        for i, page in enumerate(reader.pages):
            page_text = page.extract_text()
            if page_text:
                text += f"\n--- Page {i+1} ---\n" + page_text + "\n"
        return text
    else:
        print(f"Reading text from file: {file_path}...")
        with open(path, 'r', encoding='utf-8') as f:
            return f.read()


def classify_story(text: str, model_name: str = "gpt-4o-mini") -> Dict[str, Any]:
    """Runs the LangChain structured classification agent on the story text."""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or api_key == "your-openai-api-key-here":
        print("\nWARNING: OpenAI API key is missing or set to placeholder in backend/.env!")
        api_key = input("Please enter your OpenAI API Key (or press Enter to abort): ").strip()
        if not api_key:
            print("Aborting classification due to missing API Key.")
            sys.exit(1)
        os.environ["OPENAI_API_KEY"] = api_key

    # Initialize the LLM
    llm = ChatOpenAI(model=model_name, temperature=0, openai_api_key=api_key)
    structured_llm = llm.with_structured_output(ClassificationOutput)

    # Use the Agent 1 Classifier prompts
    from backend.app.agents.prompts import CLASSIFIER_SYSTEM_PROMPT
    
    # We will invoke the structured LLM with the prompt
    messages = [
        ("system", CLASSIFIER_SYSTEM_PROMPT),
        ("user", f"Analyze this story:\n\n{text}")
    ]
    
    print(f"Sending story to OpenAI model '{model_name}' for classification...")
    result: ClassificationOutput = structured_llm.invoke(messages)
    
    # Convert Pydantic object to dict (respecting aliases like 'from')
    return result.model_dump(by_alias=True)


def enrich_linguistic_terms(terms: List[str]) -> List[Dict[str, str]]:
    """Looks up terms in the Ju|'hoansi dictionary to add definitions."""
    dictionary = JuDictionary()
    enriched = []
    
    for term in terms:
        # Strip potential brackets/punctuation
        clean_term = term.strip("[].,()!? \t\n")
        if not clean_term:
            continue
            
        lookup_result = dictionary.lookup(clean_term)
        if lookup_result:
            enriched.append({
                "term": term,
                "entry": lookup_result.get("entry", ""),
                "searchable": lookup_result.get("searchable", ""),
                "sense": lookup_result.get("sense", ""),
                "pos": lookup_result.get("pos", "")
            })
        else:
            enriched.append({
                "term": term,
                "entry": term,
                "searchable": term,
                "sense": "Not found in dictionary, but identified in text.",
                "pos": "N/A"
            })
            
    return enriched


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    
    parser = argparse.ArgumentParser(description="Standalone Ju|'hoansi Narrative Classifier Agent")
    parser.add_argument("--file", required=True, help="Path to the story file (PDF or TXT)")
    parser.add_argument("--model", default="gpt-4o-mini", help="OpenAI chat model name (default: gpt-4o-mini)")
    parser.add_argument("--output", help="Path to save JSON output (optional)")
    args = parser.parse_args()

    try:
        story_text = extract_text(args.file)
        if not story_text.strip():
            print("Error: Extracted text is empty.")
            sys.exit(1)
            
        classification = classify_story(story_text, model_name=args.model)
        
        # Enrich linguistic terms using the dictionary helper
        enriched_terms = enrich_linguistic_terms(classification.get("linguistic_terms", []))
        
        full_result = {
            "file": args.file,
            "classification": classification,
            "dictionary_lookup": enriched_terms
        }
        
        # Print results in a beautiful format
        print("\n" + "="*60)
        print("          CLASSIFICATION RESULTS FOR JU|'HOANSI STORY")
        print("="*60)
        print(f"\nFile: {args.file}")
        
        print("\n--- Motifeme Skeleton Chain ---")
        skeleton = classification.get("motifeme_skeleton", [])
        print(" -> ".join(skeleton) if skeleton else "None detected")
        
        print("\n--- Characters & Roles ---")
        for char in classification.get("characters", []):
            print(f"- {char['name']} (Role: {char['role']})")
            print(f"  Explanation: {char['explanation']}")
            if char.get('linguistic_term'):
                print(f"  Linguistic Term: {char['linguistic_term']}")
                
        print("\n--- Spatial Transitions ---")
        transitions = classification.get("spatial_transitions", [])
        if transitions:
            for t in transitions:
                print(f"- {t['character']}: {t['from']} -> {t['to']} (approx line {t['line']})")
        else:
            print("No Camp/Bush transitions detected.")
            
        print("\n--- Custom Motifs ---")
        custom_motifs = classification.get("custom_motifs", [])
        if custom_motifs:
            for m in custom_motifs:
                print(f"- {m}")
        else:
            print("No custom motifs detected.")
            
        print("\n--- Enriched Linguistic Terms ---")
        if enriched_terms:
            for entry in enriched_terms:
                print(f"- '{entry['term']}' (Entry: {entry['entry']}, POS: {entry['pos']})")
                print(f"  Sense: {entry['sense']}")
        else:
            print("No linguistic terms identified.")
            
        print("="*60)
        
        # Save output if requested
        output_path = args.output or f"classification_{Path(args.file).stem}.json"
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(full_result, f, indent=2, ensure_ascii=False)
        print(f"\nDetailed JSON output successfully saved to: {output_path}")

    except Exception as e:
        print(f"\nError: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
