import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { GraphExplorer } from './components/GraphExplorer';
import { AgentChat } from './components/AgentChat';
import { IngestionPipeline } from './components/IngestionPipeline';
import { Settings } from './components/Settings';
import { ViewState } from './types';
import { initializeGemini } from './services/geminiService';

const App: React.FC = () => {
  const [currentView, setView] = useState<ViewState>(ViewState.DASHBOARD);

  useEffect(() => {
    // Attempt to initialize Gemini if key is present in env
    // In a real app, this might happen after user inputs key, but for this demo 
    // we assume process.env or just handle graceful degradation.
    initializeGemini();
  }, []);

  const renderView = () => {
    switch (currentView) {
      case ViewState.DASHBOARD:
        return <Dashboard />;
      case ViewState.GRAPH:
        return <GraphExplorer />;
      case ViewState.CHAT:
        return <AgentChat />;
      case ViewState.INGESTION:
        return <IngestionPipeline />;
      case ViewState.SETTINGS:
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentView={currentView} setView={setView}>
      {renderView()}
    </Layout>
  );
};

export default App;
