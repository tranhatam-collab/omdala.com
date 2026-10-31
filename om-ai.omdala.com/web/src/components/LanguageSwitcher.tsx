import { useLocale, type Locale } from '../i18n/locale';

const OPTIONS: Array<{ locale: Locale; label: string }> = [
  { locale: 'en', label: 'English' },
  { locale: 'vi', label: 'Tiếng Việt' },
];

/** Each label is written in its own language, so it carries its own lang attribute. */
export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocale();
  return (
    <div role="group" aria-label={t('Language / Ngôn ngữ')} className="language-switcher">
      {OPTIONS.map((option) => (
        <button
          key={option.locale}
          type="button"
          lang={option.locale}
          aria-pressed={locale === option.locale}
          className={locale === option.locale ? '' : 'button-secondary'}
          onClick={() => setLocale(option.locale)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
