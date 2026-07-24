import React, { useState } from 'react';
import { MessageSquare, Pencil, Trash2, Check, X } from 'lucide-react';

/**
 * ChatHistoryPanel
 * ----------------
 * Renders the thread list in the sidebar.
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

  const formatDate = (iso) => {
    if (!iso) return '';
    const d   = new Date(iso);
    const now = new Date();
    const diffH = (now - d) / (1000 * 60 * 60);
    if (diffH < 24)     return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffH < 24 * 7) return d.toLocaleDateString([], { weekday: 'short' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="chat-history-panel">
      <div className="chat-history-header">
        <span className="settings-label" style={{ marginBottom: 0 }}>Chat History</span>
      </div>

      <div className="thread-list">
        {threads.length === 0 && (
          <div className="thread-empty">No previous chats</div>
        )}
        {threads.map((t) => (
          <div
            key={t.thread_id}
            className={`thread-item ${t.thread_id === currentThreadId ? 'active' : ''}`}
            onClick={() => onSelectThread(t.thread_id)}
          >
            <MessageSquare size={13} className="thread-icon" />

            <div className="thread-item__body">
              {editingId === t.thread_id ? (
                <input
                  className="thread-rename-input"
                  value={editingTitle}
                  autoFocus
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter')  commitEdit(e);
                    if (e.key === 'Escape') cancelEdit(e);
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="thread-item__title">{t.title || 'Untitled'}</span>
              )}
              <span className="thread-item__date">{formatDate(t.updated_at)}</span>
            </div>

            <div className="thread-item__actions">
              {editingId === t.thread_id ? (
                <>
                  <button className="thread-action-btn" onClick={commitEdit} title="Save">
                    <Check size={12} />
                  </button>
                  <button className="thread-action-btn" onClick={cancelEdit} title="Cancel">
                    <X size={12} />
                  </button>
                </>
              ) : (
                <>
                  <button className="thread-action-btn" onClick={(e) => startEdit(e, t)} title="Rename">
                    <Pencil size={12} />
                  </button>
                  <button className="thread-action-btn danger" onClick={(e) => handleDelete(e, t.thread_id)} title="Delete">
                    <Trash2 size={12} />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
