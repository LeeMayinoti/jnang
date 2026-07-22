import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import Meteors from './components/Meteors';
import { PRESET_THEMES, SAMPLE_STORIES } from './data/themes';

export default function App() {
  const [theme, setTheme] = useState('dark'); // Default to dark for night sky vibe
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeMode, setActiveMode] = useState('generate'); // 'generate' | 'enter'
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [inputText, setInputText] = useState('');
  
  // Pipeline status for sidebar
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(0); // 0: idle, 1: generator, 2: classifier, 3: grader, 4: complete

  // Messages list state
  const [messages, setMessages] = useState([]);

  const messagesEndRef = useRef(null);

  // Sync theme attribute to <html> element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Scroll to bottom on new message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial welcome message
  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        sender: 'bot',
        text: "Hello! Welcome to the Ju|'hoansi Narrative Agentic Studio (jnang). I coordinate a 3-agent pipeline (Generator, Classifier, Grader) to create and analyze oral folktales.\n\nHow would you like to start today?",
        options: [
          { label: '🤖 Generate New Story', value: 'mode_generate' },
          { label: '📝 Enter Custom Story', value: 'mode_enter' }
        ]
      }
    ]);
  }, []);

  // Check backend health on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          setIsBackendOnline(true);
        } else {
          setIsBackendOnline(false);
        }
      } catch (err) {
        setIsBackendOnline(false);
      }
    };
    checkHealth();
  }, []);

  // Handle click on chat suggestion/option buttons
  const handleOptionClick = (optionValue) => {
    if (optionValue === 'mode_generate') {
      setActiveMode('generate');
      setMessages((prev) => [
        ...prev,
        { id: `user-gen-${Date.now()}`, sender: 'user', text: 'I want to generate a new story.' },
        {
          id: `bot-gen-${Date.now()}`,
          sender: 'bot',
          text: 'Great! Let\'s generate an authentic Ju|\'hoansi story. Please select one of the traditional narrative themes below, or type your own custom seed in the chat:',
          options: PRESET_THEMES.map((theme) => ({
            label: `${theme.icon} ${theme.title}`,
            value: `theme_${theme.id}`
          }))
        }
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
          options: SAMPLE_STORIES.map((sample) => ({
            label: `📖 Load "${sample.title}"`,
            value: `sample_${sample.id}`
          }))
        }
      ]);
    } else if (optionValue.startsWith('theme_')) {
      const themeId = optionValue.replace('theme_', '');
      const selected = PRESET_THEMES.find((t) => t.id === themeId);
      if (selected) {
        runGenerationPipeline(selected.title, selected.defaultPrompt, selected.motifs);
      }
    } else if (optionValue.startsWith('sample_')) {
      const sampleId = optionValue.replace('sample_', '');
      const selected = SAMPLE_STORIES.find((s) => s.id === sampleId);
      if (selected) {
        runAnalysisPipeline(selected.title, selected.text);
      }
    }
  };

  // Run full 3-agent generation pipeline
  const runGenerationPipeline = async (title, promptString, initialMotifs) => {
    setPipelineRunning(true);
    setPipelineStep(1); // Agent 1 Generator

    const userMsgId = `user-prompt-${Date.now()}`;
    const botMsgId = `bot-result-${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      { id: userMsgId, sender: 'user', text: `Generate a story about: ${title}` },
      { id: botMsgId, sender: 'bot', text: `Running the 3-agent pipeline...\n\n⚡ **Agent 1 (Generator)**: Crafting draft narrative...` }
    ]);

    try {
      if (isBackendOnline) {
        // Step 1: Call generation endpoint
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ theme: promptString }),
        });

        if (!res.ok) throw new Error(`Server returned ${res.status}`);

        setPipelineStep(2); // Agent 2 Classifier
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMsgId
              ? { ...msg, text: `Running the 3-agent pipeline...\n\n⚡ **Agent 1 (Generator)**: Narrative draft complete.\n⚡ **Agent 2 (Classifier)**: Extracting Dundes motifemes...` }
              : msg
          )
        );

        const data = await res.json();

        setPipelineStep(3); // Agent 3 Grader
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMsgId
              ? { ...msg, text: `Running the 3-agent pipeline...\n\n⚡ **Agent 1 (Generator)**: Narrative draft complete.\n⚡ **Agent 2 (Classifier)**: Motifemes extracted.\n⚡ **Agent 3 (Grader)**: Evaluation report loading...` }
              : msg
          )
        );

        setPipelineStep(4); // Complete
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMsgId
              ? {
                  ...msg,
                  text: `Here is the finished story and pipeline analysis:`,
                  story: { title, text: data.draft_narrative },
                  analysis: {
                    motifemes: data.motifemes || [],
                    moves: data.story_moves || [],
                    grade: data.grade_report || {}
                  }
                }
              : msg
          )
        );
      } else {
        // Fallback simulated execution
        await new Promise((r) => setTimeout(r, 800));
        setPipelineStep(2);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMsgId
              ? { ...msg, text: `Running the 3-agent pipeline...\n\n⚡ **Agent 1 (Generator)**: Narrative draft complete.\n⚡ **Agent 2 (Classifier)**: Extracting Dundes motifemes...` }
              : msg
          )
        );

        await new Promise((r) => setTimeout(r, 850));
        setPipelineStep(3);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMsgId
              ? { ...msg, text: `Running the 3-agent pipeline...\n\n⚡ **Agent 1 (Generator)**: Narrative draft complete.\n⚡ **Agent 2 (Classifier)**: Motifemes extracted.\n⚡ **Agent 3 (Grader)**: Evaluation report loading...` }
              : msg
          )
        );

        await new Promise((r) => setTimeout(r, 800));
        setPipelineStep(4);

        const sampleNarrative = `In the ancient n!ore (territory) of the red dunes, an elder named !Kobo found a hidden hollow tree filled with golden zo (honey). Following the custom of his ancestors, he blew the horn to summon his age-mates (!xo) and family. Together they shared the sweet zo, ensuring that no one went hungry in the camp. Because of his generosity, the ancestral spirits (g//awasi) blessed the waterhole with gentle summer rain.`;

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMsgId
              ? {
                  ...msg,
                  text: `Here is the finished story and pipeline analysis:`,
                  story: { title, text: sampleNarrative },
                  analysis: {
                    motifemes: initialMotifs,
                    moves: [
                      'Hero discovers resource in bush',
                      'Community obligation honored',
                      'Resource shared equitably at camp',
                      'Ancestral spirits grant blessing'
                    ],
                    grade: {
                      overall_score: 9.2,
                      cultural_authenticity: 9.5,
                      structural_integrity: 9.0,
                      narrative_coherence: 9.1
                    }
                  }
                }
              : msg
          )
        );
      }
    } catch (err) {
      setPipelineStep(0);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botMsgId
            ? { ...msg, text: `⚠️ Pipeline execution failed: ${err.message}. Please verify the FastAPI backend is running.` }
            : msg
        )
      );
    } finally {
      setPipelineRunning(false);
    }
  };

  // Run analysis pipeline on custom inputted story text
  const runAnalysisPipeline = async (title, storyText) => {
    setPipelineRunning(true);
    setPipelineStep(2); // Starts at Agent 2 Classifier

    const userMsgId = `user-story-${Date.now()}`;
    const botMsgId = `bot-result-${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      { id: userMsgId, sender: 'user', text: `Here is my custom story:\n\n${storyText.substring(0, 150)}...` },
      { id: botMsgId, sender: 'bot', text: `Analyzing text...\n\n⚡ **Agent 2 (Classifier)**: Parsing structural motifemes & moves...` }
    ]);

    try {
      if (isBackendOnline) {
        // Step 1: Classifier Agent
        const classRes = await fetch('/api/agents/classifier', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ draft_narrative: storyText }),
        });

        const classData = classRes.ok ? await classRes.json() : { motifemes: [], story_moves: [] };

        setPipelineStep(3); // Agent 3 Grader
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMsgId
              ? { ...msg, text: `Analyzing text...\n\n⚡ **Agent 2 (Classifier)**: Structural classification finished.\n⚡ **Agent 3 (Grader)**: Evaluating cultural integrity...` }
              : msg
          )
        );

        // Step 2: Grader Agent
        const gradeRes = await fetch('/api/agents/grader', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            draft_narrative: storyText,
            motifemes: classData.motifemes,
            story_moves: classData.story_moves,
          }),
        });

        const gradeData = gradeRes.ok ? await gradeRes.json() : { grade_report: {} };

        setPipelineStep(4);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMsgId
              ? {
                  ...msg,
                  text: `Here is the structural and cultural evaluation:`,
                  story: { title: 'Custom Story Input', text: storyText },
                  analysis: {
                    motifemes: classData.motifemes || [],
                    moves: classData.story_moves || [],
                    grade: gradeData.grade_report || {}
                  }
                }
              : msg
          )
        );
      } else {
        // Simulated local fallback
        await new Promise((r) => setTimeout(r, 800));
        setPipelineStep(3);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMsgId
              ? { ...msg, text: `Analyzing text...\n\n⚡ **Agent 2 (Classifier)**: Structural classification finished.\n⚡ **Agent 3 (Grader)**: Evaluating cultural integrity...` }
              : msg
          )
        );

        await new Promise((r) => setTimeout(r, 700));
        setPipelineStep(4);

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMsgId
              ? {
                  ...msg,
                  text: `Here is the structural and cultural evaluation:`,
                  story: { title: 'Custom Story Input', text: storyText },
                  analysis: {
                    motifemes: ['Lack', 'Interdiction', 'Violation', 'Consequence', 'Lack Liquidated'],
                    moves: [
                      'Character enters bush territory',
                      'Interdiction broken by protagonist',
                      'Community elders intervene',
                      'Sharing order restored'
                    ],
                    grade: {
                      overall_score: 8.7,
                      cultural_authenticity: 9.1,
                      structural_integrity: 8.4,
                      narrative_coherence: 8.6
                    }
                  }
                }
              : msg
          )
        );
      }
    } catch (err) {
      setPipelineStep(0);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botMsgId
            ? { ...msg, text: `⚠️ Analysis failed: ${err.message}` }
            : msg
        )
      );
    } finally {
      setPipelineRunning(false);
    }
  };

  // Submit custom user text input from chat bar
  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    const userText = inputText;
    setInputText('');

    if (activeMode === 'generate') {
      runGenerationPipeline('Custom Theme Generation', userText, ['Lack', 'Mediation', 'Lack Liquidated']);
    } else {
      runAnalysisPipeline('Custom Text Input', userText);
    }
  };

  // Format highlighted definitions helper
  const renderFormattedStory = (text) => {
    if (!text) return null;
    const regex = /([\w!\|\/\'\-]+\s*\([\w\s\-\/\'\!]+\))/g;
    const parts = text.split(regex);
    return parts.map((part, idx) => {
      if (regex.test(part)) {
        return <span key={idx} className="juhoansi-term">{part}</span>;
      }
      return part;
    });
  };

  return (
    <div className="app-wrapper">
      <Header 
        isOnline={isBackendOnline} 
        theme={theme} 
        onToggleTheme={toggleTheme} 
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className="chat-layout">
        {/* Settings Panel Sidebar */}
        <aside 
          className={`chat-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}
          onClick={() => sidebarCollapsed && setSidebarCollapsed(false)}
          title={sidebarCollapsed ? "Click to expand settings" : ""}
        >
          <div className="sidebar-title">
            <i className="fa-solid fa-sliders"></i> <span>Settings</span>
          </div>
          
          <div className="settings-group">
            <span className="settings-label">Active Mode</span>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
              <button 
                className={`btn-secondary ${activeMode === 'generate' ? 'active' : ''}`}
                style={activeMode === 'generate' ? { borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)', background: 'rgba(0,0,255,0.05)', flex: 1 } : { flex: 1 }}
                onClick={() => handleOptionClick('mode_generate')}
              >
                Generate
              </button>
              <button 
                className={`btn-secondary ${activeMode === 'enter' ? 'active' : ''}`}
                style={activeMode === 'enter' ? { borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)', background: 'rgba(0,0,255,0.05)', flex: 1 } : { flex: 1 }}
                onClick={() => handleOptionClick('mode_enter')}
              >
                Analyze
              </button>
            </div>
          </div>

          <div className="settings-group">
            <span className="settings-label">3-Agent Pipeline Status</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                <i className={`fa-solid ${pipelineStep >= 1 ? 'fa-circle-check text-green' : 'fa-circle'} ${pipelineStep === 1 ? 'fa-spinner fa-spin' : ''}`} style={{ color: pipelineStep >= 1 ? 'var(--accent-emerald)' : 'var(--text-muted)' }}></i>
                <span style={{ color: pipelineStep === 1 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>Generator Agent</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                <i className={`fa-solid ${pipelineStep >= 2 ? 'fa-circle-check text-green' : 'fa-circle'} ${pipelineStep === 2 ? 'fa-spinner fa-spin' : ''}`} style={{ color: pipelineStep >= 2 ? 'var(--accent-emerald)' : 'var(--text-muted)' }}></i>
                <span style={{ color: pipelineStep === 2 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>Classifier Agent</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                <i className={`fa-solid ${pipelineStep >= 3 ? 'fa-circle-check text-green' : 'fa-circle'} ${pipelineStep === 3 ? 'fa-spinner fa-spin' : ''}`} style={{ color: pipelineStep >= 3 ? 'var(--accent-emerald)' : 'var(--text-muted)' }}></i>
                <span style={{ color: pipelineStep === 3 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>Grader Agent</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 'auto' }}>
            <button 
              className="btn-secondary" 
              style={{ width: '100%', display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}
              onClick={() => setMessages([{
                id: 'welcome',
                sender: 'bot',
                text: "Hello! Welcome to the Ju|'hoansi Narrative Agentic Studio (jnang). I coordinate a 3-agent pipeline (Generator, Classifier, Grader) to create and analyze oral folktales.\n\nHow would you like to start today?",
                options: [
                  { label: '🤖 Generate New Story', value: 'mode_generate' },
                  { label: '📝 Enter Custom Story', value: 'mode_enter' }
                ]
              }])}
            >
              <i className="fa-solid fa-arrow-rotate-left"></i>
              Reset Conversation
            </button>
          </div>
        </aside>

        {/* Chat window Canvas */}
        <section className="chat-canvas">
          <Meteors number={30} />
          <div className="messages-container">
            {messages.map((msg) => (
              <div key={msg.id} className={`message-row ${msg.sender}`}>
                <div className="message-bubble">
                  <div className="message-sender">
                    <i className={`fa-solid ${msg.sender === 'user' ? 'fa-user' : 'fa-robot'}`}></i>
                    <span>{msg.sender === 'user' ? 'You' : 'jnang assistant'}</span>
                  </div>
                  
                  <div className="message-text">{msg.text}</div>

                  {/* Options suggestions buttons inside chat */}
                  {msg.options && (
                    <div className="option-chips-container">
                      {msg.options.map((opt, idx) => (
                        <button
                          key={idx}
                          className="option-chip-btn"
                          onClick={() => handleOptionClick(opt.value)}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Story Card embed */}
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

                  {/* Evaluation Report dashboard embed */}
                  {msg.analysis && (
                    <div className="embed-metrics-card">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                        <i className="fa-solid fa-award" style={{ color: 'var(--accent-gold)' }}></i>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Evaluation Report</span>
                      </div>

                      <div className="metric-card" style={{ padding: '0.75rem', marginBottom: '0.75rem' }}>
                        <div className="metric-header" style={{ marginBottom: '0.3rem' }}>
                          <span className="metric-title" style={{ fontSize: '0.8rem' }}>Overall Authenticity Score</span>
                          <span className="metric-score" style={{ fontSize: '1.1rem' }}>{Number(msg.analysis.grade?.overall_score ?? 8.5).toFixed(1)}/10</span>
                        </div>
                        <div className="progress-bar-bg" style={{ height: '6px' }}>
                          <div className="progress-bar-fill" style={{ width: `${(msg.analysis.grade?.overall_score ?? 8.5) * 10}%` }} />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                        <div className="metric-card" style={{ padding: '0.6rem', marginBottom: 0 }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Cultural</div>
                          <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--accent-emerald)' }}>{Number(msg.analysis.grade?.cultural_authenticity ?? 9.0).toFixed(1)}</div>
                        </div>
                        <div className="metric-card" style={{ padding: '0.6rem', marginBottom: 0 }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Structural</div>
                          <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--accent-purple)' }}>{Number(msg.analysis.grade?.structural_integrity ?? 8.0).toFixed(1)}</div>
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

          {/* Input Panel Footer */}
          <div className="chat-footer">
            {/* Quick Action Suggestion pills */}
            <div className="suggestions-bar">
              <div 
                className="suggestion-pill" 
                onClick={() => handleOptionClick('mode_generate')}
              >
                <i className="fa-solid fa-wand-magic-sparkles" style={{ marginRight: '4px' }}></i> Generate Story
              </div>
              <div 
                className="suggestion-pill" 
                onClick={() => handleOptionClick('mode_enter')}
              >
                <i className="fa-solid fa-pen-to-square" style={{ marginRight: '4px' }}></i> Enter Story
              </div>
              <div 
                className="suggestion-pill" 
                onClick={() => handleOptionClick('theme_sharing_honey')}
              >
                🍯 Presets: Sharing Honey
              </div>
              <div 
                className="suggestion-pill" 
                onClick={() => handleOptionClick('theme_moon_life')}
              >
                🌙 Presets: The Moon Legend
              </div>
            </div>

            <div className="chat-input-wrapper">
              <input
                className="chat-textarea"
                placeholder={activeMode === 'generate' ? "Type a custom theme seed..." : "Type or paste your story text..."}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSendMessage();
                  }
                }}
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
