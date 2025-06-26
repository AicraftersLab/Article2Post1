import { Switch as HeadlessSwitch } from '@headlessui/react';
import { useTranslation } from '../../utils/TranslationContext';

interface SwitchProps {
  label: string;
  enabled: boolean;
  onChange: () => void;
  description?: string;
}

export default function Switch({ label, enabled, onChange, description }: SwitchProps) {
  const { t } = useTranslation();
  
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>
        {description && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {description}
          </span>
        )}
      </div>
      <HeadlessSwitch
        checked={enabled}
        onChange={onChange}
        className={`${
          enabled ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600 ring-1 ring-gray-300 dark:ring-gray-500'
        } relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out`}
      >
        <span className="sr-only">{enabled ? t(`Disable ${label}`) : t(`Enable ${label}`)}</span>
        <span
          className={`${
            enabled ? 'translate-x-6' : 'translate-x-1'
          } inline-block h-4 w-4 transform rounded-full bg-white border border-gray-300 dark:border-gray-400 transition-transform duration-200 ease-in-out`}
          aria-hidden="true"
        />
      </HeadlessSwitch>
    </div>
  );
} 