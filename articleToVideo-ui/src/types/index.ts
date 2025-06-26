// Project type definitions

export type Language = {
  id: string;
  name: string;
  code: string;
};

export type InputMethod = 'url' | 'text';

export type ProgressStep = {
  id: number;
  name: string;
  completed: boolean;
  current: boolean;
};

export type BulletPoint = {
  id: number;
  text: string;
  image_path?: string;
};

export type SlideItem = {
  id: string;
  bulletPointId: number;
  text: string;
  image: string;
  customImage?: File | null;
  duration: number;
};

export type MusicItem = {
  id: string;
  name: string;
  category: string;
  src: string;
  duration: number;
  artist?: string;
};

export type VoiceOption = {
  id: string;
  name: string;
  gender: 'male' | 'female';
  language: string;
  sample?: string;
};

export type CustomizationSettings = {
  logo?: File | null;
  outro?: File | null;
  frame?: File | null;
};

export type ProjectSettings = {
  language: Language;
  slideCount: number;
  wordsPerPoint: number;
  backgroundMusic: boolean;
  voiceover: boolean;
  automaticDuration: boolean;
};

export type ArticleData = {
  id?: number;
  url?: string;
  text?: string;
  title?: string;
  summary?: string;
};

export type ProjectState = {
  settings: ProjectSettings;
  articleData: ArticleData;
  bulletPoints: BulletPoint[];
  slides: SlideItem[];
  selectedMusic?: MusicItem | null;
  selectedVoice?: VoiceOption | null;
  customization: CustomizationSettings;
  currentStep: number;
}; 