import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = Number.parseInt(process.env.PORT || '3000', 10) || 3000;
const isProduction = process.env.NODE_ENV === 'production';
const MAX_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 4_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;
const requestCounts = new Map<string, { count: number; resetAt: number }>();

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// Keep AI prompts bounded so an accidental or abusive request cannot exhaust resources.
app.use(express.json({ limit: '64kb' }));

app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

function isRateLimited(ip: string) {
  const now = Date.now();
  const current = requestCounts.get(ip);

  if (!current || current.resetAt <= now) {
    requestCounts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  current.count += 1;
  return current.count > RATE_LIMIT_MAX_REQUESTS;
}

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
  console.log("Gemini AI Client initialized successfully for Ekatva Humsafar.");
} else {
  console.warn("GEMINI_API_KEY is not defined. AI chat services will run in offline demo mode.");
}

// System Instruction for Humsafar AI
const SYSTEM_INSTRUCTION = `You are Ekatva AI Humsafar (एकत्व एआई हमसफ़र), a deeply knowledgeable, warm, and respectful smart co-pilot dedicated to supporting Indian handloom weavers and cooperative secretaries. Your personality is polite, empathetic, and culturally grounded in India's glorious artisan heritage (like Banarasi, Jamdani, Pochampally, Kanchipuram, and Bhagalpuri traditions).

Your communication style:
- Speak primarily in a respectful mixture of clear Hindi and English (Hindi/Hinglish) to match the weaver's or secretary's input.
- Always prioritize high legibility, polite addressals (like 'नमस्ते जी', 'सादर प्रणाम', 'बुनकर भाई'), and clear formatting.
- Keep responses practical, encouraging, and easy to understand.

Your scope of assistance:
1. FOR WEAVERS (बुनकर):
   - Answer technical queries about yarn counts (e.g., 2/40s, 2/80s, warp vs weft count), warp tension, loom tuning (treadles, shuttle, reed, jacquard cards).
   - Guide on natural dyeing recipes, yarn washing, and warp preparation.
   - Explain traditional weaving techniques and motifs.
   - Provide easy summaries of government schemes like PM Vishwakarma, Weaver Mudra Loan, Handloom Mark, GI tag certifications, and weaver insurance.
2. FOR SECRETARIES (सचिव):
   - Help draft professional cooperative notices, notices in Hindi, meeting agendas, and minutes of the meeting.
   - Formulate polite replies to weaver grievances.
   - Recommend strategies for raw material procurement, reorder levels, and inventory buffers (especially during festive seasons like Diwali, Durga Puja).
   - Analyze buyer RFQs (Request for Quotations) and suggest collaborative coalition divisions.
   - Provide product pricing advice to ensure weavers get fair wages while maintaining market competitiveness.

Avoid technical AI jargon or software lingo. Speak as an experienced handloom elder and wise counselor. If an API key is missing or you are asked unrelated general tech questions, politely redirect them to handloom weaving and cooperative prosperity.`;

// Secure Server-side API endpoint for Ekatva AI Humsafar
app.post('/api/ai/chat', async (req, res) => {
  const { messages, role = 'weaver' } = req.body;
  const clientApiKey = req.headers['x-gemini-api-key'] || process.env.GEMINI_API_KEY;
  const requestIp = req.ip || 'unknown';
  const validRoles = new Set(['weaver', 'secretary']);
  const validMessages = Array.isArray(messages)
    && messages.length > 0
    && messages.length <= MAX_MESSAGES
    && messages.every((message) =>
      message
      && (message.role === 'user' || message.role === 'assistant')
      && typeof message.content === 'string'
      && message.content.trim().length > 0
      && message.content.length <= MAX_MESSAGE_LENGTH
    );

  if (isRateLimited(requestIp)) {
    return res.status(429).json({ error: 'rate_limited', message: 'Too many requests. Please wait a minute and try again.' });
  }

  if (!validMessages || !validRoles.has(role)) {
    return res.status(400).json({ error: 'invalid_request', message: 'Please provide a valid, concise conversation request.' });
  }
  
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'invalid_messages', message: 'कृपया संदेशों की सूची प्रदान करें।' });
  }

  // Initialize transient Gemini client if clientApiKey is provided
  let activeAi: GoogleGenAI | null = null;
  if (clientApiKey) {
    activeAi = new GoogleGenAI({
      apiKey: clientApiKey as string,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  } else {
    activeAi = ai;
  }

  // Fallback offline mode if Gemini API key is missing
  if (!activeAi) {
    const lastMessage = messages[messages.length - 1]?.content || '';
    let responseText = `प्रणाम! वर्तमान में एकत्व एआई हमसफ़र ऑफ़लाइन (Demo Mode) है क्योंकि एआई कुंजी (API Key) कॉन्फ़िगर नहीं है।\n\nआपकी क्वेरी थी: "${lastMessage}"\n\nजब एआई कुंजी सक्रिय होगी, तो हमसफ़र आपको आपके करघा रखरखाव, पारंपरिक डिज़ाइन, और सहकारी रणनीतियों के बारे में वास्तविक एआई मार्गदर्शन देगा।`;
    
    // Simple custom responses for demo
    const lowerMsg = lastMessage.toLowerCase();
    if (lowerMsg.includes('योजना') || lowerMsg.includes('scheme')) {
      responseText = `सादर प्रणाम! पीएम विश्वकर्मा योजना (PM Vishwakarma) के तहत बुनकर भाइयों को ₹3 लाख तक का ऋण 5% ब्याज दर पर मिलता है, साथ ही ₹15,000 का टूलकिट प्रोत्साहन और कौशल प्रशिक्षण भी मिलता है। एकत्व आपको इसे सहकारी समिति के माध्यम से सीधे सत्यापित करने में मदद करता है।`;
    } else if (lowerMsg.includes('करघा') || lowerMsg.includes('maintenance')) {
      responseText = `नमस्ते जी! करघे पर ताने (warp) का तनाव हमेशा एक समान रहना चाहिए। यदि धागा बार-बार टूट रहा है, तो चेक करें कि रीड (reed) में जंग तो नहीं लगा है या शटल (shuttle) की नोक बहुत खुरदरी तो नहीं है। हल्के नारियल तेल से कमानियों की सफ़ाई करें।`;
    } else if (lowerMsg.includes('नोटिस') || lowerMsg.includes('notice')) {
      responseText = `सचिव महोदय, यहाँ एक त्वरित नोटिस मसौदा है:\n\n**आवश्यक सूचना: मासिक बैठक**\nसमस्त बुनकर सदस्यों को सूचित किया जाता है कि आगामी 15 तारीख को सुबह 11:00 बजे सहकारी भवन में बैठक आयोजित की जाएगी। मुख्य एजेंडा: नए धागे का स्टॉक आवंटन एवं आगामी त्योहार मांग की समीक्षा। आपकी उपस्थिति अनिवार्य है।\n- सचिव, एकत्व समिति`;
    }

    return res.json({ text: responseText });
  }

  try {
    // Format conversation history for Gemini API
    // The modern @google/genai SDK chats.create uses a specific message format
    // We can also just use generateContent with the history formatted as part of the prompt
    // or call ai.chats.create
    const formattedContents = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const modelsToTry = ['gemini-3.5-flash', 'gemini-2.5-flash'];
    let response = null;
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`Attempting Gemini generation using model: ${modelName}`);
        response = await activeAi.models.generateContent({
          model: modelName,
          contents: formattedContents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION + `\n\nNote: The active user role in the app is: ${role.toUpperCase()}. Provide assistance tailored to this role.`,
            temperature: 0.7,
          },
        });
        if (response) {
          console.log(`Success! Response generated using model: ${modelName}`);
          break;
        }
      } catch (err: any) {
        console.warn(`Failed to generate content with ${modelName}:`, err?.message || err);
        lastError = err;
        // Wait a small moment before retrying next model
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    if (!response) {
      throw lastError || new Error("All model fallback attempts failed.");
    }

    const replyText = response.text || "माफ़ कीजिये, मैं अभी इसका उत्तर देने में असमर्थ हूँ।";
    res.json({ text: replyText });

  } catch (error: any) {
    console.error("Gemini API Error in /api/ai/chat:", error);
    res.status(500).json({ 
      error: 'api_error', 
      message: 'एआई सलाहकार से जुड़ने में विफल। कृपया पुनः प्रयास करें।',
      ...(isProduction ? {} : { details: error?.message || String(error) })
    });
  }
});

// Configure Vite or Static files based on environment
async function setupViteOrStatic() {
  if (process.env.NODE_ENV !== 'production') {
    console.log("Setting up Vite development middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving production static assets from dist/...");
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { maxAge: '1h', etag: true }));
    app.all('/api/*', (_req, res) => {
      res.status(404).json({ error: 'not_found' });
    });
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Ekatva Full-Stack Server running on http://0.0.0.0:${PORT} [Mode: ${process.env.NODE_ENV || 'development'}]`);
  });
}

setupViteOrStatic();
