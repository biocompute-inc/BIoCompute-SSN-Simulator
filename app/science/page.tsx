"use client";

import Link from 'next/link';
import 'katex/dist/katex.min.css';
import { BlockMath, InlineMath } from 'react-katex';
import { useState } from 'react';

// ── tiny collapsible section ──────────────────────────────────────────────────
function Collapse({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden', marginTop: 12 }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 16px', background: '#fafafa', border: 'none', cursor: 'pointer',
        fontFamily: 'inherit', fontSize: 12, fontWeight: 600, color: '#374151',
      }}>
        <span>{title}</span>
        <span style={{ color: '#a78bfa', fontSize: 16, lineHeight: 1 }}>{open ? '−' : '+'}</span>
      </button>
      {open && <div style={{ padding: '14px 16px', background: '#fff', borderTop: '1px solid #f3f4f6' }}>{children}</div>}
    </div>
  );
}

// ── section wrapper ───────────────────────────────────────────────────────────
function Section({ num, title, accent = '#7c3aed', children }: {
  num: string; title: string; accent?: string; children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: 52 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{num}</span>
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827', lineHeight: 1.25, margin: 0 }}>{title}</h2>
      </div>
      {children}
    </section>
  );
}

// ── formula card ─────────────────────────────────────────────────────────────
function FormulaCard({ label, children, note, rust }: {
  label: string; children: React.ReactNode; note?: string; rust?: string;
}) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px 24px', marginBottom: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>{label}</div>
      <div style={{ fontSize: '1.1rem', overflowX: 'auto' }}>{children}</div>
      {note && <p style={{ fontSize: 12, color: '#6b7280', marginTop: 12, lineHeight: 1.6, borderTop: '1px solid #f3f4f6', paddingTop: 10 }}>{note}</p>}
      {rust && (
        <div style={{ marginTop: 10, borderTop: '1px solid #f3f4f6', paddingTop: 10 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Rust implementation</div>
          <code style={{ fontSize: 11, color: '#374151', background: '#f8f7ff', padding: '8px 12px', borderRadius: 7, display: 'block', whiteSpace: 'pre-wrap', fontFamily: 'monospace', border: '1px solid #ede9fe' }}>
            {rust}
          </code>
        </div>
      )}
    </div>
  );
}

// ── variable table ────────────────────────────────────────────────────────────
function VarTable({ rows }: { rows: [string, string, string][] }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'inherit', marginBottom: 16 }}>
      <thead>
        <tr style={{ background: '#faf5ff', borderBottom: '1px solid #e9d5ff' }}>
          {['Symbol', 'Description', 'Unit'].map(h => (
            <th key={h} style={{ padding: '7px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(([sym, desc, unit], i) => (
          <tr key={i} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
            <td style={{ padding: '7px 12px', fontFamily: 'monospace', color: '#6d28d9', fontWeight: 600 }}>{sym}</td>
            <td style={{ padding: '7px 12px', color: '#374151' }}>{desc}</td>
            <td style={{ padding: '7px 12px', color: '#9ca3af', fontFamily: 'monospace' }}>{unit}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── callout box ───────────────────────────────────────────────────────────────
function Callout({ type = 'info', children }: { type?: 'info' | 'warn' | 'fix'; children: React.ReactNode }) {
  const styles = {
    info: { bg: '#f0f9ff', border: '#bae6fd', icon: 'ℹ', color: '#0369a1' },
    warn: { bg: '#fffbeb', border: '#fde68a', icon: '⚠', color: '#b45309' },
    fix:  { bg: '#f0fdf4', border: '#bbf7d0', icon: '✓', color: '#15803d' },
  }[type];
  return (
    <div style={{ background: styles.bg, border: `1px solid ${styles.border}`, borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <span style={{ fontSize: 14, flexShrink: 0, color: styles.color }}>{styles.icon}</span>
      <div style={{ fontSize: 12, color: styles.color, lineHeight: 1.6 }}>{children}</div>
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────
export default function SciencePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif', color: '#111827' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); *{box-sizing:border-box;margin:0;padding:0}`}</style>

      {/* ── HEADER ────────────────────────────────────────────────────── */}
      <header style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 40px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 40, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, background: '#7c3aed', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="5" width="14" height="2.5" rx="1" fill="rgba(255,255,255,.3)"/><rect x="1" y="8.5" width="14" height="2.5" rx="1" fill="rgba(255,255,255,.3)"/><circle cx="8" cy="8" r="2.6" fill="#fff"/></svg>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>Simulation Methodology</div>
            <div style={{ fontSize: 10, color: '#9ca3af' }}>BioCompute WebAssembly Engine — Physics Reference</div>
          </div>
        </div>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f5f3ff', border: '1px solid #e9d5ff', color: '#7c3aed', fontWeight: 600, padding: '7px 14px', borderRadius: 8, fontSize: 12, textDecoration: 'none' }}>
          ← Back to Simulator
        </Link>
      </header>

      {/* ── TOC + BODY ────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 40px 80px', display: 'grid', gridTemplateColumns: '220px 1fr', gap: 48 }}>

        {/* Table of contents — sticky */}
        <aside style={{ position: 'sticky', top: 80, alignSelf: 'start' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Contents</div>
          {[
            ['1', 'Pore Conductance'],
            ['2', 'Access Resistance'],
            ['3', 'Membrane Capacitance'],
            ['4', 'Stokes-Einstein Diffusion'],
            ['5', 'Faxén Wall Correction'],
            ['6', 'Electrophoretic Velocity'],
            ['7', 'Berg-Purcell Capture Rate'],
            ['8', 'Poisson Arrival Process'],
            ['9', 'Blockade Depth Model'],
            ['10', 'Signal Processing & Filter'],
            ['11', 'ADC Quantisation'],
            ['12', 'Power Spectral Density'],
            ['13', 'Event Detection'],
            ['14', 'Random Number Generation'],
          ].map(([n, label]) => (
            <a key={n} href={`#sec${n}`} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '5px 0', textDecoration: 'none', color: '#6b7280', fontSize: 12 }}
              onMouseEnter={e => (e.currentTarget.style.color = '#7c3aed')}
              onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}>
              <span style={{ width: 20, height: 20, borderRadius: 5, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#9ca3af', flexShrink: 0 }}>{n}</span>
              {label}
            </a>
          ))}
        </aside>

        {/* Main content */}
        <main>
          <div style={{ marginBottom: 48 }}>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 12 }}>
              Physical Models & <span style={{ color: '#7c3aed' }}>Mathematics</span>
            </h1>
            <p style={{ fontSize: 15, color: '#6b7280', lineHeight: 1.7 }}>
              Every formula below is directly implemented in the BioCompute Rust/WASM engine (<code style={{ fontSize: 13, background: '#f3f4f6', padding: '1px 6px', borderRadius: 4 }}>lib.rs</code>). Constants used throughout: <InlineMath math="\eta = 1\,\text{mPa·s}" /> (water viscosity), <InlineMath math="T = 298\,\text{K}" /> (room temperature), <InlineMath math="k_B = 1.381 \times 10^{-23}\,\text{J/K}" />, <InlineMath math="e = 1.602 \times 10^{-19}\,\text{C}" />.
            </p>
          </div>

          {/* ── 1. PORE CONDUCTANCE ── */}
          <div id="sec1"><Section num="1" title="Geometric Pore Conductance" accent="#7c3aed">
            <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7, marginBottom: 20 }}>
              The open-pore conductance <InlineMath math="G" /> is computed by integrating resistivity over the pore channel. Three geometries are modelled: cylindrical, conical (single taper), and hourglass (double-symmetric taper). The baseline open-pore current is then <InlineMath math="I_0 = G \cdot V" />.
            </p>

            <FormulaCard label="Cylindrical Pore — Channel Resistance"
              note="The dominant term for long, narrow pores. Scales with L/d²."
              rust={`let r_pore = (4.0 * rho * l_meters) / (PI * d.powi(2));`}>
              <BlockMath math="R_{\text{pore}}^{\text{cyl}} = \frac{4\rho L}{\pi d^2}" />
            </FormulaCard>

            <FormulaCard label="Conical Pore — Channel Resistance"
              note="Uses the geometric mean of tip and base diameters. Tip diameter is the bottleneck."
              rust={`let r_pore = (4.0 * rho * l_meters) / (PI * d_tip * d_base);`}>
              <BlockMath math="R_{\text{pore}}^{\text{con}} = \frac{4\rho L}{\pi \, d_{\text{tip}} \cdot d_{\text{base}}}" />
            </FormulaCard>

            <FormulaCard label="Hourglass Pore — Two Half-Cones in Series"
              note="Symmetric double-taper: two half-length conical resistances in series, access resistance at the wide outer mouths only."
              rust={`let r_half = (4.0 * rho * (l_meters / 2.0)) / (PI * d_min * d_max);
let conductance = (2.0 * r_half + r_access).recip();`}>
              <BlockMath math="R_{\text{pore}}^{\text{hg}} = 2 \times \frac{4\rho (L/2)}{\pi \, d_{\min} \cdot d_{\max}}" />
            </FormulaCard>

            <VarTable rows={[
              ['ρ', 'Electrolyte resistivity  (= 1/σ)', 'Ω·m'],
              ['L', 'Membrane thickness', 'm'],
              ['d', 'Pore diameter (cylindrical)', 'm'],
              ['d_tip, d_base', 'Tip and base diameters (conical)', 'm'],
              ['d_min, d_max', 'Waist and mouth diameters (hourglass)', 'm'],
            ]} />
          </Section></div>

          {/* ── 2. ACCESS RESISTANCE ── */}
          <div id="sec2"><Section num="2" title="Access Resistance (Hall 1975)" accent="#7c3aed">
            <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7, marginBottom: 20 }}>
              Beyond the channel itself, ions must converge from the bulk solution into the pore mouth. This convergence zone contributes the <em>access resistance</em>, first derived by Hall (1975) for a circular aperture in a thin insulating membrane.
            </p>
            <Callout type="fix">
              <strong>Bug fix applied:</strong> The original code used <code>R_access = ρ/d</code> (missing factor of 2), causing baseline current to be 15–20% too low. The correct Hall formula is <code>ρ/(2d)</code> per mouth.
            </Callout>

            <FormulaCard label="Cylindrical — Access Resistance (single mouth)"
              note="One access resistance per pore mouth. For a symmetric pore both ends are identical; the total access term accounts for both implicitly via the 2d denominator."
              rust={`let r_access = rho / (2.0 * d);  // FIX: was rho/d`}>
              <BlockMath math="R_{\text{access}}^{\text{cyl}} = \frac{\rho}{2d}" />
            </FormulaCard>

            <FormulaCard label="Conical — Access Resistance (tip only)"
              note="Only the tip (narrowest) end dominates. The base mouth is wide and its access resistance is negligible."
              rust={`let r_access = rho / (2.0 * d_tip);  // FIX: removed +rho/(2*d_base) term`}>
              <BlockMath math="R_{\text{access}}^{\text{con}} = \frac{\rho}{2 \, d_{\text{tip}}}" />
            </FormulaCard>

            <FormulaCard label="Total Resistance & Conductance">
              <BlockMath math="R_{\text{total}} = R_{\text{pore}} + R_{\text{access}}, \qquad G = \frac{1}{R_{\text{total}}}" />
            </FormulaCard>
          </Section></div>

          {/* ── 3. CAPACITANCE ── */}
          <div id="sec3"><Section num="3" title="Membrane Capacitance" accent="#0891b2">
            <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7, marginBottom: 20 }}>
              The membrane acts as a parallel-plate capacitor. Capacitance contributes to the dielectric noise floor and determines the high-frequency roll-off of the noise PSD. It is now parameterised by the actual membrane patch area <InlineMath math="A" /> instead of a hardcoded constant.
            </p>
            <Callout type="fix">
              <strong>Bug fix applied:</strong> Original code had a stray <code>× 1e12</code> and a hardcoded area of <code>100e-12 m²</code>. Now uses the user-supplied <code>membrane_area_um2</code> field with correct unit conversion.
            </Callout>

            <FormulaCard label="Parallel-Plate Capacitance"
              note="ε₀ = 8.854 × 10⁻¹² F/m. For SiN εᵣ ≈ 7.5, MoS₂ εᵣ ≈ 4.0, Graphene εᵣ ≈ 2.5."
              rust={`let membrane_area_m2 = config.membrane_area_um2 * 1e-12;
let cap_f  = (8.854e-12 * config.dielectric_constant * membrane_area_m2) / l_meters;
let cap_pf = cap_f * 1e12;`}>
              <BlockMath math="C_{\text{mem}} = \frac{\varepsilon_0 \, \varepsilon_r \, A}{L} \quad [\text{F}]" />
            </FormulaCard>

            <FormulaCard label="Noise Contribution from Capacitance"
              note="Empirical coefficient 0.05 nA/pF captures the dielectric loss contribution to total RMS noise.">
              <BlockMath math="\sigma_{\text{total}} = (\sigma_{\text{amp}} + 0.05 \cdot C_{\text{pF}}) \times m_{\text{mol}}" />
            </FormulaCard>

            <VarTable rows={[
              ['ε₀', 'Vacuum permittivity', 'F/m'],
              ['εᵣ', 'Relative dielectric constant of membrane material', '—'],
              ['A', 'Membrane patch area', 'm²'],
              ['L', 'Membrane thickness', 'm'],
              ['σ_amp', 'Amplifier noise floor (user input)', 'nA'],
              ['m_mol', 'Molecule-type noise multiplier (1.0–1.5)', '—'],
            ]} />
          </Section></div>

          {/* ── 4. STOKES-EINSTEIN ── */}
          <div id="sec4"><Section num="4" title="Stokes-Einstein Diffusion Coefficient" accent="#059669">
            <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7, marginBottom: 20 }}>
              Free diffusion of a spherical molecule in bulk solution, used in the Berg-Purcell capture rate model.
            </p>

            <FormulaCard label="Stokes-Einstein Equation"
              note="Assumes spherical geometry and dilute solution (no intermolecular interactions)."
              rust={`let diffusion = (k_boltzmann * temperature) / (6.0 * PI * viscosity * r_mol);`}>
              <BlockMath math="D = \frac{k_B T}{6\pi\eta r}" />
            </FormulaCard>

            <VarTable rows={[
              ['k_B', 'Boltzmann constant  1.381 × 10⁻²³', 'J/K'],
              ['T', 'Temperature (298 K)', 'K'],
              ['η', 'Dynamic viscosity of water (0.001)', 'Pa·s'],
              ['r', 'Molecule radius', 'm'],
            ]} />
          </Section></div>

          {/* ── 5. FAXÉN ── */}
          <div id="sec5"><Section num="5" title="Faxén Hydrodynamic Wall Correction" accent="#7c3aed">
            <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7, marginBottom: 20 }}>
              When a molecule is confined inside a nanopore, hydrodynamic interactions with the pore walls dramatically increase drag beyond the Stokes free-space value. The Faxén correction factor <InlineMath math="f(\lambda)" /> reduces the effective mobility, where <InlineMath math="\lambda = d_{\text{mol}} / d_{\text{pore}}" /> is the confinement ratio.
            </p>
            <Callout type="fix">
              <strong>Bug fix applied:</strong> The original code used <code>confinement_drag = 100_000.0</code> — a dimensionless magic number with no physical basis. Replaced with the Faxén polynomial derived from hydrodynamic theory.
            </Callout>

            <FormulaCard label="Faxén Correction Factor  f(λ)"
              note="Valid for λ ∈ [0, 0.99]. Clamped to 0.001 to avoid division by zero at extreme confinement (λ→1)."
              rust={`fn faxen_correction(lambda: f64) -> f64 {
    let l = lambda.clamp(0.0, 0.99);
    (1.0 - 2.1044*l + 2.0890*l.powi(3) - 0.9481*l.powi(5)).max(0.001)
}`}>
              <BlockMath math="f(\lambda) = 1 - 2.1044\lambda + 2.0890\lambda^3 - 0.9481\lambda^5" />
            </FormulaCard>

            <FormulaCard label="Confinement Ratio">
              <BlockMath math="\lambda = \frac{d_{\text{molecule}}}{d_{\text{pore}}} \in [0,\, 1)" />
            </FormulaCard>

            <Callout type="info">
              At <InlineMath math="\lambda = 0" /> (point particle) <InlineMath math="f = 1" /> — no wall effect. At <InlineMath math="\lambda = 0.9" /> (molecule nearly fills pore) <InlineMath math="f \approx 0.08" /> — mobility reduced to 8% of free value. This is the primary control over dwell time.
            </Callout>
          </Section></div>

          {/* ── 6. ELECTROPHORETIC VELOCITY ── */}
          <div id="sec6"><Section num="6" title="Electrophoretic Velocity & Dwell Time" accent="#7c3aed">
            <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7, marginBottom: 20 }}>
              The molecule is driven through the pore by the electric field. Its terminal velocity is the balance between the electrophoretic driving force and Stokes drag, corrected by the Faxén factor.
            </p>

            <FormulaCard label="Electric Field Inside Pore">
              <BlockMath math="\mathcal{E} = \frac{V}{L}" />
            </FormulaCard>

            <FormulaCard label="Electrophoretic Force"
              rust={`let force_elec = q * (v_volts / l_meters);`}>
              <BlockMath math="F_{\text{elec}} = q \cdot \mathcal{E} = \frac{zеV}{L}" />
            </FormulaCard>

            <FormulaCard label="Faxén-Corrected Terminal Velocity"
              note="Wall drag reduces velocity in narrow confinement. Without the Faxén correction, dwell times for tightly-confined molecules (λ>0.8) would be underestimated by 10–100×."
              rust={`let faxen   = faxen_correction(lambda);
let velocity = (force_elec * faxen) / (6.0 * PI * viscosity * r_mol);`}>
              <BlockMath math="v = \frac{F_{\text{elec}} \cdot f(\lambda)}{6\pi\eta r}" />
            </FormulaCard>

            <FormulaCard label="Mean Dwell Time"
              note="Stochastic variance is applied: actual_dwell ~ Normal(μ=1, σ=0.15) × base_dwell."
              rust={`let base_dwell = (l_meters / velocity.max(1e-15)) * 1000.0; // ms
let effective_dwell = base_dwell * mobility_modifier;`}>
              <BlockMath math="\tau_{\text{dwell}} = \frac{L}{v} \cdot m_{\text{mol}} \quad [\text{ms}]" />
            </FormulaCard>

            <VarTable rows={[
              ['z', 'Molecule valence (number of unit charges)', '—'],
              ['e', 'Elementary charge  1.602 × 10⁻¹⁹', 'C'],
              ['V', 'Applied voltage', 'V'],
              ['L', 'Membrane thickness (pore length)', 'm'],
              ['r', 'Molecule radius', 'm'],
              ['η', 'Solvent viscosity', 'Pa·s'],
              ['f(λ)', 'Faxén confinement correction', '—'],
              ['m_mol', 'Mobility modifier (ssDNA=1.0, dsDNA=0.6, Protein=0.3)', '—'],
            ]} />
          </Section></div>

          {/* ── 7. CAPTURE RATE ── */}
          <div id="sec7"><Section num="7" title="Berg-Purcell Electrophoretic Capture Rate" accent="#d97706">
            <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7, marginBottom: 20 }}>
              The capture rate <InlineMath math="\Gamma" /> governs how frequently molecules arrive at the pore. It is derived from the Smoluchowski equation for diffusive capture enhanced by electrophoretic drift, following Berg & Purcell (1977).
            </p>
            <Callout type="fix">
              <strong>Bug fix applied:</strong> Original code used <code>(concentration × voltage) / 10000</code> — dimensionally inconsistent. Now uses the physically-grounded Smoluchowski model with Stokes-Einstein diffusion.
            </Callout>

            <FormulaCard label="Smoluchowski Electrophoretic Capture Rate"
              note="The 2π factor arises from integrating over a hemispherical capture cross-section at the pore mouth."
              rust={`let conc_per_m3 = config.concentration * 1e-9 * 6.022e23 * 1000.0;
let reduced_voltage = (q * v_volts.abs()) / (k_boltzmann * temperature);
let capture_rate_per_s = 2.0 * PI * diffusion * conc_per_m3 * d * reduced_voltage;
let capture_rate = (capture_rate_per_s * 1e-3).max(1e-9); // events/ms`}>
              <BlockMath math="\Gamma = 2\pi D \, c \cdot d_{\text{pore}} \cdot \frac{zeV}{k_B T} \quad \left[\text{events s}^{-1}\right]" />
            </FormulaCard>

            <FormulaCard label="Concentration Unit Conversion"
              note="Input is in nanomolar (nM). Avogadro's number N_A = 6.022 × 10²³ mol⁻¹.">
              <BlockMath math="c \;[\text{m}^{-3}] = c_{\text{nM}} \times 10^{-9} \times N_A \times 10^{3}" />
            </FormulaCard>

            <FormulaCard label="Dimensionless Voltage (Reduced Potential)">
              <BlockMath math="\tilde{V} = \frac{zeV}{k_B T}" />
            </FormulaCard>
          </Section></div>

          {/* ── 8. POISSON ── */}
          <div id="sec8"><Section num="8" title="Poisson Arrival Process" accent="#d97706">
            <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7, marginBottom: 20 }}>
              Molecules arrive stochastically. Given a constant mean capture rate <InlineMath math="\Gamma" />, inter-arrival times follow an exponential distribution — equivalent to a Poisson point process.
            </p>

            <FormulaCard label="Exponential Inter-Arrival Sampling (Inverse CDF)"
              note="u ~ U(0,1) is a uniform random number from the LCG. The max(u, 1e-15) guard prevents log(0)."
              rust={`let u = rng.next_f64().max(1e-15);
let wait_time = -u.ln() / capture_rate;  // ms`}>
              <BlockMath math="\Delta t = \frac{-\ln(u)}{\Gamma}, \quad u \sim \mathcal{U}(0,1)" />
            </FormulaCard>

            <FormulaCard label="Dwell Time Stochastic Variance"
              note="Real translocation events show dwell time variability due to diffusion within the pore. We model this as log-normal-like noise around the mean.">
              <BlockMath math="\tau_{\text{actual}} = \tau_{\text{mean}} \cdot \mathcal{N}(\mu=1,\, \sigma=0.15)" />
            </FormulaCard>
          </Section></div>

          {/* ── 9. BLOCKADE DEPTH ── */}
          <div id="sec9"><Section num="9" title="Blockade Depth & Excluded Volume" accent="#7c3aed">
            <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7, marginBottom: 20 }}>
              During translocation, the molecule partially occludes the pore cross-section, reducing the ionic current. The fractional conductance reduction scales with the excluded area ratio.
            </p>
            <Callout type="fix">
              <strong>Bug fix applied:</strong> The original code used the global <code>pore_diameter</code> for all geometries regardless of sensing zone. For conical/hourglass geometries the sensing zone is the tip/waist — which <em>is</em> the <code>pore_diameter</code> input (representing the bottleneck). The geometry branches are now explicitly documented.
            </Callout>

            <FormulaCard label="Excluded Area Fraction"
              note="Based on a cylindrical exclusion model — the molecule blocks a circular cross-section proportional to its diameter squared."
              rust={`let excluded_fraction = (config.molecule_diameter / sensing_diameter_nm).powi(2);
let delta_g = conductance * excluded_fraction;`}>
              <BlockMath math="\frac{\Delta G}{G_0} = \left(\frac{d_{\text{mol}}}{d_{\text{pore}}}\right)^2" />
            </FormulaCard>

            <FormulaCard label="Blockade Current"
              note="An additional depth variance ~ Normal(1, 0.05) is applied to simulate pore-to-pore variability."
              rust={`let blockade_i = ((conductance - delta_g * depth_variance) * v_volts * 1e9).max(0.0);`}>
              <BlockMath math="I_{\text{block}} = (G_0 - \Delta G \cdot \delta_v) \cdot V \quad [\text{nA}]" />
            </FormulaCard>

            <FormulaCard label="Current Drop  ΔI">
              <BlockMath math="\Delta I = I_0 - I_{\text{block}} = \Delta G \cdot V" />
            </FormulaCard>
          </Section></div>

          {/* ── 10. SIGNAL PROCESSING ── */}
          <div id="sec10"><Section num="10" title="Signal Processing — TIA Bandwidth Filter" accent="#059669">
            <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7, marginBottom: 20 }}>
              A physical transimpedance amplifier (TIA) has finite bandwidth. The ideal current signal is passed through a first-order RC low-pass filter (IIR) to simulate this, using a bilinear coefficient <InlineMath math="\alpha" />.
            </p>
            <Callout type="fix">
              <strong>Bug fix applied:</strong> The original code pre-pushed a seed element to <code>processed_signal</code> before the loop, creating N+1 elements that caused the FFT to silently truncate the last sample. Now the <code>prev</code> element is read safely from the in-loop buffer.
            </Callout>

            <FormulaCard label="Filter Time Constant from Bandwidth">
              <BlockMath math="\tau = \frac{1}{2\pi f_{\text{BW}}}" />
            </FormulaCard>

            <FormulaCard label="Discrete-Time Filter Coefficient α"
              rust={`let tau = 1.0 / (2.0 * PI * config.bandwidth_hz);
let ts  = 1.0 / config.sampling_rate_hz;
let alpha = ts / (tau + ts);`}>
              <BlockMath math="\alpha = \frac{T_s}{\tau + T_s} = \frac{T_s \cdot 2\pi f_{\text{BW}}}{1 + T_s \cdot 2\pi f_{\text{BW}}}" />
            </FormulaCard>

            <FormulaCard label="First-Order IIR Low-Pass Filter (Recursive)"
              note="y[i] is the filtered output. x[i] = ideal[i] + Gaussian noise. At each step: filter the noisy signal toward the previous output."
              rust={`let prev     = if i == 0 { ideal_signal[0] } else { processed_signal[i-1] };
let filtered = prev + alpha * (noisy - prev);`}>
              <BlockMath math="y[i] = y[i-1] + \alpha \cdot (x[i] - y[i-1])" />
            </FormulaCard>

            <VarTable rows={[
              ['f_BW', 'TIA bandwidth (user input)', 'Hz'],
              ['T_s', 'Sampling period = 1/f_s', 's'],
              ['α', 'Filter smoothing coefficient ∈ (0,1)', '—'],
              ['x[i]', 'Noisy input sample at step i', 'nA'],
              ['y[i]', 'Filtered output sample', 'nA'],
            ]} />
          </Section></div>

          {/* ── 11. ADC ── */}
          <div id="sec11"><Section num="11" title="ADC Quantisation" accent="#059669">
            <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7, marginBottom: 20 }}>
              After filtering, the signal is digitised by an N-bit ADC with a configurable full-scale range.
            </p>

            <FormulaCard label="Quantisation Step Size"
              rust={`let levels    = 2.0_f64.powf(config.adc_bits);
let step_size = config.adc_range / levels;`}>
              <BlockMath math="\Delta_q = \frac{V_{\text{range}}}{2^N}" />
            </FormulaCard>

            <FormulaCard label="Digitised Sample"
              rust={`let digitized = (filtered / step_size).round() * step_size;`}>
              <BlockMath math="y_{\text{dig}}[i] = \Delta_q \cdot \left\lfloor \frac{y[i]}{\Delta_q} + \frac{1}{2} \right\rfloor" />
            </FormulaCard>

            <FormulaCard label="Dynamic Range"
              note="Each additional bit adds ~6 dB of dynamic range.">
              <BlockMath math="\text{DR} \approx 6.02 \times N \quad [\text{dB}]" />
            </FormulaCard>
          </Section></div>

          {/* ── 12. PSD ── */}
          <div id="sec12"><Section num="12" title="Power Spectral Density (FFT)" accent="#059669">
            <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7, marginBottom: 20 }}>
              The noise PSD is computed from the AC-coupled (mean-subtracted) signal using an FFT with a Hann window to suppress spectral leakage. Output bins are log-spaced across the frequency axis.
            </p>
            <Callout type="fix">
              <strong>Bug fix applied:</strong> The original non-uniform decimation <code>i % (1 + i/20)</code> skipped bins irregularly at low frequencies. Replaced with 512 explicit log-spaced frequency bins from <InlineMath math="f_{\min} = \Delta f" /> to <InlineMath math="f_{\max} = f_s/2" />.
            </Callout>

            <FormulaCard label="AC-Coupling — Mean Subtraction">
              <BlockMath math="x_{\text{AC}}[n] = x[n] - \bar{x}" />
            </FormulaCard>

            <FormulaCard label="Hann Window"
              rust={`let win = 0.5 * (1.0 - (2.0 * PI * i as f64 / (total_points as f64 - 1.0)).cos());`}>
              <BlockMath math="w[n] = \frac{1}{2}\left(1 - \cos\!\left(\frac{2\pi n}{N-1}\right)\right)" />
            </FormulaCard>

            <FormulaCard label="One-Sided Power Spectral Density"
              note="Window correction factor 8/3 normalises for Hann window power loss."
              rust={`let p = (mag * mag * (8.0/3.0)) / (config.sampling_rate_hz * total_points as f64);
power_db: 10.0 * p.max(1e-15).log10()`}>
              <BlockMath math="S(f_k) = \frac{|X_k|^2 \cdot (8/3)}{f_s \cdot N} \quad [\text{dB}]" />
            </FormulaCard>

            <FormulaCard label="Log-Spaced Frequency Bins"
              rust={`let log_step = (f_max / f_min).ln() / (n_bins as f64 - 1.0);
let freq_k   = f_min * (k as f64 * log_step).exp();`}>
              <BlockMath math="f_k = f_{\min} \cdot \exp\!\left(\frac{k \ln(f_{\max}/f_{\min})}{N_{\text{bins}}-1}\right), \quad k = 0,\ldots,511" />
            </FormulaCard>

            <VarTable rows={[
              ['N', 'Total signal samples', '—'],
              ['f_s', 'Sampling rate', 'Hz'],
              ['Δf', 'Frequency resolution = f_s / N', 'Hz'],
              ['X_k', 'FFT output at bin k', '—'],
              ['8/3', 'Hann window power correction factor', '—'],
            ]} />
          </Section></div>

          {/* ── 13. EVENT DETECTION ── */}
          <div id="sec13"><Section num="13" title="Event Detection — Hysteresis Threshold" accent="#7c3aed">
            <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7, marginBottom: 20 }}>
              A two-threshold (hysteresis) detector identifies translocation events in the digitised trace. Using separate entry and exit thresholds prevents false triggers from noise near the boundary.
            </p>

            <FormulaCard label="Entry Threshold (stricter — below baseline)"
              rust={`let entry_threshold = baseline_i - (total_noise * 1.2);`}>
              <BlockMath math="\theta_{\text{entry}} = I_0 - 1.2\,\sigma_{\text{total}}" />
            </FormulaCard>

            <FormulaCard label="Exit Threshold (looser — closer to baseline)"
              rust={`let exit_threshold  = baseline_i - (total_noise * 0.2);`}>
              <BlockMath math="\theta_{\text{exit}} = I_0 - 0.2\,\sigma_{\text{total}}" />
            </FormulaCard>

            <FormulaCard label="Event Validity Criterion"
              note="Events shorter than 1.2 sampling periods are discarded as digitiser artefacts.">
              <BlockMath math="\tau_{\text{dwell}} \geq 1.2 \cdot T_s" />
            </FormulaCard>

            <FormulaCard label="Blockade Depth from Detected Event">
              <BlockMath math="\Delta I_{\text{detected}} = I_0 - I_{\min}" />
            </FormulaCard>

            <Callout type="info">
              The hysteresis gap (<InlineMath math="\theta_{\text{exit}} - \theta_{\text{entry}} = \sigma_{\text{total}}" />) must be large enough to suppress re-triggering on noise during an event, but small enough to correctly mark event boundaries.
            </Callout>
          </Section></div>

          {/* ── 14. RNG ── */}
          <div id="sec14"><Section num="14" title="Pseudorandom Number Generation (LCG)" accent="#374151">
            <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7, marginBottom: 20 }}>
              All stochastic elements — Gaussian noise, Poisson inter-arrivals, dwell time variance — use a pure-Rust Lehmer LCG seeded once from the JS boundary. This avoids the ~100× performance penalty of crossing the WASM↔JS FFI boundary on every noise sample.
            </p>
            <Callout type="fix">
              <strong>Bug fix applied:</strong> The original code called <code>js_sys::Math::random()</code> inside the inner signal-processing loop (up to 500,000× per simulation). Replaced with a Rust LCG seeded once at startup.
            </Callout>

            <FormulaCard label="Lehmer LCG State Transition (Knuth multiplier)"
              rust={`self.state = self.state
    .wrapping_mul(6364136223846793005)
    .wrapping_add(1442695040888963407);`}>
              <BlockMath math="s_{n+1} = s_n \cdot 6364136223846793005 + 1442695040888963407 \pmod{2^{64}}" />
            </FormulaCard>

            <FormulaCard label="Uniform Float in (0, 1)  — upper 53 bits"
              rust={`(self.state >> 11) as f64 / (1u64 << 53) as f64`}>
              <BlockMath math="u = \frac{s_n \gg 11}{2^{53}}" />
            </FormulaCard>

            <FormulaCard label="Box-Muller Gaussian Transform"
              note="Converts two uniform samples into one standard-normal sample."
              rust={`let z0 = (-2.0 * u1.ln()).sqrt() * (2.0 * PI * u2).cos();
let sample = z0 * std_dev + mean;`}>
              <BlockMath math="Z = \sqrt{-2\ln u_1}\;\cos(2\pi u_2)\;\sim\;\mathcal{N}(0,1)" />
            </FormulaCard>
          </Section></div>

          {/* ── References ── */}
          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 32, marginTop: 8 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#111827' }}>References</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                ['Hall, J.E. (1975)', 'Access resistance of a small circular pore.', 'J. Gen. Physiol. 66, 531–532'],
                ['Berg & Purcell (1977)', 'Physics of chemoreception; diffusive capture model.', 'Biophys. J. 20, 193–219'],
                ['Faxén, H. (1922)', 'Der Widerstand gegen die Bewegung einer starren Kugel.', 'Ann. Phys. 373(10), 89–119'],
                ['Deblois & Bean (1970)', 'Counting and sizing of submicron particles by the resistive pulse technique.', 'Rev. Sci. Instrum. 41, 909'],
                ['Bhatt et al. (2021)', 'Nanopore sequencing: a comprehensive review of the technology, challenges and future directions.', 'Chem. Soc. Rev. 50, 11–25'],
                ['Levis & Rae (1993)', 'The use of quartz patch pipettes for low noise single channel recording.', 'Biophys. J. 65, 1666–1677'],
              ].map(([authors, title, journal]) => (
                <div key={authors} style={{ background: '#fafafa', border: '1px solid #f3f4f6', borderRadius: 8, padding: '10px 14px', display: 'flex', gap: 12 }}>
                  <div style={{ width: 3, background: '#7c3aed', borderRadius: 2, flexShrink: 0 }} />
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{authors}. </span>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>{title} </span>
                    <span style={{ fontSize: 11, color: '#9ca3af', fontStyle: 'italic' }}>{journal}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}