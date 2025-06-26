import { useState, useEffect, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import useProjectStore from '../../store/useProjectStore'
import { Upload, Check, X, Image as ImageIcon, Settings, Eye, AlertTriangle, Type, Layers } from 'lucide-react'
import { API_URL } from '../../config'

interface FrameInfo {
  has_frame: boolean
  frame_size?: [number, number]
  message: string
}

const FrameUpload = () => {
  const { nextStep, prevStep, articleData, bulletPoints, slides, updateBulletPointImage, updateSlide } = useProjectStore()
  const [frameInfo, setFrameInfo] = useState<FrameInfo | null>(null)
  const [uploading, setUploading] = useState(false)
  const [applying, setApplying] = useState(false)
  const [logoPosition, setLogoPosition] = useState('top_right')
  const [useOriginalSize, setUseOriginalSize] = useState(false)
  const [logoSize, setLogoSize] = useState({ width: 150, height: 70 })
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [imageExists, setImageExists] = useState(false)
  const [bulletPointText, setBulletPointText] = useState('')

  // Check current frame status
  useEffect(() => {
    console.log('FrameUpload - articleData:', articleData)
    checkCurrentFrame()
    checkImageExists()
    loadBulletPointText()
  }, [articleData.id, bulletPoints])

  const loadBulletPointText = () => {
    if (bulletPoints && bulletPoints.length > 0) {
      // Prendre le premier bullet point comme texte par défaut
      setBulletPointText(bulletPoints[0].text || '')
    }
  }

  const checkImageExists = async () => {
    if (!articleData.id) {
      setImageExists(false)
      return
    }

    try {
      const response = await fetch(`${API_URL}/articles/${articleData.id}/`)
      if (response.ok) {
        const data = await response.json()
        const hasImage = data.bullet_points && data.bullet_points.length > 0 && 
                        data.bullet_points.some((bp: any) => bp.image_path && bp.image_path !== '')
        setImageExists(hasImage)
        
        if (!hasImage) {
          setError('⚠️ Vous devez d\'abord générer une image avant d\'ajouter un frame. Retournez à l\'étape précédente pour générer l\'image.')
        } else {
          setError(null)
        }
      }
    } catch (err) {
      console.error('Error checking image:', err)
      setImageExists(false)
    }
  }

  const checkCurrentFrame = async () => {
    try {
      const response = await fetch(`${API_URL}/frame/current/`)
      const data = await response.json()
      setFrameInfo(data)
    } catch (err) {
      console.error('Error checking frame:', err)
      setError('Impossible de vérifier le frame actuel')
    }
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!imageExists) {
      setError('⚠️ Impossible d\'uploader le frame : aucune image générée. Générez d\'abord une image.')
      return
    }

    const file = acceptedFiles[0]
    if (!file) return

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`${API_URL}/frame/upload/`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const result = await response.json()
      console.log('Frame uploaded:', result)
      
      // Refresh frame info
      await checkCurrentFrame()
      
      // Show preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)

    } catch (err) {
      setError('Erreur lors de l\'upload du frame')
      console.error('Upload error:', err)
    } finally {
      setUploading(false)
    }
  }, [imageExists])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
    disabled: !imageExists
  })

  const applyFrameToImage = async () => {
    if (!articleData.id || !imageExists) {
      setError('⚠️ Impossible d\'appliquer le frame : aucune image générée.')
      return
    }

    console.log('🎨 Applying intelligent frame to article ID:', articleData.id)
    setApplying(true)
    setError(null)

    try {
      const response = await fetch(`${API_URL}/frame/apply/${articleData.id}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          article_id: articleData.id,
          bullet_point_text: bulletPointText.trim() || "", // Peut être vide pour auto-extraction
          logo_position: logoPosition,
          logo_size_width: useOriginalSize ? null : logoSize.width,
          logo_size_height: useOriginalSize ? null : logoSize.height,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to apply frame')
      }

      const result = await response.json()
      console.log('🎨 Intelligent frame applied:', result)
      
      // Afficher des informations sur le frame intelligent
      if (result.message && result.message.includes('Frame intelligent')) {
        console.log('✨ Frame intelligent généré automatiquement!')
      }
      
      // Mise à jour de l'image avec frame + logo
      if (result.image_path) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const timestamp = new Date().getTime()
        const imageFileName = result.image_path.split('/').pop() || result.image_path
        const newImageUrl = `${API_URL}/static/img/${imageFileName}?t=${timestamp}`
        
        console.log('🔄 Mise à jour de l\'image avec frame intelligent + logo:', newImageUrl)
        
        // Mettre à jour tous les bullet points
        bulletPoints.forEach(bp => {
          if (bp.image_path && bp.image_path.includes('.jpg')) {
            console.log(`📝 Mise à jour bullet point ${bp.id} avec image:`, imageFileName)
            updateBulletPointImage(bp.id, imageFileName)
          }
        })
        
        // Mettre à jour toutes les slides
        if (slides && slides.length > 0) {
          slides.forEach(slide => {
            if (slide.image && slide.image.includes('.jpg')) {
              console.log(`🖼️ Mise à jour slide ${slide.id} avec image:`, newImageUrl)
              updateSlide(slide.id, { image: newImageUrl })
            }
          })
        }
        
        // Forcer un refresh de la page dans 2 secondes
        setTimeout(() => {
          console.log('🔄 Rechargement automatique de la page pour afficher le frame intelligent + logo...')
          window.location.reload()
        }, 2000)
        
        console.log('✅ Image mise à jour dans le store avec le frame intelligent + logo appliqués:', newImageUrl)
      }
      
      // Continue to next step
      nextStep()

    } catch (err) {
      setError('Erreur lors de l\'application du frame intelligent')
      console.error('Apply error:', err)
    } finally {
      setApplying(false)
    }
  }

  const skipFrameStep = () => {
    nextStep()
  }

  const goBackToGenerateImage = () => {
    prevStep()
  }

  const removeFrame = async () => {
    try {
      const response = await fetch(`${API_URL}/frame/remove/`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setFrameInfo({ has_frame: false, message: 'No frame' })
        setPreviewImage(null)
      }
    } catch (err) {
      console.error('Error removing frame:', err)
    }
  }

  const positionOptions = [
    { value: 'top_right', label: 'Haut droite' },
    { value: 'top_left', label: 'Haut gauche' },
    { value: 'bottom_right', label: 'Bas droite' },
    { value: 'bottom_left', label: 'Bas gauche' },
    { value: 'center', label: 'Centre' },
    { value: 'center_custom', label: 'Position personnalisée' },
  ]

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          🎨 Ajout de Frame avec Texte
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Ajoutez un frame personnalisé avec votre texte et logo sur l'image générée
        </p>
      </div>

      {/* Alerte si pas d'image */}
      {!imageExists && (
        <div className="mb-6 p-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex items-start">
            <AlertTriangle className="text-amber-500 mr-3 mt-1" size={24} />
            <div>
              <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-2">
                ⚠️ Image requise avant l'ajout du frame
              </h3>
              <p className="text-amber-700 dark:text-amber-300 mb-4">
                Vous devez d'abord générer une image pour votre article avant de pouvoir ajouter un frame.
              </p>
              <button
                onClick={goBackToGenerateImage}
                className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                ← Retourner à la génération d'image
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="space-y-6">
          <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${!imageExists ? 'opacity-50' : ''}`}>
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <Upload className="mr-2" size={20} />
              Upload de Frame
            </h3>

            {/* Current Frame Status */}
            {frameInfo && (
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {frameInfo.has_frame ? (
                      <span className="text-green-600 flex items-center">
                        <Check size={16} className="mr-1" />
                        Frame disponible
                      </span>
                    ) : (
                      <span className="text-gray-500 flex items-center">
                        <X size={16} className="mr-1" />
                        Aucun frame
                      </span>
                    )}
                  </span>
                  {frameInfo.has_frame && (
                    <button
                      onClick={removeFrame}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
                {frameInfo.frame_size && (
                  <p className="text-xs text-gray-500 mt-1">
                    Taille: {frameInfo.frame_size[0]} × {frameInfo.frame_size[1]}px
                  </p>
                )}
              </div>
            )}

            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
              }`}
            >
              <input {...getInputProps()} />
              <Layers className="mx-auto mb-4 text-gray-400" size={48} />
              {uploading ? (
                <p className="text-blue-600">Upload en cours...</p>
              ) : isDragActive ? (
                <p className="text-blue-600">Déposez le frame ici...</p>
              ) : (
                <div>
                  <p className="text-gray-600 dark:text-gray-300 mb-2">
                    Glissez-déposez votre frame ou cliquez pour sélectionner
                  </p>
                  <p className="text-sm text-gray-500">
                    PNG, JPG, GIF jusqu'à 5MB
                  </p>
                </div>
              )}
            </div>

            {/* Preview */}
            {previewImage && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Prévisualisation:</h4>
                <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                  <img
                    src={previewImage}
                    alt="Frame preview"
                    className="max-h-20 mx-auto"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Text Input Section */}
          <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${!imageExists ? 'opacity-50' : ''}`}>
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <Type className="mr-2" size={20} />
              Texte du Frame
            </h3>
            
            {/* 🎨 SECTION FRAME INTELLIGENT AUTOMATIQUE */}
            <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl border-2 border-green-200 dark:border-green-700">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white text-2xl">🎨</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-green-800 dark:text-green-200">
                    Frame Automatique - Style Professionnel
                  </h3>
                  <p className="text-sm text-green-600 dark:text-green-300">
                    Génération automatique du frame dans le style de votre image de référence
                  </p>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg mb-4">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">
                  ✨ Ce qui sera généré automatiquement :
                </h4>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-500">🏷️</span>
                    <span>Bandeau de catégorie avec couleur adaptée</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-500">📅</span>
                    <span>Date du jour en français</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-500">📝</span>
                    <span>Texte du premier bullet point</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-500">🎯</span>
                    <span>Logo intégré automatiquement</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>💡 Mode automatique :</strong> Le système analysera votre article et créera 
                  un frame professionnel dans le style exact de votre image de référence, 
                  sans intervention manuelle nécessaire.
                </p>
              </div>
            </div>

            {/* Zone de texte optionnelle */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Texte personnalisé (optionnel)
              </label>
              
              <textarea
                value={bulletPointText}
                onChange={(e) => setBulletPointText(e.target.value)}
                placeholder="Laissez vide pour utiliser automatiquement le premier bullet point..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                rows={2}
                maxLength={200}
                disabled={!imageExists}
              />
              
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {bulletPointText.length === 0 ? (
                    <span className="text-blue-600 dark:text-blue-400">
                      ✨ Mode automatique activé - Premier bullet point sera utilisé
                    </span>
                  ) : (
                    `${bulletPointText.length}/200 caractères - Texte personnalisé`
                  )}
                </p>
                
                {bulletPoints && bulletPoints.length > 0 && (
                  <p className="text-xs text-green-600 dark:text-green-400">
                    {bulletPoints.length} bullet point{bulletPoints.length > 1 ? 's' : ''} disponible{bulletPoints.length > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Configuration Section */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <Settings className="mr-2" size={20} />
              Configuration du Logo
            </h3>

            {/* Position */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Position du logo (sur le frame)
              </label>
              <select
                value={logoPosition}
                onChange={(e) => setLogoPosition(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                {positionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Size Options */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3">
                Taille du logo
              </label>
              
              {/* Fixed Size Option (Recommended) */}
              <div className="mb-4">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="sizeOption"
                    checked={!useOriginalSize}
                    onChange={() => setUseOriginalSize(false)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm font-medium text-blue-600">
                    ✨ Taille optimisée (150×70px) - Recommandé
                  </span>
                </label>
              </div>

              {/* Original Size Option */}
              <div className="mb-4">
                <label className="flex items-center space-x-3 cursor-pointer mb-3">
                  <input
                    type="radio"
                    name="sizeOption"
                    checked={useOriginalSize}
                    onChange={() => setUseOriginalSize(true)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm">
                    Utiliser la taille originale du logo
                  </span>
                </label>
                
                {!useOriginalSize && (
                  <div className="grid grid-cols-2 gap-4 ml-7">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Largeur (px)
                      </label>
                      <input
                        type="number"
                        value={logoSize.width}
                        onChange={(e) => setLogoSize({ ...logoSize, width: parseInt(e.target.value) || 150 })}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                        min="50"
                        max="500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Hauteur (px)
                      </label>
                      <input
                        type="number"
                        value={logoSize.height}
                        onChange={(e) => setLogoSize({ ...logoSize, height: parseInt(e.target.value) || 70 })}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                        min="30"
                        max="300"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Preview Info */}
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-start text-green-700 dark:text-green-300">
                <Layers size={16} className="mr-2 mt-1 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium mb-1">Ordre de composition :</p>
                  <ol className="text-xs space-y-1">
                    <li>1. Image de base</li>
                    <li>2. + Frame personnalisé</li>
                    <li>3. + Texte centré (zone 32% bas)</li>
                    <li>4. + Logo en position "{positionOptions.find(p => p.value === logoPosition)?.label}"</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex justify-between">
        <button
          onClick={prevStep}
          className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          ← Retour
        </button>

        <div className="flex space-x-4">
          <button
            onClick={skipFrameStep}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Ignorer cette étape
          </button>

          <button
            onClick={applyFrameToImage}
            disabled={!frameInfo?.has_frame || applying || !bulletPointText.trim()}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {applying ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Application...
              </>
            ) : (
              <>
                <Layers className="mr-2" size={16} />
                Appliquer Frame + Logo
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default FrameUpload 