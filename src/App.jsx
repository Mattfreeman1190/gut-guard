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
    
    let modeDescription = mode === 'flare' 
      ? "active IBD FLARE (Crohn's/Colitis). Focus low-residue." 
      : "IBD REMISSION. Focus anti-inflammatory.";
    
    const coeliacContext = isCoeliac 
      ? `USER HAS COELIAC. 1. If "${foodName}" is a known gluten brand (e.g. Weetabix), Score=0. 2. If generic (e.g. Toast), assume GF version.` 
      : "No Coeliac disease.";

    const systemPrompt = `Analyze food: "${foodName}" for ${modeDescription}. ${coeliacContext} Respond ONLY in JSON: {"foodName": "string", "score": number, "status": "Safe"|"Caution"|"Avoid", "reasoning": "string", "tips": ["string"], "alternatives": ["string"], "references": ["string"]}`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt }] }] })
      });

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0]) {
        throw new Error("Invalid response from AI");
      }

      const text = data.candidates[0].content.parts[0].text;
      // This is the line that was broken in your logs:
      const cleanJson = text.replace(/```json|```/g, "").trim();
      
      setResult(JSON.parse(cleanJson));
    } catch (err) {
      console.error(err);
      setError("Error analyzing food. Check your API key or try again.");
    } finally {
      setLoading(false);
    }
  };
