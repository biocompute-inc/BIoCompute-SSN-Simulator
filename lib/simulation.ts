// lib/simulation.ts
import { calculateBaselineCurrent, calculateBlockedCurrent, calculateDwellTime, calculateCapacitance, NanoporeParams } from './physics';
import { processSignal } from './electronics';

export interface SimConfig {
  physics: NanoporeParams;
  concentration: number;    // NEW: Relative concentration of molecules
  durationMs: number;       
  samplingRateHz: number;   
  bandwidthHz: number;      
  noiseLevel: number;       
  adcBits: number;          
  adcRange: number;         
}

// Generate random arrival times using Poisson process / Exponential distribution
function generateEventWindows(durationMs: number, ratePerMs: number, dwellTimeMs: number) {
  let currentTime = 0;
  const events: { start: number, end: number }[] = [];
  
  while (currentTime < durationMs) {
    // Math.random() is Uniform(0,1). -ln(1-U)/rate gives Exponential distribution
    const u = Math.random();
    const interArrivalTime = -Math.log(1 - u) / ratePerMs;
    
    currentTime += interArrivalTime;
    
    if (currentTime < durationMs) {
      events.push({ start: currentTime, end: currentTime + dwellTimeMs });
    }
  }
  return events;
}

export function runSimulation(config: SimConfig) {
  const { durationMs, samplingRateHz, physics, concentration } = config;
  
  const baselineI = calculateBaselineCurrent(physics);
  const blockedI = calculateBlockedCurrent(physics, baselineI);
  const dwellTimeMs = calculateDwellTime(physics);
  const membraneCapacitance_pF = calculateCapacitance(physics.membraneThickness);

  // Calculate Capture Rate (events per millisecond)
  // Rate scales with concentration and applied voltage. (Divided by arbitrary constant for UX scaling)
  const captureRatePerMs = (concentration * Math.abs(physics.appliedVoltage)) / 10000;
  
  // Generate all molecule events for this time window
  const events = generateEventWindows(durationMs, captureRatePerMs, dwellTimeMs);

  const totalPoints = Math.floor((durationMs / 1000) * samplingRateHz);
  const dtMs = 1000 / samplingRateHz; 

  const timeArray: number[] = [];
  const idealSignal: number[] = [];

  let currentEventIndex = 0;

  for (let i = 0; i < totalPoints; i++) {
    const t = i * dtMs;
    timeArray.push(t);

    // Fast-forward through events we've already passed
    while (currentEventIndex < events.length && t > events[currentEventIndex].end) {
      currentEventIndex++;
    }

    // Check if we are currently inside an event window
    if (currentEventIndex < events.length && t >= events[currentEventIndex].start && t <= events[currentEventIndex].end) {
      idealSignal.push(blockedI);
    } else {
      idealSignal.push(baselineI);
    }
  }

  const processedSignal = processSignal(
    idealSignal,
    config.noiseLevel,
    membraneCapacitance_pF,
    config.samplingRateHz,
    config.bandwidthHz,
    config.adcBits,
    config.adcRange
  );

  return timeArray.map((t, index) => ({
    time: Number(t.toFixed(4)), 
    current: processedSignal[index],
    idealCurrent: idealSignal[index] 
  }));
}