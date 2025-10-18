import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Message } from 'iconsax-react';
import { openRouterChat } from '@/services/openrouter';
import { fetchRealFacilitiesByType, fetchFacilitiesBySpecialty } from '@/services/overpassApi';

type Message = { role: 'user' | 'assistant'; text: string };

type FlowState = 'idle' | 'askSymptom' | 'askSeverity' | 'askDuration' | 'review' | 'done';

const ChatWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const elRef = useRef<HTMLDivElement | null>(null);
  const messagesRef = useRef<HTMLDivElement | null>(null);

  const [flow, setFlow] = useState<FlowState>('idle');
  const [symptom, setSymptom] = useState('');
  const [severity, setSeverity] = useState('');
  const [duration, setDuration] = useState('');
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLon, setUserLon] = useState<number | null>(null);
  const [place, setPlace] = useState<string>('');
  const [providers, setProviders] = useState<any[]>([]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setUserLat(pos.coords.latitude);
        setUserLon(pos.coords.longitude);
      });
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    if (messages.length === 0) {
      setTimeout(() => addMessage('assistant', 'Hi — I am Medinet Assistant. How are you feeling today?'), 200);
      setFlow('askSymptom');
      setSymptom('');
      setSeverity('');
      setDuration('');
    }
  }, [open]);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, providers, open]);

  const addMessage = (role: Message['role'], text: string) => {
    setMessages((m) => [...m, { role, text }]);
  };

  const handleUserReply = async (text: string) => {
    const extractedPlace = parsePlaceFromText(text);
    if (extractedPlace) setPlace(extractedPlace);

    addMessage('user', text);
    if (flow === 'askSymptom') {
      setSymptom(text);
      setFlow('askSeverity');
      addMessage('assistant', 'On a scale of mild/moderate/severe, how severe are your symptoms?');
      return;
    }

    if (flow === 'askSeverity') {
      setSeverity(text);
      setFlow('askDuration');
      addMessage('assistant', 'How long have you been experiencing this? (e.g., 2 days, 1 week)');
      return;
    }

    if (flow === 'askDuration') {
      setDuration(text);
      setFlow('review');
      addMessage('assistant', `Thanks — here's what I understood:`);
      addMessage('assistant', `Symptom: ${symptom}`);
      addMessage('assistant', `Severity: ${severity || 'not specified'}`);
      addMessage('assistant', `Duration: ${duration || text || 'not specified'}`);
      addMessage('assistant', 'Please confirm when you are ready to proceed, or edit the details.');
      return;
    }

    await freeChat(text);
  };

  function parsePlaceFromText(text: string) {
    if (!text) return '';
    const m = text.match(/\b(?:in|at)\s+([A-Za-z\s]+)/i);
    if (m && m[1]) return m[1].trim();
    const trimmed = text.trim();
    if (/^[A-Z][a-z]+(?:\s[A-Z][a-z]+)*$/.test(trimmed) && trimmed.split(' ').length <= 3) return trimmed;
    return '';
  }

  const freeChat = async (text: string) => {
    setLoading(true);
    try {
      // Build conversation history for better context
      const history = messages.map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text }));
      // Append current user text
      history.push({ role: 'user', content: text });

      // Convert to a single prompt for minimal client adapter
      const prompt = history.map((h) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`).join('\n');

      const resp = await openRouterChat(undefined, undefined, prompt);
      addMessage('assistant', String(resp));
    } catch (err: any) {
      addMessage('assistant', `Error: ${err?.message || String(err)}. If this persists, try again or check your network.`);
    } finally {
      setLoading(false);
    }
  };

  const analyzeAndSuggest = async (_userText?: string) => {
    setLoading(true);
    try {
      const prompt = `You are a medical assistant. A patient reports the following:\n- Symptom: ${symptom}\n- Severity: ${severity}\n- Duration: ${duration}\n\nProvide a JSON response with keys: precautions (array of short strings), specialties (array of specialties like cardiology, pediatrics, neurology), and a short advice string. Keep JSON only.`;

      let parsed: any = null;
      try {
        const raw = await openRouterChat(undefined, undefined, prompt);
        try {
          parsed = JSON.parse(raw);
        } catch (e) {
          const m = raw.match(/\{[\s\S]*\}/);
          if (m) parsed = JSON.parse(m[0]);
        }
      } catch (err: any) {
        console.warn('OpenRouter request failed, using local fallback:', err?.message || err);
        parsed = localFallbackAnalysis({ symptom, severity, duration });
        addMessage('assistant', 'Note: Could not reach the AI service, showing a local fallback analysis.');
      }

      if (!parsed) {
        addMessage('assistant', 'Sorry, I could not parse the response or produce a fallback. Please try again later.');
        setLoading(false);
        return;
      }

      if (Array.isArray(parsed.precautions)) {
        addMessage('assistant', 'Precautions:');
        parsed.precautions.forEach((p: string) => addMessage('assistant', `- ${p}`));
      }

      const specialties: string[] = parsed.specialties || [];
      if (specialties.length > 0) {
        addMessage('assistant', `I recommend consulting: ${specialties.join(', ')}`);

        setProviders([]);
        for (const s of specialties.slice(0, 3)) {
          let results: any[] = [];
          try {
            if (place && place.trim().length > 0) {
              results = await fetchFacilitiesBySpecialty(place.trim(), undefined, s, 50);
            } else if (userLat && userLon) {
              const type = mapSpecialtyToType(s);
              results = await fetchRealFacilitiesByType(userLat, userLon, type as any, 20);
            }
          } catch (err) {
            console.warn('Provider lookup failed for', s, err);
          }

          if (results && results.length > 0) {
            addMessage('assistant', `Nearby ${s} providers:`);
            setProviders((prev) => {
              const merged = [...prev, ...results.slice(0, 5)];
              const unique: any[] = [];
              const seen = new Set<string>();
              for (const r of merged) {
                const key = `${(r.name || '').toLowerCase()}|${r.latitude}|${r.longitude}`;
                if (!seen.has(key)) { seen.add(key); unique.push(r); }
              }
              unique.sort((a, b) => (a.distance || 0) - (b.distance || 0));
              return unique;
            });
          } else {
            addMessage('assistant', `No nearby ${s} providers found.`);
            const mapQuery = place && place.trim().length > 0 ? encodeURIComponent(`${s} in ${place}`) : (userLat && userLon ? `${userLat},${userLon}` : encodeURIComponent(`${s}`));
            addMessage('assistant', `You can also try this map search: https://www.google.com/maps/search/?api=1&query=${mapQuery}`);
          }
        }
      }

      if (parsed.advice) {
        addMessage('assistant', `Advice: ${parsed.advice}`);
      }

      setFlow('done');
    } catch (err: any) {
      console.error(err);
      addMessage('assistant', `Error analyzing: ${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  function localFallbackAnalysis({ symptom, severity, duration }: { symptom: string; severity: string; duration: string }) {
    const precautions: string[] = [];
    const specialties: string[] = [];
    let advice = '';

    const s = symptom.toLowerCase();
    if (s.includes('chest') || s.includes('pain') || s.includes('shortness') || s.includes('breath')) {
      specialties.push('Cardiology');
      precautions.push('Sit upright and rest');
      precautions.push('Avoid exertion');
      advice = 'If symptoms are sudden or severe, seek emergency care immediately.';
    } else if (s.includes('fever') || s.includes('cough') || s.includes('sore throat')) {
      specialties.push('General Practice');
      precautions.push('Stay hydrated');
      precautions.push('Monitor temperature regularly');
      advice = 'If fever is high or lasts more than 3 days, consult a doctor.';
    } else if (s.includes('headache') || s.includes('migraine')) {
      specialties.push('Neurology');
      precautions.push('Rest in a quiet, dark room');
      advice = 'If headache is sudden and severe or accompanied by confusion, seek urgent care.';
    } else if (s.includes('preg') || s.includes('pregnancy') || s.includes('labour')) {
      specialties.push('Obstetrics');
      precautions.push('Contact your obstetrician');
      advice = 'For any alarming symptoms in pregnancy, seek immediate care.';
    } else {
      specialties.push('General Practice');
      precautions.push('Monitor symptoms and rest');
      advice = 'If symptoms worsen or persist, see a GP for evaluation.';
    }

    const sev = severity.toLowerCase();
    if (sev.includes('severe')) {
      precautions.unshift('Consider urgent medical attention');
      advice = 'Severe symptoms warrant prompt medical evaluation.';
    }

    return { precautions, specialties, advice };
  }

  function mapSpecialtyToType(s: string) {
    const low = s.toLowerCase();
    if (low.includes('cardio')) return 'hospital';
    if (low.includes('pedi')) return 'clinic';
    if (low.includes('pharm')) return 'pharmacy';
    return 'clinic';
  }

  return (
    <div>
      <div className="fixed right-0 top-0 bottom-0 z-50 pointer-events-none">
        <div className="flex items-end pointer-events-auto">
          {open && (
            <Card ref={elRef} className="fixed right-4 bottom-28 sm:bottom-6 h-[80vh] w-[95vw] sm:w-96 md:w-1/3 lg:w-1/4 shadow-2xl rounded-2xl border-0 bg-white/95 backdrop-blur-md overflow-hidden">
              <CardHeader className="border-b p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">Medinet Assistant</h3>
                    <p className="text-xs text-gray-500">Quick help & nearby providers</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => { setMessages([]); }} className="text-gray-500 hover:text-gray-700">Clear</Button>
                    <Button variant="ghost" size="sm" onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-700">Close</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3 flex flex-col h-[calc(80vh-3.5rem)] justify-between pb-6">
                <div ref={messagesRef} className="flex-1 overflow-y-auto bg-transparent rounded-lg p-2 mb-3 space-y-3">
                  {messages.map((m, idx) => (
                    <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border text-gray-800'} p-3 rounded-xl max-w-[85%] shadow-sm`}>
                        {m.text}
                      </div>
                    </div>
                  ))}
                  {providers.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {providers.map((p, i) => (
                        <Card key={i} className="bg-white shadow-sm hover:shadow-md transition-shadow">
                          <CardContent className="p-3">
                            <div className="flex flex-col sm:flex-row justify-between gap-3">
                              <div>
                                <h4 className="font-semibold text-gray-700">{p.name}</h4>
                                <p className="text-sm text-gray-500">{p.address || 'Address not available'}</p>
                                <p className="text-sm text-gray-500">{p.phone || 'Phone N/A'}</p>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <a href={`https://www.google.com/maps/search/?api=1&query=${p.latitude},${p.longitude}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 text-sm">Map</a>
                                <a href={`https://www.openstreetmap.org/?mlat=${p.latitude}&mlon=${p.longitude}#map=18/${p.latitude}/${p.longitude}`} target="_blank" rel="noreferrer" className="text-gray-500 text-sm">OSM</a>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  {flow === 'review' ? (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Please confirm your details.</p>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => { setFlow('done'); addMessage('assistant', 'Confirmed — analyzing...'); analyzeAndSuggest(); }} className="bg-blue-600 text-white">Confirm</Button>
                        <Button size="sm" variant="outline" onClick={() => { setFlow('askSymptom'); addMessage('assistant', 'Please update your symptom.'); }}>Edit</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full mt-auto">
                      <div className="mb-2">
                        <input value={place} onChange={(e) => setPlace(e.target.value)} placeholder="City (e.g., Hyderabad)" className="w-full p-2 border rounded-md text-sm" />
                      </div>
                      <div className="relative">
                        <input
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { handleUserReply(input); setInput(''); } }}
                          placeholder="Type a reply..."
                          className="w-full pr-14 p-2 border rounded-md"
                        />
                        <button
                          onClick={() => { handleUserReply(input); setInput(''); }}
                          disabled={loading}
                          aria-label="Send message"
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-white p-3 rounded-full shadow-md hover:bg-blue-700 transition-colors flex items-center justify-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M22 2L11 13" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M22 2L15 22L11 13L2 9L22 2Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          {!open && (
            <div className="fixed right-6 bottom-24 sm:bottom-6 safe-bottom">
              <button
                className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors"
                onClick={() => setOpen(true)}
                aria-label="Open Assistant"
              >
                <Message size="20" variant="Bold" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatWidget;