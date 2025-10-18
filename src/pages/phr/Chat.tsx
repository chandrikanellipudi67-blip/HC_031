import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Heart } from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { openRouterChat } from '@/services/openrouter';
import { fetchRealFacilitiesByType } from '@/services/overpassApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

const Chat: React.FC = () => {
  const { latitude, longitude } = useGeolocation();
  const navigate = useNavigate();
  const [apiKey, setApiKey] = useState<string>('');
  const [model, setModel] = useState<string>('');
  const [input, setInput] = useState<string>('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([]);
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Structured intake flow states
  type FlowState =
    | 'idle'
    | 'askSymptom'
    | 'askSeverity'
    | 'askDuration'
    | 'askAge'
    | 'askGender'
    | 'askUrgency'
    | 'askInsurance'
    | 'review'
    | 'done';

  const [flow, setFlow] = useState<FlowState>('idle');
  const [symptom, setSymptom] = useState('');
  const [severity, setSeverity] = useState('');
  const [duration, setDuration] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [urgency, setUrgency] = useState('');
  const [insurance, setInsurance] = useState('');
  const [providers, setProviders] = useState<any[]>([]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const addMessage = (role: 'user' | 'assistant', text: string) => {
    setMessages((m) => [...m, { role, text }]);
  };

  const detectPlaceQuery = (q: string) => {
    const low = q.toLowerCase();
    if (low.includes('pharmacy') || low.includes('drug') || low.includes('pharm')) return 'pharmacy';
    if (low.includes('clinic') || low.includes('doctor')) return 'clinic';
    if (low.includes('hospital') || low.includes('emergency') || low.includes('er')) return 'hospital';
    if (low.includes('nearest') || low.includes('closest')) return 'hospital';
    return null;
  };

  // Small local conversational responder used when no remote AI is configured.
  const localConversationalResponder = (text: string) => {
    const q = text.toLowerCase();
    if (q.includes('hello') || q.includes('hi') || q.includes('hey')) return 'Hello — how can I help? Describe your symptoms or ask to find a nearby hospital, clinic or pharmacy.';
    if (q.includes('thank')) return 'You\'re welcome — glad to help.';
    if (q.includes('what can you do') || q.includes('help me') || q.includes('capabil')) return 'I can help you find nearby healthcare facilities, give simple guidance based on symptoms, and suggest specialties. For full conversational answers you can provide an OpenRouter API key.';
    if (q.includes('nearest') && (q.includes('hospital') || q.includes('pharmacy') || q.includes('clinic'))) return `Sure — I can search for that. Please allow location access so I can find facilities near you.`;
    if (q.includes('fever') || q.includes('cough')) return 'If you have fever or cough: stay hydrated, rest, and monitor your temperature. If breathing difficulty or very high fever, seek urgent care.';
    if (q.includes('chest pain')) return 'Chest pain can be serious. If it\'s sudden, severe, or accompanied by breathlessness, call emergency services immediately.';
    // fallback: echo and offer next step
    return `I heard: "${text}" — would you like suggestions (yes/no) or to search nearby facilities?`;
  };
    // Default behavior: treat messages as interactive free-form chat with AI.
    // The user can also click "Start guided intake" to run the structured intake flow.
    const handleSend = async (overrideText?: string) => {
      const raw = overrideText !== undefined ? String(overrideText) : input;
      const trimmed = raw.trim();
      if (!trimmed) return;
      const userText = trimmed;
      addMessage('user', userText);
      setLoading(true);
      setInput('');

      try {
        // If in a guided flow, handle structured progression
        if (flow !== 'idle') {
          // reuse existing logic by delegating to handleSend when structured
          // mimic previous behavior by sending message through existing handler path
          // simple approach: if we're in guided flow, append to messages and let handleSendStructured manage progression
          // For clarity, handle structured progression inline here:
          if (flow === 'askSymptom') {
            setSymptom(userText);
            addMessage('assistant', 'On a scale of mild / moderate / severe, how would you rate your symptoms?');
            setFlow('askSeverity');
            setLoading(false);
            return;
          }

          if (flow === 'askSeverity') {
            setSeverity(userText);
            addMessage('assistant', 'How long have you had these symptoms? (e.g. 2 days, 1 week)');
            setFlow('askDuration');
            setLoading(false);
            return;
          }

          if (flow === 'askDuration') {
            setDuration(userText);
            addMessage('assistant', 'What is the patient age?');
            setFlow('askAge');
            setLoading(false);
            return;
          }

          if (flow === 'askAge') {
            setAge(userText);
            addMessage('assistant', 'What is the patient gender? (male/female/other)');
            setFlow('askGender');
            setLoading(false);
            return;
          }

          if (flow === 'askGender') {
            setGender(userText);
            addMessage('assistant', 'How urgent is this? (routine / urgent / emergency)');
            setFlow('askUrgency');
            setLoading(false);
            return;
          }

          if (flow === 'askUrgency') {
            setUrgency(userText);
            addMessage('assistant', 'Do you have any insurance or preference for public/private care?');
            setFlow('askInsurance');
            setLoading(false);
            return;
          }

          if (flow === 'askInsurance') {
            setInsurance(userText);
            // build review
            addMessage('assistant', `Thanks — here is what I understood:`);
            addMessage('assistant', `Symptom: ${symptom || userText}`);
            addMessage('assistant', `Severity: ${severity || 'not specified'}`);
            addMessage('assistant', `Duration: ${duration || 'not specified'}`);
            addMessage('assistant', `Age: ${age || 'not specified'}`);
            addMessage('assistant', `Gender: ${gender || 'not specified'}`);
            addMessage('assistant', `Urgency: ${urgency || 'not specified'}`);
            addMessage('assistant', `Insurance/Preference: ${insurance || userText}`);
            addMessage('assistant', 'Please confirm to get recommended specialties and nearby providers, or type edit to change any detail.');
            setFlow('review');
            setLoading(false);
            return;
          }

          if (flow === 'review') {
            const low = userText.toLowerCase();
            if (low.startsWith('edit')) {
              addMessage('assistant', 'Okay — which detail would you like to edit? (symptom / severity / duration / age / gender / urgency / insurance)');
              setFlow('askSymptom');
              setLoading(false);
              return;
            }

            addMessage('assistant', 'Confirmed — analyzing and finding recommended specialties and nearby providers...');
            await analyzeAndSuggest();
            setLoading(false);
            return;
          }
        }

        // Default interactive behavior: send message to AI and return result
        const placeType = detectPlaceQuery(userText);
        if (placeType && latitude && longitude) {
          addMessage('assistant', `Searching for nearest ${placeType} around your location...`);
          const results = await fetchRealFacilitiesByType(latitude, longitude, placeType as string, 20000);

          if (results && results.length > 0) {
            const nearest = results[0];
            addMessage('assistant', `Nearest ${placeType}: ${nearest.name} \u2014 ${nearest.address || 'Address not available'} \u2014 ${nearest.phone || 'Phone N/A'}`);
            setMessages((m) => [...m, { role: 'assistant', text: JSON.stringify({ facility: nearest }) }]);
            setLoading(false);
            return;
          } else {
            addMessage('assistant', `I couldn't find a nearby ${placeType} at this time.`);
          }
        }

        // If user provided an OpenRouter key/model, use remote AI. Otherwise use local conversational fallback.
        if (apiKey || model) {
          const response = await openRouterChat(apiKey || undefined, model || undefined, userText);
          addMessage('assistant', response);
        } else {
          // Local interactive fallback: small rule-based conversational replies plus calling local analysis when appropriate
          const localReply = localConversationalResponder(userText);
          addMessage('assistant', localReply);
        }
      } catch (err: any) {
        console.error(err);
        addMessage('assistant', `Error: ${err?.message || String(err)}`);
      } finally {
        setLoading(false);
      }
    };

  const analyzeAndSuggest = async () => {
    setLoading(true);
    try {
      const prompt = `You are a medical assistant. A patient reports the following:\n- Symptom: ${symptom}\n- Severity: ${severity}\n- Duration: ${duration}\n- Age: ${age}\n- Gender: ${gender}\n\nProvide a JSON response with keys: precautions (array of short strings), specialties (array of specialties like cardiology, pediatrics, neurology), and a short advice string. Return JSON only.`;

      let parsed: any = null;
      try {
        const raw = await openRouterChat(apiKey || undefined, model || undefined, prompt);
        try {
          parsed = JSON.parse(raw);
        } catch (e) {
          const m = String(raw).match(/\{[\s\S]*\}/);
          if (m) parsed = JSON.parse(m[0]);
        }
      } catch (err) {
        console.warn('OpenRouter request failed, using local fallback:', err);
        parsed = localFallbackAnalysis({ symptom, severity, duration });
        addMessage('assistant', 'Note: Could not reach AI service; showing a local fallback analysis.');
      }

      if (!parsed) {
        addMessage('assistant', 'Sorry, could not produce recommendations at this time.');
        setLoading(false);
        return;
      }

      if (Array.isArray(parsed.precautions)) {
        addMessage('assistant', 'Precautions:');
        parsed.precautions.forEach((p: string) => addMessage('assistant', `- ${p}`));
      }

      const specialties: string[] = parsed.specialties || [];
      if (specialties.length > 0) {
        addMessage('assistant', `Recommended specialties: ${specialties.join(', ')}`);

        setProviders([]);
        for (const s of specialties.slice(0, 3)) {
          try {
            let results: any[] = [];
            if (latitude && longitude) {
              const type = mapSpecialtyToType(s);
              results = await fetchRealFacilitiesByType(latitude, longitude, type as any, 20);
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
              addMessage('assistant', `No nearby ${s} providers found. Try a map search.`);
            }
          } catch (err) {
            console.warn('Provider lookup failed for', s, err);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} aria-label="Back" className="p-2 rounded-md hover:bg-gray-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Health Assistant</h1>
          <p className="text-sm text-gray-500">Get local facility info or quick guidance</p>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => { addMessage('assistant', 'Starting guided intake — I will ask a few quick questions.'); setFlow('askSymptom'); }}>Start guided intake</Button>
          </div>
        </div>

        <Card className="bg-white shadow-md border-0 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 p-6 flex flex-col h-[70vh]">
              <div className="mb-4 flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder="OpenRouter API Key (optional)"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Model (optional) e.g. nvidia/nemotron-nano-9b-v2:free"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="flex-1"
                />
              </div>

              <div className="flex-1 border rounded-lg bg-gray-50 p-4 flex flex-col">
                <ScrollArea className="flex-1 pr-4">
                  <div ref={listRef} className="space-y-4">
                    {messages.length === 0 && (
                      <div className="text-center text-sm text-gray-500 py-12">
                        Start the conversation — click send to begin a guided intake for finding the right doctor or hospital.
                      </div>
                    )}

                    {messages.map((m, i) => {
                      try {
                        const parsed = JSON.parse(m.text);
                        if (parsed?.facility) {
                          const f = parsed.facility;
                          return (
                            <Card key={i} className="mb-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                              <CardContent className="p-4">
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                  <div>
                                    <h3 className="font-semibold text-lg text-gray-700">{f.name}</h3>
                                    <p className="text-sm text-gray-500">{f.address || 'Address not available'}</p>
                                    <p className="text-sm text-gray-500">{f.phone || 'Phone N/A'}</p>
                                  </div>
                                  <a
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    href={`https://www.google.com/maps/search/?api=1&query=${f.latitude},${f.longitude}`}
                                    className="text-blue-600 hover:text-blue-800 underline text-sm mt-2 sm:mt-0"
                                  >
                                    Open in Maps
                                  </a>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        }
                      } catch (e) {}

                      return (
                        <div key={i} className="flex items-start gap-3">
                          <div className={`flex-shrink-0 mt-1 p-2 rounded-full bg-${m.role === 'user' ? 'blue-600' : 'gray-200'} text-white`}>
                            {m.role === 'user' ? <User className="h-5 w-5 text-white" /> : <Heart className="h-5 w-5 text-gray-600" />}
                          </div>
                          <div className={`rounded-xl p-3 ${m.role === 'user' ? 'bg-blue-600 text-white ml-auto' : 'bg-white border text-gray-800'} shadow-sm max-w-[80%]`}>
                            {m.text}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>

                <div className="mt-4 sticky bottom-0 bg-transparent pt-4">
                  <div className="flex gap-3">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={
                        flow === 'askSymptom'
                          ? 'Describe symptoms (e.g. chest pain, fever)'
                          : flow === 'askSeverity'
                          ? 'mild / moderate / severe'
                          : flow === 'askDuration'
                          ? 'How long (e.g. 2 days)'
                          : flow === 'askAge'
                          ? 'Age in years'
                          : flow === 'askGender'
                          ? 'male / female / other'
                          : flow === 'askUrgency'
                          ? 'routine / urgent / emergency'
                          : flow === 'askInsurance'
                          ? 'insurance or preference'
                          : 'Type a message or press Send to start intake'
                      }
                      className="flex-1"
                    />
                    <Button
                      size="lg"
                      className="bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400 rounded-full"
                      onClick={handleSend}
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="animate-spin" /> : 'Send'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1 p-6">
              <Card className="bg-white/90 shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-md font-semibold text-gray-700">Summary</h3>
                      <p className="text-sm text-gray-500">{latitude ? `${latitude.toFixed(3)}, ${longitude?.toFixed(3)}` : 'Location not available'}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-gray-700 space-y-1">
                    <div><strong>Symptom:</strong> {symptom || '-'}</div>
                    <div><strong>Severity:</strong> {severity || '-'}</div>
                    <div><strong>Duration:</strong> {duration || '-'}</div>
                    <div><strong>Age:</strong> {age || '-'}</div>
                    <div><strong>Gender:</strong> {gender || '-'}</div>
                    <div><strong>Urgency:</strong> {urgency || '-'}</div>
                    <div><strong>Insurance:</strong> {insurance || '-'}</div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <Button variant="outline" size="sm" onClick={() => { handleSend('Nearest hospital'); }}>Find Hospital</Button>
                    <Button variant="outline" size="sm" onClick={() => { handleSend('Nearest pharmacy'); }}>Find Pharmacy</Button>
                    <Button variant="outline" size="sm" onClick={() => { handleSend('Nearest clinic'); }}>Find Clinic</Button>
                    <Button variant="ghost" size="sm" onClick={() => { setMessages([]); setSymptom(''); setSeverity(''); setDuration(''); setAge(''); setGender(''); setUrgency(''); setInsurance(''); setFlow('idle'); setProviders([]); }}>Reset Intake</Button>
                  </div>

                  {providers.length > 0 && (
                    <div className="mt-2">
                      <h4 className="text-sm font-semibold text-gray-700">Recommended Providers</h4>
                      <div className="space-y-2 mt-2">
                        {providers.map((p, i) => (
                          <Card key={i} className="bg-white shadow-sm">
                            <CardContent className="p-3">
                              <div className="flex justify-between">
                                <div>
                                  <h5 className="font-semibold text-gray-700">{p.name}</h5>
                                  <p className="text-xs text-gray-500">{p.address || 'Address N/A'}</p>
                                </div>
                                <div className="text-right">
                                  <a className="text-blue-600 text-sm" href={`https://www.google.com/maps/search/?api=1&query=${p.latitude},${p.longitude}`} target="_blank" rel="noreferrer">Map</a>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                </CardContent>
              </Card>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Chat;