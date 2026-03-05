/* eslint-disable @typescript-eslint/no-explicit-any */
// components/TraceChart.tsx
"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ReferenceArea, Label,
} from 'recharts';
import { DetectedEvent } from './EventList';

interface TracePoint {
  time: number;
  current: number;
  idealCurrent: number;
}

interface Props {
  chartData: TracePoint[];
  eventData: DetectedEvent[];
  selectedEventIndex: number | null;
  baselineI: number;
}

const AXIS = { fontFamily: 'Inter, sans-serif', fontSize: 10, fill: '#9ca3af' };

function TraceTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8,
      padding: '8px 12px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
      fontFamily: 'Inter, sans-serif', fontSize: 11,
    }}>
      <div style={{ color: '#9ca3af', marginBottom: 5, fontSize: 10 }}>{Number(label).toFixed(3)} ms</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <div style={{ width: 8, height: 2, background: p.color, borderRadius: 1, flexShrink: 0 }} />
          <span style={{ color: '#6b7280' }}>{p.name}:</span>
          <span style={{ fontWeight: 600, color: '#111827' }}>{Number(p.value).toFixed(3)} nA</span>
        </div>
      ))}
    </div>
  );
}

export default function TraceChart({ chartData, eventData, selectedEventIndex, baselineI }: Props) {
  const selectedEvt = selectedEventIndex !== null ? eventData[selectedEventIndex] : null;

  return (
    <div style={{ height: 240 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 16, right: 20, left: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 4" stroke="#f3f4f6" />

          <XAxis dataKey="time" tick={AXIS} tickLine={false} axisLine={{ stroke: '#e5e7eb' }}
            label={{ value: 'Time (ms)', position: 'insideBottomRight', offset: -4, style: { fontSize: 10, fill: '#9ca3af', fontFamily: 'Inter, sans-serif' } }} />
          <YAxis tick={AXIS} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} width={52}
            label={{ value: 'Current (nA)', angle: -90, position: 'insideLeft', offset: 14, style: { fontSize: 10, fill: '#9ca3af', fontFamily: 'Inter, sans-serif' } }} />

          <Tooltip content={<TraceTooltip />} />

          {/* Baseline dashed reference */}
          {baselineI > 0 && (
            <ReferenceLine y={baselineI} stroke="#ddd6fe" strokeDasharray="4 4" strokeWidth={1.5}>
              <Label value="baseline" position="insideTopRight"
                style={{ fontSize: 9, fill: '#a78bfa', fontFamily: 'Inter, sans-serif' }} />
            </ReferenceLine>
          )}

          {/* Dim all other events as light bands */}
          {selectedEvt && eventData.map((evt, i) => {
            if (i === selectedEventIndex) return null;
            return (
              <ReferenceArea key={`bg-${i}`}
                x1={evt.start_time} x2={evt.start_time + evt.dwell_time_ms}
                fill="#7c3aed" fillOpacity={0.04}
                stroke="none" />
            );
          })}

          {/* Selected event: bright highlighted band */}
          {selectedEvt && (
            <ReferenceArea
              x1={selectedEvt.start_time}
              x2={selectedEvt.start_time + selectedEvt.dwell_time_ms}
              fill="#7c3aed" fillOpacity={0.12}
              stroke="#7c3aed" strokeWidth={1.5} strokeOpacity={0.6}
            />
          )}

          {/* Selected event: vertical midpoint line with label */}
          {selectedEvt && (
            <ReferenceLine
              x={selectedEvt.start_time + selectedEvt.dwell_time_ms / 2}
              stroke="#7c3aed" strokeWidth={1.5} strokeDasharray="3 3"
            >
              <Label
                value={`#${(selectedEventIndex as number) + 1}  ${selectedEvt.dwell_time_ms.toFixed(2)}ms  ↓${selectedEvt.blockade_depth_na.toFixed(2)}nA`}
                position="insideTopLeft"
                style={{ fontSize: 9, fill: '#7c3aed', fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
              />
            </ReferenceLine>
          )}

          {/* No-event left/right dim overlay when an event is selected */}
          {selectedEvt && (
            <>
              <ReferenceArea x1={0} x2={selectedEvt.start_time} fill="#fff" fillOpacity={0.35} stroke="none" />
              <ReferenceArea x1={selectedEvt.start_time + selectedEvt.dwell_time_ms} fill="#fff" fillOpacity={0.35} stroke="none" />
            </>
          )}

          {/* Lines */}
          <Line type="stepAfter" dataKey="idealCurrent" stroke="#d1d5db"
            strokeDasharray="5 4" strokeWidth={1.5} dot={false}
            name="Ideal" isAnimationActive={false} />
          <Line type="monotone" dataKey="current" stroke="#7c3aed" strokeWidth={1.5}
            dot={false} activeDot={{ r: 3, fill: '#7c3aed' }}
            name="Measured" isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}