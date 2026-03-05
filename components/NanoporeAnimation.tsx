// components/NanoporeAnimation.tsx
import React from 'react';

interface AnimationProps {
  poreDiameter: number;
  moleculeDiameter: number;
  membraneThickness: number;
  dwellTimeMs: number;
  poreGeometry: string;
}

export default function NanoporeAnimation({
  poreDiameter,
  moleculeDiameter,
  membraneThickness,
  dwellTimeMs,
  poreGeometry,
}: AnimationProps) {
  // ── Layout constants ─────────────────────────────────────────────────────
  // The SVG viewport is always 300×200. We position everything in this space.
  const W = 300;
  const H = 200;
  const midX = W / 2;

  // Membrane sits vertically centered in the viewport
  const memScale = 2.5;
  const memH = Math.min(membraneThickness * memScale, 80); // cap so it doesn't eat the view
  const memY = (H - memH) / 2; // top Y of the membrane band

  // Pore geometry in SVG units
  const poreScale = 3.5;
  const halfD = (poreDiameter * poreScale) / 2;
  const baseD = halfD * 3; // wide opening for tapered pores

  // Molecule
  const mSize = Math.max(moleculeDiameter * poreScale, 6);
  const animDuration = Math.max(0.8, dwellTimeMs * 10);

  // ── Pore channel polygon relative to membrane top ───────────────────────
  // All Y values are offset by memY so the hole sits inside the membrane rect
  const porePoints = (): string => {
    const t = memY;        // top of membrane
    const b = memY + memH; // bottom of membrane
    const mid = memY + memH / 2;

    switch (poreGeometry) {
      case 'Conical':
        return `${midX - baseD},${t} ${midX + baseD},${t} ${midX + halfD},${b} ${midX - halfD},${b}`;
      case 'Hourglass':
        return [
          `${midX - baseD},${t}`,
          `${midX + baseD},${t}`,
          `${midX + halfD},${mid}`,
          `${midX + baseD},${b}`,
          `${midX - baseD},${b}`,
          `${midX - halfD},${mid}`,
        ].join(' ');
      default: // Cylindrical
        return `${midX - halfD},${t} ${midX + halfD},${t} ${midX + halfD},${b} ${midX - halfD},${b}`;
    }
  };

  // ── Ion flow dots (5 dots drifting downward through pore) ────────────────
  const ionDots = [0, 1, 2, 3, 4];

  return (
    <div style={{ width: '100%', background: '#faf5ff', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @keyframes moleculeDrop {
          0%   { transform: translateY(${-H * 0.55}px); opacity: 0; }
          12%  { opacity: 1; }
          88%  { opacity: 1; }
          100% { transform: translateY(${H * 0.55}px); opacity: 0; }
        }
        @keyframes ionDrift {
          0%   { transform: translateY(0px);   opacity: 0; }
          10%  { opacity: 0.5; }
          90%  { opacity: 0.5; }
          100% { transform: translateY(${memH + 32}px); opacity: 0; }
        }
      `}</style>

      <svg
        width="100%"
        viewBox={`0 0 ${W} ${H}`}
        style={{ display: 'block' }}
      >
        {/* ── Background gradient — top (cis) and bottom (trans) chambers ── */}
        <defs>
          <linearGradient id="cisGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ede9fe" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#ede9fe" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="transGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ddd6fe" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#ddd6fe" stopOpacity="0.5" />
          </linearGradient>
          <clipPath id="poreClip">
            <polygon points={porePoints()} />
          </clipPath>
        </defs>

        {/* Cis chamber (top) */}
        <rect x={0} y={0} width={W} height={memY} fill="url(#cisGrad)" />
        {/* Trans chamber (bottom) */}
        <rect x={0} y={memY + memH} width={W} height={H - memY - memH} fill="url(#transGrad)" />

        {/* ── Membrane ── */}
        <rect x={0} y={memY} width={W} height={memH} fill="#c4b5fd" rx={0} />

        {/* ── Pore channel cut-out ── */}
        <polygon points={porePoints()} fill="#faf5ff" />

        {/* ── Subtle pore wall shading ── */}
        <polygon points={porePoints()} fill="none" stroke="#a78bfa" strokeWidth="1" strokeOpacity="0.4" />

        {/* ── Chamber labels ── */}
        <text x={14} y={memY - 10} fontSize={9} fill="#a78bfa" fontFamily="Inter, sans-serif" fontWeight={600} opacity={0.8}>CIS</text>
        <text x={14} y={memY + memH + 18} fontSize={9} fill="#7c3aed" fontFamily="Inter, sans-serif" fontWeight={600} opacity={0.8}>TRANS</text>

        {/* ── Voltage arrow ── */}
        <line x1={W - 18} y1={16} x2={W - 18} y2={H - 16} stroke="#7c3aed" strokeWidth={1} strokeOpacity={0.3} />
        <polygon points={`${W - 18},${H - 10} ${W - 22},${H - 20} ${W - 14},${H - 20}`} fill="#7c3aed" fillOpacity={0.4} />
        <text x={W - 14} y={H / 2 + 4} fontSize={8} fill="#7c3aed" fontFamily="Inter, sans-serif" opacity={0.5}>V</text>

        {/* ── Ion drift dots (animated inside pore channel) ── */}
        {ionDots.map((i) => (
          <circle
            key={i}
            cx={midX + (i % 2 === 0 ? -halfD * 0.3 : halfD * 0.3)}
            cy={memY + (i / ionDots.length) * memH}
            r={2}
            fill="#7c3aed"
            opacity={0.25}
          >
            <animateTransform
              attributeName="transform"
              type="translate"
              from={`0 ${-memH}`}
              to={`0 ${memH * 1.5}`}
              dur={`${1.2 + i * 0.35}s`}
              repeatCount="indefinite"
              begin={`${i * 0.25}s`}
            />
            <animate
              attributeName="opacity"
              values="0;0.35;0.35;0"
              dur={`${1.2 + i * 0.35}s`}
              repeatCount="indefinite"
              begin={`${i * 0.25}s`}
            />
          </circle>
        ))}

        {/* ── Molecule (animated via foreignObject trick → use SVG circle) ── */}
        <circle
          cx={midX}
          cy={memY + memH / 2}
          r={mSize / 2}
          fill="#7c3aed"
          stroke="#fff"
          strokeWidth={1.5}
          style={{
            animation: `moleculeDrop ${animDuration}s linear infinite`,
          }}
        />

        {/* ── Size annotations ── */}
        {/* Pore diameter bracket */}
        <line x1={midX - halfD} y1={memY - 6} x2={midX + halfD} y2={memY - 6} stroke="#a78bfa" strokeWidth={1} strokeOpacity={0.6} />
        <line x1={midX - halfD} y1={memY - 9} x2={midX - halfD} y2={memY - 3} stroke="#a78bfa" strokeWidth={1} strokeOpacity={0.6} />
        <line x1={midX + halfD} y1={memY - 9} x2={midX + halfD} y2={memY - 3} stroke="#a78bfa" strokeWidth={1} strokeOpacity={0.6} />
        <text x={midX} y={memY - 9} fontSize={8} fill="#7c3aed" textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight={600} opacity={0.8}>
          {poreDiameter} nm
        </text>

        {/* Membrane thickness bracket */}
        <line x1={midX + halfD + 10} y1={memY} x2={midX + halfD + 10} y2={memY + memH} stroke="#a78bfa" strokeWidth={1} strokeOpacity={0.5} />
        <text
          x={midX + halfD + 18}
          y={memY + memH / 2 + 3}
          fontSize={7}
          fill="#7c3aed"
          fontFamily="Inter, sans-serif"
          fontWeight={600}
          opacity={0.7}
        >
          {membraneThickness} nm
        </text>
      </svg>
    </div>
  );
}