import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initializeTheme, fixInputFields } from './utils/themeUtils';
import { TranslationProvider } from './utils/TranslationContext';

// Initialize the theme
initializeTheme();

// Add listener for system preference changes
const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
darkModeMediaQuery.addEventListener('change', (e) => {
  // Only change if user hasn't manually set a preference
  if (!localStorage.getItem('theme')) {
    if (e.matches) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    fixInputFields();
  }
});

// Create and render the app
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TranslationProvider>
    <App />
    </TranslationProvider>
  </React.StrictMode>,
);
