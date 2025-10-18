import { useState, useEffect, useRef } from 'react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { fetchRealFacilitiesByType } from '@/services/overpassApi';
import { queryOpenRouter } from '@/services/openrouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
}

const HealthChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gpt-4o-mini');
  const { latitude, longitude } = useGeolocation();
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages]);

  const pushMessage = (m: ChatMessage) => setMessages((s) => [...s, m]);

  const handleUser = async () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { id: String(Date.now()), role: 'user', text: input };
    pushMessage(userMsg);
    setInput('');

    setLoading(true);

    // Check simple intent keywords locally first
    const lower = userMsg.text.toLowerCase();
    try {
      if (lower.includes('nearest') || lower.includes('nearby') || lower.includes('closest')) {
        // Try to detect type
        const types = ['hospital', 'blood_bank', 'pharmacy', 'clinic'];
        let requested: string | null = null;
        for (const t of types) if (lower.includes(t)) requested = t;

        if (!requested) requested = 'hospital';

        if (latitude && longitude) {
          const real = await fetchRealFacilitiesByType(latitude, longitude, requested, 10); // 10km
          if (real && real.length) {
            const top = real.slice(0, 5);
            const txt = `Found ${real.length} nearby ${requested}s. Top results:\n` +
              top.map((r, i) => `${i+1}. ${r.name} — ${r.address} — ${r.phone}`).join('\n');
            pushMessage({ id: String(Date.now()+1), role: 'assistant', text: txt });
            setLoading(false);
            return;
          } else {
            pushMessage({ id: String(Date.now()+1), role: 'assistant', text: 'No nearby results found.' });
            setLoading(false);
            return;
          }
        } else {
          pushMessage({ id: String(Date.now()+1), role: 'assistant', text: 'Location not available. Please enable geolocation.' });
          setLoading(false);
          return;
        }
      }

      // Fallback to using OpenRouter if API key is provided
      if (apiKey) {
  const system = { role: 'system', content: "You are a medical assistant. Use the user's provided location to find nearby facilities when asked. If asked for resources, suggest hospitals, clinics, pharmacies or blood banks from OpenStreetMap results." };
  const user = { role: 'user', content: `User query: ${userMsg.text}. Location: lat=${latitude || 'unknown'} lon=${longitude || 'unknown'}. Return succinct answers and include facility suggestions if relevant.` };
        const reply = await queryOpenRouter(apiKey, model, [system, user]);
        pushMessage({ id: String(Date.now()+2), role: 'assistant', text: reply });
        setLoading(false);
        return;
      }

      // if no apiKey, simple fallback
      pushMessage({ id: String(Date.now()+3), role: 'assistant', text: "I can find nearby hospitals or blood banks if you ask 'nearest hospital' or provide an API key to use the AI assistant." });
    } catch (err: any) {
      pushMessage({ id: String(Date.now()+4), role: 'assistant', text: 'Error: ' + (err?.message || String(err)) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Health Assistant Chat</h1>

      <Card className="border-border/50 p-4 mb-4">
        <CardContent>
          <div className="flex gap-2 items-center mb-3">
            <input placeholder="OpenRouter API key (optional)" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="flex-1 border p-2" />
            <input placeholder="model" value={model} onChange={(e)=> setModel(e.target.value)} className="w-44 border p-2" />
          </div>

          <div className="h-96 overflow-auto border p-3 bg-white/50">
            {messages.map((m) => (
              <div key={m.id} className={`mb-3 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                <div className={`${m.role === 'user' ? 'inline-block bg-blue-600 text-white px-3 py-2' : 'inline-block bg-muted/10 px-3 py-2'}`}>{m.text}</div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="mt-3 flex gap-2">
            <Textarea value={input} onChange={(e:any) => setInput(e.target.value)} className="flex-1" placeholder="Ask for nearest hospital, blood bank, or ask medical resource questions" />
            <Button onClick={handleUser} className="bg-blue-600 text-white" disabled={loading}>{loading ? 'Searching...' : 'Send'}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HealthChat;
