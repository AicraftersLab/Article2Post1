# ArticleToVideo

A powerful web application that converts articles to engaging videos using AI-powered summarization, image generation, and audio narration.

## Features

- **Article Processing**: Import content from URLs or direct text input
- **AI Summarization**: Automatically extract key points from articles
- **Image Generation**: AI-generated visuals for each bullet point
- **Text Highlighting**: Emphasize important keywords in the video
- **Audio Narration**: Text-to-speech voiceover in multiple languages
- **Background Music**: Choose from a library of royalty-free music
- **Customizable Branding**: Add logos and custom frames
- **Responsive UI**: Dark/light mode support
- **Multi-language Support**: Interface available in English and French

## Architecture Overview

### Backend Architecture

The backend follows a modular architecture with clear separation of concerns:

- **API Layer** (`api_main.py`): FastAPI endpoints handling HTTP requests
- **Core Services**:
  - `app_controller.py`: Main orchestration of the video generation workflow
  - `text_processor.py`: Text cleaning and processing utilities
  - `image_generator.py`: AI image generation for bullet points
  - `video_creator.py`: Assembles images and audio into final video
  - `audio_processor.py`: Text-to-speech and audio manipulation
- **External Services**:
  - `web_scraper.py`: Extracts content from URLs
  - `openai_client.py`: Handles OpenAI API interactions
  - `music_api.py`: Searches and downloads background music
- **Utilities**:
  - `json_utils.py`: JSON data handling
  - `image_utils.py`: Image processing helpers
- **Configuration**:
  - `config.py`: Application settings and environment variables

### Frontend Architecture

The React frontend is organized as follows:

- **Component Structure**:
  - `App.tsx`: Main application container and routing
  - `pages/`: Main page components
  - `components/`: Reusable UI components
  - `hooks/`: Custom React hooks
  - `services/`: API client and service functions
  - `store/`: Zustand state management
  - `types/`: TypeScript type definitions
  - `i18n/`: Internationalization resources

- **State Management**:
  - Zustand for global state
  - React Context for theme and localization
  - Local component state for UI interactions

- **API Communication**:
  - Axios for HTTP requests
  - Custom hooks for API interactions
  - Type-safe response handling

## Tech Stack

### Backend
- **FastAPI**: High-performance web framework
- **OpenAI API**: For text summarization and image generation
- **gTTS (Google Text-to-Speech)**: For voiceover generation
- **MoviePy**: For video composition and rendering
- **Pillow**: For image processing and text overlay
- **Python 3.9+**: Core programming language

### Frontend
- **React 19.1+**: UI framework
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Zustand**: State management
- **Headless UI**: Accessible UI components
- **i18n**: Internationalization support
- **Axios**: API communication

## Getting Started

### Prerequisites

- Python 3.9+
- Node.js 18+
- npm or yarn
- OpenAI API key

### Installation

1. Clone the repository:
   ```bash
   git clone git@github.com:HAMZAELALOUI/ArticleToReel.git
   cd article-2-video-saas
   ```

2. Set up the backend:
   ```bash
   cd Article2Video
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Set up the frontend:
   ```bash
   cd ../articleToVideo-ui
   npm install
   ```

4. Configure environment variables:
   - Copy the `.env.example` file to `.env` in the Article2Video directory
   - Add your OpenAI API key and other required variables

### Running the Application

#### Development

1. Start the backend server:
   ```bash
   # Make sure you're in the Article2Video directory
   cd Article2Video
   python api_main.py
   ```

2. Start the frontend development server:
   ```bash
   cd ../articleToVideo-ui
   npm run dev
   ```

3. Access the application at `http://localhost:5173`

#### Production

1. Build the frontend:
   ```bash
   cd articleToVideo-ui
   npm run build
   ```

2. Deploy the FastAPI backend using a production ASGI server:
   ```bash
   cd Article2Video
   uvicorn api_main:app --host 0.0.0.0 --port 8000
   ```

## Troubleshooting

### Common Issues

1. **Import Errors**: If you encounter import errors, ensure that you're running the application from the correct directory:
   ```bash
   cd Article2Video
   python api_main.py
   ```

2. **API Key Issues**: If image or text generation fails, verify your OpenAI API key in the .env file.

3. **Circular Imports**: If you encounter circular import errors, check that you're using the latest version of the codebase with fixed imports.

4. **Frontend API Connection**: If the frontend can't connect to the API, ensure the backend is running and check the CORS settings.

## Application Workflow

1. **Article Input**: Enter article URL or paste content directly
2. **Bullet Point Generation**: AI extracts key points from the article
3. **Slide Preview**: Review and customize generated images for each point
4. **Audio Customization**: Select voice and background music
5. **Video Generation**: Combine all elements into a final video
6. **Download**: Save the generated video for sharing

## API Endpoints

### Article Management
- `POST /api/articles/process/` - Process article from URL or text
- `GET /api/articles/{article_id}/` - Get article details
- `GET /api/articles/` - List all articles

### Bullet Point Management
- `PUT /api/articles/{article_id}/bullet-points/{bullet_point_id}/` - Update bullet point
- `POST /api/articles/{article_id}/bullet-points/{bullet_point_id}/regenerate/` - Regenerate bullet point
- `POST /api/articles/{article_id}/bullet-points/regenerate-all/` - Regenerate all bullet points
- `POST /api/articles/{article_id}/bullet-points/{bullet_point_id}/upload-image/` - Upload custom image
- `DELETE /api/articles/{article_id}/bullet-points/{bullet_point_id}/delete-image/` - Delete custom image

### Image Generation
- `POST /api/images/generate/` - Generate image for text
- `GET /api/images/bullet-point/{bullet_point_id}/` - Get image for bullet point

### Video Generation
- `POST /api/videos/generate/` - Generate video
- `GET /api/videos/{video_id}/` - Get video status
- `GET /api/videos/{video_id}/download/` - Download video

### Music Management
- `GET /api/music/categories/` - Get music categories
- `POST /api/music/search/` - Search for music
- `POST /api/music/download/` - Download music track
- `POST /api/music/upload-custom/` - Upload custom audio

### Utility Endpoints
- `GET /api/health` - Health check
- `POST /api/cache/clear/` - Clear cache

## Configuration Options

- **Language**: Select interface and generation language (English, French, Spanish, etc.)
- **Slide Count**: Control the number of key points (3-10 recommended)
- **Words Per Point**: Adjust the length of each bullet point (10-30 words recommended)
- **Background Music**: Enable/disable background music
- **Voiceover**: Enable/disable audio narration
- **Auto Duration**: Automatically set slide duration based on audio length
- **Custom Branding**: Add logo and outro images

## Directory Structure

```
article-2-video-saas/
├── Article2Video/              # Backend code
│   ├── api_main.py             # FastAPI application entry point
│   ├── core/                   # Core functionality
│   │   ├── app_controller.py   # Main application logic
│   │   ├── image_generator.py  # Image generation
│   │   ├── text_processor.py   # Text processing
│   │   ├── video_creator.py    # Video creation
│   │   ├── audio_processor.py  # Audio processing
│   │   └── text_overlay.py     # Text overlay on images
│   ├── services/               # External services
│   │   ├── web_scraper.py      # Web scraping
│   │   ├── openai_client.py    # OpenAI API client
│   │   └── music_api.py        # Music API client
│   ├── utils/                  # Utility functions
│   │   ├── json_utils.py       # JSON utilities
│   │   └── image_utils.py      # Image utilities
│   ├── config/                 # Configuration
│   │   └── config.py           # Application config
│   └── prompts/                # AI prompt templates
│       └── image_generation_prompt.py # Image generation prompts
│
├── articleToVideo-ui/          # Frontend code
│   ├── src/                    # Source code
│   │   ├── App.tsx             # Main application component
│   │   ├── components/         # Reusable components
│   │   ├── pages/              # Page components
│   │   ├── hooks/              # Custom hooks
│   │   ├── services/           # API services
│   │   ├── store/              # State management
│   │   └── types/              # TypeScript types
│   ├── public/                 # Static assets
│   └── package.json            # Dependencies
│
└── README.md                   # Project documentation
```





