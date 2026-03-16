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
    
    const modeDesc = mode === 'flare' ? "flare-up" : "remission";
    const coeliac = isCoeliac ? "User has Coeliac. If brand name wheat product, score 0. If generic, assume GF version." : "";
    const prompt = `Analyze ${foodName} for IBD ${modeDesc}. ${coeliac} Respond ONLY in JSON format like this: {"foodName": "${foodName}", "score": 80, "status": "Safe", "reasoning": "explanation", "tips": ["tip"], "alternatives": ["alt"], "references": ["ref"]}`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });

      const data = await response.json();
      const rawText = data.candidates[0].content.parts[0].text;
      
      // Simpler way to clean JSON that won't break the build
      const jsonStart = rawText.indexOf('{');
      const jsonEnd = rawText.lastIndexOf('}') + 1;
      const jsonString = rawText.slice(jsonStart, jsonEnd);
      
      setResult(JSON.parse(jsonString));
    } catch (err) {
      setError("Analysis failed. Please try again.");
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
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 font-sans">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8 text-center">
          <div className="inline-flex p-3 bg-indigo-600 rounded-2xl shadow-lg mb-4 text-white"><Shield className="w-8 h-8" /></div>
          <h1 className="text-3xl font-bold">Gut Guard</h1>
        </header>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button onClick={() => setMode('flare')} className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold ${mode === 'flare' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}>Flare</button>
              <button onClick={() => setMode('remission')} className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold ${mode === 'remission' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}>Remission</button>
            </div>
            <div className="flex items-center gap-3">
              <WheatOff className={`w-4 h-4 ${isCoeliac ? 'text-amber-600' : 'text-slate-400'}`} />
              <span className="text-sm font-semibold">Coeliac Mode</span>
              <button onClick={() => setIsCoeliac(!isCoeliac)} className={`relative h-6 w-11 rounded-full transition-colors ${isCoeliac ? 'bg-amber-500' : 'bg-slate-300'}`}>
                <span className={`h-4 w-4 transform rounded-full bg-white absolute top-1 transition-all ${isCoeliac ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
          </div>
        </div>

        <div className="relative mb-6">
          <input type="text" className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-6 pr-28 outline-none" placeholder="Search food..." value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
          <button onClick={() => handleSearch()} disabled={loading} className="absolute right-2 top-2 bottom-2 bg-indigo-600 text-white px-6 rounded-xl font-medium">
            {loading ? "..." : "Analyze"}
          </button>
        </div>

        {error && <div className="p-4 bg-rose-50 text-rose-700 rounded-xl mb-6">{error}</div>}

        {result && !loading && (
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
            <div className={`p-6 border-b flex items-center justify-between ${getScoreColor(result.score)}`}>
              <div>
                <h2 className="text-2xl font-bold">{result.foodName}</h2>
                <p className="text-sm font-medium">{result.status}</p>
              </div>
              <div className="text-center"><div className="text-3xl font-black">{result.score}</div></div>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <p>{result.reasoning}</p>
              <div><strong>Tips:</strong> {result.tips?.join(", ")}</div>
              <div><strong>Swaps:</strong> {result.alternatives?.join(", ")}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
