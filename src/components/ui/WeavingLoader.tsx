import React from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';

interface WeavingLoaderProps {
  text?: string;
  className?: string;
}

export const WeavingLoader: React.FC<WeavingLoaderProps> = ({ 
  text, 
  className = '' 
}) => {
  const { t } = useTranslation();
  const displayText = text || t('common.loading', 'बुनाई जारी है…');
  const characters = Array.from(displayText);

  return (
    <div className={`flex flex-col items-center justify-center gap-6 ${className}`}>
      {/* Spinning Charkha / Loom Shuttle loader */}
      <div className="relative w-24 h-24 flex items-center justify-center">
        {/* Animated Conic Gradient Thread Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
          className="absolute inset-0 rounded-full border-2 border-dashed border-loom-gold/30"
          style={{
            backgroundImage: 'conic-gradient(from 0deg, transparent 40%, #C8A45C 100%)',
          }}
        />
        
        {/* Inner wooden wheel with spokes */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
          className="absolute w-14 h-14 rounded-full border-2 border-loom-wood flex items-center justify-center"
        >
          {/* Wheel Spokes */}
          <div className="absolute w-full h-0.5 bg-loom-wood/40" />
          <div className="absolute w-full h-0.5 bg-loom-wood/40 rotate-45" />
          <div className="absolute w-full h-0.5 bg-loom-wood/40 rotate-90" />
          <div className="absolute w-full h-0.5 bg-loom-wood/40 rotate-135" />
          <div className="w-3.5 h-3.5 rounded-full bg-loom-gold shadow-sm z-10" />
        </motion.div>

        {/* Small thread spool / shuttle orbiting */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
          className="absolute w-full h-full"
        >
          <div className="absolute top-[-4px] left-1/2 -translate-x-1/2 w-4 h-2 bg-loom-wood-light rounded-full border border-loom-gold shadow-sm" />
        </motion.div>
      </div>

      {/* Wave-animated Hindi/English text */}
      <div className="flex gap-0.5 font-heading text-lg text-loom-wood font-medium tracking-wide">
        {characters.map((char, index) => (
          <motion.span
            key={index}
            initial={{ y: 0 }}
            animate={{ y: [-3, 3, -3] }}
            transition={{
              repeat: Infinity,
              duration: 1.4,
              delay: index * 0.08,
              ease: 'easeInOut'
            }}
            className="inline-block"
          >
            {char === ' ' ? '\u00A0' : char}
          </motion.span>
        ))}
      </div>
    </div>
  );
};
export default WeavingLoader;
