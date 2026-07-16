import React from 'react';
import { Shield, Award, AlertTriangle } from 'lucide-react';

interface ReliabilityScoreProps {
  score: number;
  showDetails?: boolean;
}

export const ReliabilityScore: React.FC<ReliabilityScoreProps> = ({ score, showDetails = true }) => {
  // Normalize score between 0 and 100 just in case
  const normalizedScore = Math.max(0, Math.min(100, score));
  
  // Color configuration
  let colorClass = 'text-emerald-700';
  let bgClass = 'bg-emerald-50 border-emerald-200';
  let badgeText = 'उत्कृष्ट (Excellent)';
  let statusIcon = Award;

  if (normalizedScore < 50) {
    colorClass = 'text-rose-700';
    bgClass = 'bg-rose-50 border-rose-200';
    badgeText = 'कम स्कोर (Low Score)';
    statusIcon = AlertTriangle;
  } else if (normalizedScore < 80) {
    colorClass = 'text-amber-700';
    bgClass = 'bg-amber-50 border-amber-200';
    badgeText = 'मध्यम (Moderate)';
    statusIcon = Shield;
  }

  // Calculate rotation for the conic gradient representation
  const conicStyle = {
    background: `conic-gradient(#c49a45 ${normalizedScore * 3.6}deg, #f1eae0 ${normalizedScore * 3.6}deg)`
  };

  return (
    <div className="flex flex-col items-center p-5 bg-white/70 backdrop-blur-xs rounded-2xl border border-loom-beige/50 text-center shadow-xs">
      {/* Handloom thread circle (conic-gradient progress) */}
      <div className="relative w-24 h-24 flex items-center justify-center rounded-full shadow-md mb-3 p-1.5" style={conicStyle}>
        <div className="w-full h-full bg-loom-parchment rounded-full flex flex-col items-center justify-center shadow-inner">
          <span className="font-heading text-2xl font-black text-loom-wood">{normalizedScore}</span>
          <span className="font-mono text-[9px] text-loom-ink-light tracking-wider uppercase font-bold">अंक</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <h4 className="font-heading font-bold text-sm text-loom-wood">विश्वसनीयता अंक (Reliability Score)</h4>
        
        <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${bgClass} ${colorClass}`}>
          {React.createElement(statusIcon, { className: "w-3 h-3" })}
          {badgeText}
        </div>
      </div>

      {showDetails && (
        <div className="mt-3.5 pt-3 border-t border-loom-beige/30 w-full font-body text-xs space-y-1.5">
          {normalizedScore >= 80 ? (
            <p className="text-emerald-800 bg-emerald-50/50 p-2 rounded-lg font-medium border border-emerald-100">
              ✓ आप अग्रिम के लिए पूर्ण पात्र हैं। आपका रिकॉर्ड बहुत अच्छा है।
            </p>
          ) : normalizedScore >= 50 ? (
            <p className="text-amber-800 bg-amber-50/50 p-2 rounded-lg font-medium border border-amber-100">
              ⚠ आप अग्रिम के पात्र हैं, परन्तु समय पर कार्य पूरा करके स्कोर बढ़ाएं।
            </p>
          ) : (
            <p className="text-rose-800 bg-rose-50/50 p-2 rounded-lg font-medium border border-rose-100">
              ❌ कम स्कोर के कारण समिति आपको अग्रिम भुगतान देने से मना कर सकती है।
            </p>
          )}
        </div>
      )}
    </div>
  );
};
