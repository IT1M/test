import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-900">
      <div className="px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-secondary-600 dark:text-secondary-400">
            © {currentYear} Saudi Mais Co. for Medical Products. All rights reserved.
          </div>
          <div className="flex gap-6 text-sm">
            <Link
              href="/privacy"
              className="text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              href="/support"
              className="text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
