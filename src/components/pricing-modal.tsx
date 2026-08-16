import React, { useState, useEffect } from 'react';
import { getTierData, activateLicenseKey, setTierDirectly, getTimeUntilResetFormatted, UserTier } from '../lib/tiers';
import { Shield, Zap, Check, Clock, Key, Sparkles, CreditCard, X, Award, TrendingUp, CheckCircle2 } from 'lucide-react';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTierChange?: () => void;
}

export function PricingModal({ isOpen, onClose, onTierChange }: PricingModalProps) {
  const [tierData, setTierData] = useState(() => getTierData());
  const [licenseInput, setLicenseInput] = useState('');
  const [licenseMsg, setLicenseMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [resetCountdown, setResetCountdown] = useState(getTimeUntilResetFormatted());
  const [isProcessingStripe, setIsProcessingStripe] = useState<string | null>(null);

  useEffect(() => {
    const updateData = () => {
      setTierData(getTierData());
      setResetCountdown(getTimeUntilResetFormatted());
    };
    updateData();
    window.addEventListener('tier_data_updated', updateData);
    const interval = setInterval(() => {
      setResetCountdown(getTimeUntilResetFormatted());
    }, 30000);

    return () => {
      window.removeEventListener('tier_data_updated', updateData);
      clearInterval(interval);
    };
  }, []);

  if (!isOpen) return null;

  const handleActivateLicense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseInput.trim()) return;
    const res = activateLicenseKey(licenseInput);
    setLicenseMsg({ text: res.message, isError: !res.success });
    if (res.success) {
      setLicenseInput('');
      if (onTierChange) onTierChange();
    }
  };

  const handleSimulateCheckout = (targetTier: UserTier) => {
    setIsProcessingStripe(targetTier);
    setTimeout(() => {
      setTierDirectly(targetTier);
      setIsProcessingStripe(null);
      setLicenseMsg({ text: `🎉 Success! Account upgraded to ${targetTier.toUpperCase()} plan. All features unlocked!`, isError: false });
      if (onTierChange) onTierChange();
    }, 1000);
  };

  const freeRemaining = Math.max(0, tierData.maxFreeDailyCredits - tierData.dailyUsageCount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto font-sans">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full p-6 md:p-10 shadow-2xl relative space-y-8 my-8 text-slate-100">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2.5 rounded-full bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition-all"
          title="Close pricing modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-sky-500/10 border border-sky-500/30 rounded-full text-sky-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" /> Katalyst AI Plans & Features
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Simple, Transparent Plans
          </h2>
          <p className="text-slate-300 text-xs md:text-sm">
            Enjoy full access to KATALYST AI with daily free responses, or upgrade for unlimited high-speed AI responses & predictive models.
          </p>
        </div>

        {/* Daily Credit Banner */}
        {tierData.tier === 'free' && (
          <div className="p-4 bg-sky-500/10 border border-sky-500/30 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 text-slate-200">
              <Clock className="w-5 h-5 text-sky-400 shrink-0" />
              <div>
                <span className="font-bold text-sky-300">Free Daily Credit Status:</span> You have <strong>{freeRemaining} of {tierData.maxFreeDailyCredits} free responses</strong> remaining today.
                <div className="text-[11px] text-slate-400 mt-0.5">Credits automatically reset every night at midnight (in {resetCountdown}).</div>
              </div>
            </div>
            {freeRemaining === 0 && (
              <span className="px-3 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold rounded-full shrink-0">
                Limit Reached Today
              </span>
            )}
          </div>
        )}

        {/* Alert message */}
        {licenseMsg && (
          <div className={`p-4 rounded-2xl text-xs font-semibold border ${licenseMsg.isError ? 'bg-red-500/10 border-red-500/30 text-red-300' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'}`}>
            {licenseMsg.text}
          </div>
        )}

        {/* 3 Tiers Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* FREE PLAN */}
          <div className={`rounded-2xl p-6 border flex flex-col justify-between space-y-6 transition-all ${
            tierData.tier === 'free' ? 'bg-slate-800/80 border-sky-500 shadow-lg ring-1 ring-sky-500/50' : 'bg-slate-900/60 border-slate-800'
          }`}>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">Free Plan</span>
                {tierData.tier === 'free' && (
                  <span className="px-2.5 py-0.5 bg-sky-500/20 border border-sky-500/40 text-sky-300 text-[10px] font-bold rounded-full">Current Plan</span>
                )}
              </div>
              <div>
                <div className="text-3xl font-extrabold text-white">$0</div>
                <div className="text-slate-400 text-xs mt-1">10 Free Daily Responses</div>
              </div>

              <ul className="space-y-3 text-xs text-slate-300 pt-2">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Gemini Cloud & Local AI Chat</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>10 Free Daily Responses</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Phone Hardware Sensor Telemetry</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Automatic Midnight Reset</span>
                </li>
              </ul>
            </div>

            <button
              disabled={tierData.tier === 'free'}
              onClick={() => setTierDirectly('free')}
              className="w-full py-2.5 border border-slate-700 hover:border-slate-600 rounded-xl text-xs font-bold text-slate-300 disabled:opacity-50 transition-colors"
            >
              {tierData.tier === 'free' ? 'Active Free Plan' : 'Switch to Free'}
            </button>
          </div>

          {/* PRO PLAN */}
          <div className={`rounded-2xl p-6 border flex flex-col justify-between space-y-6 relative transition-all ${
            tierData.tier === 'pro' ? 'bg-sky-950/30 border-sky-400 ring-2 ring-sky-400/50 shadow-xl' : 'bg-slate-900/90 border-slate-800 hover:border-sky-500/50'
          }`}>
            <div className="absolute -top-3 right-4 bg-gradient-to-r from-sky-500 to-indigo-500 text-slate-950 text-[10px] font-bold px-3 py-1 rounded-full shadow">
              Most Popular
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-sky-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Zap className="w-4 h-4" /> Architect Pro
                </span>
                {tierData.tier === 'pro' && (
                  <span className="px-2.5 py-0.5 bg-sky-500/20 border border-sky-500/40 text-sky-300 text-[10px] font-bold rounded-full">Current Plan</span>
                )}
              </div>
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white">$29</span>
                  <span className="text-slate-400 text-xs">/ month</span>
                </div>
                <div className="text-sky-300 text-xs mt-1 font-medium">Unlimited AI & Token Compression</div>
              </div>

              <ul className="space-y-3 text-xs text-slate-200 pt-2">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                  <span><strong>Unlimited</strong> Daily AI Responses</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                  <span><strong>Rosetta Wrapper</strong> (84.5% Token Savings)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                  <span><strong>Live Web Search & Grounding</strong></span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                  <span><strong>Sensor Calibration & Export Tools</strong></span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleSimulateCheckout('pro')}
              disabled={tierData.tier === 'pro' || isProcessingStripe === 'pro'}
              className="w-full py-3 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <CreditCard className="w-4 h-4" />
              {isProcessingStripe === 'pro' ? 'Activating Pro...' : tierData.tier === 'pro' ? 'Active Pro Plan' : 'Get Architect Pro ($29)'}
            </button>
          </div>

          {/* DIAMOND PLAN */}
          <div className={`rounded-2xl p-6 border flex flex-col justify-between space-y-6 relative transition-all ${
            tierData.tier === 'diamond' ? 'bg-amber-950/30 border-amber-400 ring-2 ring-amber-400/50 shadow-xl' : 'bg-slate-900/90 border-slate-800 hover:border-amber-500/50'
          }`}>
            <div className="absolute -top-3 right-4 bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 text-[10px] font-extrabold px-3 py-1 rounded-full shadow">
              Hammons Diamond
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Award className="w-4 h-4" /> Enterprise Diamond
                </span>
                {tierData.tier === 'diamond' && (
                  <span className="px-2.5 py-0.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold rounded-full">Current Plan</span>
                )}
              </div>
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-amber-200">$99</span>
                  <span className="text-slate-400 text-xs">/ month</span>
                </div>
                <div className="text-amber-300 text-xs mt-1 font-medium">Time Diamond Business Predictor</div>
              </div>

              <ul className="space-y-3 text-xs text-slate-200 pt-2">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span><strong>All Pro Features</strong> Included</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <TrendingUp className="w-4 h-4 text-amber-400 shrink-0" />
                  <span><strong>Time Diamond Business Predictor</strong></span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span><strong>Priority Zero-Latency Pipeline</strong></span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span><strong>Architect Hammons Unrestricted Status</strong></span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleSimulateCheckout('diamond')}
              disabled={tierData.tier === 'diamond' || isProcessingStripe === 'diamond'}
              className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Award className="w-4 h-4" />
              {isProcessingStripe === 'diamond' ? 'Activating Enterprise...' : tierData.tier === 'diamond' ? 'Active Diamond Plan' : 'Unlock Diamond ($99)'}
            </button>
          </div>

        </div>

        {/* Promo Code / License Key Section */}
        <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-slate-300 text-xs">
            <Key className="w-4 h-4 text-sky-400 shrink-0" />
            <span>Have a Promo Code or License Key? (e.g. <code>PRO_BUILDER</code> or <code>DIAMOND_PREDICT</code>)</span>
          </div>

          <form onSubmit={handleActivateLicense} className="flex gap-2 w-full md:w-auto">
            <input
              type="text"
              value={licenseInput}
              onChange={e => setLicenseInput(e.target.value)}
              placeholder="Enter Promo Code..."
              className="bg-slate-900 border border-slate-700 text-slate-100 text-xs px-3.5 py-2 rounded-xl focus:outline-none focus:border-sky-400 flex-1 md:w-56"
            />
            <button
              type="submit"
              className="bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md shrink-0"
            >
              Apply Code
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
