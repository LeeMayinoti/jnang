import os
from pathlib import Path
from typing import List, Dict, Optional

class JuGrammar:
    def __init__(self, txt_path: Optional[str] = None):
        if txt_path is None:
            txt_path = str(Path(__file__).resolve().parent.parent.parent.parent / 'context' / 'data' / 'book.txt')
        self.txt_path = txt_path
        self.rules: List[str] = []
        
        if os.path.exists(txt_path):
            try:
                with open(txt_path, 'r', encoding='utf-8') as f:
                    self.rules = [line.strip() for line in f if line.strip()]
            except Exception as e:
                print(f"Error reading grammar file {txt_path}: {e}")
        else:
            # Fallback guidelines if book.txt does not exist
            self.rules = [
                "Orthography: Ju|'hoansi uses four primary click symbols representing influxes:",
                "  - / Dental click (similar to the 'tsk-tsk' sound of disapproval)",
                "  - ! Alveolar click (a sharp pop like pulling a cork from a bottle)",
                "  - // Lateral click (similar to the sound made to urge on a horse)",
                "  - # Alveopalatal click (a soft pop against the roof of the mouth)",
                "Tone: Tone is critical in Ju|'hoansi and distinguishes meaning between words with the same segmental phonemes.",
                "Syntax: Typical word order is Subject-Verb-Object (SVO), similar to English, but with particle modifiers.",
                "Compounding: Nouns and verbs are frequently compounded to create complex meanings."
            ]

    def get_rules(self) -> List[str]:
        return self.rules

    def get_click_guides(self) -> Dict[str, str]:
        return {
            "/": "Dental click: tongue tip against back of upper teeth.",
            "!": "Alveolar click: tip of tongue popped off the alveolar ridge.",
            "//": "Lateral click: sides of tongue pulled away from the upper molars.",
            "#": "Alveopalatal click: flat of tongue against hard palate."
        }
