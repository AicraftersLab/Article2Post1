import { useEffect, useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import useProjectStore from '../../store/useProjectStore';
import { imageApi, handleApiError } from '../../services/api';
import type { SlideItem } from '../../types';
import { API_URL } from '../../config';
import { Button, StepContainer } from '../ui';
import { useTranslation } from '../../utils/TranslationContext';

const getBaseUrl = (url: string) => {
  try {
    const parsedUrl = new URL(url);
    return `${parsedUrl.protocol}//${parsedUrl.host}`;
  } catch (error) {
    // Fallback for relative URLs or invalid format
    return '';
  }
};

const API_BASE_URL = getBaseUrl(API_URL);

const Timer = ({ startTime }: { startTime: number | null }) => {
  const [elapsed, setElapsed] = useState(0);
  const { t } = useTranslation();

  useEffect(() => {
    if (!startTime) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  if (!startTime) return null;
  return <span className="text-sm text-gray-500 dark:text-gray-400">{t('elapsed', { seconds: elapsed })}</span>;
};

export default function SlidePreview() {
  const { bulletPoints, slides, setSlides, updateSlide, prevStep, nextStep, articleData, updateBulletPointImage } = useProjectStore();
  const { t } = useTranslation();
  
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageGenerationStartTime, setImageGenerationStartTime] = useState<number | null>(null);
  const generationTriggered = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (slides.length === 0 && bulletPoints.length > 0 && !isLoading && !generationTriggered.current) {
      generationTriggered.current = true;
      generateSlides();
    }
  }, [bulletPoints, slides.length, isLoading]);

  const generateSlides = async () => {
    setIsLoading(true);
    setError(null);
    setImageGenerationStartTime(Date.now());
    
    // Process each bullet point - generate images only for those without images
    const slidePromises = bulletPoints.map(async (point, index) => {
      // If the bullet point already has an image_path, use it instead of generating a new one
      if (point.image_path) {
        console.log(`Using existing image for bullet point ${point.id}: ${point.image_path}`);
        return {
          text: point.text,
          image: point.image_path.startsWith('http') 
            ? point.image_path 
            : `${API_BASE_URL}/static/img/${point.image_path}`,
          bulletPointId: point.id,
          fromExisting: true
        };
      }
      
      // Otherwise, generate a new image
      try {
        const response = await imageApi.generateImage(point.text, point.id);
        return {
          text: point.text,
          image: `${API_BASE_URL}${response.image_url}`,
          bulletPointId: point.id,
          fromExisting: false
        };
      } catch (error) {
          console.error(`Failed to generate image for "${point.text}":`, error);
          return {
            text: point.text,
          image: `https://picsum.photos/seed/${index}/800/450`, // Fallback
          bulletPointId: point.id,
          fromExisting: false
          };
      }
    });

    const slideData = await Promise.all(slidePromises);

    const newSlides: SlideItem[] = slideData.map((data) => ({
      id: uuidv4(),
      bulletPointId: data.bulletPointId,
      text: data.text,
      image: data.image,
      duration: 5
    }));

    setSlides(newSlides);
    setIsLoading(false);
    setImageGenerationStartTime(null);
  };

  const regenerateImage = async () => {
    if (!slides[currentSlideIndex]) return;
    setUploadingImage(true);
    setError(null);
    try {
      const currentSlide = slides[currentSlideIndex];
      const bulletPointId = currentSlide.bulletPointId;
      
      const response = await imageApi.generateImage(currentSlide.text, bulletPointId);
      
      // The backend returns the correct relative URL, so we build the full path
      const imagePath = response.image_url.split('/').pop();
      if (!imagePath) {
        throw new Error("Invalid image path received from server");
      }

      // Add a timestamp to bypass browser cache
      const newImageUrl = `${API_BASE_URL}/static/img/${imagePath}?t=${new Date().getTime()}`;
      
      // Update the slide with the new image URL
      updateSlide(currentSlide.id, { image: newImageUrl });
      
      // Also update the bullet point in the store with just the filename
      updateBulletPointImage(bulletPointId, imagePath);

    } catch (err) {
      setError(handleApiError(err));
    }
    setUploadingImage(false);
  };

  const handleImageUpload = async (file: File) => {
    const articleId = articleData?.id;

    if (!articleId) {
      setError(t('cannotUploadMissingArticleId'));
      return;
    }

    const currentSlide = slides[currentSlideIndex];
    if (!currentSlide) {
      setError(t('cannotUploadMissingSlide'));
      return;
    }

    setUploadingImage(true);
    setError(null);

    try {
      // Ensure bulletPointId is a number
      const bulletPointId = Number(currentSlide.bulletPointId);
      
      console.log("Uploading image for bullet point:", bulletPointId);
      console.log("Current slide data:", currentSlide);
      
      const response = await imageApi.uploadBulletPointImage(
        Number(articleId), 
        bulletPointId,
        file
      );
      
      console.log("Image upload response:", response);
      
      // Use the correct naming convention for uploaded images
      const imagePath = `point_${String(bulletPointId).padStart(2, '0')}.jpg`;
      console.log("Using standardized image path:", imagePath);
      
      // Create the full URL for the slide, with a cache-busting timestamp
      const newImageUrl = `${API_BASE_URL}/static/img/${imagePath}?t=${new Date().getTime()}`;
      console.log("New image URL:", newImageUrl);
      
      // Update the slide with the new image URL
      updateSlide(currentSlide.id, { image: newImageUrl });
      
      // Update the bullet point in the store with the image path
      updateBulletPointImage(bulletPointId, imagePath);
      console.log("Updated bullet point with image path:", imagePath);

    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setUploadingImage(false);
      // Reset file input value to allow uploading the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const handleTextChange = (text: string) => {
    if (slides[currentSlideIndex]) {
      updateSlide(slides[currentSlideIndex].id, { text });
    }
  };

  const goToSlide = (index: number) => {
    if (index >= 0 && index < slides.length) {
      setCurrentSlideIndex(index);
    }
  };

  const currentSlide = slides[currentSlideIndex];

  // Add this new function to handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleImageUpload(files[0]);
    }
  };

  // Add this function to handle drag and drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  if (isLoading) {
    return (
      <StepContainer title={t('step3Title')} subtitle={t('generatingSlidesSubtitle')}>
        <div className="animate-pulse">
          <div className="text-center mb-6">
              <p className="text-lg text-primary-600 dark:text-primary-400 font-semibold">{t('generatingImages')}</p>
        <Timer startTime={imageGenerationStartTime} />
      </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Image Skeleton */}
              <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="bg-gray-300 dark:bg-gray-700 rounded-lg w-full aspect-[16/9]"></div>
                  <div className="bg-gray-300 dark:bg-gray-700 rounded-md w-full h-14"></div>
              </div>

              {/* Controls Skeleton */}
              <div className="bg-gray-200 dark:bg-gray-800/50 rounded-lg shadow p-4 space-y-4">
                  <div className="bg-gray-300 dark:bg-gray-700 rounded-md w-full h-24"></div>
                  <div className="bg-gray-300 dark:bg-gray-700 rounded-md w-full h-6 mt-4"></div>
                  <div className="flex justify-between items-center mt-4">
                      <div className="bg-gray-300 dark:bg-gray-700 rounded-md w-32 h-10"></div>
                      <div className="flex items-center gap-2">
                          <div className="bg-gray-300 dark:bg-gray-700 rounded-full w-10 h-10"></div>
                          <div className="bg-gray-300 dark:bg-gray-700 rounded-md w-16 h-6"></div>
                          <div className="bg-gray-300 dark:bg-gray-700 rounded-full w-10 h-10"></div>
                      </div>
                  </div>
              </div>
          </div>
        </div>
        <div className="flex justify-between mt-8">
            <div className="bg-gray-300 dark:bg-gray-700 rounded-md w-24 h-11 animate-pulse"></div>
            <div className="bg-gray-300 dark:bg-gray-700 rounded-md w-24 h-11 animate-pulse"></div>
        </div>
      </StepContainer>
    );
  }

  return (
    <StepContainer title={t('step3Title')} subtitle={t('Preview and customize your video slides')}>
      {slides.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Image Preview */}
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative w-full">
                <img 
                src={currentSlide?.image} 
                  alt={`Slide ${currentSlideIndex + 1}`} 
                className="w-full rounded-lg shadow-md aspect-[16/9] object-cover"
              />
            </div>

            <div className="w-full">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('slide')} {currentSlideIndex + 1} / {slides.length}</p>
              <div className="flex justify-between items-center">
                <button
                  onClick={() => goToSlide(currentSlideIndex - 1)}
                  disabled={currentSlideIndex === 0}
                  className={`p-2 rounded-full ${
                    currentSlideIndex === 0
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                </button>
                
                <div className="flex gap-2">
                  <button 
                    onClick={regenerateImage} 
                    disabled={uploadingImage}
                    className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                  >
                    {uploadingImage ? t('generating') : t('regenerate')}
                  </button>
                </div>
                
                <button
                  onClick={() => goToSlide(currentSlideIndex + 1)}
                  disabled={currentSlideIndex === slides.length - 1}
                  className={`p-2 rounded-full ${
                    currentSlideIndex === slides.length - 1
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  <ArrowRightIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Slide Controls */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <div>
              <label htmlFor="slideText" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('slideTextLabel')}</label>
              <textarea 
                id="slideText" 
                value={currentSlide.text} 
                onChange={(e) => handleTextChange(e.target.value)} 
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500" 
                rows={5}
              ></textarea>
            </div>
            
            {/* Image Upload Section */}
            <div 
              className="mt-6 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('dragDropImageLabel')}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('or')}</p>
                <div>
                  <label className="inline-flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 cursor-pointer">
                    {t('replaceImageButton')}
                  <input
                    type="file"
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleFileSelect}
                    ref={fileInputRef}
                      disabled={uploadingImage}
                  />
                  </label>
                </div>
                {uploadingImage && (
                  <div className="flex items-center justify-center mt-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">{t('uploading')}</span>
                  </div>
                )}
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between mt-8">
        <Button onClick={prevStep}>
          {t('Back')}
        </Button>
        <Button onClick={nextStep}>
          {t('Next')}
        </Button>
      </div>
    </StepContainer>
  );
} 