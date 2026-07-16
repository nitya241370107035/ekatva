import React from 'react';
import { motion } from 'motion/react';

interface SkeletonLoaderProps {
  count?: number;
  type?: 'card' | 'line' | 'circle' | 'table';
  className?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  count = 1,
  type = 'line',
  className = ''
}) => {
  const shimmer = `
    @keyframes shimmer {
      0% { background-position: -1000px 0; }
      100% { background-position: 1000px 0; }
    }
  `;

  const renderSkeleton = () => {
    if (type === 'card') {
      return (
        <div className="space-y-4">
          {Array.from({ length: count }).map((_, i) => (
            <div
              key={i}
              className="p-4 rounded-lg border-2 border-loom-sand space-y-3"
            >
              <div className="h-6 bg-gradient-to-r from-loom-beige via-white to-loom-beige animate-pulse rounded"></div>
              <div className="h-4 bg-gradient-to-r from-loom-beige via-white to-loom-beige animate-pulse rounded w-5/6"></div>
              <div className="h-4 bg-gradient-to-r from-loom-beige via-white to-loom-beige animate-pulse rounded w-4/6"></div>
            </div>
          ))}
        </div>
      );
    }

    if (type === 'table') {
      return (
        <table className="w-full">
          <tbody>
            {Array.from({ length: count }).map((_, i) => (
              <tr key={i} className="border-b border-loom-sand">
                <td className="p-4"><div className="h-4 bg-gradient-to-r from-loom-beige via-white to-loom-beige animate-pulse rounded w-3/4"></div></td>
                <td className="p-4"><div className="h-4 bg-gradient-to-r from-loom-beige via-white to-loom-beige animate-pulse rounded w-2/3"></div></td>
                <td className="p-4"><div className="h-4 bg-gradient-to-r from-loom-beige via-white to-loom-beige animate-pulse rounded w-1/2"></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (type === 'circle') {
      return (
        <div className="flex gap-4">
          {Array.from({ length: count }).map((_, i) => (
            <div
              key={i}
              className="w-12 h-12 rounded-full bg-gradient-to-r from-loom-beige via-white to-loom-beige animate-pulse"
            ></div>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="h-4 bg-gradient-to-r from-loom-beige via-white to-loom-beige animate-pulse rounded"
          ></div>
        ))}
      </div>
    );
  };

  return <div className={className}>{renderSkeleton()}</div>;
};
