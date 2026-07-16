import React from 'react';
import { X, CheckCircle, AlertTriangle } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success', onClose }) => {
  const bgClass = type === 'success' 
    ? 'bg-[#FFF8F0] border-[#C8A45C] text-[#3E2723]' 
    : 'bg-[#FFF8F0] border-[#B22222] text-[#3E2723]';

  const iconColor = type === 'success' ? 'text-loom-gold' : 'text-loom-error';

  return (
    <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 p-4 rounded-xl border-l-4 shadow-xl max-w-sm animate-bounce ${bgClass} vintage-card`}>
      {type === 'success' ? (
        <CheckCircle className={`w-6 h-6 ${iconColor} shrink-0`} />
      ) : (
        <AlertTriangle className={`w-6 h-6 ${iconColor} shrink-0`} />
      )}
      <div className="flex-1 font-body text-sm font-medium">
        {message}
      </div>
      <button 
        onClick={onClose} 
        className="text-loom-ink-light hover:text-loom-ink transition-colors cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
