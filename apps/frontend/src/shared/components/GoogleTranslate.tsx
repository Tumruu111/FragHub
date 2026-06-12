import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { Globe } from 'lucide-react';

const LANGUAGES: [string, string][] = [
  ['en', 'EN'],
  ['mn', 'МН'],
  ['ru', 'RU'],
  ['ko', '한국어'],
  ['zh-CN', '中文'],
  ['ja', '日本語'],
];

declare global {
  interface Window {
    google?: {
      translate: {
        TranslateElement: new (
          options: { pageLanguage: string; includedLanguages: string; autoDisplay: boolean },
          elementId: string,
        ) => void;
      };
    };
    googleTranslateElementInit?: () => void;
  }
}

const SCRIPT_ID = 'google-translate-script';

const getCurrentLang = (): string => {
  const match = document.cookie.match(/(?:^|;\s*)googtrans=\/en\/([^;]+)/);
  return match ? decodeURIComponent(match[1]) : 'en';
};

export const GoogleTranslate: FC = () => {
  const [lang, setLang] = useState(getCurrentLang);

  useEffect(() => {
    if (document.getElementById(SCRIPT_ID)) return;

    window.googleTranslateElementInit = () => {
      if (!window.google) return;
      new window.google.translate.TranslateElement(
        {
          pageLanguage: 'en',
          includedLanguages: LANGUAGES.map(([code]) => code).join(','),
          autoDisplay: false,
        },
        'google_translate_element',
      );
    };

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const changeLang = (code: string) => {
    setLang(code);
    const host = window.location.hostname;
    // Clear cookie on all plausible domains, then set the new one
    document.cookie = `googtrans=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    document.cookie = `googtrans=;path=/;domain=${host};expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    if (code !== 'en') {
      document.cookie = `googtrans=/en/${code};path=/`;
      document.cookie = `googtrans=/en/${code};path=/;domain=${host}`;
    }
    window.location.reload();
  };

  return (
    <div className="lang-switcher">
      <Globe size={13} aria-hidden="true" />
      <select
        className="lang-select notranslate"
        value={lang}
        onChange={(e) => changeLang(e.target.value)}
        aria-label="Language"
      >
        {LANGUAGES.map(([code, label]) => (
          <option key={code} value={code}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
};
