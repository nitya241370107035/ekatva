import React from 'react';
import { motion } from 'motion/react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', id, hoverable = true }) => {
  const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <motion.div 
      id={id} 
      whileHover={prefersReduced || !hoverable ? {} : { y: -4, boxShadow: "0 12px 30px -4px rgba(139, 69, 19, 0.18), 0 6px 16px -2px rgba(139, 69, 19, 0.08)" }}
      whileTap={prefersReduced || !hoverable ? {} : { scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      className={`vintage-card p-6 shimmer-gold transition-shadow duration-200 ${className}`}
    >
      {children}
    </motion.div>
  );
};


export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`border-b border-loom-beige/50 pb-4 mb-4 ${className}`}>{children}</div>
);

export const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <h2 className={`font-heading text-xl md:text-2xl font-bold text-loom-wood ${className}`}>{children}</h2>
);

export const CardDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <p className={`font-body text-sm text-loom-ink-light mt-1 ${className}`}>{children}</p>
);

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`font-body ${className}`}>{children}</div>
);

export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`border-t border-loom-beige/50 pt-4 mt-4 flex items-center justify-between ${className}`}>{children}</div>
);
