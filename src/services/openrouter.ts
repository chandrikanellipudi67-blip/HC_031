// Minimal OpenRouter client adapter — POSTs prompt to OpenRouter completion endpoint
// This file supports three ways to provide the API key/model:
// 1) import.meta.env (Vite) using VITE_OPENROUTER_API_KEY / VITE_OPENROUTER_MODEL
// 2) an in-code default below (convenient for local testing; NOT recommended for public repos)
// 3) explicit parameters passed to openRouterChat(apiKey, model, prompt)

export interface OpenRouterResponse {
  id?: string;
  object?: string;
  created?: number;
  model?: string;
  output?: string;
}

// === EDIT THESE ===
// If you want the key baked into the build (NOT recommended for public projects),
// replace the placeholder below with your actual key string. Keep this file out of
// public repositories if you hard-code a secret here.
const DEFAULT_OPENROUTER_API_KEY = '<YOUR_OPENROUTER_API_KEY_HERE>'; // <-- replace with actual key if you insist
const DEFAULT_OPENROUTER_MODEL = 'gpt-4o-mini'; // change if you prefer another model
// === /EDIT ===

const getDefaultApiKey = () => {
  return (import.meta as any).env?.VITE_OPENROUTER_API_KEY || DEFAULT_OPENROUTER_API_KEY || '';
};

const getDefaultModel = () => {
  return (import.meta as any).env?.VITE_OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODEL || '';
};

export const openRouterChat = async (apiKey: string | undefined, model: string | undefined, prompt: string) => {
  const key = apiKey || getDefaultApiKey();
  const mdl = model || getDefaultModel();

  if (!key) throw new Error('OpenRouter API key required (set VITE_OPENROUTER_API_KEY or provide it in code)');
  if (!mdl) throw new Error('Model name required (set VITE_OPENROUTER_MODEL or provide it in code)');

  const url = `https://api.openrouter.ai/v1/chat/completions`;

  const body = {
    model: mdl,
    messages: [
      { role: 'system', content: 'You are a helpful assistant specialized in healthcare facility search and patient support.' },
      { role: 'user', content: prompt },
    ],
    max_tokens: 512,
    temperature: 0.2,
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`OpenRouter error ${res.status}: ${txt}`);
  }

  const json = await res.json();
  // Attempt to find text in typical response shapes
  const message = json?.choices?.[0]?.message?.content || json?.output || JSON.stringify(json);

  return message;
};
 