/* eslint-disable @typescript-eslint/no-explicit-any */
// app/page.tsx
"use client";

import { useState, useMemo, useEffect, useDeferredValue } from 'react';
import init, { run_wasm_simulation } from 'wasm-engine';
import { calculateDwellTime, calculateCapacitance } from '@/lib/physics';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, ScatterChart, Scatter, ReferenceArea } from 'recharts';
import NanoporeAnimation from '@/components/NanoporeAnimation';

export default function SimulatorDash() {
  const [isWasmReady, setIsWasmReady] = useState(false);

  // --- State for Physics Parameters ---
  const [poreGeometry, setPoreGeometry] = useState('Cylindrical'); // Added back for Rust engine
  const [poreDiameter, setPoreDiameter] = useState(10); 
  const [moleculeDiameter, setMoleculeDiameter] = useState(5); 
  const [membraneThickness, setMembraneThickness] = useState(20); 
  const [appliedVoltage, setAppliedVoltage] = useState(200); 
  const [conductivity, setConductivity] = useState(10); 
  const [moleculeCharge, setMoleculeCharge] = useState(15);
  const [concentration, setConcentration] = useState(50); 
  
  const [moleculePreset, setMoleculePreset] = useState('Custom');
  const [materialPreset, setMaterialPreset] = useState('SiN');
  const [dielectricConstant, setDielectricConstant] = useState(7.5);

  // --- State for Electronics & Simulation Parameters ---
  const [samplingRate, setSamplingRate] = useState(100000); 
  const [bandwidth, setBandwidth] = useState(10000); 
  const [noiseLevel, setNoiseLevel] = useState(0.5); 
  const [adcBits, setAdcBits] = useState(12); 

  // Handle Molecule Presets
  const handleMoleculeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const preset = e.target.value;
    setMoleculePreset(preset);
    if (preset === 'ssDNA') { setMoleculeDiameter(1.0); setMoleculeCharge(30); } 
    else if (preset === 'dsDNA') { setMoleculeDiameter(2.2); setMoleculeCharge(60); } 
    else if (preset === 'BSA_Protein') { setMoleculeDiameter(6.0); setMoleculeCharge(15); } 
    else if (preset === 'Gold_Nano') { setMoleculeDiameter(15.0); setMoleculeCharge(100); }
  };

  // Handle Material Presets
  const handleMaterialChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const preset = e.target.value;
    setMaterialPreset(preset);
    if (preset === 'SiN') setDielectricConstant(7.5); 
    else if (preset === 'MoS2') setDielectricConstant(4.0); 
    else if (preset === 'Graphene') setDielectricConstant(2.5); 
  };

  // Initialize WebAssembly Engine
  useEffect(() => {
    init().then(() => {
      console.log("🚀 WebAssembly Engine Loaded!");
      setIsWasmReady(true);
    });
  }, []);

  // Pre-calculate physics metrics
  const currentDwellTime = useMemo(() => {
    return calculateDwellTime({ poreDiameter, moleculeDiameter, membraneThickness, appliedVoltage, conductivity, moleculeCharge });
  }, [poreDiameter, moleculeDiameter, membraneThickness, appliedVoltage, conductivity, moleculeCharge]);

  const currentCapacitance = useMemo(() => {
    return calculateCapacitance(membraneThickness, dielectricConstant);
  }, [membraneThickness, dielectricConstant]);

  // Bundle sliders for deferred update
  const currentParams = useMemo(() => ({
    poreGeometry, poreDiameter, moleculeDiameter, membraneThickness, appliedVoltage,
    conductivity, moleculeCharge, concentration, samplingRate, bandwidth,
    noiseLevel, adcBits, dielectricConstant, moleculePreset
  }), [poreGeometry, poreDiameter, moleculeDiameter, membraneThickness, appliedVoltage, conductivity, moleculeCharge, concentration, samplingRate, bandwidth, noiseLevel, adcBits, dielectricConstant, moleculePreset]);

  const deferredParams = useDeferredValue(currentParams);

  // Run WASM Math - DESTRUCTURING EVENT AND PSD DATA
  const { chartData, histogramData, eventData, psdData } = useMemo(() => {
    if (!isWasmReady) return { chartData: [], histogramData: [], eventData: [], psdData: [] };

    // Capture the entire result object from Rust
    const wasmResult = run_wasm_simulation({
      pore_geometry: deferredParams.poreGeometry,
      molecule_type: deferredParams.moleculePreset === 'BSA_Protein' ? 'Protein' : 
                     deferredParams.moleculePreset === 'Gold_Nano' ? 'Nanoparticle' : 
                     deferredParams.moleculePreset,
      pore_diameter: deferredParams.poreDiameter,
      molecule_diameter: deferredParams.moleculeDiameter,
      membrane_thickness: deferredParams.membraneThickness,
      applied_voltage: deferredParams.appliedVoltage,
      conductivity: deferredParams.conductivity,
      molecule_charge: deferredParams.moleculeCharge,
      concentration: deferredParams.concentration,
      duration_ms: 50,
      sampling_rate_hz: deferredParams.samplingRate,
      bandwidth_hz: deferredParams.bandwidth,
      noise_level: deferredParams.noiseLevel,
      adc_bits: deferredParams.adcBits,
      adc_range: 50, 
      dielectric_constant: deferredParams.dielectricConstant
    });

    if (!wasmResult || !wasmResult.trace || wasmResult.trace.length === 0) {
      return { chartData: [], histogramData: [], eventData: [], psdData: [] };
    }

    // Extract trace, events, and PSD from the Rust output
    const rawWasmData = wasmResult.trace;
    const detectedEvents = wasmResult.events;
    const computedPsd = wasmResult.psd;

    // --- Histogram Math ---
    const numBins = 60;
    let minCurrent = Infinity;
    let maxCurrent = -Infinity;

    for (const d of rawWasmData) {
      if (d.current < minCurrent) minCurrent = d.current;
      if (d.current > maxCurrent) maxCurrent = d.current;
    }

    const binWidth = (maxCurrent - minCurrent + 0.1) / numBins;
    const counts = new Array(numBins).fill(0);

    for (const d of rawWasmData) {
      const binIndex = Math.floor((d.current - minCurrent) / binWidth);
      if (binIndex >= 0 && binIndex < numBins) counts[binIndex]++;
    }

    const calculatedHistogram = counts.map((count, i) => {
      const binMidpoint = minCurrent + (i + 0.5) * binWidth;
      return { bin: binMidpoint.toFixed(2), count: count };
    });

    // --- Downsample Trace Math ---
    const maxVisualPoints = 500;
    const step = Math.max(1, Math.floor(rawWasmData.length / maxVisualPoints));
    const downsampledChartData = rawWasmData
      .filter((_, index) => index % step === 0)
      .map(d => ({
        time: d.time,
        current: d.current,
        idealCurrent: d.ideal_current
      }));

    return { 
      chartData: downsampledChartData, 
      histogramData: calculatedHistogram, 
      eventData: detectedEvents,
      psdData: computedPsd
    };
  }, [isWasmReady, deferredParams]);

  // --- Real-Time SNR Calculation (Fixed Logic) ---
  const currentSNR = useMemo(() => {
    if (!chartData || chartData.length === 0) return 0;
    
    // 1. Find the true baseline
    let baseline = -Infinity;
    for (const d of chartData) {
      if (d.idealCurrent > baseline) baseline = d.idealCurrent;
    }

    // 2. Calculate RMS noise ONLY from pure baseline samples
    const noiseSamples = chartData.filter(d => d.idealCurrent === baseline);
    let sigma = noiseLevel; 
    
    if (noiseSamples.length > 10) {
      const mean = noiseSamples.reduce((a, b) => a + b.current, 0) / noiseSamples.length;
      const variance = noiseSamples.reduce((a, b) => a + Math.pow(b.current - mean, 2), 0) / noiseSamples.length;
      sigma = Math.sqrt(variance);
    }

    // 3. Find Signal Depth
    let signalDepth = 0;
    if (eventData && eventData.length > 0) {
      signalDepth = eventData.reduce((sum, e) => sum + e.blockade_depth_na, 0) / eventData.length;
    } else {
      let minIdeal = baseline;
      for (const d of chartData) {
        if (d.idealCurrent < minIdeal) minIdeal = d.idealCurrent;
      }
      signalDepth = Math.abs(baseline - minIdeal);
    }

    return sigma > 0.001 && signalDepth > 0 ? signalDepth / sigma : 0;
  }, [chartData, eventData, noiseLevel]);

  // --- Export Data to CSV ---
  const exportToCSV = () => {
    if (!chartData || chartData.length === 0) {
      alert("No data to export!"); return;
    }
    const headers = ['Time (ms)', 'Measured Current (nA)', 'Ideal Blockade Current (nA)'];
    const csvRows = [headers.join(',')];
    for (const row of chartData) {
      csvRows.push(`${row.time},${row.current},${row.idealCurrent}`);
    }
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nanopore_sim_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (!isWasmReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-xl font-bold text-blue-600">
        Loading The Simulation Engine...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-8 flex flex-col md:flex-row gap-8">
      
      {/* LEFT SIDEBAR */}
      <div className="w-full md:w-1/3 bg-white p-6 rounded-xl shadow-md space-y-6 overflow-y-auto max-h-[95vh] custom-scrollbar">
        <h1 className="text-2xl font-bold border-b pb-2">Nanopore Simulator</h1>
        
        {/* LIVE VISUALIZATION */}
        <div className="space-y-4">
          <h2 className="font-semibold text-lg text-purple-600">Live Visualization</h2>
          <NanoporeAnimation 
            poreDiameter={poreDiameter}
            moleculeDiameter={moleculeDiameter}
            membraneThickness={membraneThickness}
            dwellTimeMs={currentDwellTime}
            eventRate={concentration} 
            poreGeometry={poreGeometry}
          />
          <div className={`p-4 rounded-lg border ${currentSNR > 3 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
            <label className="flex justify-between text-sm font-bold text-gray-800">
              <span>Signal-to-Noise Ratio (SNR):</span> 
              <span className={currentSNR > 3 ? 'text-green-600' : 'text-yellow-600'}>
                {currentSNR === Infinity ? '∞' : currentSNR.toFixed(2)}
              </span>
            </label>
            <p className="text-xs text-gray-600 mt-1">
              {currentSNR > 3 ? '✅ Good signal detection.' : '⚠️ Warning: Events may be lost in the noise!'}
            </p>
          </div>
        </div>

        {/* PHYSICS CONTROLS */}
        <div className="space-y-4 pt-4 border-t">
          <h2 className="font-semibold text-lg text-blue-600">Physics Parameters</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Membrane Material</label>
              <select value={materialPreset} onChange={handleMaterialChange} className="w-full p-2 border rounded bg-gray-50 text-sm">
                <option value="SiN">SiN (Standard)</option>
                <option value="MoS2">MoS₂ (Thin)</option>
                <option value="Graphene">Graphene</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Pore Geometry</label>
              <select value={poreGeometry} onChange={(e) => setPoreGeometry(e.target.value)} className="w-full p-2 border rounded bg-gray-50 text-sm">
                <option value="Cylindrical">Cylindrical</option>
                <option value="Conical">Conical</option>
                <option value="Hourglass">Hourglass</option>
              </select>
            </div>
          </div>

          <div>
            <label className="flex justify-between text-sm font-bold text-gray-700 mb-1 mt-2"><span>Molecule Type</span></label>
            <select value={moleculePreset} onChange={handleMoleculeChange} className="w-full p-2 border rounded bg-gray-50 text-sm mb-2">
              <option value="Custom">Custom Particle...</option>
              <option value="ssDNA">Single-Stranded DNA (ssDNA)</option>
              <option value="dsDNA">Double-Stranded DNA (dsDNA)</option>
              <option value="BSA_Protein">BSA Protein</option>
              <option value="Gold_Nano">Gold Nanoparticle</option>
            </select>
          </div>

          <div>
            <label className="flex justify-between text-sm"><span>Applied Voltage (mV)</span> <span>{appliedVoltage}</span></label>
            <input type="range" min="10" max="500" value={appliedVoltage} onChange={e => setAppliedVoltage(Number(e.target.value))} className="w-full" />
          </div>

          <div>
            <label className="flex justify-between text-sm text-purple-700 font-semibold"><span>Molecule Concentration (nM)</span> <span>{concentration}</span></label>
            <input type="range" min="1" max="200" value={concentration} onChange={e => setConcentration(Number(e.target.value))} className="w-full accent-purple-600" />
          </div>

          <div>
            <label className="flex justify-between text-sm"><span>Molecule Charge (e)</span> <span>{moleculeCharge}</span></label>
            <input type="range" min="1" max="50" value={moleculeCharge} onChange={e => { setMoleculeCharge(Number(e.target.value)); setMoleculePreset('Custom'); }} className="w-full" />
          </div>

          <div>
            <label className="flex justify-between text-sm"><span>Molecule Diameter (nm)</span> <span>{moleculeDiameter}</span></label>
            <input type="range" min="1" max="49" value={moleculeDiameter} onChange={e => { setMoleculeDiameter(Number(e.target.value)); setMoleculePreset('Custom'); }} className="w-full" />
          </div>

          <div>
            <label className="flex justify-between text-sm"><span>Pore Diameter (nm)</span> <span>{poreDiameter}</span></label>
            <input type="range" min="2" max="50" value={poreDiameter} onChange={e => setPoreDiameter(Number(e.target.value))} className="w-full" />
          </div>

          <div>
            <label className="flex justify-between text-sm"><span>Membrane Thickness (nm)</span> <span>{membraneThickness}</span></label>
            <input type="range" min="5" max="100" value={membraneThickness} onChange={e => setMembraneThickness(Number(e.target.value))} className="w-full" />
          </div>

          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mt-2">
            <label className="flex justify-between text-sm font-semibold text-blue-800">
              <span>Dynamic Dwell Time:</span> <span>{currentDwellTime === Infinity ? '∞' : currentDwellTime.toFixed(3)} ms</span>
            </label>
          </div>

          <div className="bg-red-50 p-3 rounded-lg border border-red-100 mt-2">
            <label className="flex justify-between text-sm font-semibold text-red-800">
              <span>Membrane Capacitance:</span> <span>{currentCapacitance.toFixed(2)} pF</span>
            </label>
          </div>
        </div>

        {/* ELECTRONICS CONTROLS */}
        <div className="space-y-4 pt-4 border-t">
          <h2 className="font-semibold text-lg text-green-600">Electronics Parameters</h2>
          <div>
            <label className="flex justify-between text-sm"><span>TIA Bandwidth (Hz)</span> <span>{bandwidth}</span></label>
            <input type="range" min="1000" max="200000" step="1000" value={bandwidth} onChange={e => setBandwidth(Number(e.target.value))} className="w-full accent-green-600" />
          </div>
          <div>
            <label className="flex justify-between text-sm"><span>Base Noise Level (nA)</span> <span>{noiseLevel}</span></label>
            <input type="range" min="0.1" max="5" step="0.1" value={noiseLevel} onChange={e => setNoiseLevel(Number(e.target.value))} className="w-full accent-green-600" />
          </div>
          <div>
            <label className="flex justify-between text-sm"><span>ADC Sampling Rate (Hz)</span> <span>{samplingRate}</span></label>
            <input type="range" min="5000" max="500000" step="5000" value={samplingRate} onChange={e => setSamplingRate(Number(e.target.value))} className="w-full accent-green-600" />
          </div>
          <div>
            <label className="flex justify-between text-sm"><span>ADC Resolution (Bits)</span> <span>{adcBits}</span></label>
            <input type="range" min="4" max="16" value={adcBits} onChange={e => setAdcBits(Number(e.target.value))} className="w-full accent-green-600" />
          </div>
        </div>

        {/* EXPORT ACTION */}
        <div className="pt-6 border-t mt-6">
          <button onClick={exportToCSV} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors">
            Export Trace to CSV
          </button>
        </div>
      </div>

      {/* RIGHT SIDE: Charts */}
      <div className="w-full md:w-2/3 flex flex-col gap-6 overflow-y-auto max-h-[95vh] pr-2 custom-scrollbar">
        
        {/* Top Chart: Trace */}
        <div className="bg-white p-6 rounded-xl shadow-md flex flex-col min-h-[350px]">
          <h2 className="text-xl font-bold mb-4">Current Trace (nA) vs Time (ms)</h2>
          <div className="w-full h-full flex-grow">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
                <XAxis dataKey="time" label={{ value: 'Time (ms)', position: 'insideBottomRight', offset: -5 }} />
                <YAxis domain={['auto', 'auto']} label={{ value: 'Current (nA)', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value: number) => value.toFixed(3) + ' nA'} />
                <Legend verticalAlign="top" height={36}/>

                {/* ---  Event Highlights (ReferenceAreas) --- */}
                {eventData && eventData.map((evt: any, i: number) => (
                  <ReferenceArea 
                    key={`event-${i}`} 
                    x1={evt.start_time} 
                    x2={evt.start_time + evt.dwell_time_ms} 
                    fill="#ef4444"         // Sharp pinpoint red
                    fillOpacity={0.08}     // Extremely light so they don't blob together
                    stroke="#ef4444"       // Strict border to pinpoint exact start/end
                    strokeWidth={1.5}      // Crisp, visible line
                    strokeOpacity={0.8}    // Keeps the borders distinct
                  />
                ))}

                {/* --- UPDATE: Darker Raw Physical Current Line --- */}
                <Line 
                  type="stepAfter" 
                  dataKey="idealCurrent" 
                  // Change stroke from #ccc to slate-700 (charcoal)
                  stroke="#334155" 
                  strokeDasharray="5 5" 
                  strokeWidth={2} 
                  dot={false} 
                  name="Raw Physical Current" 
                  isAnimationActive={false} 
                />
                
                {/* Keep Measured Current Blue */}
                <Line 
                  type="monotone" 
                  dataKey="current" 
                  stroke="#2563eb" 
                  strokeWidth={2} 
                  dot={false} 
                  name="Measured Current" 
                  isAnimationActive={false} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Middle: 2-Column Grid for the Analysis Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 min-h-[300px]">
          
          {/* Histogram */}
          <div className="bg-white p-6 rounded-xl shadow-md flex flex-col h-full">
            <h2 className="text-xl font-bold mb-4">Distribution Histogram</h2>
            <div className="flex-grow w-full h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={histogramData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.5} vertical={false} />
                  <XAxis dataKey="bin" />
                  <YAxis />
                  <Tooltip cursor={{fill: '#f3f4f6'}} />
                  <Bar dataKey="count" fill="#8b5cf6" isAnimationActive={false} name="Population" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Scatter Plot */}
          <div className="bg-white p-6 rounded-xl shadow-md flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Event Scatter Plot</h2>
              <span className="bg-purple-100 text-purple-800 text-xs font-bold px-3 py-1 rounded-full">
                {eventData?.length || 0} Events
              </span>
            </div>
            <div className="flex-grow w-full h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
                  <XAxis type="number" dataKey="dwell_time_ms" name="Dwell Time" unit=" ms" />
                  <YAxis type="number" dataKey="blockade_depth_na" name="Depth" unit=" nA" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter name="Molecules" data={eventData} fill="#d946ef" opacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Bottom Chart: Power Spectral Density (PSD) */}
        <div className="bg-white p-6 rounded-xl shadow-md flex flex-col min-h-[300px]">
          <h2 className="text-xl font-bold mb-4 flex justify-between items-center">
            Noise Power Spectral Density
            <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">FFT COMPUTED</span>
          </h2>
          <div className="w-full h-full flex-grow h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={psdData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
                <XAxis dataKey="freq" type="number" scale="log" domain={['dataMin', 'dataMax']} label={{ value: 'Frequency (Hz)', position: 'insideBottomRight', offset: -5 }} />
                <YAxis label={{ value: 'Power (dB)', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value: number) => value.toFixed(2) + ' dB'} labelFormatter={(label: number) => label.toFixed(0) + ' Hz'} />
                <Line type="monotone" dataKey="power_db" stroke="#10b981" strokeWidth={2} dot={false} isAnimationActive={false} name="Spectrum" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}