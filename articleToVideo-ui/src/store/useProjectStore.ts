import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { 
  ProjectState, 
  BulletPoint, 
  SlideItem,
  Language,
  MusicItem,
  VoiceOption,
  CustomizationSettings
} from '../types';

// Default languages
const languages: Language[] = [
  { id: 'en', name: 'English', code: 'en-US' },
  { id: 'es', name: 'Spanish', code: 'es-ES' },
  { id: 'fr', name: 'French', code: 'fr-FR' },
  { id: 'de', name: 'German', code: 'de-DE' },
  { id: 'it', name: 'Italian', code: 'it-IT' },
  { id: 'pt', name: 'Portuguese', code: 'pt-PT' },
];

const defaultSettings = {
  language: languages[2], // French (fr)
  slideCount: 1,
  wordsPerPoint: 20,
  backgroundMusic: true,
  voiceover: false,
  automaticDuration: true,
};

interface ProjectStore extends ProjectState {
  // Actions
  reset: () => void;
  newProject: () => void;
  setLanguage: (language: Language) => void;
  setSlideCount: (count: number) => void;
  setWordsPerPoint: (count: number) => void;
  toggleBackgroundMusic: () => void;
  toggleVoiceover: () => void;
  toggleAutomaticDuration: () => void;
  setArticleUrl: (url: string) => void;
  setArticleText: (text: string) => void;
  setArticleId: (id: number) => void;
  setArticleSummary: (title: string, summary: string) => void;
  setBulletPoints: (points: BulletPoint[]) => void;
  updateBulletPoint: (id: number, text: string) => void;
  updateBulletPointImage: (id: number, imagePath: string) => void;
  setSlides: (slides: SlideItem[]) => void;
  updateSlide: (id: string, data: Partial<SlideItem>) => void;
  selectMusic: (music: MusicItem | null) => void;
  selectVoice: (voice: VoiceOption | null) => void;
  updateCustomization: (settings: Partial<CustomizationSettings>) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  getLanguages: () => Language[];
  
  // Social Media Post properties and actions
  isGeneratingSocialPosts: boolean;
  generatedSocialPosts: any;
  setIsGeneratingSocialPosts: (isGenerating: boolean) => void;
  setGeneratedSocialPosts: (posts: any) => void;
}

const useProjectStore = create<ProjectStore>()(
  persist(
    (set) => ({
      // Initial state
      settings: defaultSettings,
      articleData: {},
      bulletPoints: [],
      slides: [],
      selectedMusic: null,
      selectedVoice: null,
      customization: {},
      currentStep: 0,
      
      // Social Media Post initial state
      isGeneratingSocialPosts: false,
      generatedSocialPosts: null,

      // Actions
      reset: () => set({
        settings: defaultSettings,
        articleData: {},
        bulletPoints: [],
        slides: [],
        selectedMusic: null,
        selectedVoice: null,
        customization: {},
        currentStep: 0,
        isGeneratingSocialPosts: false,
        generatedSocialPosts: null,
      }),

      newProject: async () => {
        // Clear backend cache completely for new project
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/cache/clear/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          if (response.ok) {
            console.log('Backend cache cleared successfully for new project');
          } else {
            console.warn('Failed to clear backend cache');
          }
        } catch (error) {
          console.warn('Error clearing backend cache:', error);
        }
        
        // Reset store state
        set({
          settings: defaultSettings,
          articleData: {},
          bulletPoints: [],
          slides: [],
          selectedMusic: null,
          selectedVoice: null,
          customization: {},
          currentStep: 0,
          isGeneratingSocialPosts: false,
          generatedSocialPosts: null,
        });
      },

      setLanguage: (language) => set((state) => ({
        settings: { ...state.settings, language }
      })),

      setSlideCount: (count) => set((state) => ({
        settings: { ...state.settings, slideCount: count }
      })),

      setWordsPerPoint: (count) => set((state) => ({
        settings: { ...state.settings, wordsPerPoint: count }
      })),

      toggleBackgroundMusic: () => set((state) => ({
        settings: { 
          ...state.settings, 
          backgroundMusic: !state.settings.backgroundMusic 
        }
      })),

      toggleVoiceover: () => set((state) => ({
        settings: { 
          ...state.settings, 
          voiceover: !state.settings.voiceover 
        }
      })),

      toggleAutomaticDuration: () => set((state) => ({
        settings: { 
          ...state.settings, 
          automaticDuration: !state.settings.automaticDuration 
        }
      })),

      setArticleUrl: (url) => set((state) => ({
        articleData: { ...state.articleData, url }
      })),

      setArticleText: (text) => set((state) => ({
        articleData: { ...state.articleData, text }
      })),

      setArticleId: (id) => set((state) => ({
        articleData: { ...state.articleData, id }
      })),

      setArticleSummary: (title, summary) => set((state) => ({
        articleData: { ...state.articleData, title, summary }
      })),

      setBulletPoints: (points) => set({ bulletPoints: points }),

      updateBulletPoint: (id, text) => set((state) => ({
        bulletPoints: state.bulletPoints.map(point => 
          point.id === id ? { ...point, text } : point
        )
      })),

      updateBulletPointImage: (id, imagePath) => set((state) => {
        console.log(`Updating bullet point ${id} with image path: ${imagePath}`);
        return {
          bulletPoints: state.bulletPoints.map(point => 
            point.id === id ? { ...point, image_path: imagePath } : point
          )
        };
      }),

      setSlides: (slides) => set({ slides }),

      updateSlide: (id, data) => set((state) => ({
        slides: state.slides.map(slide => 
          slide.id === id ? { ...slide, ...data } : slide
        )
      })),

      selectMusic: (music) => set({ selectedMusic: music }),

      selectVoice: (voice) => set({ selectedVoice: voice }),

      updateCustomization: (settings) => set((state) => ({
        customization: { ...state.customization, ...settings }
      })),

      nextStep: () => set((state) => ({
        currentStep: Math.min(state.currentStep + 1, 5)
      })),

      prevStep: () => set((state) => ({
        currentStep: Math.max(state.currentStep - 1, 0)
      })),

      goToStep: (step) => set((state) => ({
        currentStep: Math.max(0, Math.min(step, 5))
      })),

      getLanguages: () => languages,

      // Social Media Post actions
      setIsGeneratingSocialPosts: (isGenerating: boolean) => set({
        isGeneratingSocialPosts: isGenerating
      }),
      setGeneratedSocialPosts: (posts: any) => set({
        generatedSocialPosts: posts
      }),
    }),
    {
      name: 'article-to-video-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        settings: state.settings,
        articleData: state.articleData,
        bulletPoints: state.bulletPoints,
        slides: state.slides,
        selectedMusic: state.selectedMusic,
        selectedVoice: state.selectedVoice,
        customization: state.customization,
        currentStep: state.currentStep,
      }),
    }
  )
);

export default useProjectStore; 