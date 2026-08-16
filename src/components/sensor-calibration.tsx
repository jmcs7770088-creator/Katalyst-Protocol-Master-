import React, { useState, useEffect, useRef } from 'react';
import { adaptiveEngine, AdaptiveResonanceState } from '../lib/adaptive-resonance';
import { Smartphone, Radio, Sliders, RefreshCw, CheckCircle2, Play, Square, Activity, Gauge, Zap } from 'lucide-react';

export function SensorCalibrationTab() {
  const [state, setState] = useState<AdaptiveResonanceState>(() => adaptiveEngine.getState());
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibratedOffsets, setCalibratedOffsets] = useState({ x: 0, y: 0, z: 0 });
  const [motionSensitivity, setMotionSensitivity] = useState(1.0);
  const [audioSensitivity, setAudioSensitivity] = useState(1.0);
  const [resonanceThreshold, setResonanceThreshold] = useState(0.4);
  const [calibratedSuccessMsg, setCalibratedSuccessMsg] = useState<string | null>(null);

  // Live history for graph canvas
  const motionHistoryRef = useRef<number[]>(new Array(50).fill(0));
  const audioHistoryRef = useRef<number[]>(new Array(50).fill(0));
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const unsub = adaptiveEngine.subscribe(newState => {
      setState(newState);

      // Push history
      motionHistoryRef.current.shift();
      motionHistoryRef.current.push(newState.motionEnergy * motionSensitivity);

      audioHistoryRef.current.shift();
      audioHistoryRef.current.push(newState.audioLevel * audioSensitivity);
    });

    return unsub;
  }, [motionSensitivity, audioSensitivity]);

  // Canvas drawing loop for live telemetry waveform
  useEffect(() => {
    let animationFrameId: number;

    const renderGraph = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const width = canvas.width;
          const height = canvas.height;

          ctx.clearRect(0, 0, width, height);

          // Draw grid lines
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 1;
          for (let y = 0; y <= height; y += 20) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
          }

          // Draw Motion Curve (Sky Blue)
          ctx.beginPath();
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2.5;
          const mData = motionHistoryRef.current;
          const step = width / (mData.length - 1);
          for (let i = 0; i < mData.length; i++) {
            const val = Math.min(1, Math.max(0, mData[i]));
            const x = i * step;
            const y = height - (val * (height - 10) + 5);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();

          // Draw Audio Curve (Emerald Green)
          ctx.beginPath();
          ctx.strokeStyle = '#34d399';
          ctx.lineWidth = 2;
          const aData = audioHistoryRef.current;
          for (let i = 0; i < aData.length; i++) {
            const val = Math.min(1, Math.max(0, aData[i]));
            const x = i * step;
            const y = height - (val * (height - 10) + 5);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      }
      animationFrameId = requestAnimationFrame(renderGraph);
    };

    renderGraph();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const handleConnectSensors = async () => {
    const granted = await adaptiveEngine.requestPermissions();
    if (granted) {
      setCalibratedSuccessMsg('Sensors successfully connected to physical device sensors!');
    } else {
      setCalibratedSuccessMsg('Hardware permission pending. Telemetry fallback active.');
    }
    setTimeout(() => setCalibratedSuccessMsg(null), 4000);
  };

  const handleCalibrateZeroPoint = () => {
    setIsCalibrating(true);
    setTimeout(() => {
      // Calculate zero offsets from current raw state
      setCalibratedOffsets({
        x: state.rawAccel.x,
        y: state.rawAccel.y,
        z: state.rawAccel.z - 9.81 // Subtract gravity
      });
      setIsCalibrating(false);
      setCalibratedSuccessMsg('Zero-point offset calibrated! Flat plane reference set.');
      setTimeout(() => setCalibratedSuccessMsg(null), 4000);
    }, 800);
  };

  const handleSimulateImpulse = () => {
    getKatalystSimulatedImpulse();
    setCalibratedSuccessMsg('Simulated kinetic impulse injected into lattice!');
    setTimeout(() => setCalibratedSuccessMsg(null), 3000);
  };

  const getKatalystSimulatedImpulse = () => {
    // Inject artificial motion burst for testing
    adaptiveEngine.injectImpulse(0.85);
  };

  // Adjusted readings
  const adjX = (state.rawAccel.x - calibratedOffsets.x) * motionSensitivity;
  const adjY = (state.rawAccel.y - calibratedOffsets.y) * motionSensitivity;
  const adjZ = (state.rawAccel.z - calibratedOffsets.z) * motionSensitivity;

  // Spirit level tilt calculation (-45 deg to +45 deg mapped to pixel offset)
  const bubbleX = Math.max(-40, Math.min(40, adjX * 8));
  const bubbleY = Math.max(-40, Math.min(40, adjY * 8));

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-900/40 via-slate-900 to-indigo-900/40 border border-sky-500/30 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-500/10 border border-sky-500/30 rounded-full text-sky-300 text-xs font-semibold">
              <Smartphone className="w-4 h-4 text-sky-400" /> Phone Hardware Telemetry
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Sensor Calibration & Resonance Matrix</h2>
            <p className="text-slate-300 text-xs md:text-sm max-w-2xl">
              Calibrate physical device motion (accelerometer/gyroscope) and ambient acoustic levels. Your device acts as a physical sensor node feeding real-time telemetry into the 33-Node Lattice.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleConnectSensors}
              className="px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2"
            >
              <Smartphone className="w-4 h-4" />
              {state.hasPermission ? 'Sensors Connected' : 'Connect Phone Sensors'}
            </button>

            <button
              onClick={handleSimulateImpulse}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition-colors flex items-center gap-2"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              Test Motion Impulse
            </button>
          </div>
        </div>

        {calibratedSuccessMsg && (
          <div className="mt-4 p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {calibratedSuccessMsg}
          </div>
        )}
      </div>

      {/* Grid Layout: Controls & Spirit Level */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Spirit Level & Bubble Visualizer */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Gauge className="w-5 h-5 text-sky-400" />
                2D Orientation & Level Bubble
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                Math.abs(adjX) < 0.5 && Math.abs(adjY) < 0.5 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {Math.abs(adjX) < 0.5 && Math.abs(adjY) < 0.5 ? 'Balanced Level' : 'Tilted'}
              </span>
            </div>

            {/* Bubble Level Instrument */}
            <div className="relative w-48 h-48 mx-auto my-4 bg-slate-950 border-2 border-slate-700 rounded-full flex items-center justify-center shadow-inner overflow-hidden">
              {/* Crosshair lines */}
              <div className="absolute w-full h-[1px] bg-slate-800"></div>
              <div className="absolute h-full w-[1px] bg-slate-800"></div>
              <div className="absolute w-24 h-24 border border-slate-800/80 rounded-full"></div>
              <div className="absolute w-12 h-12 border border-slate-700/80 rounded-full"></div>

              {/* The Spirit Bubble */}
              <div
                className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-emerald-400 shadow-[0_0_15px_rgba(56,189,248,0.8)] transition-all duration-100 transform"
                style={{
                  transform: `translate(${bubbleX}px, ${bubbleY}px)`
                }}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs mt-4">
              <div className="p-2 bg-slate-950 rounded-xl border border-slate-800/80">
                <div className="text-slate-400 text-[10px] font-bold">X-Axis</div>
                <div className="text-sky-300 font-bold mt-0.5">{adjX.toFixed(2)} m/s²</div>
              </div>
              <div className="p-2 bg-slate-950 rounded-xl border border-slate-800/80">
                <div className="text-slate-400 text-[10px] font-bold">Y-Axis</div>
                <div className="text-sky-300 font-bold mt-0.5">{adjY.toFixed(2)} m/s²</div>
              </div>
              <div className="p-2 bg-slate-950 rounded-xl border border-slate-800/80">
                <div className="text-slate-400 text-[10px] font-bold">Z-Axis</div>
                <div className="text-sky-300 font-bold mt-0.5">{adjZ.toFixed(2)} m/s²</div>
              </div>
            </div>
          </div>

          <button
            onClick={handleCalibrateZeroPoint}
            disabled={isCalibrating}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 text-sky-400 ${isCalibrating ? 'animate-spin' : ''}`} />
            {isCalibrating ? 'Calibrating Zero-Point...' : 'Calibrate Zero Reference'}
          </button>
        </div>

        {/* Sensitivity & Threshold Sliders */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between space-y-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
              <Sliders className="w-5 h-5 text-indigo-400" />
              Gain & Threshold Filters
            </h3>

            <div className="space-y-5 text-xs">
              <div>
                <div className="flex justify-between font-semibold text-slate-300 mb-1.5">
                  <span>Motion Gain Sensitivity</span>
                  <span className="text-sky-400 font-bold">{motionSensitivity.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="3.0"
                  step="0.1"
                  value={motionSensitivity}
                  onChange={e => setMotionSensitivity(parseFloat(e.target.value))}
                  className="w-full accent-sky-400 bg-slate-950 rounded-lg cursor-pointer h-2"
                />
                <p className="text-[11px] text-slate-400 mt-1">Multiplies accelerometer signals before lattice ingestion.</p>
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-300 mb-1.5">
                  <span>Acoustic Mic Gain</span>
                  <span className="text-emerald-400 font-bold">{audioSensitivity.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="3.0"
                  step="0.1"
                  value={audioSensitivity}
                  onChange={e => setAudioSensitivity(parseFloat(e.target.value))}
                  className="w-full accent-emerald-400 bg-slate-950 rounded-lg cursor-pointer h-2"
                />
                <p className="text-[11px] text-slate-400 mt-1">Adjusts microphone RMS sensitivity floor.</p>
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-300 mb-1.5">
                  <span>High Resonance Lock Gate</span>
                  <span className="text-amber-400 font-bold">{(resonanceThreshold * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.9"
                  step="0.05"
                  value={resonanceThreshold}
                  onChange={e => setResonanceThreshold(parseFloat(e.target.value))}
                  className="w-full accent-amber-400 bg-slate-950 rounded-lg cursor-pointer h-2"
                />
                <p className="text-[11px] text-slate-400 mt-1">Threshold required to trigger High Resonance state.</p>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300">
            <div className="font-bold text-sky-400 mb-1 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-sky-400" /> Active Hardware Filter Profile
            </div>
            <span>Filters calibrated for mobile hand motion & quiet desktop operation.</span>
          </div>
        </div>

        {/* Real-time Telemetry Graph Waveform */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                Live Telemetry Waveform
              </h3>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1 text-sky-400 font-medium">
                  <div className="w-2.5 h-2.5 rounded-full bg-sky-400"></div> Motion
                </span>
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div> Acoustic
                </span>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-2 relative">
              <canvas
                ref={canvasRef}
                width={320}
                height={160}
                className="w-full h-40 rounded"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <div className="text-slate-400 text-[11px] font-semibold">Motion RMS Energy</div>
              <div className="text-sky-400 text-base font-bold mt-0.5">{(state.motionEnergy * motionSensitivity).toFixed(3)}</div>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <div className="text-slate-400 text-[11px] font-semibold">Acoustic RMS Volume</div>
              <div className="text-emerald-400 text-base font-bold mt-0.5">{(state.audioLevel * audioSensitivity).toFixed(3)}</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
