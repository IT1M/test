export const locales = ['en', 'ar'] as const;

export const pathnames = {
  '/': '/',
  '/login': '/login',
  '/register': '/register',
  '/dashboard': '/dashboard',
  '/analytics': '/analytics',
  '/audit': '/audit',
  '/backup': '/backup',
  '/data-entry': '/data-entry',
  '/data-log': '/data-log',
  '/reports': '/reports',
  '/settings': '/settings',
};

// Use the default: `always`
export const localePrefix = 'always';

export type AppPathnames = keyof typeof pathnames;