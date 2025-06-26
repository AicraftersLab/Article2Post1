import { useState, useEffect } from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { isDarkMode, toggleTheme, fixInputFields } from '../../utils/themeUtils';

export default function ThemeToggle() {
  const [isCurrentlyDark, setIsCurrentlyDark] = useState(false);

  // Check theme on component load and when it changes
  useEffect(() => {
    const updateThemeState = () => {
      setIsCurrentlyDark(isDarkMode());
    };
    
    // Initial check
    updateThemeState();
    
    // Set up a mutation observer to detect theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          updateThemeState();
          fixInputFields();
        }
      });
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  const handleToggleTheme = () => {
    toggleTheme();
    setIsCurrentlyDark(isDarkMode());
  };

  return (
    <button
      onClick={handleToggleTheme}
      className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-colors"
      aria-label={isCurrentlyDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isCurrentlyDark ? (
        <SunIcon className="h-5 w-5" aria-hidden="true" />
      ) : (
        <MoonIcon className="h-5 w-5" aria-hidden="true" />
      )}
    </button>
  );
} 