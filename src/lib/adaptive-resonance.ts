// ============================================================================
// KATALYST ADAPTIVE RESONANCE & PHONE SENSOR ENGINE
// Dynamically adjusts GSRT temperature and detects high-resonance phase lock
// based on real-time device motion, microphone acoustics, and interaction complexity.
// ============================================================================

export interface AdaptiveResonanceState {
  enabled: boolean;
  motionEnergy: number;      // 0.0 - 1.0 (Accelerometer / Gyroscope)
  audioLevel: number;        // 0.0 - 1.0 (Microphone Audio RMS)
  interactionComplexity: number; // 0.0 - 1.0 (Typing / Touch Jitter)
  resonanceScore: number;    // 0 - 100%
  temperature: number;       // 0.70 - 0.95 (GSRT Dynamic Temperature)
  isHighResonance: boolean;  // true if resonance >= 75%
  sensorActive: boolean;     // true if physical motion or audio permission granted
  sensorSource: 'phone-sensors' | 'mic-and-motion' | 'synthetic-field' | 'offline';
  rawAccel: { x: number; y: number; z: number };
}

type Listener = (state: AdaptiveResonanceState) => void;

class AdaptiveResonanceEngine {
  private enabled: boolean = false;
  private listeners: Set<Listener> = new Set();
  
  private motionEnergy: number = 0.0;
  private audioLevel: number = 0.0;
  private interactionComplexity: number = 0.2;
  
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private animFrameId: number | null = null;
  
  private sensorActive: boolean = false;
  private sensorSource: 'phone-sensors' | 'mic-and-motion' | 'synthetic-field' | 'offline' = 'offline';

  // Last motion sample for variance calculation
  private lastAcc = { x: 0, y: 0, z: 0 };
  private syntheticPhase: number = 0;

  constructor() {
    // Load persisted enabled state
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('katalyst_adaptive_resonance');
      this.enabled = saved === 'true';
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
    if (typeof window !== 'undefined') {
      localStorage.setItem('katalyst_adaptive_resonance', String(val));
    }

    if (this.enabled) {
      this.startSensors();
    } else {
      this.stopSensors();
    }

    this.notify();
  }

  public getState(): AdaptiveResonanceState {
    // Calculate total resonance score (0 - 100)
    // Base weight + Motion (35%) + Audio (35%) + Interaction (30%)
    const rawScore = (
      this.interactionComplexity * 30 +
      this.motionEnergy * 35 +
      this.audioLevel * 35
    );

    const resonanceScore = Math.min(100, Math.max(0, Math.round(rawScore)));
    
    // Dynamic GSRT Temperature calculation:
    // Base: 0.70 (calm equilibrium) -> Up to 0.95 (high complexity / high resonance)
    const temperature = Number((0.70 + (resonanceScore / 100) * 0.25).toFixed(3));
    const isHighResonance = resonanceScore >= 70;

    return {
      enabled: this.enabled,
      motionEnergy: Number(this.motionEnergy.toFixed(3)),
      audioLevel: Number(this.audioLevel.toFixed(3)),
      interactionComplexity: Number(this.interactionComplexity.toFixed(3)),
      resonanceScore,
      temperature,
      isHighResonance,
      sensorActive: this.sensorActive,
      sensorSource: this.sensorSource,
      rawAccel: {
        x: Number(this.lastAcc.x.toFixed(3)),
        y: Number(this.lastAcc.y.toFixed(3)),
        z: Number(this.lastAcc.z.toFixed(3))
      }
    };
  }

  public injectImpulse(amount: number = 0.8) {
    this.motionEnergy = Math.min(1.0, this.motionEnergy + amount);
    this.audioLevel = Math.min(1.0, this.audioLevel + amount * 0.7);
    this.lastAcc = {
      x: (Math.random() - 0.5) * 12.0,
      y: (Math.random() - 0.5) * 12.0,
      z: 9.81 + (Math.random() - 0.5) * 6.0
    };
    this.notify();
  }

  public processInteraction(textLength: number, delayMs: number = 0) {
    // Increase complexity based on input length and rapidity
    const lenFactor = Math.min(1.0, textLength / 300);
    const speedFactor = delayMs > 0 && delayMs < 1000 ? 0.8 : 0.4;
    
    this.interactionComplexity = Math.min(1.0, lenFactor * 0.6 + speedFactor * 0.4);
    
    // Decay back to baseline after 4 seconds
    setTimeout(() => {
      this.interactionComplexity = Math.max(0.15, this.interactionComplexity * 0.6);
      this.notify();
    }, 4000);

    this.notify();
  }

  public async requestPermissions(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    let grantedMotion = false;
    let grantedAudio = false;

    // 1. Request Motion / Accelerometer Permission (iOS 13+ requirement)
    try {
      if (typeof (DeviceMotionEvent as any)?.requestPermission === 'function') {
        const res = await (DeviceMotionEvent as any).requestPermission();
        grantedMotion = res === 'granted';
      } else if ('DeviceMotionEvent' in window) {
        grantedMotion = true;
      }
    } catch (e) {
      console.warn('[AdaptiveResonance] DeviceMotion permission error:', e);
    }

    // 2. Request Microphone Access
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        this.setupAudioAnalyser(this.micStream);
        grantedAudio = true;
      }
    } catch (e) {
      console.warn('[AdaptiveResonance] Audio permission error:', e);
    }

    this.sensorActive = grantedMotion || grantedAudio;
    if (grantedMotion && grantedAudio) {
      this.sensorSource = 'mic-and-motion';
    } else if (grantedMotion) {
      this.sensorSource = 'phone-sensors';
    } else {
      this.sensorSource = 'synthetic-field';
    }

    this.notify();
    return this.sensorActive;
  }

  private startSensors() {
    if (typeof window === 'undefined') return;

    // Attach motion listener
    window.addEventListener('devicemotion', this.handleMotion);
    window.addEventListener('deviceorientation', this.handleOrientation);
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('touchmove', this.handleTouchMove);

    // Auto attempt to start mic if already granted or synthetic loop
    this.startLoop();
  }

  private stopSensors() {
    if (typeof window === 'undefined') return;

    window.removeEventListener('devicemotion', this.handleMotion);
    window.removeEventListener('deviceorientation', this.handleOrientation);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('touchmove', this.handleTouchMove);

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.micStream) {
      this.micStream.getTracks().forEach(track => track.stop());
      this.micStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.sensorActive = false;
    this.sensorSource = 'offline';
  }

  private handleMotion = (e: DeviceMotionEvent) => {
    const acc = e.accelerationIncludingGravity || e.acceleration;
    if (!acc) return;

    const x = acc.x || 0;
    const y = acc.y || 0;
    const z = acc.z || 0;

    // Delta variance
    const dx = Math.abs(x - this.lastAcc.x);
    const dy = Math.abs(y - this.lastAcc.y);
    const dz = Math.abs(z - this.lastAcc.z);

    this.lastAcc = { x, y, z };

    const totalDelta = (dx + dy + dz) / 15.0; // scale
    this.motionEnergy = Math.min(1.0, Math.max(0.05, totalDelta));
    this.sensorActive = true;
    this.sensorSource = 'phone-sensors';
  };

  private handleOrientation = (e: DeviceOrientationEvent) => {
    const beta = Math.abs(e.beta || 0) / 90.0;
    const gamma = Math.abs(e.gamma || 0) / 90.0;
    const tilt = (beta + gamma) / 2.0;

    this.motionEnergy = Math.min(1.0, Math.max(this.motionEnergy, tilt * 0.7));
  };

  private handleMouseMove = (e: MouseEvent) => {
    // Desktop mouse velocity sensor
    const speed = Math.sqrt(e.movementX * e.movementX + e.movementY * e.movementY);
    if (speed > 1) {
      const energy = Math.min(0.8, speed / 50);
      this.motionEnergy = Math.max(this.motionEnergy, energy);
      if (!this.sensorActive) {
        this.sensorSource = 'synthetic-field';
      }
    }
  };

  private handleTouchMove = (e: TouchEvent) => {
    if (e.touches.length > 0) {
      this.motionEnergy = Math.min(1.0, this.motionEnergy + 0.15);
    }
  };

  private setupAudioAnalyser(stream: MediaStream) {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);
    } catch (e) {
      console.warn('[AdaptiveResonance] Audio analyser setup failed:', e);
    }
  }

  private startLoop = () => {
    const loop = () => {
      if (!this.enabled) return;

      // Read audio level if mic analyser active
      if (this.analyser) {
        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        this.audioLevel = Math.min(1.0, avg / 128.0);
      } else {
        // Subtle ambient thermal noise oscillation
        this.syntheticPhase += 0.05;
        const synthNoise = (Math.sin(this.syntheticPhase) * 0.15 + 0.2);
        this.audioLevel = Math.min(1.0, Math.max(0.05, synthNoise));
      }

      // Smooth decay on motion energy when resting
      this.motionEnergy = Math.max(0.05, this.motionEnergy * 0.94);

      this.notify();
      this.animFrameId = requestAnimationFrame(loop);
    };

    loop();
  };

  public subscribe(listener: Listener) {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach(listener => listener(state));
  }
}

export const adaptiveEngine = new AdaptiveResonanceEngine();
