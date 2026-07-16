import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  delay = 200
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showTimeout, setShowTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    const timeout = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    setShowTimeout(timeout);
  };

  const handleMouseLeave = () => {
    if (showTimeout) clearTimeout(showTimeout);
    setIsVisible(false);
  };

  const getPosition = () => {
    const positions = {
      top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
      bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
      left: 'right-full mr-2 top-1/2 -translate-y-1/2',
      right: 'left-full ml-2 top-1/2 -translate-y-1/2'
    };
    return positions[position];
  };

  const getArrowPosition = () => {
    const arrows = {
      top: 'top-full left-1/2 -translate-x-1/2 border-t-loom-wood border-l-transparent border-r-transparent',
      bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-loom-wood border-l-transparent border-r-transparent',
      left: 'left-full top-1/2 -translate-y-1/2 border-l-loom-wood border-t-transparent border-b-transparent',
      right: 'right-full top-1/2 -translate-y-1/2 border-r-loom-wood border-t-transparent border-b-transparent'
    };
    return arrows[position];
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className={`absolute ${getPosition()} z-50 px-3 py-2 bg-loom-wood text-loom-cream text-sm font-semibold rounded-lg whitespace-nowrap pointer-events-none`}
          >
            {content}
            <div
              className={`absolute w-0 h-0 border-4 ${getArrowPosition()}`}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
