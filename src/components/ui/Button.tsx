import React from 'react';
import { motion } from 'motion/react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className = '', 
  disabled = false,
  ...props 
}) => {
  const baseStyle = "flex items-center justify-center gap-2 cursor-pointer font-heading font-semibold tracking-wide disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-loom-wood";
  
  // Size variants - 44px minimum for touch targets
  const sizeStyle = size === 'sm' 
    ? 'px-4 py-2 text-sm'
    : size === 'lg'
    ? 'px-8 py-3.5 text-lg'
    : 'px-6 py-3 text-base';
  
  let variantStyle = "";
  if (variant === 'primary') {
    variantStyle = "bg-loom-wood text-loom-cream border-b-[3px] border-[#5C2D0C] hover:bg-[#A0522D] active:translate-y-[2px] active:border-b-[1px]";
  } else if (variant === 'secondary') {
    variantStyle = "bg-loom-sand text-loom-ink border-b-[3px] border-[#A87E50] hover:bg-[#C49564] active:translate-y-[2px] active:border-b-[1px]";
  } else if (variant === 'outline') {
    variantStyle = "bg-transparent text-loom-wood border-2 border-loom-beige hover:bg-loom-parchment active:bg-loom-beige transition-colors";
  } else if (variant === 'danger') {
    variantStyle = "bg-loom-error text-white border-b-[3px] border-[#7F1717] hover:bg-[#9E1B1B] active:translate-y-[2px] active:border-b-[1px]";
  } else if (variant === 'ghost') {
    variantStyle = "bg-transparent text-loom-wood hover:bg-loom-parchment hover:text-loom-ink";
  }

  // Respect prefers-reduced-motion
  const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <motion.button 
      whileHover={prefersReduced || disabled ? {} : { scale: 1.02, y: -1 }}
      whileTap={prefersReduced || disabled ? {} : { scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 500, damping: 15 }}
      className={`${baseStyle} ${sizeStyle} ${variantStyle} ${className}`}
      disabled={disabled}
      {...props as any}
    >
      {children}
    </motion.button>
  );
};

