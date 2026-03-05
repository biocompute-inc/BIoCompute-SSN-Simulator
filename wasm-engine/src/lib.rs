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
    pub pore_diameter: f64,
    pub molecule_diameter: f64,
    pub membrane_thickness: f64,
    pub applied_voltage: f64,
    pub conductivity: f64,
    pub molecule_charge: f64,
    pub concentration: f64,
    pub dielectric_constant: f64,
    pub sampling_rate_hz: f64,
    pub bandwidth_hz: f64,
    pub noise_level: f64,
    pub adc_bits: f64,
    pub adc_range: f64,
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

// --- HELPER FUNCTIONS ---
fn generate_gaussian_noise(mean: f64, std_dev: f64) -> f64 {
    let u1 = js_sys::Math::random().max(1e-10); // Prevent log(0)
    let u2 = js_sys::Math::random();
    let z0 = (-2.0 * u1.ln()).sqrt() * (2.0 * PI * u2).cos();
    z0 * std_dev + mean
}

// --- MAIN SIMULATION ENGINE ---
#[wasm_bindgen]
pub fn run_wasm_simulation(val: JsValue) -> JsValue {
    let config: SimConfig = serde_wasm_bindgen::from_value(val).unwrap();

    let l_meters = config.membrane_thickness * 1e-9;
    let v_volts = config.applied_voltage * 1e-3;
    let d = config.pore_diameter * 1e-9;
    let rho = 1.0 / config.conductivity; 
    let viscosity = 0.001; 
    let e_charge = 1.602e-19;

    let conductance = match config.pore_geometry {
        PoreGeometry::Cylindrical => {
            let r_pore = (4.0 * rho * l_meters) / (PI * d.powi(2));
            let r_access = rho / d; 
            (r_pore + r_access).powi(-1)
        },
        PoreGeometry::Conical => {
            let d_tip = d;
            let d_base = d * 3.0; 
            let r_pore = (4.0 * rho * l_meters) / (PI * d_tip * d_base);
            let r_access = (rho / (2.0 * d_tip)) + (rho / (2.0 * d_base));
            (r_pore + r_access).powi(-1)
        },
        PoreGeometry::Hourglass => {
            let d_min = d;
            let d_max = d * 2.5;
            let r_half_pore = (4.0 * rho * (l_meters / 2.0)) / (PI * d_min * d_max);
            let r_access = rho / d_max; 
            (2.0 * r_half_pore + r_access).powi(-1)
        }
    };

    let baseline_i = conductance * v_volts * 1e9; 

    let r = (config.molecule_diameter / 2.0) * 1e-9;
    let q = config.molecule_charge.abs() * e_charge;
    let mut mobility_modifier = 1.0;
    let mut noise_multiplier = 1.0;

    match config.molecule_type {
        MoleculeType::DsDna => { mobility_modifier = 0.6; noise_multiplier = 1.2; },
        MoleculeType::Protein => { mobility_modifier = 0.3; noise_multiplier = 1.5; },
        _ => {}
    }

    let force_elec = q * (v_volts / l_meters);
    // --- THE FIX: Add Hydrodynamic Confinement Drag ---
    // Simulates the massive wall friction inside a nanoscale pore
    let confinement_drag = 100_000.0; 
    let velocity = force_elec / (6.0 * PI * viscosity * r * confinement_drag);
    
    let base_dwell_time = (l_meters / velocity) * 1000.0; // ms
    let effective_dwell_time = base_dwell_time * mobility_modifier;

    let cap_pf = (8.854e-12 * config.dielectric_constant * 100e-12) / l_meters * 1e12;
    let total_noise = (config.noise_level + (cap_pf * 0.05)) * noise_multiplier;
    
    let total_points = ((config.duration_ms / 1000.0) * config.sampling_rate_hz) as usize;
    let dt_ms = 1000.0 / config.sampling_rate_hz;
    
    let mut ideal_signal = vec![baseline_i; total_points];
    
    // 5. Stochastic Translocation Loop
    let capture_rate = (config.concentration * config.applied_voltage.abs()) / 10000.0;
    let mut current_time = 0.0;
    
    while current_time < config.duration_ms {
        let wait_time = - (1.0 - js_sys::Math::random()).ln() / (capture_rate + 1e-9);
        current_time += wait_time;

        if current_time < config.duration_ms {
            let start_idx = (current_time / dt_ms) as usize;
            
            let dwell_variance = generate_gaussian_noise(1.0, 0.15).max(0.1); 
            let depth_variance = generate_gaussian_noise(1.0, 0.05).clamp(0.5, 1.5);
            
            let actual_dwell_time = effective_dwell_time * dwell_variance;
            
            // --- THE FIX: Floor the index at 1 to prevent vanishing events ---
            let duration_idx = ((actual_dwell_time / dt_ms) as usize).max(1);
            
            let mut delta_g = conductance * (config.molecule_diameter.powi(2) / config.pore_diameter.powi(2));
            if config.molecule_type == MoleculeType::DsDna { delta_g *= 0.85; }

            let mut blockade_i = (conductance - (delta_g * depth_variance)) * v_volts * 1e9;
            if blockade_i < 0.0 { blockade_i = 0.0; }

            for j in 0..duration_idx {
                if start_idx + j < total_points {
                    ideal_signal[start_idx + j] = blockade_i;
                }
            }
        }
    }

    // --- HYSTERESIS & SIGNAL PROCESSING (Fixes Event Detection & SNR) ---
    let mut output_trace = Vec::new();
    let mut processed_signal = Vec::new();
    let mut detected_events = Vec::new();
    
    let alpha = (1.0 / config.sampling_rate_hz) / (1.0 / (2.0 * PI * config.bandwidth_hz) + (1.0 / config.sampling_rate_hz));
    let levels = 2.0_f64.powf(config.adc_bits);
    let step_size = config.adc_range / levels;
    
    // Dual Thresholds to prevent noise fragmentation
    let entry_threshold = baseline_i - (total_noise * 3.0); 
    let exit_threshold = baseline_i - (total_noise * 0.5);  

    let mut in_event = false;
    let mut event_start = 0.0;
    let mut event_min = baseline_i;

    processed_signal.push(ideal_signal[0]);
    for i in 0..total_points {
        let noise = generate_gaussian_noise(0.0, total_noise);
        let noisy = ideal_signal[i] + noise;
        
        let prev = if i == 0 { ideal_signal[0] } else { processed_signal[i-1] };
        let filtered = prev + alpha * (noisy - prev);
        processed_signal.push(filtered);

        let digitized = (filtered / step_size).round() * step_size;
        let t = i as f64 * dt_ms;

        output_trace.push(DataPoint { time: t, current: digitized, ideal_current: ideal_signal[i] });

        if !in_event && digitized < entry_threshold {
            in_event = true;
            event_start = t;
            event_min = digitized;
        } else if in_event {
            if digitized < event_min { event_min = digitized; }
            if digitized >= exit_threshold {
                in_event = false;
                let dwell = t - event_start;
                // Minimum width filter (rejects cosmic noise spikes)
                if dwell >= (dt_ms * 3.0) {
                    detected_events.push(EventResult {
                        start_time: event_start,
                        dwell_time_ms: dwell,
                        blockade_depth_na: baseline_i - event_min,
                    });
                }
            }
        }
    }

    // --- AC-COUPLED FFT (Fixes the Spectrum Plot) ---
    let mut planner = FftPlanner::new();
    let fft = planner.plan_fft_forward(total_points);
    
    let sum: f64 = processed_signal.iter().sum();
    let mean = sum / total_points as f64;
    
    let mut fft_buffer: Vec<Complex<f64>> = processed_signal.iter()
        .take(total_points)
        .enumerate()
        .map(|(i, &val)| {
            let ac_val = val - mean; // Remove DC offset
            let win = 0.5 * (1.0 - (2.0 * PI * i as f64 / (total_points as f64 - 1.0)).cos());
            Complex { re: ac_val * win, im: 0.0 }
        }).collect();
        
    fft.process(&mut fft_buffer);

    let mut psd = Vec::new();
    let df = config.sampling_rate_hz / total_points as f64;
    let window_correction = 8.0 / 3.0; 

    for i in 1..(total_points / 2) {
        if i % (1 + i / 20) == 0 { 
            let mag = fft_buffer[i].norm();
            let p = (mag * mag * window_correction) / (config.sampling_rate_hz * total_points as f64);
            psd.push(PsdPoint { 
                freq: i as f64 * df, 
                power_db: 10.0 * p.max(1e-15).log10() 
            });
        }
    }

    let final_output = SimOutput { trace: output_trace, events: detected_events, psd };
    serde_wasm_bindgen::to_value(&final_output).unwrap()
}