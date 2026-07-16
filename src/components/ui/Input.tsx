import React from 'react';
import { motion } from 'motion/react';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  error?: string;
  success?: string;
  required?: boolean;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({ 
  label, 
  icon, 
  error,
  success,
  required = false,
  helperText,
  className = '', 
  id, 
  ...props 
}) => {
  const hasError = !!error;
  const hasSuccess = !!success && !error;

  return (
    <div className="w-full flex flex-col gap-2 text-left">
      {label && (
        <label 
          htmlFor={id} 
          className={`font-heading text-base font-semibold flex items-center gap-1.5 ${
            hasError 
              ? 'text-loom-error' 
              : hasSuccess 
              ? 'text-loom-success'
              : 'text-loom-ink'
          }`}
        >
          {icon}
          {label}
          {required && <span className="text-loom-error">*</span>}
        </label>
      )}
      <div className="relative">
        <motion.input
          id={id}
          whileFocus={{ scale: 1.005 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className={`vintage-input w-full text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 ${
            hasError
              ? 'border-loom-error border-opacity-50 focus:ring-loom-error focus:ring-opacity-30'
              : hasSuccess
              ? 'border-loom-success border-opacity-50 focus:ring-loom-success focus:ring-opacity-30'
              : 'focus:ring-loom-wood focus:ring-opacity-30'
          } ${className}`}
          {...props}
        />
        {hasError && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <AlertCircle size={20} className="text-loom-error" />
          </motion.div>
        )}
        {hasSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <CheckCircle size={20} className="text-loom-success" />
          </motion.div>
        )}
      </div>
      {(error || success || helperText) && (
        <motion.p 
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-sm ${
            hasError 
              ? 'text-loom-error font-semibold' 
              : hasSuccess 
              ? 'text-loom-success font-semibold'
              : 'text-loom-ink text-opacity-60'
          }`}
        >
          {error || success || helperText}
        </motion.p>
      )}
    </div>
  );
};

