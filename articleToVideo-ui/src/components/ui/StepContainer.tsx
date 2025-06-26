import type { ReactNode } from 'react';
import { useTranslation } from '../../utils/TranslationContext';

interface StepContainerProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

/**
 * Container component for all steps to ensure consistent, wider layout
 */
export default function StepContainer({ children, title, subtitle }: StepContainerProps) {
  const { t } = useTranslation();
  
  return (
    <div className="max-w-5xl w-full mx-auto px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t(title)}</h1>
        {subtitle && (
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">{t(subtitle)}</p>
        )}
      </div>
      
      <div className="card shadow-lg border border-gray-200 dark:border-gray-700 rounded-xl p-6 md:p-8">
        {children}
      </div>
    </div>
  );
} 