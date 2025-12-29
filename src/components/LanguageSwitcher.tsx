import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Language Switcher Component
 *
 * Allows users to switch between Portuguese, English, and Spanish
 * Persists language preference to localStorage (automatic via i18next-browser-languagedetector)
 * For authenticated managers, also syncs to Firestore (handled by App.tsx)
 */

interface Language {
  code: 'pt' | 'en' | 'es';
  name: string;
  flag: React.ReactNode;
}

// Flag components usando emojis com fallback
const BrazilFlag = () => <span className="text-xl leading-none">🇧🇷</span>;
const USAFlag = () => <span className="text-xl leading-none">🇺🇸</span>;
const SpainFlag = () => <span className="text-xl leading-none">🇪🇸</span>;

const LANGUAGES: Language[] = [
  { code: 'pt', name: 'Português', flag: <BrazilFlag /> },
  { code: 'en', name: 'English', flag: <USAFlag /> },
  { code: 'es', name: 'Español', flag: <SpainFlag /> },
];

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage = LANGUAGES.find((lang) => lang.code === i18n.language) || LANGUAGES[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const changeLanguage = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    setIsOpen(false);

    // Dispatch custom event for App.tsx to sync to Firestore if user is authenticated
    window.dispatchEvent(
      new CustomEvent('languageChanged', { detail: { language: languageCode } })
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Language Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow"
        aria-label={t('language.changeLanguage')}
        aria-expanded={isOpen}
      >
        {currentLanguage.flag}
        <span className="hidden sm:inline">{currentLanguage.name}</span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 animate-slide-up">
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase border-b border-gray-100">
            {t('language.label')}
          </div>
          {LANGUAGES.map((language) => (
            <button
              key={language.code}
              onClick={() => changeLanguage(language.code)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                currentLanguage.code === language.code
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-gray-700'
              }`}
            >
              {language.flag}
              <span className="flex-1 text-left">{language.name}</span>
              {currentLanguage.code === language.code && (
                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
