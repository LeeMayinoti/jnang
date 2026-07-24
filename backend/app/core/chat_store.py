"""
Chat Store
==========
Thin sqlite3 helper for persisting chat sessions (UI-facing display data).
Separate from the LangGraph checkpoint DB which stores agent-internal state.

Tables:
  chat_sessions  — one row per thread
  chat_messages  — ordered message log per thread (user + bot bubbles)
"""

from __future__ import annotations

import json
import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

# ---------------------------------------------------------------------------
# DB path — default ./data/chat_history.db, overridable via CHAT_DB_PATH env
# ---------------------------------------------------------------------------

_DEFAULT_DB = Path(__file__).resolve().parents[3] / "data" / "chat_history.db"
DB_PATH = Path(os.getenv("CHAT_DB_PATH", str(_DEFAULT_DB)))


def _get_conn() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    return conn


# ---------------------------------------------------------------------------
# Bootstrap
# ---------------------------------------------------------------------------

def init() -> None:
    """Create tables if they don't exist. Called once on startup."""
    with _get_conn() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS chat_sessions (
                thread_id  TEXT PRIMARY KEY,
                title      TEXT NOT NULL DEFAULT 'New Chat',
                mode       TEXT NOT NULL DEFAULT 'generate',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS chat_messages (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                thread_id  TEXT NOT NULL REFERENCES chat_sessions(thread_id) ON DELETE CASCADE,
                sender     TEXT NOT NULL,          -- 'user' | 'bot'
                text       TEXT NOT NULL DEFAULT '',
                payload    TEXT NOT NULL DEFAULT '{}', -- JSON: options, story, analysis
                created_at TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_chat_messages_thread
                ON chat_messages(thread_id, id);
        """)


# ---------------------------------------------------------------------------
# Sessions
# ---------------------------------------------------------------------------

def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def create_session(thread_id: str, title: str = "New Chat", mode: str = "generate") -> Dict:
    now = _now()
    with _get_conn() as conn:
        conn.execute(
            "INSERT OR IGNORE INTO chat_sessions (thread_id, title, mode, created_at, updated_at) VALUES (?,?,?,?,?)",
            (thread_id, title, mode, now, now),
        )
    return {"thread_id": thread_id, "title": title, "mode": mode, "created_at": now, "updated_at": now}


def list_sessions() -> List[Dict]:
    with _get_conn() as conn:
        rows = conn.execute(
            "SELECT thread_id, title, mode, created_at, updated_at FROM chat_sessions ORDER BY updated_at DESC"
        ).fetchall()
    return [dict(r) for r in rows]


def get_session(thread_id: str) -> Optional[Dict]:
    with _get_conn() as conn:
        row = conn.execute(
            "SELECT thread_id, title, mode, created_at, updated_at FROM chat_sessions WHERE thread_id = ?",
            (thread_id,),
        ).fetchone()
    return dict(row) if row else None


def rename_session(thread_id: str, title: str) -> bool:
    with _get_conn() as conn:
        cur = conn.execute(
            "UPDATE chat_sessions SET title = ?, updated_at = ? WHERE thread_id = ?",
            (title, _now(), thread_id),
        )
    return cur.rowcount > 0


def delete_session(thread_id: str) -> bool:
    with _get_conn() as conn:
        cur = conn.execute("DELETE FROM chat_sessions WHERE thread_id = ?", (thread_id,))
    return cur.rowcount > 0


def touch_session(thread_id: str, title: Optional[str] = None) -> None:
    """Update updated_at (and optionally title) — called after each pipeline run."""
    now = _now()
    with _get_conn() as conn:
        if title:
            conn.execute(
                "UPDATE chat_sessions SET updated_at = ?, title = ? WHERE thread_id = ?",
                (now, title, thread_id),
            )
        else:
            conn.execute(
                "UPDATE chat_sessions SET updated_at = ? WHERE thread_id = ?",
                (now, thread_id),
            )


# ---------------------------------------------------------------------------
# Messages
# ---------------------------------------------------------------------------

def add_message(
    thread_id: str,
    sender: str,
    text: str,
    payload: Optional[Dict[str, Any]] = None,
) -> int:
    now = _now()
    payload_json = json.dumps(payload or {})
    with _get_conn() as conn:
        cur = conn.execute(
            "INSERT INTO chat_messages (thread_id, sender, text, payload, created_at) VALUES (?,?,?,?,?)",
            (thread_id, sender, text, payload_json, now),
        )
    return cur.lastrowid


def get_messages(thread_id: str) -> List[Dict]:
    with _get_conn() as conn:
        rows = conn.execute(
            "SELECT id, sender, text, payload, created_at FROM chat_messages WHERE thread_id = ? ORDER BY id",
            (thread_id,),
        ).fetchall()
    result = []
    for r in rows:
        d = dict(r)
        d["payload"] = json.loads(d["payload"])
        result.append(d)
    return result
