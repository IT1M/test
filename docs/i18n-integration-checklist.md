# i18n Integration Checklist

This checklist helps you integrate the i18n system into existing components.

## ✅ Completed Setup

- [x] Installed next-intl and tailwindcss-rtl
- [x] Created translation files (en.json, ar.json)
- [x] Configured locale routing with [locale] parameter
- [x] Set up middleware for locale handling
- [x] Created LocaleSwitcher component
- [x] Implemented formatting utilities
- [x] Configured RTL support

## 🔄 Integration Tasks

### 1. Navigation Components

- [ ] Add LocaleSwitcher to main navigation header
- [ ] Update navigation links to use next-intl Link component
- [ ] Replace hardcoded menu labels with translations
- [ ] Test navigation in both languages

### 2. Authentication Pages

- [ ] Update login page to use translations
- [ ] Update register page to use translations
- [ ] Replace error messages with translated versions
- [ ] Test form validation messages in both languages

### 3. Dashboard Pages

- [ ] Update dashboard page to use translations
- [ ] Replace KPI labels with translations
- [ ] Update chart titles and labels
- [ ] Test data visualization in both languages

### 4. Data Entry Page

- [ ] Update form labels with translations
- [ ] Replace validation messages with translations
- [ ] Update placeholder text
- [ ] Test form in both languages and RTL mode

### 5. Data Log Page

- [ ] Update table headers with translations
- [ ] Replace filter labels with translations
- [ ] Update action buttons
- [ ] Test table layout in RTL mode

### 6. Analytics Page

- [ ] Update chart titles with translations
- [ ] Replace KPI labels with translations
- [ ] Update AI insights section
- [ ] Test charts in both languages

### 7. Reports Page

- [ ] Update report type labels with translations
- [ ] Replace form labels with translations
- [ ] Update status messages
- [ ] Test report generation in both languages

### 8. Audit Log Page

- [ ] Update action labels with translations
- [ ] Replace entity type labels with translations
- [ ] Update filter options
- [ ] Test audit log in both languages

### 9. Backup & Restore Page

- [ ] Update button labels with translations
- [ ] Replace status messages with translations
- [ ] Update confirmation dialogs
- [ ] Test backup operations in both languages

### 10. Settings Pages

- [ ] Update all settings section titles with translations
- [ ] Replace form labels with translations
- [ ] Update success/error messages
- [ ] Test settings in both languages

### 11. User Management Page

- [ ] Update table headers with translations
- [ ] Replace role labels with translations
- [ ] Update permission labels
- [ ] Test user management in both languages

## 🎨 RTL Testing Checklist

For each page, test in Arabic (RTL mode):

- [ ] Layout mirrors correctly
- [ ] Text alignment is appropriate
- [ ] Icons and directional elements are mirrored
- [ ] Spacing and margins work correctly
- [ ] Forms are properly aligned
- [ ] Tables display correctly
- [ ] Modals and dialogs are centered
- [ ] Navigation flows right-to-left

## 📱 Component-Specific Tasks

### Buttons
```tsx
// Before
<button>Save</button>

// After
const t = useTranslations('common');
<button>{t('save')}</button>
```

### Forms
```tsx
// Before
<label>Email Address</label>

// After
const t = useTranslations('auth');
<label>{t('email')}</label>
```

### Tables
```tsx
// Before
<th>Name</th>

// After
const t = useTranslations('users');
<th>{t('name')}</th>
```

### Dates
```tsx
// Before
{new Date().toLocaleDateString()}

// After
const { formatDate } = useLocaleFormatting();
{formatDate(new Date())}
```

### Numbers
```tsx
// Before
{value.toLocaleString()}

// After
const { formatNumber } = useLocaleFormatting();
{formatNumber(value)}
```

## 🔍 Testing Checklist

- [ ] All pages load without errors in English
- [ ] All pages load without errors in Arabic
- [ ] Language switcher works on all pages
- [ ] Locale persists across navigation
- [ ] RTL layout works correctly
- [ ] Dates format correctly in both locales
- [ ] Numbers format correctly in both locales
- [ ] Form validation messages appear in correct language
- [ ] Error messages appear in correct language
- [ ] Success messages appear in correct language
- [ ] Toast notifications use correct language
- [ ] Email notifications use correct language (when implemented)

## 📝 Code Review Checklist

- [ ] No hardcoded text in components
- [ ] All translation keys exist in both en.json and ar.json
- [ ] RTL-aware Tailwind utilities used (ms-*, me-*, etc.)
- [ ] Formatting functions used for dates and numbers
- [ ] Translation namespaces are organized logically
- [ ] No console errors related to missing translations
- [ ] TypeScript types are correct
- [ ] Build completes successfully

## 🚀 Deployment Checklist

- [ ] Translation files are included in build
- [ ] Environment variables are set correctly
- [ ] Locale routing works in production
- [ ] Static pages are generated for both locales
- [ ] SEO meta tags include locale information
- [ ] Sitemap includes both language versions
- [ ] Analytics track locale information

## 📚 Documentation

- [ ] Update README with i18n information
- [ ] Document how to add new translations
- [ ] Document how to add new locales
- [ ] Create style guide for RTL design
- [ ] Document formatting conventions

## 🎯 Priority Order

1. **High Priority** (User-facing)
   - Navigation and header
   - Authentication pages
   - Main dashboard
   - Data entry form

2. **Medium Priority** (Frequently used)
   - Data log page
   - Analytics page
   - Settings pages

3. **Low Priority** (Admin features)
   - User management
   - Audit log
   - Backup & restore
   - Reports

## 💡 Tips

1. **Use translation namespaces**: Group related translations together
2. **Test as you go**: Switch to Arabic after updating each component
3. **Use RTL-aware utilities**: Always use `ms-*`, `me-*` instead of `ml-*`, `mr-*`
4. **Format all dates and numbers**: Never use raw date/number formatting
5. **Keep translations in sync**: When adding a key to en.json, add it to ar.json immediately
6. **Use the example component**: Reference `I18nExample.tsx` for usage patterns

## 🐛 Common Issues

### Translation not showing
- Check that the key exists in both language files
- Verify the namespace is correct
- Ensure the component is within NextIntlClientProvider

### RTL not working
- Verify the `dir` attribute is set on `<html>`
- Check that tailwindcss-rtl plugin is configured
- Use RTL-aware utilities instead of directional ones

### Formatting not working
- Ensure you're using the formatting functions
- Check that the locale is being passed correctly
- Verify the date/number is valid

## 📞 Support

For questions or issues:
1. Check the i18n guide: `docs/i18n-guide.md`
2. Review the example component: `src/components/examples/I18nExample.tsx`
3. Check next-intl documentation: https://next-intl-docs.vercel.app/
