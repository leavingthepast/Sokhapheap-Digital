import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Globe } from 'lucide-react';

interface LanguageSwitcherProps {
  variant?: 'header' | 'minimal' | 'banner';
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ variant = 'header' }) => {
  const { lang, setLang } = useLanguage();

  return (
    <div 
      id="language-switcher-control"
      className="inline-flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/90 shadow-2xs"
    >
      <button
        type="button"
        id="switch-lang-km-btn"
        onClick={() => setLang('km')}
        className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
          lang === 'km'
            ? 'bg-teal-700 text-white shadow-xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
        }`}
        title="ប្តូរទៅភាសាខ្មែរ (Khmer)"
      >
        <span className="font-extrabold text-[11px] tracking-tight">KH</span>
        <span>ខ្មែរ</span>
      </button>

      <button
        type="button"
        id="switch-lang-en-btn"
        onClick={() => setLang('en')}
        className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
          lang === 'en'
            ? 'bg-teal-700 text-white shadow-xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
        }`}
        title="Switch to English"
      >
        <span className="font-extrabold text-[11px] tracking-tight">EN</span>
        <span>English</span>
      </button>
    </div>
  );
};
