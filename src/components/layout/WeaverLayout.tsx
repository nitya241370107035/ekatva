import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { EkatvaLogo } from '../EkatvaLogo';
import { OfflineBanner } from '../OfflineBanner';
import { LogOut, User as UserIcon, Calendar, Bell, IndianRupee, MessageSquare, Layers, Award } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { useNavigate, useLocation } from 'react-router-dom';

interface WeaverLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const WeaverLayout: React.FC<WeaverLayoutProps> = ({ 
  children,
  activeTab,
  setActiveTab
}) => {
  const { userProfile, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const handleTabClick = (tabId: string) => {
    if (tabId === 'schemes') {
      navigate('/weaver/schemes');
    } else if (location.pathname !== '/weaver') {
      navigate('/weaver', { state: { activeTab: tabId } });
    } else {
      setActiveTab(tabId);
    }
  };

  return (
    <div className="min-h-screen bg-loom-parchment text-loom-ink font-body flex flex-col">
      <OfflineBanner />
      {/* Top Header Bar */}
      <header className="bg-loom-cream border-b-2 border-loom-beige shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo Section */}
            <div className="flex items-center gap-3">
              <EkatvaLogo size={48} showText={false} />
              <div className="flex flex-col">
                <span className="font-heading text-2xl font-bold text-loom-wood">{t('login.appName', 'एकत्व')}</span>
                <span className="text-[11px] uppercase tracking-wider text-loom-gold font-semibold leading-none">Ekatva Weaver</span>
              </div>
            </div>

            {/* User Profile Navigation */}
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              
              <div className="relative">
                <button 
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-loom-parchment border border-loom-beige rounded-full hover:bg-loom-sand/10 transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-loom-wood text-loom-cream flex items-center justify-center font-heading text-sm font-bold">
                    {userProfile?.displayName ? userProfile.displayName.charAt(0) : 'W'}
                  </div>
                  <span className="hidden sm:inline font-medium text-sm">
                    {userProfile?.displayName || t('common.profile')}
                  </span>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-loom-cream border border-loom-beige rounded-xl shadow-lg py-2 z-50">
                    <div className="px-4 py-2 border-b border-loom-beige/50 text-xs text-loom-ink-light">
                      {t('nav.roleWeaver', 'भूमिका: बुनकर (Weaver)')}
                    </div>
                    <button 
                      onClick={() => logout()}
                      className="w-full text-left px-4 py-2 text-sm text-loom-error hover:bg-loom-error/5 flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      {t('nav.logout')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Vintage Tab Navigation Bar */}
        <div className="bg-loom-cream/50 border-t border-loom-beige/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex gap-4 sm:gap-8 -mb-[1px] overflow-x-auto scrollbar-none">
              <button
                onClick={() => handleTabClick('dashboard')}
                className={`flex items-center gap-2 py-3 px-2 border-b-3 font-heading text-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'dashboard' 
                    ? 'border-loom-wood text-loom-wood' 
                    : 'border-transparent text-loom-ink-light hover:text-loom-ink'
                }`}
              >
                <UserIcon className="w-5 h-5" />
                {t('common.profile')}
              </button>
              <button
                onClick={() => handleTabClick('jobs')}
                className={`flex items-center gap-2 py-3 px-2 border-b-3 font-heading text-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'jobs' 
                    ? 'border-loom-wood text-loom-wood' 
                    : 'border-transparent text-loom-ink-light hover:text-loom-ink'
                }`}
              >
                <Calendar className="w-5 h-5" />
                {t('nav.production')}
              </button>
              <button
                onClick={() => handleTabClick('notices')}
                className={`flex items-center gap-2 py-3 px-2 border-b-3 font-heading text-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'notices' 
                    ? 'border-loom-wood text-loom-wood' 
                    : 'border-transparent text-loom-ink-light hover:text-loom-ink'
                }`}
              >
                <Bell className="w-5 h-5" />
                {t('nav.notices')}
              </button>
              <button
                onClick={() => handleTabClick('earnings')}
                className={`flex items-center gap-2 py-3 px-2 border-b-3 font-heading text-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'earnings' 
                    ? 'border-loom-wood text-loom-wood' 
                    : 'border-transparent text-loom-ink-light hover:text-loom-ink'
                }`}
              >
                <IndianRupee className="w-5 h-5" />
                {t('nav.payments')}
              </button>
              <button
                onClick={() => handleTabClick('material_requests')}
                className={`flex items-center gap-2 py-3 px-2 border-b-3 font-heading text-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'material_requests' 
                    ? 'border-loom-wood text-loom-wood' 
                    : 'border-transparent text-loom-ink-light hover:text-loom-ink'
                }`}
              >
                <Layers className="w-5 h-5" />
                {t('weaver.requestMaterial')}
              </button>
              <button
                onClick={() => handleTabClick('grievances')}
                className={`flex items-center gap-2 py-3 px-2 border-b-3 font-heading text-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'grievances' 
                    ? 'border-loom-wood text-loom-wood' 
                    : 'border-transparent text-loom-ink-light hover:text-loom-ink'
                }`}
              >
                <MessageSquare className="w-5 h-5" />
                {t('nav.grievances')}
              </button>
              <button
                onClick={() => handleTabClick('schemes')}
                className={`flex items-center gap-2 py-3 px-2 border-b-3 font-heading text-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'schemes' 
                    ? 'border-loom-wood text-loom-wood' 
                    : 'border-transparent text-loom-ink-light hover:text-loom-ink'
                }`}
              >
                <Award className="w-5 h-5" />
                {t('nav.schemes')}
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-loom-cream border-t border-loom-beige/50 py-4 text-center text-xs text-loom-ink-light font-medium">
        {t('login.appName', 'एकत्व')} (Ekatva) — {t('login.tagline')} © 2026
      </footer>
    </div>
  );
};
