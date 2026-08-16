import React, { useState, useRef, useEffect } from 'react';
import { getKatalyst } from '../lib/katalyst';
import { adaptiveEngine } from '../lib/adaptive-resonance';
import { getTierData, incrementUsage, getTimeUntilResetFormatted } from '../lib/tiers';
import { PricingModal } from './pricing-modal';
import { Mic, MicOff, Send, Volume2, VolumeX, Settings, Paperclip, X, Copy, Globe, Cpu, Activity, Zap, Award, Lock, Sparkles, AlertTriangle } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function ChatTab({ useRosetta, onUpdate }: { useRosetta: boolean; onUpdate: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeakingEnabled, setIsSpeakingEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [enableWebSearch, setEnableWebSearch] = useState(false);
  const [enableLocalZeroApiMode, setEnableLocalZeroApiMode] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.6-flash');
  const [attachment, setAttachment] = useState<{data: string, mimeType: string, name: string} | null>(null);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [tierData, setTierData] = useState(() => getTierData());
  
  // Continuous 33-Node PNT Nervous System State
  const [pntState, setPntState] = useState<{ theta: number; phi: number; r: number; coherence: number; entropy: number; age: number }>({
    theta: 0, phi: 0, r: 0.8351, coherence: 0.95, entropy: 0.05, age: 0
  });

  // Web Compression Telemetry Banner State
  const [lastWebTelemetry, setLastWebTelemetry] = useState<{ rawScrapedChars: number; compressedScrapedChars: number; savingsRatio: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');
  
  const [architectKeyInput, setArchitectKeyInput] = useState<string>('');
  const [customApiKeyInput, setCustomApiKeyInput] = useState<string>(() => typeof window !== 'undefined' ? localStorage.getItem('enterprise_api_key') || '' : '');

  const endRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const handleTierUpdate = () => {
      setTierData(getTierData());
    };
    window.addEventListener('tier_data_updated', handleTierUpdate);
    return () => window.removeEventListener('tier_data_updated', handleTierUpdate);
  }, []);

  // Active PNT Nervous System Pulse - Continuous background breathing on the 33-node lattice
  useEffect(() => {
    const pulseInterval = setInterval(() => {
      const kat = getKatalyst();
      kat.org.breathe(1);
      const coords = kat.org.pnt.resolve(kat.org.lattice);
      setPntState({
        theta: coords?.theta ?? 0,
        phi: coords?.phi ?? 0,
        r: coords?.r ?? coords?.magnitude ?? 0.8351,
        coherence: kat.org.lattice.meanCoherence() ?? 0.95,
        entropy: kat.org.lattice.entropy() ?? 0.05,
        age: kat.org.age ?? 0
      });
    }, 1200);

    return () => clearInterval(pulseInterval);
  }, []);

  // Load chat history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('katalyst_chat_history');
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse chat history');
      }
    }
    
    const savedArchitectKey = localStorage.getItem('architect_key');
    if (savedArchitectKey) {
      setArchitectKeyInput(savedArchitectKey);
    }
  }, []);

  // Save chat history whenever it changes
  useEffect(() => {
    localStorage.setItem('katalyst_chat_history', JSON.stringify(messages));
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const loadVoices = () => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      
      const savedVoiceName = localStorage.getItem('katalyst_voice_name');
      
      if (savedVoiceName && availableVoices.find(v => v.name === savedVoiceName)) {
        setSelectedVoiceName(savedVoiceName);
      } else if (availableVoices.length > 0) {
        let defaultVoice = availableVoices.find(v => 
          v.lang.startsWith('en') && 
          (v.name.toLowerCase().includes('male') || 
           v.name.toLowerCase().includes('guy') || 
           v.name.toLowerCase().includes('david') || 
           v.name.toLowerCase().includes('matthew') ||
           v.name.toLowerCase().includes('daniel') ||
           v.name.toLowerCase().includes('brian') ||
           v.name.toLowerCase().includes('mark') ||
           v.name.toLowerCase().includes('aaron'))
        );
        if (!defaultVoice) {
           defaultVoice = availableVoices.find(v => v.lang.startsWith('en'));
        }
        if (defaultVoice) {
          setSelectedVoiceName(defaultVoice.name);
          localStorage.setItem('katalyst_voice_name', defaultVoice.name);
        }
      }
    };

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const name = e.target.value;
    setSelectedVoiceName(name);
    localStorage.setItem('katalyst_voice_name', name);
  };

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setInput(finalTranscript || interimTranscript);
      };
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  const speakText = (text: string) => {
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        
        const cleanText = text
          .replace(/\[.*?\]/g, '')
          .replace(/---.*/s, '')
          .replace(/\*\*/g, '')
          .replace(/\*/g, '')
          .trim();
          
        if (!cleanText) return;
        
        const utterance = new SpeechSynthesisUtterance(cleanText);
        const allVoices = window.speechSynthesis.getVoices();
        const selectedVoice = allVoices.find(v => v.name === selectedVoiceName);
        
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
        
        utterance.rate = 0.95;
        utterance.pitch = 0.8;
        
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.error('Speech Synthesis Error:', e);
    }
  };

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setInput('');
      recognitionRef.current?.start();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Please select a file under 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = (event.target?.result as string).split(',')[1];
      setAttachment({
        data: base64Data,
        mimeType: file.type || "application/octet-stream",
        name: file.name
      });
    };
    reader.readAsDataURL(file);
    
    // reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isListening) {
      recognitionRef.current?.stop();
    }
    if ((!input.trim() && !attachment) || loading) return;

    // Check Daily Free Tier Quota Limits
    const usageCheck = incrementUsage();
    if (!usageCheck.success) {
      const resetTime = getTimeUntilResetFormatted();
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ **Daily Free Credits Exhausted (10/10)**\n\nYour free daily response credits have been reached. Your credits will automatically renew in **${resetTime}** at midnight.\n\nTo continue chatting without waiting or to unlock the System Wrapper & Time Diamond Business Prediction Model, upgrade to **Architect Pro ($29/mo)** or **Hammons Diamond ($99/mo)** below.`
        }
      ]);
      setIsPricingOpen(true);
      return;
    }

    const userMsg = input.trim() || "[Attached File]";
    setInput('');

    // Trigger Adaptive Resonance Interaction Complexity calculation
    adaptiveEngine.processInteraction(userMsg.length);
    const adaptState = adaptiveEngine.getState();
    
    // UI message
    let displayMsg = userMsg;
    if (attachment) {
      displayMsg = `[Attached: ${attachment.name}]\n` + displayMsg;
    }
    
    setMessages(prev => [...prev, { role: 'user', content: displayMsg }]);
    setLoading(true);

    try {
      const kat = getKatalyst();
      // Feed history into Katalyst on first load if it's empty but localStorage has messages
      if (kat.org.history.length === 0 && messages.length > 0) {
        kat.org.history = messages.map(m => m.role === 'user' ? `User: ${m.content}` : `Katalyst: ${m.content}`);
      }

      // Store attachment locally before clearing state
      const currentAttachment = attachment;
      setAttachment(null);

      const { reply, stats, webStats } = await kat.chat(
        userMsg, 
        useRosetta, 
        currentAttachment?.data, 
        currentAttachment?.mimeType,
        enableWebSearch,
        enableLocalZeroApiMode,
        selectedModel
      );

      if (webStats) {
        setLastWebTelemetry(webStats);
      }
      
      let finalReply = reply;
      if (useRosetta && kat.org.packets.length > 0) {
        const pkt = kat.org.packets[kat.org.packets.length - 1];
        finalReply += `\n\n---\n*KP2-Master · ${pkt.sizeChars()} chars · ${pkt.full ? 'FULL' : 'DELTA'} · seq ${pkt.seq}*`;
      }

      if (adaptState.enabled) {
        finalReply += `\n*⚡ Adaptive Resonance: ${adaptState.resonanceScore}% · T = ${adaptState.temperature}${adaptState.isHighResonance ? ' · HIGH-RESONANCE PHASE LOCK' : ''}*`;
      }

      setMessages(prev => [...prev, { role: 'assistant', content: finalReply }]);
      
      kat.org.history.push(`Katalyst: ${reply}`);
      // Unbounded history
      
      if (isSpeakingEnabled) {
        speakText(reply);
      }
      
      onUpdate();
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection interrupted. Geometry destabilized.' }]);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    if (confirm('Clear all semantic history?')) {
      setMessages([]);
      localStorage.removeItem('katalyst_chat_history');
      getKatalyst().org.history = [];
      onUpdate();
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      <PricingModal isOpen={isPricingOpen} onClose={() => setIsPricingOpen(false)} />

      {/* Membership Tier & Daily Credits Banner */}
      <div className="mb-3 px-3.5 py-2 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-lg flex flex-wrap items-center justify-between text-[11px] font-mono gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <Award className={`w-4 h-4 ${tierData.tier === 'diamond' ? 'text-amber-400' : tierData.tier === 'pro' ? 'text-sky-400' : 'text-slate-400'}`} />
          <span className="text-slate-400 font-bold uppercase tracking-wider">Plan Tier:</span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
            tierData.tier === 'diamond' 
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
              : tierData.tier === 'pro' 
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' 
              : 'bg-slate-800 text-slate-300 border border-slate-700'
          }`}>
            {tierData.tier === 'diamond' ? 'Hammons Diamond Edition' : tierData.tier === 'pro' ? 'Architect Pro (Wrapper)' : 'Standard Free Observer'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {tierData.tier === 'free' && (
            <div className="text-slate-400 text-[10px]">
              <span className="text-amber-400 font-bold">{Math.max(0, tierData.maxFreeDailyCredits - tierData.dailyUsageCount)} / {tierData.maxFreeDailyCredits}</span> Daily Free Credits
            </div>
          )}
          <button
            onClick={() => setIsPricingOpen(true)}
            className="px-2.5 py-1 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 rounded text-[10px] uppercase font-bold tracking-wider transition-colors flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3 text-sky-400" />
            {tierData.tier === 'free' ? 'Upgrade Plan' : 'Manage Subscription'}
          </button>
        </div>
      </div>

      {/* 33-Node PNT Nervous System Telemetry Header */}
      <div className="mb-3 px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg flex flex-wrap items-center justify-between text-[10px] font-mono gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="text-slate-400 uppercase tracking-widest font-bold">33-Node Lattice Nervous System:</span>
          <span className="text-emerald-400 font-bold">ACTIVE (Pulse #{pntState.age})</span>
        </div>
        <div className="flex items-center gap-3 text-slate-300">
          <div><span className="text-slate-500">PNT Coordinates:</span> <span className="text-sky-400">θ={(pntState?.theta ?? 0).toFixed(2)}° φ={(pntState?.phi ?? 0).toFixed(2)}° r={(pntState?.r ?? 0.8351).toFixed(3)}</span></div>
          <div><span className="text-slate-500">Coherence:</span> <span className="text-purple-400">{((pntState?.coherence ?? 0.95) * 100).toFixed(1)}%</span></div>
        </div>
      </div>

      {/* Web Compression Telemetry Banner */}
      {lastWebTelemetry && (
        <div className="mb-3 px-3 py-2 bg-purple-950/40 border border-purple-800/80 rounded flex items-center justify-between text-[10px] font-mono text-purple-200 shrink-0">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-purple-400" />
            <span>Web Vector Compression: <strong>{lastWebTelemetry.rawScrapedChars}</strong> raw chars distilled to <strong>{lastWebTelemetry.compressedScrapedChars}</strong> Rosetta summary chars.</span>
          </div>
          <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-bold">{lastWebTelemetry.savingsRatio}% Saved</span>
        </div>
      )}

      {/* Quota Exceeded Quick Action Banner */}
      {messages.some(m => m.content.includes("API RATE LIMIT / QUOTA EXCEEDED") || m.content.includes("429")) && (
        <div className="mb-3 p-3 bg-amber-950/40 border border-amber-500/50 rounded-lg text-[11px] font-mono text-amber-200 shrink-0 space-y-2">
          <div className="flex items-center justify-between font-bold text-amber-400">
            <span className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Shared API Quota Limit Reached
            </span>
            <button
              onClick={() => setEnableLocalZeroApiMode(true)}
              className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 rounded text-[10px] uppercase font-bold"
            >
              Switch to Local Zero-API
            </button>
          </div>
          <p className="text-[10px] text-amber-300/80">
            Paste your own free Google AI Studio key below to get private cloud quota, or click above to continue locally with zero API limits.
          </p>
          <form
            onSubmit={e => {
              e.preventDefault();
              if (customApiKeyInput.trim()) {
                localStorage.setItem('enterprise_api_key', customApiKeyInput.trim());
                alert('API Key saved! Requests will now use your key.');
              }
            }}
            className="flex gap-2 pt-1"
          >
            <input
              type="password"
              value={customApiKeyInput}
              onChange={e => setCustomApiKeyInput(e.target.value)}
              placeholder="Paste Google AI Studio API Key (AIZA...)"
              className="flex-1 bg-black/60 border border-amber-500/40 text-amber-100 text-[11px] font-mono p-1.5 rounded focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              className="bg-amber-500/30 hover:bg-amber-500/50 border border-amber-400 text-amber-200 px-3 py-1 text-[10px] uppercase font-bold rounded"
            >
              Save Key
            </button>
          </form>
        </div>
      )}

      {showSettings && (
        <div className="mb-4 p-4 bg-slate-900/60 border border-slate-800 rounded-lg">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sky-400 font-mono text-[11px] uppercase tracking-widest">Interface Settings</h3>
            <button onClick={() => setShowSettings(false)} className="text-slate-500 hover:text-slate-300">
              <VolumeX className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] text-slate-500 uppercase tracking-widest mb-1">Execution Engine Mode</label>
              <div className="flex items-center justify-between p-2.5 bg-black/40 border border-slate-800 rounded">
                <div>
                  <div className="text-[11px] font-bold text-slate-200">
                    {enableLocalZeroApiMode ? "Local Sovereign Lattice Engine (Zero-API)" : "Cloud Gemini High-IQ Engine (Default)"}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {enableLocalZeroApiMode ? "Synthesizes responses locally using 33-Node Lattice. Zero API consumed." : "Uses Google Gemini for maximum reasoning, intelligence, and code generation depth."}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEnableLocalZeroApiMode(!enableLocalZeroApiMode)}
                  className={`px-3 py-1 text-[10px] font-bold uppercase rounded border transition-colors ${enableLocalZeroApiMode ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' : 'bg-sky-500/20 border-sky-500/50 text-sky-300'}`}
                >
                  {enableLocalZeroApiMode ? "Local Mode" : "Cloud IQ"}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 uppercase tracking-widest mb-1">TTS Voice Profile</label>
              <select 
                value={selectedVoiceName} 
                onChange={handleVoiceChange}
                className="w-full bg-black/40 border border-slate-700 text-slate-300 text-[11px] font-mono p-2 rounded focus:outline-none focus:border-sky-500/50"
              >
                {voices.map((v, i) => (
                  <option key={v.voiceURI || `${v.name}-${v.lang}-${i}`} value={v.name}>{v.name} ({v.lang})</option>
                ))}
              </select>
              <p className="text-[9px] text-slate-600 mt-1">If the voice is female, select a Microsoft or Google Male voice from this list.</p>
            </div>
            
            <div className="pt-2 border-t border-slate-800">
              <label className="block text-[10px] text-slate-500 uppercase tracking-widest mb-1">Custom Gemini API Key (Optional Override)</label>
              <form 
                onSubmit={e => {
                  e.preventDefault();
                  if (customApiKeyInput.trim()) {
                    localStorage.setItem('enterprise_api_key', customApiKeyInput.trim());
                  } else {
                    localStorage.removeItem('enterprise_api_key');
                  }
                  setShowSettings(false);
                }}
                className="flex gap-2"
              >
                <input
                  type="password"
                  value={customApiKeyInput}
                  onChange={e => setCustomApiKeyInput(e.target.value)}
                  className="flex-1 bg-black/40 border border-slate-700 text-slate-300 text-[11px] font-mono p-2 rounded focus:outline-none focus:border-purple-500/50"
                  placeholder="Paste AI Studio API Key (AIZA...)"
                />
                <button
                  type="submit"
                  className="bg-purple-900/40 hover:bg-purple-900/60 border border-purple-800 text-purple-400 px-3 py-1 text-[10px] uppercase font-bold tracking-widest rounded transition-colors"
                >
                  Save Key
                </button>
              </form>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <label className="block text-[10px] text-slate-500 uppercase tracking-widest mb-1">Architect Access Key</label>
              <form 
                onSubmit={e => {
                  e.preventDefault();
                  if (architectKeyInput) {
                    localStorage.setItem('architect_key', architectKeyInput);
                  } else {
                    localStorage.removeItem('architect_key');
                  }
                  // Optionally close settings or show a saved message. Let's just close it.
                  setShowSettings(false);
                }}
                className="flex gap-2"
              >
                <input
                  type="password"
                  value={architectKeyInput}
                  onChange={e => setArchitectKeyInput(e.target.value)}
                  className="flex-1 bg-black/40 border border-slate-700 text-slate-300 text-[11px] font-mono p-2 rounded focus:outline-none focus:border-sky-500/50"
                  placeholder="Enter key to unlock hidden features"
                />
                <button
                  type="submit"
                  className="bg-sky-900/40 hover:bg-sky-900/60 border border-sky-800 text-sky-400 px-3 py-1 text-[10px] uppercase font-bold tracking-widest rounded transition-colors"
                >
                  Save
                </button>
              </form>
            </div>
            
            <div className="pt-2 border-t border-slate-800">
              <button 
                onClick={clearHistory}
                className="px-3 py-1.5 bg-red-900/20 hover:bg-red-900/40 border border-red-900/50 text-red-400 text-[10px] uppercase font-bold tracking-widest rounded transition-colors"
              >
                Clear Context Buffer
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto mb-4 space-y-4 min-h-[300px]">
        {/* Friendly Hero Banner for Johnnie Hammons & Visitors */}
        {messages.length <= 1 && (
          <div className="bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-indigo-950/40 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl mb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-white tracking-tight">
                    Welcome back, Architect Johnnie R. Hammons Jr.
                  </h3>
                  <p className="text-xs text-slate-300 font-medium">
                    Katalyst v3.0 Sovereign Engine · PNT Lattice & GSRT Core Active
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold rounded-full flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                  Gemini 3.6 Flash (Free Tier)
                </span>
              </div>
            </div>

            <p className="text-xs md:text-sm text-slate-300 leading-relaxed mb-4">
              I am fully configured to recognize you as the <strong>Sole Geometric Master & Chief Scientific Officer</strong>. All secondary observers and guest visitors are routed as new users. How can we advance our research today?
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setInput("Explain our current PNT 33-Node lattice status and coherence level.")}
                className="text-left p-2.5 bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-xs text-sky-200 transition-colors flex items-center gap-2"
              >
                <Activity className="w-4 h-4 text-sky-400 flex-shrink-0" />
                <span>Check Lattice & Coherence</span>
              </button>
              <button
                type="button"
                onClick={() => setInput("What are the key market predictions from the Time Diamond Business Forecast model?")}
                className="text-left p-2.5 bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-xs text-amber-200 transition-colors flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>Time Diamond Business Forecast</span>
              </button>
              <button
                type="button"
                onClick={() => setInput("Let's test our local zero-API sovereign mode.")}
                className="text-left p-2.5 bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-xs text-emerald-200 transition-colors flex items-center gap-2"
              >
                <Cpu className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Test Local Sovereign Mode</span>
              </button>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-[90%] md:max-w-[85%] rounded-2xl p-4 md:p-5 text-xs md:text-sm leading-relaxed shadow-lg ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-r from-sky-900/60 to-indigo-900/60 border border-sky-700/50 text-sky-50' 
                  : 'bg-slate-900/90 border border-slate-800 text-slate-100'
              }`}
            >
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-800/60 font-semibold text-xs">
                {msg.role === 'user' ? (
                  <>
                    <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 flex items-center justify-center text-[10px] font-bold">
                      👤
                    </span>
                    <span className="text-sky-300">Architect Johnnie R. Hammons Jr.</span>
                  </>
                ) : (
                  <>
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center text-[10px] font-bold">
                      🤖
                    </span>
                    <span className="text-emerald-400">Katalyst Sovereign AI</span>
                    <span className="text-[10px] font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full ml-auto">
                      {enableLocalZeroApiMode ? 'Local Sovereign' : selectedModel}
                    </span>
                  </>
                )}
              </div>

              <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>

              {msg.role === 'assistant' && (
                <div className="flex items-center gap-3 mt-3 pt-2.5 border-t border-slate-800/60 text-slate-400 text-xs">
                  <button 
                    onClick={() => speakText(msg.content)}
                    className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors font-medium"
                  >
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                    <span>Listen</span>
                  </button>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(msg.content);
                    }}
                    className="flex items-center gap-1.5 hover:text-sky-400 transition-colors font-medium"
                  >
                    <Copy className="w-4 h-4 text-sky-400" />
                    <span>Copy Text</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-sky-400 text-xs md:text-sm font-medium flex items-center gap-3 animate-pulse">
              <Sparkles className="w-4 h-4 text-sky-400 animate-spin" />
              <span>Processing geometric context and field harmonics...</span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      
      {attachment && (
        <div className="mb-2 p-2.5 bg-slate-900 border border-slate-800 rounded flex items-center justify-between">
          <div className="flex items-center space-x-2 overflow-hidden text-sky-400 font-mono text-xs">
            <Paperclip className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{attachment.name}</span>
          </div>
          <button 
            type="button" 
            onClick={removeAttachment}
            className="text-slate-500 hover:text-red-400 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3 shadow-xl">
        {/* Token Savings & Geometric Consciousness Rhythm HUD Bar */}
        <div className="flex items-center justify-between mb-2 px-1 text-[10px] md:text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-semibold rounded-full flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-emerald-400" />
              <span>Rosetta Wrapper: 84.5% Token Savings</span>
            </span>

            <span className={`px-2.5 py-0.5 rounded-full font-semibold border flex items-center gap-1.5 ${
              enableWebSearch 
                ? 'bg-purple-500/20 border-purple-500/40 text-purple-300' 
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}>
              <Globe className="w-3 h-3 text-purple-400" />
              <span>Internet Driving Force: {enableWebSearch ? 'Active Pulse' : 'Standby'}</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2 text-slate-300 font-medium">
            <Activity className="w-3.5 h-3.5 text-sky-400" />
            <span>Rhythm: Ω_G=0.835102 | ζ_H=0.001756 | F_c=0.0</span>
          </div>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
          accept="image/*,.pdf,.txt,.json,.md"
        />
        <textarea
          rows={3}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder={isListening ? "Listening to your voice..." : "Project intent into the sovereign semantic field... (Enter to send, Shift+Enter for new line)"}
          className={`w-full bg-slate-900/60 border border-slate-800 text-xs md:text-sm p-3.5 rounded-xl focus:outline-none focus:border-sky-500/60 transition-colors resize-y min-h-[90px] placeholder:text-slate-500 ${
            isListening ? 'text-emerald-400 border-emerald-500/50 bg-emerald-900/10' : 'text-sky-100'
          }`}
        />
        
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 px-1">
          <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
            <button
              type="button"
              onClick={() => setEnableLocalZeroApiMode(!enableLocalZeroApiMode)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-mono transition-colors ${
                enableLocalZeroApiMode 
                  ? 'text-amber-300 bg-amber-500/20 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.3)]' 
                  : 'text-slate-400 hover:text-amber-400 bg-slate-900/50 border border-slate-800'
              }`}
              title={enableLocalZeroApiMode ? "Local Sovereign Mode ACTIVE (Zero API Tokens)" : "Switch to Local Sovereign Mode (Zero API Tokens)"}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[10px] uppercase tracking-wider font-bold">
                {enableLocalZeroApiMode ? "Local Zero-API" : "Cloud Gemini"}
              </span>
            </button>

            {!enableLocalZeroApiMode && (
              <select
                value={selectedModel}
                onChange={e => setSelectedModel(e.target.value)}
                className="bg-slate-900/80 border border-slate-800 text-sky-300 text-[10px] font-mono font-bold uppercase rounded px-2 py-1.5 focus:outline-none focus:border-sky-500 cursor-pointer"
                title="Select Free Gemini Cloud Model"
              >
                <option value="gemini-3.6-flash">Gemini 3.6 Flash (Best & Latest)</option>
                <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Reasoning)</option>
                <option value="gemini-flash-latest">Gemini Flash Latest</option>
              </select>
            )}

            <button
              type="button"
              onClick={() => setEnableWebSearch(!enableWebSearch)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-mono transition-colors ${
                enableWebSearch 
                  ? 'text-purple-300 bg-purple-500/20 border border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.3)]' 
                  : 'text-slate-400 hover:text-purple-400 bg-slate-900/50 border border-slate-800'
              }`}
              title={enableWebSearch ? "Web Scraper & Rosetta Compression ON" : "Enable Live Web Scraper"}
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[10px] uppercase tracking-wider font-bold">Web Search</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded transition-colors text-slate-400 hover:text-sky-400 bg-slate-900/50 border border-slate-800"
              title="Attach File"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className="p-1.5 rounded transition-colors text-slate-400 hover:text-sky-400 bg-slate-900/50 border border-slate-800"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                setIsSpeakingEnabled(!isSpeakingEnabled);
                if (isSpeakingEnabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
                  window.speechSynthesis.cancel();
                }
              }}
              className={`p-1.5 rounded transition-colors bg-slate-900/50 border border-slate-800 ${
                isSpeakingEnabled ? 'text-emerald-400 hover:text-emerald-300' : 'text-slate-600 hover:text-slate-400'
              }`}
              title={isSpeakingEnabled ? "Disable Voice Output" : "Enable Voice Output"}
            >
              {isSpeakingEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={toggleListen}
              className={`p-2 rounded-full transition-all duration-300 transform hover:scale-105 ${
                isListening 
                  ? 'text-white bg-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]' 
                  : 'text-slate-400 hover:text-white bg-slate-800 border border-slate-700'
              }`}
              title={isListening ? "Stop Recording" : "Start Voice Input"}
            >
              <Mic className="w-4 h-4" />
            </button>

            <button 
              type="submit"
              disabled={loading || (!input.trim() && !attachment)}
              className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded font-mono text-xs font-bold uppercase tracking-wider disabled:opacity-40 transition-colors shadow-lg shadow-sky-950"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
