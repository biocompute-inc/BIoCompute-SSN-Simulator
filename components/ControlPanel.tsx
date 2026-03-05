// components/ControlPanel.tsx
"use client";

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  unit?: string;
}

function Slider({ label, value, min, max, step = 1, onChange, unit }: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: '#374151', fontFamily: 'Inter, sans-serif' }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#7c3aed', fontFamily: 'Inter, sans-serif' }}>
          {value}<span style={{ fontSize: 10, fontWeight: 400, color: '#9ca3af', marginLeft: 1 }}>{unit}</span>
        </span>
      </div>
      <div style={{ position: 'relative', height: 18, display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, height: 4, borderRadius: 2, background: '#ede9fe' }} />
        <div style={{ position: 'absolute', left: 0, height: 4, borderRadius: 2, background: 'linear-gradient(90deg,#a78bfa,#7c3aed)', width: `${pct}%` }} />
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{ position: 'absolute', width: '100%', opacity: 0, cursor: 'pointer', height: 18 }} />
        <div style={{
          position: 'absolute', left: `calc(${pct}% - 7px)`,
          width: 14, height: 14, borderRadius: '50%',
          background: '#7c3aed', border: '2px solid #fff',
          boxShadow: '0 1px 4px rgba(124,58,237,0.35)', pointerEvents: 'none',
        }} />
      </div>
    </div>
  );
}

const SEL: React.CSSProperties = {
  width: '100%', padding: '7px 10px', fontSize: 12, fontFamily: 'Inter, sans-serif',
  border: '1px solid #e5e7eb', borderRadius: 7, background: '#fafafa',
  color: '#374151', outline: 'none', cursor: 'pointer',
};

function SectionTitle({ label, color = '#7c3aed' }: { label: string; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
      <div style={{ width: 3, height: 14, background: color, borderRadius: 2, flexShrink: 0 }} />
      <span style={{ fontSize: 12, fontWeight: 700, color: '#111827', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.01em' }}>{label}</span>
    </div>
  );
}

interface ControlPanelProps {
  // Geometry
  materialPreset: string; onMaterialChange: (v: string) => void;
  poreGeometry: string; setPoreGeometry: (v: string) => void;
  dielectricConstant: number;
  // Molecule
  moleculePreset: string; onMoleculeChange: (v: string) => void;
  moleculeDiameter: number; setMoleculeDiameter: (v: number) => void;
  moleculeCharge: number; setMoleculeCharge: (v: number) => void;
  concentration: number; setConcentration: (v: number) => void;
  // Pore
  appliedVoltage: number; setAppliedVoltage: (v: number) => void;
  poreDiameter: number; setPoreDiameter: (v: number) => void;
  membraneThickness: number; setMembraneThickness: (v: number) => void;
  conductivity: number; setConductivity: (v: number) => void;
  // Electronics
  bandwidth: number; setBandwidth: (v: number) => void;
  noiseLevel: number; setNoiseLevel: (v: number) => void;
  samplingRate: number; setSamplingRate: (v: number) => void;
  adcBits: number; setAdcBits: (v: number) => void;
  // Readouts
  currentDwellTime: number;
  currentCapacitance: number;
}

function StatRow({ label, value, unit, accent = '#7c3aed' }: { label: string; value: string; unit: string; accent?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', background: '#fafafa', border: '1px solid #f3f4f6', borderRadius: 7 }}>
      <span style={{ fontSize: 11, color: '#6b7280', fontFamily: 'Inter, sans-serif' }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: accent, fontFamily: 'Inter, sans-serif' }}>{value} <span style={{ fontSize: 10, fontWeight: 400, color: '#9ca3af' }}>{unit}</span></span>
    </div>
  );
}

export default function ControlPanel(p: ControlPanelProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* ── PHYSICS ── */}
      <div style={{ padding: '18px 16px', borderBottom: '1px solid #f3f4f6' }}>
        <SectionTitle label="Physics Parameters" color="#7c3aed" />

        {/* Geometry */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'Inter, sans-serif', marginBottom: 8, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Geometry</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 3, fontFamily: 'Inter, sans-serif' }}>Material</label>
              <select value={p.materialPreset} onChange={e => p.onMaterialChange(e.target.value)} style={SEL}>
                <option value="SiN">SiN</option>
                <option value="MoS2">MoS₂</option>
                <option value="Graphene">Graphene</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 3, fontFamily: 'Inter, sans-serif' }}>Pore Shape</label>
              <select value={p.poreGeometry} onChange={e => p.setPoreGeometry(e.target.value)} style={SEL}>
                <option value="Cylindrical">Cylindrical</option>
                <option value="Conical">Conical</option>
                <option value="Hourglass">Hourglass</option>
              </select>
            </div>
          </div>
        </div>

        {/* Molecule */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'Inter, sans-serif', marginBottom: 8, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Molecule</p>
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 3, fontFamily: 'Inter, sans-serif' }}>Preset</label>
            <select value={p.moleculePreset} onChange={e => p.onMoleculeChange(e.target.value)} style={SEL}>
              <option value="Custom">Custom Particle</option>
              <option value="ssDNA">ssDNA</option>
              <option value="dsDNA">dsDNA</option>
              <option value="BSA_Protein">BSA Protein</option>
              <option value="Gold_Nano">Gold Nanoparticle</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            <Slider label="Diameter" value={p.moleculeDiameter} min={1} max={49} unit=" nm" onChange={v => { p.setMoleculeDiameter(v); p.onMoleculeChange('Custom'); }} />
            <Slider label="Charge" value={p.moleculeCharge} min={1} max={50} unit=" e" onChange={v => { p.setMoleculeCharge(v); p.onMoleculeChange('Custom'); }} />
            <Slider label="Concentration" value={p.concentration} min={1} max={200} unit=" nM" onChange={p.setConcentration} />
          </div>
        </div>

        {/* Pore conditions */}
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'Inter, sans-serif', marginBottom: 8, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pore Conditions</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            <Slider label="Applied Voltage" value={p.appliedVoltage} min={10} max={500} unit=" mV" onChange={p.setAppliedVoltage} />
            <Slider label="Pore Diameter" value={p.poreDiameter} min={2} max={50} unit=" nm" onChange={p.setPoreDiameter} />
            <Slider label="Membrane Thickness" value={p.membraneThickness} min={5} max={100} unit=" nm" onChange={p.setMembraneThickness} />
            <Slider label="Conductivity" value={p.conductivity} min={1} max={30} unit=" S/m" onChange={p.setConductivity} />
          </div>
        </div>

        {/* Physics readouts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <StatRow label="Dwell Time" value={p.currentDwellTime === Infinity ? '∞' : p.currentDwellTime.toFixed(3)} unit="ms" />
          <StatRow label="Capacitance" value={p.currentCapacitance.toFixed(2)} unit="pF" accent="#0891b2" />
        </div>
      </div>

      {/* ── ELECTRONICS ── */}
      <div style={{ padding: '18px 16px' }}>
        <SectionTitle label="Electronics Parameters" color="#059669" />

        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'Inter, sans-serif', marginBottom: 8, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amplifier</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            <Slider label="TIA Bandwidth" value={p.bandwidth} min={1000} max={200000} step={1000} unit=" Hz" onChange={p.setBandwidth} />
            <Slider label="Noise Floor" value={p.noiseLevel} min={0.1} max={5} step={0.1} unit=" nA" onChange={p.setNoiseLevel} />
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'Inter, sans-serif', marginBottom: 8, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Digitizer (ADC)</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            <Slider label="Sampling Rate" value={p.samplingRate} min={5000} max={500000} step={5000} unit=" Hz" onChange={p.setSamplingRate} />
            <Slider label="ADC Resolution" value={p.adcBits} min={4} max={16} unit=" bit" onChange={p.setAdcBits} />
          </div>
        </div>

        {/* Electronics readouts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <StatRow label="Nyquist Limit" value={(p.samplingRate / 2000).toFixed(1)} unit="kHz" accent="#059669" />
          <StatRow label="Dynamic Range" value={(6.02 * p.adcBits).toFixed(0)} unit="dB" accent="#059669" />
        </div>
      </div>
    </div>
  );
}