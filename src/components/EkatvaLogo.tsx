import React from 'react';
import { useTranslation } from 'react-i18next';

interface EkatvaLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export const EkatvaLogo: React.FC<EkatvaLogoProps> = ({ 
  className = '', 
  size = 64, 
  showText = true 
}) => {
  const { t } = useTranslation();
  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
      {/* Inline SVG rendering a styled handloom spinning wheel (Charkha) */}
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="text-loom-wood transition-transform duration-500 hover:rotate-12"
      >
        {/* Base of the Charkha */}
        <path d="M15 85H85" stroke="#8B4513" strokeWidth="4" strokeLinecap="round" />
        <path d="M25 85V75H75V85" stroke="#8B4513" strokeWidth="3" strokeLinecap="round" />
        
        {/* Support Pillars */}
        <path d="M35 75L45 40" stroke="#8B4513" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M65 75L55 40" stroke="#8B4513" strokeWidth="3.5" strokeLinecap="round" />
        
        {/* The Wheel (Spokes) */}
        <circle cx="50" cy="40" r="28" stroke="#C8A45C" strokeWidth="2.5" strokeDasharray="4 4" />
        <circle cx="50" cy="40" r="3" fill="#8B4513" />
        <circle cx="50" cy="40" r="24" stroke="#8B4513" strokeWidth="1" opacity="0.3" />
        
        {/* Loom spokes/handles */}
        <line x1="50" y1="12" x2="50" y2="68" stroke="#C8A45C" strokeWidth="2" strokeLinecap="round" />
        <line x1="22" y1="40" x2="78" y2="40" stroke="#C8A45C" strokeWidth="2" strokeLinecap="round" />
        <line x1="30" y1="20" x2="70" y2="60" stroke="#8B4513" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="70" y1="20" x2="30" y2="60" stroke="#8B4513" strokeWidth="1.5" strokeLinecap="round" />
        
        {/* Thread connecting base spinner to main wheel */}
        <path d="M50 40L20 80" stroke="#D4A574" strokeWidth="1.5" strokeDasharray="2 2" />
        <circle cx="20" cy="80" r="4" fill="#C8A45C" />
      </svg>
      
      {showText && (
        <div className="text-center">
          <h1 className="font-heading text-3xl font-bold tracking-wide text-loom-wood">
            {t('login.appName', 'एकत्व')}
          </h1>
          <p className="font-body text-xs uppercase tracking-widest text-loom-gold font-semibold">
            EKATVA
          </p>
        </div>
      )}
    </div>
  );
};
