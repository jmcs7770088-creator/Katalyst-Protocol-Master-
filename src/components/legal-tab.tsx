import React, { useEffect, useState } from 'react';
import { Shield, FileText, Lock, Building, DollarSign, Key, ExternalLink, Github, CheckCircle2, AlertCircle, RefreshCw, Cpu, Zap } from 'lucide-react';

export function LegalTab() {
  const [eulaText, setEulaText] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [keySaved, setKeySaved] = useState(false);
  const [keyTestStatus, setKeyTestStatus] = useState<{ type: 'idle' | 'testing' | 'success' | 'error'; message?: string }>({ type: 'idle' });

  // GitHub Sync State
  const [githubToken, setGithubToken] = useState("");
  const [githubRepo, setGithubRepo] = useState("katalyst-protocol");
  const [githubPrivate, setGithubPrivate] = useState(true);
  const [githubLoading, setGithubLoading] = useState(false);
  const [githubStatus, setGithubStatus] = useState<{ success?: boolean; message?: string; repoUrl?: string } | null>(null);

  useEffect(() => {
    fetch('/EULA.md')
      .then(res => res.text())
      .then(text => setEulaText(text))
      .catch(() => setEulaText("EULA could not be loaded. Please check the root directory."));
      
    const savedApiKey = localStorage.getItem('enterprise_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
      setKeySaved(true);
    }

    const savedGithubToken = localStorage.getItem('github_pat');
    if (savedGithubToken) {
      setGithubToken(savedGithubToken);
    }
  }, []);

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey) {
      localStorage.setItem('enterprise_api_key', apiKey);
      setKeySaved(true);
      setKeyTestStatus({ type: 'idle', message: 'API key saved to browser storage.' });
    } else {
      localStorage.removeItem('enterprise_api_key');
      setKeySaved(false);
      setKeyTestStatus({ type: 'idle', message: 'API key cleared.' });
    }
  };

  const handleTestApiKey = async () => {
    setKeyTestStatus({ type: 'testing' });
    try {
      const res = await fetch('/api/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey })
      });
      const data = await res.json();
      if (data.success) {
        setKeyTestStatus({ type: 'success', message: 'API key connection verified! Gemini response received successfully.' });
      } else {
        setKeyTestStatus({ type: 'error', message: data.error || 'Failed to connect with provided API key.' });
      }
    } catch (e: any) {
      setKeyTestStatus({ type: 'error', message: e.message || 'Network error verifying API key.' });
    }
  };

  const handleGithubSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubToken) {
      setGithubStatus({ success: false, message: 'Please enter a valid GitHub Personal Access Token (PAT).' });
      return;
    }

    localStorage.setItem('github_pat', githubToken);
    setGithubLoading(true);
    setGithubStatus({ message: 'Authenticating with GitHub & pushing workspace repository...' });

    try {
      const res = await fetch('/api/github/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          githubToken,
          repoName: githubRepo,
          isPrivate: githubPrivate
        })
      });

      const data = await res.json();
      if (data.success) {
        setGithubStatus({
          success: true,
          message: data.message,
          repoUrl: data.repoUrl
        });
      } else {
        setGithubStatus({
          success: false,
          message: data.error || 'Failed to sync repository.'
        });
      }
    } catch (e: any) {
      setGithubStatus({
        success: false,
        message: e.message || 'Network error syncing repository.'
      });
    } finally {
      setGithubLoading(false);
    }
  };

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const handleCheckout = async (planKey: string) => {
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planKey })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Payment setup failed.');
      }
    } catch (e) {
      console.error(e);
      alert('Network error connecting to payment gateway.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto h-full flex flex-col pb-8">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
        <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
          <Shield className="w-8 h-8 text-amber-500" />
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-tighter text-white uppercase">Subscriptions, Licensing & Sync</h2>
          <div className="text-slate-400 text-sm font-mono mt-1">True Katalyst Personal AI, System Wrapper, GitHub Sync & Sovereign Rights</div>
        </div>
      </div>

      {/* Subscription Plans Section */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white uppercase tracking-tight flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Sovereign Subscription Plans
            </h3>
            <p className="text-xs text-slate-400 font-mono">Select a tier to activate Katalyst AI personal companion or enterprise system infrastructure.</p>
          </div>

          <div className="flex items-center bg-black/60 p-1 rounded-lg border border-slate-800 self-start sm:self-auto font-mono text-xs">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-3 py-1.5 rounded transition-colors ${billingCycle === 'monthly' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1 ${billingCycle === 'yearly' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Yearly Billing
              <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold uppercase">Save 17%</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Plan 1: True Katalyst Experience */}
          <div className="bg-gradient-to-b from-indigo-950/40 to-slate-950 border border-indigo-500/30 rounded-lg p-5 flex flex-col justify-between shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-bl">
              Most Popular
            </div>

            <div>
              <div className="flex items-center gap-2 text-indigo-400 font-bold uppercase text-xs tracking-wider mb-1">
                <Cpu className="w-4 h-4" /> Personal AI & Companion
              </div>
              <h4 className="text-xl font-black text-white uppercase tracking-tight mb-2">True Katalyst Experience</h4>
              <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                Talk, code, build, and resolve life or project problems with Katalyst. Powered by Goal-State Error Correction, Need-State Emotional Vectors, and Determination Engine.
              </p>

              <div className="mb-4">
                <span className="text-3xl font-black text-white font-mono">
                  {billingCycle === 'monthly' ? '$29' : '$290'}
                </span>
                <span className="text-xs text-slate-400 font-mono ml-1">
                  / {billingCycle === 'monthly' ? 'month' : 'year (2 months free)'}
                </span>
              </div>

              <ul className="space-y-2 text-xs text-slate-300 font-mono mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Unlimited Chat & Co-Building with Katalyst</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Goal-State Entropy Reduction (Code, Math, Life)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Emotional Need-State Vectors & Determination Engine</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Local Sovereign AI Mode + Gemini 3.6 Flash</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleCheckout(billingCycle === 'monthly' ? 'katalyst_monthly' : 'katalyst_yearly')}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase text-xs tracking-widest py-3 rounded transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/50"
            >
              Activate True Katalyst Experience <ExternalLink className="w-4 h-4" />
            </button>
          </div>

          {/* Plan 2: Enterprise System Wrapper */}
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700 rounded-lg p-5 flex flex-col justify-between shadow-lg">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase text-xs tracking-wider mb-1">
                <Building className="w-4 h-4" /> Enterprise Infrastructure
              </div>
              <h4 className="text-xl font-black text-white uppercase tracking-tight mb-2">Enterprise System Wrapper</h4>
              <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                Full commercial license for the Phase-Node Topological (PNT) database, enterprise system wrapper, and 84.5% Rosetta Token Compressor.
              </p>

              <div className="mb-4">
                <span className="text-3xl font-black text-white font-mono">
                  {billingCycle === 'monthly' ? '$2,000' : '$20,000'}
                </span>
                <span className="text-xs text-slate-400 font-mono ml-1">
                  / {billingCycle === 'monthly' ? 'month' : 'year'}
                </span>
              </div>

              <ul className="space-y-2 text-xs text-slate-300 font-mono mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Commercial PNT & System Wrapper License</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>BYO Enterprise API Key Override & Rate Limit Bypass</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>84.5% Rosetta Token Compression Database</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Enterprise Token Compression & Custom API Integration</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleCheckout(billingCycle === 'monthly' ? 'wrapper_monthly' : 'wrapper_yearly')}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase text-xs tracking-widest py-3 rounded transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50"
            >
              Subscribe to Enterprise Wrapper <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* GitHub Repository Sync Panel */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-5 shrink-0 shadow-[0_0_20px_rgba(0,0,0,0.4)]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-white font-bold uppercase tracking-widest text-sm">
            <Github className="w-5 h-5 text-purple-400" />
            Sync Workspace to GitHub Repository
          </div>
          <a
            href="https://github.com/settings/tokens/new?scopes=repo&description=Katalyst+Protocol+Sync"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-mono underline"
          >
            Create GitHub PAT <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <p className="text-slate-400 text-xs mb-4">
          Directly publish and sync all project code, components, server files, and memory scripts to your GitHub account using a GitHub Personal Access Token (PAT).
        </p>

        <form onSubmit={handleGithubSync} className="space-y-4 max-w-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 text-xs font-mono mb-1 uppercase tracking-wider">GitHub Token (PAT)</label>
              <input
                type="password"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                className="w-full bg-black/60 border border-slate-700 text-slate-300 px-3 py-2 rounded focus:outline-none focus:border-purple-500/50 font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-xs font-mono mb-1 uppercase tracking-wider">Repository Name</label>
              <input
                type="text"
                value={githubRepo}
                onChange={(e) => setGithubRepo(e.target.value)}
                placeholder="katalyst-protocol"
                className="w-full bg-black/60 border border-slate-700 text-slate-300 px-3 py-2 rounded focus:outline-none focus:border-purple-500/50 font-mono text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-slate-300 text-xs font-mono cursor-pointer">
              <input
                type="checkbox"
                checked={githubPrivate}
                onChange={(e) => setGithubPrivate(e.target.checked)}
                className="rounded border-slate-700 bg-black/60 text-purple-600 focus:ring-purple-500"
              />
              Create as Private Repository
            </label>

            <button
              type="submit"
              disabled={githubLoading}
              className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-6 py-2 rounded font-bold tracking-widest uppercase text-xs transition-colors flex items-center gap-2"
            >
              {githubLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Github className="w-3.5 h-3.5" />}
              {githubLoading ? "Pushing to GitHub..." : "Sync to GitHub"}
            </button>
          </div>
        </form>

        {githubStatus && (
          <div className={`mt-4 p-3 rounded text-xs font-mono flex items-start gap-2 ${githubStatus.success ? 'bg-emerald-950/60 border border-emerald-800/80 text-emerald-300' : 'bg-red-950/60 border border-red-800/80 text-red-300'}`}>
            {githubStatus.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}
            <div className="flex-1">
              <div>{githubStatus.message}</div>
              {githubStatus.repoUrl && (
                <a
                  href={githubStatus.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 bg-emerald-600 text-white px-3 py-1 rounded font-sans font-bold hover:bg-emerald-500 transition-colors uppercase text-[10px] tracking-wider"
                >
                  Open GitHub Repository <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Enterprise Gemini API Key Section */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-5 shrink-0 shadow-[0_0_20px_rgba(0,0,0,0.4)]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-white font-bold uppercase tracking-widest text-sm">
            <Key className="w-5 h-5 text-emerald-400" />
            Enterprise Gemini API Key
          </div>
          {keySaved && (
            <span className="flex items-center gap-1 text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
              <CheckCircle2 className="w-3 h-3" /> Key Active
            </span>
          )}
        </div>

        <p className="text-slate-400 text-xs mb-4">
          Save your Enterprise Gemini API key below to override default rate limits and run LLM queries directly with your account credentials.
        </p>

        <form onSubmit={handleSaveApiKey} className="space-y-3 max-w-2xl">
          <div className="flex gap-3">
            <input 
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="flex-1 bg-black/60 border border-slate-700 text-slate-300 px-4 py-2 rounded focus:outline-none focus:border-emerald-500/50 font-mono text-sm"
            />
            <button 
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded font-bold tracking-widest uppercase text-xs transition-colors shrink-0"
            >
              Save Key
            </button>
            <button 
              type="button"
              onClick={handleTestApiKey}
              disabled={keyTestStatus.type === 'testing'}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 px-4 py-2 rounded font-mono text-xs uppercase tracking-wider transition-colors shrink-0 flex items-center gap-1.5"
            >
              {keyTestStatus.type === 'testing' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Cpu className="w-3.5 h-3.5" />}
              Test Connection
            </button>
          </div>
        </form>

        {keyTestStatus.message && (
          <div className={`mt-3 p-2.5 rounded text-xs font-mono flex items-center gap-2 ${keyTestStatus.type === 'error' ? 'bg-red-950/60 text-red-300 border border-red-800' : keyTestStatus.type === 'success' ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-300'}`}>
            {keyTestStatus.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
            {keyTestStatus.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {keyTestStatus.message}
          </div>
        )}
      </div>

      {/* Token Reduction Benchmark Box */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 font-mono text-xs text-slate-300">
        <div className="text-amber-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
          <Zap className="w-4 h-4" /> Katalyst Token Compression vs Standard AI Context
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] mt-2">
          <div className="bg-black/40 p-2.5 rounded border border-slate-800">
            <span className="text-slate-400 block mb-1">Standard Uncompressed LLM Context</span>
            <span className="text-red-400 font-bold text-sm">~100% Token Overhead</span>
            <span className="text-[10px] text-slate-500 block mt-1">Transmits full verbatim raw chat transcript on every turn.</span>
          </div>
          <div className="bg-black/40 p-2.5 rounded border border-slate-800">
            <span className="text-slate-400 block mb-1">Katalyst Rosetta Vector Packet</span>
            <span className="text-emerald-400 font-bold text-sm">~15.5% Token Footprint</span>
            <span className="text-[10px] text-slate-500 block mt-1">Projects semantic context into 33-node Topological Lattice.</span>
          </div>
          <div className="bg-black/40 p-2.5 rounded border border-slate-800">
            <span className="text-slate-400 block mb-1">Total Savings Efficiency</span>
            <span className="text-sky-400 font-bold text-sm">84.5% Token Reduction</span>
            <span className="text-[10px] text-slate-500 block mt-1">Saves bandwidth & costs while preserving long-term coherence.</span>
          </div>
        </div>
      </div>

      {/* EULA box */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-[200px] bg-slate-950 border border-slate-800 rounded-lg">
        <div className="px-4 py-2 bg-slate-900/80 border-b border-slate-800 flex items-center gap-2 text-xs uppercase tracking-widest text-slate-400 font-bold">
          <FileText className="w-3.5 h-3.5" /> EULA.md (End User License Agreement)
        </div>
        <div className="p-4 overflow-y-auto font-mono text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
          {eulaText || "Loading..."}
        </div>
      </div>
    </div>
  );
}

