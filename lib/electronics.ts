// lib/electronics.ts

// 1. Generate White Noise (Box-Muller transform for Gaussian distribution)
function generateGaussianNoise(mean: number = 0, stdDev: number = 1): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return z0 * stdDev + mean;
}

// 2. Simple 1-pole IIR Low-Pass Filter (Simulating TIA Bandwidth)
// alpha = dt / (RC + dt), where RC = 1 / (2 * pi * fc)
export function applyLowPassFilter(
  rawData: number[], 
  samplingRateHz: number, 
  cutoffFrequencyHz: number
): number[] {
  const dt = 1 / samplingRateHz;
  const rc = 1 / (2 * Math.PI * cutoffFrequencyHz);
  const alpha = dt / (rc + dt);

  const filteredData = new Array(rawData.length);
  filteredData[0] = rawData[0]; // Initialize with first value

  for (let i = 1; i < rawData.length; i++) {
    filteredData[i] = filteredData[i - 1] + alpha * (rawData[i] - filteredData[i - 1]);
  }

  return filteredData;
}

// 3. ADC Simulation (Quantization / Resolution)
export function applyADCQuantization(
  data: number[], 
  bits: number, 
  voltageRange: number // full scale range in nA
): number[] {
  const levels = Math.pow(2, bits);
  const stepSize = voltageRange / levels;

  return data.map(value => {
    // Round to the nearest quantization step
    return Math.round(value / stepSize) * stepSize;
  });
}

// 4. Putting it together: Processing the Signal
export function processSignal(
  rawIdealSignal: number[],
  baseNoiseLevel: number,
  capacitance_pF: number, // NEW: Pass the capacitance in
  samplingRate: number,
  bandwidth: number,
  adcBits: number,
  adcRange: number
): number[] {
  
  // Dielectric noise scales linearly with capacitance in this simplified model.
  // We use a multiplier to map pF to a realistic nA noise amplitude.
  const capNoiseMultiplier = 0.05; 
  const totalNoiseLevel = baseNoiseLevel + (capacitance_pF * capNoiseMultiplier);

  // Step 1: Add noise to the raw signal (Capacitance dramatically increases this)
  const noisySignal = rawIdealSignal.map(val => val + generateGaussianNoise(0, totalNoiseLevel));
  
  // Step 2: Pass through TIA (Low Pass Filter)
  const filteredSignal = applyLowPassFilter(noisySignal, samplingRate, bandwidth);
  
  // Step 3: Digitize via ADC
  const digitalSignal = applyADCQuantization(filteredSignal, adcBits, adcRange);
  
  return digitalSignal;
}