import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// We strictly avoid asking for the key in UI. It must be in process.env.API_KEY
// However, since this is a frontend demo running in a browser environment,
// we often need to simulate or use a key if provided by the environment.
// For this demo code generation, we will structure it safely.

let client: GoogleGenAI | null = null;

export const initializeGemini = () => {
  const apiKey = process.env.API_KEY;
  if (apiKey) {
    client = new GoogleGenAI({ apiKey });
  }
};

// Original simple RAG function (kept for backward compatibility or simple fallback)
export const generateRAGResponse = async (
  query: string,
  mockContext: boolean = true
): Promise<{ text: string; thoughts: string[] }> => {
  if (!client) initializeGemini();
  
  // Fallback simulation if no key
  if (!client) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            text: "I am currently running in simulation mode. In a real deployment, I would query the Memgraph knowledge graph and ChromaDB vector store to answer: " + query,
            thoughts: ["Simulation: Intent Analysis", "Simulation: Graph Traversal", "Simulation: Response Synthesis"]
          });
        }, 2000);
      });
  }

  const model = "gemini-2.5-flash";
  try {
    const response: GenerateContentResponse = await client.models.generateContent({
      model: model,
      contents: [{ role: 'user', parts: [{ text: "Answer this query as a RAG agent: " + query }] }]
    });
    return { text: response.text || "No response", thoughts: ["Processed via Gemini Flash"] };
  } catch (e) {
    return { text: "Error calling Gemini.", thoughts: [] };
  }
};

export const extractGraphFromText = async (text: string): Promise<any> => {
    if (!client) initializeGemini();
    if (!client) return { error: "No API Key" };

    const prompt = `
    You are an expert ontology engineer. 
    Extract distinct entities (Person, Org, Event, Concept, Technology) and semantic relationships (WORKS_FOR, CAUSES, PART_OF, USES) from the text.
    
    Text: "${text}"
    
    Return ONLY a JSON object with keys "entities" (list of objects with id, type) and "relations" (list of objects with source, target, type).
    Do not use markdown formatting.
    `;

    try {
        const response = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text || "{}");
    } catch (e) {
        console.error("Extraction Error", e);
        return { error: "Failed to extract" };
    }
}

// --- Phase 3 & 5: Reasoning Engine Functions ---

export const analyzeQueryIntent = async (query: string): Promise<'FACTUAL' | 'CONCEPTUAL' | 'COMPARATIVE' | 'UNKNOWN'> => {
  if (!client) initializeGemini();
  if (!client) return 'FACTUAL'; // Default simulation

  const prompt = `
  Classify the following query into one of these categories: FACTUAL, CONCEPTUAL, COMPARATIVE.
  Return ONLY the category name.
  
  Query: "${query}"
  `;

  try {
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    const text = response.text?.trim().toUpperCase();
    if (text?.includes('FACTUAL')) return 'FACTUAL';
    if (text?.includes('CONCEPTUAL')) return 'CONCEPTUAL';
    if (text?.includes('COMPARATIVE')) return 'COMPARATIVE';
    return 'UNKNOWN';
  } catch (e) {
    console.error("Intent Error", e);
    return 'UNKNOWN';
  }
};

// Phase 5: Streaming Synthesis
export const synthesizeReasonedResponseStream = async function* (
  query: string, 
  intent: string,
  vectorContext: any[], 
  graphContext: any[]
): AsyncGenerator<string, void, unknown> {
  if (!client) initializeGemini();
  
  if (!client) {
    // Simulation: Yield simulated tokens
    const fakeResponse = `Based on the system analysis (Intent: ${intent}), I have synthesized information from ${vectorContext.length} documents and ${graphContext.length} graph entities. The architecture leverages LangGraph for state management and Memgraph for relationship mapping.`;
    const tokens = fakeResponse.split(/(\s+)/); // Split keeping delimiters
    for (const token of tokens) {
        await new Promise(r => setTimeout(r, 30)); // Typing effect
        yield token;
    }
    return;
  }

  // Real Gemini Streaming
  // Using gemini-3-pro-preview for complex reasoning and synthesis
  const model = "gemini-3-pro-preview"; 

  const prompt = `
  You are Nexus, a helpful assistant. Synthesize the answer using *only* the provided context.
  Cite sources using [DocName, p.X] format if available.
  Explain the reasoning path derived from the knowledge graph.

  User Query: "${query}"
  Detected Intent: ${intent}

  [Vector Database Context]
  ${vectorContext.map(d => `- ${d.title}: ${d.snippet}`).join('\n')}

  [Knowledge Graph Context]
  ${graphContext.map(g => `- Entity: ${g.entity}, Connections: ${g.connections} related nodes`).join('\n')}
  
  Answer:
  `;

  try {
    const result = await client.models.generateContentStream({
      model: model,
      contents: prompt,
    });
    
    for await (const chunk of result) {
        yield chunk.text;
    }

  } catch (e) {
    console.error("Synthesis Error", e);
    yield "Error during synthesis step.";
  }
};

// Phase 5: Conflict Detection
export const checkForConflicts = async (vectorDocs: any[], graphNodes: any[]): Promise<{hasConflict: boolean, resolution?: string}> => {
    // In a real scenario, this would compare metadata dates or semantic facts.
    // Here we simulate it.
    await new Promise(r => setTimeout(r, 600));
    
    // Simulate finding a conflict occasionally for demo purposes
    const randomChance = Math.random() > 0.7; 
    
    if (randomChance) {
        return { 
            hasConflict: true, 
            resolution: "Detected version mismatch. Prioritizing Graph data (Timestamp: 2024-10) over Vector Doc (2023-08)." 
        };
    }
    return { hasConflict: false };
};

// Phase 5: Fact Check / Hallucination Guardrail
export const factCheckResponse = async (query: string, response: string): Promise<'PASS' | 'FAIL' | 'CORRECTED'> => {
    // Simulate a self-reflection step
    await new Promise(r => setTimeout(r, 800));
    return 'PASS';
};
