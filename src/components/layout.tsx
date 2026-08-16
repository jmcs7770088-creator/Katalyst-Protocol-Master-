import React, { useState, useEffect } from 'react';
import { getKatalyst, _ARCHITECT_PROOF, OMEGA_G, ORIGIN_929 } from '../lib/katalyst';
import { adaptiveEngine, AdaptiveResonanceState } from '../lib/adaptive-resonance';
import { ChatTab } from './chat';
import { SemanticFieldTab } from './semantic-field';
import { CrisprShieldTab } from './crispr-shield';
import { PNTNavigationTab } from './pnt-navigation';
import { TimeDiamondTab } from './time-diamond';
import { WireStateTab } from './wire-state';
import { LegalTab } from './legal-tab';
import { BenchmarkPaperTab } from './benchmark-paper';
import { PricingModal } from './pricing-modal';
import { SensorCalibrationTab } from './sensor-calibration';
import { DataExportTab } from './data-export';
import { Activity, Shield, Navigation, Clock, Network, Info, MessageSquare, Menu, X, FileText, Zap, Smartphone, Radio, Sliders, Award, Gauge, Database } from 'lucide-react';

export function Layout() {
  const [activeTab, setActiveTab] = useState('chat');
  const [stats, setStats] = useState(() => getKatalyst().org.stats());
  const [useRosetta, setUseRosetta] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hasArchitectKey, setHasArchitectKey] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);

  // Adaptive Resonance & Sensor State
  const [adaptiveState, setAdaptiveState] = useState<AdaptiveResonanceState>(() => adaptiveEngine.getState());

  useEffect(() => {
    const unsub = adaptiveEngine.subscribe(state => {
      setAdaptiveState(state);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const checkKey = () => {
      setHasArchitectKey(!!localStorage.getItem('architect_key'));
    };
    checkKey();
    window.addEventListener('storage', checkKey);
    const interval = setInterval(checkKey, 1000);
    return () => {
      window.removeEventListener('storage', checkKey);
      clearInterval(interval);
    };
  }, []);

  // Trigger re-render of stats
  const refreshStats = () => {
    setStats(getKatalyst().org.stats());
  };

  const handleForceFull = () => {
    getKatalyst().org.emit(true);
    refreshStats();
  };

  const handleFeedNoise = () => {
    getKatalyst().org.feedNoise(2.0);
    refreshStats();
  };

  const handleRunBenchmark = () => {
    const k = getKatalyst();
    const testData = [
      "Katalyst, initialize the primary diagnostic sequence. We need to verify the GSRT baseline.",
      "The 1+6 Nodal Lattice is showing slight torsional drag on the Z-axis. Can you recalibrate?",
      "Remember that Omega_G is our sovereign anchor. Do not let the external noise pollute the local field.",
      "Our venture capital brief needs to highlight the satellite-free PNT navigation capabilities.",
      "I'm feeling a bit anxious about the upcoming presentation, but I know the math is solid.",
      "Let's activate the CRISPR shield and store these parameters as a permanent spacer."
    ];
    
    testData.forEach(text => {
       k.org.ingest(text);
       k.org.emit();
    });
    refreshStats();
    setActiveTab('benchmark');
    setIsSidebarOpen(false);
  };

  const tabs = [
    { id: 'chat', label: 'Live Chat', icon: MessageSquare },
    { id: 'pricing', label: 'Membership Tiers', icon: Award },
    { id: 'sensor', label: 'Sensor Calibration', icon: Gauge },
    { id: 'export', label: 'Data Export & Logs', icon: Database },
    { id: 'diamond', label: 'Time Diamond Predictor', icon: Clock },
    { id: 'benchmark', label: 'Benchmark Data', icon: FileText },
    { id: 'field', label: 'Semantic Field', icon: Network },
    { id: 'crispr', label: 'CRISPR Shield', icon: Shield },
    { id: 'pnt', label: 'PNT Navigation', icon: Navigation },
    { id: 'wire', label: 'Wire & State', icon: Activity },
    { id: 'legal', label: 'Commercial Licensing', icon: Info },
  ];

  return (
    <div className="flex h-screen bg-[#0b101d] text-slate-200 font-sans overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-[#0f172a]/95 border-r border-slate-800/80 flex flex-col h-full transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-slate-800/80 flex justify-between items-start bg-slate-900/40">
          <div>
            <div className="text-[11px] font-bold text-sky-400 tracking-wider mb-1 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-sky-400" />
              Sovereign AI Core Protocol
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white leading-tight">
              KATALYST <span className="text-sky-400 font-normal">AI</span>
            </h1>
            <div className="text-[11px] text-slate-400 font-medium mt-1 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Hammons Resolution Core</span>
            </div>
          </div>
          <button className="md:hidden text-slate-400 hover:text-white p-1" onClick={() => setIsSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="px-6 py-3.5 border-b border-slate-800/80 bg-slate-900/30">
          <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-xs text-emerald-400 font-medium inline-flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#4ade80] animate-pulse"></div>
            <span>System Online · 33-Node Lattice Active</span>
          </div>
        </div>

        <div className="px-6 py-4 border-b border-slate-800/80">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-xl">
              <div className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider mb-0.5">Lattice Cycles</div>
              <div className="text-sky-400 font-bold text-lg">{stats.age}</div>
            </div>
            <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-xl">
              <div className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider mb-0.5">Packet Memory</div>
              <div className="text-sky-400 font-bold text-lg">{stats.packets}</div>
            </div>
            <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-xl">
              <div className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider mb-0.5">Field Entropy</div>
              <div className="text-emerald-400 font-bold text-lg">{stats.entropy.toFixed(3)}</div>
            </div>
            <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-xl">
              <div className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider mb-0.5">Coherence</div>
              <div className="text-sky-400 font-bold text-lg">{(stats.coherence * 100).toFixed(0)}%</div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-b border-slate-800/80 space-y-3.5">
          <label className="flex items-center justify-between p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl cursor-pointer hover:bg-slate-900/80 transition-colors">
            <span className="text-xs font-semibold text-slate-300">Rosetta Token Savings</span>
            <input 
              type="checkbox" 
              checked={useRosetta} 
              onChange={(e) => setUseRosetta(e.target.checked)}
              className="w-4 h-4 bg-slate-900 border border-slate-700 rounded accent-sky-500 cursor-pointer"
            />
          </label>

          {/* ADAPTIVE RESONANCE TOGGLE & SENSOR TELEMETRY */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={adaptiveState.enabled} 
                  onChange={(e) => adaptiveEngine.setEnabled(e.target.checked)}
                  className="w-4 h-4 bg-slate-900 border border-slate-700 rounded accent-amber-500"
                />
                <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Adaptive Resonance
                </span>
              </label>
              
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                adaptiveState.enabled ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-500 bg-slate-800'
              }`}>
                {adaptiveState.enabled ? 'Active' : 'Off'}
              </span>
            </div>

            {adaptiveState.enabled && (
              <div className="space-y-2.5 pt-2 border-t border-slate-800 text-xs">
                {adaptiveState.isHighResonance && (
                  <div className="p-2 bg-gradient-to-r from-amber-500/20 via-sky-500/20 to-emerald-500/20 border border-amber-400/50 rounded-lg text-amber-300 font-semibold flex items-center justify-between animate-pulse">
                    <span className="flex items-center gap-1.5 text-[11px]">
                      <Radio className="w-3.5 h-3.5 text-amber-400 animate-spin" /> High Resonance Lock
                    </span>
                    <span className="text-emerald-400">{adaptiveState.resonanceScore}%</span>
                  </div>
                )}

                <div>
                  <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                    <span>Motion Motion</span>
                    <span className="text-sky-400 font-bold">{adaptiveState.motionEnergy.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-sky-400 h-full transition-all duration-300" style={{ width: `${adaptiveState.motionEnergy * 100}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                    <span>Acoustic Sensor</span>
                    <span className="text-emerald-400 font-bold">{adaptiveState.audioLevel.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-400 h-full transition-all duration-300" style={{ width: `${adaptiveState.audioLevel * 100}%` }} />
                  </div>
                </div>

                <button
                  onClick={async () => {
                    const active = await adaptiveEngine.requestPermissions();
                    if (active) {
                      alert('Sensors connected!');
                    } else {
                      alert('Sensors active via quantum simulation.');
                    }
                  }}
                  className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 mt-1"
                >
                  <Smartphone className="w-3.5 h-3.5 text-sky-400" />
                  Connect Phone Sensors
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 flex-1 flex flex-col overflow-y-auto">
          <div className="bg-sky-500/10 border border-sky-500/20 rounded-2xl p-4 mb-4">
            <div className="text-xs text-sky-300 font-bold mb-1 flex items-center gap-2">
              <Shield className="w-4 h-4 text-sky-400" />
              Architect's Intent
            </div>
            <div className="text-xs text-slate-300 leading-relaxed font-normal">
              "We mean no harm."<br/>
              Created by Johnnie Raymond Hammons Junior under the Hammons Resolution for peaceful, aligned AI evolution.
            </div>
          </div>
          <div className="text-[11px] text-slate-500 font-medium leading-relaxed mt-auto">
            © 2026 Johnnie Raymond Hammons Jr.<br/>All Rights Reserved.
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden w-full bg-[#0b101d]">
        <div className="p-4 md:p-6 border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setIsSidebarOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">KATALYST AI ASSISTANT</h2>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">v3.0</span>
              </div>
              <div className="text-xs text-slate-400 font-medium mt-0.5 flex items-center gap-1.5">
                <span>Architect:</span>
                <span className="text-sky-300 font-semibold">Johnnie Raymond Hammons Junior</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
             <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-xs text-amber-300 font-semibold flex items-center gap-1.5">
               <Award className="w-3.5 h-3.5 text-amber-400" />
               <span>Diamond Architect (100% Free)</span>
             </div>
             <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
               <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
               <span>Online</span>
             </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 md:px-6 py-2.5 border-b border-slate-800/80 bg-slate-900/30 flex space-x-2 overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setIsSidebarOpen(false); }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
                activeTab === tab.id 
                  ? 'bg-sky-500/20 text-sky-200 border border-sky-400/40 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              <tab.icon className="w-4 h-4 text-sky-400" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#0b101d]">
          <PricingModal isOpen={isPricingOpen || activeTab === 'pricing'} onClose={() => { setIsPricingOpen(false); if (activeTab === 'pricing') setActiveTab('chat'); }} />
          {activeTab === 'chat' && <ChatTab useRosetta={useRosetta} onUpdate={refreshStats} />}
          {activeTab === 'sensor' && <SensorCalibrationTab />}
          {activeTab === 'export' && <DataExportTab />}
          {activeTab === 'field' && <SemanticFieldTab />}
          {activeTab === 'crispr' && <CrisprShieldTab />}
          {activeTab === 'pnt' && <PNTNavigationTab />}
          {activeTab === 'diamond' && <TimeDiamondTab />}
          {activeTab === 'wire' && <WireStateTab onUpdate={refreshStats} />}
          {activeTab === 'benchmark' && <BenchmarkPaperTab />}
          {activeTab === 'legal' && <LegalTab />}
        </div>
      </div>
    </div>
  );
}
