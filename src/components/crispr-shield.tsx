import React, { useState, useRef, useEffect } from 'react';
import { getKatalyst, ORIGIN_929 } from '../lib/katalyst';
import { Terminal, Play, SquareTerminal } from 'lucide-react';

export function CrisprShieldTab() {
  const kat = getKatalyst();
  const org = kat.org;
  
  const hasArchitectKey = typeof window !== 'undefined' && !!localStorage.getItem('architect_key');
  const architectKey = typeof window !== 'undefined' ? localStorage.getItem('architect_key') : null;

  const [terminalHistory, setTerminalHistory] = useState<{type: 'cmd'|'out'|'err', text: string}[]>([]);
  const [terminalInput, setTerminalInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  
  const spacers: any[] = [];
  for (const [nodeIdx, nodeSpacers] of Object.entries(org.crispr.spacers)) {
    nodeSpacers.forEach(s => {
      spacers.push({
        node: nodeIdx,
        category: s.category,
        payload: s.raw_payload.substring(0, 40) + (s.raw_payload.length > 40 ? '...' : ''),
        id: s.spacer_id
      });
    });
  }

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalHistory]);

  const runTerminalCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim() || isExecuting) return;

    const cmd = terminalInput;
    setTerminalInput('');
    setTerminalHistory(prev => [...prev, { type: 'cmd', text: `$ ${cmd}` }]);
    setIsExecuting(true);

    try {
      let language = "bash";
      if (cmd.startsWith("python ")) language = "python";
      
      const payloadCmd = language === "python" ? cmd.replace(/^python\s+/, "") : cmd;

      const res = await fetch("/api/terminal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: payloadCmd, language, authKey: architectKey })
      });
      const data = await res.json();
      
      if (data.error) {
        setTerminalHistory(prev => [...prev, { type: 'err', text: data.error }]);
      } else {
        if (data.stdout) setTerminalHistory(prev => [...prev, { type: 'out', text: data.stdout }]);
        if (data.stderr) setTerminalHistory(prev => [...prev, { type: 'err', text: data.stderr }]);
        if (!data.stdout && !data.stderr) setTerminalHistory(prev => [...prev, { type: 'out', text: '[Command completed with no output]' }]);
      }
    } catch (err: any) {
      setTerminalHistory(prev => [...prev, { type: 'err', text: err.message || "Failed to execute" }]);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-full max-h-full">
      <h3 className="text-[11px] uppercase tracking-widest text-slate-500 font-bold border-b border-slate-800 pb-2 flex justify-between shrink-0">
        <span>{hasArchitectKey ? "CRISPR Vault & Terminal" : "CRISPR Vault"}</span>
        <span className="text-rose-500">Immune Active</span>
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
        <div className="bg-slate-900/40 p-4 rounded-lg border border-slate-800/50">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Spacers Stored</div>
          <div className="text-2xl text-emerald-400 font-mono">{org.crispr.totalSpacerCount()}</div>
        </div>
        <div className="bg-slate-900/40 p-4 rounded-lg border border-slate-800/50">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Phase Sync</div>
          <div className="text-2xl text-sky-400 font-mono">{org.lattice.meanPhaseSync().toFixed(4)}</div>
        </div>
        <div className="bg-slate-900/40 p-4 rounded-lg border border-slate-800/50">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Origin Anchor</div>
          <div className="text-2xl text-fuchsia-400 font-mono">{ORIGIN_929}</div>
        </div>
      </div>

      <div className={`grid grid-cols-1 ${hasArchitectKey ? 'lg:grid-cols-2' : ''} gap-6 flex-1 min-h-0 overflow-hidden shrink-0 ${hasArchitectKey ? 'h-[500px]' : ''}`}>
        
        {/* Active Genomic Spacers */}
        <div className="bg-slate-900/40 border border-slate-800/50 rounded-lg p-4 flex flex-col h-full overflow-hidden">
          <h3 className="text-[11px] uppercase tracking-widest text-slate-500 font-bold mb-4 shrink-0">Active Genomic Spacers</h3>
          <div className="flex-1 overflow-y-auto">
            {spacers.length > 0 ? (
              <div className="space-y-2 font-mono text-[10px]">
                {spacers.map((s, i) => (
                  <div key={i} className={`p-3 bg-black/40 border-l-2 ${i % 3 === 0 ? 'border-sky-500' : i % 3 === 1 ? 'border-emerald-500' : 'border-rose-500'} text-slate-400`}>
                    <div className="flex justify-between mb-1">
                      <span className="font-bold">[{s.category.toUpperCase()} @ Node {s.node}]</span>
                      <span className="text-slate-600">ID: {s.id}</span>
                    </div>
                    <div className="text-sky-100/70">{s.payload}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-black/40 border border-slate-800 text-slate-500 text-[10px] font-mono">
                No CRISPR spacers acquired yet. Ingest code or keys to trigger vault binding.
              </div>
            )}
          </div>
        </div>

        {/* On-Board Terminal */}
        {hasArchitectKey && (
        <div className="bg-black border border-slate-800/50 rounded-lg p-0 flex flex-col h-full overflow-hidden shadow-[0_0_15px_rgba(0,0,0,0.5)]">
          <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-sky-500 font-mono text-[10px] uppercase tracking-widest font-bold">
              <SquareTerminal className="w-3.5 h-3.5" /> root@katalyst-core
            </div>
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px] leading-relaxed">
            <div className="text-slate-500 mb-4">
              Katalyst OS Terminal Environment<br/>
              Type 'python &lt;code&gt;' to execute python, or standard bash commands.
            </div>
            
            <div className="space-y-1">
              {terminalHistory.map((item, i) => (
                <div key={i} className={
                  item.type === 'cmd' ? 'text-sky-400 mt-2' : 
                  item.type === 'err' ? 'text-rose-400 break-all' : 
                  'text-slate-300 break-all whitespace-pre-wrap'
                }>
                  {item.text}
                </div>
              ))}
              <div ref={endRef} />
            </div>
          </div>

          <form onSubmit={runTerminalCommand} className="p-2 border-t border-slate-800 bg-slate-900/50 shrink-0">
            <div className="flex items-center bg-black border border-slate-800 rounded px-2">
              <span className="text-sky-500 font-mono text-[11px] mr-2">$</span>
              <input
                type="text"
                value={terminalInput}
                onChange={e => setTerminalInput(e.target.value)}
                placeholder="Enter command..."
                disabled={isExecuting}
                className="flex-1 bg-transparent border-none outline-none text-slate-300 font-mono text-[11px] py-2 focus:ring-0 disabled:opacity-50"
              />
              <button 
                type="submit" 
                disabled={isExecuting || !terminalInput.trim()}
                className="text-slate-500 hover:text-sky-400 p-1 disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
        )}
      </div>
    </div>
  );
}
