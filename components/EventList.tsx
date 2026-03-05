// components/EventList.tsx
"use client";

import { useState } from 'react';

export interface DetectedEvent {
  start_time: number;
  dwell_time_ms: number;
  blockade_depth_na: number;
}

interface Props {
  events: DetectedEvent[];
  selectedIndex: number | null;
  onSelect: (index: number | null) => void;
  baselineI: number;
}

export default function EventList({ events, selectedIndex, onSelect, baselineI }: Props) {
  const [open, setOpen] = useState(false);

  const avgDwell = events.length
    ? events.reduce((s, e) => s + e.dwell_time_ms, 0) / events.length : 0;
  const avgDepth = events.length
    ? events.reduce((s, e) => s + e.blockade_depth_na, 0) / events.length : 0;

  return (
    <div style={{
      background: '#fff', border: '1px solid #e5e7eb',
      borderRadius: 12, overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      fontFamily: 'Inter, sans-serif',
    }}>

      {/* ── ALWAYS-VISIBLE TRIGGER ROW ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 18px',
        borderBottom: open ? '1px solid #f3f4f6' : 'none',
        background: open ? '#faf5ff' : '#fff',
      }}>
        {/* Left: title + count badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Icon */}
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: '#f5f3ff', border: '1px solid #e9d5ff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M2 4h11M2 7.5h8M2 11h5" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', lineHeight: 1.3 }}>
              Translocation Events
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.3 }}>
              {events.length === 0
                ? 'No events detected'
                : `${events.length} event${events.length !== 1 ? 's' : ''} — click a row to highlight on trace`}
            </div>
          </div>

          {events.length > 0 && (
            <span style={{
              fontSize: 11, fontWeight: 700, color: '#7c3aed',
              background: '#f5f3ff', border: '1px solid #e9d5ff',
              borderRadius: 20, padding: '2px 10px', marginLeft: 4,
            }}>
              {events.length}
            </span>
          )}
        </div>

        {/* Right: the obvious click-to-open button */}
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '7px 14px',
            background: open ? '#ede9fe' : '#7c3aed',
            border: 'none', borderRadius: 8,
            color: open ? '#7c3aed' : '#fff',
            fontSize: 12, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            transition: 'all 0.15s',
            flexShrink: 0,
          }}
          onMouseEnter={e => {
            if (!open) (e.currentTarget as HTMLElement).style.background = '#6d28d9';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = open ? '#ede9fe' : '#7c3aed';
          }}
        >
          {open ? (
            <>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 8.5L6 4.5L10 8.5" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Hide Events
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 3.5L6 7.5L10 3.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              View Event List
            </>
          )}
        </button>
      </div>

      {/* ── EXPANDED PANEL ── */}
      {open && (
        <div>
          {events.length === 0 ? (
            <div style={{ padding: '32px 18px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🔬</div>
              <p style={{ fontSize: 12, color: '#9ca3af' }}>
                No translocation events detected.<br />
                Try increasing concentration or applied voltage.
              </p>
            </div>
          ) : (
            <>
              {/* Summary stat row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: '1px solid #f3f4f6' }}>
                {[
                  { label: 'Total Events', value: String(events.length) },
                  { label: 'Avg Dwell', value: `${avgDwell.toFixed(3)} ms` },
                  { label: 'Avg Blockade', value: `${avgDepth.toFixed(3)} nA` },
                  { label: 'Baseline', value: `${baselineI.toFixed(3)} nA` },
                ].map((s, i) => (
                  <div key={i} style={{
                    padding: '10px 14px', textAlign: 'center',
                    borderRight: i < 3 ? '1px solid #f3f4f6' : 'none',
                    background: '#fafafa',
                  }}>
                    <div style={{ fontSize: 9, fontWeight: 500, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{s.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Instruction banner */}
              <div style={{
                padding: '8px 18px', background: '#fffbeb',
                borderBottom: '1px solid #fde68a',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <circle cx="6.5" cy="6.5" r="6" stroke="#f59e0b" strokeWidth="1" />
                  <path d="M6.5 5.5v4M6.5 4h.01" stroke="#f59e0b" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                <span style={{ fontSize: 11, color: '#92400e' }}>
                  Click any row to highlight that event on the trace. Click again to deselect.
                </span>
                {selectedIndex !== null && (
                  <span style={{
                    marginLeft: 'auto', fontSize: 10, fontWeight: 600,
                    color: '#059669', background: '#ecfdf5',
                    border: '1px solid #a7f3d0', borderRadius: 6, padding: '2px 8px',
                  }}>
                    ✓ Event #{selectedIndex + 1} highlighted on trace
                  </span>
                )}
              </div>

              {/* Table header */}
              <div style={{
                display: 'grid', gridTemplateColumns: '40px 1fr 1fr 1fr 140px',
                padding: '7px 18px', background: '#fafafa', borderBottom: '1px solid #f3f4f6',
              }}>
                {['#', 'Start Time', 'Dwell Time', 'Blockade Depth', '% Blockade'].map((h, i) => (
                  <span key={i} style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
                ))}
              </div>

              {/* Rows */}
              <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                {events.map((evt, i) => {
                  const isSelected = selectedIndex === i;
                  const pct = baselineI > 0 ? (evt.blockade_depth_na / baselineI) * 100 : 0;
                  return (
                    <div
                      key={i}
                      onClick={() => onSelect(isSelected ? null : i)}
                      style={{
                        display: 'grid', gridTemplateColumns: '40px 1fr 1fr 1fr 140px',
                        padding: '10px 18px', cursor: 'pointer',
                        borderBottom: '1px solid #f9fafb',
                        borderLeft: `3px solid ${isSelected ? '#7c3aed' : 'transparent'}`,
                        background: isSelected ? '#f5f3ff' : 'transparent',
                        alignItems: 'center',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = '#fafafa'; }}
                      onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    >
                      {/* Index */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{
                          width: 22, height: 22, borderRadius: 6,
                          background: isSelected ? '#7c3aed' : '#f3f4f6',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: isSelected ? '#fff' : '#6b7280' }}>{i + 1}</span>
                        </div>
                      </div>

                      <span style={{ fontSize: 12, color: '#374151' }}>{evt.start_time.toFixed(3)} ms</span>
                      <span style={{ fontSize: 12, color: '#374151' }}>{evt.dwell_time_ms.toFixed(3)} ms</span>
                      <span style={{ fontSize: 12, color: '#374151' }}>{evt.blockade_depth_na.toFixed(3)} nA</span>

                      {/* % bar */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 5, background: '#ede9fe', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{
                            width: `${Math.min(pct, 100)}%`, height: '100%',
                            background: isSelected ? '#7c3aed' : '#a78bfa',
                            borderRadius: 3, transition: 'width 0.3s',
                          }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#7c3aed', width: 32, textAlign: 'right' }}>
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}