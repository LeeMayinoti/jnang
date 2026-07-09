import os
import pandas as pd
from typing import Dict, Optional
from pathlib import Path

class JuDictionary:
    def __init__(self, xls_path: Optional[str] = None):
        if xls_path is None:
            # Default path pointing to context/data/ju_dictionary.xls
            xls_path = str(Path(__file__).resolve().parent.parent.parent.parent / 'context' / 'data' / 'ju_dictionary.xls')
        
        self.xls_path = xls_path
        self.df = None
        
        if os.path.exists(xls_path):
            try:
                self.df = pd.read_excel(xls_path)
            except Exception as e:
                print(f"Error reading dictionary file {xls_path}: {e}")
        else:
            print(f"Dictionary file not found at: {xls_path}")

    def lookup(self, term: str) -> Optional[Dict[str, str]]:
        if self.df is None:
            return None
        
        # Try exact match on 'Searchable'
        result = self.df[self.df['Searchable'].astype(str) == term]
        if result.empty:
            # Try contains match on 'Searchable' or 'Entry'
            result = self.df[self.df['Searchable'].astype(str).str.contains(term, case=False, na=False) |
                             self.df['Entry'].astype(str).str.contains(term, case=False, na=False)]
        
        if not result.empty:
            row = result.iloc[0]
            return {
                "entry": str(row['Entry']),
                "searchable": str(row['Searchable']),
                "sense": str(row['Sense']),
                "pos": str(row['POS']) if pd.notna(row['POS']) else "N/A"
            }
        return None
