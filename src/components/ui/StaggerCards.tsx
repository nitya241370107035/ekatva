import React from 'react';
import { motion } from 'motion/react';

interface StaggerCardsProps {
  children: React.ReactNode;
  className?: string;
}

export const StaggerCards: React.FC<StaggerCardsProps> = ({ children, className = '' }) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.05
          }
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
}

export const StaggerItem: React.FC<StaggerItemProps> = ({ children, className = '' }) => {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 15 },
        visible: { 
          opacity: 1, 
          y: 0, 
          transition: { 
            type: 'spring', 
            stiffness: 260, 
            damping: 22 
          } 
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
