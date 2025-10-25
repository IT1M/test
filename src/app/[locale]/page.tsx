import { useTranslations } from 'next-intl';

export default function Home() {
  const t = useTranslations('common');
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary-600 mb-4">
          Saudi Mais Inventory System
        </h1>
        <p className="text-lg text-secondary-600">
          Medical inventory management system
        </p>
        <div className="mt-8">
          <p className="text-sm text-gray-500">
            Current locale working correctly!
          </p>
        </div>
      </div>
    </main>
  )
}
