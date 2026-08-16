import React, { useState } from 'react';
import { getKatalyst } from '../lib/katalyst';
import { getTierData } from '../lib/tiers';
import { PricingModal } from './pricing-modal';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Sparkles, TrendingUp, DollarSign, Zap, Lock, Award, ShieldAlert, Sliders } from 'lucide-react';

export function TimeDiamondTab() {
  const kat = getKatalyst();
  const org = kat.org;
  const tierData = getTierData();
  const isDiamond = tierData.tier === 'diamond';

  const [isPricingOpen, setIsPricingOpen] = useState(false);

  // Business Prediction Simulator State
  const [monthlyRevenue, setMonthlyRevenue] = useState<number>(25000);
  const [customerAcquisitionCost, setCustomerAcquisitionCost] = useState<number>(45);
  const [activeCustomers, setActiveCustomers] = useState<number>(1200);
  const [tokenEfficiencyRatio, setTokenEfficiencyRatio] = useState<number>(85); // %
  const [projectionHorizon, setProjectionHorizon] = useState<number>(12); // months

  // Calculate projected error/energy trajectory
  const errorData = org.errorHistory.slice(-50).map((err, i) => ({
    name: `t-${org.errorHistory.length - i}`,
    'Error Norm': err
  }));

  const proj = org.timeDiamond(projectionHorizon);
  const pe = proj.map(p => p.reduce((a, b) => a + b, 0));

  // Fine-tuned Business Future Prediction Calculations
  const businessTrajectoryData = pe.map((energyNorm, monthIndex) => {
    const growthFactor = 1 + (0.08 * (1 + (tokenEfficiencyRatio / 100)));
    const month = monthIndex + 1;
    const projectedRev = Math.round(monthlyRevenue * Math.pow(growthFactor, month));
    const tokenSavingsVal = Math.round(projectedRev * (tokenEfficiencyRatio / 100) * 0.18);
    const projectedValuation = Math.round(projectedRev * 12 * 4.5); // 4.5x ARR multiple

    return {
      name: `M+${month}`,
      'Projected Monthly Rev ($)': projectedRev,
      'Token Cost Savings ($)': tokenSavingsVal,
      'Projected ARR Valuation ($)': projectedValuation,
      'Field Energy Norm': Number(energyNorm.toFixed(3))
    };
  });

  const finalProjectedRev = businessTrajectoryData[businessTrajectoryData.length - 1]?.['Projected Monthly Rev ($)'] || monthlyRevenue;
  const totalSavings = businessTrajectoryData.reduce((acc, curr) => acc + curr['Token Cost Savings ($)'], 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PricingModal isOpen={isPricingOpen} onClose={() => setIsPricingOpen(false)} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-amber-400 font-bold mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Custom Efficiency Fine-Tuned Prediction Model
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            TIME DIAMOND <span className="text-amber-400 font-light italic">Business Future Predictor</span>
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Predicts business growth, valuation trajectories, and token cost-efficiency ratios using Hammons $1+6$ Nodal Field Energy ($\Omega_G = \phi \cdot c^2$).
          </p>
        </div>

        {!isDiamond && (
          <button
            onClick={() => setIsPricingOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs font-mono font-bold uppercase tracking-wider rounded-lg shadow-lg shadow-amber-950 flex items-center gap-2 shrink-0 animate-pulse"
          >
            <Lock className="w-4 h-4" />
            Unlock Diamond Tier ($99/mo)
          </button>
        )}
      </div>

      {/* Gated Overlay Notice for Non-Diamond users */}
      {!isDiamond && (
        <div className="p-4 bg-amber-950/40 border border-amber-500/50 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono text-amber-200">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-amber-400 shrink-0" />
            <div>
              <strong className="text-amber-300 uppercase">Hammons Omnipoint Diamond Feature:</strong> You are currently viewing a read-only preview. Upgrade to <strong>Diamond Tier</strong> to unlock custom business fine-tuning parameter controls and live prediction exports.
            </div>
          </div>
          <button
            onClick={() => setIsPricingOpen(true)}
            className="px-3 py-1.5 bg-amber-500 text-slate-950 text-[10px] font-mono font-bold uppercase tracking-wider rounded"
          >
            Upgrade Plan
          </button>
        </div>
      )}

      {/* Business Model Parameters Fine-Tuning Panel */}
      <div className={`p-5 rounded-xl border bg-slate-900/40 border-slate-800 space-y-4 ${!isDiamond ? 'opacity-80' : ''}`}>
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400 flex items-center gap-2">
            <Sliders className="w-4 h-4" /> Fine-Tuned Business Input Variables
          </h3>
          <span className="text-[10px] font-mono text-slate-500 uppercase">
            Model: Rosetta-Katalyst-Diamond-v4
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
          <div>
            <label className="block text-[10px] text-slate-400 uppercase tracking-widest mb-1.5">Current Monthly Revenue ($)</label>
            <input
              type="number"
              value={monthlyRevenue}
              disabled={!isDiamond}
              onChange={e => setMonthlyRevenue(Number(e.target.value))}
              className="w-full bg-black/60 border border-slate-800 text-amber-300 p-2 rounded focus:outline-none focus:border-amber-500 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 uppercase tracking-widest mb-1.5">Customer Count</label>
            <input
              type="number"
              value={activeCustomers}
              disabled={!isDiamond}
              onChange={e => setActiveCustomers(Number(e.target.value))}
              className="w-full bg-black/60 border border-slate-800 text-amber-300 p-2 rounded focus:outline-none focus:border-amber-500 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 uppercase tracking-widest mb-1.5">Rosetta Token Efficiency (%)</label>
            <input
              type="number"
              value={tokenEfficiencyRatio}
              disabled={!isDiamond}
              onChange={e => setTokenEfficiencyRatio(Number(e.target.value))}
              className="w-full bg-black/60 border border-slate-800 text-emerald-400 p-2 rounded focus:outline-none focus:border-emerald-500 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 uppercase tracking-widest mb-1.5">Forecast Horizon (Months)</label>
            <select
              value={projectionHorizon}
              disabled={!isDiamond}
              onChange={e => setProjectionHorizon(Number(e.target.value))}
              className="w-full bg-black/60 border border-slate-800 text-sky-400 p-2 rounded focus:outline-none focus:border-sky-500 disabled:opacity-60"
            >
              <option value={6}>6 Months (Short-Term)</option>
              <option value={12}>12 Months (1 Year)</option>
              <option value={24}>24 Months (2 Years)</option>
              <option value={36}>36 Months (3 Years)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Forecast Key Performance Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 border border-amber-500/30 rounded-xl p-4 space-y-1">
          <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold flex items-center justify-between">
            <span>Projected Monthly Rev ({projectionHorizon}M)</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300 font-mono">${finalProjectedRev.toLocaleString()}</div>
          <div className="text-[10px] text-emerald-400 font-mono">
            +{(((finalProjectedRev - monthlyRevenue) / monthlyRevenue) * 100).toFixed(1)}% Projected Growth
          </div>
        </div>

        <div className="bg-slate-900/60 border border-emerald-500/30 rounded-xl p-4 space-y-1">
          <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold flex items-center justify-between">
            <span>Rosetta Token Cost Savings</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">${totalSavings.toLocaleString()}</div>
          <div className="text-[10px] text-slate-400 font-mono">Cumulative API Overhead Eliminated</div>
        </div>

        <div className="bg-slate-900/60 border border-sky-500/30 rounded-xl p-4 space-y-1">
          <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold flex items-center justify-between">
            <span>Projected Business ARR Valuation</span>
            <DollarSign className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-sky-300 font-mono">${(finalProjectedRev * 12 * 4.5).toLocaleString()}</div>
          <div className="text-[10px] text-slate-400 font-mono">Based on 4.5x ARR Industry Multiple</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Business Growth & Revenue Trajectory Chart */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 flex flex-col">
          <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Projected Business Revenue & Savings Trajectory
          </h3>
          <div className="h-64 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={businessTrajectoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" tick={{fill: '#64748b', fontSize: 10, fontFamily: 'monospace'}} />
                <YAxis stroke="#64748b" tick={{fill: '#64748b', fontSize: 10, fontFamily: 'monospace'}} domain={['auto', 'auto']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#050608', borderColor: '#1e293b', fontSize: '11px', fontFamily: 'monospace' }}
                />
                <Line type="monotone" dataKey="Projected Monthly Rev ($)" stroke="#fbbf24" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Token Cost Savings ($)" stroke="#34d399" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Nodal Field Energy Convergence Chart */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 flex flex-col">
          <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-sky-400 mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4" /> 33-Node Lattice Future Energy Trajectory
          </h3>
          <div className="h-64 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={businessTrajectoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" tick={{fill: '#64748b', fontSize: 10, fontFamily: 'monospace'}} />
                <YAxis stroke="#64748b" tick={{fill: '#64748b', fontSize: 10, fontFamily: 'monospace'}} domain={['auto', 'auto']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#050608', borderColor: '#1e293b', fontSize: '11px', fontFamily: 'monospace' }}
                />
                <Line type="monotone" dataKey="Field Energy Norm" stroke="#38bdf8" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Strategic AI Forecast Briefing */}
      <div className="p-5 bg-gradient-to-r from-amber-950/20 via-slate-900/60 to-sky-950/20 border border-amber-500/30 rounded-xl space-y-3 font-mono text-xs">
        <div className="flex items-center gap-2 text-amber-300 font-bold uppercase tracking-widest text-[11px]">
          <Award className="w-4 h-4 text-amber-400" /> Katalyst Diamond Business Future Strategic Briefing
        </div>
        <p className="text-slate-300 leading-relaxed">
          Based on the current phase-locked energy density ($\Omega_G = \phi \cdot c^2$), integrating Rosetta token compression reduces operational API costs by <strong>{tokenEfficiencyRatio}%</strong>. Over a {projectionHorizon}-month horizon, projected monthly cash flows scale from <strong>${monthlyRevenue.toLocaleString()}</strong> to <strong>${finalProjectedRev.toLocaleString()}</strong> while saving an estimated <strong>${totalSavings.toLocaleString()}</strong> in cloud compute overhead.
        </p>
      </div>
    </div>
  );
}
