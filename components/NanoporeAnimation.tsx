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
  poreGeometry 
}: AnimationProps) {
  
  const scale = 3;
  const midX = 150; // Center of the 300px SVG width
  const halfD = (poreDiameter * scale) / 2;
  const memH = membraneThickness * scale;
  const mSize = Math.max(moleculeDiameter * scale, 4);
  
  // Base diameter is typically much wider for tapered pores
  const baseD = halfD * 3; 

  const renderPorePath = () => {
    switch (poreGeometry) {
      case 'Conical':
        // Tapers from a wide top to a narrow bottom (sensing zone)
        return `${midX - baseD},0 ${midX + baseD},0 ${midX + halfD},${memH} ${midX - halfD},${memH}`;
      case 'Hourglass':
        // Double-taper: Wide -> Narrow (constriction) -> Wide
        return `${midX - baseD},0 ${midX + baseD},0 ${midX + halfD},${memH/2} ${midX + baseD},${memH} ${midX - baseD},${memH} ${midX - halfD},${memH/2}`;
      default:
        // Standard Straight Cylinder
        return `${midX - halfD},0 ${midX + halfD},0 ${midX + halfD},${memH} ${midX - halfD},${memH}`;
    }
  };

  return (
    <div className="relative w-full h-48 bg-white rounded-3xl flex items-center justify-center overflow-hidden border border-violet-100 shadow-inner">
      
      {/* SVG Membrane & Pore Channel */}
      <svg width="300" height={memH} viewBox={`0 0 300 ${memH}`} className="z-10 drop-shadow-md">
        {/* The solid membrane */}
        <rect width="300" height={memH} fill="#e2e8f0" />
        {/* The physical "hole" carved out */}
        <polygon 
          points={renderPorePath()} 
          fill="white" 
          className="transition-all duration-500 ease-in-out" 
        />
      </svg>

      {/* Animated Molecule: Drops through the midX */}
      <div 
        className="absolute z-20 rounded-full bg-violet-600 shadow-lg animate-drop"
        style={{ 
          width: `${mSize}px`, 
          height: `${mSize}px`,
          left: `calc(50% - ${mSize/2}px)`,
          animationDuration: `${Math.max(0.6, dwellTimeMs * 12)}s`,
          animationIterationCount: 'infinite',
          animationTimingFunction: 'linear'
        }}
      />

      <style jsx>{`
        @keyframes drop {
          0% { transform: translateY(-100px); opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translateY(100px); opacity: 0; }
        }
        .animate-drop {
          animation-name: drop;
        }
      `}</style>
    </div>
  );
}