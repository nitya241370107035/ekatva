import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  maxButtons?: number;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  maxButtons = 5
}) => {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    
    if (totalPages <= maxButtons) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const half = Math.floor(maxButtons / 2);
      let start = currentPage - half;
      let end = currentPage + half;

      if (start < 1) {
        start = 1;
        end = maxButtons;
      }
      if (end > totalPages) {
        end = totalPages;
        start = totalPages - maxButtons + 1;
      }

      if (start > 1) pages.push(1, '...');
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (end < totalPages) pages.push('...', totalPages);
    }
    
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="p-2 rounded-lg border-2 border-loom-sand hover:bg-loom-parchment disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft size={20} className="text-loom-wood" />
      </motion.button>

      <div className="flex gap-1">
        {pages.map((page, idx) => (
          <motion.button
            key={idx}
            whileHover={page !== '...' ? { scale: 1.1 } : {}}
            whileTap={page !== '...' ? { scale: 0.95 } : {}}
            onClick={() => typeof page === 'number' && onPageChange(page)}
            disabled={page === '...'}
            className={`w-10 h-10 rounded-lg font-semibold transition-colors ${
              page === currentPage
                ? 'bg-loom-wood text-loom-cream border-2 border-loom-wood'
                : page === '...'
                ? 'cursor-default text-loom-ink border-2 border-transparent'
                : 'border-2 border-loom-sand hover:bg-loom-parchment text-loom-ink'
            }`}
          >
            {page}
          </motion.button>
        ))}
      </div>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg border-2 border-loom-sand hover:bg-loom-parchment disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight size={20} className="text-loom-wood" />
      </motion.button>
    </div>
  );
};
