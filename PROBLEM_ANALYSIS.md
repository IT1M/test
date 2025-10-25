# تحليل مفصل لمشكلة 404 في Next.js مع next-intl

## 📋 معلومات البيئة
- **Next.js**: 15.5.6
- **next-intl**: 4.4.0
- **next-auth**: 5.0.0-beta.29
- **الخطأ**: 404 / 500 على المسارات `/en` و `/en/login`

---

## 🔍 المشكلة الرئيسية

### الخطأ الحالي:
```
Error: No locale was returned from `getRequestConfig`.
```

### السبب الجذري:
في **next-intl v4** مع **Next.js 15**، تغيرت طريقة عمل `getRequestConfig`. المشكلة تحدث في ملف `src/i18n/request.ts`:

```typescript
export default getRequestConfig(async ({ locale }) => {
  return {
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
```

**المشكلة**: next-intl يتوقع أن يتم إرجاع `locale` في الـ return object، لكن الكود الحالي لا يُرجعه!

---

## 📊 تتبع المشكلة

### 1. من الـ Logs:
```
[i18n] Requested locale: en | Final locale: en
[i18n] Successfully loaded messages for: en
⨯ Error: No locale was returned from `getRequestConfig`.
```

**التحليل**:
- ✅ الـ locale يصل بشكل صحيح (`en`)
- ✅ الـ messages تُحمّل بنجاح
- ❌ لكن next-intl يشتكي من عدم إرجاع locale

### 2. عند استدعاء `getMessages()` بدون تمرير locale:
```
[i18n] Requested locale: undefined | Final locale: en
```

**التحليل**:
- ❌ الـ locale يصل كـ `undefined`
- ✅ الـ fallback يعمل ويستخدم `en`
- ❌ لكن next-intl لا يزال يشتكي

---

## 🎯 الحل الصحيح

### المشكلة في الكود الحالي:

**ملف**: `src/i18n/request.ts`

```typescript
// ❌ خطأ - لا يُرجع locale
export default getRequestConfig(async ({ locale }) => {
  return {
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
```

### الحل:

حسب [وثائق next-intl الرسمية](https://next-intl.dev/docs/usage/configuration#i18n-request)، يجب أن يكون الكود كالتالي:

```typescript
// ✅ صحيح - يُرجع locale بشكل صريح
export default getRequestConfig(async ({ locale }) => {
  return {
    locale,  // ← هذا مهم جداً!
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
```

---

## 🔧 الإصلاح الكامل

### 1. تحديث `src/i18n/request.ts`:

```typescript
import { getRequestConfig } from 'next-intl/server';

// Supported locales
export const locales = ['en', 'ar'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

// Locale labels
export const localeLabels: Record<Locale, string> = {
  en: 'English',
  ar: 'العربية',
};

// RTL locales
export const rtlLocales: Locale[] = ['ar'];

export function isRTL(locale: Locale): boolean {
  return rtlLocales.includes(locale);
}

export default getRequestConfig(async ({ locale }) => {
  // إذا لم يكن هناك locale أو كان غير صحيح، استخدم الافتراضي
  const finalLocale = locale && locales.includes(locale as any) ? locale : defaultLocale;
  
  try {
    const messages = (await import(`../../messages/${finalLocale}.json`)).default;
    return {
      locale: finalLocale,  // ← مهم جداً!
      messages,
    };
  } catch (error) {
    console.error(`[i18n] Failed to load messages for locale: ${finalLocale}`, error);
    // في حالة الفشل، حاول تحميل الإنجليزية
    const messages = (await import(`../../messages/en.json`)).default;
    return {
      locale: 'en',  // ← مهم جداً!
      messages,
    };
  }
});
```

### 2. تحديث `src/app/[locale]/layout.tsx`:

```typescript
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate locale
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // Get messages for the locale
  // في next-intl v4، يجب استدعاء getMessages() بدون تمرير locale
  // لأن locale يتم تعيينه من خلال getRequestConfig
  const messages = await getMessages();

  // Determine text direction
  const dir = isRTL(locale as Locale) ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider messages={messages}>
          {/* ... */}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

---

## 🔄 التغييرات المطلوبة

### التغيير الأساسي:
في `src/i18n/request.ts`، يجب إضافة `locale` في الـ return object:

```diff
export default getRequestConfig(async ({ locale }) => {
  const finalLocale = locale && locales.includes(locale as any) ? locale : 'en';
  
  try {
    const messages = (await import(`../../messages/${finalLocale}.json`)).default;
    return {
+     locale: finalLocale,  // ← إضافة هذا السطر
      messages,
    };
  } catch (error) {
    const messages = (await import(`../../messages/en.json`)).default;
    return {
+     locale: 'en',  // ← إضافة هذا السطر
      messages,
    };
  }
});
```

---

## 📚 المراجع

1. **next-intl v4 Documentation**: https://next-intl.dev/docs/usage/configuration#i18n-request
2. **Next.js 15 App Router**: https://nextjs.org/docs/app/building-your-application/routing/internationalization
3. **Breaking Changes in next-intl v4**: https://next-intl.dev/blog/next-intl-4-0

---

## ✅ الخطوات التالية

1. تطبيق التغيير في `src/i18n/request.ts` (إضافة `locale` في return)
2. إعادة تشغيل الخادم: `npm run dev`
3. اختبار المسارات:
   - `http://localhost:3001/en`
   - `http://localhost:3001/en/login`
   - `http://localhost:3001/ar`
   - `http://localhost:3001/ar/login`

---

## 🎯 النتيجة المتوقعة

بعد التطبيق:
- ✅ `/en` → يعمل بشكل صحيح
- ✅ `/en/login` → يعمل بشكل صحيح
- ✅ `/ar` → يعمل بشكل صحيح
- ✅ `/ar/login` → يعمل بشكل صحيح
- ✅ التبديل بين اللغات يعمل
- ✅ RTL/LTR يعمل بشكل صحيح
