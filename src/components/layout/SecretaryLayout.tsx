import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { EkatvaLogo } from '../EkatvaLogo';
import { useLocation, Link, Outlet } from 'react-router-dom';
import { EkatvaHumsafar } from '../EkatvaHumsafar';
import { OfflineBanner } from '../OfflineBanner';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  Calendar, 
  MessageSquare, 
  ShoppingBag, 
  Settings, 
  LogOut,
  ChevronRight,
  Menu,
  X,
  Hammer,
  Package,
  Truck,
  Sparkles,
  Award
} from 'lucide-react';

interface SecretaryLayoutProps {
  children?: React.ReactNode;
}

export const SecretaryLayout: React.FC<SecretaryLayoutProps> = ({ children }) => {
  const { userProfile, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useTranslation();

  interface MenuItem {
    label: string;
    path: string;
    icon: any;
    disabled?: boolean;
    key?: string;
    section?: string;
  }

  const menuItems: MenuItem[] = [
    { label: t('nav.dashboard', 'डैशबोर्ड'), path: '/secretary', icon: LayoutDashboard, key: 'nav.dashboard' },
    { label: t('nav.products', 'सहकारी उत्पाद सूची'), path: '/secretary/products', icon: ShoppingBag, key: 'nav.products' },
    { label: t('nav.productReview', 'उत्पाद समीक्षा'), path: '/secretary/product-review', icon: ClipboardList, key: 'nav.productReview' },
    { label: t('nav.rfqOpportunities', 'बाज़ार के अवसर (RFQs)'), path: '/secretary/rfq-opportunities', icon: Sparkles, key: 'nav.rfqOpportunities' },
    { label: t('nav.members', 'सदस्य'), path: '/secretary/members', icon: Users, key: 'nav.members' },
    { label: t('nav.production', 'उत्पादन बोर्ड'), path: '/secretary/production', icon: Hammer, key: 'nav.production' },
    { label: t('nav.stock', 'कच्चा माल स्टॉक'), path: '/secretary/stock', icon: Package, key: 'nav.stock' },
    { label: t('nav.indentRequests', 'खरीद अनुरोध'), path: '/secretary/indent-requests', icon: ShoppingBag, key: 'nav.indentRequests' },
    { label: t('nav.vendors', 'विक्रेता सूची'), path: '/secretary/vendors', icon: Truck, key: 'nav.vendors' },
    { label: t('nav.procurementAdvisor', 'खरीद सलाहकार'), path: '/secretary/procurement-advisor', icon: Sparkles, key: 'nav.procurementAdvisor' },
    { label: t('nav.notices', 'सूचना पटल'), path: '/secretary/notices', icon: ClipboardList, key: 'nav.notices' },
    { label: t('nav.meetings', 'बैठकें'), path: '/secretary/meetings', icon: Calendar, key: 'nav.meetings' },
    { label: t('nav.grievances', 'शिकायतें'), path: '/secretary/grievances', icon: MessageSquare, key: 'nav.grievances' },
    { label: t('nav.schemes', 'सरकारी योजनाएं'), path: '/secretary/schemes', icon: Award, key: 'nav.schemes', section: 'support' },
    { label: t('nav.certifications', 'प्रमाणपत्र सेटिंग्स'), path: '/secretary/certifications', icon: Settings, key: 'nav.certifications', section: 'support' },
  ];

  const isActive = (path: string) => {
    if (path === '/secretary' && location.pathname === '/secretary') return true;
    if (path !== '/secretary' && path !== '#') {
      return location.pathname.startsWith(path);
    }
    return false;
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-loom-wood text-loom-cream relative overflow-hidden bg-loom-pattern">
      {/* Absolute dark overlay to make text high contrast over the pattern */}
      <div className="absolute inset-0 bg-loom-wood/90 z-0 pointer-events-none" />

      <div className="p-6 border-b border-loom-gold/30 flex flex-col items-center gap-2 relative z-20">
        <EkatvaLogo size={56} showText={false} />
        <h2 className="font-heading text-2xl font-bold tracking-wide mt-2">{t('login.appName', 'एकत्व')}</h2>
        <span className="text-xs text-loom-gold tracking-widest uppercase font-semibold">{t('nav.roleSecretary', 'सचिव (Secretary)')}</span>
        <div className="mt-2 scale-90">
          <LanguageSwitcher />
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2 relative z-10 overflow-y-auto">
        {menuItems.filter(item => !item.section).map((item, idx) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          if (item.disabled) {
            return (
              <div 
                key={idx}
                className="flex items-center justify-between px-4 py-3 rounded-xl text-loom-cream/40 cursor-not-allowed select-none"
                title="शीघ्र आ रहा है (Coming soon)"
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="font-heading text-lg">{item.key ? t(item.key) : item.label}</span>
                </div>
                <span className="text-[10px] bg-loom-gold/20 text-loom-gold px-2 py-0.5 rounded-full border border-loom-gold/30">
                  {t('common.soonBadge', 'शीघ्र')}
                </span>
              </div>
            );
          }

          return (
            <Link
              key={idx}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all cursor-pointer ${
                active 
                  ? 'bg-loom-wood-light text-white border-l-4 border-loom-gold font-bold shadow-md' 
                  : 'hover:bg-loom-cream/10 text-loom-cream/80 hover:text-loom-cream'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 shrink-0" />
                <span className="font-heading text-lg">{item.key ? t(item.key) : item.label}</span>
              </div>
              <ChevronRight className={`w-4 h-4 transition-transform ${active ? 'translate-x-1 text-loom-gold' : 'opacity-0'}`} />
            </Link>
          );
        })}

        {/* Support Section Divider */}
        <div className="pt-4 pb-2 px-4 text-xs font-bold text-loom-gold tracking-widest uppercase border-t border-loom-gold/20 mt-4">
          {t('nav.sectionSupport', 'सहायता (Support)')}
        </div>

        {menuItems.filter(item => item.section === 'support').map((item, idx) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <Link
              key={idx + 100}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all cursor-pointer ${
                active 
                  ? 'bg-loom-wood-light text-white border-l-4 border-loom-gold font-bold shadow-md' 
                  : 'hover:bg-loom-cream/10 text-loom-cream/80 hover:text-loom-cream'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 shrink-0" />
                <span className="font-heading text-lg">{item.key ? t(item.key) : item.label}</span>
              </div>
              <ChevronRight className={`w-4 h-4 transition-transform ${active ? 'translate-x-1 text-loom-gold' : 'opacity-0'}`} />
            </Link>
          );
        })}
      </nav>

      {/* Logout button at bottom of sidebar */}
      <div className="p-4 border-t border-loom-gold/20 relative z-10 bg-loom-wood/50">
        <div className="flex items-center gap-3 px-4 py-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-loom-gold text-loom-wood font-heading font-bold flex items-center justify-center">
            {userProfile?.displayName ? userProfile.displayName.charAt(0) : 'S'}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="font-heading text-sm font-semibold truncate text-loom-cream">{userProfile?.displayName}</span>
            <span className="text-[10px] text-loom-gold truncate">coop1</span>
          </div>
        </div>
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-4 py-3 text-loom-cream/70 hover:text-loom-error hover:bg-loom-error/10 rounded-xl transition-all cursor-pointer font-heading text-base font-semibold"
        >
          <LogOut className="w-5 h-5" />
          {t('nav.logout')}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-loom-parchment flex flex-col md:flex-row">
      <OfflineBanner />
      {/* Mobile Top Bar */}
      <header className="app-chrome md:hidden h-16 px-4 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <EkatvaLogo size={36} showText={false} />
          <span className="font-heading text-xl font-bold text-loom-wood">{t('login.appName', 'एकत्व')} ({t('nav.secretaryTitle', 'सचिव')})</span>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <button 
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 text-loom-wood hover:bg-loom-sand/10 rounded-lg cursor-pointer"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Sidebar Overlay Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="relative w-72 h-full z-10 shadow-2xl">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-72 shrink-0 h-screen sticky top-0 border-r-4 border-loom-gold shadow-2xl z-30">
        <SidebarContent />
      </aside>

      {/* Main Content Pane */}
      <main className="app-content flex-1 p-4 pb-24 sm:p-6 sm:pb-28 md:p-8 md:pb-10 max-w-7xl mx-auto w-full overflow-y-auto">
        {children || <Outlet />}
      </main>
      <EkatvaHumsafar role="secretary" userName={userProfile?.displayName} />
    </div>
  );
};
