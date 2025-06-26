/**
 * Application configuration
 */

// API URL from environment or fallback to default
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Other configuration values
export const DEFAULT_LANGUAGE = 'fr-FR';
export const DEFAULT_SLIDE_COUNT = 1;
export const DEFAULT_WORDS_PER_POINT = 20;

// Feature flags
export const ENABLE_MUSIC_API = true;
export const ENABLE_VOICEOVER = true;
export const ENABLE_CUSTOMIZATION = true;

// Backend API integration (set to true to use FastAPI backend)
export const ENABLE_BACKEND_API = true;

export default {
  API_URL,
  DEFAULT_LANGUAGE,
  DEFAULT_SLIDE_COUNT,
  DEFAULT_WORDS_PER_POINT,
  ENABLE_MUSIC_API,
  ENABLE_VOICEOVER,
  ENABLE_CUSTOMIZATION,
  ENABLE_BACKEND_API
}; 