import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useLanguage, SUPPORTED_LANGUAGES, SupportedLanguage } from '../LanguageContext';

interface LanguageSelectorProps {
  variant?: 'header' | 'compact' | 'expanded';
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  variant = 'header', 
  className = '' 
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLangObj = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code: SupportedLanguage) => {
    setLanguage(code);
    setIsOpen(false);
  };

  if (variant === 'expanded') {
    return (
      <div className={`space-y-2 ${className}`}>
        <label className="text-xs font-bold text-[#86868b] dark:text-[#8e8e93] uppercase tracking-wider block">
          {t('lang.choose', 'Language / Lugha / Idioma')}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleSelect(lang.code)}
                className={`p-3 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                  isSelected
                    ? 'border-[#004b49] dark:border-[#95d1ce] bg-[#004b49]/5 dark:bg-[#95d1ce]/10 text-[#004b49] dark:text-[#95d1ce] font-bold shadow-xs'
                    : 'border-[#e8e8ed] dark:border-[#2d2d2f] bg-white dark:bg-[#1d1d1f] hover:border-neutral-400 text-[#1d1d1f] dark:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{lang.flag}</span>
                  <div>
                    <span className="text-xs block leading-tight">{lang.nativeName}</span>
                    <span className="text-[10px] text-[#86868b] dark:text-[#8e8e93] block leading-tight">{lang.name}</span>
                  </div>
                </div>
                {isSelected && <Check className="w-4 h-4 text-[#004b49] dark:text-[#95d1ce]" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        id="language-selector-button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition cursor-pointer text-xs font-semibold ${
          isOpen
            ? 'bg-[#1d1d1f] dark:bg-white text-white dark:text-[#1d1d1f] border-[#1d1d1f] dark:border-white shadow-xs'
            : 'bg-[#f5f5f7] dark:bg-[#252526] text-[#1d1d1f] dark:text-white border-[#e8e8ed] dark:border-[#2d2d2f] hover:border-neutral-400'
        }`}
        title={t('lang.change_tooltip', 'Change language')}
      >
        <span className="text-sm leading-none">{currentLangObj.flag}</span>
        <span className="hidden xs:inline font-mono text-[11px] font-bold uppercase">{currentLangObj.code}</span>
        <ChevronDown className={`w-3 h-3 text-[#86868b] transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-48 rounded-xl bg-white dark:bg-[#1d1d1f] border border-[#e8e8ed] dark:border-[#2d2d2f] shadow-lg py-1 z-50 animate-fade-in font-sans">
          <div className="px-3 py-1.5 border-b border-[#f5f5f7] dark:border-[#2d2d2f] text-[10px] font-bold text-[#86868b] uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3" /> Select Language
            </span>
          </div>
          <div className="max-h-60 overflow-y-auto py-1">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = language === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSelect(lang.code)}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition cursor-pointer hover:bg-[#f5f5f7] dark:hover:bg-[#252526] ${
                    isSelected ? 'font-bold text-[#004b49] dark:text-[#95d1ce] bg-[#004b49]/5 dark:bg-[#95d1ce]/10' : 'text-[#1d1d1f] dark:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{lang.flag}</span>
                    <span>{lang.nativeName}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#004b49] dark:text-[#95d1ce]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
