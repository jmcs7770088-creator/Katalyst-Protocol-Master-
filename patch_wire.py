import sys
with open("src/components/wire-state.tsx", "r") as f:
    content = f.read()

replacement = """import React, { useState, useEffect, useRef } from 'react';
import { Activity, Terminal, AlertCircle } from 'lucide-react';

export function WireStateTab({ onUpdate }: { onUpdate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
      <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-2xl max-w-lg">
        <Terminal className="w-12 h-12 text-emerald-500 mx-auto mb-4 opacity-50" />
        <h3 className="text-xl font-black tracking-tighter text-white mb-2">Terminal / Wire & State</h3>
        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          The blueprints for the terminal execution and live state monitoring exist within the Katalyst protocol. 
        </p>
        <div className="flex items-center gap-3 bg-emerald-900/20 border border-emerald-500/30 p-4 rounded-xl text-left">
          <AlertCircle className="w-6 h-6 text-emerald-400 flex-shrink-0" />
          <p className="text-[11px] text-emerald-200 uppercase tracking-widest font-bold">
            Awaiting build to be funded. This module will be fully functional and available soon once development is backed.
          </p>
        </div>
      </div>
    </div>
  );
}
"""
with open("src/components/wire-state.tsx", "w") as f:
    f.write(replacement)
