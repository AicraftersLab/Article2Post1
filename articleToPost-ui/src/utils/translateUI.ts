/**
 * Utility function to apply UI translations throughout the application
 */

import { setCurrentLanguage } from './i18n';

/**
 * Sets the UI language across the application
 * 
 * @param lang The language code to set ('en', 'fr', etc.)
 */
export function translateUI(lang: string): void {
  // Set the language in our translation system
  setCurrentLanguage(lang);

  // Update the document language attribute
  document.documentElement.lang = lang;

  // You could potentially add more language-specific adjustments here
  // For example, adjusting date formatting, number formatting, etc.

  console.log(`UI language changed to: ${lang}`);
} 