import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import StepContainer from '../ui/StepContainer';
import useProjectStore from '../../store/useProjectStore';
import { generateSocialPosts, getSocialPostStatus, downloadSocialPostImage } from '../../services/api';
import { API_URL } from '../../config';

// Platform configurations
const PLATFORM_CONFIGS = {
  instagram: {
    name: 'Instagram',
    icon: '📸',
    description: 'Posts carrés optimisés pour Instagram',
    maxLength: 2200,
    color: 'bg-gradient-to-br from-purple-500 to-pink-500'
  },
  facebook: {
    name: 'Facebook',
    icon: '👥',
    description: 'Posts optimisés pour Facebook',
    maxLength: 63206,
    color: 'bg-blue-600'
  },
  linkedin: {
    name: 'LinkedIn',
    icon: '💼',
    description: 'Posts professionnels pour LinkedIn',
    maxLength: 3000,
    color: 'bg-blue-700'
  },
  twitter: {
    name: 'Twitter/X',
    icon: '🐦',
    description: 'Posts courts pour Twitter/X',
    maxLength: 280,
    color: 'bg-black'
  }
};

interface SocialPost {
  platform: string;
  caption: string;
  hashtags: string[];
  call_to_action: string;
  image_path?: string;
  character_count: number;
  hashtag_count: number;
}

interface SocialPostsResult {
  id: number;
  status: string;
  posts: Record<string, SocialPost>;
  download_urls?: Record<string, string>;
}

export default function SocialPostGeneration() {
  const { 
    articleData, 
    bulletPoints, 
    settings,
    isGeneratingSocialPosts,
    setIsGeneratingSocialPosts,
    generatedSocialPosts,
    setGeneratedSocialPosts
  } = useProjectStore();

  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram', 'facebook']);
  const [generationStatus, setGenerationStatus] = useState<'idle' | 'generating' | 'completed' | 'error'>('idle');
  const [socialPostId, setSocialPostId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [previewPlatform, setPreviewPlatform] = useState<string>('instagram');

  const canGenerate = articleData && bulletPoints.length > 0 && selectedPlatforms.length > 0;

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const handleGenerateSocialPosts = async () => {
    if (!articleData || bulletPoints.length === 0) return;

    setIsGeneratingSocialPosts(true);
    setGenerationStatus('generating');
    setError(null);
    setStatusMessage('Démarrage de la génération...');

    try {
      const result = await generateSocialPosts({
        article_id: articleData.id,
        bullet_points: bulletPoints,
        platforms: selectedPlatforms,
        language: settings.language.id,
        skip_image_generation: false
      });

      setSocialPostId(result.id);
      setStatusMessage('Génération en cours...');
      
      // Poll for completion
      const pollStatus = async () => {
        try {
          const status = await getSocialPostStatus(result.id);
          
          if (status.status === 'completed') {
            setGeneratedSocialPosts(status.posts);
            setGenerationStatus('completed');
            setStatusMessage('Posts générés avec succès !');
            setIsGeneratingSocialPosts(false);
          } else if (status.status === 'failed') {
            setError('Erreur lors de la génération des posts');
            setGenerationStatus('error');
            setIsGeneratingSocialPosts(false);
          } else {
            // Still processing, continue polling
            setTimeout(pollStatus, 2000);
          }
        } catch (err) {
          console.error('Error polling status:', err);
          setError('Erreur lors de la vérification du statut');
          setGenerationStatus('error');
          setIsGeneratingSocialPosts(false);
        }
      };

      setTimeout(pollStatus, 2000);

    } catch (err: any) {
      console.error('Error generating social posts:', err);
      setError(err.message || 'Erreur lors de la génération des posts');
      setGenerationStatus('error');
      setIsGeneratingSocialPosts(false);
    }
  };

  const handleDownloadImage = async (platform: string) => {
    if (!socialPostId) return;
    
    try {
      await downloadSocialPostImage(socialPostId, platform);
    } catch (err: any) {
      console.error('Error downloading image:', err);
      setError('Erreur lors du téléchargement de l\'image');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  return (
    <StepContainer
      title="Génération des Posts Sociaux"
      subtitle="Générez des posts optimisés pour différentes plateformes sociales"
    >
      <div className="space-y-6">
        
        {/* Single Article Summary */}
        {bulletPoints.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Résumé de votre article
            </h3>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-lg text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
                    {bulletPoints[0]?.text}
                  </p>
                </div>
              </div>
            </div>
            {/* Image générée preview */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900 dark:text-white">
                Image générée pour vos posts
              </h4>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="aspect-[16/9] rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 mb-4">
                  <img 
                    src={`${API_URL.replace('/api', '')}/static/img/point_01.jpg`}
                    alt="Image générée pour l'article"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyNSIgdmlld0JveD0iMCAwIDQwMCAyMjUiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjI1IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xODAgMTEyLjVMMjIwIDEzNUwxODAgMTU3LjVWMTEyLjVaIiBmaWxsPSIjOUI5QkEwIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTgwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOUI5QkEwIiBmb250LWZhbWlseT0ic3lzdGVtLXVpLCAtYXBwbGUtc3lzdGVtLCBCbGlua01hY1N5c3RlbUZvbnQiIGZvbnQtc2l6ZT0iMTQiPkltYWdlIGVuIGNvdXJzIGRlIGfDqW7DqXJhdGlvbi4uLjwvdGV4dD4KPHN2Zz4=';
                    }}
                  />
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-blue-500 text-lg">🎨</span>
                    <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                      Cette image sera utilisée pour tous vos posts sociaux
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Platform Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Sélectionnez les plateformes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(PLATFORM_CONFIGS).map(([key, config]) => (
              <div
                key={key}
                className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all ${
                  selectedPlatforms.includes(key)
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                }`}
                onClick={() => togglePlatform(key)}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg ${config.color} flex items-center justify-center text-white text-lg`}>
                    {config.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {config.name}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {config.description}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Max: {config.maxLength} caractères
                    </p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 ${
                    selectedPlatforms.includes(key)
                      ? 'bg-blue-500 border-blue-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {selectedPlatforms.includes(key) && (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Generation Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleGenerateSocialPosts}
            disabled={!canGenerate || isGeneratingSocialPosts}
            className="px-8 py-3 text-lg"
          >
            {isGeneratingSocialPosts ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Génération en cours...</span>
              </div>
            ) : (
              '🚀 Générer les Posts'
            )}
          </Button>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {statusMessage}
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-400">⚠️</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Erreur de génération
                </h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  {error}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Generated Posts Preview */}
        {generatedSocialPosts && Object.keys(generatedSocialPosts).length > 0 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Posts générés
            </h3>

            {/* Platform Tabs */}
            <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              {Object.keys(generatedSocialPosts).map((platform) => (
                <button
                  key={platform}
                  onClick={() => setPreviewPlatform(platform)}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    previewPlatform === platform
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {PLATFORM_CONFIGS[platform as keyof typeof PLATFORM_CONFIGS]?.icon} {PLATFORM_CONFIGS[platform as keyof typeof PLATFORM_CONFIGS]?.name}
                </button>
              ))}
            </div>

            {/* Post Preview */}
            {generatedSocialPosts[previewPlatform] && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className={`${PLATFORM_CONFIGS[previewPlatform as keyof typeof PLATFORM_CONFIGS]?.color} px-4 py-3`}>
                  <h4 className="text-white font-medium">
                    {PLATFORM_CONFIGS[previewPlatform as keyof typeof PLATFORM_CONFIGS]?.name} Post
                  </h4>
                </div>
                
                <div className="p-4 space-y-4">
                  {/* Image */}
                  {generatedSocialPosts[previewPlatform].image_path && (
                    <div className="flex justify-center">
                      <img 
                        src={`/static/social_posts/${previewPlatform}_post_image.jpg`}
                        alt={`${previewPlatform} post`}
                        className="max-w-md rounded-lg shadow-md"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  {/* Caption */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium text-gray-900 dark:text-white">Caption:</h5>
                      <button
                        onClick={() => copyToClipboard(generatedSocialPosts[previewPlatform].caption)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        📋 Copier
                      </button>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded p-3 text-sm">
                      {generatedSocialPosts[previewPlatform].caption}
                    </div>
                    <p className="text-xs text-gray-500">
                      {generatedSocialPosts[previewPlatform].character_count} caractères
                    </p>
                  </div>

                  {/* Hashtags */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium text-gray-900 dark:text-white">Hashtags:</h5>
                      <button
                        onClick={() => copyToClipboard(generatedSocialPosts[previewPlatform].hashtags.join(' '))}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        📋 Copier
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {generatedSocialPosts[previewPlatform].hashtags.map((hashtag, index) => (
                        <span
                          key={index}
                          className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded"
                        >
                          {hashtag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Call to Action */}
                  <div className="space-y-2">
                    <h5 className="font-medium text-gray-900 dark:text-white">Call to Action:</h5>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded p-3 text-sm">
                      {generatedSocialPosts[previewPlatform].call_to_action}
                    </div>
                  </div>

                  {/* Download Button */}
                  {generatedSocialPosts[previewPlatform].image_path && (
                    <div className="flex justify-center">
                      <Button
                        onClick={() => handleDownloadImage(previewPlatform)}
                        variant="outline"
                        className="text-sm"
                      >
                        📥 Télécharger l'image
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </StepContainer>
  );
} 