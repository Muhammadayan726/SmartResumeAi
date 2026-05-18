
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini if key is present
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// AI endpoints
app.post("/api/ai/generate-summary", async (req, res) => {
  if (!ai) return res.status(500).json({ error: "Gemini API key not configured" });
  try {
    const { jobTitle, experience, skills } = req.body;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a compelling, professional resume summary (2-3 sentences) for a ${jobTitle}. 
        Focus on these details:
        Experience: ${experience}
        Skills: ${skills.join(", ")}
        Output ONLY the summary text, no conversational filler.`,
    });
    
    res.json({ summary: response.text || "" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/ai/analyze-match", async (req, res) => {
  if (!ai) return res.status(500).json({ error: "Gemini API key not configured" });
  try {
    const { resume, jobDescription } = req.body;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the following resume against the job description.
        Resume Data: ${resume}
        Job Description: ${jobDescription}
        
        Provide a match score (0-100) and brief feedback on missing keywords or areas to improve.
        Format your response as a JSON object: { "score": number, "feedback": "string" }`,
      config: {
        responseMimeType: "application/json"
      }
    });
    
    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (error: any) {
    console.error("AI Match Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Payment Verification (Simulated for manual JazzCash/EasyPaisa)
app.post("/api/payments/verify-manual", (req, res) => {
  const { transactionId, method, amount } = req.body;
  // In a real app, this would log to DB for admin to approve. 
  // Here we just acknowledge receipt.
  res.json({ status: "success", message: "Payment submission received. Admin will verify shortly." });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
