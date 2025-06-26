import { useState, useEffect } from 'react'
import Layout from './components/layout/Layout'
import useProjectStore from './store/useProjectStore'
import { 
  ArticleInput, 
  BulletPoints, 
  SlidePreview, 
  LogoUpload,
  FrameUpload,
  SocialPostGeneration 
} from './components/steps'
import { isDarkMode, fixInputFields } from './utils/themeUtils'
import { useBeforeUnload } from './hooks/useBeforeUnload'
import { translateUI } from './utils/translateUI'
import { useTranslation } from './utils/TranslationContext'
import './App.css'

function App() {
  const { currentStep, articleData, bulletPoints, newProject } = useProjectStore()
  const [darkMode, setDarkMode] = useState(isDarkMode());
  const { currentLanguage } = useTranslation();
  
  // Initialize translations with French
  useEffect(() => {
    // Set UI language to French
    translateUI('fr');
  }, []);
  
  // Warn user before leaving if they have unsaved work
  const hasUnsavedWork = Boolean(articleData.title || bulletPoints.length > 0);
  useBeforeUnload(hasUnsavedWork, 'You have unsaved work. Are you sure you want to leave?');
  
  // Handle page refresh to reset application state
  useEffect(() => {
    // This function will be called when the page is refreshed
    const handlePageRefresh = () => {
      // Store a timestamp in sessionStorage when the page is about to unload
      sessionStorage.setItem('page_unload_time', Date.now().toString());
    };

    // Check if this is a page refresh by comparing timestamps
    const checkIfRefreshed = () => {
      const lastUnloadTime = sessionStorage.getItem('page_unload_time');
      
      if (lastUnloadTime) {
        const timeSinceUnload = Date.now() - parseInt(lastUnloadTime);
        
        // If the page was unloaded recently (within 2 seconds), it's likely a refresh
        if (timeSinceUnload < 2000) {
          console.log('Page was refreshed, resetting application state...');
          // Clear backend cache and reset frontend state
          newProject();
        }
        
        // Clear the timestamp
        sessionStorage.removeItem('page_unload_time');
      }
    };
    
    // Add event listener for beforeunload
    window.addEventListener('beforeunload', handlePageRefresh);
    
    // Check if this is a refresh when the component mounts
    checkIfRefreshed();
    
    return () => {
      window.removeEventListener('beforeunload', handlePageRefresh);
    };
  }, [newProject]);
  
  // Simpler useEffect for React 19 compatibility
  useEffect(() => {
    // Apply the fixes when component mounts
    fixInputFields();
    
    // Update state when theme changes
    const updateTheme = () => {
      setDarkMode(isDarkMode());
      fixInputFields();
    };
    
    // Set up observer
    const observer = new MutationObserver(updateTheme);
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <ArticleInput />
      case 1:
        return <BulletPoints />
      case 2:
        return <SlidePreview />
      case 3:
        return <LogoUpload />
      case 4:
        return <FrameUpload />
      case 5:
        return <SocialPostGeneration />
      default:
        return <ArticleInput />
    }
  }

  return (
    <div className={`app-root ${darkMode ? 'dark-theme bg-gray-900 text-white' : 'light-theme bg-white text-gray-900'}`} lang={currentLanguage}>
    <Layout>
        <div className="app-content">
      {renderStep()}
        </div>
    </Layout>
    </div>
  )
}

export default App
