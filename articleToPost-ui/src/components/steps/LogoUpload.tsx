import { useState, useEffect, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import useProjectStore from '../../store/useProjectStore'
import { Upload, Check, X, Image as ImageIcon, Settings, Eye, AlertTriangle } from 'lucide-react'
import { API_URL } from '../../config'

interface LogoInfo {
  has_logo: boolean
  logo_size?: [number, number]
  message: string
}

const LogoUpload = () => {
  const { nextStep, prevStep, articleData, bulletPoints, slides, updateBulletPointImage, updateSlide } = useProjectStore()
  const [logoInfo, setLogoInfo] = useState<LogoInfo | null>(null)
  const [uploading, setUploading] = useState(false)
  const [applying, setApplying] = useState(false)
  const [logoPosition, setLogoPosition] = useState('top_right')
  const [useOriginalSize, setUseOriginalSize] = useState(false)  // Par défaut, utilise la taille fixe
  const [logoSize, setLogoSize] = useState({ width: 150, height: 70 })  // Taille fixe par défaut
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [imageExists, setImageExists] = useState(false)

  // Check current logo status
  useEffect(() => {
    console.log('LogoUpload - articleData:', articleData)
    checkCurrentLogo()
    checkImageExists()
  }, [articleData.id, bulletPoints])

  const checkImageExists = async () => {
    if (!articleData.id) {
      setImageExists(false)
      return
    }

    try {
      // Vérifier si l'article a une image générée
      const response = await fetch(`${API_URL}/articles/${articleData.id}/`)
      if (response.ok) {
        const data = await response.json()
        const hasImage = data.bullet_points && data.bullet_points.length > 0 && 
                        data.bullet_points.some((bp: any) => bp.image_path && bp.image_path !== '')
        setImageExists(hasImage)
        
        if (!hasImage) {
          setError('⚠️ Vous devez d\'abord générer une image avant d\'ajouter un logo. Retournez à l\'étape précédente pour générer l\'image.')
        } else {
          setError(null)
        }
      }
    } catch (err) {
      console.error('Error checking image:', err)
      setImageExists(false)
    }
  }

  const checkCurrentLogo = async () => {
    try {
      const response = await fetch(`${API_URL}/logo/current/`)
      const data = await response.json()
      setLogoInfo(data)
    } catch (err) {
      console.error('Error checking logo:', err)
      setError('Impossible de vérifier le logo actuel')
    }
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!imageExists) {
      setError('⚠️ Impossible d\'uploader le logo : aucune image générée. Générez d\'abord une image.')
      return
    }

    const file = acceptedFiles[0]
    if (!file) return

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`${API_URL}/logo/upload/`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const result = await response.json()
      console.log('Logo uploaded:', result)
      
      // Refresh logo info
      await checkCurrentLogo()
      
      // Show preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)

    } catch (err) {
      setError('Erreur lors de l\'upload du logo')
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
    disabled: !imageExists // Désactiver si pas d'image
  })

  const applyLogoToImage = async () => {
    if (!articleData.id || !imageExists) {
      setError('⚠️ Impossible d\'appliquer le logo : aucune image générée.')
      return
    }

    console.log('Applying logo to article ID:', articleData.id)
    setApplying(true)
    setError(null)

    try {
      const response = await fetch(`${API_URL}/logo/apply/${articleData.id}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          article_id: articleData.id,
          logo_position: logoPosition,
          logo_size_width: useOriginalSize ? null : logoSize.width,
          logo_size_height: useOriginalSize ? null : logoSize.height,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to apply logo')
      }

      const result = await response.json()
      console.log('Logo applied:', result)
      
      // 🎯 MISE À JOUR CRITIQUE : Forcer le rechargement de l'image avec le logo appliqué
      if (result.image_path) {
        // Attendre un peu pour s'assurer que le fichier est bien écrit sur le disque
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Forcer le rechargement de l'image avec un timestamp pour éviter le cache
        const timestamp = new Date().getTime()
        const imageFileName = result.image_path.split('/').pop() || result.image_path
        const newImageUrl = `${API_URL}/static/img/${imageFileName}?t=${timestamp}`
        
        console.log('🔄 Mise à jour de l\'image avec logo:', newImageUrl)
        
        // Mettre à jour TOUS les bullet points (pas seulement point_01)
        bulletPoints.forEach(bp => {
          if (bp.image_path && bp.image_path.includes('.jpg')) {
            console.log(`📝 Mise à jour bullet point ${bp.id} avec image:`, imageFileName)
            updateBulletPointImage(bp.id, imageFileName)
          }
        })
        
        // Mettre à jour TOUTES les slides qui utilisent des images
        if (slides && slides.length > 0) {
          slides.forEach(slide => {
            if (slide.image && slide.image.includes('.jpg')) {
              console.log(`🖼️ Mise à jour slide ${slide.id} avec image:`, newImageUrl)
              updateSlide(slide.id, { image: newImageUrl })
            }
          })
        }
        
        // Forcer un refresh de la page dans 2 secondes pour s'assurer que tout est à jour
        setTimeout(() => {
          console.log('🔄 Rechargement automatique de la page pour afficher le logo...')
          window.location.reload()
        }, 2000)
        
        console.log('✅ Image mise à jour dans le store avec le logo appliqué:', newImageUrl)
      }
      
      // Continue to next step
      nextStep()

    } catch (err) {
      setError('Erreur lors de l\'application du logo')
      console.error('Apply error:', err)
    } finally {
      setApplying(false)
    }
  }

  const skipLogoStep = () => {
    nextStep()
  }

  const goBackToGenerateImage = () => {
    prevStep() // Retourner à l'étape précédente (génération d'image)
  }

  const removeLogo = async () => {
    try {
      const response = await fetch(`${API_URL}/logo/remove/`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setLogoInfo({ has_logo: false, message: 'No logo' })
        setPreviewImage(null)
      }
    } catch (err) {
      console.error('Error removing logo:', err)
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
          🎨 Ajout de Logo
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Ajoutez votre logo sur l'image générée pour personnaliser vos posts
        </p>
      </div>

      {/* Alerte si pas d'image */}
      {!imageExists && (
        <div className="mb-6 p-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex items-start">
            <AlertTriangle className="text-amber-500 mr-3 mt-1" size={24} />
            <div>
              <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-2">
                ⚠️ Image requise avant l'ajout du logo
              </h3>
              <p className="text-amber-700 dark:text-amber-300 mb-4">
                Vous devez d'abord générer une image pour votre article avant de pouvoir ajouter un logo.
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
              Upload de Logo
            </h3>

            {/* Current Logo Status */}
            {logoInfo && (
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {logoInfo.has_logo ? (
                      <span className="text-green-600 flex items-center">
                        <Check size={16} className="mr-1" />
                        Logo disponible
                      </span>
                    ) : (
                      <span className="text-gray-500 flex items-center">
                        <X size={16} className="mr-1" />
                        Aucun logo
                      </span>
                    )}
                  </span>
                  {logoInfo.has_logo && (
                    <button
                      onClick={removeLogo}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
                {logoInfo.logo_size && (
                  <p className="text-xs text-gray-500 mt-1">
                    Taille: {logoInfo.logo_size[0]} × {logoInfo.logo_size[1]}px
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
              <ImageIcon className="mx-auto mb-4 text-gray-400" size={48} />
              {uploading ? (
                <p className="text-blue-600">Upload en cours...</p>
              ) : isDragActive ? (
                <p className="text-blue-600">Déposez le logo ici...</p>
              ) : (
                <div>
                  <p className="text-gray-600 dark:text-gray-300 mb-2">
                    Glissez-déposez votre logo ou cliquez pour sélectionner
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
                    alt="Logo preview"
                    className="max-h-20 mx-auto"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Configuration Section */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <Settings className="mr-2" size={20} />
              Configuration
            </h3>

            {/* Position */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Position du logo
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
                    {logoInfo?.logo_size && (
                      <span className="text-gray-500 ml-2">
                        ({logoInfo.logo_size[0]} × {logoInfo.logo_size[1]}px)
                      </span>
                    )}
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
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center text-blue-700 dark:text-blue-300">
                <Eye size={16} className="mr-2" />
                <span className="text-sm">
                  Le logo sera appliqué en position "{positionOptions.find(p => p.value === logoPosition)?.label}" 
                  {useOriginalSize ? (
                    logoInfo?.logo_size ? 
                      ` avec sa taille originale (${logoInfo.logo_size[0]}×${logoInfo.logo_size[1]}px)` :
                      ' avec sa taille originale'
                  ) : (
                    ` avec une taille optimisée de 150×70px (recommandé)`
                  )}
                </span>
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
            onClick={skipLogoStep}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Ignorer cette étape
          </button>

          <button
            onClick={applyLogoToImage}
            disabled={!logoInfo?.has_logo || applying}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {applying ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Application...
              </>
            ) : (
              <>
                <Check className="mr-2" size={16} />
                Appliquer le logo
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default LogoUpload 