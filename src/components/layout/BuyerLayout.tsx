import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { EkatvaLogo } from '../EkatvaLogo';
import { LogOut, ShoppingBag, ShoppingCart, FileText, User as UserIcon } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../LanguageSwitcher';

interface BuyerLayoutProps {
  children: React.ReactNode;
}

export const BuyerLayout: React.FC<BuyerLayoutProps> = ({ children }) => {
  const { userProfile, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();
  const { t } = useTranslation();

  const getActiveTab = () => {
    if (location.pathname.startsWith('/buyer/rfqs')) return 'rfqs';
    if (location.pathname.startsWith('/buyer/orders')) return 'orders';
    return 'marketplace';
  };

  const activeTab = getActiveTab();

  return (
    <div className="min-h-screen bg-loom-parchment text-loom-ink font-body flex flex-col">
      {/* Top Header Bar */}
      <header className="app-chrome sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo Section */}
            <div className="app-brand-mark flex items-center gap-3">
              <EkatvaLogo size={48} showText={false} />
              <div className="flex flex-col">
                <span className="font-heading text-2xl font-bold text-loom-wood">{t('login.appName', 'एकत्व')}</span>
                <span className="text-[11px] uppercase tracking-wider text-loom-gold font-semibold leading-none">Ekatva Buyer</span>
              </div>
            </div>

            {/* User Profile Navigation */}
            <div className="flex items-center gap-4">
              <LanguageSwitcher />

              <div className="relative">
                <button 
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="profile-chip flex items-center gap-2 px-3 py-1.5 bg-loom-parchment/80 border border-loom-beige rounded-full hover:bg-loom-sand/15 hover:border-loom-gold transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-loom-wood text-loom-cream flex items-center justify-center font-heading text-sm font-bold">
                    {userProfile?.displayName ? userProfile.displayName.charAt(0) : 'B'}
                  </div>
                  <span className="hidden sm:inline font-medium text-sm">
                    {userProfile?.displayName || t('common.profile')}
                  </span>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-loom-cream border border-loom-beige rounded-xl shadow-lg py-2 z-50">
                    <div className="px-4 py-2 border-b border-loom-beige/50 text-xs text-loom-ink-light">
                      {t('nav.roleBuyer', 'भूमिका: खरीदार (Buyer)')}
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
            <nav className="app-nav relative flex gap-4 sm:gap-8 -mb-[1px] overflow-x-auto">
              <Link
                to="/buyer/marketplace"
                className={`flex items-center gap-2 py-3 px-2 border-b-3 font-heading text-lg font-bold transition-all cursor-pointer ${
                  activeTab === 'marketplace' 
                    ? 'border-loom-wood text-loom-wood' 
                    : 'border-transparent text-loom-ink-light hover:text-loom-ink'
                }`}
              >
                <ShoppingBag className="w-5 h-5" />
                {t('nav.marketplace')}
              </Link>
              
              <Link
                to="/buyer/rfqs"
                className={`flex items-center gap-2 py-3 px-2 border-b-3 font-heading text-lg font-bold transition-all cursor-pointer ${
                  activeTab === 'rfqs' 
                    ? 'border-loom-wood text-loom-wood' 
                    : 'border-transparent text-loom-ink-light hover:text-loom-ink'
                }`}
              >
                <FileText className="w-5 h-5" />
                {t('nav.rfqOpportunities')}
              </Link>

              <button
                disabled
                className="flex items-center gap-2 py-3 px-2 border-b-3 font-heading text-lg font-bold border-transparent text-loom-ink-light/40 cursor-not-allowed"
                title={t('common.comingSoon', 'शीघ्र आ रहा है (Coming soon)')}
              >
                <ShoppingCart className="w-5 h-5" />
                {t('common.settings')}
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-content flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-loom-cream border-t border-loom-beige/50 py-4 text-center text-xs text-loom-ink-light font-medium">
        {t('login.appName', 'एकत्व')} (Ekatva) — {t('login.tagline')} © 2026
      </footer>
    </div>
  );
};
