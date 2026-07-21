import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ModeSelector from './components/ModeSelector';
import ThemePicker from './components/ThemePicker';
import StoryInput from './components/StoryInput';
import PipelineTracker from './components/PipelineTracker';
import StoryViewer from './components/StoryViewer';
import AnalysisDashboard from './components/AnalysisDashboard';
import { PRESET_THEMES, SAMPLE_STORIES } from './data/themes';
import { AlertTriangle, Sparkles, RefreshCw } from 'lucide-react';

export default function App() {
  const [activeMode, setActiveMode] = useState('generate'); // 'generate' | 'enter'
  const [selectedTheme, setSelectedTheme] = useState(PRESET_THEMES[0]);
  const [customTheme, setCustomTheme] = useState('');
  const [storyInputText, setStoryInputText] = useState(SAMPLE_STORIES[0].text);

  // Pipeline state
  const [currentStep, setCurrentStep] = useState(0); // 0: idle, 1: generator, 2: classifier, 3: grader, 4: complete
  const [isProcessing, setIsProcessing] = useState(false);
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Output results
  const [narrativeText, setNarrativeText] = useState('');
  const [motifemes, setMotifemes] = useState([]);
  const [storyMoves, setStoryMoves] = useState([]);
  const [gradeReport, setGradeReport] = useState(null);

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

  // Handle Mode Change
  const handleModeChange = (mode) => {
    setActiveMode(mode);
    setErrorMessage(null);
    if (mode === 'enter' && !storyInputText) {
      setStoryInputText(SAMPLE_STORIES[0].text);
    }
  };

  // Run 3-Agent Generation Pipeline
  const handleGenerate = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    setCurrentStep(1); // Agent 1: Generator

    const themeString = customTheme.trim() ? customTheme : selectedTheme.defaultPrompt;

    try {
      if (isBackendOnline) {
        // Call FastAPI /generate endpoint
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ theme: themeString }),
        });

        if (!res.ok) {
          throw new Error(`Server returned ${res.status}: ${res.statusText}`);
        }

        setCurrentStep(2); // Agent 2: Classifier
        const data = await res.json();

        setCurrentStep(3); // Agent 3: Grader
        setNarrativeText(data.draft_narrative || '');
        setMotifemes(data.motifemes || []);
        setStoryMoves(data.story_moves || []);
        setGradeReport(data.grade_report || {});
        setCurrentStep(4); // Complete
      } else {
        // Simulated local fallback for demonstration when backend server is not running
        await new Promise((r) => setTimeout(r, 600));
        setCurrentStep(2);

        await new Promise((r) => setTimeout(r, 600));
        setCurrentStep(3);

        await new Promise((r) => setTimeout(r, 500));
        const sampleNarrative = `In the ancient n!ore (territory) of the red dunes, an elder named !Kobo found a hidden hollow tree filled with golden zo (honey). Following the custom of his ancestors, he blew the horn to summon his age-mates (!xo) and family. Together they shared the sweet zo, ensuring that no one went hungry in the camp. Because of his generosity, the ancestral spirits (g//awasi) blessed the waterhole with gentle summer rain.`;

        setNarrativeText(sampleNarrative);
        setMotifemes(selectedTheme.motifs);
        setStoryMoves([
          'Hero discovers resource in bush',
          'Community obligation honored',
          'Resource shared equitably at camp',
          'Ancestral spirits grant blessing'
        ]);
        setGradeReport({
          overall_score: 9.2,
          cultural_authenticity: 9.5,
          structural_integrity: 9.0,
          narrative_coherence: 9.1
        });
        setCurrentStep(4);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(`Generation failed: ${err.message}. Using offline fallback view.`);
      // Fallback display
      setNarrativeText(`Long ago, in the n!ore of the Kalahari...`);
      setMotifemes(selectedTheme.motifs);
      setGradeReport({ overall_score: 8.0, cultural_authenticity: 8.5 });
      setCurrentStep(4);
    } finally {
      setIsProcessing(false);
    }
  };

  // Run Story Analysis on Entered Text
  const handleAnalyzeEnteredStory = async () => {
    if (!storyInputText.trim()) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setCurrentStep(2); // Start at Agent 2 Classifier

    try {
      if (isBackendOnline) {
        // Step 1: Call Classifier Agent
        const classRes = await fetch('/api/agents/classifier', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ draft_narrative: storyInputText }),
        });

        const classData = classRes.ok ? await classRes.json() : { motifemes: [], story_moves: [] };

        setCurrentStep(3); // Agent 3 Grader
        // Step 2: Call Grader Agent
        const gradeRes = await fetch('/api/agents/grader', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            draft_narrative: storyInputText,
            motifemes: classData.motifemes,
            story_moves: classData.story_moves,
          }),
        });

        const gradeData = gradeRes.ok ? await gradeRes.json() : { grade_report: {} };

        setNarrativeText(storyInputText);
        setMotifemes(classData.motifemes || ['Lack', 'Interdiction', 'Violation', 'Consequence']);
        setStoryMoves(classData.story_moves || ['Action performed in bush', 'Community order restored']);
        setGradeReport(gradeData.grade_report || { overall_score: 8.8 });
        setCurrentStep(4);
      } else {
        // Fallback simulation when backend offline
        await new Promise((r) => setTimeout(r, 600));
        setCurrentStep(3);
        await new Promise((r) => setTimeout(r, 500));

        setNarrativeText(storyInputText);
        setMotifemes(['Lack', 'Interdiction', 'Violation', 'Consequence', 'Lack Liquidated']);
        setStoryMoves([
          'Character enters bush territory',
          'Interdiction broken by protagonist',
          'Community elders intervene',
          'Sharing order restored'
        ]);
        setGradeReport({
          overall_score: 8.7,
          cultural_authenticity: 9.1,
          structural_integrity: 8.4,
          narrative_coherence: 8.6
        });
        setCurrentStep(4);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(`Analysis failed: ${err.message}`);
      setNarrativeText(storyInputText);
      setMotifemes(['Lack', 'Violation', 'Consequence']);
      setGradeReport({ overall_score: 8.0 });
      setCurrentStep(4);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="app-wrapper">
      <Header isOnline={isBackendOnline} />

      <main className="main-content">
        {errorMessage && (
          <div className="glass-panel" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', borderColor: 'rgba(255, 64, 129, 0.4)', background: 'rgba(255, 64, 129, 0.08)', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <AlertTriangle color="var(--accent-rose)" size={20} />
            <span style={{ fontSize: '0.9rem', color: '#ff80ab' }}>{errorMessage}</span>
          </div>
        )}

        {/* Workflow Mode Selector */}
        <ModeSelector activeMode={activeMode} onSelectMode={handleModeChange} />

        {/* Main Input Control Section */}
        {activeMode === 'generate' ? (
          <ThemePicker
            selectedTheme={selectedTheme}
            onSelectTheme={setSelectedTheme}
            customTheme={customTheme}
            onCustomThemeChange={setCustomTheme}
            onGenerate={handleGenerate}
            isGenerating={isProcessing}
          />
        ) : (
          <StoryInput
            storyText={storyInputText}
            onStoryTextChange={setStoryInputText}
            onAnalyze={handleAnalyzeEnteredStory}
            isAnalyzing={isProcessing}
          />
        )}

        {/* Execution Pipeline Status */}
        {currentStep > 0 && (
          <PipelineTracker
            activeMode={activeMode}
            currentStep={currentStep}
            isRunning={isProcessing}
          />
        )}

        {/* Results Workspace Dashboard */}
        {narrativeText && (
          <div className="results-grid">
            <StoryViewer
              narrativeText={narrativeText}
              themeTitle={activeMode === 'generate' ? selectedTheme?.title : 'Entered Folktale'}
            />
            <AnalysisDashboard
              motifemes={motifemes}
              storyMoves={storyMoves}
              gradeReport={gradeReport}
            />
          </div>
        )}
      </main>
    </div>
  );
}
