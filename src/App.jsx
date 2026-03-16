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

  const handleSearch = async (foodName = query) => {
    if (!foodName.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    
    // Using the most stable production model name
    const modelVersion = "gemini-1.5-flash"; 
    
    const modeDesc = mode === 'flare' ? "active IBD flare-up (low-residue diet)" : "IBD remission (anti-inflammatory focus)";
    const coeliacLogic = isCoeliac 
      ? `CRITICAL: User has Coeliac Disease. 1. If "${foodName}" is a known gluten brand (e.g. Weetabix), score 0. 2. If generic, assume GF version.` 
      : "User does NOT have Coeliac Disease.";
    
    const prompt = `Analyze ${foodName} for IBD ${modeDesc}. ${coeliacLogic} 
    Return ONLY JSON: {"foodName": "${foodName}", "score": 0-100, "status": "Safe"|"Caution"|"Avoid", "reasoning": "string", "tips": ["string"], "alternatives": ["string"], "references": ["string"]}`;

    try {
      if (!apiKey) throw new Error("API Key is missing in Vercel settings.");

      // Switched from v1beta to v1 for better stability with standard models
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${modelVersion}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });

      const data = await response.json();

      if (!response.ok) {
        // If v1 fails, it might be a regional quota issue. Let's show the helpful error.
        throw new Error(data.error?.message || "Connection failed. Google might be rate-limiting your new key. Wait 10 mins.");
      }

      const rawText = data.candidates[0].content.parts[0].text;
      const start = rawText.indexOf('{');
      const end = rawText.lastIndexOf('}') + 1;
      const jsonString = rawText.slice(start, end);
      
      setResult(JSON.parse(jsonString));
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
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">Gut Guard</h1>
          <p className="text-slate-500 mt-2 font-medium">IBD & Coeliac Clinical Food Safety</p>
        </header>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
              <button onClick={() => setMode('flare')} className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${mode === 'flare' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}>Flare</button>
              <button onClick={() => setMode('remission')} className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${mode === 'remission' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}>Remission</button>
            </div>
            <div className="flex items-center justify-between gap-3 bg-slate-50 p-2 rounded-xl border border-slate-100 px-4">
              <div className="flex items-center gap-2">
                <WheatOff className={`w-4 h-4 ${isCoeliac ? 'text-amber-600' : 'text-slate-400'}`} />
                <span className={`text-sm font-bold ${isCoeliac ? 'text-slate-800' : 'text-slate-400'}`}>Coeliac Mode</span>
              </div>
              <button onClick={() => setIsCoeliac(!isCoeliac)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isCoeliac ? 'bg-amber-500' : 'bg-slate-300'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isCoeliac ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </div>

        <div className="relative mb-8">
          <input type="text" className="w-full bg-white border border-slate-200 rounded-2xl py-5 pl-6 pr-32 outline-none shadow-md focus:ring-2 focus:ring-indigo-500 text-lg" placeholder={isCoeliac ? "Search (GF assumed)..." : "Search (e.g. Weetabix)..."} value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
          <button onClick={() => handleSearch()} disabled={loading} className="absolute right-2 top-2 bottom-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 rounded-xl font-bold">
            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : "Analyze"}
          </button>
        </div>

        {error && <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl text-rose-700 mb-6 text-sm font-medium animate-pulse">⚠️ {error}</div>}

        {result && !loading && (
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className={`p-6 border-b flex items-center justify-between ${getScoreColor(result.score)}`}>
              <div>
                <h2 className="text-2xl font-bold">{result.foodName}</h2>
                <p className="text-xs font-black uppercase opacity-70">{mode} {isCoeliac ? "• Coeliac" : ""}</p>
              </div>
              <div className="text-center"><div className="text-4xl font-black">{result.score}</div><div className="text-[10px] font-bold opacity-60">SCORE</div></div>
            </div>
            <div className="p-6 space-y-6">
              <p className="text-slate-700 text-sm leading-relaxed">{result.reasoning}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-50">
                <div><h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Tips</h3>
                  <ul className="space-y-2">{result.tips?.map((t, i) => <li key={i} className="text-xs text-slate-600">• {t}</li>)}</ul>
                </div>
                <div><h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Swaps</h3>
                  <div className="flex flex-wrap gap-2">{result.alternatives?.map((a, i) => <span key={i} className="bg-slate-50 text-slate-600 px-3 py-1 rounded-lg text-[10px] font-bold border border-slate-200">{a}</span>)}</div>
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
