import React from 'react';
import { motion } from 'motion/react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'search' | 'error';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  variant = 'default'
}) => {
  const bgColor = 
    variant === 'error' ? 'bg-loom-error bg-opacity-5' :
    variant === 'search' ? 'bg-loom-beige' :
    'bg-loom-parchment';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`flex flex-col items-center justify-center py-12 px-6 rounded-2xl border-2 border-dashed border-loom-sand ${bgColor}`}
    >
      {icon && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-4 text-4xl opacity-40"
        >
          {icon}
        </motion.div>
      )}
      <h3 className="text-lg font-heading font-semibold text-loom-ink text-center mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-loom-ink text-opacity-60 text-center max-w-xs mb-6">
          {description}
        </p>
      )}
      {action && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={action.onClick}
          className="mt-4 px-6 py-2.5 bg-loom-wood text-loom-cream rounded-lg font-semibold hover:bg-[#A0522D] transition-colors"
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
};
