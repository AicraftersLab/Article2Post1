import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { isDarkMode } from '../../utils/themeUtils';
import { useTranslation } from '../../utils/TranslationContext';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(isDarkMode());
  const { t } = useTranslation();

  // Simple effect to track dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setDarkMode(isDarkMode());
    };
    
    // Check initially
    checkDarkMode();
    
    // Set up observer
    const observer = new MutationObserver(checkDarkMode);
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  return (
    <div className={`h-screen flex overflow-hidden ${darkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Mobile sidebar */}
      <div 
        className={`fixed inset-0 z-40 flex md:hidden ${
          sidebarOpen ? "opacity-100 visible" : "opacity-0 invisible"
        } transition-opacity duration-300 ease-in-out`}
      >
        {/* Backdrop */}
        <div 
          className={`fixed inset-0 ${darkMode ? 'bg-gray-900 bg-opacity-80' : 'bg-gray-600 bg-opacity-75'}`}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        ></div>
        
        {/* Sidebar container */}
        <div className={`relative flex-1 flex flex-col max-w-xs w-full ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sr-only">{t('Close sidebar')}</span>
              <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
            </button>
          </div>
          
          <Sidebar />
        </div>
        
        <div className="flex-shrink-0 w-14" aria-hidden="true">
          {/* Dummy element to force sidebar to shrink to fit close icon */}
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <Sidebar />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Mobile top nav */}
        <div className={`md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 flex items-center shadow-sm border-b ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <button
            type="button"
            className={`-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 ${
              darkMode ? 'text-gray-400 hover:text-gray-100' : 'text-gray-500 hover:text-gray-900'
            }`}
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">{t('Open sidebar')}</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
          <h1 className={`text-lg font-bold ml-2 ${darkMode ? 'text-primary-400' : 'text-primary-600'}`}>
            {t('ArticleToVideo')}
          </h1>
        </div>
        
        <main className={`flex-1 relative overflow-y-auto focus:outline-none p-6 ${
          darkMode ? 'bg-gray-900' : 'bg-gray-50'
        }`}>
          {children}
        </main>
      </div>
    </div>
  );
} 