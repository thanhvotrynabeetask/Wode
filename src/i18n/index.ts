import { useSettingsStore } from '../store/useSettingsStore';
import { translations, Translations } from './translations';

export * from './translations';

export function useTranslation() {
  const language = useSettingsStore((s) => s.language) || 'en';
  const tData = translations[language] || translations.en;

  const t = (path: string, params?: Record<string, string | number>): string => {
    const keys = path.split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let current: any = tData;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        // Fallback to English
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let fallback: any = translations.en;
        for (const fbKey of keys) {
          if (fallback && typeof fallback === 'object' && fbKey in fallback) {
            fallback = fallback[fbKey];
          } else {
            return path;
          }
        }
        current = fallback;
        break;
      }
    }

    if (typeof current !== 'string') {
      return path;
    }

    if (params) {
      let result = current;
      for (const [paramKey, paramValue] of Object.entries(params)) {
        result = result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
      }
      return result;
    }

    return current;
  };

  return {
    t,
    language,
    setLanguage: useSettingsStore.getState().setLanguage,
    translations: tData as Translations,
  };
}
