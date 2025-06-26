/**
 * Utility functions for handling theme-related functionality
 */

/**
 * Check if dark mode is currently active
 */
export const isDarkMode = (): boolean => {
  return document.documentElement.classList.contains('dark');
};

/**
 * Apply dark mode styles to input fields and other elements to ensure consistency
 */
export const fixInputFields = (): void => {
  const isDark = isDarkMode();
  
  // Fix input fields
  const inputFields = document.querySelectorAll('input:not([type="range"]), textarea, select');
  inputFields.forEach((element) => {
    if (element instanceof HTMLElement) {
      if (isDark) {
        element.style.backgroundColor = '#1f2937'; // dark:bg-gray-800
        element.style.borderColor = '#374151'; // dark:border-gray-700
        element.style.color = '#f9fafb'; // dark:text-white
        element.dataset.darkMode = 'true';
      } else {
        // Reset to default in light mode
        element.style.backgroundColor = '';
        element.style.borderColor = '';
        element.style.color = '';
        element.dataset.darkMode = 'false';
      }
    }
  });

  // Fix backgrounds of key containers
  const containers = document.querySelectorAll('.card, main, .bg-white, [class*="bg-gray-"]');
  containers.forEach((element) => {
    if (element instanceof HTMLElement) {
      // Add or remove explicit dark mode class
      if (isDark) {
        element.classList.add('dark-mode-applied');
      } else {
        element.classList.remove('dark-mode-applied');
      }
    }
  });
  
  // Force body to have correct dark mode class
  if (isDark) {
    document.body.classList.add('dark');
    document.body.classList.add('dark-mode-applied');
    document.body.style.backgroundColor = '#111827'; // dark:bg-gray-900
    document.body.style.color = '#f9fafb'; // dark:text-white
  } else {
    document.body.classList.remove('dark');
    document.body.classList.remove('dark-mode-applied');
    document.body.style.backgroundColor = '';
    document.body.style.color = '';
  }
};

/**
 * Apply dark mode directly to a specific element
 */
export const applyDarkModeToElement = (element: HTMLElement): void => {
  const isDark = isDarkMode();
  
  if (isDark) {
    element.classList.add('dark-mode-applied');
    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') {
      element.style.backgroundColor = '#1f2937';
      element.style.borderColor = '#374151';
      element.style.color = '#f9fafb';
    }
  } else {
    element.classList.remove('dark-mode-applied');
    element.style.backgroundColor = '';
    element.style.borderColor = '';
    element.style.color = '';
  }
};

/**
 * Toggle between dark and light themes
 */
export const toggleTheme = (): void => {
  const isDark = isDarkMode();
  
  if (isDark) {
    // Switch to light
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';
    localStorage.setItem('theme', 'light');
  } else {
    // Switch to dark
    document.documentElement.classList.add('dark');
    document.body.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';
    localStorage.setItem('theme', 'dark');
  }
  
  // Apply dark mode to all elements
  applyDarkModeToAllElements();
  
  // Fix input fields after toggling
  fixInputFields();
};

/**
 * Apply dark mode to all elements in the DOM
 */
export const applyDarkModeToAllElements = (): void => {
  // Force appropriate classes on all DOM elements that might need dark styling
  const allElements = document.querySelectorAll('*');
  const isDark = isDarkMode();
  
  allElements.forEach(el => {
    if (el instanceof HTMLElement) {
      if (isDark) {
        // Apply dark mode based on element type
        if (el.classList.contains('bg-white')) {
          el.classList.remove('bg-white');
          el.classList.add('dark:bg-gray-800');
          el.classList.add('bg-gray-800');
        }
        
        if (el.classList.contains('text-gray-900')) {
          el.classList.remove('text-gray-900');
          el.classList.add('dark:text-white');
          el.classList.add('text-white');
        }
      } else {
        // Remove explicit dark mode styles
        if (el.classList.contains('bg-gray-800') && el.classList.contains('dark:bg-gray-800')) {
          el.classList.remove('bg-gray-800');
          el.classList.add('bg-white');
        }
        
        if (el.classList.contains('text-white') && el.classList.contains('dark:text-white')) {
          el.classList.remove('text-white');
          el.classList.add('text-gray-900');
        }
      }
    }
  });
};

/**
 * Initialize theme based on saved preference or system preference
 */
export const initializeTheme = (): void => {
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.documentElement.classList.add('dark');
    document.body.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';
  } else {
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';
  }
  
  // Apply dark mode to all elements
  applyDarkModeToAllElements();
  
  // Fix input fields after initialization
  fixInputFields();
}; 