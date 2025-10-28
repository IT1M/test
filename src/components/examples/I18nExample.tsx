'use client';

import { useTranslations } from 'next-intl';
import { useLocaleFormatting } from '@/hooks/useLocaleFormatting';
import { LocaleSwitcher } from '@/components/ui/LocaleSwitcher';

/**
 * Example component demonstrating i18n features
 * This component shows how to:
 * - Use translations
 * - Format dates, numbers, and currencies
 * - Switch between locales
 */
export function I18nExample() {
  const t = useTranslations('common');
  const {
    formatDate,
    formatDateTime,
    formatNumber,
    formatCurrency,
    formatPercent,
    formatRelativeTime,
    locale,
  } = useLocaleFormatting();

  const now = new Date();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('title', { default: 'i18n Example' })}</h1>
        <LocaleSwitcher />
      </div>

      <div className="space-y-4">
        <section className="p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Current Locale</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Active locale: <span className="font-mono font-bold">{locale}</span>
          </p>
        </section>

        <section className="p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Translations</h2>
          <div className="space-y-2">
            <p>Save: {t('save')}</p>
            <p>Cancel: {t('cancel')}</p>
            <p>Loading: {t('loading')}</p>
            <p>Success: {t('success')}</p>
          </div>
        </section>

        <section className="p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Date Formatting</h2>
          <div className="space-y-2">
            <p>Date: {formatDate(now)}</p>
            <p>Date & Time: {formatDateTime(now)}</p>
            <p>Relative: {formatRelativeTime(yesterday)}</p>
          </div>
        </section>

        <section className="p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Number Formatting</h2>
          <div className="space-y-2">
            <p>Number: {formatNumber(1234567.89)}</p>
            <p>Currency: {formatCurrency(99.99, 'SAR')}</p>
            <p>Percent: {formatPercent(0.1234)}</p>
          </div>
        </section>

        <section className="p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-2">RTL Support</h2>
          <div className="space-y-2">
            <p className="text-start">Text aligned to start (changes based on direction)</p>
            <p className="text-end">Text aligned to end (changes based on direction)</p>
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 bg-blue-500 rounded"></div>
              <div className="ms-4 p-2 bg-gray-100 dark:bg-gray-800 rounded">
                Margin start (ms-4) - adapts to RTL
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
