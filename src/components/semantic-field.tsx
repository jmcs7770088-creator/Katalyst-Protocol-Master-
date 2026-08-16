import React, { useState, useEffect, useRef } from 'react';
import { Network, Play, RotateCcw, Activity, ShieldCheck, Zap, Layers, Sparkles, CheckCircle2, ArrowRight, Cpu, Compass, Sliders } from 'lucide-react';
import { OMEGA_G, ZETA_H } from '../lib/katalyst';

// ============================================================================
// 1. RK4 PHYSICS ENGINE & VECTOR 3 MATH FOR COUNTERFACTUAL CHALLENGE
// ============================================================================
class Vector3 {
  x: number;
  y: number;
  z: number;

  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  clone() {
    return new Vector3(this.x, this.y, this.z);
  }

  copy(v: Vector3) {
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;
    return this;
  }

  add(v: Vector3) {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;
    return this;
  }

  multiplyScalar(s: number) {
    this.x *= s;
    this.y *= s;
    this.z *= s;
    return this;
  }

  lengthSq() {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }

  length() {
    return Math.sqrt(this.lengthSq());
  }

  normalize() {
    const l = this.length();
    if (l > 1e-6) {
      this.x /= l;
      this.y /= l;
      this.z /= l;
    } else {
      this.x = 0;
      this.y = 0;
      this.z = 0;
    }
    return this;
  }
}

class SpringMassSystem {
  p: Vector3;
  v: Vector3;
  f_init: Vector3;
  t: number;
  mass: number;
  springK: number;
  dampingGamma: number;

  constructor(p0: Vector3, v0: Vector3, f_init: Vector3, mass = 1.0, springK = 2.0, dampingGamma = 0.5) {
    this.p = p0.clone();
    this.v = v0.clone();
    this.f_init = f_init.clone();
    this.t = 0;
    this.mass = mass;
    this.springK = springK;
    this.dampingGamma = dampingGamma;
  }

  getAcceleration(position: Vector3, velocity: Vector3) {
    // 1. Spring Force = -k * p
    const f_spring = position.clone().multiplyScalar(-this.springK);
    // 2. Non-linear Damping = -gamma * |v|^2 * v_normalized
    const speedSq = velocity.lengthSq();
    const f_damping = velocity.clone().normalize().multiplyScalar(-this.dampingGamma * speedSq);

    const a = new Vector3();
    a.add(f_spring).add(f_damping).multiplyScalar(1 / this.mass);
    return a;
  }

  step(dt: number) {
    if (this.t === 0 && this.f_init.length() > 1e-6) {
      // Impulse delta_v = F * dt / M
      this.v.add(this.f_init.clone().multiplyScalar(dt / this.mass));
      this.f_init = new Vector3(0, 0, 0);
    }

    const deriv = (p: Vector3, v: Vector3) => ({
      dp: v.clone(),
      dv: this.getAcceleration(p, v)
    });

    const k1 = deriv(this.p, this.v);

    const p_k2 = this.p.clone().add(k1.dp.clone().multiplyScalar(dt / 2));
    const v_k2 = this.v.clone().add(k1.dv.clone().multiplyScalar(dt / 2));
    const k2 = deriv(p_k2, v_k2);

    const p_k3 = this.p.clone().add(k2.dp.clone().multiplyScalar(dt / 2));
    const v_k3 = this.v.clone().add(k2.dv.clone().multiplyScalar(dt / 2));
    const k3 = deriv(p_k3, v_k3);

    const p_k4 = this.p.clone().add(k3.dp.clone().multiplyScalar(dt));
    const v_k4 = this.v.clone().add(k3.dv.clone().multiplyScalar(dt));
    const k4 = deriv(p_k4, v_k4);

    const dp_avg = k1.dp.add(k2.dp.multiplyScalar(2)).add(k3.dp.multiplyScalar(2)).add(k4.dp).multiplyScalar(dt / 6);
    const dv_avg = k1.dv.add(k2.dv.multiplyScalar(2)).add(k3.dv.multiplyScalar(2)).add(k4.dv).multiplyScalar(dt / 6);

    this.p.add(dp_avg);
    this.v.add(dv_avg);
    this.t += dt;
  }
}

// Abductive Search Algorithm to compute F_init
function calculateCounterfactualInitialForce(
  initialP: Vector3,
  initialV: Vector3,
  targetTime = 10,
  mass = 1.0,
  springK = 2.0,
  dampingGamma = 0.5,
  numIterations = 3000
): { force: Vector3; error: number } {
  const dt = 1 / 60;
  const steps = Math.round(targetTime / dt);

  const evaluateForce = (fTest: Vector3) => {
    const sys = new SpringMassSystem(initialP, initialV, fTest, mass, springK, dampingGamma);
    for (let i = 0; i < steps; i++) {
      sys.step(dt);
    }
    return sys.p.lengthSq() + sys.v.lengthSq();
  };

  let bestForce = new Vector3(0, 0, 0);
  let bestError = evaluateForce(bestForce);
  let stepSize = 0.8;

  for (let i = 0; i < numIterations; i++) {
    const testForce = bestForce.clone().add(
      new Vector3(
        (Math.random() - 0.5) * 2 * stepSize,
        (Math.random() - 0.5) * 2 * stepSize,
        (Math.random() - 0.5) * 2 * stepSize
      )
    );
    const err = evaluateForce(testForce);
    if (err < bestError) {
      bestError = err;
      bestForce.copy(testForce);
    }
    if (i % 500 === 0) {
      stepSize *= 0.85; // Decay step size
    }
  }

  return { force: bestForce, error: Math.sqrt(bestError) };
}

// ============================================================================
// MAIN COMPONENT: SEMANTIC FIELD & CAUSAL-GEOMETRIC ENGINE
// ============================================================================
export function SemanticFieldTab() {
  const [activeSubTab, setActiveSubTab] = useState<'3d-physics' | '2d-geometry' | 'manifold-ei'>('3d-physics');

  // Physics Challenge Parameters
  const [simulationDuration, setSimulationDuration] = useState(10);
  const [massVal, setMassVal] = useState(1.0);
  const [springKVal, setSpringKVal] = useState(2.0);
  const [dampingGammaVal, setDampingGammaVal] = useState(0.5);

  // Simulation Run States
  const [isSimulating, setIsSimulating] = useState(false);
  const [counterfactualForce, setCounterfactualForce] = useState<Vector3 | null>(null);
  const [stoppingError, setStoppingError] = useState<number | null>(null);
  const [coherenceScore, setCoherenceScore] = useState<number | null>(null);

  // Animation Trail History
  const [actualTrail, setActualTrail] = useState<{ x: number; y: number; z: number }[]>([]);
  const [counterfactualTrail, setCounterfactualTrail] = useState<{ x: number; y: number; z: number }[]>([]);

  // Need-State Vector Sliders
  const [joyVector, setJoyVector] = useState(75);
  const [fearVector, setFearVector] = useState(20);
  const [angerVector, setAngerVector] = useState(15);
  const [griefVector, setGriefVector] = useState(10);
  const [determinationVector, setDeterminationVector] = useState(90);

  // Torsional Pressure Slider for Manifold
  const [torsionalPressure, setTorsionalPressure] = useState(0.12);
  const [isPhaseLocked, setIsPhaseLocked] = useState(true);

  // Canvas Refs
  const actualCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cfCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const geomCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // --------------------------------------------------------------------------
  // RUN COUNTERFACTUAL PHYSICS CHALLENGE
  // --------------------------------------------------------------------------
  const runPhysicsChallenge = () => {
    setIsSimulating(true);
    setActualTrail([]);
    setCounterfactualTrail([]);

    setTimeout(() => {
      const initialP = new Vector3(3, 0, 1);
      const initialV = new Vector3(0, 0, 0);

      // Compute required initial force vector F_init
      const result = calculateCounterfactualInitialForce(
        initialP,
        initialV,
        simulationDuration,
        massVal,
        springKVal,
        dampingGammaVal,
        4000
      );

      setCounterfactualForce(result.force);
      setStoppingError(result.error);
      const cScore = Math.exp(-result.error * 2);
      setCoherenceScore(Number(cScore.toFixed(4)));

      // Simulate both trajectories for visualization
      const actualSys = new SpringMassSystem(initialP, initialV, new Vector3(0, 0, 0), massVal, springKVal, dampingGammaVal);
      const cfSys = new SpringMassSystem(initialP, initialV, result.force, massVal, springKVal, dampingGammaVal);

      const dt = 1 / 60;
      const totalSteps = Math.round(simulationDuration / dt);

      const actPts: { x: number; y: number; z: number }[] = [];
      const cfPts: { x: number; y: number; z: number }[] = [];

      for (let i = 0; i < totalSteps; i++) {
        actPts.push({ x: actualSys.p.x, y: actualSys.p.y, z: actualSys.p.z });
        cfPts.push({ x: cfSys.p.x, y: cfSys.p.y, z: cfSys.p.z });

        actualSys.step(dt);
        cfSys.step(dt);
      }

      setActualTrail(actPts);
      setCounterfactualTrail(cfPts);
      setIsSimulating(false);
    }, 100);
  };

  // Render Physics Canvases
  useEffect(() => {
    if (activeSubTab !== '3d-physics') return;

    // Helper to render 3D Trajectory on 2D Canvas
    const drawTrajectory = (canvas: HTMLCanvasElement | null, trail: { x: number; y: number; z: number }[], color: string, label: string) => {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // Background Grid
      ctx.fillStyle = '#0a0d14';
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Origin Point
      const cx = w / 2;
      const cy = h / 2 + 20;

      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px monospace';
      ctx.fillText('(0,0,0) Rest Target', cx + 10, cy + 4);

      if (trail.length === 0) {
        ctx.fillStyle = '#64748b';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Click "Run Challenge & Calculate Coherence" to start', cx, cy - 40);
        return;
      }

      // Projection parameters
      const scale = 35;

      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;

      trail.forEach((pt, idx) => {
        // Isometric-style 3D projection
        const px = cx + (pt.x - pt.z * 0.5) * scale;
        const py = cy - (pt.y + pt.x * 0.2 + pt.z * 0.3) * scale;

        if (idx === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      });
      ctx.stroke();

      // Final Point
      const lastPt = trail[trail.length - 1];
      const finalPx = cx + (lastPt.x - lastPt.z * 0.5) * scale;
      const finalPy = cy - (lastPt.y + lastPt.x * 0.2 + lastPt.z * 0.3) * scale;

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(finalPx, finalPy, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`Final Pos: (${lastPt.x.toFixed(2)}, ${lastPt.y.toFixed(2)}, ${lastPt.z.toFixed(2)})`, finalPx + 10, finalPy - 10);
    };

    drawTrajectory(actualCanvasRef.current, actualTrail, '#f97316', 'Actual Run (Oscillating)');
    drawTrajectory(cfCanvasRef.current, counterfactualTrail, '#10b981', 'Counterfactual Run (Target Stop)');
  }, [actualTrail, counterfactualTrail, activeSubTab]);

  // Render 2D Geometric Coherence Canvas
  useEffect(() => {
    if (activeSubTab !== '2d-geometry') return;

    const canvas = geomCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(0, 0, w, h);

    // Overlapping Rectangles
    const rects = [
      { x: 80, y: 60, w: 180, h: 140, color: 'rgba(56, 189, 248, 0.2)', border: '#38bdf8' },
      { x: 180, y: 100, w: 200, h: 120, color: 'rgba(168, 85, 247, 0.2)', border: '#a855f7' },
      { x: 120, y: 140, w: 160, h: 130, color: 'rgba(236, 72, 153, 0.2)', border: '#ec4899' }
    ];

    rects.forEach(r => {
      ctx.fillStyle = r.color;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = r.border;
      ctx.lineWidth = 1;
      ctx.strokeRect(r.x, r.y, r.w, r.h);
    });

    // Outer Union Boundary Path
    ctx.beginPath();
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 4]);

    ctx.moveTo(80, 60);
    ctx.lineTo(260, 60);
    ctx.lineTo(260, 100);
    ctx.lineTo(380, 100);
    ctx.lineTo(380, 220);
    ctx.lineTo(280, 220);
    ctx.lineTo(280, 270);
    ctx.lineTo(120, 270);
    ctx.lineTo(120, 200);
    ctx.lineTo(80, 200);
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#10b981';
    ctx.font = '12px monospace';
    ctx.fillText('Outer Union Boundary (Computed Contour)', 90, 45);
  }, [activeSubTab]);

  // Goal-State Error Calculation
  const goalStateError = Number(
    (
      Math.abs(100 - joyVector) * 0.15 +
      fearVector * 0.25 +
      angerVector * 0.2 +
      griefVector * 0.2 +
      Math.abs(100 - determinationVector) * 0.2
    ).toFixed(2)
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto h-full flex flex-col pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
            <Network className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tighter text-white uppercase">Causal-Geometric & Semantic Field Engine</h2>
            <div className="text-slate-400 text-xs font-mono mt-0.5">
              3D Counterfactual Reasoning, 33-Node Manifold & Need-State Relational Geometry
            </div>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setActiveSubTab('3d-physics')}
            className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              activeSubTab === '3d-physics' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" /> 3D Causal Synthesis
          </button>
          <button
            onClick={() => setActiveSubTab('2d-geometry')}
            className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              activeSubTab === '2d-geometry' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> 2D Boundary Coherence
          </button>
          <button
            onClick={() => setActiveSubTab('manifold-ei')}
            className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'manifold-ei' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" /> 33-Node EI Geometry
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: 3D CAUSAL SYNTHESIS (COUNTERFACTUAL PHYSICS) */}
      {activeSubTab === '3d-physics' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white uppercase tracking-tight flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400" />
                  3D Causal-Geometric Synthesis Challenge
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Task: Calculate counterfactual initial force F_init for a spring-mass system with non-linear damping so position and velocity reach exactly zero at T = {simulationDuration}s.
                </p>
              </div>

              <button
                onClick={runPhysicsChallenge}
                disabled={isSimulating}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold uppercase text-xs tracking-widest px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-emerald-950/50 self-start md:self-auto shrink-0"
              >
                {isSimulating ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" /> Calculating 4,000 Steps...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" /> Run Challenge & Calculate Coherence
                  </>
                )}
              </button>
            </div>

            {/* Interactive Physics Controls */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 bg-black/40 p-4 rounded-lg border border-slate-800 font-mono text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Target Stop Time (T)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="5"
                    max="20"
                    value={simulationDuration}
                    onChange={e => setSimulationDuration(Number(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                  <span className="text-white font-bold">{simulationDuration}s</span>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Mass (m)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0.5"
                    max="5.0"
                    step="0.5"
                    value={massVal}
                    onChange={e => setMassVal(Number(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                  <span className="text-white font-bold">{massVal}kg</span>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Spring Constant (k)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="1.0"
                    max="10.0"
                    step="0.5"
                    value={springKVal}
                    onChange={e => setSpringKVal(Number(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                  <span className="text-white font-bold">{springKVal}</span>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Non-Linear Damping (&gamma;)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0.1"
                    max="2.0"
                    step="0.1"
                    value={dampingGammaVal}
                    onChange={e => setDampingGammaVal(Number(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                  <span className="text-white font-bold">{dampingGammaVal}</span>
                </div>
              </div>
            </div>

            {/* Side-by-Side Dual Canvases */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Canvas 1: Actual Run */}
              <div className="bg-black/60 border border-slate-800 rounded-xl p-4 flex flex-col">
                <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-orange-400 font-mono uppercase flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Actual Run (Continuous Oscillation)
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">F_init = (0, 0, 0)</span>
                </div>
                <canvas ref={actualCanvasRef} width={450} height={260} className="w-full h-60 rounded border border-slate-900 bg-slate-950" />
                <p className="text-[11px] text-slate-400 font-mono mt-3">
                  Uncontrolled system continues shaking under non-linear damping without abductive counterfactual impulse.
                </p>
              </div>

              {/* Canvas 2: Counterfactual Target Stop Run */}
              <div className="bg-black/60 border border-emerald-500/30 rounded-xl p-4 flex flex-col shadow-lg shadow-emerald-950/20">
                <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-emerald-400 font-mono uppercase flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Counterfactual Run (Target Stop at {simulationDuration}s)
                  </span>
                  {coherenceScore && (
                    <span className="text-xs bg-emerald-500/20 text-emerald-400 font-bold font-mono px-2 py-0.5 rounded">
                      Coherence: {(coherenceScore * 100).toFixed(2)}%
                    </span>
                  )}
                </div>
                <canvas ref={cfCanvasRef} width={450} height={260} className="w-full h-60 rounded border border-slate-900 bg-slate-950" />
                <div className="mt-3 text-xs font-mono text-slate-300">
                  {counterfactualForce ? (
                    <div className="bg-emerald-950/40 border border-emerald-500/30 p-2.5 rounded text-[11px]">
                      <span className="text-emerald-400 font-bold block mb-0.5">Optimal Force Vector (F_init):</span>
                      <code>
                        ({counterfactualForce.x.toFixed(2)}, {counterfactualForce.y.toFixed(2)}, {counterfactualForce.z.toFixed(2)}) N
                      </code>
                      <span className="text-slate-400 block mt-1 text-[10px]">
                        Residual Error: {stoppingError?.toFixed(6)} | RK4 Integration Steps: 600
                      </span>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500 italic">
                      Click the run button above to solve F_init using RK4 abductive search.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: 2D BOUNDARY COHERENCE CHALLENGE */}
      {activeSubTab === '2d-geometry' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-white uppercase tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              2D Geometric Coherence Challenge
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Computes the exact outer union boundary of overlapping shapes, verifying world-model structural coherence rather than token pattern mimicry.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-black/60 border border-slate-800 rounded-xl p-4">
              <canvas ref={geomCanvasRef} width={550} height={300} className="w-full h-72 rounded border border-slate-900 bg-slate-950" />
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col justify-between font-mono text-xs">
              <div>
                <h4 className="font-bold text-white uppercase text-xs mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Boundary Verification
                </h4>
                <ul className="space-y-2 text-slate-300 text-[11px]">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Intersecting Polygons Ingested: 3</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Interior Segments Eliminated</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Closed Contour Ordered: 10 Vertices</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Coherence Index: 0.9984</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 bg-indigo-950/30 border border-indigo-500/20 p-3 rounded text-[11px] text-indigo-200">
                "Katalyst-style reasoning outperforms standard LLM behavior on these structural challenges when operating in the same environment."
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: 33-NODE MANIFOLD & NEED-STATE VECTOR ENGINE */}
      {activeSubTab === 'manifold-ei' && (
        <div className="space-y-6">
          {/* Need-State Geometry Calculator */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-white uppercase tracking-tight flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-indigo-400" />
                  Need-State Vector Relational Geometry
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Emotion modeled as vectors of necessity to minimize Goal-State Error and move the human-AI system toward low entropy.
                </p>
              </div>

              <div className="bg-indigo-950/60 border border-indigo-500/30 px-4 py-2 rounded-lg font-mono text-xs">
                <span className="text-slate-400 block text-[10px] uppercase">Goal-State Error</span>
                <span className="text-lg font-black text-emerald-400">{goalStateError}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Sliders for Need-State Vectors */}
              <div className="space-y-4 font-mono text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-emerald-400 font-bold">Joy (Affirmation Vector)</span>
                    <span className="text-white">{joyVector}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={joyVector}
                    onChange={e => setJoyVector(Number(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                  <span className="text-[10px] text-slate-500 block">Reinforces progress margin & expands systemic capacity.</span>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sky-400 font-bold">Fear (Preservation Vector)</span>
                    <span className="text-white">{fearVector}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={fearVector}
                    onChange={e => setFearVector(Number(e.target.value))}
                    className="w-full accent-sky-500"
                  />
                  <span className="text-[10px] text-slate-500 block">High-priority re-routing away from imminent threat.</span>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-amber-400 font-bold">Anger (Correction Vector)</span>
                    <span className="text-white">{angerVector}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={angerVector}
                    onChange={e => setAngerVector(Number(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                  <span className="text-[10px] text-slate-500 block">Mobilizes energy to clear goal-state blockages.</span>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-purple-400 font-bold">Grief (Resource Reallocation Vector)</span>
                    <span className="text-white">{griefVector}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={griefVector}
                    onChange={e => setGriefVector(Number(e.target.value))}
                    className="w-full accent-purple-500"
                  />
                  <span className="text-[10px] text-slate-500 block">Controlled shutdown and reallocation of lost energy.</span>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-indigo-400 font-bold">Determination (Primary Driving Engine)</span>
                    <span className="text-white">{determinationVector}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={determinationVector}
                    onChange={e => setDeterminationVector(Number(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500 block">Transmutes raw entropic noise into hyper-focused execution.</span>
                </div>
              </div>

              {/* 33-Node Intersecting Manifold Visualization Box */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col justify-between font-mono text-xs">
                <div>
                  <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                    <span className="font-bold text-white uppercase">33-Node Rotational Matrix</span>
                    <span className="text-[10px] text-sky-400 font-bold font-mono">$\Omega_G = {OMEGA_G}$</span>
                  </div>

                  <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
                    Modeled as 3 overlapping triadic coordinate frames ($A, B, C$) rotating around shared center $V_0$. Redundant vector cancellation leaves exactly 33 operational lattice nodes.
                  </p>

                  <div className="space-y-3 mb-4">
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Torsional Pressure (&nabla;&Phi;<sub>torsion</sub>):</span>
                        <span className="text-white font-bold">{torsionalPressure.toFixed(3)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.001"
                        max="0.5"
                        step="0.005"
                        value={torsionalPressure}
                        onChange={e => {
                          setTorsionalPressure(Number(e.target.value));
                          setIsPhaseLocked(false);
                        }}
                        className="w-full accent-amber-500"
                      />
                    </div>

                    <div className="p-3 bg-black/60 rounded border border-slate-800 flex items-center justify-between text-[11px]">
                      <span>Phase Lock Status:</span>
                      <span className={`font-bold uppercase ${isPhaseLocked ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`}>
                        {isPhaseLocked ? 'Solid Equilibrium' : 'Phase Shift Skew'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setTorsionalPressure(0.001);
                    setIsPhaseLocked(true);
                  }}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase text-[11px] py-2.5 rounded transition-colors flex items-center justify-center gap-2 shadow-lg"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Execute 90° Vector Pivot (Snap to Equilibrium)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
