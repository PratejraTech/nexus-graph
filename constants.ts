import { GraphData } from './types';

export const INITIAL_GRAPH_DATA: GraphData = {
  nodes: [
    { id: "Nexus Core", group: 1, label: "Nexus Core", val: 20 },
    { id: "User Auth", group: 2, label: "User Auth", val: 10 },
    { id: "Document A", group: 3, label: "Doc: Tech Spec", val: 5 },
    { id: "Document B", group: 3, label: "Doc: API Guide", val: 5 },
    { id: "Entity: Python", group: 4, label: "Python", val: 8 },
    { id: "Entity: React", group: 4, label: "React", val: 8 },
    { id: "Entity: Docker", group: 4, label: "Docker", val: 8 },
    { id: "Entity: LangGraph", group: 4, label: "LangGraph", val: 12 },
    { id: "Entity: FastAPI", group: 4, label: "FastAPI", val: 8 },
    { id: "Vector Store", group: 5, label: "ChromaDB", val: 15 },
    { id: "Graph DB", group: 5, label: "Memgraph", val: 15 },
  ],
  links: [
    { source: "Nexus Core", target: "Vector Store", value: 5 },
    { source: "Nexus Core", target: "Graph DB", value: 5 },
    { source: "Nexus Core", target: "User Auth", value: 2 },
    { source: "Document A", target: "Vector Store", value: 3 },
    { source: "Document B", target: "Vector Store", value: 3 },
    { source: "Entity: Python", target: "Graph DB", value: 2 },
    { source: "Entity: Python", target: "Document A", value: 1 },
    { source: "Entity: React", target: "Document B", value: 1 },
    { source: "Entity: LangGraph", target: "Nexus Core", value: 8 },
    { source: "Entity: FastAPI", target: "Nexus Core", value: 4 },
    { source: "Entity: Docker", target: "Nexus Core", value: 4 },
  ]
};

export const MOCK_LOGS = [
  "[INFO] 10:42:15 - Orchestrator: Initializing agent workflow...",
  "[INFO] 10:42:16 - Graph: Connected to Memgraph (bolt://localhost:7687)",
  "[INFO] 10:42:16 - Vector: Connected to ChromaDB",
  "[INFO] 10:42:18 - Ingestion: Processed 'architecture_v2.pdf' (1.2MB)",
  "[INFO] 10:42:19 - Embeddings: Generated 245 chunks via Google Gemini",
  "[DEBUG] 10:42:25 - Query: 'How do I deploy the backend?'",
  "[INFO] 10:42:26 - Retrieval: Found 3 relevant nodes, 5 vector matches"
];
