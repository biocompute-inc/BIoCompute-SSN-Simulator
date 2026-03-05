use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use std::f64::consts::PI;
use rustfft::{FftPlanner, num_complex::Complex};

// --- CONFIGURATION STRUCTURES ---
#[derive(Deserialize, PartialEq)]
pub enum MoleculeType {
    Custom,
    #[serde(rename = "ssDNA")] SsDna,
    #[serde(rename = "dsDNA")] DsDna,
    Protein,
    Nanoparticle,
}

#[derive(Deserialize, PartialEq)]
pub enum PoreGeometry {
    Cylindrical,
    Conical,
    Hourglass,
}

#[derive(Deserialize)]
pub struct SimConfig {
    pub molecule_type: MoleculeType,
    pub pore_geometry: PoreGeometry,
    pub pore_diameter: f64,        // nm
    pub molecule_diameter: f64,    // nm
    pub membrane_thickness: f64,   // nm
    pub applied_voltage: f64,      // mV
    pub conductivity: f64,         // S/m
    pub molecule_charge: f64,      // elementary charges
    pub concentration: f64,        // nM (nanomolar)
    pub dielectric_constant: f64,
    pub membrane_area_um2: f64,    // FIX #7: was hardcoded 100e-12 m^2, now a real input (µm²)
    pub sampling_rate_hz: f64,
    pub bandwidth_hz: f64,
    pub noise_level: f64,          // nA baseline noise std dev
    pub adc_bits: f64,
    pub adc_range: f64,            // nA full-scale range
    pub duration_ms: f64,
}

#[derive(Serialize)]
pub struct DataPoint {
    pub time: f64,
    pub current: f64,
    pub ideal_current: f64,
}

#[derive(Serialize)]
pub struct EventResult {
    pub start_time: f64,
    pub dwell_time_ms: f64,
    pub blockade_depth_na: f64,
}

#[derive(Serialize)]
pub struct PsdPoint {
    pub freq: f64,
    pub power_db: f64,
}

#[derive(Serialize)]
pub struct SimOutput {
    pub trace: Vec<DataPoint>,
    pub events: Vec<EventResult>,
    pub psd: Vec<PsdPoint>,
}

// --- FIX #9: Pure-Rust LCG RNG to avoid WASM<->JS boundary crossing in hot loop ---
// A fast, seedable LCG (Lehmer generator). Not cryptographic, but fine for simulation noise.
struct FastRng {
    state: u64,
}

impl FastRng {
    fn new(seed: u64) -> Self {
        Self { state: seed.max(1) }
    }

    // Returns a uniform float in (0, 1)
    fn next_f64(&mut self) -> f64 {
        // Lehmer LCG with Knuth multiplier
        self.state = self.state.wrapping_mul(6364136223846793005).wrapping_add(1442695040888963407);
        // Use upper 53 bits for float precision
        (self.state >> 11) as f64 / (1u64 << 53) as f64
    }

    // Box-Muller Gaussian
    fn next_gaussian(&mut self, mean: f64, std_dev: f64) -> f64 {
        let u1 = self.next_f64().max(1e-10);
        let u2 = self.next_f64();
        let z0 = (-2.0 * u1.ln()).sqrt() * (2.0 * PI * u2).cos();
        z0 * std_dev + mean
    }
}

// --- FIX #5: Faxén hydrodynamic correction factor ---
// Accounts for wall drag as a function of molecule-to-pore size ratio.
// Returns the correction factor (0 < f ≤ 1) by which free mobility is reduced.
fn faxen_correction(lambda: f64) -> f64 {
    // Clamp lambda to [0, 0.99] — physically the molecule can't exceed pore size
    let l = lambda.clamp(0.0, 0.99);
    let correction = 1.0
        - 2.1044 * l
        + 2.0890 * l.powi(3)
        - 0.9481 * l.powi(5);
    correction.max(0.001) // floor to avoid division by zero at extreme confinement
}

// --- MAIN SIMULATION ENGINE ---
// FIX #10: Return Result<JsValue, JsValue> instead of unwrapping, so JS gets a real error message.
#[wasm_bindgen]
pub fn run_wasm_simulation(val: JsValue) -> Result<JsValue, JsValue> {
    let config: SimConfig = serde_wasm_bindgen::from_value(val)
        .map_err(|e| JsValue::from_str(&format!("Config parse error: {}", e)))?;

    // --- Unit conversions ---
    let l_meters = config.membrane_thickness * 1e-9;         // nm -> m
    let v_volts  = config.applied_voltage   * 1e-3;          // mV -> V
    let d        = config.pore_diameter     * 1e-9;          // nm -> m
    let rho      = 1.0 / config.conductivity;                 // S/m -> Ω·m
    let viscosity = 0.001_f64;                                // water: 1 mPa·s
    let e_charge  = 1.602e-19_f64;                           // C
    let k_boltzmann = 1.381e-23_f64;
    let temperature = 298.0_f64;                              // K (room temp)

    // --- FIX #2 & #3: Correct access resistance with factor of 2 throughout ---
    // Cylindrical:  R_pore = 4ρL/(πd²),  R_access = ρ/(2d)         [Hall 1975]
    // Conical:      R_pore = 4ρL/(π·d_tip·d_base), R_access = ρ/(2d_tip) [tip is bottleneck]
    // Hourglass:    Two half-cones in series, access only at outer mouths
    let conductance = match config.pore_geometry {
        PoreGeometry::Cylindrical => {
            let r_pore   = (4.0 * rho * l_meters) / (PI * d.powi(2));
            let r_access = rho / (2.0 * d);   // FIX: was rho/d, missing factor of 2
            (r_pore + r_access).recip()
        },
        PoreGeometry::Conical => {
            let d_tip  = d;
            let d_base = d * 3.0;
            let r_pore   = (4.0 * rho * l_meters) / (PI * d_tip * d_base);
            // FIX: was (ρ/2d_tip + ρ/2d_base). Only tip is the bottleneck access resistance.
            let r_access = rho / (2.0 * d_tip);
            (r_pore + r_access).recip()
        },
        PoreGeometry::Hourglass => {
            let d_min = d;
            let d_max = d * 2.5;
            // Two symmetric half-cones in series
            let r_half = (4.0 * rho * (l_meters / 2.0)) / (PI * d_min * d_max);
            let r_access = rho / (2.0 * d_max); // access at the wide mouth
            (2.0 * r_half + r_access).recip()
        }
    };

    let baseline_i = conductance * v_volts * 1e9; // convert A -> nA

    // --- Molecule physical parameters ---
    let r_mol = (config.molecule_diameter / 2.0) * 1e-9;     // molecule radius, m
    let q     = config.molecule_charge.abs() * e_charge;      // total charge, C

    let mut mobility_modifier = 1.0_f64;
    let mut noise_multiplier  = 1.0_f64;

    match config.molecule_type {
        MoleculeType::DsDna    => { mobility_modifier = 0.6; noise_multiplier = 1.2; },
        MoleculeType::Protein  => { mobility_modifier = 0.3; noise_multiplier = 1.5; },
        _ => {}
    }

    // --- FIX #5: Faxén-corrected velocity (replaces magic confinement_drag = 100_000) ---
    let lambda       = config.molecule_diameter / config.pore_diameter; // dimensionless ratio
    let faxen        = faxen_correction(lambda);
    let force_elec   = q * (v_volts / l_meters);               // N
    // Stokes drag with Faxén wall correction: F = 6πηr·v / faxen
    let velocity     = (force_elec * faxen) / (6.0 * PI * viscosity * r_mol); // m/s
    let base_dwell_time     = (l_meters / velocity.max(1e-15)) * 1000.0;      // ms, guard /0
    let effective_dwell_time = base_dwell_time * mobility_modifier;

    // --- FIX #7: Capacitance uses real membrane area input, correct units ---
    // C = ε₀·εᵣ·A / d.  Input area is µm², convert to m².
    let membrane_area_m2 = config.membrane_area_um2 * 1e-12;   // µm² -> m²
    let cap_f  = (8.854e-12 * config.dielectric_constant * membrane_area_m2) / l_meters;
    let cap_pf = cap_f * 1e12;                                  // F -> pF (no stray ×1e12)
    let total_noise = (config.noise_level + (cap_pf * 0.05)) * noise_multiplier;

    // --- Simulation grid ---
    let total_points = ((config.duration_ms / 1000.0) * config.sampling_rate_hz) as usize;
    let dt_ms = 1000.0 / config.sampling_rate_hz;

    // FIX #9: Seed the Rust RNG from JS once (single boundary crossing)
    let seed = (js_sys::Math::random() * u64::MAX as f64) as u64;
    let mut rng = FastRng::new(seed);

    let mut ideal_signal = vec![baseline_i; total_points];

    // --- FIX #4: Physically grounded capture rate ---
    // Uses electrophoretic drift to the pore mouth (Berg & Purcell capture model).
    // rate [events/ms] = 2π·D·c·(z·e·V)/(kT)  where D is diffusion coeff from Stokes-Einstein.
    // concentration input is nM → convert to molecules/m³: nM * 1e-9 mol/L * 6.022e23 /mol * 1000 L/m³
    let conc_per_m3 = config.concentration * 1e-9 * 6.022e23 * 1000.0;
    let diffusion   = (k_boltzmann * temperature) / (6.0 * PI * viscosity * r_mol); // Stokes-Einstein
    let reduced_voltage = (q * v_volts.abs()) / (k_boltzmann * temperature);        // dimensionless
    // Capture radius approximated as pore diameter
    let capture_rate_per_s = 2.0 * PI * diffusion * conc_per_m3 * d * reduced_voltage;
    let capture_rate = (capture_rate_per_s * 1e-3).max(1e-9); // events/ms, guard zero

    let mut current_time = 0.0_f64;

    while current_time < config.duration_ms {
        // Poisson inter-arrival: t ~ Exp(λ)
        let u = rng.next_f64().max(1e-15);
        let wait_time = -u.ln() / capture_rate;
        current_time += wait_time;

        if current_time >= config.duration_ms { break; }

        let start_idx = (current_time / dt_ms) as usize;

        let dwell_variance = rng.next_gaussian(1.0, 0.15).max(0.1);
        let depth_variance = rng.next_gaussian(1.0, 0.05).clamp(0.5, 1.5);

        let actual_dwell_time = effective_dwell_time * dwell_variance;
        let duration_idx = ((actual_dwell_time / dt_ms) as usize).max(1);

        // --- FIX #6: Blockade depth uses geometry-appropriate local diameter ---
        // For Cylindrical, local_d = pore_diameter everywhere.
        // For Conical, the sensing zone is near the tip → use tip diameter (= pore_diameter).
        // For Hourglass, the sensing zone is the waist → use minimum diameter (= pore_diameter input).
        // In all cases pore_diameter already represents the most resistive cross-section, so
        // the formula is now consistently correct. The conical case previously used the average
        // diameter; we now explicitly document why tip diameter is correct.
        let sensing_diameter_nm = match config.pore_geometry {
            PoreGeometry::Cylindrical => config.pore_diameter,
            PoreGeometry::Conical     => config.pore_diameter, // tip = bottleneck
            PoreGeometry::Hourglass   => config.pore_diameter, // waist = bottleneck
        };
        let excluded_fraction = (config.molecule_diameter / sensing_diameter_nm).powi(2);
        let mut delta_g = conductance * excluded_fraction;
        if config.molecule_type == MoleculeType::DsDna { delta_g *= 0.85; }

        let blockade_i = ((conductance - delta_g * depth_variance) * v_volts * 1e9).max(0.0);

        for j in 0..duration_idx {
            if start_idx + j < total_points {
                ideal_signal[start_idx + j] = blockade_i;
            }
        }

        current_time += actual_dwell_time;
    }

    // --- SIGNAL PROCESSING ---
    // FIX #1: processed_signal is built purely inside the loop (no pre-push).
    // It will have exactly total_points elements, matching ideal_signal 1:1.
    let mut output_trace     = Vec::with_capacity(total_points);
    let mut processed_signal = Vec::with_capacity(total_points);
    let mut detected_events  = Vec::new();

    let alpha = {
        let tau = 1.0 / (2.0 * PI * config.bandwidth_hz);
        let ts  = 1.0 / config.sampling_rate_hz;
        ts / (tau + ts)
    };

    let levels    = 2.0_f64.powf(config.adc_bits);
    let step_size = config.adc_range / levels;

    // Hysteresis thresholds (in nA)
    let entry_threshold = baseline_i - (total_noise * 1.2);
    let exit_threshold  = baseline_i - (total_noise * 0.2);

    let mut in_event   = false;
    let mut event_start = 0.0_f64;
    let mut event_min   = baseline_i;

    for i in 0..total_points {
        let noise  = rng.next_gaussian(0.0, total_noise);  // FIX #9: uses Rust RNG
        let noisy  = ideal_signal[i] + noise;

        // FIX #1: prev safely read from already-populated processed_signal
        let prev     = if i == 0 { ideal_signal[0] } else { processed_signal[i - 1] };
        let filtered = prev + alpha * (noisy - prev);
        processed_signal.push(filtered);   // now exactly total_points elements

        let digitized = (filtered / step_size).round() * step_size;
        let t = i as f64 * dt_ms;

        output_trace.push(DataPoint {
            time: t,
            current: digitized,
            ideal_current: ideal_signal[i],
        });

        if !in_event && digitized < entry_threshold {
            in_event    = true;
            event_start = t;
            event_min   = digitized;
        } else if in_event {
            if digitized < event_min { event_min = digitized; }
            if digitized >= exit_threshold {
                in_event = false;
                let dwell = t - event_start;
                if dwell >= dt_ms * 1.2 {
                    detected_events.push(EventResult {
                        start_time:       event_start,
                        dwell_time_ms:    dwell,
                        blockade_depth_na: baseline_i - event_min,
                    });
                }
            }
        }
    }

    // --- AC-COUPLED FFT ---
    // FIX #1: processed_signal.len() == total_points now, so .take() is no longer needed
    // (kept for safety, harmless).
    let mut planner = FftPlanner::new();
    let fft = planner.plan_fft_forward(total_points);

    let mean = processed_signal.iter().sum::<f64>() / total_points as f64;

    let mut fft_buffer: Vec<Complex<f64>> = processed_signal
        .iter()
        .enumerate()
        .map(|(i, &val)| {
            let ac_val = val - mean;
            let win = 0.5 * (1.0 - (2.0 * PI * i as f64 / (total_points as f64 - 1.0)).cos());
            Complex { re: ac_val * win, im: 0.0 }
        })
        .collect();

    fft.process(&mut fft_buffer);

    // --- FIX #8: Log-spaced PSD bins (uniform density on log axis) ---
    // Replaces the irregular `i % (1 + i/20)` decimation with explicit log-spaced indices.
    let df              = config.sampling_rate_hz / total_points as f64;
    let window_correction = 8.0 / 3.0; // Hann window power correction
    let n_bins          = 512_usize;    // number of output PSD points
    let f_min           = df;
    let f_max           = config.sampling_rate_hz / 2.0;
    let log_step        = (f_max / f_min).ln() / (n_bins as f64 - 1.0);

    let mut psd = Vec::with_capacity(n_bins);
    let mut prev_bin = usize::MAX;

    for k in 0..n_bins {
        let freq = f_min * (k as f64 * log_step).exp();
        let bin  = (freq / df).round() as usize;
        let bin  = bin.clamp(1, total_points / 2 - 1);

        if bin == prev_bin { continue; } // deduplicate adjacent mapped bins
        prev_bin = bin;

        let mag = fft_buffer[bin].norm();
        let p   = (mag * mag * window_correction) / (config.sampling_rate_hz * total_points as f64);
        psd.push(PsdPoint {
            freq,
            power_db: 10.0 * p.max(1e-15).log10(),
        });
    }

    let final_output = SimOutput {
        trace:  output_trace,
        events: detected_events,
        psd,
    };

    // FIX #10: propagate serialization errors to JS instead of panicking
    serde_wasm_bindgen::to_value(&final_output)
        .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
}