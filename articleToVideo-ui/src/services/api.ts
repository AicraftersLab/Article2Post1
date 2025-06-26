import axios from 'axios';
import { API_URL, ENABLE_BACKEND_API } from '../config';
import type { BulletPoint } from '../types';

// Create an axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000, // 2 minutes for image generation
});

// Create a separate axios instance for image generation with longer timeout
const imageApi_axios = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 300000, // 5 minutes for image generation
});

// Mock data for offline mode
const mockArticleResponse = {
  id: 1,
  title: "Sample Article Title",
  summary: "This is a mock summary of the article content. When the backend is disabled, this sample data is used to allow the frontend to function independently.",
  bullet_points: [
    { id: 1, text: "First key point from the article with detailed explanation" },
    { id: 2, text: "Second important insight that provides valuable information" },
    { id: 3, text: "Third crucial element that users should understand" },
    { id: 4, text: "Fourth significant aspect of the topic being discussed" }
  ]
};

const mockMusicCategories = ['Electronic', 'Pop', 'Rock', 'Jazz', 'Classical', 'Ambient'];

const mockMusicTracks = [
  {
    id: 'track1',
    title: 'Sample Electronic Track',
    category: 'Electronic',
    url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
    duration: 180,
    artist: 'Sample Artist'
  },
  {
    id: 'track2', 
    title: 'Sample Pop Song',
    category: 'Pop',
    url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
    duration: 200,
    artist: 'Pop Artist'
  }
];

// Article API
export const articleApi = {
  // Process article from URL or text
  processArticle: async (url?: string, text?: string, slideCount: number = 5, wordsPerPoint: number = 20, language: string = 'anglais') => {
    if (!ENABLE_BACKEND_API) {
      // Return mock data when backend is disabled
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      return {
        ...mockArticleResponse,
        bullet_points: mockArticleResponse.bullet_points.slice(0, slideCount)
      };
    }
    
    const response = await api.post('/articles/process/', {
      url,
      text,
      slide_count: slideCount,
      words_per_point: wordsPerPoint,
      language
    });
    return response.data;
  },
  
  // Get a specific article by ID
  getArticle: async (id: number) => {
    if (!ENABLE_BACKEND_API) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockArticleResponse;
    }
    
    const response = await api.get(`/articles/${id}/`);
    return response.data;
  },
  
  // Get all articles
  getArticles: async () => {
    if (!ENABLE_BACKEND_API) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return [mockArticleResponse];
    }
    
    const response = await api.get('/articles/');
    return response.data;
  }
};

// Bullet Point Management API
export const bulletPointApi = {
  // Update a specific bullet point
  updateBulletPoint: async (articleId: number, bulletPointId: number, text: string, keywords: string[] = []) => {
    if (!ENABLE_BACKEND_API) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        id: bulletPointId,
        text,
        keywords
      };
    }
    
    const response = await api.put(`/articles/${articleId}/bullet-points/${bulletPointId}/`, {
      text,
      keywords
    });
    return response.data;
  },
  
  // Regenerate a specific bullet point
  regenerateBulletPoint: async (articleId: number, bulletPointId: number, context?: string, language?: string, wordsPerPoint?: number) => {
    if (!ENABLE_BACKEND_API) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return {
        id: bulletPointId,
        text: `Regenerated bullet point ${bulletPointId} with improved content and better engagement`,
        original_text: `Original bullet point ${bulletPointId}`
      };
    }
    
    const response = await api.post(`/articles/${articleId}/bullet-points/${bulletPointId}/regenerate/`, {
      article_id: articleId,
      bullet_point_id: bulletPointId,
      context,
      language: language || 'en',
      words_per_point: wordsPerPoint || 15
    });
    return response.data;
  },
  
  // Regenerate all bullet points
  regenerateAllBulletPoints: async (
    articleId: number, 
    slideCount: number = 5, 
    wordsPerPoint: number = 15, 
    language: string = 'fr'
  ) => {
    if (!ENABLE_BACKEND_API) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      const newBulletPoints = Array.from({ length: slideCount }, (_, i) => ({
        id: i + 1,
        text: `Regenerated bullet point ${i + 1} with fresh content and improved clarity`,
        order: i + 1
      }));
      return {
        article_id: articleId,
        bullet_points: newBulletPoints,
        count: slideCount
      };
    }
    
    const response = await api.post(`/articles/${articleId}/bullet-points/regenerate-all/`, {
      article_id: articleId,
      slide_count: slideCount,
      words_per_point: wordsPerPoint,
      language
    });
    return response.data;
  },
  
  // Extract keywords from article
  extractKeywords: async (articleId: number) => {
    if (!ENABLE_BACKEND_API) {
      await new Promise(resolve => setTimeout(resolve, 800));
      return {
        keywords: [
          'important', 'analysis', 'research', 'development', 'innovation',
          'technology', 'solution', 'strategy', 'implementation', 'results',
          'performance', 'efficiency', 'optimization', 'growth', 'success'
        ]
      };
    }
    
    const response = await api.get(`/articles/${articleId}/keywords/`);
    return response.data;
  },

  // Upload an image for a specific bullet point
  uploadBulletPointImage: async (articleId: number, bulletPointId: number, file: File) => {
    if (!ENABLE_BACKEND_API) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      // In mock mode, we can't really upload, so we'll just return a placeholder path
      return {
        message: "Mock image uploaded successfully",
        image_path: "/mock-images/uploaded_image.jpg"
      };
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(
      `/articles/${articleId}/bullet-points/${bulletPointId}/upload-image/`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }
};

// Video API
export const videoApi = {
  // Generate video
  generateVideo: async (payload: {
    article_id: number;
    bullet_points: BulletPoint[];
    language?: string;
    voiceover_enabled?: boolean;
    voice_id?: string;
    music_enabled?: boolean;
    music_id?: string;
    automatic_duration?: boolean;
    frame_durations?: number[];
    use_existing_images?: boolean;
  }) => {
    if (!ENABLE_BACKEND_API) {
      await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate longer processing
      return {
        id: 1,
        status: 'completed',
        download_url: '/mock-video.mp4'
      };
    }
    
    // The backend expects specific keys, so we map our payload to them
    const requestData = {
      article_id: payload.article_id,
      bullet_points: payload.bullet_points,
      language: payload.language || 'en',
      add_voiceover: payload.voiceover_enabled,
      voice_id: payload.voice_id,
      add_music: payload.music_enabled,
      music_id: payload.music_id,
      auto_duration: payload.automatic_duration,
      frame_durations: payload.frame_durations,
      skip_assets: payload.use_existing_images
    };
    
    const response = await api.post('/videos/generate/', requestData);
    return response.data;
  },
  
  // Get a specific video
  getVideo: async (id: number) => {
    if (!ENABLE_BACKEND_API) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        id,
        status: 'completed',
        download_url: '/mock-video.mp4'
      };
    }
    
    const response = await api.get(`/videos/${id}/`);
    return response.data;
  },
  
  // Download video
  downloadVideo: async (id: number) => {
    if (!ENABLE_BACKEND_API) {
      return 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4';
    }
    
    // This needs to be a direct link for browser download
    return `${API_URL}/videos/${id}/download/`;
  }
};

// Music API
export const musicApi = {
  // Get available music categories 
  getCategories: async () => {
    if (!ENABLE_BACKEND_API) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockMusicCategories;
    }
    
    const response = await api.get('/music/categories/');
    return response.data.categories;
  },
  
  // Search for music
  searchMusic: async (
    query: string = '', 
    category: string | null | undefined = undefined, 
    provider: string = 'jamendo',
    page: number = 1,
    perPage: number = 10
  ) => {
    if (!ENABLE_BACKEND_API) {
      await new Promise(resolve => setTimeout(resolve, 800));
      const filteredTracks = category 
        ? mockMusicTracks.filter(track => track.category.toLowerCase() === category.toLowerCase())
        : mockMusicTracks;
      
      // Apply search filter if query is provided
      const searchFilteredTracks = query
        ? filteredTracks.filter(track => 
            track.title.toLowerCase().includes(query.toLowerCase()) ||
            track.artist.toLowerCase().includes(query.toLowerCase()) ||
            track.category.toLowerCase().includes(query.toLowerCase())
          )
        : filteredTracks;
      
      // Apply pagination
      const startIndex = (page - 1) * perPage;
      const paginatedTracks = searchFilteredTracks.slice(startIndex, startIndex + perPage);
      
      return {
        tracks: paginatedTracks,
        total: searchFilteredTracks.length,
        page,
        per_page: perPage
      };
    }
    
    const response = await api.post('/music/search/', {
      query,
      category: category || undefined,  // Convert null to undefined
      provider,
      page,
      per_page: perPage
    });
    return response.data;
  },
  
  // Download music track
  downloadTrack: async (trackId: string) => {
    if (!ENABLE_BACKEND_API) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { status: 'success', message: 'Track downloaded (mock)' };
    }
    
    const response = await api.post('/music/download/', {
      track_id: trackId
    });
    return response.data;
  },
  
  // Upload custom audio
  uploadCustomAudio: async (file: File) => {
    if (!ENABLE_BACKEND_API) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        status: 'success',
        message: 'Custom audio uploaded (mock)',
        file_url: '/cache/music/background.mp3',
        file_id: 'custom'
      };
    }
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'custom_audio');
    formData.append('filename', 'background.mp3'); // Specify the target filename
    
    const response = await api.post('/music/upload-custom/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};

// Custom file uploads
export const fileApi = {
  uploadImage: async (file: File, purpose: 'logo' | 'outro' | 'frame' | 'slide') => {
    if (!ENABLE_BACKEND_API) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        file_url: URL.createObjectURL(file),
        file_id: `mock-${Date.now()}`
      };
    }
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('purpose', purpose);
    
    const response = await api.post('/uploads/image/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};

// Image API
export const imageApi = {
    // Generate an image from text
    generateImage: async (text: string, bullet_point_id?: string | number) => {
        if (!ENABLE_BACKEND_API) {
            await new Promise(resolve => setTimeout(resolve, 1500));
            const randomId = Math.floor(Math.random() * 1000);
            return {
                image_url: `/mock-image-${randomId}.jpg`, // Use a relative mock URL
                message: "Image generated successfully"
            };
        }
        
        const response = await imageApi_axios.post('/images/generate/', { text, bullet_point_id });
        return response.data;
    },

    // Upload a custom image for a bullet point
    uploadBulletPointImage: async (articleId: number, bulletPointId: number, file: File) => {
        if (!ENABLE_BACKEND_API) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const mockUrl = URL.createObjectURL(file);
            // In mock mode, we return a local blob URL.
            return {
                message: "Image uploaded successfully",
                image_path: mockUrl
            };
        }

        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post(`/articles/${articleId}/bullet-points/${bulletPointId}/upload-image/`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // Delete a custom image for a bullet point
    deleteBulletPointImage: async (articleId: number, bulletPointId: number) => {
        if (!ENABLE_BACKEND_API) {
            await new Promise(resolve => setTimeout(resolve, 500));
            return { message: "Mock image deleted successfully" };
        }
        const response = await api.delete(`/articles/${articleId}/bullet-points/${bulletPointId}/delete-image/`);
        return response.data;
    },

    // Upload a logo or outro image
    uploadAsset: async (purpose: 'logo' | 'outro', file: File) => {
        if (!ENABLE_BACKEND_API) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const mockUrl = URL.createObjectURL(file);
            return {
                message: "Asset uploaded successfully",
                file_path: mockUrl,
                url: mockUrl
            };
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('purpose', purpose);

        const response = await api.post(`/uploads/image/`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    }
};

// Error handler helper
// Social Media Post API
export const socialPostApi = {
  // Generate social media posts
  generateSocialPosts: async (request: {
    article_id: number;
    bullet_points: BulletPoint[];
    platforms: string[];
    language: string;
    skip_image_generation?: boolean;
  }) => {
    if (!ENABLE_BACKEND_API) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      return {
        id: 1,
        article_id: request.article_id,
        status: 'processing'
      };
    }
    
    const response = await api.post('/social-posts/generate/', request);
    return response.data;
  },
  
  // Get social post status
  getSocialPostStatus: async (socialPostId: number) => {
    if (!ENABLE_BACKEND_API) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        id: socialPostId,
        status: 'completed',
        posts: {
          instagram: {
            platform: 'instagram',
            caption: '🚀 Découvrez ces insights incroyables ! Cette analyse approfondie révèle des tendances fascinantes qui vont transformer votre approche. Ne manquez pas ces informations précieuses ! ✨',
            hashtags: ['#innovation', '#tech', '#insights', '#transformation', '#business'],
            call_to_action: '💭 Qu\'en pensez-vous ?',
            character_count: 186,
            hashtag_count: 5,
            timestamp: Date.now() / 1000
          },
          facebook: {
            platform: 'facebook',
            caption: 'Une analyse approfondie qui révèle des insights fascinants sur les dernières tendances. Ces découvertes pourraient bien transformer votre approche et ouvrir de nouvelles perspectives d\'innovation.',
            hashtags: ['#innovation', '#business', '#analyse', '#tendances'],
            call_to_action: 'Qu\'en pensez-vous ? Partagez votre expérience !',
            character_count: 204,
            hashtag_count: 4,
            timestamp: Date.now() / 1000
          }
        }
      };
    }
    
    const response = await api.get(`/social-posts/${socialPostId}/`);
    return response.data;
  },
  
  // Download social post image
  downloadSocialPostImage: async (socialPostId: number, platform: string) => {
    if (!ENABLE_BACKEND_API) {
      // In mock mode, we can't really download files
      console.log(`Mock download: Social post ${socialPostId} image for ${platform}`);
      return;
    }
    
    const response = await api.get(`/social-posts/${socialPostId}/download/${platform}/`, {
      responseType: 'blob'
    });
    
    // Create a download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `social_post_${platform}_${socialPostId}.jpg`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
  
  // Get available platforms
  getAvailablePlatforms: async () => {
    if (!ENABLE_BACKEND_API) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return {
        platforms: ['instagram', 'facebook', 'linkedin', 'twitter'],
        configs: {
          instagram: { max_caption_length: 2200, max_hashtags: 30 },
          facebook: { max_caption_length: 63206, max_hashtags: 50 },
          linkedin: { max_caption_length: 3000, max_hashtags: 30 },
          twitter: { max_caption_length: 280, max_hashtags: 10 }
        }
      };
    }
    
    const response = await api.get('/platforms/');
    return response.data;
  }
};

// Export the new functions for backward compatibility
export const generateSocialPosts = socialPostApi.generateSocialPosts;
export const getSocialPostStatus = socialPostApi.getSocialPostStatus;
export const downloadSocialPostImage = socialPostApi.downloadSocialPostImage;
export const getAvailablePlatforms = socialPostApi.getAvailablePlatforms;

export const handleApiError = (error: any): string => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    const data = error.response.data;
    if (data.error) return data.error;
    if (data.detail) return data.detail;
    return `Server error: ${error.response.status}`;
  } else if (error.request) {
    // The request was made but no response was received
    return 'No response from server. Please check your connection.';
  } else {
    // Something happened in setting up the request that triggered an Error
    return `Error: ${error.message}`;
  }
};

export default api; 