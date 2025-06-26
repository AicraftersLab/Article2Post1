import { useState, Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { DocumentTextIcon, GlobeAltIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import useProjectStore from '../../store/useProjectStore';
import type { InputMethod } from '../../types';
import { StepContainer } from '../../components/ui';
import { articleApi, handleApiError } from '../../services/api';
import { useTranslation } from '../../utils/TranslationContext';

// Define the bullet point response type from the API
interface BulletPointResponse {
  id: number;
  text: string;
  order?: number;
  image_path?: string;
  audio_path?: string;
}

export default function ArticleInput() {
  const { 
    settings, 
    articleData, 
    getLanguages,
    setLanguage,
    setSlideCount,
    setWordsPerPoint,
    setArticleUrl, 
    setArticleText, 
    setArticleSummary,
    setArticleId,
    setBulletPoints,
    nextStep 
  } = useProjectStore();
  
  const { t } = useTranslation();
  const [inputMethod, setInputMethod] = useState<InputMethod>('url');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const languages = getLanguages();

  const handleMethodChange = (method: InputMethod) => {
    setInputMethod(method);
    setError(null);
    setSuccess(null);
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!articleData.url) {
      setError(t('Please enter a URL'));
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Call our backend API to process the article
      const result = await articleApi.processArticle(
        articleData.url, 
        undefined,
        settings.slideCount,
        settings.wordsPerPoint,
        settings.language.code
      );
      
      // Update store with API response data
      setArticleId(result.id);
      setArticleSummary(result.title, result.summary);
      
      // Map bullet points to our format
      const bulletPoints = result.bullet_points.map((bp: BulletPointResponse) => ({
        id: String(bp.id),
        text: bp.text
      }));
      
      setBulletPoints(bulletPoints);
      setSuccess(t('Article analyzed successfully!'));
      setIsLoading(false);
      
      // Automatically move to the next step after a short delay
      setTimeout(() => {
        nextStep();
      }, 1000); // 1 second delay to show the success message
    } catch (err) {
      setError(handleApiError(err) || t('Failed to analyze article. Please try again.'));
      setIsLoading(false);
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!articleData.text) {
      setError(t('Please enter article text'));
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Call our backend API to process the article text
      const result = await articleApi.processArticle(
        undefined,
        articleData.text,
        settings.slideCount,
        settings.wordsPerPoint,
        settings.language.code
      );
      
      // Update store with API response data
      setArticleId(result.id);
      setArticleSummary(result.title, result.summary);
      
      // Map bullet points to our format
      const bulletPoints = result.bullet_points.map((bp: BulletPointResponse) => ({
        id: String(bp.id),
        text: bp.text
      }));
      
      setBulletPoints(bulletPoints);
      setSuccess(t('Text processed successfully!'));
      setIsLoading(false);
      
      // Automatically move to the next step after a short delay
      setTimeout(() => {
        nextStep();
      }, 1000); // 1 second delay to show the success message
    } catch (err) {
      setError(handleApiError(err) || t('Failed to process text. Please try again.'));
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    if (!articleData.summary) {
      setError(t('Please analyze an article or enter text first'));
      return;
    }
    nextStep();
  };

  return (
    <StepContainer title="Step 1: Article Input" subtitle="Configure your post settings and enter the content you want to convert">
      {/* Configuration Section */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('Post Configuration')}</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Language Selection */}
          <div>
            <label 
              id="language-label"
              className="form-label mb-2"
            >
              {t('Language')}
            </label>
            <Listbox value={settings.language} onChange={setLanguage} aria-labelledby="language-label">
              <div className="relative">
                <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left shadow-sm border border-gray-300 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <span className="block truncate">{settings.language.name}</span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronUpDownIcon className="h-5 w-5 text-gray-400 dark:text-gray-300" aria-hidden="true" />
                  </span>
                </Listbox.Button>
                <Transition
                  as={Fragment}
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-700 dark:ring-gray-600 sm:text-sm">
                    {languages.map((language) => (
                      <Listbox.Option
                        key={language.id}
                        className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-10 pr-4 ${
                            active ? 'bg-primary-100 text-primary-900 dark:bg-primary-800 dark:text-white' : 'text-gray-900 dark:text-gray-100'
                          }`
                        }
                        value={language}
                      >
                        {({ selected }) => (
                          <>
                            <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                              {language.name}
                            </span>
                            {selected ? (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-600 dark:text-primary-400">
                                <CheckIcon className="h-5 w-5" aria-hidden="true" />
                              </span>
                            ) : null}
                          </>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </Transition>
              </div>
            </Listbox>
          </div>

          {/* Slide Count */}
          <div>
            <label 
              htmlFor="slide-count"
              className="form-label mb-2"
            >
              {t('Slide Count')}: {settings.slideCount}
            </label>
            <input
              id="slide-count"
              type="range"
              min={1}
              max={10}
              value={settings.slideCount}
              onChange={(e) => setSlideCount(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>1</span>
              <span>10</span>
            </div>
          </div>

          {/* Words Per Point */}
          <div>
            <label 
              htmlFor="words-per-point"
              className="form-label mb-2"
            >
              {t('Words Per Point')}: {settings.wordsPerPoint}
            </label>
            <input
              id="words-per-point"
              type="range"
              min={10}
              max={30}
              value={settings.wordsPerPoint}
              onChange={(e) => setWordsPerPoint(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>10</span>
              <span>30</span>
            </div>
          </div>
        </div>


      </div>

      {/* Article Input Section */}
      <div className="flex mb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          type="button"
          className={`pb-3 px-6 flex items-center gap-2 ${
            inputMethod === 'url'
              ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400 font-medium'
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
          onClick={() => handleMethodChange('url')}
          aria-pressed={inputMethod === 'url'}
        >
          <GlobeAltIcon className="h-5 w-5" aria-hidden="true" />
          <span>{t('URL')}</span>
        </button>
        <button
          type="button"
          className={`pb-3 px-6 flex items-center gap-2 ${
            inputMethod === 'text'
              ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400 font-medium'
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
          onClick={() => handleMethodChange('text')}
          aria-pressed={inputMethod === 'text'}
        >
          <DocumentTextIcon className="h-5 w-5" aria-hidden="true" />
          <span>{t('Text')}</span>
        </button>
      </div>

      {inputMethod === 'url' ? (
        <form onSubmit={handleUrlSubmit} className="space-y-6">
          <div>
            <label htmlFor="url" className="form-label text-base">
              {t('Article URL')}
            </label>
            <input
              type="url"
              id="url"
              className="input py-3 text-base mt-2 w-full"
              placeholder={t('Enter article URL')}
              value={articleData.url || ''}
              onChange={(e) => setArticleUrl(e.target.value)}
              aria-describedby={error ? "url-error" : undefined}
              aria-invalid={error ? "true" : "false"}
            />
            {error && <p id="url-error" className="form-error">{error}</p>}
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between pt-4">
            <button
              type="submit"
              className="btn btn-primary py-3 px-6 flex-1"
              disabled={isLoading}
              aria-live="polite"
            >
              {isLoading ? t('Analyzing...') : t('Analyze')}
            </button>
            {articleData.summary && (
              <button
                type="button"
                onClick={handleContinue}
                className="btn btn-secondary py-3 px-6 flex-1 sm:flex-none items-center inline-flex justify-center gap-2 font-medium"
              >
                {t('Continue')} <ArrowRightIcon className="h-5 w-5" />
              </button>
            )}
          </div>
          {success && <p className="text-green-600 dark:text-green-400 mt-4">{success}</p>}
        </form>
      ) : (
        <form onSubmit={handleTextSubmit} className="space-y-6">
          <div>
            <label htmlFor="article-text" className="form-label text-base">
              {t('Article Content')}
            </label>
            <textarea
              id="article-text"
              className="input py-3 text-base mt-2 w-full h-64"
              placeholder={t('Enter article content')}
              value={articleData.text || ''}
              onChange={(e) => setArticleText(e.target.value)}
              aria-describedby={error ? "text-error" : undefined}
              aria-invalid={error ? "true" : "false"}
            />
            {error && <p id="text-error" className="form-error">{error}</p>}
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between pt-4">
            <button
              type="submit"
              className="btn btn-primary py-3 px-6 flex-1"
              disabled={isLoading}
              aria-live="polite"
            >
              {isLoading ? t('Processing...') : t('Process')}
            </button>
            {articleData.summary && (
              <button
                type="button"
                onClick={handleContinue}
                className="btn btn-secondary py-3 px-6 flex-1 sm:flex-none items-center inline-flex justify-center gap-2 font-medium"
              >
                {t('Continue')} <ArrowRightIcon className="h-5 w-5" />
              </button>
            )}
          </div>
          {success && <p className="text-green-600 dark:text-green-400 mt-4">{success}</p>}
        </form>
      )}
    </StepContainer>
  );
} 