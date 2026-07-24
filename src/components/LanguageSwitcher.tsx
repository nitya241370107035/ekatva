import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { Globe } from 'lucide-react';

export const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'hi', label: 'हिं', fullName: 'हिंदी' },
    { code: 'en', label: 'EN', fullName: 'English' }
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
  };

  // Respect prefers-reduced-motion
  const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div className="relative inline-block text-left z-50">
      {/* Wooden Stamp / Woven Label Button */}
      <motion.button
        whileHover={prefersReduced ? {} : { scale: 1.05, y: -1 }}
        whileTap={prefersReduced ? {} : { scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3.5 py-1.5 bg-loom-wood text-loom-cream rounded-full border-2 border-loom-gold shadow-md font-heading font-semibold text-sm cursor-pointer hover:bg-[#A0522D] transition-colors"
        aria-label="Switch Language"
      >
        <Globe size={15} className="text-loom-gold animate-pulse-slow" />
        <span className="tracking-wide">{currentLanguage.label}</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay to close when clicking outside */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />

            {/* Dropdown Options */}
            <motion.div
              initial={prefersReduced ? { opacity: 1 } : { opacity: 0, scale: 0.95, y: 10 }}
              animate={prefersReduced ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
              exit={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="absolute right-0 mt-2.5 w-32 bg-loom-cream rounded-xl border border-loom-beige shadow-xl overflow-hidden z-50"
            >
              <div className="py-1 bg-loom-cream">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className={`w-full text-left px-4 py-2 text-sm font-heading tracking-wide transition-colors duration-150 ${
                      i18n.language === lang.code
                        ? 'bg-loom-wood text-loom-cream font-bold'
                        : 'text-loom-ink hover:bg-loom-beige/40'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{lang.fullName}</span>
                      {i18n.language === lang.code && (
                        <span className="w-1.5 h-1.5 rounded-full bg-loom-gold animate-ping" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LanguageSwitcher;
