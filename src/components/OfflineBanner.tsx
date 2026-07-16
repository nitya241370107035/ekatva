import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const OfflineBanner: React.FC = () => {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [showOnlineAlert, setShowOnlineAlert] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOnlineAlert(true);
      // Auto-dismiss the green online alert after 5 seconds
      const timer = setTimeout(() => {
        setShowOnlineAlert(false);
      }, 5000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOnlineAlert(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOnline) {
    return (
      <div className="fixed top-0 inset-x-0 z-50 bg-amber-500 text-amber-950 font-body text-sm font-semibold px-4 py-2.5 shadow-md flex items-center justify-between border-b-2 border-amber-600 animate-slide-down">
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full justify-center">
          <WifiOff className="w-4 h-4 text-amber-900 shrink-0 animate-bounce" />
          <span>{t('common.offline')}</span>
        </div>
      </div>
    );
  }

  if (showOnlineAlert) {
    return (
      <div className="fixed top-0 inset-x-0 z-50 bg-emerald-600 text-white font-body text-sm font-semibold px-4 py-2.5 shadow-md flex items-center justify-between border-b-2 border-emerald-700 animate-slide-down">
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full justify-center relative">
          <Wifi className="w-4 h-4 text-emerald-100 shrink-0" />
          <span>{t('common.online')}</span>
          <button 
            onClick={() => setShowOnlineAlert(false)}
            className="absolute right-4 p-1 hover:bg-emerald-500 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return null;
};
