import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, Search, Menu, ChevronsRight } from 'lucide-react';
import Header from './components/Header';
import Meteors from './components/Meteors';
import ChatHistoryPanel from './components/ChatHistoryPanel';
import { PRESET_THEMES, SAMPLE_STORIES } from './data/themes';

const WELCOME_MESSAGE = {
  id: 'welcome',
  sender: 'bot',
  text: "Hello! Welcome to the Ju|'hoansi Narrative Agentic Studio (jnang). I coordinate a 3-agent pipeline (Generator, Classifier, Grader) to create and analyze oral folktales.\n\nHow would you like to start today?",
  options: [
    { label: '🤖 Generate New Story', value: 'mode_generate' },
    { label: '📝 Enter Custom Story', value: 'mode_enter' },
  ],
};

export default function App() {
  const [theme, setTheme]                     = useState('dark');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeMode, setActiveMode]           = useState('generate');
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [inputText, setInputText]             = useState('');
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [pipelineStep, setPipelineStep]       = useState(0);
  const [messages, setMessages]               = useState([WELCOME_MESSAGE]);

  // Thread / history state
  const [threads, setThreads]               = useState([]);
  const [currentThreadId, setCurrentThreadId] = useState(null);
  const [loadingThreads, setLoadingThreads] = useState(false);

  const messagesEndRef = useRef(null);

  // -------------------------------------------------------------------------
  // Theme
  // -------------------------------------------------------------------------
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((p) => (p === 'light' ? 'dark' : 'light'));

  // -------------------------------------------------------------------------
  // Scroll
  // -------------------------------------------------------------------------
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // -------------------------------------------------------------------------
  // Backend health check
  // -------------------------------------------------------------------------
  useEffect(() => {
    fetch('/api/health')
      .then((r) => setIsBackendOnline(r.ok))
      .catch(() => setIsBackendOnline(false));
  }, []);

  // -------------------------------------------------------------------------
  // Thread helpers
  // -------------------------------------------------------------------------
  const fetchThreads = useCallback(async () => {
    try {
      const r = await fetch('/api/threads');
      if (r.ok) setThreads(await r.json());
    } catch (_) {}
  }, []);

  const createNewThread = useCallback(async (mode = 'generate') => {
    try {
      const r = await fetch('/api/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Chat', mode }),
      });
      if (r.ok) {
        const t = await r.json();
        setCurrentThreadId(t.thread_id);
        setMessages([WELCOME_MESSAGE]);
        setActiveMode(mode);
        await fetchThreads();
        return t.thread_id;
      }
    } catch (_) {}
    // Fallback: local-only id
    const id = crypto.randomUUID?.() || String(Date.now());
    setCurrentThreadId(id);
    setMessages([WELCOME_MESSAGE]);
    return id;
  }, [fetchThreads]);

  const loadThread = useCallback(async (thread_id) => {
    try {
      const r = await fetch(`/api/threads/${thread_id}`);
      if (!r.ok) return;
      const data = await r.json();
      setCurrentThreadId(thread_id);
      setActiveMode(data.mode || 'generate');

      if (!data.messages || data.messages.length === 0) {
        setMessages([WELCOME_MESSAGE]);
        return;
      }

      // Reconstruct display messages from persisted rows
      const rebuilt = data.messages.map((m) => ({
        id: `persisted-${m.id}`,
        sender: m.sender,
        text: m.text,
        ...(m.payload?.story    ? { story: m.payload.story }       : {}),
        ...(m.payload?.analysis ? { analysis: m.payload.analysis } : {}),
        ...(m.payload?.options  ? { options: m.payload.options }   : {}),
      }));
      setMessages(rebuilt);
    } catch (_) {}
  }, []);

  // Bootstrap: load threads on mount, pick or create the first one
  useEffect(() => {
    if (!isBackendOnline) return;

    (async () => {
      setLoadingThreads(true);
      try {
        const r = await fetch('/api/threads');
        if (r.ok) {
          const list = await r.json();
          setThreads(list);
          if (list.length > 0) {
            await loadThread(list[0].thread_id);
          } else {
            await createNewThread('generate');
          }
        }
      } catch (_) {
        // Offline mode — no thread needed
      } finally {
        setLoadingThreads(false);
      }
    })();
  }, [isBackendOnline]); // eslint-disable-line

  // -------------------------------------------------------------------------
  // Thread event handlers (passed to ChatHistoryPanel)
  // -------------------------------------------------------------------------
  const handleNewChat = async () => {
    await createNewThread(activeMode);
    setPipelineStep(0);
  };

  const handleSelectThread = async (thread_id) => {
    if (thread_id === currentThreadId) return;
    setPipelineStep(0);
    await loadThread(thread_id);
  };

  const handleRenameThread = async (thread_id, newTitle) => {
    try {
      await fetch(`/api/threads/${thread_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      });
      await fetchThreads();
    } catch (_) {}
  };

  const handleDeleteThread = async (thread_id) => {
    try {
      await fetch(`/api/threads/${thread_id}`, { method: 'DELETE' });
      const updated = threads.filter((t) => t.thread_id !== thread_id);
      setThreads(updated);
      if (thread_id === currentThreadId) {
        if (updated.length > 0) {
          await loadThread(updated[0].thread_id);
        } else {
          await createNewThread('generate');
        }
      }
    } catch (_) {}
  };

  // -------------------------------------------------------------------------
  // Option click handler
  // -------------------------------------------------------------------------
  const handleOptionClick = (optionValue) => {
    if (optionValue === 'mode_generate') {
      setActiveMode('generate');
      setMessages((prev) => [
        ...prev,
        { id: `user-gen-${Date.now()}`, sender: 'user', text: 'I want to generate a new story.' },
        {
          id: `bot-gen-${Date.now()}`,
          sender: 'bot',
          text: "Great! Let's generate an authentic Ju|'hoansi story. Please select one of the traditional narrative themes below, or type your own custom seed in the chat:",
          options: PRESET_THEMES.map((t) => ({ label: `${t.icon} ${t.title}`, value: `theme_${t.id}` })),
        },
      ]);
    } else if (optionValue === 'mode_enter') {
      setActiveMode('enter');
      setMessages((prev) => [
        ...prev,
        { id: `user-ent-${Date.now()}`, sender: 'user', text: 'I want to write/enter my own story.' },
        {
          id: `bot-ent-${Date.now()}`,
          sender: 'bot',
          text: 'Please paste your custom story text into the chat bar, or load one of the presets to test structural analysis:',
          options: SAMPLE_STORIES.map((s) => ({ label: `📖 Load "${s.title}"`, value: `sample_${s.id}` })),
        },
      ]);
    } else if (optionValue.startsWith('theme_')) {
      const selected = PRESET_THEMES.find((t) => t.id === optionValue.replace('theme_', ''));
      if (selected) runGenerationPipeline(selected.title, selected.defaultPrompt, selected.motifs);
    } else if (optionValue.startsWith('sample_')) {
      const selected = SAMPLE_STORIES.find((s) => s.id === optionValue.replace('sample_', ''));
      if (selected) runAnalysisPipeline(selected.title, selected.text);
    }
  };

  // -------------------------------------------------------------------------
  // Generation pipeline
  // -------------------------------------------------------------------------
  const runGenerationPipeline = async (title, promptString, initialMotifs) => {
    setPipelineRunning(true);
    setPipelineStep(1);

    const botMsgId = `bot-result-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: `user-prompt-${Date.now()}`, sender: 'user', text: `Generate a story about: ${title}` },
      { id: botMsgId, sender: 'bot', text: `Running the 3-agent pipeline...\n\n⚡ **Agent 1 (Generator)**: Crafting draft narrative...` },
    ]);

    try {
      if (isBackendOnline) {
        const threadId = currentThreadId || await createNewThread('generate');
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ theme: promptString, thread_id: threadId }),
        });

        if (!res.ok) throw new Error(`Server returned ${res.status}`);

        setPipelineStep(2);
        setMessages((prev) => prev.map((m) => m.id === botMsgId
          ? { ...m, text: `Running the 3-agent pipeline...\n\n⚡ **Agent 1 (Generator)**: Narrative draft complete.\n⚡ **Agent 2 (Classifier)**: Extracting Dundes motifemes...` }
          : m));

        const data = await res.json();

        setPipelineStep(3);
        setMessages((prev) => prev.map((m) => m.id === botMsgId
          ? { ...m, text: `Running the 3-agent pipeline...\n\n⚡ **Agent 1 (Generator)**: Narrative draft complete.\n⚡ **Agent 2 (Classifier)**: Motifemes extracted.\n⚡ **Agent 3 (Grader)**: Evaluation report loading...` }
          : m));

        setPipelineStep(4);
        setMessages((prev) => prev.map((m) => m.id === botMsgId
          ? {
              ...m,
              text: 'Here is the finished story and pipeline analysis:',
              story: { title, text: data.draft_narrative },
              analysis: { motifemes: data.motifemes || [], moves: data.story_moves || [], grade: data.grade_report || {} },
            }
          : m));

        await fetchThreads();
      } else {
        // Offline simulation
        await new Promise((r) => setTimeout(r, 800));
        setPipelineStep(2);
        setMessages((prev) => prev.map((m) => m.id === botMsgId
          ? { ...m, text: `Running the 3-agent pipeline...\n\n⚡ **Agent 1 (Generator)**: Narrative draft complete.\n⚡ **Agent 2 (Classifier)**: Extracting Dundes motifemes...` }
          : m));

        await new Promise((r) => setTimeout(r, 850));
        setPipelineStep(3);
        setMessages((prev) => prev.map((m) => m.id === botMsgId
          ? { ...m, text: `Running the 3-agent pipeline...\n\n⚡ **Agent 1 (Generator)**: Narrative draft complete.\n⚡ **Agent 2 (Classifier)**: Motifemes extracted.\n⚡ **Agent 3 (Grader)**: Evaluation report loading...` }
          : m));

        await new Promise((r) => setTimeout(r, 800));
        setPipelineStep(4);

        const sampleNarrative = `In the ancient n!ore (territory) of the red dunes, an elder named !Kobo found a hidden hollow tree filled with golden zo (honey). Following the custom of his ancestors, he blew the horn to summon his age-mates (!xo) and family. Together they shared the sweet zo, ensuring that no one went hungry in the camp. Because of his generosity, the ancestral spirits (g//awasi) blessed the waterhole with gentle summer rain.`;
        setMessages((prev) => prev.map((m) => m.id === botMsgId
          ? {
              ...m,
              text: 'Here is the finished story and pipeline analysis:',
              story: { title, text: sampleNarrative },
              analysis: {
                motifemes: initialMotifs,
                moves: ['Hero discovers resource in bush', 'Community obligation honored', 'Resource shared equitably at camp', 'Ancestral spirits grant blessing'],
                grade: { overall_score: 9.2, cultural_authenticity: 9.5, structural_integrity: 9.0, narrative_coherence: 9.1 },
              },
            }
          : m));
      }
    } catch (err) {
      setPipelineStep(0);
      setMessages((prev) => prev.map((m) => m.id === botMsgId
        ? { ...m, text: `⚠️ Pipeline execution failed: ${err.message}. Please verify the FastAPI backend is running.` }
        : m));
    } finally {
      setPipelineRunning(false);
    }
  };

  // -------------------------------------------------------------------------
  // Analysis pipeline
  // -------------------------------------------------------------------------
  const runAnalysisPipeline = async (title, storyText) => {
    setPipelineRunning(true);
    setPipelineStep(2);

    const botMsgId = `bot-result-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: `user-story-${Date.now()}`, sender: 'user', text: `Here is my custom story:\n\n${storyText.substring(0, 150)}...` },
      { id: botMsgId, sender: 'bot', text: `Analyzing text...\n\n⚡ **Agent 2 (Classifier)**: Parsing structural motifemes & moves...` },
    ]);

    try {
      if (isBackendOnline) {
        const classRes = await fetch('/api/agents/classifier', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ draft_narrative: storyText }),
        });
        const classData = classRes.ok ? await classRes.json() : { motifemes: [], story_moves: [] };

        setPipelineStep(3);
        setMessages((prev) => prev.map((m) => m.id === botMsgId
          ? { ...m, text: `Analyzing text...\n\n⚡ **Agent 2 (Classifier)**: Structural classification finished.\n⚡ **Agent 3 (Grader)**: Evaluating cultural integrity...` }
          : m));

        const gradeRes = await fetch('/api/agents/grader', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ draft_narrative: storyText, motifemes: classData.motifemes, story_moves: classData.story_moves }),
        });
        const gradeData = gradeRes.ok ? await gradeRes.json() : { grade_report: {} };

        setPipelineStep(4);
        setMessages((prev) => prev.map((m) => m.id === botMsgId
          ? {
              ...m,
              text: 'Here is the structural and cultural evaluation:',
              story: { title: 'Custom Story Input', text: storyText },
              analysis: { motifemes: classData.motifemes || [], moves: classData.story_moves || [], grade: gradeData.grade_report || {} },
            }
          : m));
      } else {
        await new Promise((r) => setTimeout(r, 800));
        setPipelineStep(3);
        setMessages((prev) => prev.map((m) => m.id === botMsgId
          ? { ...m, text: `Analyzing text...\n\n⚡ **Agent 2 (Classifier)**: Structural classification finished.\n⚡ **Agent 3 (Grader)**: Evaluating cultural integrity...` }
          : m));

        await new Promise((r) => setTimeout(r, 700));
        setPipelineStep(4);
        setMessages((prev) => prev.map((m) => m.id === botMsgId
          ? {
              ...m,
              text: 'Here is the structural and cultural evaluation:',
              story: { title: 'Custom Story Input', text: storyText },
              analysis: {
                motifemes: ['Lack', 'Interdiction', 'Violation', 'Consequence', 'Lack Liquidated'],
                moves: ['Character enters bush territory', 'Interdiction broken by protagonist', 'Community elders intervene', 'Sharing order restored'],
                grade: { overall_score: 8.7, cultural_authenticity: 9.1, structural_integrity: 8.4, narrative_coherence: 8.6 },
              },
            }
          : m));
      }
    } catch (err) {
      setPipelineStep(0);
      setMessages((prev) => prev.map((m) => m.id === botMsgId
        ? { ...m, text: `⚠️ Analysis failed: ${err.message}` }
        : m));
    } finally {
      setPipelineRunning(false);
    }
  };

  // -------------------------------------------------------------------------
  // Send handler
  // -------------------------------------------------------------------------
  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    const text = inputText;
    setInputText('');
    if (activeMode === 'generate') {
      runGenerationPipeline('Custom Theme Generation', text, ['Lack', 'Mediation', 'Lack Liquidated']);
    } else {
      runAnalysisPipeline('Custom Text Input', text);
    }
  };

  // -------------------------------------------------------------------------
  // Ju|'hoan term highlighting
  // -------------------------------------------------------------------------
  const renderFormattedStory = (text) => {
    if (!text) return null;
    const regex = /([\w!\|\/\'\-]+\s*\([\w\s\-\/\'\!]+\))/g;
    const parts = text.split(regex);
    return parts.map((part, idx) =>
      regex.test(part) ? <span key={idx} className="juhoansi-term">{part}</span> : part
    );
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="app-wrapper">
      <Header
        isOnline={isBackendOnline}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <div className="chat-layout">
        {/* Sidebar */}
        <aside
          className={`chat-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}
          onClick={() => sidebarCollapsed && setSidebarCollapsed(false)}
          title={sidebarCollapsed ? 'Click to expand' : ''}
        >
          {/* 1. Chat History */}
          {!sidebarCollapsed && (
            <ChatHistoryPanel
              threads={threads}
              currentThreadId={currentThreadId}
              onSelectThread={handleSelectThread}
              onRenameThread={handleRenameThread}
              onDeleteThread={handleDeleteThread}
            />
          )}

          {/* 2. Divider */}
          {!sidebarCollapsed && <div className="sidebar-divider" />}

          {/* 3. New Chat button */}
          <button className="btn-reset" onClick={handleNewChat}>
            <i className="fa-solid fa-plus"></i>
            <span>New Chat</span>
          </button>

          {/* 4. Divider */}
          {!sidebarCollapsed && <div className="sidebar-divider" />}

          {/* 5. Active Mode segmented toggle */}
          <div className="settings-group">
            <span className="settings-label">Active Mode</span>
            <div className="mode-toggle" role="tablist">
              <button
                role="tab"
                aria-selected={activeMode === 'generate'}
                className={`mode-toggle__btn ${activeMode === 'generate' ? 'active' : ''}`}
                onClick={() => handleOptionClick('mode_generate')}
              >
                <Sparkles size={14} />
                <span>Generate</span>
              </button>
              <button
                role="tab"
                aria-selected={activeMode === 'enter'}
                className={`mode-toggle__btn ${activeMode === 'enter' ? 'active' : ''}`}
                onClick={() => handleOptionClick('mode_enter')}
              >
                <Search size={14} />
                <span>Analyze</span>
              </button>
            </div>
          </div>

          {/* 6. Pipeline status */}
          <div className="settings-group">
            <span className="settings-label">3-Agent Pipeline Status</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
              {[
                { label: 'Generator Agent',  step: 1 },
                { label: 'Classifier Agent', step: 2 },
                { label: 'Grader Agent',     step: 3 },
              ].map(({ label, step }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <i
                    className={`fa-solid ${pipelineStep >= step ? 'fa-circle-check' : pipelineStep === step ? 'fa-spinner fa-spin' : 'fa-circle'}`}
                    style={{ color: pipelineStep >= step ? 'var(--accent-emerald)' : 'var(--text-muted)' }}
                  />
                  <span style={{ color: pipelineStep === step ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 7. Collapse button — always visible, sticks to bottom */}
          <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
            <button
              className="sidebar-collapse-btn"
              onClick={(e) => { e.stopPropagation(); setSidebarCollapsed(!sidebarCollapsed); }}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? <ChevronsRight size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </aside>

        {/* Chat canvas */}
        <section className="chat-canvas">
          <Meteors number={20} />

          <div className="messages-container">
            {messages.map((msg) => (
              <div key={msg.id} className={`message-row ${msg.sender}`}>
                <div className="message-bubble">
                  <div className="message-sender">
                    <i className={`fa-solid ${msg.sender === 'user' ? 'fa-user' : 'fa-robot'}`}></i>
                    <span>{msg.sender === 'user' ? 'You' : 'jnang assistant'}</span>
                  </div>

                  <div className="message-text">{msg.text}</div>

                  {msg.options && (
                    <div className="option-chips-container">
                      {msg.options.map((opt, idx) => (
                        <button key={idx} className="option-chip-btn" onClick={() => handleOptionClick(opt.value)}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {msg.story && (
                    <div className="embed-story-card">
                      <div className="embed-story-title">
                        <span>📖 {msg.story.title}</span>
                      </div>
                      <div className="embed-story-body">
                        {renderFormattedStory(msg.story.text)}
                      </div>
                    </div>
                  )}

                  {msg.analysis && (
                    <div className="embed-metrics-card">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                        <i className="fa-solid fa-award" style={{ color: 'var(--accent-gold)' }}></i>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Evaluation Report</span>
                      </div>

                      <div className="metric-card" style={{ padding: '0.75rem', marginBottom: '0.75rem' }}>
                        <div className="metric-header" style={{ marginBottom: '0.3rem' }}>
                          <span className="metric-title" style={{ fontSize: '0.8rem' }}>Overall Authenticity Score</span>
                          <span className="metric-score" style={{ fontSize: '1.1rem' }}>
                            {Number(msg.analysis.grade?.overall_score ?? 8.5).toFixed(1)}/10
                          </span>
                        </div>
                        <div className="progress-bar-bg" style={{ height: '6px' }}>
                          <div className="progress-bar-fill" style={{ width: `${(msg.analysis.grade?.overall_score ?? 8.5) * 10}%` }} />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                        <div className="metric-card" style={{ padding: '0.6rem', marginBottom: 0 }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Cultural</div>
                          <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--accent-emerald)' }}>
                            {Number(msg.analysis.grade?.cultural_authenticity ?? 9.0).toFixed(1)}
                          </div>
                        </div>
                        <div className="metric-card" style={{ padding: '0.6rem', marginBottom: 0 }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Structural</div>
                          <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--accent-purple)' }}>
                            {Number(msg.analysis.grade?.structural_integrity ?? 8.0).toFixed(1)}
                          </div>
                        </div>
                      </div>

                      <div style={{ marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Dundes Motifemes:</span>
                        <div className="motifeme-list" style={{ marginTop: '0.3rem', gap: '0.4rem' }}>
                          {msg.analysis.motifemes.map((m, idx) => (
                            <span key={idx} className="motif-chip" style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem' }}>{m}</span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Narrative Moves:</span>
                        <div style={{ marginTop: '0.3rem', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          {msg.analysis.moves.slice(0, 3).map((move, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-primary)' }}>
                              <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.6rem', color: 'var(--accent-gold)' }}></i>
                              <span>{move}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat footer */}
          <div className="chat-footer">
            <div className="suggestions-bar">
              <div className="suggestion-pill" onClick={() => handleOptionClick('mode_generate')}>
                <i className="fa-solid fa-wand-magic-sparkles" style={{ marginRight: '4px' }}></i> Generate Story
              </div>
              <div className="suggestion-pill" onClick={() => handleOptionClick('mode_enter')}>
                <i className="fa-solid fa-pen-to-square" style={{ marginRight: '4px' }}></i> Enter Story
              </div>
              <div className="suggestion-pill" onClick={() => handleOptionClick('theme_sharing_honey')}>
                🍯 Presets: Sharing Honey
              </div>
              <div className="suggestion-pill" onClick={() => handleOptionClick('theme_moon_life')}>
                🌙 Presets: The Moon Legend
              </div>
            </div>

            <div className="chat-input-wrapper">
              <input
                className="chat-textarea"
                placeholder={activeMode === 'generate' ? 'Type a custom theme seed...' : 'Type or paste your story text...'}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
              />
              <button
                className="chat-send-btn"
                onClick={handleSendMessage}
                disabled={pipelineRunning || !inputText.trim()}
              >
                <i className="fa-solid fa-paper-plane"></i>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
