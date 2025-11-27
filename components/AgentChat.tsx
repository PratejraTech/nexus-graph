import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, User, Bot, BrainCircuit, ChevronDown, ChevronRight, Loader2, 
  Search, Network, CheckCircle, FileText, ArrowRight, ThumbsUp, ThumbsDown,
  Activity, Table, Clock, AlertTriangle, ShieldCheck
} from 'lucide-react';
import { ChatMessage, AgentGraphState, TraceStep, EvaluationScore } from '../types';
import { analyzeQueryIntent, synthesizeReasonedResponseStream, checkForConflicts, factCheckResponse } from '../services/geminiService';

// --- Reasoning Node Components ---

const NodeCard = ({ 
  id, 
  label, 
  icon: Icon, 
  active, 
  status,
  data 
}: { 
  id: string, 
  label: string, 
  icon: any, 
  active: boolean, 
  status: 'PENDING' | 'RUNNING' | 'DONE' | 'SKIPPED',
  data?: string 
}) => {
  return (
    <div className={`
      relative p-3 rounded-xl border transition-all duration-300 flex items-center space-x-3
      ${active || status === 'RUNNING' 
        ? 'bg-nexus-900/80 border-nexus-400 shadow-[0_0_15px_-3px_rgba(59,130,246,0.3)]' 
        : status === 'DONE'
          ? 'bg-slate-900/50 border-nexus-success/50 text-slate-300'
          : status === 'SKIPPED'
            ? 'bg-slate-900/20 border-slate-800 text-slate-700 opacity-50'
            : 'bg-slate-900/30 border-slate-800 text-slate-600 grayscale'}
    `}>
      <div className={`
        p-2 rounded-lg transition-colors
        ${active || status === 'RUNNING' ? 'bg-nexus-500 text-white' : status === 'DONE' ? 'bg-nexus-success/20 text-nexus-success' : status === 'SKIPPED' ? 'bg-slate-800 text-slate-600' : 'bg-slate-800'}
      `}>
        <Icon className={`w-4 h-4 ${status === 'RUNNING' ? 'animate-spin' : ''}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold uppercase tracking-wide opacity-80">{label}</div>
        {data && <div className="text-[10px] font-mono truncate text-nexus-200 mt-1">{data}</div>}
      </div>
      {status === 'DONE' && <CheckCircle className="w-4 h-4 text-nexus-success" />}
    </div>
  );
};

// --- Mock Trace Generation ---
const generateMockTrace = (query: string, intent: string, docsCount: number, graphNodesCount: number): TraceStep[] => {
  const now = Date.now();
  const baseTime = now - 5000;
  
  return [
    {
      id: `tr_${Math.random().toString(36).substr(2, 6)}`,
      name: 'QueryAnalyzer',
      type: 'chain',
      input: JSON.stringify({ query }),
      output: JSON.stringify({ intent }),
      latencyMs: 850,
      status: 'success',
      timestamp: new Date(baseTime)
    },
    {
      id: `tr_${Math.random().toString(36).substr(2, 6)}`,
      name: 'VectorRetriever',
      type: 'retriever',
      input: JSON.stringify({ query, k: 3 }),
      output: `Retrieved ${docsCount} Documents`,
      latencyMs: 420,
      status: 'success',
      timestamp: new Date(baseTime + 900)
    },
    {
      id: `tr_${Math.random().toString(36).substr(2, 6)}`,
      name: 'GraphRetriever',
      type: 'retriever',
      input: JSON.stringify({ entities_extracted: 2 }),
      output: `Traversed ${graphNodesCount} Nodes (2-hop)`,
      latencyMs: 650,
      status: 'success',
      timestamp: new Date(baseTime + 900)
    },
    {
      id: `tr_${Math.random().toString(36).substr(2, 6)}`,
      name: 'ConflictResolution',
      type: 'chain',
      input: 'Compare(Vector, Graph)',
      output: 'No significant conflicts detected.',
      latencyMs: 150,
      status: 'success',
      timestamp: new Date(baseTime + 1100)
    },
    {
      id: `tr_${Math.random().toString(36).substr(2, 6)}`,
      name: 'ContextGrader',
      type: 'llm',
      input: 'Context...',
      output: 'Grade: PASS',
      latencyMs: 300,
      status: 'success',
      timestamp: new Date(baseTime + 1600)
    },
    {
      id: `tr_${Math.random().toString(36).substr(2, 6)}`,
      name: 'Synthesizer',
      type: 'llm',
      input: 'Prompt + Context',
      output: 'Streaming Response...',
      latencyMs: 2100,
      status: 'success',
      timestamp: new Date(baseTime + 2000)
    },
    {
      id: `tr_${Math.random().toString(36).substr(2, 6)}`,
      name: 'FactChecker',
      type: 'chain',
      input: 'Response vs Context',
      output: 'Status: PASS',
      latencyMs: 450,
      status: 'success',
      timestamp: new Date(baseTime + 4100)
    }
  ];
};

const generateMockEvaluations = (): EvaluationScore[] => [
  { name: 'Faithfulness', score: 0.98, reasoning: 'All claims supported by context.' },
  { name: 'Relevance', score: 0.95, reasoning: 'Directly answers user query.' },
  { name: 'Graph Utilization', score: 1.0, reasoning: 'Used 2-hop neighbor info.' }
];

export const AgentChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello. I am Nexus. My reasoning engine is active. Ask me anything about the system architecture.",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isReasoning, setIsReasoning] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Agent Graph State for Visualization
  const [agentState, setAgentState] = useState<AgentGraphState>({
    query: '',
    intent: 'UNKNOWN',
    plan: [],
    retrieved_docs: [],
    retrieved_graph_context: [],
    grader_status: 'PENDING',
    conflict_status: 'NONE',
    fact_check_status: 'PENDING',
    current_node: null,
    final_answer: null
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsReasoning(true);

    // --- Start LangGraph Execution ---

    // 1. Initialize State
    setAgentState({
      query: userMsg.content,
      intent: 'UNKNOWN',
      plan: [],
      retrieved_docs: [],
      retrieved_graph_context: [],
      grader_status: 'PENDING',
      conflict_status: 'NONE',
      fact_check_status: 'PENDING',
      current_node: 'QueryAnalyzer',
      final_answer: null
    });

    // 2. Query Analyzer Node
    await new Promise(r => setTimeout(r, 800)); // Visual delay
    const intent = await analyzeQueryIntent(userMsg.content);
    setAgentState(prev => ({ 
      ...prev, 
      intent, 
      plan: ['Analyze Intent', 'Retrieve Context', 'Check Conflicts', 'Synthesize', 'Fact Check'],
      current_node: 'Retrievers' 
    }));

    // 3. Parallel Retrieval (Vector + Graph)
    await new Promise(r => setTimeout(r, 1500)); // Simulate DB latency
    
    // Mock Data based on query
    const mockDocs = [
      { title: 'architecture_v2.pdf', score: 0.92, snippet: 'The system uses LangGraph for orchestration...', date: '2023-08-01' },
      { title: 'deployment.md', score: 0.88, snippet: 'Deploy using docker-compose up...', date: '2023-09-15' },
      { title: 'api_spec.json', score: 0.85, snippet: 'POST /ingest to upload documents...', date: '2023-10-01' }
    ];
    const mockGraph = [
      { entity: 'LangGraph', connections: 5 },
      { entity: 'Memgraph', connections: 3 },
      { entity: 'Nexus Core', connections: 8 }
    ];

    setAgentState(prev => ({ 
      ...prev, 
      retrieved_docs: mockDocs,
      retrieved_graph_context: mockGraph,
      current_node: 'ConflictResolver'
    }));

    // 4. Conflict Resolution (Phase 5)
    await new Promise(r => setTimeout(r, 800));
    const { hasConflict, resolution } = await checkForConflicts(mockDocs, mockGraph);
    
    setAgentState(prev => ({ 
      ...prev, 
      conflict_status: hasConflict ? 'RESOLVED' : 'NONE',
      current_node: 'ContextGrader'
    }));

    // 5. Context Grader
    await new Promise(r => setTimeout(r, 600));
    setAgentState(prev => ({ 
      ...prev, 
      grader_status: 'PASS',
      current_node: 'Synthesizer'
    }));

    // 6. Streaming Synthesizer
    // Create a placeholder message for the bot response
    const botMsgId = (Date.now() + 1).toString();
    const botMsg: ChatMessage = {
      id: botMsgId,
      role: 'assistant',
      content: "", // Start empty
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, botMsg]);

    let finalAnswer = "";
    
    // Call the streaming service
    const stream = synthesizeReasonedResponseStream(userMsg.content, intent, mockDocs, mockGraph);
    
    for await (const chunk of stream) {
        finalAnswer += chunk;
        setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, content: finalAnswer } : m));
    }
    
    setAgentState(prev => ({ 
      ...prev, 
      final_answer: finalAnswer,
      current_node: 'FactChecker'
    }));

    // 7. Fact Check / Guardrails (Phase 5)
    await new Promise(r => setTimeout(r, 800));
    const factCheckResult = await factCheckResponse(userMsg.content, finalAnswer);
    
    setAgentState(prev => ({ 
      ...prev, 
      fact_check_status: factCheckResult,
      current_node: null // End
    }));
    setIsReasoning(false);

    // 8. Finalize Message with Trace Info
    const traceSteps = generateMockTrace(userMsg.content, intent, mockDocs.length, mockGraph.length);
    const evaluations = generateMockEvaluations();

    setMessages(prev => prev.map(m => m.id === botMsgId ? { 
        ...m, 
        agentState: { 
            ...agentState, 
            intent, 
            retrieved_docs: mockDocs, 
            retrieved_graph_context: mockGraph, 
            final_answer: finalAnswer, 
            grader_status: 'PASS', 
            current_node: null, 
            query: userMsg.content, 
            plan: ['Complete'],
            conflict_status: hasConflict ? 'RESOLVED' : 'NONE',
            fact_check_status: factCheckResult
        },
        traceSteps,
        evaluations,
        userFeedback: null
    } : m));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFeedback = (msgId: string, type: 'positive' | 'negative') => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === msgId) {
        // Toggle logic
        const newVal = msg.userFeedback === type ? null : type;
        // In real app, log to LangSmith here
        console.log(`[LangSmith] Log Feedback for Run ${msg.id}:`, newVal);
        return { ...msg, userFeedback: newVal };
      }
      return msg;
    }));
  };

  return (
    <div className="flex h-full max-w-7xl mx-auto overflow-hidden">
      
      {/* Left Column: Chat Interface */}
      <div className="flex-1 flex flex-col p-4 lg:p-6 min-w-0">
        <div className="flex-none mb-4">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <BrainCircuit className="w-8 h-8 mr-3 text-nexus-400" />
            Agent Chat
          </h2>
          <p className="text-slate-400">Interacting with the LangGraph reasoning engine.</p>
        </div>

        <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden flex flex-col backdrop-blur-sm relative">
          <div className="flex-1 overflow-y-auto p-4 space-y-6" ref={scrollRef}>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} onFeedback={handleFeedback} />
            ))}
            {isReasoning && messages[messages.length-1].role === 'user' && (
               <div className="flex justify-start animate-pulse">
                <div className="bg-slate-800/50 rounded-2xl rounded-tl-none p-4 flex items-center space-x-3 border border-slate-700/50">
                  <Loader2 className="w-4 h-4 text-nexus-400 animate-spin" />
                  <span className="text-slate-400 text-sm font-mono">
                    {agentState.current_node === 'QueryAnalyzer' && "Analyzing Intent..."}
                    {agentState.current_node === 'Retrievers' && "Querying Vector & Graph DBs..."}
                    {agentState.current_node === 'ConflictResolver' && "Checking for Data Conflicts..."}
                    {agentState.current_node === 'ContextGrader' && "Grading Context Relevance..."}
                    {agentState.current_node === 'Synthesizer' && "Synthesizing Final Answer..."}
                    {agentState.current_node === 'FactChecker' && "Performing Fact Check..."}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-800 bg-slate-900/80">
            <div className="flex items-end gap-3 bg-slate-800/50 p-2 rounded-xl border border-slate-700/50 focus-within:border-nexus-500/50 focus-within:ring-1 focus-within:ring-nexus-500/50 transition-all">
              <textarea
                className="flex-1 bg-transparent text-slate-200 placeholder-slate-500 resize-none p-2 focus:outline-none min-h-[50px] max-h-[150px]"
                placeholder="Ask about the architecture, entities, or documents..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                onClick={handleSend}
                disabled={isReasoning || !input.trim()}
                className="p-3 bg-nexus-600 hover:bg-nexus-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Reasoning Engine Visualization */}
      <div className="w-80 xl:w-96 border-l border-slate-800 bg-black/20 p-4 hidden lg:flex flex-col gap-6 overflow-y-auto">
        
        <div>
           <div className="flex items-center gap-2 mb-4">
             <BrainCircuit className="w-5 h-5 text-nexus-400" />
             <h3 className="font-bold text-white text-sm uppercase tracking-wider">Reasoning Graph</h3>
           </div>
           
           <div className="space-y-4 relative">
             {/* Vertical connector line */}
             <div className="absolute left-[1.35rem] top-4 bottom-4 w-0.5 bg-slate-800 -z-10"></div>

             <NodeCard 
               id="QueryAnalyzer" 
               label="Query Analyzer" 
               icon={Search} 
               active={agentState.current_node === 'QueryAnalyzer'}
               status={agentState.intent !== 'UNKNOWN' ? 'DONE' : agentState.current_node === 'QueryAnalyzer' ? 'RUNNING' : 'PENDING'}
               data={agentState.intent !== 'UNKNOWN' ? `Intent: ${agentState.intent}` : undefined}
             />

             <div className="flex gap-2">
               <div className="flex-1">
                 <NodeCard 
                   id="VectorRetriever" 
                   label="Vector Store" 
                   icon={FileText} 
                   active={agentState.current_node === 'Retrievers'}
                   status={agentState.retrieved_docs.length > 0 ? 'DONE' : agentState.current_node === 'Retrievers' ? 'RUNNING' : 'PENDING'}
                   data={agentState.retrieved_docs.length > 0 ? `${agentState.retrieved_docs.length} Chunks` : undefined}
                 />
               </div>
               <div className="flex-1">
                 <NodeCard 
                   id="GraphRetriever" 
                   label="Knowledge Graph" 
                   icon={Network} 
                   active={agentState.current_node === 'Retrievers'}
                   status={agentState.retrieved_graph_context.length > 0 ? 'DONE' : agentState.current_node === 'Retrievers' ? 'RUNNING' : 'PENDING'}
                   data={agentState.retrieved_graph_context.length > 0 ? `${agentState.retrieved_graph_context.length} Entities` : undefined}
                 />
               </div>
             </div>
             
             <NodeCard 
               id="ConflictResolver" 
               label="Conflict Resolver" 
               icon={AlertTriangle} 
               active={agentState.current_node === 'ConflictResolver'}
               status={agentState.conflict_status !== 'NONE' ? 'DONE' : agentState.current_node === 'ConflictResolver' ? 'RUNNING' : agentState.retrieved_docs.length > 0 ? 'PENDING' : 'SKIPPED'}
               data={agentState.conflict_status !== 'NONE' ? `Status: ${agentState.conflict_status}` : undefined}
             />

             <NodeCard 
               id="ContextGrader" 
               label="Context Grader" 
               icon={CheckCircle} 
               active={agentState.current_node === 'ContextGrader'}
               status={agentState.grader_status !== 'PENDING' ? 'DONE' : agentState.current_node === 'ContextGrader' ? 'RUNNING' : 'PENDING'}
               data={agentState.grader_status !== 'PENDING' ? `Status: ${agentState.grader_status}` : undefined}
             />

             <NodeCard 
               id="Synthesizer" 
               label="Synthesizer" 
               icon={Bot} 
               active={agentState.current_node === 'Synthesizer'}
               status={agentState.final_answer ? 'DONE' : agentState.current_node === 'Synthesizer' ? 'RUNNING' : 'PENDING'}
             />
             
             <NodeCard 
               id="FactChecker" 
               label="Fact Checker" 
               icon={ShieldCheck} 
               active={agentState.current_node === 'FactChecker'}
               status={agentState.fact_check_status !== 'PENDING' ? 'DONE' : agentState.current_node === 'FactChecker' ? 'RUNNING' : 'PENDING'}
               data={agentState.fact_check_status !== 'PENDING' ? `Status: ${agentState.fact_check_status}` : undefined}
             />
           </div>
        </div>

        {/* State Inspector */}
        <div className="flex-1 flex flex-col min-h-0 bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
          <div className="p-3 border-b border-slate-800 bg-slate-900 text-xs font-bold text-slate-400 uppercase tracking-wider">
            Agent State (Live)
          </div>
          <div className="flex-1 overflow-auto p-3 font-mono text-[10px] text-slate-300">
            <pre>{JSON.stringify({
              intent: agentState.intent,
              docs_found: agentState.retrieved_docs.length,
              graph_nodes: agentState.retrieved_graph_context.length,
              conflict: agentState.conflict_status,
              fact_check: agentState.fact_check_status,
              curr: agentState.current_node
            }, null, 2)}</pre>
            
            {agentState.retrieved_docs.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-800">
                <div className="text-nexus-400 font-bold mb-2">Retrieved Sources:</div>
                {agentState.retrieved_docs.map((doc, i) => (
                  <div key={i} className="mb-2 text-slate-400 truncate">
                    {i+1}. {doc.title} <span className="text-slate-600">({doc.score})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

const MessageBubble = ({ 
  message, 
  onFeedback 
}: { 
  message: ChatMessage, 
  onFeedback: (id: string, type: 'positive' | 'negative') => void 
}) => {
  const isUser = message.role === 'user';
  const [showTrace, setShowTrace] = useState(false);

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[90%] lg:max-w-[85%] gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isUser ? 'bg-slate-700' : 'bg-nexus-600'}`}>
          {isUser ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
        </div>
        
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} min-w-0 flex-1`}>
          
          <div className={`
            px-5 py-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm w-full
            ${isUser 
              ? 'bg-nexus-600 text-white rounded-tr-none' 
              : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'}
          `}>
            {message.content}
            {message.content === "" && !isUser && <span className="animate-pulse inline-block w-2 h-4 bg-nexus-400 ml-1"></span>}
          </div>
          
          {/* Metadata Footer */}
          <div className="flex flex-wrap items-center gap-4 mt-2 px-1 w-full">
             <span className="text-[10px] text-slate-600">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
             </span>
             
             {message.agentState && (
               <>
                 <button 
                    onClick={() => setShowTrace(!showTrace)}
                    className="text-[10px] text-nexus-400 hover:text-nexus-300 flex items-center gap-1 transition-colors"
                 >
                   {showTrace ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                   LangSmith Trace
                 </button>

                 <div className="flex-1"></div>
                 
                 {/* Badges for Advanced Features */}
                 {message.agentState.conflict_status === 'RESOLVED' && (
                     <span className="flex items-center gap-1 text-[9px] text-nexus-warning bg-nexus-warning/10 px-1.5 py-0.5 rounded border border-nexus-warning/20">
                         <AlertTriangle className="w-2.5 h-2.5" /> Conflict Resolved
                     </span>
                 )}
                 {message.agentState.fact_check_status === 'PASS' && (
                     <span className="flex items-center gap-1 text-[9px] text-nexus-success bg-nexus-success/10 px-1.5 py-0.5 rounded border border-nexus-success/20">
                         <ShieldCheck className="w-2.5 h-2.5" /> Verified
                     </span>
                 )}

                 {/* Feedback Buttons */}
                 <div className="flex items-center gap-2">
                    <button 
                      onClick={() => onFeedback(message.id, 'positive')}
                      className={`p-1 rounded hover:bg-slate-800 transition ${message.userFeedback === 'positive' ? 'text-green-400' : 'text-slate-500'}`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => onFeedback(message.id, 'negative')}
                      className={`p-1 rounded hover:bg-slate-800 transition ${message.userFeedback === 'negative' ? 'text-red-400' : 'text-slate-500'}`}
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                 </div>
               </>
             )}
          </div>

          {/* Trace & Evaluation Panel */}
          {showTrace && message.traceSteps && (
            <div className="mt-3 w-full bg-slate-950/60 border border-slate-800 rounded-lg overflow-hidden animate-in fade-in slide-in-from-top-2">
               
               {/* Evaluations Header */}
               {message.evaluations && (
                 <div className="flex flex-wrap gap-2 p-3 border-b border-slate-800 bg-slate-900/50">
                    {message.evaluations.map((ev, i) => (
                      <div key={i} className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-[10px] flex items-center gap-2">
                        <span className="text-slate-400">{ev.name}</span>
                        <span className={`font-mono font-bold ${ev.score >= 0.9 ? 'text-nexus-success' : 'text-yellow-400'}`}>
                          {ev.score.toFixed(2)}
                        </span>
                      </div>
                    ))}
                 </div>
               )}

               {/* Trace Table */}
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-[10px] font-mono">
                   <thead className="bg-slate-900 text-slate-500">
                     <tr>
                       <th className="p-2 font-medium">Node</th>
                       <th className="p-2 font-medium">Type</th>
                       <th className="p-2 font-medium">Input / Output</th>
                       <th className="p-2 font-medium text-right">Latency</th>
                       <th className="p-2 font-medium text-center">Status</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-800">
                     {message.traceSteps.map((step) => (
                       <tr key={step.id} className="hover:bg-slate-900/30 transition-colors">
                         <td className="p-2 text-nexus-300">{step.name}</td>
                         <td className="p-2 text-slate-500">{step.type}</td>
                         <td className="p-2 max-w-[200px]">
                           <div className="truncate text-slate-400" title={step.input}>In: {step.input}</div>
                           <div className="truncate text-slate-300 mt-0.5" title={step.output}>Out: {step.output}</div>
                         </td>
                         <td className="p-2 text-right text-slate-400">{step.latencyMs}ms</td>
                         <td className="p-2 text-center">
                           <span className={`px-1.5 py-0.5 rounded ${step.status === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                             {step.status}
                           </span>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
               
               <div className="p-2 bg-slate-900/50 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-500">
                 <div className="flex items-center gap-1">
                   <Activity className="w-3 h-3" />
                   Trace ID: {message.traceSteps[0].id.split('_')[1]}...
                 </div>
                 <div className="flex items-center gap-1">
                   <Clock className="w-3 h-3" />
                   Total Latency: {message.traceSteps.reduce((acc, s) => acc + s.latencyMs, 0)}ms
                 </div>
               </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
