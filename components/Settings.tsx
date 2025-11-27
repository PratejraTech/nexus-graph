import React from 'react';
import { Save, AlertTriangle } from 'lucide-react';

export const Settings: React.FC = () => {
  return (
    <div className="p-8 max-w-4xl mx-auto">
       <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">System Configuration</h1>
        <p className="text-slate-400">Manage connections to Nexus backend services.</p>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-white">Environment Variables</h2>
          <p className="text-sm text-slate-500 mt-1">These settings are loaded from the backend `config.py`. Read-only in this demo.</p>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Memgraph URI</label>
                <div className="p-3 bg-black/40 border border-slate-800 rounded-lg font-mono text-sm text-nexus-400">
                  bolt://nexus-memgraph:7687
                </div>
             </div>
             <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">ChromaDB Host</label>
                <div className="p-3 bg-black/40 border border-slate-800 rounded-lg font-mono text-sm text-nexus-400">
                  http://nexus-chroma:8000
                </div>
             </div>
             <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">LLM Provider</label>
                <div className="p-3 bg-black/40 border border-slate-800 rounded-lg font-mono text-sm text-nexus-400">
                  Google Gemini (gemini-2.5-flash)
                </div>
             </div>
             <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Tracing</label>
                <div className="p-3 bg-black/40 border border-slate-800 rounded-lg font-mono text-sm text-green-400 flex justify-between">
                  <span>LangSmith Enabled</span>
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-1.5 animate-pulse"></span>
                </div>
             </div>
          </div>
          
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-start gap-3">
             <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
             <div className="text-sm text-yellow-200/80">
               <strong className="text-yellow-400 block mb-1">Docker Container Status</strong>
               The backend containers are currently simulated for this frontend demo. In a production environment, ensure <code>docker-compose up</code> is running on the host machine.
             </div>
          </div>
        </div>

        <div className="p-6 bg-slate-900/80 border-t border-slate-800 flex justify-end">
          <button className="flex items-center px-4 py-2 bg-nexus-600 hover:bg-nexus-500 text-white rounded-lg transition-colors font-medium text-sm">
            <Save className="w-4 h-4 mr-2" />
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};
