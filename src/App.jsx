import React, { useState } from 'react';
import { Search, Info, AlertTriangle, CheckCircle, Flame, Shield, HelpCircle, ExternalLink, RefreshCw, WheatOff } from 'lucide-react';

const App = () => {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("flare"); 
  const [isCoeliac, setIsCoeliac] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  // This pulls your secret key from Vercel's Environment Variables
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  const handleSearch = async (foodName = query) => {
    if (!foodName.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    
    // Config for the AI
    const modelVersion = "gemini-3-flash"; 
    const modeDesc = mode === 'flare' ? "active IBD flare-up (low-residue diet)" : "IBD remission (anti-inflammatory/Mediterranean focus)";
    const coeliacLogic = isCoeliac 
      ? `CRITICAL: User has Coeliac Disease. 
         1. If "${foodName}" is a specific brand/product known to contain gluten (e.g., Weetabix, Guinness, standard Oreos), set score to 0 and status to "Avoid".
         2. If "${foodName}" is generic (e.g., Toast, Pasta), assume they are eating the Gluten-Free version and analyze how those GF ingredients affect IBD.` 
      : "User does NOT have Coeliac Disease.";
    
    const prompt = `You are a clinical dietitian. Analyze the food "${foodName}" for a user in ${modeDesc}.
    ${coeliacLogic}
    
    Return ONLY a raw JSON object with this structure:
    {
      "foodName": "${foodName}",
      "score": 0-100,
      "status": "Safe" | "Caution" | "Avoid",
      "reasoning": "Detailed explanation based on clinical research",
      "tips": ["Tip 1", "Tip 2"],
      "alternatives": ["Alt 1", "Alt 2"],
      "references": ["Source 1", "Source 2"]
    }`;

    try {
      if (!apiKey) {
        throw new Error("API Key is missing in Vercel settings. Please check your Environment Variables.");
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelVersion}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to reach the research database.");
      }

      const data = await response.json();
      const rawText = data.candidates[0].content.parts[0].text;
      
      // Clean JSON string - finds the first '{' and last '}'
      const start = rawText.indexOf('{');
      const end = rawText.lastIndexOf('}') + 1;
      if (start === -1) throw new Error("The research database returned an invalid format. Try again.");
      
      const jsonString = rawText.slice(start, end);
      setResult(JSON.parse(jsonString));
    } catch (err) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
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
          <p className="text-slate-500 mt-2">Personalized Research-Based Food Safety</p>
        </header>

        {/* Control Panel */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
              <button 
                onClick={() => setMode('flare')} 
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${mode === 'flare' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}
              >
                <Flame className="w-4 h-4 inline mr-1" /> Flare
              </button>
              <button 
                onClick={() => setMode('remission')} 
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${mode === 'remission' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
              >
                <Shield className="w-4 h-4 inline mr-1" /> Remission
              </button>
            </div>
            
            <div className="flex items-center justify-between gap-3 bg-slate-50 p-2 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2">
                <WheatOff className={`w-4 h-4 ${isCoeliac ? 'text-amber-600' : 'text-slate-400'}`} />
                <span className={`text-sm font-bold ${isCoeliac ? 'text-slate-800' : 'text-slate-400'}`}>Coeliac Mode</span>
              </div>
              <button 
                onClick={() => setIsCoeliac(!isCoeliac)} 
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isCoeliac ? 'bg-amber-500' : 'bg-slate-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isCoeliac ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-8">
          <input 
            type="text" 
            className="w-full bg-white border border-slate-200 rounded-2xl py-5 pl-6 pr-32 outline-none shadow-md focus:ring-2 focus:ring-indigo-500 transition-all text-lg" 
            placeholder={isCoeliac ? "Search food (GF assumed)..." : "Search food (e.g. Weetabix)..."} 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()} 
          />
          <button 
            onClick={() => handleSearch()} 
            disabled={loading} 
            className="absolute right-2 top-2 bottom-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : "Analyze"}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center gap-3 text-rose-700 mb-6 animate-pulse">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Results Card */}
        {result && !loading && (
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className={`p-6 border-b flex items-center justify-between ${getScoreColor(result.score)}`}>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/50 rounded-2xl">
                  {result.status === 'Safe' ? <CheckCircle className="w-8 h-8" /> : result.status === 'Caution' ? <HelpCircle className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{result.foodName}</h2>
                  <p className="text-sm font-bold uppercase tracking-tight opacity-70">
                    {mode} {isCoeliac ? "• Coeliac Protected" : ""}
                  </p>
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-black">{result.score}</div>
                <div className="text-[10px] font-bold opacity-60">SCORE</div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <section>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Clinical Analysis</h3>
                <p className="text-slate-700 leading-relaxed">{result.reasoning}</p>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <section>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Dietary Tips</h3>
                  <ul className="space-y-2">
                    {result.tips?.map((t, i) => (
                      <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                        <span className="text-indigo-500 font-bold">•</span> {t}
                      </li>
                    ))}
                  </ul>
                </section>
                <section>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Safe Alternatives</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.alternatives?.map((a, i) => (
                      <span key={i} className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-bold border border-slate-200">
                        {a}
                      </span>
                    ))}
                  </div>
                </section>
              </div>

              <div className="pt-4 border-t border-slate-50 flex flex-wrap gap-4">
                {result.references?.map((ref, i) => (
                  <span key={i} className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase">
                    <ExternalLink className="w-3 h-3" /> {ref}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        <footer className="mt-12 text-center text-[10px] text-slate-400 uppercase tracking-widest leading-loose">
          Not medical advice. Consult a doctor before dietary changes.<br/>
          Powered by Clinical Research Database 2026
        </footer>
      </div>
    </div>
  );
};

export default App;
