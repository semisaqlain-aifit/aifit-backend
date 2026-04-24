const OpenAI = require('openai');

// Supports two providers via the OpenAI-compatible SDK:
//   - Groq      (GROQ_API_KEY)      -> free, no billing required  [preferred]
//   - OpenAI    (OPENAI_API_KEY)    -> paid
// Whichever key is set wins. Groq takes precedence if both are set.
function providerConfig() {
  if (process.env.GROQ_API_KEY) {
    return {
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
      chatModel: 'llama-3.3-70b-versatile',
      visionModel: 'llama-3.2-11b-vision-preview',
      provider: 'groq'
    };
  }
  if (process.env.OPENAI_API_KEY) {
    return {
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: undefined,
      chatModel: 'gpt-4o-mini',
      visionModel: 'gpt-4o-mini',
      provider: 'openai'
    };
  }
  throw new Error('No AI key set. Add GROQ_API_KEY (free) or OPENAI_API_KEY to .env');
}

let client = null;
let cachedCfg = null;
function getClient() {
  if (client) return { client, cfg: cachedCfg };
  cachedCfg = providerConfig();
  client = new OpenAI({ apiKey: cachedCfg.apiKey, baseURL: cachedCfg.baseURL });
  console.log(`[AI] using provider: ${cachedCfg.provider} (chat=${cachedCfg.chatModel})`);
  return { client, cfg: cachedCfg };
}

async function chat(messages, { max_tokens = 220 } = {}) {
  const { client, cfg } = getClient();
  const res = await client.chat.completions.create({
    model: cfg.chatModel,
    max_tokens,
    temperature: 0.7,
    messages
  });
  return res.choices[0]?.message?.content?.trim() ?? '';
}

async function visionCaloriesFromBase64(base64) {
  const { client, cfg } = getClient();
  const res = await client.chat.completions.create({
    model: cfg.visionModel,
    max_tokens: 180,
    temperature: 0.2,
    messages: [
      {
        role: 'system',
        content:
          'You analyze meal photos. Return STRICT JSON: {"food":"short name","calories":number,"confidence":0..1}. No prose.'
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Identify the main dish and estimate calories per typical serving.' },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } }
        ]
      }
    ]
  });
  const raw = res.choices[0]?.message?.content ?? '{}';
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  try {
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    return {
      food: String(parsed.food ?? 'Unknown dish'),
      calories: Math.max(0, Math.round(Number(parsed.calories) || 0)),
      confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0.5))
    };
  } catch {
    return { food: 'Unknown dish', calories: 0, confidence: 0 };
  }
}

module.exports = { chat, visionCaloriesFromBase64 };
