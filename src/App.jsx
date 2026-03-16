import React, { useState } from 'react';
import { Search, Info, AlertTriangle, CheckCircle, Flame, Shield, HelpCircle, ExternalLink, RefreshCw, WheatOff } from 'lucide-react';

const App = () => {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("flare"); 
  const [isCoeliac, setIsCoeliac] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    
    // Stable model ID for 2026 production
    const modelName = "gemini-2.5-flash"; 
    
    const modeDesc = mode === 'flare' ? "active IBD flare (low-residue diet)" : "IBD remission (anti-inflammatory focus)";
    const coeliacLogic = isCoeliac 
      ? `User has Coeliac Disease. 1. If "${query}" is a brand/product with gluten (e.g. Weetabix, standard bread), score 0. 2. If generic, assume they eat the GF version.` 
      : "No Coeliac.";

    const prompt = `Analyze ${query} for IBD ${modeDesc}. ${coeliacLogic} 
    Return ONLY a JSON object: {"foodName": "${query}", "score": 0-100, "status": "Safe"|"Caution"|"Avoid", "reasoning": "string", "tips": ["string"], "alternatives": ["string"], "references": ["string"]}`;

    try {
      if (!apiKey) throw new Error("API Key missing in Vercel settings.");

const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`, {        
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { 
            response_mime_type: "application/json",
            temperature: 0.1
          } 
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Check your API key or Quota.");
      }

      const rawText = data.candidates[0].content.parts[0].text;
      setResult(JSON.parse(rawText));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-emerald-500 bg-emerald-50 border-emerald-200";
    if (score >= 50) return "text-amber-500 bg-amber-50 border-amber-200";
    return "text-rose-500 bg-rose-50 border-rose-200";
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8 font-sans">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8 text-center">
          <div className="inline-flex p-3 bg-indigo-600 rounded-2xl shadow-lg mb-4 text-white">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Gut Guard</h1>
          <p className="text-slate-500 mt-1">Clinical IBD & Coeliac Assistant</p>
        </header>

        {/* Controls */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button onClick={() => setMode('flare')} className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${mode === 'flare' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}>Flare</button>
            <button onClick={() => setMode('remission')} className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${mode === 'remission' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}>Remission</button>
          </div>
          <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border px-4">
            <WheatOff className={`w-4 h-4 ${isCoeliac ? 'text-amber-600' : 'text-slate-400'}`} />
            <span className="text-sm font-bold">Coeliac Mode</span>
            <button onClick={() => setIsCoeliac(!isCoeliac)} className={`relative h-6 w-11 rounded-full transition-colors ${isCoeliac ? 'bg-amber-500' : 'bg-slate-300'}`}>
              <span className={`h-4 w-4 transform rounded-full bg-white absolute top-1 transition-all ${isCoeliac ? 'left-6' : 'left-1'}`} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <input 
            type="text" 
            className="w-full bg-white border border-slate-200 rounded-2xl py-5 pl-6 pr-32 outline-none shadow-md text-lg focus:ring-2 focus:ring-indigo-500 transition-all" 
            placeholder="Search (e.g. Oats, Pizza)..." 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()} 
          />
          <button onClick={handleSearch} disabled={loading} className="absolute right-2 top-2 bottom-2 bg-indigo-600 text-white px-6 rounded-xl font-bold hover:bg-indigo-700 transition-colors">
            {loading ? <RefreshCw className="animate-spin w-5 h-5" /> : "Analyze"}
          </button>
        </div>

        {error && <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl text-rose-700 mb-6 text-sm font-medium animate-pulse">⚠️ {error}</div>}

        {result && !loading && (
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className={`p-6 border-b flex items-center justify-between ${getScoreColor(result.score)}`}>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/50 rounded-2xl">
                  {result.status === 'Safe' ? <CheckCircle className="w-8 h-8" /> : result.status === 'Caution' ? <HelpCircle className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{result.foodName}</h2>
                  <p className="text-[10px] font-black uppercase opacity-70 tracking-widest">{mode} {isCoeliac ? "• Coeliac" : ""}</p>
                </div>
              </div>
              <div className="text-center font-black">
                <div className="text-4xl">{result.score}</div>
                <div className="text-[10px] opacity-60">SCORE</div>
              </div>
            </div>
            <div className="p-6 space-y-6 text-sm">
              <p className="text-slate-700 leading-relaxed italic border-l-2 border-indigo-100 pl-4">{result.reasoning}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-50">
                <div><h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 underline">Dietary Tips</h3>
                  <ul className="space-y-2">{result.tips?.map((t, i) => <li key={i} className="text-slate-600 flex items-start gap-2"><span>•</span> {t}</li>)}</ul>
                </div>
                <div><h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 underline">Swaps</h3>
                  <div className="flex flex-wrap gap-2">{result.alternatives?.map((a, i) => <span key={i} className="bg-slate-50 text-slate-600 px-3 py-1 rounded-lg text-[10px] font-bold border border-slate-200 uppercase">{a}</span>)}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
