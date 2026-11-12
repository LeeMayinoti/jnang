import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowUp, Plus, PanelLeftClose } from 'lucide-react';
import Header from './components/Header';
import ChatHistoryPanel from './components/ChatHistoryPanel';
import PipelineBeads from './components/PipelineBeads';
import StoryCard from './components/StoryCard';
import EvaluationCard from './components/EvaluationCard';
import { PRESET_THEMES, SAMPLE_STORIES } from './data/themes';

const WELCOME_MESSAGE = {
  id: 'welcome',
  sender: 'bot',
  text: "Hello! Welcome to the Ju|'hoansi Narrative Agentic Studio (jnang). I coordinate a 3-agent pipeline (Generator, Classifier, Grader) to create and analyze oral folktales.\n\nHow would you like to start today?",
  options: [
    { label: 'Generate a new story', value: 'mode_generate' },
    { label: 'Analyze my own story', value: 'mode_enter' },
  ],
};

const MOBILE_QUERY = '(max-width: 768px)';
const isMobile = () => window.matchMedia?.(MOBILE_QUERY).matches ?? false;

// Render **bold** spans in plain-text bot messages
const renderInline = (text) =>
  text.split(/(\*\*[^*]+\*\*)/g).map((part, idx) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={idx}>{part.slice(2, -2)}</strong>
      : part
  );

export default function App() {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('jnang-theme');
      if (saved) return saved;
    } catch (_) {}
    return 'dark';
  });
  const [sidebarOpen, setSidebarOpen]         = useState(() => !isMobile());
  const [activeMode, setActiveMode]           = useState('generate');
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [inputText, setInputText]             = useState('');
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [pipelineStep, setPipelineStep]       = useState(0);
  const [messages, setMessages]               = useState([WELCOME_MESSAGE]);

  // Thread / history state
  const [threads, setThreads]                 = useState([]);
  const [currentThreadId, setCurrentThreadId] = useState(null);

  const messagesEndRef = useRef(null);
  const textareaRef    = useRef(null);

  const isEmpty = messages.length === 1 && messages[0].id === 'welcome';

  // -------------------------------------------------------------------------
  // Theme
  // -------------------------------------------------------------------------
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('jnang-theme', theme); } catch (_) {}
  }, [theme]);

  const toggleTheme = () => setTheme((p) => (p === 'light' ? 'dark' : 'light'));

  // -------------------------------------------------------------------------
  // Scroll + composer auto-grow
  // -------------------------------------------------------------------------
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
    el.style.overflowY = el.scrollHeight > 240 ? 'auto' : 'hidden';
  }, [inputText]);

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
      }
    })();
  }, [isBackendOnline]); // eslint-disable-line

  // -------------------------------------------------------------------------
  // Thread event handlers (passed to ChatHistoryPanel)
  // -------------------------------------------------------------------------
  const closeSidebarOnMobile = () => { if (isMobile()) setSidebarOpen(false); };

  const handleNewChat = async () => {
    await createNewThread(activeMode);
    setPipelineStep(0);
    closeSidebarOnMobile();
    textareaRef.current?.focus();
  };

  const handleSelectThread = async (thread_id) => {
    closeSidebarOnMobile();
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
  // Option click handler (in-chat option chips)
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
          text: "Great! Let's generate an authentic Ju|'hoansi story. Pick one of the traditional narrative themes below, or describe your own in the message box:",
          options: PRESET_THEMES.map((t) => ({ label: t.title, value: `theme_${t.id}` })),
        },
      ]);
    } else if (optionValue === 'mode_enter') {
      setActiveMode('enter');
      setMessages((prev) => [
        ...prev,
        { id: `user-ent-${Date.now()}`, sender: 'user', text: 'I want to analyze my own story.' },
        {
          id: `bot-ent-${Date.now()}`,
          sender: 'bot',
          text: 'Paste your story into the message box, or load a sample to see the structural analysis:',
          options: SAMPLE_STORIES.map((s) => ({ label: `Load "${s.title}"`, value: `sample_${s.id}` })),
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
    const updateBot = (patch) =>
      setMessages((prev) => prev.map((m) => (m.id === botMsgId ? { ...m, ...patch } : m)));

    setMessages((prev) => [
      ...prev,
      { id: `user-prompt-${Date.now()}`, sender: 'user', text: `Generate a story about: ${title}` },
      { id: botMsgId, sender: 'bot', text: '', run: 'generate', pending: true },
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
        const data = await res.json();
        setPipelineStep(3);

        setPipelineStep(4);
        updateBot({
          pending: false,
          text: 'Here is the finished story and pipeline analysis:',
          story: { title, text: data.draft_narrative },
          analysis: { motifemes: data.motifemes || [], moves: data.story_moves || [], grade: data.grade_report || {} },
        });

        await fetchThreads();
      } else {
        // Offline simulation
        await new Promise((r) => setTimeout(r, 800));
        setPipelineStep(2);
        await new Promise((r) => setTimeout(r, 850));
        setPipelineStep(3);
        await new Promise((r) => setTimeout(r, 800));
        setPipelineStep(4);

        const sampleNarrative = `In the ancient n!ore (territory) of the red dunes, an elder named !Kobo found a hidden hollow tree filled with golden zo (honey). Following the custom of his ancestors, he blew the horn to summon his age-mates (!xo) and family. Together they shared the sweet zo, ensuring that no one went hungry in the camp. Because of his generosity, the ancestral spirits (g//awasi) blessed the waterhole with gentle summer rain.`;
        updateBot({
          pending: false,
          text: 'Here is the finished story and pipeline analysis (offline simulation):',
          story: { title, text: sampleNarrative },
          analysis: {
            motifemes: initialMotifs,
            moves: ['Hero discovers resource in bush', 'Community obligation honored', 'Resource shared equitably at camp', 'Ancestral spirits grant blessing'],
            grade: {
              egalitarianism_score: 9.0, food_sharing_score: 9.5, kinship_score: 8.0,
              cultural_authenticity_score: 8.8, motifeme_score: 8.6, overall_grade: 'Excellent',
            },
          },
        });
      }
    } catch (err) {
      setPipelineStep(0);
      updateBot({
        pending: false,
        error: true,
        text: `The pipeline stopped: ${err.message}. Check that the FastAPI backend is running on port 8000, then try again.`,
      });
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
    const updateBot = (patch) =>
      setMessages((prev) => prev.map((m) => (m.id === botMsgId ? { ...m, ...patch } : m)));

    setMessages((prev) => [
      ...prev,
      {
        id: `user-story-${Date.now()}`,
        sender: 'user',
        text: storyText.length > 280 ? `${storyText.substring(0, 280)}…` : storyText,
      },
      { id: botMsgId, sender: 'bot', text: '', run: 'analyze', pending: true },
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

        const gradeRes = await fetch('/api/agents/grader', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ draft_narrative: storyText, motifemes: classData.motifemes, story_moves: classData.story_moves }),
        });
        const gradeData = gradeRes.ok ? await gradeRes.json() : { grade_report: {} };

        setPipelineStep(4);
        updateBot({
          pending: false,
          text: 'Here is the structural and cultural evaluation:',
          story: { title, text: storyText },
          analysis: { motifemes: classData.motifemes || [], moves: classData.story_moves || [], grade: gradeData.grade_report || {} },
        });
      } else {
        await new Promise((r) => setTimeout(r, 800));
        setPipelineStep(3);
        await new Promise((r) => setTimeout(r, 700));
        setPipelineStep(4);
        updateBot({
          pending: false,
          text: 'Here is the structural and cultural evaluation (offline simulation):',
          story: { title, text: storyText },
          analysis: {
            motifemes: ['Lack', 'Interdiction', 'Violation', 'Consequence', 'Lack Liquidated'],
            moves: ['Character enters bush territory', 'Interdiction broken by protagonist', 'Community elders intervene', 'Sharing order restored'],
            grade: {
              egalitarianism_score: 8.5, food_sharing_score: 9.5, kinship_score: 8.0,
              cultural_authenticity_score: 8.7, motifeme_score: 8.4, overall_grade: 'Good',
            },
          },
        });
      }
    } catch (err) {
      setPipelineStep(0);
      updateBot({ pending: false, error: true, text: `The analysis stopped: ${err.message}` });
    } finally {
      setPipelineRunning(false);
    }
  };

  // -------------------------------------------------------------------------
  // Send handler
  // -------------------------------------------------------------------------
  const handleSendMessage = () => {
    if (!inputText.trim() || pipelineRunning) return;
    const text = inputText;
    setInputText('');
    if (activeMode === 'generate') {
      runGenerationPipeline('Custom Theme Generation', text, ['Lack', 'Mediation', 'Lack Liquidated']);
    } else {
      runAnalysisPipeline('Your story', text);
    }
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  const currentTitle = threads.find((t) => t.thread_id === currentThreadId)?.title || 'New chat';

  const composer = (
    <div className="composer-dock">
      <div className="composer">
        <textarea
          ref={textareaRef}
          className="composer__input"
          rows={1}
          placeholder={activeMode === 'generate' ? 'Describe a theme for a new story…' : 'Paste a story to analyze…'}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          aria-label="Message"
        />
        <button
          className="composer__send"
          onClick={handleSendMessage}
          disabled={pipelineRunning || !inputText.trim()}
          title="Send (Enter)"
          aria-label="Send"
        >
          <ArrowUp size={18} strokeWidth={2.25} />
        </button>
      </div>
      <p className="composer__note">
        Enter to send, Shift+Enter for a new line. Generated stories can misstate cultural details; check them against the source collections.
      </p>
    </div>
  );

  return (
    <div className={`app ${sidebarOpen ? 'sidebar-open' : ''}`}>
      {/* Sidebar */}
      <aside className="sidebar" aria-hidden={!sidebarOpen}>
        <div className="sidebar__top">
          <div className="brand">
            <span className="bead bead--brand" aria-hidden="true" />
            <span className="brand__name">jnang</span>
          </div>
          <button className="icon-btn" onClick={() => setSidebarOpen(false)} title="Close sidebar" aria-label="Close sidebar">
            <PanelLeftClose size={18} />
          </button>
        </div>

        <button className="new-chat-btn" onClick={handleNewChat}>
          <Plus size={16} />
          <span>New chat</span>
        </button>

        <div className="sidebar__scroll">
          <ChatHistoryPanel
            threads={threads}
            currentThreadId={currentThreadId}
            onSelectThread={handleSelectThread}
            onRenameThread={handleRenameThread}
            onDeleteThread={handleDeleteThread}
          />
        </div>

        <div className="sidebar__footer">
          <span className={`status-dot ${isBackendOnline ? 'on' : 'off'}`} />
          <span>{isBackendOnline ? 'Pipeline connected' : 'Offline · simulated results'}</span>
        </div>
      </aside>
      <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />

      {/* Main */}
      <main className="main">
        <Header
          title={currentTitle}
          showSidebarToggle={!sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(true)}
          activeMode={activeMode}
          onModeChange={setActiveMode}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        {isEmpty ? (
          <div className="empty">
            <div className="empty__inner">
              <h1 className="empty__title">
                {activeMode === 'generate' ? 'Which story shall we tell?' : 'Which story shall we read?'}
              </h1>
              <p className="empty__lede">
                {activeMode === 'generate'
                  ? 'Pick a traditional theme or describe your own. The Generator drafts it, the Classifier maps its motifemes, and the Grader scores its cultural authenticity.'
                  : 'Paste a story below or load a sample. The Classifier maps its Dundes motifemes and Propp moves, then the Grader scores its cultural authenticity.'}
              </p>

              {composer}

              <div className="starters">
                {activeMode === 'generate'
                  ? PRESET_THEMES.map((t) => (
                      <button key={t.id} className="starter" onClick={() => runGenerationPipeline(t.title, t.defaultPrompt, t.motifs)}>
                        {t.image && (
                          <div className="starter__media">
                            <img src={t.image} alt={t.imageAlt || t.title} loading="lazy" />
                          </div>
                        )}
                        <div className="starter__body">
                          <span className="starter__title">{t.title}</span>
                          <span className="starter__desc">{t.description}</span>
                        </div>
                      </button>
                    ))
                  : SAMPLE_STORIES.map((s) => (
                      <button key={s.id} className="starter" onClick={() => runAnalysisPipeline(s.title, s.text)}>
                        {s.image && (
                          <div className="starter__media">
                            <img src={s.image} alt={s.imageAlt || s.title} loading="lazy" />
                          </div>
                        )}
                        <div className="starter__body">
                          <span className="starter__title">{s.title}</span>
                          <span className="starter__desc">{s.text}</span>
                        </div>
                      </button>
                    ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="conversation">
              <div className="thread">
                {messages.map((msg) => (
                  <div key={msg.id} className={`msg msg--${msg.sender}`}>
                    {msg.sender === 'bot' && (
                      <div className="msg__avatar" aria-hidden="true"><span className="bead bead--brand" /></div>
                    )}
                    <div className="msg__content">
                      {msg.run && !msg.error && (
                        <PipelineBeads run={msg.run} step={msg.pending ? pipelineStep : 4} />
                      )}

                      {msg.text && (
                        <div className={`msg__text ${msg.error ? 'msg__text--error' : ''}`}>{renderInline(msg.text)}</div>
                      )}

                      {msg.options && (
                        <div className="option-chips">
                          {msg.options.map((opt, idx) => (
                            <button key={idx} className="option-chip" onClick={() => handleOptionClick(opt.value)} disabled={pipelineRunning}>
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      )}

                      {msg.story && <StoryCard story={msg.story} />}
                      {msg.analysis && <EvaluationCard analysis={msg.analysis} />}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>
            {composer}
          </>
        )}
      </main>
    </div>
  );
}
