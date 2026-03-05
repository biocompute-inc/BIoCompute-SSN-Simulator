/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useMemo, useEffect, useDeferredValue, useCallback } from 'react';
import init, { run_wasm_simulation } from 'wasm-engine';
import { calculateDwellTime, calculateCapacitance } from '@/lib/physics';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, ScatterChart, Scatter,
  ReferenceLine, ReferenceArea, Label,
} from 'recharts';
import NanoporeAnimation from '@/components/NanoporeAnimation';

// ─── Types ────────────────────────────────────────────────────────────────────
interface DetectedEvent { start_time: number; dwell_time_ms: number; blockade_depth_na: number; }
interface TracePoint { time: number; current: number; idealCurrent: number; }

// ─── Shared axis style ────────────────────────────────────────────────────────
const AX = { fontFamily: 'Inter, sans-serif', fontSize: 10, fill: '#9ca3af' };
const CARD: React.CSSProperties = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' };

// ─── Tooltip ──────────────────────────────────────────────────────────────────
function ChartTip({ active, payload, label, unit = 'nA' }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 4 }}>{typeof label === 'number' ? label.toFixed(3) + ' ms' : label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 11, marginBottom: 2 }}>
          <div style={{ width: 8, height: 2, background: p.color, borderRadius: 1 }} />
          <span style={{ color: '#6b7280' }}>{p.name}:</span>
          <span style={{ fontWeight: 600, color: '#111827' }}>{typeof p.value === 'number' ? p.value.toFixed(3) : p.value} {unit}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Slider ───────────────────────────────────────────────────────────────────
function Slider({ label, value, min, max, step = 1, onChange, unit }: {
  label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; unit?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#6d28d9' }}>{value}<span style={{ fontSize: 10, fontWeight: 400, color: '#9ca3af' }}> {unit}</span></span>
      </div>
      <div style={{ position: 'relative', height: 20, display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'absolute', inset: '8px 0', height: 4, background: '#ede9fe', borderRadius: 2 }} />
        <div style={{ position: 'absolute', left: 0, top: 8, height: 4, width: `${pct}%`, background: 'linear-gradient(90deg,#a78bfa,#7c3aed)', borderRadius: 2 }} />
        <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(+e.target.value)}
          style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%' }} />
        <div style={{ position: 'absolute', left: `calc(${pct}% - 8px)`, width: 16, height: 16, borderRadius: '50%', background: '#7c3aed', border: '2.5px solid #fff', boxShadow: '0 1px 4px rgba(109,40,217,.4)', pointerEvents: 'none' }} />
      </div>
    </div>
  );
}

// ─── Section header inside sidebar ───────────────────────────────────────────
function SideSection({ title, accent = '#7c3aed', children }: { title: string; accent?: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{ width: 3, height: 14, background: accent, borderRadius: 2 }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: '#111827', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>
    </div>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, color: '#6b7280', marginBottom: 4, fontWeight: 500 }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ width: '100%', padding: '7px 10px', fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 7, background: '#fafafa', color: '#374151', fontFamily: 'Inter, sans-serif', outline: 'none', cursor: 'pointer' }}>
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}

// ─── Inline stat pill ─────────────────────────────────────────────────────────
function Stat({ label, value, unit, color = '#7c3aed' }: { label: string; value: string; unit?: string; color?: string }) {
  return (
    <div style={{ background: '#faf5ff', border: '1px solid #ede9fe', borderRadius: 8, padding: '8px 12px' }}>
      <div style={{ fontSize: 9, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color }}>{value}<span style={{ fontSize: 10, fontWeight: 400, color: '#9ca3af', marginLeft: 2 }}>{unit}</span></div>
    </div>
  );
}

// ─── Chart panel wrapper ──────────────────────────────────────────────────────
function ChartCard({ title, badge, children, style }: { title: string; badge?: React.ReactNode; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ ...CARD, padding: '16px 18px', ...style }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{title}</span>
        {badge}
      </div>
      {children}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function SimulatorDash() {
  const [wasmReady, setWasmReady] = useState(false);
  const [tab, setTab] = useState<'overview' | 'analysis'>('overview');
  // Physics
  const [poreGeometry, setPoreGeometry] = useState('Cylindrical');
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
  // Electronics
  const [samplingRate, setSamplingRate] = useState(100000);
  const [bandwidth, setBandwidth] = useState(10000);
  const [noiseLevel, setNoiseLevel] = useState(0.5);
  const [adcBits, setAdcBits] = useState(12);

  const onMolecule = (p: string) => {
    setMoleculePreset(p);
    if (p === 'ssDNA') { setMoleculeDiameter(1.0); setMoleculeCharge(30); }
    else if (p === 'dsDNA') { setMoleculeDiameter(2.2); setMoleculeCharge(60); }
    else if (p === 'BSA Protein') { setMoleculeDiameter(6.0); setMoleculeCharge(15); }
    else if (p === 'Gold Nanoparticle') { setMoleculeDiameter(15.0); setMoleculeCharge(100); }
  };
  const onMaterial = (p: string) => {
    setMaterialPreset(p);
    if (p === 'SiN') setDielectricConstant(7.5);
    else if (p === 'MoS₂') setDielectricConstant(4.0);
    else if (p === 'Graphene') setDielectricConstant(2.5);
  };

  useEffect(() => { init().then(() => setWasmReady(true)); }, []);

  const dwellTime = useMemo(() =>
    calculateDwellTime({ poreDiameter, moleculeDiameter, membraneThickness, appliedVoltage, conductivity, moleculeCharge }),
    [poreDiameter, moleculeDiameter, membraneThickness, appliedVoltage, conductivity, moleculeCharge]
  );
  const capacitance = useMemo(() =>
    calculateCapacitance(membraneThickness, dielectricConstant),
    [membraneThickness, dielectricConstant]
  );

  const params = useMemo(() => ({
    poreGeometry, poreDiameter, moleculeDiameter, membraneThickness, appliedVoltage,
    conductivity, moleculeCharge, concentration, samplingRate, bandwidth,
    noiseLevel, adcBits, dielectricConstant, moleculePreset,
  }), [poreGeometry, poreDiameter, moleculeDiameter, membraneThickness, appliedVoltage,
    conductivity, moleculeCharge, concentration, samplingRate, bandwidth,
    noiseLevel, adcBits, dielectricConstant, moleculePreset]);

  const dp = useDeferredValue(params);

  // Selection keyed to params snapshot — auto-clears when any param changes, no effect/ref needed
  const [selection, setSelection] = useState<{ idx: number; key: string } | null>(null);
  const paramsKey = JSON.stringify(params);
  const selectedEvent = selection?.key === paramsKey ? selection.idx : null;
  const setSelectedEvent = (idx: number | null) =>
    setSelection(idx === null ? null : { idx, key: paramsKey });

  const simData = useMemo(() => {
    const empty = { trace: [] as TracePoint[], events: [] as DetectedEvent[], hist: [] as any[], psd: [] as any[], baseline: 0 };
    if (!wasmReady) return empty;
    let r: any;
    try {
      r = run_wasm_simulation({
        pore_geometry: dp.poreGeometry,
        molecule_type: dp.moleculePreset === 'BSA Protein' ? 'Protein' : dp.moleculePreset === 'Gold Nanoparticle' ? 'Nanoparticle' : dp.moleculePreset,
        pore_diameter: dp.poreDiameter, molecule_diameter: dp.moleculeDiameter,
        membrane_thickness: dp.membraneThickness, applied_voltage: dp.appliedVoltage,
        conductivity: dp.conductivity, molecule_charge: dp.moleculeCharge,
        concentration: dp.concentration, duration_ms: 50,
        sampling_rate_hz: dp.samplingRate, bandwidth_hz: dp.bandwidth,
        noise_level: dp.noiseLevel, adc_bits: dp.adcBits,
        adc_range: 50, dielectric_constant: dp.dielectricConstant, membrane_area_um2: 0.01,
      });
    } catch (e) { console.error(e); return empty; }
    if (!r?.trace?.length) return empty;

    const raw: any[] = r.trace;
    const events: DetectedEvent[] = r.events ?? [];
    const psd: any[] = r.psd ?? [];

    let bl = -Infinity;
    for (const d of raw) if (d.ideal_current > bl) bl = d.ideal_current;

    const step = Math.max(1, Math.floor(raw.length / 700));
    const trace: TracePoint[] = raw.filter((_: any, i: number) => i % step === 0)
      .map((d: any) => ({ time: d.time, current: d.current, idealCurrent: d.ideal_current }));

    // histogram
    let minC = Infinity, maxC = -Infinity;
    for (const d of raw) { if (d.current < minC) minC = d.current; if (d.current > maxC) maxC = d.current; }
    const bw = (maxC - minC + 0.1) / 50;
    const counts = new Array(50).fill(0);
    for (const d of raw) { const idx = Math.floor((d.current - minC) / bw); if (idx >= 0 && idx < 50) counts[idx]++; }
    const hist = counts.map((count, i) => ({ bin: (minC + (i + 0.5) * bw).toFixed(2), count }));

    return { trace, events, hist, psd, baseline: bl };
  }, [wasmReady, dp]);

  const snr = useMemo(() => {
    if (!simData.trace.length) return 0;
    const bl = simData.baseline;
    const ns = simData.trace.filter(d => d.idealCurrent === bl);
    let sigma = noiseLevel;
    if (ns.length > 10) {
      const m = ns.reduce((a, b) => a + b.current, 0) / ns.length;
      sigma = Math.sqrt(ns.reduce((a, b) => a + (b.current - m) ** 2, 0) / ns.length);
    }
    const dep = simData.events.length ? simData.events.reduce((s, e) => s + e.blockade_depth_na, 0) / simData.events.length : 0;
    return sigma > 0.001 && dep > 0 ? dep / sigma : 0;
  }, [simData, noiseLevel]);

  const exportCSV = useCallback(() => {
    if (!simData.trace.length) return;
    const rows = ['Time (ms),Measured (nA),Ideal (nA)', ...simData.trace.map(r => `${r.time},${r.current},${r.idealCurrent}`)];
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([rows.join('\n')], { type: 'text/csv' })), download: `nanopore_${Date.now()}.csv` });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }, [simData]);

  const snrOk = snr > 3;
  const selEvt = selectedEvent !== null ? simData.events[selectedEvent] : null;

  if (!wasmReady) return (
    <div style={{ minHeight: '100vh', background: '#f5f3ff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, fontFamily: 'Inter, sans-serif' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'); @keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 36, height: 36, border: '3px solid #ede9fe', borderTop: '3px solid #7c3aed', borderRadius: '50%', animation: 'spin .9s linear infinite' }} />
      <span style={{ fontSize: 13, fontWeight: 500, color: '#7c3aed' }}>Please wait while we loading engine…</span>
    </div>
  );

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f5f3ff', fontFamily: 'Inter, sans-serif', color: '#111827', overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#ddd6fe;border-radius:2px}
        input[type=range]{-webkit-appearance:none;appearance:none;background:transparent;width:100%;cursor:pointer}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:1px;height:1px}
        select option{background:#fff}
      `}</style>

      {/* ── HEADER ── */}
      <header style={{ height: 52, background: '#fff', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', zIndex: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, background: '#7c3aed', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="5" width="14" height="2.5" rx="1" fill="rgba(255,255,255,.3)"/><rect x="1" y="8.5" width="14" height="2.5" rx="1" fill="rgba(255,255,255,.3)"/><circle cx="8" cy="8" r="2.6" fill="#fff"/></svg>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-bold tracking-tight">Nanopore Simulator</span>
            <div className="flex items-center gap-3 mt-1 text-[11px] font-semibold">
              <a  href="/guide" className="text-[#7c3aed] hover:text-[#6d28d9] transition-colors">
                User Guide
              </a><span className="text-neutral-300">|</span>
              <a href="/science"  className="text-[#7c3aed] hover:text-[#6d28d9] transition-colors"  >
                Methodology
              </a>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 8, background: snrOk ? '#f0fdf4' : '#fffbeb', border: `1px solid ${snrOk ? '#bbf7d0' : '#fde68a'}` }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: snrOk ? '#22c55e' : '#f59e0b' }} />
            <span style={{ fontSize: 11, fontWeight: 500, color: snrOk ? '#15803d' : '#b45309' }}>SNR {snr === Infinity ? '∞' : snr.toFixed(1)} — {snrOk ? 'Good' : 'Weak'}</span>
          </div>
          <div style={{ padding: '5px 12px', borderRadius: 8, background: '#faf5ff', border: '1px solid #e9d5ff' }}>
            <span style={{ fontSize: 11, color: '#6b21a8', fontWeight: 500 }}>{simData.events.length} events</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, paddingLeft: 12, borderLeft: '1px solid #e5e7eb' }}>
            <span style={{ fontSize: 10, color: '#9ca3af' }}>Powered by</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed' }}>BioCompute</span>
          </div>
        </div>
      </header>

      {/* ── BODY ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── SIDEBAR ── */}
        <aside style={{ width: 280, flexShrink: 0, background: '#fff', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          {/* Animation */}
          <div style={{ flexShrink: 0, borderBottom: '1px solid #f3f4f6', background: '#faf5ff' }}>
            <div style={{ padding: '10px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#6b21a8' }}>Translocation View</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
                <span style={{ fontSize: 10, color: '#6b7280' }}>Live</span>
              </div>
            </div>
            <NanoporeAnimation poreDiameter={poreDiameter} moleculeDiameter={moleculeDiameter} membraneThickness={membraneThickness} dwellTimeMs={dwellTime} poreGeometry={poreGeometry} />
          </div>

          {/* Controls — scrollable */}
          <div style={{ flex: 1, overflowY: 'auto' }}>

            <SideSection title="Physics" accent="#7c3aed">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <SelectField label="Material" value={materialPreset} options={['SiN', 'MoS₂', 'Graphene']} onChange={onMaterial} />
                <SelectField label="Pore Shape" value={poreGeometry} options={['Cylindrical', 'Conical', 'Hourglass']} onChange={setPoreGeometry} />
              </div>
              <SelectField label="Molecule" value={moleculePreset} options={['Custom', 'ssDNA', 'dsDNA', 'BSA Protein', 'Gold Nanoparticle']} onChange={onMolecule} />
              <Slider label="Pore Diameter" value={poreDiameter} min={2} max={50} unit="nm" onChange={setPoreDiameter} />
              <Slider label="Membrane Thickness" value={membraneThickness} min={5} max={100} unit="nm" onChange={setMembraneThickness} />
              <Slider label="Applied Voltage" value={appliedVoltage} min={10} max={500} unit="mV" onChange={setAppliedVoltage} />
              <Slider label="Molecule Diameter" value={moleculeDiameter} min={1} max={49} unit="nm" onChange={v => { setMoleculeDiameter(v); setMoleculePreset('Custom'); }} />
              <Slider label="Molecule Charge" value={moleculeCharge} min={1} max={50} unit="e" onChange={v => { setMoleculeCharge(v); setMoleculePreset('Custom'); }} />
              <Slider label="Concentration" value={concentration} min={1} max={200} unit="nM" onChange={setConcentration} />
              <Slider label="Conductivity" value={conductivity} min={1} max={30} unit="S/m" onChange={setConductivity} />
              {/* Computed readouts */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <Stat label="Dwell Time" value={dwellTime === Infinity ? '∞' : dwellTime.toFixed(3)} unit="ms" />
                <Stat label="Capacitance" value={capacitance.toFixed(1)} unit="pF" color="#0891b2" />
              </div>
            </SideSection>

            <SideSection title="Electronics" accent="#059669">
              <Slider label="TIA Bandwidth" value={bandwidth} min={1000} max={200000} step={1000} unit="Hz" onChange={setBandwidth} />
              <Slider label="Noise Floor" value={noiseLevel} min={0.1} max={5} step={0.1} unit="nA" onChange={setNoiseLevel} />
              <Slider label="Sampling Rate" value={samplingRate} min={5000} max={500000} step={5000} unit="Hz" onChange={setSamplingRate} />
              <Slider label="ADC Resolution" value={adcBits} min={4} max={16} unit="bit" onChange={setAdcBits} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <Stat label="Nyquist" value={(samplingRate / 2000).toFixed(1)} unit="kHz" color="#059669" />
                <Stat label="Dyn. Range" value={(6.02 * adcBits).toFixed(0)} unit="dB" color="#059669" />
              </div>
            </SideSection>

          </div>

          {/* Export */}
          <div style={{ padding: '12px 20px', borderTop: '1px solid #f3f4f6', flexShrink: 0 }}>
            <button onClick={exportCSV} style={{ width: '100%', padding: '9px', background: '#7c3aed', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#6d28d9')} onMouseLeave={e => (e.currentTarget.style.background = '#7c3aed')}>
              Export CSV
            </button>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

          {/* Tab bar */}
          <div style={{ height: 44, background: '#fff', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 4, padding: '0 20px', flexShrink: 0 }}>
            {(['overview', 'analysis'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: '6px 16px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500, fontFamily: 'Inter, sans-serif',
                background: tab === t ? '#f5f3ff' : 'transparent',
                color: tab === t ? '#7c3aed' : '#6b7280',
                borderBottom: tab === t ? '2px solid #7c3aed' : '2px solid transparent',
              }}>
                {t === 'overview' ? '📈  Overview' : '🔬  Analysis'}
              </button>
            ))}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
              {selectedEvent !== null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f5f3ff', border: '1px solid #e9d5ff', borderRadius: 8, padding: '4px 10px' }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: '#7c3aed' }} />
                  <span style={{ fontSize: 11, color: '#7c3aed', fontWeight: 500 }}>Event #{selectedEvent + 1} highlighted</span>
                  <button onClick={() => setSelectedEvent(null)} style={{ marginLeft: 4, fontSize: 13, lineHeight: 1, color: '#a78bfa', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>×</button>
                </div>
              )}
            </div>
          </div>

          {/* ── OVERVIEW TAB ── */}
          {tab === 'overview' && (
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

              {/* Trace card */}
              <div style={{ ...CARD, margin: '14px 16px 0', flexShrink: 0, padding: '14px 18px' }}>

                {/* Title row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Current Trace  I(t)</span>
                    {selEvt && (
                      <span style={{ fontSize: 10, color: '#7c3aed', background: '#f5f3ff', border: '1px solid #e9d5ff', borderRadius: 6, padding: '2px 8px', fontWeight: 500 }}>
                        Zoomed on Event #{selectedEvent! + 1}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <div style={{ width: 14, height: 2, backgroundImage: 'repeating-linear-gradient(90deg,#d1d5db 0,#d1d5db 4px,transparent 4px,transparent 8px)' }} />
                      <span style={{ fontSize: 10, color: '#9ca3af' }}>Ideal</span>
                    </div>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <div style={{ width: 14, height: 2, background: '#7c3aed', borderRadius: 1 }} />
                      <span style={{ fontSize: 10, color: '#9ca3af' }}>Measured</span>
                    </div>
                    {selEvt && (
                      <button onClick={() => setSelectedEvent(null)}
                        style={{ fontSize: 11, color: '#9ca3af', background: 'none', border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer', padding: '2px 8px' }}>
                        Show full trace ×
                      </button>
                    )}
                  </div>
                </div>

                {/* When NO event selected: full trace, no reference lines */}
                {!selEvt && (
                  <div style={{ height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={simData.trace} margin={{ top: 8, right: 16, left: 2, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 5" stroke="#f3f4f6" />
                        <XAxis dataKey="time" tick={AX} tickLine={false} axisLine={{ stroke: '#e5e7eb' }}
                          label={{ value: 'Time (ms)', position: 'insideBottomRight', offset: -4, style: { fontSize: 10, fill: '#9ca3af' } }} />
                        <YAxis tick={AX} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} width={48}
                          label={{ value: 'Current (nA)', angle: -90, position: 'insideLeft', offset: 12, style: { fontSize: 10, fill: '#9ca3af' } }} />
                        <Tooltip content={<ChartTip />} />
                        {simData.baseline > 0 && (
                          <ReferenceLine y={simData.baseline} stroke="#ddd6fe" strokeDasharray="4 3" strokeWidth={1}>
                            <Label value="baseline" position="insideTopRight" style={{ fontSize: 9, fill: '#a78bfa' }} />
                          </ReferenceLine>
                        )}
                        <Line type="stepAfter" dataKey="idealCurrent" stroke="#e5e7eb" strokeDasharray="5 4" strokeWidth={1.5} dot={false} name="Ideal" isAnimationActive={false} />
                        <Line type="monotone" dataKey="current" stroke="#7c3aed" strokeWidth={1.5} dot={false} activeDot={{ r: 3 }} name="Measured" isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* When event IS selected: zoomed 2-row layout */}
                {selEvt && (() => {
                  // Window: ±10× the dwell time, minimum ±0.5ms, so the event is 1/20 of view
                  const pad = Math.max(selEvt.dwell_time_ms * 10, 0.5);
                  const xMin = Math.max(0, selEvt.start_time - pad);
                  const xMax = selEvt.start_time + selEvt.dwell_time_ms + pad;
                  const zoomedData = simData.trace.filter(d => d.time >= xMin && d.time <= xMax);

                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 12 }}>
                      {/* Zoomed trace */}
                      <div>
                        <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 4 }}>
                          Showing {xMin.toFixed(2)}ms – {xMax.toFixed(2)}ms
                        </div>
                        <div style={{ height: 180 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={zoomedData} margin={{ top: 8, right: 12, left: 2, bottom: 4 }}>
                              <CartesianGrid strokeDasharray="3 5" stroke="#f3f4f6" />
                              <XAxis dataKey="time" tick={AX} tickLine={false} axisLine={{ stroke: '#e5e7eb' }}
                                tickFormatter={(v: number) => v.toFixed(3)}
                                label={{ value: 'Time (ms)', position: 'insideBottomRight', offset: -4, style: { fontSize: 10, fill: '#9ca3af' } }} />
                              <YAxis tick={AX} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} width={48}
                                label={{ value: 'Current (nA)', angle: -90, position: 'insideLeft', offset: 12, style: { fontSize: 10, fill: '#9ca3af' } }} />
                              <Tooltip content={<ChartTip />} />
                              {simData.baseline > 0 && (
                                <ReferenceLine y={simData.baseline} stroke="#ddd6fe" strokeDasharray="4 3" strokeWidth={1} />
                              )}
                              {/* The blockade depth line — shows how deep the drop is */}
                              <ReferenceLine
                                y={simData.baseline - selEvt.blockade_depth_na}
                                stroke="#7c3aed" strokeDasharray="3 3" strokeWidth={1.5} strokeOpacity={0.6}>
                                <Label value={`−${selEvt.blockade_depth_na.toFixed(2)} nA`} position="insideBottomRight" style={{ fontSize: 9, fill: '#7c3aed' }} />
                              </ReferenceLine>
                              {/* Event band — now clearly visible because we're zoomed in */}
                              <ReferenceArea
                                x1={selEvt.start_time}
                                x2={selEvt.start_time + selEvt.dwell_time_ms}
                                fill="#7c3aed" fillOpacity={0.12}
                                stroke="#7c3aed" strokeWidth={2} strokeOpacity={0.7}
                              />
                              <Line type="stepAfter" dataKey="idealCurrent" stroke="#e5e7eb" strokeDasharray="5 4" strokeWidth={1.5} dot={false} name="Ideal" isAnimationActive={false} />
                              <Line type="monotone" dataKey="current" stroke="#7c3aed" strokeWidth={2} dot={false} activeDot={{ r: 4 }} name="Measured" isAnimationActive={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Event detail card */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 20 }}>
                        <div style={{ background: '#f5f3ff', border: '2px solid #e9d5ff', borderRadius: 10, padding: '14px 16px' }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
                            Event #{selectedEvent! + 1}
                          </div>
                          {[
                            { label: 'Start time', value: `${selEvt.start_time.toFixed(3)} ms` },
                            { label: 'Dwell time', value: `${selEvt.dwell_time_ms.toFixed(3)} ms` },
                            { label: 'Blockade', value: `${selEvt.blockade_depth_na.toFixed(3)} nA` },
                            { label: 'Depth', value: simData.baseline > 0 ? `${((selEvt.blockade_depth_na / simData.baseline) * 100).toFixed(1)}%` : '—' },
                          ].map(({ label, value }) => (
                            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid #ede9fe' }}>
                              <span style={{ fontSize: 11, color: '#6b7280' }}>{label}</span>
                              <span style={{ fontSize: 11, fontWeight: 700, color: '#111827' }}>{value}</span>
                            </div>
                          ))}
                          {/* Depth bar */}
                          <div style={{ marginTop: 4 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span style={{ fontSize: 10, color: '#9ca3af' }}>Blockade depth</span>
                              <span style={{ fontSize: 10, fontWeight: 600, color: '#7c3aed' }}>
                                {simData.baseline > 0 ? `${((selEvt.blockade_depth_na / simData.baseline) * 100).toFixed(1)}%` : '—'}
                              </span>
                            </div>
                            <div style={{ height: 6, background: '#ede9fe', borderRadius: 3 }}>
                              <div style={{ width: `${Math.min(simData.baseline > 0 ? (selEvt.blockade_depth_na / simData.baseline) * 100 : 0, 100)}%`, height: '100%', background: 'linear-gradient(90deg,#a78bfa,#7c3aed)', borderRadius: 3 }} />
                            </div>
                          </div>
                        </div>

                        {/* Nav between events */}
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => setSelectedEvent(Math.max(0, selectedEvent! - 1))}
                            disabled={selectedEvent === 0}
                            style={{ flex: 1, padding: '6px', border: '1px solid #e5e7eb', borderRadius: 7, background: '#fff', fontSize: 11, color: '#374151', cursor: selectedEvent === 0 ? 'default' : 'pointer', opacity: selectedEvent === 0 ? 0.4 : 1, fontFamily: 'Inter, sans-serif' }}>
                            ← Prev
                          </button>
                          <button onClick={() => setSelectedEvent(Math.min(simData.events.length - 1, selectedEvent! + 1))}
                            disabled={selectedEvent === simData.events.length - 1}
                            style={{ flex: 1, padding: '6px', border: '1px solid #e5e7eb', borderRadius: 7, background: '#fff', fontSize: 11, color: '#374151', cursor: selectedEvent === simData.events.length - 1 ? 'default' : 'pointer', opacity: selectedEvent === simData.events.length - 1 ? 0.4 : 1, fontFamily: 'Inter, sans-serif' }}>
                            Next →
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Event list — fills remaining space, scrollable */}
              <div style={{ flex: 1, margin: '12px 16px 14px', overflow: 'hidden', display: 'flex', flexDirection: 'column', ...CARD }}>
                {/* Header */}
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Translocation Events</span>
                    <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 8 }}>
                      {simData.events.length === 0 ? 'None detected' : `${simData.events.length} found — click a row to highlight on trace`}
                    </span>
                  </div>
                  {simData.events.length > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', background: '#f5f3ff', border: '1px solid #e9d5ff', borderRadius: 20, padding: '2px 10px' }}>
                      {simData.events.length}
                    </span>
                  )}
                </div>

                {simData.events.length === 0 ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', gap: 8 }}>
                    <div style={{ fontSize: 28 }}>🔬</div>
                    <p style={{ fontSize: 12, textAlign: 'center', lineHeight: 1.6 }}>No events detected.<br />Try raising concentration or voltage.</p>
                  </div>
                ) : (
                  <>
                    {/* Column header */}
                    <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 1fr 1fr 100px', padding: '7px 16px', background: '#fafafa', borderBottom: '1px solid #f3f4f6', flexShrink: 0 }}>
                      {['#', 'Start', 'Dwell', 'Blockade', '% depth'].map((h, i) => (
                        <span key={i} style={{ fontSize: 9, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</span>
                      ))}
                    </div>
                    {/* Rows */}
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                      {simData.events.map((evt, i) => {
                        const sel = selectedEvent === i;
                        const pct = simData.baseline > 0 ? Math.min((evt.blockade_depth_na / simData.baseline) * 100, 100) : 0;
                        return (
                          <div key={i} onClick={() => setSelectedEvent(sel ? null : i)}
                            style={{ display: 'grid', gridTemplateColumns: '36px 1fr 1fr 1fr 100px', padding: '9px 16px', cursor: 'pointer', alignItems: 'center', borderBottom: '1px solid #f9fafb', background: sel ? '#f5f3ff' : 'transparent', borderLeft: `3px solid ${sel ? '#7c3aed' : 'transparent'}`, transition: 'background .1s' }}
                            onMouseEnter={e => { if (!sel) (e.currentTarget as HTMLElement).style.background = '#fafafa'; }}
                            onMouseLeave={e => { if (!sel) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                          >
                            <div style={{ width: 22, height: 22, borderRadius: 6, background: sel ? '#7c3aed' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ fontSize: 9, fontWeight: 700, color: sel ? '#fff' : '#6b7280' }}>{i + 1}</span>
                            </div>
                            <span style={{ fontSize: 11, color: '#374151' }}>{evt.start_time.toFixed(2)} ms</span>
                            <span style={{ fontSize: 11, color: '#374151' }}>{evt.dwell_time_ms.toFixed(3)} ms</span>
                            <span style={{ fontSize: 11, color: '#374151' }}>{evt.blockade_depth_na.toFixed(3)} nA</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ flex: 1, height: 5, background: '#ede9fe', borderRadius: 3 }}>
                                <div style={{ width: `${pct}%`, height: '100%', background: sel ? '#7c3aed' : '#a78bfa', borderRadius: 3 }} />
                              </div>
                              <span style={{ fontSize: 10, fontWeight: 700, color: '#7c3aed', width: 28, textAlign: 'right' }}>{pct.toFixed(0)}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

            </div>
          )}

          {/* ── ANALYSIS TAB ── */}
          {tab === 'analysis' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

                <ChartCard title="Current Distribution" badge={<span style={{ fontSize: 10, color: '#9ca3af' }}>50 bins</span>}>
                  <div style={{ height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={simData.hist} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 4" stroke="#f3f4f6" vertical={false} />
                        <XAxis dataKey="bin" tick={AX} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} interval={12} />
                        <YAxis tick={AX} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} width={30} />
                        <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontFamily: 'Inter, sans-serif', fontSize: 11 }} cursor={{ fill: '#f5f3ff' }} />
                        <Bar dataKey="count" fill="#a78bfa" radius={[2, 2, 0, 0]} isAnimationActive={false} name="Count" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>

                <ChartCard title="Event Scatter" badge={<span style={{ fontSize: 10, background: '#faf5ff', border: '1px solid #e9d5ff', color: '#7c3aed', borderRadius: 6, padding: '2px 8px', fontWeight: 600 }}>{simData.events.length} events</span>}>
                  <div style={{ height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 4" stroke="#f3f4f6" />
                        <XAxis type="number" dataKey="dwell_time_ms" name="Dwell" unit=" ms" tick={AX} tickLine={false} axisLine={{ stroke: '#e5e7eb' }}
                          label={{ value: 'Dwell (ms)', position: 'insideBottomRight', offset: -4, style: { fontSize: 10, fill: '#9ca3af' } }} />
                        <YAxis type="number" dataKey="blockade_depth_na" name="Depth" unit=" nA" tick={AX} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} width={38}
                          label={{ value: 'Blockade (nA)', angle: -90, position: 'insideLeft', offset: 12, style: { fontSize: 10, fill: '#9ca3af' } }} />
                        <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontFamily: 'Inter, sans-serif', fontSize: 11 }} cursor={{ strokeDasharray: '3 3', stroke: '#e9d5ff' }} />
                        <Scatter data={simData.events} fill="#7c3aed" fillOpacity={0.65} name="Events" />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>
              </div>

              <ChartCard title="Noise Power Spectral Density" badge={<span style={{ fontSize: 10, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', borderRadius: 6, padding: '2px 8px' }}>Hann · AC-FFT</span>}>
                <div style={{ height: 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={simData.psd} margin={{ top: 4, right: 16, left: 4, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 4" stroke="#f3f4f6" />
                      <XAxis dataKey="freq" type="number" scale="log" domain={['dataMin', 'dataMax']} tick={AX} tickLine={false} axisLine={{ stroke: '#e5e7eb' }}
                        tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                        label={{ value: 'Frequency (Hz)', position: 'insideBottomRight', offset: -4, style: { fontSize: 10, fill: '#9ca3af' } }} />
                      <YAxis tick={AX} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} width={38}
                        label={{ value: 'Power (dB)', angle: -90, position: 'insideLeft', offset: 12, style: { fontSize: 10, fill: '#9ca3af' } }} />
                      <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontFamily: 'Inter, sans-serif', fontSize: 11 }}
                        formatter={(v: any) => [Number(v).toFixed(2) + ' dB', 'Power']}
                        labelFormatter={(l: any) => Number(l).toFixed(0) + ' Hz'} />
                      <Line type="monotone" dataKey="power_db" stroke="#10b981" strokeWidth={1.5} dot={false} isAnimationActive={false} name="PSD" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              <div style={{ textAlign: 'center', paddingBottom: 8 }}>
                <span style={{ fontSize: 10, color: '#9ca3af' }}>Powered by </span>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#7c3aed' }}>BioCompute</span>
                <span style={{ fontSize: 10, color: '#9ca3af' }}> · Solid-state nanopore simulation engine</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}