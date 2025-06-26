// i18n translation utilities for Article2Video UI

interface Translations {
  [key: string]: {
    [key: string]: string;
  };
}

// Translation dictionaries
export const translations: Translations = {
  en: {
    // App components
    "Configure your video settings and enter the content you want to convert": "Configure your video settings and enter the content you want to convert",
    "Video Configuration": "Video Configuration",
    "Article Source": "Article Source",
    "URL": "URL",
    "Text": "Text",
    "Enter article URL": "Enter article URL",
    "Analyze": "Analyze",
    "Enter article content": "Enter article content",
    "Process": "Process",
    
    // Step 2: Bullet Points
    "Article Summary": "Article Summary",
    "Key Points": "Key Points",
    
    // Step 3: Slide Preview
    "Preview and customize your video slides": "Preview and customize your video slides",
    "Slides Preview": "Slides Preview",
    "Duration": "Duration",
    "seconds": "seconds",
    "Upload Custom Image": "Upload Custom Image",
    "Reset to Generated Image": "Reset to Generated Image",
    
    // Step 4: Audio Customization
    "Customize audio settings for your video": "Customize audio settings for your video",
    "Voice Selection": "Voice Selection",
    "Music Selection": "Music Selection",
    "No Voice": "No Voice",
    "Sample": "Sample",
    "Male": "Male",
    "Female": "Female",
    "No Music": "No Music",
    "Play": "Play",
    "Pause": "Pause",
    
    // Video Generation
    "Generate and download your video": "Generate and download your video",
    "Video Preview": "Video Preview",
    "Generate Video": "Generate Video",
    "Generating video...": "Generating video...",
    "Video Settings": "Video Settings",
    "Video successfully generated!": "Video successfully generated!",
    
    // Messages
    "Please enter a URL": "Please enter a URL",
    "Please enter article text": "Please enter article text",
    "Article analyzed successfully!": "Article analyzed successfully!",
    "Text processed successfully!": "Text processed successfully!",
    "Please analyze an article or enter text first": "Please analyze an article or enter text first",
    "Failed to analyze article. Please try again.": "Failed to analyze article. Please try again.",
    "Failed to process text. Please try again.": "Failed to process text. Please try again.",
    
    // Layout
    "Close sidebar": "Close sidebar",
    "Open sidebar": "Open sidebar",
    "ArticleToVideo": "ArticleToVideo",
    "Add background music to your video": "Add background music to your video",
    "Generate voice narration for your video": "Generate voice narration for your video",
    "Automatically adjust slide durations": "Automatically adjust slide durations",
    "Article Content": "Article Content",
    "Analyzing...": "Analyzing...",
    "Processing...": "Processing...",
    "Disable Background Music": "Disable Background Music",
    "Enable Background Music": "Enable Background Music",
    "Disable Voiceover": "Disable Voiceover",
    "Enable Voiceover": "Enable Voiceover",
    "Disable Automatic Duration": "Disable Automatic Duration",
    "Enable Automatic Duration": "Enable Automatic Duration",
    
    // Article Input Step
    'step1Title': 'Step 1: Article Input',
    'step1Subtitle': 'Enter your article URL or paste the text directly',
    'urlInputLabel': 'Article URL',
    'textInputLabel': 'Article Text',
    'pasteUrlPrompt': 'Paste the URL of your article',
    'pasteTextPrompt': 'Paste your article text here',
    'processButton': 'Process Article',
    'processingArticle': 'Processing article...',
    'articleProcessed': 'Article processed successfully!',
    'failedToProcessArticle': 'Failed to process article. Please try again.',
    'invalidUrl': 'Please enter a valid URL',
    'noTextProvided': 'Please enter some text',
    'languageLabel': 'Language',
    'slideCountLabel': 'Number of Slides',
    'wordsPerPointLabel': 'Words per Point',
    'backgroundMusicLabel': 'Background Music',
    'voiceoverLabel': 'Voiceover',
    'automaticDurationLabel': 'Automatic Duration',

    // Bullet Points Step
    'step2Title': 'Step 2: Bullet Points',
    'step2Subtitle': 'Review and edit the generated bullet points',
    'highlightKeywordsTip': 'Highlight Keywords',
    'highlightInstruction1': '1. Click "Highlight" to enter highlighting mode',
    'highlightInstruction2': '2. Select text to highlight important words',
    'highlightInstruction3': '3. Click "Done" when finished',
    'highlightInstruction4': '4. Highlighted words will be emphasized in the video',
    'editBulletPointsPrompt': 'Edit your bullet points:',
    'Point': 'Point',
    'Highlight': 'Highlight',
    'Highlighting': 'Highlighting',
    'PreviewHighlight': 'Preview with Highlights',
    'HighlightSelectedText': 'Highlight Selected Text',
    'Done': 'Done',
    'HighlightedWords': 'Highlighted Words:',
    'selectTextToHighlight': 'Please select some text to highlight',
    'textAlreadyHighlighted': 'This text is already highlighted',
    'highlightedForEmphasis': 'Highlighted "{text}" for video emphasis',
    'removedHighlight': 'Highlight removed from "{text}"',
    'ensureAllBulletPointsHaveContent': 'Please ensure all bullet points have content',
    'bulletPointsSynchronized': 'Bullet points synchronized with backend!',
    'failedToSyncBulletPoints': 'Failed to synchronize bullet points. You can continue anyway.',
    'regeneratingBulletPoint': 'Regenerating bullet point...',
    'generatingBulletPoints': 'Generating bullet points...',

    // Image Upload
    'slideImage': 'Slide Image',
    'dragDropImageLabel': 'Drag and drop an image here',
    'uploadImageButton': 'Upload Image',
    'uploading': 'Uploading...',
    'imageUploadedSuccessfully': 'Image uploaded successfully!',
    'failedToUploadImage': 'Failed to upload image. Please try again.',
    'imageDeletedSuccessfully': 'Image deleted successfully!',
    'failedToDeleteImage': 'Failed to delete image. Please try again.',
    'cannotUploadMissingArticleId': 'Cannot upload image: Article ID is missing.',
    'cannotDeleteMissingArticleId': 'Cannot delete image: Article ID is missing.',

    // Slide Preview Step
    'step3Title': 'Step 3: Slide Preview',
    'generatingImages': 'Generating images... This may take a few moments.',
    'elapsed': '({seconds}s elapsed)',
    'slide': 'Slide',
    'replaceImageButton': 'Replace Image',
    'generating': 'Generating...',
    'regenerate': 'Regenerate',
    'cannotUploadMissingSlide': 'Cannot upload image: Current slide not found.',
    'or': 'or',
    'slideTextLabel': 'Slide Text',

    // Audio Customization Step
    'step4Title': 'Step 4: Audio Customization',
    'step4Subtitle': 'Select background music and customize your video\'s appearance',
    'backgroundMusic': 'Background Music',
    'brandingAndExtras': 'Branding & Extras',
    'musicLibrary': 'Music Library',
    'searchForMusic': 'Search for music...',
    'allCategories': 'All Categories',
    'uploadOwnAudio': 'Or upload your own audio',
    'dragDropAudio': 'Drag and drop an audio file',
    'uploadAudio': 'Upload Audio',
    'loadingMusic': 'Loading music...',
    'noMusicFound': 'No music found. Try a different search or category.',
    'page': 'Page',
    'of': 'of',
    'branding': 'Branding',
    'logo': 'Logo',
    'dragDropLogo': 'Drag and drop your logo (PNG)',
    'uploadLogo': 'Upload Logo',

    // Video Generation Step
    'step5Title': 'Step 5: Video Generation',
    'step5Subtitle': 'Generate your video with the selected settings',
    'initializing': 'Initializing...',
    'processingArticleContent': 'Processing article content...',
    'creatingVoiceover': 'Creating voiceover...',
    'addingBackgroundMusic': 'Adding background music...',
    'finalizingVideo': 'Finalizing video...',
    'videoGenerationComplete': 'Video generation complete!',
    'downloadVideo': 'Download Video',
    'startOver': 'Start Over',
    'failedToGenerateVideo': 'Failed to generate video. Please try again.',

    // Common
    'Back': 'Back',
    'Next': 'Next',
    'Continue': 'Continue',
    'RegenerateAll': 'Regenerate All',
    'Regenerate': 'Regenerate',
    'Cancel': 'Cancel',
    'Save': 'Save',
    'Delete': 'Delete',
    'Edit': 'Edit',
    'Preview': 'Preview',
    'Loading': 'Loading...',
    'Error': 'Error',
    'Success': 'Success!',
  },
  fr: {
    // App components
    "Configure your video settings and enter the content you want to convert": "Configurez les paramètres de votre vidéo et entrez le contenu que vous souhaitez convertir",
    "Video Configuration": "Configuration vidéo",
    "Article Source": "Source de l'article",
    "URL": "URL",
    "Text": "Texte",
    "Enter article URL": "Entrez l'URL de l'article",
    "Analyze": "Analyser",
    "Enter article content": "Entrez le contenu de l'article",
    "Process": "Traiter",
    
    // Step 2: Bullet Points
    "Article Summary": "Résumé de l'article",
    "Key Points": "Points clés",
    
    // Step 3: Slide Preview
    "Preview and customize your video slides": "Prévisualisez et personnalisez vos diapositives vidéo",
    "Slides Preview": "Aperçu des diapositives",
    "Duration": "Durée",
    "seconds": "secondes",
    "Upload Custom Image": "Télécharger une image personnalisée",
    "Reset to Generated Image": "Réinitialiser à l'image générée",
    
    // Step 4: Audio Customization
    "Customize audio settings for your video": "Personnalisez les paramètres audio de votre vidéo",
    "Voice Selection": "Sélection de la voix",
    "Music Selection": "Sélection de la musique",
    "No Voice": "Aucune voix",
    "Sample": "Exemple",
    "Male": "Masculin",
    "Female": "Féminin",
    "No Music": "Aucune musique",
    "Play": "Lecture",
    "Pause": "Pause",
    
    // Video Generation
    "Generate and download your video": "Générez et téléchargez votre vidéo",
    "Video Preview": "Aperçu de la vidéo",
    "Generate Video": "Générer la vidéo",
    "Generating video...": "Génération de la vidéo...",
    "Video Settings": "Paramètres de la vidéo",
    "Video successfully generated!": "Vidéo générée avec succès !",
    
    // Messages
    "Please enter a URL": "Veuillez saisir une URL",
    "Please enter article text": "Veuillez saisir le texte de l'article",
    "Article analyzed successfully!": "Article analysé avec succès !",
    "Text processed successfully!": "Texte traité avec succès !",
    "Please analyze an article or enter text first": "Veuillez d'abord analyser un article ou saisir du texte",
    "Failed to analyze article. Please try again.": "Échec de l'analyse de l'article. Veuillez réessayer.",
    "Failed to process text. Please try again.": "Échec du traitement du texte. Veuillez réessayer.",
    
    // Layout
    "Close sidebar": "Fermer la barre latérale",
    "Open sidebar": "Ouvrir la barre latérale",
    "ArticleToVideo": "ArticleEnVidéo",
    "Add background music to your video": "Ajouter une musique de fond à votre vidéo",
    "Generate voice narration for your video": "Générer une narration vocale ",
    "Automatically adjust slide durations": "Ajuster la durée des diapositives",
    "Article Content": "Contenu de l'article",
    "Analyzing...": "Analyse en cours...",
    "Processing...": "Traitement en cours...",
    "Disable Background Music": "Désactiver la musique de fond",
    "Enable Background Music": "Activer la musique de fond",
    "Disable Voiceover": "Désactiver la voix off",
    "Enable Voiceover": "Activer la voix off",
    "Disable Automatic Duration": "Désactiver la durée automatique",
    "Enable Automatic Duration": "Activer la durée automatique",
    
    // Article Input Step
    'step1Title': 'Étape 1 : Saisie de l\'article',
    'step1Subtitle': 'Entrez l\'URL de votre article ou collez le texte directement',
    'urlInputLabel': 'URL de l\'article',
    'textInputLabel': 'Texte de l\'article',
    'pasteUrlPrompt': 'Collez l\'URL de votre article',
    'pasteTextPrompt': 'Collez votre texte d\'article ici',
    'processButton': 'Traiter l\'article',
    'processingArticle': 'Traitement de l\'article...',
    'articleProcessed': 'Article traité avec succès !',
    'failedToProcessArticle': 'Échec du traitement de l\'article. Veuillez réessayer.',
    'invalidUrl': 'Veuillez entrer une URL valide',
    'noTextProvided': 'Veuillez entrer du texte',
    'languageLabel': 'Langue',
    'slideCountLabel': 'Nombre de diapositives',
    'wordsPerPointLabel': 'Mots par point',
    'backgroundMusicLabel': 'Musique de fond',
    'voiceoverLabel': 'Voix off',
    'automaticDurationLabel': 'Durée automatique',

    // Bullet Points Step
    'step2Title': 'Étape 2 : Points clés',
    'step2Subtitle': 'Révisez et modifiez les points clés générés',
    'highlightKeywordsTip': 'Surligner les mots-clés',
    'highlightInstruction1': '1. Cliquez sur "Surligner" pour entrer en mode surlignage',
    'highlightInstruction2': '2. Sélectionnez le texte pour surligner les mots importants',
    'highlightInstruction3': '3. Cliquez sur "Terminé" une fois fini',
    'highlightInstruction4': '4. Les mots surlignés seront mis en valeur dans la vidéo',
    'editBulletPointsPrompt': 'Modifiez vos points clés :',
    'Point': 'Point',
    'Highlight': 'Surligner',
    'Highlighting': 'Surlignage',
    'PreviewHighlight': 'Aperçu avec surlignages',
    'HighlightSelectedText': 'Surligner le texte sélectionné',
    'Done': 'Terminé',
    'HighlightedWords': 'Mots surlignés :',
    'selectTextToHighlight': 'Veuillez sélectionner du texte à surligner',
    'textAlreadyHighlighted': 'Ce texte est déjà surligné',
    'highlightedForEmphasis': '"{text}" surligné pour l\'emphase vidéo',
    'removedHighlight': 'Surlignage supprimé de "{text}"',
    'ensureAllBulletPointsHaveContent': 'Veuillez vous assurer que tous les points clés ont du contenu',
    'bulletPointsSynchronized': 'Points clés synchronisés avec le backend !',
    'failedToSyncBulletPoints': 'Échec de la synchronisation des points clés. Vous pouvez continuer quand même.',
    'regeneratingBulletPoint': 'Régénération du point clé...',
    'generatingBulletPoints': 'Génération des points clés...',

    // Image Upload
    'slideImage': 'Image de la diapositive',
    'dragDropImageLabel': 'Glissez-déposez une image ',
    'uploadImageButton': 'Téléverser l\'image',
    'uploading': 'Téléversement...',
    'imageUploadedSuccessfully': 'Image téléversée avec succès !',
    'failedToUploadImage': 'Échec du téléversement de l\'image. Veuillez réessayer.',
    'imageDeletedSuccessfully': 'Image supprimée avec succès !',
    'failedToDeleteImage': 'Échec de la suppression de l\'image. Veuillez réessayer.',
    'cannotUploadMissingArticleId': 'Impossible de téléverser l\'image : ID d\'article manquant.',
    'cannotDeleteMissingArticleId': 'Impossible de supprimer l\'image : ID d\'article manquant.',

    // Slide Preview Step
    'step3Title': 'Étape 3 : Aperçu des diapositives',
    'generatingImages': 'Génération des images... Cela peut prendre quelques instants.',
    'elapsed': '({seconds}s écoulées)',
    'slide': 'Diapositive',
    'replaceImageButton': 'Remplacer l\'image',
    'generating': 'Génération...',
    'regenerate': 'Régénérer',
    'cannotUploadMissingSlide': 'Impossible de téléverser l\'image : Diapositive actuelle introuvable.',
    'or': 'ou',
    'slideTextLabel': 'Texte de la diapositive',

    // Audio Customization Step
    'step4Title': 'Étape 4 : Personnalisation audio',
    'step4Subtitle': 'Sélectionnez la musique de fond et personnalisez l\'apparence de votre vidéo',
    'backgroundMusic': 'Musique de fond',
    'brandingAndExtras': 'Image de marque & Extras',
    'musicLibrary': 'Bibliothèque musicale',
    'searchForMusic': 'Rechercher de la musique...',
    'allCategories': 'Toutes les catégories',
    'uploadOwnAudio': 'Ou téléversez votre propre audio',
    'dragDropAudio': 'Glissez-déposez un fichier audio',
    'uploadAudio': 'Téléverser l\'audio',
    'loadingMusic': 'Chargement de la musique...',
    'noMusicFound': 'Aucune musique trouvée. Essayez une autre recherche ou catégorie.',
    'page': 'Page',
    'of': 'sur',
    'branding': 'Image de marque',
    'logo': 'Logo',
    'dragDropLogo': 'Glissez-déposez votre logo (PNG)',
    'uploadLogo': 'Téléverser le logo',

    // Video Generation Step
    'step5Title': 'Étape 5 : Génération de la vidéo',
    'step5Subtitle': 'Générez votre vidéo avec les paramètres sélectionnés',
    'initializing': 'Initialisation...',
    'processingArticleContent': 'Traitement du contenu de l\'article...',
    'creatingVoiceover': 'Création de la voix off...',
    'addingBackgroundMusic': 'Ajout de la musique de fond...',
    'finalizingVideo': 'Finalisation de la vidéo...',
    'videoGenerationComplete': 'Génération de la vidéo terminée !',
    'downloadVideo': 'Télécharger la vidéo',
    'startOver': 'Recommencer',
    'failedToGenerateVideo': 'Échec de la génération de la vidéo. Veuillez réessayer.',

    // Common
    'Back': 'Retour',
    'Next': 'Suivant',
    'Continue': 'Continuer',
    'RegenerateAll': 'Tout régénérer',
    'Regenerate': 'Régénérer',
    'Cancel': 'Annuler',
    'Save': 'Enregistrer',
    'Delete': 'Supprimer',
    'Edit': 'Modifier',
    'Preview': 'Aperçu',
    'Loading': 'Chargement...',
    'Error': 'Erreur',
    'Success': 'Succès !',
  },
};

// Current language (default to French)
let currentLanguage: string = 'fr';

// Set the current language
export const setCurrentLanguage = (lang: string): void => {
  if (translations[lang]) {
    currentLanguage = lang;
  } else {
    console.warn(`Language ${lang} not supported, falling back to default`);
  }
};

// Get current language
export const getCurrentLanguage = (): string => {
  return currentLanguage;
};

// Translate a string
export const translate = (key: string): string => {
  if (!translations[currentLanguage]) {
    return key; // Fallback to key if language not found
  }
  
  return translations[currentLanguage][key] || translations.en[key] || key;
};

// Shorthand function for translate
export const t = translate; 