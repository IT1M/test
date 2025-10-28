"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";

// Login form validation schema
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get current locale from URL
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
  const currentLocale = currentPath.startsWith('/ar') ? 'ar' : 'en';
  const [locale, setLocale] = useState<"en" | "ar">(currentLocale);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Normalize email
      const normalizedEmail = data.email.trim().toLowerCase();
      
      // Get callback URL or use default dashboard
      let callbackUrl = searchParams.get("callbackUrl");
      if (!callbackUrl) {
        callbackUrl = `/${locale}/dashboard`;
      }

      const result = await signIn("credentials", {
        email: normalizedEmail,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error("Invalid email or password");
      }

      if (result?.ok) {
        console.log('Login successful, redirecting to:', callbackUrl);
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLocale = () => {
    const newLocale = locale === "en" ? "ar" : "en";
    setLocale(newLocale);
    // Update URL with new locale
    router.push(`/${newLocale}/login`);
  };

  const translations = {
    en: {
      title: "Sign in to Saudi Mais",
      subtitle: "Medical Inventory Management System",
      email: "Email address",
      password: "Password",
      rememberMe: "Remember me",
      signIn: "Sign in",
      noAccount: "Don't have an account?",
      register: "Register here",
      switchLanguage: "العربية",
    },
    ar: {
      title: "تسجيل الدخول إلى السعودية ميس",
      subtitle: "نظام إدارة المخزون الطبي",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      rememberMe: "تذكرني",
      signIn: "تسجيل الدخول",
      noAccount: "ليس لديك حساب؟",
      register: "سجل هنا",
      switchLanguage: "English",
    },
  };

  const t = translations[locale];

  return (
    <div
      className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 ${
        locale === "ar" ? "rtl" : "ltr"
      }`}
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <div className="max-w-md w-full space-y-8">
        {/* Language Toggle */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={toggleLocale}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
          >
            {t.switchLanguage}
          </button>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {t.title}
            </h2>
            <p className="text-sm text-gray-600">{t.subtitle}</p>
          </div>

          {/* Error Message */}
          {error && (
            <div
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
              role="alert"
            >
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t.email}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register("email")}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                  errors.email
                    ? "border-red-300 bg-red-50"
                    : "border-gray-300 bg-white"
                }`}
                placeholder={locale === "en" ? "you@example.com" : "you@example.com"}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t.password}
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register("password")}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                  errors.password
                    ? "border-red-300 bg-red-50"
                    : "border-gray-300 bg-white"
                }`}
                placeholder="••••••••"
                disabled={isLoading}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center">
              <input
                id="rememberMe"
                type="checkbox"
                {...register("rememberMe")}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                disabled={isLoading}
              />
              <label
                htmlFor="rememberMe"
                className={`${
                  locale === "ar" ? "mr-2" : "ml-2"
                } block text-sm text-gray-700`}
              >
                {t.rememberMe}
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 mr-3"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {locale === "en" ? "Signing in..." : "جاري تسجيل الدخول..."}
                </>
              ) : (
                t.signIn
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {t.noAccount}{" "}
              <a
                href={`/${locale}/register`}
                className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
              >
                {t.register}
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
