import React, { useState } from 'react';
import { Pencil, Trash2, Check, X } from 'lucide-react';

/**
 * ChatHistoryPanel
 * ----------------
 * Renders the thread list in the sidebar, grouped by recency.
 * Props:
 *   threads         — [{ thread_id, title, updated_at, mode }]
 *   currentThreadId — string | null
 *   onSelectThread  — (thread_id) => void
 *   onRenameThread  — (thread_id, newTitle) => void
 *   onDeleteThread  — (thread_id) => void
 */
export default function ChatHistoryPanel({
  threads = [],
  currentThreadId,
  onSelectThread,
  onRenameThread,
  onDeleteThread,
}) {
  const [editingId, setEditingId]       = useState(null);
  const [editingTitle, setEditingTitle] = useState('');

  const startEdit = (e, thread) => {
    e.stopPropagation();
    setEditingId(thread.thread_id);
    setEditingTitle(thread.title);
  };

  const commitEdit = (e) => {
    e?.stopPropagation();
    if (editingTitle.trim()) onRenameThread(editingId, editingTitle.trim());
    setEditingId(null);
  };

  const cancelEdit = (e) => {
    e?.stopPropagation();
    setEditingId(null);
  };

  const handleDelete = (e, thread_id) => {
    e.stopPropagation();
    onDeleteThread(thread_id);
  };

  // Bucket threads into Today / Previous 7 days / Older
  const groupLabel = (iso) => {
    if (!iso) return 'Older';
    const d = new Date(iso);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    if (d >= startOfToday) return 'Today';
    if (startOfToday - d < 7 * 24 * 60 * 60 * 1000) return 'Previous 7 days';
    return 'Older';
  };

  const groups = [];
  threads.forEach((t) => {
    const label = groupLabel(t.updated_at);
    const group = groups.find((g) => g.label === label);
    if (group) group.items.push(t);
    else groups.push({ label, items: [t] });
  });

  if (threads.length === 0) {
    return <div className="thread-empty">Your chats will appear here.</div>;
  }

  return (
    <nav className="thread-list" aria-label="Chat history">
      {groups.map((g) => (
        <div key={g.label} className="thread-group">
          <div className="thread-group__label">{g.label}</div>
          {g.items.map((t) => (
            <div
              key={t.thread_id}
              className={`thread-item ${t.thread_id === currentThreadId ? 'active' : ''}`}
              onClick={() => onSelectThread(t.thread_id)}
              onKeyDown={(e) => { if (e.key === 'Enter' && editingId !== t.thread_id) onSelectThread(t.thread_id); }}
              role="button"
              tabIndex={0}
            >
              {editingId === t.thread_id ? (
                <input
                  className="thread-rename-input"
                  value={editingTitle}
                  autoFocus
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === 'Enter')  commitEdit(e);
                    if (e.key === 'Escape') cancelEdit(e);
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="thread-item__title">{t.title || 'Untitled'}</span>
              )}

              <div className="thread-item__actions">
                {editingId === t.thread_id ? (
                  <>
                    <button className="thread-action-btn" onClick={commitEdit} title="Save name" aria-label="Save name">
                      <Check size={13} />
                    </button>
                    <button className="thread-action-btn" onClick={cancelEdit} title="Cancel" aria-label="Cancel">
                      <X size={13} />
                    </button>
                  </>
                ) : (
                  <>
                    <button className="thread-action-btn" onClick={(e) => startEdit(e, t)} title="Rename" aria-label="Rename chat">
                      <Pencil size={13} />
                    </button>
                    <button className="thread-action-btn danger" onClick={(e) => handleDelete(e, t.thread_id)} title="Delete" aria-label="Delete chat">
                      <Trash2 size={13} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}
    </nav>
  );
}
