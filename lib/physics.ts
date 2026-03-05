// lib/physics.ts

export interface NanoporeParams {
  poreDiameter: number; // in nanometers (nm)
  membraneThickness: number; // in nanometers (nm)
  moleculeDiameter: number; // in nanometers (nm)
  appliedVoltage: number; // in millivolts (mV)
  conductivity: number; // in Siemens per meter (S/m), depends on molarity/pH
  moleculeCharge: number; // Effective charge in elementary units (e)
}

export function calculateDwellTime(params: NanoporeParams): number {
  // Constants
  const e_charge = 1.602e-19; // Elementary charge in Coulombs
  const viscosity = 8.9e-4; // Viscosity of water at room temp (Pa·s)
  const retardationFactor = 100000; // Simulates pore-wall friction/confinement

  // Convert to standard SI units (meters, Volts)
  const L = params.membraneThickness * 1e-9;
  const r = (params.moleculeDiameter / 2) * 1e-9;
  const V = Math.abs(params.appliedVoltage * 1e-3); // Use absolute voltage for speed
  const q = Math.abs(params.moleculeCharge * e_charge);

  // Prevent division by zero if voltage or charge is 0
  if (V === 0 || q === 0) return Infinity;

  // t_d = (6 * pi * n * r * L^2) / (q * V)
  const numerator = 6 * Math.PI * viscosity * r * Math.pow(L, 2);
  const denominator = q * V;
  
  const idealDwellTimeSeconds = numerator / denominator;
  
  // Apply retardation factor and convert to milliseconds
  const actualDwellTimeMs = (idealDwellTimeSeconds * retardationFactor) * 1000;
  
  return actualDwellTimeMs;
}

export function calculateBaselineCurrent(params: NanoporeParams): number {
  // Convert nm to meters for standard SI calculations
  const d = params.poreDiameter * 1e-9;
  const L = params.membraneThickness * 1e-9;
  const V = params.appliedVoltage * 1e-3; // mV to Volts

  // G0 = sigma * (4L / (pi * d^2) + 1/d)^-1
  const resistancePore = (4 * L) / (Math.PI * Math.pow(d, 2));
  const accessResistance = 1 / d;
  
  const conductance = params.conductivity * Math.pow(resistancePore + accessResistance, -1);
  
  // I = G * V (Result in Amperes, convert to nanoAmps for display)
  const currentAmps = conductance * V;
  return currentAmps * 1e9; // Return in nA
}

export function calculateBlockedCurrent(params: NanoporeParams, baselineCurrent: number): number {
  const d = params.poreDiameter;
  const dm = params.moleculeDiameter;

  if (dm >= d) {
    return 0; // Molecule is too big, complete blockage (or it bounces off)
  }

  // Delta G roughly proportional to volume excluded: (dm^2 / d^2)
  const blockadeFraction = Math.pow(dm, 2) / Math.pow(d, 2);
  const blockedCurrent = baselineCurrent * (1 - blockadeFraction);
  
  return blockedCurrent; // in nA
}

export function calculateCapacitance(membraneThickness: number, dielectricConstant: number): number {
  // Constants for Silicon Nitride (SiN)
  const e0 = 8.854e-12; // Vacuum permittivity in F/m
  const er = dielectricConstant;      // Relative permittivity of SiN
  
  // Assume a fixed suspended membrane window size of 10 µm x 10 µm
  const areaMeters = 100e-12; // 100 square micrometers to square meters
  const L = membraneThickness * 1e-9; // Thickness in meters

  // C = (e0 * er * A) / L
  const capacitanceFarads = (e0 * er * areaMeters) / L;
  
  // Convert to picoFarads (pF) for easier reading
  return capacitanceFarads * 1e12; 
}