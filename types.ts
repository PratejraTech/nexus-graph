export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  GRAPH = 'GRAPH',
  CHAT = 'CHAT',
  INGESTION = 'INGESTION',
  SETTINGS = 'SETTINGS'
}

export interface NodeData {
  id: string;
  group: number;
  label: string;
  val: number;
}

export interface LinkData {
  source: string;
  target: string;
  value: number;
}

export interface GraphData {
  nodes: NodeData[];
  links: LinkData[];
}

// Phase 4: Observability Types
export interface TraceStep {
  id: string;
  name: string;
  type: 'chain' | 'llm' | 'retriever' | 'tool';
  input: string;
  output: string;
  latencyMs: number;
  status: 'success' | 'error';
  timestamp: Date;
}

export interface EvaluationScore {
  name: 'Faithfulness' | 'Relevance' | 'Graph Utilization';
  score: number; // 0.0 to 1.0
  reasoning?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  thoughts?: string[]; // Chain of thought steps
  sources?: string[]; // RAG sources
  agentState?: AgentGraphState; // Snapshot of state for this message
  // Observability Fields
  traceSteps?: TraceStep[];
  evaluations?: EvaluationScore[];
  userFeedback?: 'positive' | 'negative' | null;
}

export interface SystemStatus {
  api: 'online' | 'offline' | 'degraded';
  memgraph: 'online' | 'offline' | 'syncing';
  chromadb: 'online' | 'offline' | 'indexing';
  postgres: 'online' | 'offline';
}

// Phase 3 & 5: Agent State
export interface AgentGraphState {
  query: string;
  intent: 'FACTUAL' | 'CONCEPTUAL' | 'COMPARATIVE' | 'UNKNOWN';
  plan: string[];
  retrieved_docs: { title: string; score: number; date?: string }[];
  retrieved_graph_context: { entity: string; connections: number }[];
  grader_status: 'PENDING' | 'PASS' | 'FAIL';
  // Phase 5 additions
  conflict_status?: 'DETECTED' | 'RESOLVED' | 'NONE';
  fact_check_status?: 'PENDING' | 'PASS' | 'FAIL' | 'CORRECTED';
  current_node: string | null;
  final_answer: string | null;
}

// Ingestion Types
export interface IngestionFile {
  id: string;
  name: string;
  size: string;
  status: 'PENDING' | 'UPLOADING' | 'CHUNKING' | 'EMBEDDING' | 'COMPLETED' | 'ERROR';
  chunks: number;
}
