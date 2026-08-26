import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini AI client
let aiClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY)
  });
});

// 2. Deep Cognitive Reasoning & Causal Synthesis Endpoint
app.post('/api/cognitive/deep-reason', async (req, res) => {
  try {
    const { context, worldEntities, causalEdges, recentEpisodes, activeHypothesis } = req.body;
    const ai = getGenAI();

    if (!ai) {
      // Deterministic fallback response when Gemini key is not provided in preview
      return res.json({
        analysis: "Autonomous Symbolic Reasoner (Deterministic): High order volume coupled with Supplier Alpha's fixed machine batching induces an exponential queuing delay (+3.2 days). The causal graph confirms positive sensitivity (weight 0.72 -> 0.88). Recommendation: Prioritize Dual-Sourcing (Alpha 60% / Beta 40%) to bound maximum delay to <= 2.0 days while saving 24% vs pure Beta.",
        causalInsights: [
          "Supplier Alpha exhibits asymmetric queuing fragility beyond 80 units.",
          "Dual-sourcing acts as a stochastic risk hedge against single-corridor port congestion.",
          "Buffer inventory below 2.5 days shifts optimal policy from Cost-Minimization to Stockout-Risk-Aversion."
        ],
        discoveredConcepts: [
          { name: "Non-Linear Queuing Threshold", confidence: 0.94, description: "Phase shift in latency when order volume exceeds supplier nominal batch size." },
          { name: "Dual-Channel Supply Hedging", confidence: 0.89, description: "Bifurcating critical safety units to fast suppliers while routing bulk units to low-cost channels." }
        ],
        source: 'symbolic_deterministic_engine'
      });
    }

    const prompt = `You are the Deep Metacognitive & Causal Reasoning Subsystem of an experimental Continuous General Intelligence Architecture.
Analyze the following cognitive system state:
- Active Hypothesis: ${activeHypothesis || 'Analyzing volume vs delivery latency'}
- Entities: ${JSON.stringify(worldEntities || {})}
- Causal Edges: ${JSON.stringify(causalEdges || [])}
- Recent Episodic Traces: ${JSON.stringify(recentEpisodes || [])}

Provide:
1. Deep causal explanation of why prediction errors occurred and where the internal world model diverged from physical reality.
2. 3 concrete causal insights to update the world model.
3. 2 discovered latent concepts distilled from the experiences.

Respond strictly in valid JSON with this structure:
{
  "analysis": "string",
  "causalInsights": ["string", "string", "string"],
  "discoveredConcepts": [
    { "name": "string", "confidence": number, "description": "string" }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.4
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      ...parsed,
      source: 'gemini_3_7_flash_reasoning_core'
    });
  } catch (error: any) {
    console.error('Error in deep-reason endpoint:', error);
    res.status(500).json({ error: error.message || 'Internal reasoning error' });
  }
});

// 3. Concept Discovery Endpoint
app.post('/api/cognitive/concept-discovery', async (req, res) => {
  try {
    const { episodicHistory, currentSemanticMemory } = req.body;
    const ai = getGenAI();

    if (!ai) {
      return res.json({
        concepts: [
          {
            name: "Asymmetric Latency Cascading",
            definition: "Small volumetric perturbations upstream cause disproportionate downstream delivery stalls due to rigid buffer exhaustion.",
            empiricalSupportEpisodes: 4,
            generalityScore: 0.92
          },
          {
            name: "Hedging Efficiency Frontier",
            definition: "The optimal allocation ratio between rapid high-cost suppliers and slow low-cost suppliers that minimizes variance at lowest expected penalty.",
            empiricalSupportEpisodes: 6,
            generalityScore: 0.88
          }
        ]
      });
    }

    const prompt = `You are the Concept Discovery & Abstraction Subsystem of an AGI architecture.
Given the following episodes and semantic memory rules:
Episodic History: ${JSON.stringify(episodicHistory || [])}
Semantic Memory: ${JSON.stringify(currentSemanticMemory || [])}

Extract 2 high-level generalized domain-independent concepts discovered from these experiences.
Format strictly as JSON:
{
  "concepts": [
    { "name": "string", "definition": "string", "empiricalSupportEpisodes": number, "generalityScore": number }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.5
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in concept-discovery endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

async function startServer() {
  // Vite middleware in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AGI Cognitive Architecture System running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
