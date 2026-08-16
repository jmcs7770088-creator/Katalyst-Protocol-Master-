import sys
with open("src/components/pnt-navigation.tsx", "r") as f:
    content = f.read()

replacement = """import React from 'react';
import { Navigation, AlertCircle } from 'lucide-react';

export function PNTNavigationTab() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
      <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-2xl max-w-lg">
        <Navigation className="w-12 h-12 text-sky-500 mx-auto mb-4 opacity-50" />
        <h3 className="text-xl font-black tracking-tighter text-white mb-2">PNT Navigation Module</h3>
        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          The blueprints and architectural foundation for satellite-free PNT (Position, Navigation, and Timing) exist within the Katalyst protocol. 
        </p>
        <div className="flex items-center gap-3 bg-sky-900/20 border border-sky-500/30 p-4 rounded-xl text-left">
          <AlertCircle className="w-6 h-6 text-sky-400 flex-shrink-0" />
          <p className="text-[11px] text-sky-200 uppercase tracking-widest font-bold">
            Awaiting build to be funded. This module will be fully functional and available soon once development is backed.
          </p>
        </div>
      </div>
    </div>
  );
}
"""
with open("src/components/pnt-navigation.tsx", "w") as f:
    f.write(replacement)
