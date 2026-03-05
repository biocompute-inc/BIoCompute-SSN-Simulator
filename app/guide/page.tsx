/* eslint-disable react/no-unescaped-entities */
"use client";

import Link from 'next/link';
import { useState } from 'react';

// ── tiny components ──────────────────────────────────────────────────────────

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  const map: Record<string, { bg: string; text: string; border: string }> = {
    violet: { bg: '#f5f3ff', text: '#6d28d9', border: '#e9d5ff' },
    green:  { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
    amber:  { bg: '#fffbeb', text: '#b45309', border: '#fde68a' },
    blue:   { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
    red:    { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' },
  };
  const s = map[color];
  return (
    <span style={{ fontSize: 10, fontWeight: 700, background: s.bg, color: s.text, border: `1px solid ${s.border}`, borderRadius: 6, padding: '2px 8px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
      {children}
    </span>
  );
}

function Tip({ type = 'tip', children }: { type?: 'tip' | 'warn' | 'info' | 'example'; children: React.ReactNode }) {
  const map = {
    tip:     { bg: '#fffbeb', border: '#fde68a', icon: '💡', label: 'Pro Tip',   tc: '#92400e' },
    warn:    { bg: '#fef2f2', border: '#fecaca', icon: '⚠️',  label: 'Warning',  tc: '#991b1b' },
    info:    { bg: '#eff6ff', border: '#bfdbfe', icon: 'ℹ️',  label: 'Note',     tc: '#1e40af' },
    example: { bg: '#f0fdf4', border: '#bbf7d0', icon: '🧪',  label: 'Example',  tc: '#15803d' },
  }[type];
  return (
    <div style={{ background: map.bg, border: `1px solid ${map.border}`, borderRadius: 10, padding: '14px 16px', marginBottom: 16, display: 'flex', gap: 12 }}>
      <span style={{ fontSize: 18, flexShrink: 0, lineHeight: 1.4 }}>{map.icon}</span>
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: map.tc, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{map.label}</div>
        <div style={{ fontSize: 13, color: map.tc, lineHeight: 1.7 }}>{children}</div>
      </div>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>{n}</span>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 6 }}>{title}</div>
        <div style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.7 }}>{children}</div>
      </div>
    </div>
  );
}

function ParamRow({ param, range, effect, unit }: { param: string; range: string; effect: string; unit: string }) {
  return (
    <tr style={{ borderBottom: '1px solid #f3f4f6' }}
      onMouseEnter={e => (e.currentTarget.style.background = '#faf5ff')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
      <td style={{ padding: '10px 14px', fontWeight: 600, color: '#6d28d9', fontSize: 13, fontFamily: 'monospace' }}>{param}</td>
      <td style={{ padding: '10px 14px', fontSize: 12, color: '#6b7280', fontFamily: 'monospace' }}>{range}</td>
      <td style={{ padding: '10px 14px', fontSize: 12, color: '#374151' }}>{unit}</td>
      <td style={{ padding: '10px 14px', fontSize: 12, color: '#374151' }}>{effect}</td>
    </tr>
  );
}

function ScenarioCard({ title, badge, params, what, expect }: {
  title: string; badge: string; params: string[]; what: string; expect: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', display: 'flex', gap: 12, alignItems: 'center', padding: '14px 18px', background: open ? '#faf5ff' : '#fff', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#7c3aed', flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#111827' }}>{title}</span>
        <Badge color="violet">{badge}</Badge>
        <span style={{ color: '#a78bfa', fontSize: 18 }}>{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div style={{ padding: '0 18px 18px', borderTop: '1px solid #f3f4f6' }}>
          <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, marginBottom: 12, marginTop: 14 }}>{what}</p>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Parameter Settings</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {params.map(p => (
                <code key={p} style={{ fontSize: 11, background: '#f5f3ff', border: '1px solid #e9d5ff', color: '#6d28d9', padding: '3px 8px', borderRadius: 6 }}>{p}</code>
              ))}
            </div>
          </div>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Expected Result</div>
            <p style={{ fontSize: 12, color: '#15803d', lineHeight: 1.6 }}>{expect}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ id, num, title, children }: { id: string; num: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} style={{ marginBottom: 56, scrollMarginTop: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, paddingBottom: 16, borderBottom: '2px solid #f3f4f6' }}>
        <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{num}</span>
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: '-0.01em', margin: 0 }}>{title}</h2>
      </div>
      {children}
    </section>
  );
}

// ── page ─────────────────────────────────────────────────────────────────────
export default function UserGuide() {
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif', color: '#111827' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#ddd6fe;border-radius:2px}
      `}</style>

      {/* HEADER */}
      <header style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 40px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 40, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, background: '#7c3aed', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="5" width="14" height="2.5" rx="1" fill="rgba(255,255,255,.3)"/><rect x="1" y="8.5" width="14" height="2.5" rx="1" fill="rgba(255,255,255,.3)"/><circle cx="8" cy="8" r="2.6" fill="#fff"/></svg>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>User Guide</div>
            <div style={{ fontSize: 10, color: '#9ca3af' }}>BioCompute Nanopore Simulator</div>
          </div>
        </div>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f5f3ff', border: '1px solid #e9d5ff', color: '#7c3aed', fontWeight: 600, padding: '7px 14px', borderRadius: 8, fontSize: 12, textDecoration: 'none' }}>
          ← Back to Simulator
        </Link>
      </header>

      {/* BODY */}
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '40px 40px 80px', display: 'grid', gridTemplateColumns: '210px 1fr', gap: 52 }}>

        {/* TOC */}
        <aside style={{ position: 'sticky', top: 80, alignSelf: 'start' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>On this page</div>
          {[
            ['1', 'Interface Overview'],
            ['2', 'Physics Controls'],
            ['3', 'Electronics Controls'],
            ['4', 'Translocation Animation'],
            ['5', 'Reading the Trace'],
            ['6', 'Event List & Zoom'],
            ['7', 'Analysis Tab'],
            ['8', 'SNR & Signal Quality'],
            ['9', 'Guided Experiments'],
            ['10', 'Export & Data'],
            ['11', 'Troubleshooting'],
          ].map(([n, label]) => (
            <a key={n} href={`#sec${n}`}
              style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '5px 0', textDecoration: 'none', color: '#6b7280', fontSize: 12, borderLeft: '2px solid transparent', paddingLeft: 8 }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#7c3aed'; (e.currentTarget as HTMLElement).style.borderLeftColor = '#7c3aed'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#6b7280'; (e.currentTarget as HTMLElement).style.borderLeftColor = 'transparent'; }}>
              <span style={{ width: 18, height: 18, borderRadius: 4, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#9ca3af', flexShrink: 0 }}>{n}</span>
              {label}
            </a>
          ))}
          <div style={{ marginTop: 24, padding: '14px', background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#6d28d9', marginBottom: 6 }}>Quick links</div>
            <Link href="/science" style={{ display: 'block', fontSize: 11, color: '#7c3aed', marginBottom: 4, textDecoration: 'none' }}>📐 Physics Reference</Link>
            <Link href="/" style={{ display: 'block', fontSize: 11, color: '#7c3aed', textDecoration: 'none' }}>🔬 Open Simulator</Link>
          </div>
        </aside>

        {/* MAIN */}
        <main>
          {/* Hero */}
          <div style={{ marginBottom: 52 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <Badge color="violet">v2.0</Badge>
              <Badge color="green">BioCompute Engine</Badge>
            </div>
            <h1 style={{ fontSize: 34, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 14 }}>
              BioCompute <span style={{ color: '#7c3aed' }}>User Guide</span>
            </h1>
            <p style={{ fontSize: 15, color: '#6b7280', lineHeight: 1.8, marginBottom: 20 }}>
              This guide walks you through every feature of the solid-state nanopore simulator — from setting up a virtual experiment to interpreting population scatter plots. Whether you're a first-time user or looking to reproduce specific biophysical conditions, you'll find step-by-step instructions and worked examples throughout.
            </p>
            {/* Quick-start cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              {[
                { emoji: '⚡', title: 'Quick Start', desc: 'Pick a molecule preset, press nothing — the simulation runs live as you adjust sliders.', href: '#sec2' },
                { emoji: '🔬', title: 'Run an Experiment', desc: 'Follow the guided protocols in Section 9 to reproduce known biophysical results.', href: '#sec9' },
                { emoji: '📊', title: 'Analyse Results', desc: 'Switch to the Analysis tab for population histograms, scatter plots, and PSD.', href: '#sec7' },
              ].map(c => (
                <a key={c.title} href={c.href} style={{ textDecoration: 'none', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px', cursor: 'pointer', transition: 'border-color .15s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#c4b5fd')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#e5e7eb')}>
                  <div style={{ fontSize: 22, marginBottom: 8 }}>{c.emoji}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 4 }}>{c.title}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>{c.desc}</div>
                </a>
              ))}
            </div>
          </div>

          {/* ── 1. Interface Overview ── */}
          <Section id="sec1" num="1" title="Interface Overview">
            <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.8, marginBottom: 20 }}>
              The simulator is split into three permanent zones. Understanding each zone will let you work efficiently without hunting for controls.
            </p>

            {/* Layout diagram */}
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', marginBottom: 24, fontFamily: 'monospace', fontSize: 12 }}>
              <div style={{ background: '#7c3aed', padding: '8px 16px', color: '#fff', fontWeight: 600, fontFamily: 'Inter, sans-serif', fontSize: 12, display: 'flex', justifyContent: 'space-between' }}>
                <span>🔬 Nanopore Simulator</span>
                <span style={{ opacity: 0.7 }}>SNR badge · Events count · BioCompute</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', minHeight: 120 }}>
                <div style={{ background: '#f5f3ff', borderRight: '1px solid #e5e7eb', padding: '12px', fontSize: 11, color: '#6d28d9' }}>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>LEFT SIDEBAR</div>
                  <div>📡 Animation</div>
                  <div style={{ marginTop: 4 }}>⚙️ Physics sliders</div>
                  <div style={{ marginTop: 4 }}>🔌 Electronics sliders</div>
                  <div style={{ marginTop: 4 }}>💾 Export CSV</div>
                </div>
                <div style={{ padding: '12px', fontSize: 11, color: '#374151' }}>
                  <div style={{ background: '#f0fdf4', borderRadius: 6, padding: '6px 10px', marginBottom: 6, border: '1px solid #bbf7d0', color: '#15803d', fontWeight: 600 }}>TAB BAR: 📈 Overview | 🔬 Analysis</div>
                  <div style={{ background: '#faf5ff', borderRadius: 6, padding: '6px 10px', marginBottom: 6, border: '1px solid #e9d5ff', color: '#6d28d9' }}>Overview: Current Trace I(t) chart</div>
                  <div style={{ background: '#faf5ff', borderRadius: 6, padding: '6px 10px', border: '1px solid #e9d5ff', color: '#6d28d9' }}>Overview: Translocation Events table</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { zone: 'Header bar', desc: 'Shows live SNR quality (green = good, amber = weak) and total event count. Stays visible at all times.', icon: '📊' },
                { zone: 'Left sidebar', desc: 'The translocation animation + all parameter controls. Scroll down inside it to reach Electronics settings.', icon: '⚙️' },
                { zone: 'Overview tab', desc: 'The main data view: live current trace and the scrollable event table below it. This is where most of your time is spent.', icon: '📈' },
                { zone: 'Analysis tab', desc: 'Population-level plots: current histogram, dwell vs. blockade scatter, and noise PSD. Switch here after collecting events.', icon: '🔬' },
              ].map(z => (
                <div key={z.zone} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 16 }}>{z.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{z.zone}</span>
                  </div>
                  <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>{z.desc}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* ── 2. Physics Controls ── */}
          <Section id="sec2" num="2" title="Physics Parameter Controls">
            <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.8, marginBottom: 20 }}>
              The Physics section in the sidebar controls the geometry and chemistry of the virtual experiment. Changes take effect immediately — the simulation reruns in the background using a deferred renderer so the UI stays responsive.
            </p>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 12 }}>Geometry</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
                <thead style={{ background: '#faf5ff' }}>
                  <tr>
                    {['Parameter', 'Range', 'Unit', 'Effect on signal'].map(h => (
                      <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #e9d5ff' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <ParamRow param="Pore Diameter" range="2 – 50" unit="nm" effect="Controls baseline current, blockade depth, and confinement. Smaller pore → deeper blockade, longer dwell time." />
                  <ParamRow param="Membrane Thickness" range="5 – 100" unit="nm" effect="Longer pore → higher resistance → lower baseline current. Also sets the physical distance the molecule must travel." />
                  <ParamRow param="Applied Voltage" range="10 – 500" unit="mV" effect="Primary driving force. Higher V → faster translocation (shorter dwell), higher current, more events per second." />
                  <ParamRow param="Conductivity" range="1 – 30" unit="S/m" effect="Electrolyte conductivity (KCl molarity proxy). Higher σ → more current. Typical 1M KCl ≈ 10 S/m." />
                </tbody>
              </table>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 12 }}>Molecule Presets</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
                {[
                  { name: 'ssDNA', d: '~1.0', z: '30', note: 'Flexible, single-stranded. Low confinement ratio in typical pores.', color: '#7c3aed' },
                  { name: 'dsDNA', d: '~2.2', z: '60', note: 'Rigid double helix. Mobility modifier 0.6× vs ssDNA. Most-studied analyte.', color: '#0891b2' },
                  { name: 'BSA Protein', d: '~6.0', z: '15', note: 'Globular protein. Low charge, slow translocation. Mobility 0.3×.', color: '#059669' },
                  { name: 'Gold NP', d: '~15', z: '100', note: 'Large rigid nanoparticle. Strong blockade signal, high excluded volume.', color: '#d97706' },
                ].map(m => (
                  <div key={m.name} style={{ background: '#fff', border: `1px solid #e5e7eb`, borderTop: `3px solid ${m.color}`, borderRadius: 10, padding: '12px' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: m.color, marginBottom: 6 }}>{m.name}</div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>Ø {m.d} nm</div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>z = {m.z} e</div>
                    <div style={{ fontSize: 11, color: '#374151', lineHeight: 1.5 }}>{m.note}</div>
                  </div>
                ))}
              </div>
              <Tip type="tip">Selecting a preset auto-fills Diameter and Charge. You can then nudge the sliders away from the preset values — the label will switch to "Custom".</Tip>
            </div>

            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 12 }}>Pore Geometry Deep-Dive</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {[
                  { name: 'Cylindrical', desc: 'Uniform bore. Symmetric signal. Most common for SiN membranes. Baseline resistance = 4ρL/πd².', use: 'DNA sizing, protein detection' },
                  { name: 'Conical', desc: 'Tapers from wide base to narrow tip. Asymmetric signal shape. Tip diameter governs blockade depth.', use: 'Glass nanopipettes, rectification studies' },
                  { name: 'Hourglass', desc: 'Double symmetric taper. Narrowest at the waist. Lowest access resistance. Used in 2D material pores.', use: 'MoS₂, graphene membranes' },
                ].map(g => (
                  <div key={g.name} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#111827', marginBottom: 6 }}>{g.name}</div>
                    <p style={{ fontSize: 12, color: '#4b5563', lineHeight: 1.6, marginBottom: 8 }}>{g.desc}</p>
                    <div style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Typical use</div>
                    <div style={{ fontSize: 11, color: '#7c3aed', fontWeight: 500 }}>{g.use}</div>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* ── 3. Electronics Controls ── */}
          <Section id="sec3" num="3" title="Electronics Parameter Controls">
            <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.8, marginBottom: 20 }}>
              The Electronics section simulates the measurement chain downstream of the pore: the TIA amplifier, low-pass filter, and ADC digitiser. These controls determine how faithfully short, deep events can be detected.
            </p>

            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden', marginBottom: 20 }}>
              <thead style={{ background: '#f0fdf4' }}>
                <tr>
                  {['Parameter', 'Range', 'Unit', 'Effect on signal'].map(h => (
                    <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #bbf7d0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <ParamRow param="TIA Bandwidth" range="1k – 200k" unit="Hz" effect="Sets the IIR filter cutoff. Higher BW → faster rise/fall time → short events preserved but more noise passes through." />
                <ParamRow param="Noise Floor" range="0.1 – 5.0" unit="nA RMS" effect="Amplifier Johnson/shot noise. Must be less than the blockade depth for events to be detectable (SNR > 3)." />
                <ParamRow param="Sampling Rate" range="5k – 500k" unit="Hz" effect="Must be ≥ 2× bandwidth (Nyquist). Low sampling rate smears short events. Rule of thumb: f_s ≥ 5× f_BW." />
                <ParamRow param="ADC Resolution" range="4 – 16" unit="bits" effect="Sets quantisation step size. 12-bit gives 4096 levels. Below 8-bit, quantisation noise becomes significant." />
              </tbody>
            </table>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '16px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#111827', marginBottom: 10 }}>Bandwidth vs. Event Duration</div>
                <p style={{ fontSize: 12, color: '#4b5563', lineHeight: 1.7, marginBottom: 10 }}>An event with dwell time τ requires bandwidth of at least <code style={{ background: '#f3f4f6', padding: '1px 5px', borderRadius: 4, fontSize: 11 }}>f_BW ≈ 0.35/τ</code> to be faithfully captured. If your events are 0.05 ms, you need BW ≥ 7 kHz.</p>
                <Tip type="example">dsDNA at 200 mV in a 10 nm pore → dwell ≈ 0.14 ms → minimum BW = 0.35/0.00014 ≈ 2.5 kHz. Set BW to 10 kHz for safe margin.</Tip>
              </div>
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '16px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#111827', marginBottom: 10 }}>Nyquist & Dynamic Range readouts</div>
                <p style={{ fontSize: 12, color: '#4b5563', lineHeight: 1.7, marginBottom: 10 }}>Two computed values appear below the electronics sliders:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 7, padding: '8px 10px', fontSize: 12, color: '#15803d' }}>
                    <strong>Nyquist limit</strong> = f_s / 2. Frequencies above this fold back as aliasing. Always keep BW &lt; Nyquist.
                  </div>
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 7, padding: '8px 10px', fontSize: 12, color: '#15803d' }}>
                    <strong>Dynamic range</strong> ≈ 6.02 × N dB. 12-bit ADC → 72 dB. More bits = finer resolution between noise floor and full-scale.
                  </div>
                </div>
              </div>
            </div>
          </Section>

          {/* ── 4. Animation ── */}
          <Section id="sec4" num="4" title="Translocation Animation">
            <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.8, marginBottom: 20 }}>
              The animation at the top of the sidebar gives a real-time visual representation of the physics as you adjust sliders.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
              {[
                { label: 'Purple dot', desc: 'The analyte molecule traversing the pore. Its size is drawn to scale relative to the pore diameter — you can see confinement visually.' },
                { label: 'CIS / TRANS labels', desc: 'CIS = the chamber where molecules start. TRANS = destination chamber. The voltage drives transport from CIS→TRANS.' },
                { label: 'Membrane band', desc: 'The lavender rectangle. Width corresponds to membrane thickness. The white gap is the pore channel (shape changes with geometry).' },
                { label: 'Ion drift dots', desc: 'Small dots drifting through the pore channel represent ion flow. They show current direction and pore accessibility.' },
                { label: 'Voltage arrow', desc: 'Right-side indicator showing current direction. Arrowhead points toward TRANS (conventional current direction).' },
                { label: 'Dimension labels', desc: 'Pore diameter bracket and membrane thickness annotation update live as you move sliders.' },
              ].map(f => (
                <div key={f.label} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 9, padding: '12px 14px', display: 'flex', gap: 10 }}>
                  <div style={{ width: 3, background: '#7c3aed', borderRadius: 2, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#111827', marginBottom: 3 }}>{f.label}</div>
                    <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <Tip type="tip">Try dragging <strong>Molecule Diameter</strong> close to <strong>Pore Diameter</strong>. Watch the dot nearly fill the pore — this is the high-confinement regime where Faxén drag slows the molecule dramatically and dwell time spikes up.</Tip>
          </Section>

          {/* ── 5. Reading the Trace ── */}
          <Section id="sec5" num="5" title="Reading the Current Trace">
            <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.8, marginBottom: 20 }}>
              The Current Trace I(t) chart is the primary data view. It shows 50 ms of simulated ionic current. Here's how to read every element on it.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[
                { sym: '— —', color: '#d1d5db', label: 'Dashed grey line', desc: 'The ideal, noise-free current. Shows exactly when events occur and their true depth, before amplifier and ADC processing.' },
                { sym: '——', color: '#7c3aed', label: 'Solid purple line', desc: 'Measured (realistic) current: noisy, bandwidth-limited, and quantised. This is what a real patch-clamp amplifier would record.' },
                { sym: '- -', color: '#a78bfa', label: 'Baseline reference', desc: 'Dashed horizontal line at I₀ (open-pore current). All blockade depths are measured downward from this level.' },
              ].map(e => (
                <div key={e.label} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ fontSize: 18, color: e.color, fontWeight: 900, flexShrink: 0, lineHeight: 1 }}>{e.sym}</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#111827', marginBottom: 4 }}>{e.label}</div>
                    <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>{e.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px', marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 14 }}>Anatomy of a single event</div>
              {/* ASCII event diagram */}
              <div style={{ background: '#faf5ff', borderRadius: 8, padding: '16px', fontFamily: 'monospace', fontSize: 11, color: '#374151', marginBottom: 14, lineHeight: 2 }}>
                <div>I₀ ───────────────╮              ╭────────────── baseline (open pore)</div>
                <div>                  │              │</div>
                <div>I_block           ╰──────────────╯               ← blockade level</div>
                <div style={{ color: '#7c3aed' }}>                  ←  dwell time τ  →</div>
                <div>                  ↑              ↑</div>
                <div>              start_time    end_time = start + τ</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {[
                  { term: 'Dwell time τ', formula: 'end − start (ms)', desc: 'How long the molecule spent inside the pore. Longer τ = slower molecule (larger, tighter confinement, or lower voltage).' },
                  { term: 'Blockade depth ΔI', formula: 'I₀ − I_block (nA)', desc: 'How much current was blocked. Deeper = larger excluded volume relative to pore cross-section.' },
                  { term: 'Blockade % depth', formula: 'ΔI / I₀ × 100', desc: 'Fractional conductance reduction. Species-specific. dsDNA typically 5–15% in 10 nm pores.' },
                ].map(t => (
                  <div key={t.term} style={{ background: '#fafafa', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#111827', marginBottom: 2 }}>{t.term}</div>
                    <code style={{ fontSize: 10, background: '#ede9fe', color: '#6d28d9', padding: '1px 6px', borderRadius: 4, display: 'inline-block', marginBottom: 6 }}>{t.formula}</code>
                    <p style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.5 }}>{t.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <Tip type="warn">If you see no dips in the trace (flat baseline), events are occurring but the noise is masking them. Lower the Noise Floor or increase Voltage/Concentration until the SNR badge turns green.</Tip>
          </Section>

          {/* ── 6. Event List & Zoom ── */}
          <Section id="sec6" num="6" title="Event List & Trace Zoom">
            <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.8, marginBottom: 20 }}>
              The Translocation Events table lives directly below the trace. It lists every detected event with key statistics, and connects directly to the chart for single-event inspection.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              <Step n={1} title="Open the event list">
                Scroll down below the Current Trace panel. The event table is always visible — no button to click. You'll see columns: #, Start, Dwell, Blockade, and % Depth.
              </Step>
              <Step n={2} title="Click any row to zoom">
                Clicking a row immediately transforms the trace chart above into a zoomed view centred on that event. The window width is ±10× the event's dwell time (minimum ±0.5 ms), so very short events are still clearly visible.
              </Step>
              <Step n={3} title="Read the event detail panel">
                A purple detail card appears to the right of the zoomed chart showing Start time, Dwell, Blockade depth, and a % depth bar. The dashed horizontal line on the zoomed chart marks the exact blockade level.
              </Step>
              <Step n={4} title="Navigate between events">
                Use the ← Prev / Next → buttons in the detail card to walk through events in order without going back to the table.
              </Step>
              <Step n={5} title="Return to full trace">
                Click "Show full trace ×" at the top-right of the chart header, or click the active row again to deselect.
              </Step>
            </div>

            <Tip type="info">The tab bar shows a persistent "Event #N highlighted" pill while any event is selected. Switching to the Analysis tab and back preserves your selection.</Tip>

            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '16px', marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#111827', marginBottom: 10 }}>% Depth colour bar</div>
              <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.7 }}>Each row shows a small purple progress bar in the % Depth column. The fill is <code style={{ background: '#f3f4f6', padding: '1px 5px', borderRadius: 4, fontSize: 11 }}>ΔI / I₀ × 100</code>. A bar filling 50% means the molecule blocked half the pore cross-section — which for a cylindrical pore means the molecule's diameter is ~70% of the pore diameter (since area ∝ d²).</p>
            </div>
          </Section>

          {/* ── 7. Analysis Tab ── */}
          <Section id="sec7" num="7" title="Analysis Tab — Population Plots">
            <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.8, marginBottom: 20 }}>
              Switch to the Analysis tab to see three charts that aggregate all detected events into population-level views. These are essential for distinguishing molecular species and validating signal quality.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Current Distribution</div>
                  <Badge color="violet">50 bins</Badge>
                </div>
                <p style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.7, marginBottom: 10 }}>A histogram of all current values in the 50 ms trace. You'll see:</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { label: 'Tall peak at I₀', desc: 'The baseline (open pore) state. Occupies most of the recording time.' },
                    { label: 'Smaller left peak', desc: 'Blockade current level. More events = taller secondary peak.' },
                    { label: 'Separation', desc: 'The gap between peaks ≈ blockade depth ΔI. Wider gap = deeper blockade.' },
                    { label: 'Narrow vs. wide', desc: 'Peak width reflects noise floor σ. Wide peaks indicate poor SNR.' },
                  ].map(h => (
                    <div key={h.label} style={{ background: '#fafafa', borderRadius: 7, padding: '8px 10px', fontSize: 12 }}>
                      <div style={{ fontWeight: 600, color: '#374151', marginBottom: 2 }}>{h.label}</div>
                      <div style={{ color: '#6b7280', lineHeight: 1.5 }}>{h.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Event Scatter Plot</div>
                  <Badge color="violet">Dwell × Blockade</Badge>
                </div>
                <p style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.7, marginBottom: 12 }}>
                  This is the most information-rich chart. Each dot is one event, plotted as (Dwell Time, Blockade Depth). This 2D scatter is the standard fingerprint method for nanopore sensing.
                </p>
                <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 8, padding: '12px 14px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>How to interpret clusters</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[
                      ['Top-left cluster', 'Short dwell + shallow blockade', 'Small fast molecule (e.g. ssDNA at high voltage)'],
                      ['Bottom-right cluster', 'Long dwell + deep blockade', 'Large slow molecule (e.g. protein, nanoparticle)'],
                      ['Vertical spread', 'Fixed depth, variable dwell', 'Rotational orientation effects'],
                      ['Horizontal spread', 'Fixed dwell, variable depth', 'Pore-to-pore variability or partial-blockade events'],
                    ].map(([cluster, meaning, example]) => (
                      <div key={cluster} style={{ display: 'grid', gridTemplateColumns: '120px 160px 1fr', gap: 8, fontSize: 11, padding: '4px 0', borderBottom: '1px solid #f3f4f6', alignItems: 'center' }}>
                        <code style={{ color: '#6d28d9', fontWeight: 600 }}>{cluster}</code>
                        <span style={{ color: '#374151' }}>{meaning}</span>
                        <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>{example}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Noise PSD</div>
                  <Badge color="green">Hann · AC-FFT</Badge>
                </div>
                <p style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.7, marginBottom: 10 }}>
                  The Power Spectral Density plots noise power (dB) vs. frequency (log scale). This tells you where your noise budget is being spent.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {[
                    { label: '1/f region (low freq)', desc: 'Rising slope at left. Flicker noise. Dominant below ~1 kHz.' },
                    { label: 'Flat plateau', desc: 'Thermal (Johnson) noise floor. Set by noise_level slider.' },
                    { label: 'Roll-off (high freq)', desc: 'BW-limited cutoff from the IIR filter. Should match your TIA bandwidth setting.' },
                  ].map(p => (
                    <div key={p.label} style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 7, padding: '8px 10px', fontSize: 12 }}>
                      <div style={{ fontWeight: 600, color: '#15803d', marginBottom: 3 }}>{p.label}</div>
                      <div style={{ color: '#4b5563', lineHeight: 1.5 }}>{p.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Section>

          {/* ── 8. SNR ── */}
          <Section id="sec8" num="8" title="SNR & Signal Quality">
            <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.8, marginBottom: 20 }}>
              The Signal-to-Noise Ratio badge in the header is the fastest health-check for your experiment. It computes the mean blockade depth divided by the RMS noise floor.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '16px' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#15803d' }}>SNR &gt; 3 — Good signal</span>
                </div>
                <p style={{ fontSize: 12, color: '#15803d', lineHeight: 1.6 }}>Events are clearly resolvable above noise. The detector will reliably identify all translocation events. Most quantitative analysis is reliable at SNR &gt; 5.</p>
              </div>
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '16px' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#b45309' }}>SNR ≤ 3 — Weak signal</span>
                </div>
                <p style={{ fontSize: 12, color: '#b45309', lineHeight: 1.6 }}>Events may be missed or falsely detected. Increase voltage, decrease noise floor, or use a smaller pore to improve blockade depth.</p>
              </div>
            </div>

            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '16px', marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#111827', marginBottom: 10 }}>How to improve SNR — in order of effectiveness</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  ['Reduce pore diameter', 'Increases ΔI/I₀ ratio. Going from 20 nm to 10 nm quadruples the blockade depth.', '↑↑↑'],
                  ['Increase applied voltage', 'Linearly increases I₀ and ΔI. Doubles SNR when doubled. Side effect: shorter dwell time.', '↑↑'],
                  ['Lower noise floor slider', 'Direct reduction of σ. Represents better amplifier hardware.', '↑↑'],
                  ['Reduce TIA bandwidth', 'Filters out high-frequency noise. Side effect: smears short events. Set to minimum that still captures your events.', '↑'],
                  ['Increase concentration', 'More events per second — doesn\'t change SNR per event but improves statistics.', '→'],
                ].map(([action, why, impact]) => (
                  <div key={action} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 40px', gap: 10, alignItems: 'center', padding: '8px 10px', background: '#fafafa', borderRadius: 7, fontSize: 12 }}>
                    <span style={{ fontWeight: 600, color: '#374151' }}>{action}</span>
                    <span style={{ color: '#6b7280', lineHeight: 1.5 }}>{why}</span>
                    <span style={{ color: '#7c3aed', fontWeight: 700, fontFamily: 'monospace' }}>{impact}</span>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* ── 9. Guided Experiments ── */}
          <Section id="sec9" num="9" title="Guided Experiments">
            <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.8, marginBottom: 20 }}>
              These step-by-step protocols reproduce well-known biophysical results. Click any scenario to expand the full parameter set and expected outcome.
            </p>

            <ScenarioCard
              title="Experiment 1 — dsDNA sizing in SiN nanopore"
              badge="Beginner"
              what="Reproduce a classic dsDNA translocation experiment. A 10 nm cylindrical SiN pore at 100 mV in 1M KCl (σ = 10 S/m) is the most commonly reported condition in literature."
              params={['Material: SiN', 'Shape: Cylindrical', 'Pore Ø: 10 nm', 'Membrane: 20 nm', 'Molecule: dsDNA', 'Voltage: 100 mV', 'Conc: 10 nM', 'BW: 10 kHz', 'f_s: 100 kHz']}
              expect="You should see 5–30 events in the 50 ms window. Blockade depth ~5–12%, dwell times 0.05–0.5 ms. SNR should be green (>3). The scatter plot should form a tight cluster in the low-dwell, moderate-depth quadrant."
            />

            <ScenarioCard
              title="Experiment 2 — Voltage-dependent dwell time"
              badge="Intermediate"
              what="Verify that dwell time scales inversely with applied voltage (τ ∝ 1/V). Run the same setup at 50 mV, 100 mV, 200 mV and 400 mV. The dwell time should halve each time voltage doubles."
              params={['Molecule: dsDNA', 'Pore Ø: 10 nm', 'Membrane: 30 nm', 'Conc: 50 nM', 'Run at V = 50 / 100 / 200 / 400 mV']}
              expect="At 50 mV: dwell ~0.4–0.8 ms. At 100 mV: ~0.2–0.4 ms. At 200 mV: ~0.1–0.2 ms. At 400 mV: ~0.05–0.1 ms. Export CSV at each voltage and compare event tables."
            />

            <ScenarioCard
              title="Experiment 3 — Faxén confinement effect"
              badge="Intermediate"
              what="Demonstrate wall drag by varying the molecule-to-pore size ratio λ. Keep everything constant except molecule diameter. At λ > 0.8 the Faxén correction causes dwell time to increase non-linearly."
              params={['Molecule: Custom', 'Pore Ø: 10 nm', 'Voltage: 200 mV', 'Conc: 100 nM', 'Vary Mol. Ø: 2→4→6→8→9 nm (λ = 0.2→0.9)']}
              expect="Dwell time should be roughly constant from λ=0.2–0.5, then increase sharply above λ=0.7. At λ=0.9 expect 5–20× longer dwell than at λ=0.2. Watch the animation — the dot nearly fills the pore at high λ."
            />

            <ScenarioCard
              title="Experiment 4 — Multi-species discrimination"
              badge="Advanced"
              what="Simulate a mixed sample with two distinct molecular populations by running two separate parameter sets and comparing scatter plots. In real experiments, you would see two clusters in dwell × depth space."
              params={['Run 1: ssDNA — Pore Ø 8 nm, Mol Ø 1 nm, z=30, V=200 mV', 'Run 2: BSA Protein — Pore Ø 8 nm, Mol Ø 6 nm, z=15, V=200 mV']}
              expect="ssDNA: fast events (τ < 0.1 ms), shallow blockade (~2%). BSA: slow events (τ > 1 ms), deep blockade (~50%). Two well-separated scatter clusters — this is how species discrimination works in real nanopore sensing."
            />

            <ScenarioCard
              title="Experiment 5 — Capacitive noise and membrane material"
              badge="Advanced"
              what="Compare noise PSD across three membrane materials at identical geometry. Graphene has the lowest dielectric constant (εᵣ ≈ 2.5) and lowest capacitance. Higher capacitance → more dielectric noise at high frequency."
              params={['Pore Ø: 5 nm', 'Membrane: 10 nm', 'Voltage: 200 mV', 'BW: 100 kHz', 'f_s: 500 kHz', 'Switch Material: SiN → MoS₂ → Graphene', 'Observe PSD in Analysis tab']}
              expect="SiN (εᵣ=7.5) shows highest capacitance (~3 pF) and most noise at high frequency. Graphene (εᵣ=2.5) shows ~3× lower capacitance and a flatter PSD. The high-frequency roll-off shifts with each material."
            />
          </Section>

          {/* ── 10. Export ── */}
          <Section id="sec10" num="10" title="Exporting Data">
            <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.8, marginBottom: 20 }}>
              Click the <strong>Export CSV</strong> button at the bottom of the sidebar to download the current simulation trace as a comma-separated values file.
            </p>

            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '16px', marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#111827', marginBottom: 10 }}>CSV file format</div>
              <code style={{ display: 'block', background: '#f8f7ff', border: '1px solid #ede9fe', borderRadius: 8, padding: '12px 14px', fontSize: 11, color: '#374151', fontFamily: 'monospace', lineHeight: 1.8 }}>
                Time (ms),Measured (nA),Ideal (nA){'\n'}
                0.010,6.243,6.201{'\n'}
                0.020,6.189,6.201{'\n'}
                0.030,5.112,5.087   ← event starts here{'\n'}
                ...
              </code>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Analysing in Python</div>
                <code style={{ display: 'block', background: '#1e1b4b', color: '#c4b5fd', borderRadius: 8, padding: '12px', fontSize: 11, fontFamily: 'monospace', lineHeight: 1.8 }}>
                  {`import pandas as pd\nimport matplotlib.pyplot as plt\n\ndf = pd.read_csv('nanopore.csv')\nplt.plot(df['Time (ms)'],\n         df['Measured (nA)'])\nplt.xlabel('Time (ms)')\nplt.ylabel('Current (nA)')\nplt.show()`}
                </code>
              </div>
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Detecting events in Python</div>
                <code style={{ display: 'block', background: '#1e1b4b', color: '#c4b5fd', borderRadius: 8, padding: '12px', fontSize: 11, fontFamily: 'monospace', lineHeight: 1.8 }}>
                  {`import numpy as np\n\nbaseline = df['Ideal (nA)'].max()\nthreshold = baseline * 0.95\n\nevents = df[\n  df['Measured (nA)'] < threshold\n]\nprint(f"{len(events)} samples below threshold")`}
                </code>
              </div>
            </div>

            <Tip type="tip" >For dwell time analysis, consider using the <a href="https://github.com/rhenry-nist/nanopore-analysis" target="_blank" rel="noopener" style={{ color: '#7c3aed' }}>nanopore-analysis</a> Python library or loading the CSV into <strong>MOSAIC</strong> (Multi-State Single-Molecule Analysis) — both accept this exact column format.</Tip>
          </Section>

          {/* ── 11. Troubleshooting ── */}
          <Section id="sec11" num="11" title="Troubleshooting">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                {
                  q: 'No events are appearing in the trace',
                  a: [
                    'Increase Concentration (try 100–200 nM)',
                    'Increase Applied Voltage (try 300–500 mV)',
                    'Check that Molecule Diameter < Pore Diameter — if λ ≥ 1, the molecule cannot physically enter the pore',
                    'Try a smaller molecule preset (ssDNA works in most pore sizes)',
                  ],
                },
                {
                  q: 'Too many events — trace is noisy/saturated',
                  a: [
                    'Lower Concentration to 1–10 nM',
                    'Lower Voltage to 50–100 mV',
                    'Events should ideally occur at 0.1–10 per millisecond for clean analysis',
                  ],
                },
                {
                  q: 'SNR badge is amber even with many events',
                  a: [
                    'Lower the Noise Floor slider (amplifier noise is too high)',
                    'Reduce TIA Bandwidth (cuts high-frequency noise)',
                    'Use a smaller pore — smaller pore = deeper ΔI/I₀',
                    'If using Protein preset, increase voltage to compensate for the 0.3× mobility modifier',
                  ],
                },
                {
                  q: 'Event list shows events but the scatter plot is empty',
                  a: [
                    'Switch to the Analysis tab — scatter plot is on that tab, not the Overview tab',
                    'If still empty, try reloading — a very short simulation window may produce 0 events',
                  ],
                },
                {
                  q: 'Dwell times seem too long/unrealistically slow',
                  a: [
                    'Check that molecule diameter is not close to pore diameter — Faxén drag increases dwell exponentially above λ = 0.7',
                    'Increase voltage to drive the molecule faster',
                    'For proteins, remember the 0.3× mobility modifier — try doubling voltage compared to DNA experiments',
                  ],
                },
                {
                  q: 'The zoomed trace does not clearly show the event',
                  a: [
                    'Very short events (< 0.02 ms) may still be hard to see even when zoomed. Reduce voltage to lengthen dwell time.',
                    'Lower Noise Floor to make the current drop more visible relative to background noise',
                    'Use dsDNA preset which has a 0.85× depth correction giving more realistic blockade depths',
                  ],
                },
              ].map(({ q, a }) => (
                <details key={q} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
                  <summary style={{ padding: '13px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#111827', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>❓ {q}</span>
                    <span style={{ color: '#a78bfa', fontSize: 18 }}>+</span>
                  </summary>
                  <div style={{ padding: '0 18px 16px', borderTop: '1px solid #f3f4f6' }}>
                    <ul style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {a.map((item, i) => (
                        <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: '#374151', lineHeight: 1.6 }}>
                          <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#f5f3ff', border: '1px solid #e9d5ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#7c3aed', flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </details>
              ))}
            </div>
          </Section>

          {/* Footer */}
          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: 11, color: '#9ca3af' }}>Powered by </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed' }}>BioCompute</span>
              <span style={{ fontSize: 11, color: '#9ca3af' }}> · Solid-state nanopore simulation engine</span>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <Link href="/science" style={{ fontSize: 12, color: '#7c3aed', textDecoration: 'none', fontWeight: 500 }}>Physics Reference →</Link>
              <Link href="/" style={{ fontSize: 12, color: '#7c3aed', textDecoration: 'none', fontWeight: 500 }}>Open Simulator →</Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}