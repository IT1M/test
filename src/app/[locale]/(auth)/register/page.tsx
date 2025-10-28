"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Password strength calculation
const calculatePasswordStrength = (password: string): number => {
  let strength = 0;
  if (password.length >= 8) strength += 25;
  if (password.length >= 12) strength += 25;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
  if (/\d/.test(password)) strength += 15;
  if (/[^a-zA-Z0-9]/.test(password)) strength += 10;
  return Math.min(strength, 100);
};

// Registration form validation schema
const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be less than 100 characters"),
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain uppercase, lowercase, and number"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [locale, setLocale] = useState<"en" | "ar">("en");
  const [passwordStrength, setPasswordStrength] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch("password", "");

  // Update password strength when password changes
  useState(() => {
    setPasswordStrength(calculatePasswordStrength(password));
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Registration failed");
      }

      // Show success message
      setSuccess(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push(`/${locale}/login`);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLocale = () => {
    const newLocale = locale === "en" ? "ar" : "en";
    setLocale(newLocale);
    router.push(`/${newLocale}/register`);
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 40) return "bg-red-500";
    if (passwordStrength < 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 40)
      return locale === "en" ? "Weak" : "ضعيفة";
    if (passwordStrength < 70)
      return locale === "en" ? "Medium" : "متوسطة";
    return locale === "en" ? "Strong" : "قوية";
  };

  const translations = {
    en: {
      title: "Create your account",
      subtitle: "Join Saudi Mais Inventory System",
      name: "Full Name",
      email: "Email address",
      password: "Password",
      confirmPassword: "Confirm Password",
      passwordStrength: "Password Strength",
      register: "Create Account",
      haveAccount: "Already have an account?",
      signIn: "Sign in here",
      switchLanguage: "العربية",
      successTitle: "Registration Successful!",
      successMessage: "Redirecting to login page...",
    },
    ar: {
      title: "إنشاء حسابك",
      subtitle: "انضم إلى نظام مخزون السعودية ميس",
      name: "الاسم الكامل",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      confirmPassword: "تأكيد كلمة المرور",
      passwordStrength: "قوة كلمة المرور",
      register: "إنشاء حساب",
      haveAccount: "هل لديك حساب بالفعل؟",
      signIn: "سجل الدخول هنا",
      switchLanguage: "English",
      successTitle: "تم التسجيل بنجاح!",
      successMessage: "جاري التوجيه إلى صفحة تسجيل الدخول...",
    },
  };

  const t = translations[locale];

  if (success) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 px-4 ${
          locale === "ar" ? "rtl" : "ltr"
        }`}
        dir={locale === "ar" ? "rtl" : "ltr"}
      >
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {t.successTitle}
            </h2>
            <p className="text-gray-600">{t.successMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12 ${
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

        {/* Registration Card */}
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

          {/* Registration Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Name Field */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t.name}
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                {...register("name")}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                  errors.name
                    ? "border-red-300 bg-red-50"
                    : "border-gray-300 bg-white"
                }`}
                placeholder={
                  locale === "en" ? "John Doe" : "محمد أحمد"
                }
                disabled={isLoading}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.name.message}
                </p>
              )}
            </div>

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
                placeholder="you@example.com"
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
                autoComplete="new-password"
                {...register("password")}
                onChange={(e) => {
                  register("password").onChange(e);
                  setPasswordStrength(
                    calculatePasswordStrength(e.target.value)
                  );
                }}
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

              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">
                      {t.passwordStrength}
                    </span>
                    <span className="text-xs font-medium text-gray-700">
                      {getPasswordStrengthText()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                      style={{ width: `${passwordStrength}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t.confirmPassword}
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                {...register("confirmPassword")}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                  errors.confirmPassword
                    ? "border-red-300 bg-red-50"
                    : "border-gray-300 bg-white"
                }`}
                placeholder="••••••••"
                disabled={isLoading}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.confirmPassword.message}
                </p>
              )}
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
                  {locale === "en" ? "Creating account..." : "جاري إنشاء الحساب..."}
                </>
              ) : (
                t.register
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {t.haveAccount}{" "}
              <a
                href={`/${locale}/login`}
                className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
              >
                {t.signIn}
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
