import React from 'react';
import { motion } from 'motion/react';

interface AnimatedPageProps {
  children: React.ReactNode;
}

export const AnimatedPage: React.FC<AnimatedPageProps> = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-full"
    >
      {/* Thread‑like separator */}
      <div className="w-full h-0.5 overflow-hidden mb-4 opacity-50 relative">
        <div 
          className="absolute inset-0 w-[200%] h-full animate-thread-weave"
          style={{
            backgroundImage: 'repeating-linear-gradient(90deg, #C8A45C 0px, #C8A45C 10px, transparent 10px, transparent 20px)',
            backgroundSize: '20px 100%'
          }}
        />
      </div>
      {children}
    </motion.div>
  );
};
