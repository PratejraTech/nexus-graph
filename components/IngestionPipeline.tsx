import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Scissors, 
  Sparkles, 
  Database, 
  Play, 
  CheckCircle2, 
  Terminal,
  Loader2,
  Layers,
  UploadCloud,
  Plus,
  Trash2,
  Network,
  Activity,
  Server,
  HardDrive
} from 'lucide-react';
import { IngestionFile } from '../types';

// Types representing the backend state
interface IngestionState {
  status: 'IDLE' | 'PROCESSING' | 'COMPLETED' | 'ERROR';
  current_node: string | null;
  total_chunks: number;
  total_entities: number;
  db_ops: {
    chroma: boolean;
    memgraph: boolean;
    storage: boolean;
    postgres: boolean;
  };
}

const NODES = [
  { id: 'UploadNode', label: 'Ingest & Store', icon: UploadCloud, desc: 'S3 + Postgres' },
  { id: 'ChunkerNode', label: 'Chunker', icon: Scissors, desc: 'Recursive (512t)' },
  { id: 'EmbeddingNode', label: 'Embedding', icon: Sparkles, desc: 'Gemini (768d)' },
  { id: 'GraphBuilderNode', label: 'Graph Builder', icon: Network, desc: 'Semantic Linker' },
  { id: 'SyncNode', label: 'Vector Sync', icon: Database, desc: 'ChromaDB Upsert' },
];

// Simulate Environment
const IS_PROD = false; // Toggle this to simulate Production vs Dev
const STORAGE_TARGET = IS_PROD ? 'AWS S3 (us-east-1)' : 'Local Volume (/data)';

export const IngestionPipeline: React.FC = () => {
  const [files, setFiles] = useState<IngestionFile[]>([
    { id: '1', name: 'architecture_spec_v2.pdf', size: '2.4MB', status: 'PENDING', chunks: 0 },
    { id: '2', name: 'api_documentation.md', size: '840KB', status: 'PENDING', chunks: 0 }
  ]);
  
  const [state, setState] = useState<IngestionState>({
    status: 'IDLE',
    current_node: null,
    total_chunks: 0,
    total_entities: 0,
    db_ops: { chroma: false, memgraph: false, storage: false, postgres: false }
  });
  
  const [logs, setLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second:'2-digit' });
    setLogs(prev => [...prev, `[${time}] ${msg}`]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((f, i) => ({
        id: Date.now() + i + '',
        name: f.name,
        size: (f.size / 1024 / 1024).toFixed(2) + 'MB',
        status: 'PENDING',
        chunks: 0
      } as IngestionFile));
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (id: string) => {
    if (state.status === 'PROCESSING') return;
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const runSimulation = async () => {
    if (state.status === 'PROCESSING' || files.length === 0) return;

    // Reset
    setState({
      status: 'PROCESSING',
      current_node: 'UploadNode',
      total_chunks: 0,
      total_entities: 0,
      db_ops: { chroma: false, memgraph: false, storage: false, postgres: false }
    });
    setFiles(prev => prev.map(f => ({ ...f, status: 'PENDING', chunks: 0 })));
    setLogs([]);
    addLog(`[Orchestrator] Initializing Multi-File Ingestion Pipeline...`);
    addLog(`[Config] Storage Target: ${STORAGE_TARGET}`);
    addLog(`[Config] Chunk Strategy: RecursiveCharacter (Size=512, Overlap=50)`);

    // Step 1: Upload to Storage & Postgres
    await new Promise(r => setTimeout(r, 1000));
    setState(prev => ({ ...prev, current_node: 'UploadNode' }));
    
    for (const file of files) {
        addLog(`[UploadNode] Stream uploading '${file.name}' to ${STORAGE_TARGET}...`);
        await new Promise(r => setTimeout(r, 400));
        addLog(`[Postgres] Archiving full document blob to 'public.documents' table...`);
        await new Promise(r => setTimeout(r, 200));
        setFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'UPLOADING' } : f));
    }
    setState(prev => ({ ...prev, db_ops: { ...prev.db_ops, storage: true, postgres: true } }));
    addLog(`[UploadNode] All files persisted securely in Storage & SQL.`);

    // Step 2: Chunking (Parallel Simulation)
    await new Promise(r => setTimeout(r, 800));
    setState(prev => ({ ...prev, current_node: 'ChunkerNode' }));
    
    let totalChunks = 0;
    for (const file of files) {
        const estimatedChunks = Math.floor(Math.random() * 50) + 10;
        totalChunks += estimatedChunks;
        setFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'CHUNKING', chunks: estimatedChunks } : f));
        addLog(`[ChunkerNode] Parsed '${file.name}': Generated ${estimatedChunks} chunks.`);
        await new Promise(r => setTimeout(r, 300));
    }
    setState(prev => ({ ...prev, total_chunks: totalChunks }));

    // Step 3: Embedding
    await new Promise(r => setTimeout(r, 800));
    setState(prev => ({ ...prev, current_node: 'EmbeddingNode' }));
    setFiles(prev => prev.map(f => ({ ...f, status: 'EMBEDDING' })));
    addLog(`[EmbeddingNode] Batching ${totalChunks} chunks to model 'text-embedding-004'...`);
    addLog(`[EmbeddingNode] Vector Dimensions: 768`);
    await new Promise(r => setTimeout(r, 1500));
    addLog(`[EmbeddingNode] Embeddings generated successfully.`);

    // Step 4: Graph Building
    await new Promise(r => setTimeout(r, 800));
    setState(prev => ({ ...prev, current_node: 'GraphBuilderNode' }));
    addLog(`[GraphBuilder] Analyzing semantic proximity between chunks...`);
    
    await new Promise(r => setTimeout(r, 1000));
    const extractedEntities = Math.floor(totalChunks * 1.5);
    addLog(`[GraphBuilder] Extracted ${extractedEntities} potential entities.`);
    addLog(`[GraphBuilder] Inferring relationships based on vector cosine similarity...`);
    await new Promise(r => setTimeout(r, 1000));
    addLog(`[GraphBuilder] Identified cross-document links between '${files[0].name}' and '${files[1]?.name || "others"}'.`);

    // Step 5: Sync
    await new Promise(r => setTimeout(r, 800));
    setState(prev => ({ ...prev, current_node: 'SyncNode' }));
    
    // Chroma Upsert
    addLog(`[SyncNode] Performing Chunked Upsert to ChromaDB...`);
    await new Promise(r => setTimeout(r, 600));
    setState(prev => ({ ...prev, db_ops: { ...prev.db_ops, chroma: true } }));
    
    // Memgraph Sync
    addLog(`[SyncNode] Projecting Graph Topology to Memgraph...`);
    await new Promise(r => setTimeout(r, 600));
    setState(prev => ({ ...prev, db_ops: { ...prev.db_ops, memgraph: true }, total_entities: extractedEntities }));

    // Finish
    setFiles(prev => prev.map(f => ({ ...f, status: 'COMPLETED' })));
    setState(prev => ({ ...prev, status: 'COMPLETED', current_node: null }));
    addLog(`[Orchestrator] Ingestion Pipeline Completed Successfully.`);
  };

  return (
    <div className="p-4 lg:p-8 h-full flex flex-col max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
             <Layers className="text-nexus-400" />
             Ingestion Engine
          </h1>
          <p className="text-slate-400">Multi-file ingestion with automatic graph construction.</p>
        </div>
        <div className="flex gap-3">
           <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={state.status === 'PROCESSING'}
              className="flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700"
           >
              <Plus className="w-4 h-4 mr-2" />
              Add Files
           </button>
           <input 
             type="file" 
             multiple 
             ref={fileInputRef} 
             className="hidden" 
             onChange={handleFileSelect} 
           />
           <button 
              onClick={runSimulation}
              disabled={state.status === 'PROCESSING' || files.length === 0}
              className={`
                flex items-center px-6 py-2 rounded-lg font-bold text-sm transition-all
                ${state.status === 'PROCESSING' || files.length === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                  : 'bg-nexus-600 hover:bg-nexus-500 text-white shadow-lg shadow-nexus-600/20'}
              `}
           >
              {state.status === 'PROCESSING' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
              {state.status === 'PROCESSING' ? 'Processing Pipeline' : 'Start Ingestion'}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        
        {/* Left Col: Files */}
        <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Drop Zone */}
            {files.length === 0 && (
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center p-12 cursor-pointer hover:bg-slate-800/50 hover:border-nexus-500/50 transition-all group"
                >
                    <div className="p-4 bg-slate-800 rounded-full mb-4 group-hover:scale-110 transition-transform">
                        <UploadCloud className="w-8 h-8 text-nexus-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-300">Drop files here or click to upload</h3>
                    <p className="text-slate-500 mt-2">Support for PDF, MD, TXT (Max 50MB)</p>
                </div>
            )}

            {files.length > 0 && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden flex-1 flex flex-col">
                    <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Queue ({files.length})</span>
                        <div className="flex items-center gap-2 text-xs">
                             <span className="text-slate-500">Storage Target:</span>
                             <span className="px-2 py-1 bg-slate-800 rounded text-nexus-300 font-mono">{STORAGE_TARGET}</span>
                        </div>
                    </div>
                    <div className="overflow-y-auto p-2 space-y-2">
                        {files.map(file => (
                            <div key={file.id} className="p-3 bg-slate-800/40 rounded-xl border border-slate-800/50 flex items-center gap-4">
                                <div className="p-2 bg-slate-800 rounded-lg text-slate-400">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <h4 className="font-medium text-slate-200 truncate">{file.name}</h4>
                                        <span className="text-xs text-slate-500">{file.size}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-500 ${
                                                    file.status === 'COMPLETED' ? 'bg-nexus-success w-full' :
                                                    file.status === 'ERROR' ? 'bg-red-500 w-full' :
                                                    file.status === 'PENDING' ? 'w-0' :
                                                    'bg-nexus-500 w-2/3 animate-pulse-slow'
                                                }`}
                                            ></div>
                                        </div>
                                        <span className="text-[10px] font-mono w-20 text-right text-slate-400">
                                            {file.status}
                                        </span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => removeFile(file.id)}
                                    disabled={state.status === 'PROCESSING'}
                                    className="p-2 text-slate-600 hover:text-red-400 disabled:opacity-0 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>

        {/* Right Col: Status & Logs */}
        <div className="flex flex-col gap-6">
            
            {/* Pipeline Visualizer */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Pipeline Status
                </h3>
                
                <div className="space-y-4 relative">
                    <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-slate-800 -z-10"></div>
                    {NODES.map((node, i) => {
                        const isActive = state.current_node === node.id;
                        const isDone = NODES.findIndex(n => n.id === state.current_node) > i || state.status === 'COMPLETED';
                        
                        return (
                            <div key={node.id} className="flex items-center gap-3">
                                <div className={`
                                    w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all
                                    ${isActive 
                                        ? 'bg-nexus-900 border-nexus-500 text-nexus-400 shadow-[0_0_15px_-3px_rgba(59,130,246,0.5)]' 
                                        : isDone 
                                            ? 'bg-slate-900 border-nexus-success text-nexus-success' 
                                            : 'bg-slate-900 border-slate-800 text-slate-700'}
                                `}>
                                    {isDone ? <CheckCircle2 className="w-5 h-5" /> : <node.icon className={`w-5 h-5 ${isActive ? 'animate-pulse' : ''}`} />}
                                </div>
                                <div>
                                    <div className={`text-sm font-medium ${isActive ? 'text-white' : isDone ? 'text-slate-300' : 'text-slate-600'}`}>
                                        {node.label}
                                    </div>
                                    <div className="text-[10px] text-slate-500">{node.desc}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* DB Status Grid */}
                <div className="mt-6 pt-4 border-t border-slate-800">
                    <div className="text-[10px] font-bold text-slate-500 uppercase mb-3">Database Ops</div>
                    <div className="grid grid-cols-3 gap-2">
                        <div className={`p-2 rounded-lg border flex flex-col items-center justify-center transition-colors ${state.db_ops.postgres ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-slate-900 border-slate-800 text-slate-600'}`}>
                             <Server className="w-4 h-4 mb-1" />
                             <span className="text-[9px]">Postgres</span>
                        </div>
                        <div className={`p-2 rounded-lg border flex flex-col items-center justify-center transition-colors ${state.db_ops.chroma ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-slate-900 border-slate-800 text-slate-600'}`}>
                             <Database className="w-4 h-4 mb-1" />
                             <span className="text-[9px]">Chroma</span>
                        </div>
                        <div className={`p-2 rounded-lg border flex flex-col items-center justify-center transition-colors ${state.db_ops.memgraph ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' : 'bg-slate-900 border-slate-800 text-slate-600'}`}>
                             <Network className="w-4 h-4 mb-1" />
                             <span className="text-[9px]">Memgraph</span>
                        </div>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-2 gap-4">
                    <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                        <div className="text-[10px] text-slate-500 uppercase">Total Chunks</div>
                        <div className="text-xl font-mono text-nexus-400">{state.total_chunks}</div>
                    </div>
                    <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                        <div className="text-[10px] text-slate-500 uppercase">Entities Found</div>
                        <div className="text-xl font-mono text-nexus-accent">{state.total_entities}</div>
                    </div>
                </div>
            </div>

            {/* Logs Console */}
            <div className="bg-black/80 border border-slate-800 rounded-2xl p-4 flex-1 overflow-hidden flex flex-col min-h-[200px]">
                <div className="flex items-center gap-2 mb-2 text-xs text-slate-500 border-b border-white/10 pb-2">
                    <Terminal className="w-3 h-3" /> Console Output
                </div>
                <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-1 text-slate-400">
                    {logs.length === 0 && <span className="text-slate-700 italic">Waiting to start ingestion...</span>}
                    {logs.map((log, i) => (
                        <div key={i} className="break-all">
                            <span className="text-slate-600 mr-2">{log.split(']')[0]}]</span>
                            <span className={log.includes('ERROR') ? 'text-red-400' : 'text-slate-300'}>
                                {log.split(']').slice(1).join(']')}
                            </span>
                        </div>
                    ))}
                    <div ref={logsEndRef} />
                </div>
            </div>

        </div>

      </div>
    </div>
  );
};
