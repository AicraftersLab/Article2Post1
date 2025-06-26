# 🎨 Guide d'Utilisation - Système de Frame avec Texte

## Vue d'ensemble

Le nouveau système de **Frame avec Texte** permet d'ajouter des frames personnalisés avec du texte intelligent et des logos sur vos images générées. Ce système combine trois éléments :

1. **Image de base** - Votre image générée
2. **Frame personnalisé** - Cadre décoratif uploadé
3. **Texte intelligent** - Texte adaptatif avec police optimisée
4. **Logo** - Votre logo positionné sur le frame

## 🚀 Fonctionnalités Principales

### ✨ Système de Texte Intelligent

- **Adaptation automatique** : La taille de police s'ajuste de 45px à 25px selon la longueur du texte
- **Centrage parfait** : Le texte est automatiquement centré dans la zone dédiée
- **Police optimisée** : Utilise Poppins-Bold avec fallback Arial
- **Zone dédiée** : 32% du bas de l'image réservé au texte
- **Marges intelligentes** : 60px des côtés pour un rendu professionnel
- **Espacement optimal** : 15px entre les lignes pour une lisibilité parfaite

### 🎯 Composition en Couches

L'ordre de composition est optimisé pour un rendu professionnel :

```
1. Image de base (votre image générée)
   ↓
2. Frame personnalisé (votre cadre décoratif)
   ↓
3. Texte adaptatif (centré dans la zone 32% bas)
   ↓
4. Logo (positionné selon vos préférences)
```

## 📋 Étapes d'Utilisation

### 1. Prérequis

⚠️ **IMPORTANT** : Vous devez d'abord avoir une image générée pour votre article.

**Séquence obligatoire** :
1. Créer l'article
2. **Générer l'image** (étape obligatoire)
3. Uploader et appliquer le frame
4. Générer les posts sociaux

### 2. Upload du Frame

1. Accédez à l'étape "**Frame avec Texte**"
2. Glissez-déposez votre frame ou cliquez pour sélectionner
3. Formats acceptés : PNG, JPG, GIF (jusqu'à 5MB)
4. Le frame est automatiquement redimensionné à la taille de l'image

### 3. Configuration du Texte

1. Saisissez votre texte dans la zone dédiée (200 caractères max)
2. Le système adapte automatiquement :
   - La taille de police (45px → 25px)
   - Le nombre de lignes
   - Le centrage horizontal et vertical

### 4. Configuration du Logo

- **Position** : 6 options disponibles (haut droite recommandé)
- **Taille** : Optimisée 150×70px (recommandé) ou taille originale
- **Qualité** : Redimensionnement haute qualité LANCZOS

### 5. Application

Cliquez sur "**Appliquer Frame + Logo**" pour composer l'image finale.

## 🛠️ API Endpoints

### Frame Management

```http
# Upload d'un frame
POST /api/frame/upload/
Content-Type: multipart/form-data

# Statut du frame actuel
GET /api/frame/current/

# Application frame + logo + texte
POST /api/frame/apply/{article_id}/
Content-Type: application/json
{
  "article_id": 1,
  "bullet_point_text": "Votre texte ici",
  "logo_position": "top_right",
  "logo_size_width": 150,
  "logo_size_height": 70
}

# Suppression du frame
DELETE /api/frame/remove/
```

## 💡 Conseils d'Optimisation

### Frame Design

- **Résolution recommandée** : 1920×1080px
- **Zone de texte** : Réservez 32% du bas (≈345px) pour le texte
- **Transparence** : Utilisez PNG avec canal alpha pour les effets
- **Couleurs** : Contrastez avec le texte blanc

### Texte

- **Longueur optimale** : 50-150 caractères
- **Contenu** : Points clés, citations, statistiques
- **Style** : Phrases courtes et impactantes

### Logo

- **Format** : PNG avec transparence recommandé
- **Taille** : 150×70px pour un rendu optimal
- **Position** : "top_right" généralement la plus visible

## 🔧 Architecture Technique

### Backend (Python)

```python
# Modules principaux
core/frame_overlay.py     # Logique de frame et texte
core/logo_overlay.py      # Intégration logo + frame
api_main.py              # Endpoints API
```

### Frontend (React/TypeScript)

```typescript
// Composants
components/steps/FrameUpload.tsx  # Interface utilisateur
store/useProjectStore.ts          # Gestion d'état
```

### Fonctionnalités Clés

- **Gestion des polices** : Fallback automatique
- **Redimensionnement intelligent** : Adaptation aux contraintes
- **Composition alpha** : Transparence préservée
- **Cache management** : Frames persistants
- **Validation** : Vérification des prérequis

## 🐛 Dépannage

### Erreurs Communes

**"Aucune image trouvée"**
```
Solution : Générez d'abord une image pour votre article
Étapes : Article → Image → Frame → Posts
```

**"Frame non uploadé"**
```
Solution : Vérifiez le format et la taille du fichier
Formats : PNG, JPG, GIF (max 5MB)
```

**"Texte trop long"**
```
Solution : Réduisez le texte ou le système l'adaptera automatiquement
Limite : 200 caractères recommandés
```

### Logs de Debug

```bash
# Backend logs
tail -f logs/api.log

# Vérification des fichiers
ls -la cache/frame.png
ls -la cache/persistent_logo.png
```

## 📊 Tests et Validation

### Test Automatique

```bash
# Lancer le test complet
python test_frame_system.py
```

### Test Manuel

1. Créer un article avec image
2. Uploader un frame de test
3. Uploader un logo de test
4. Appliquer avec texte personnalisé
5. Vérifier l'image finale

## 🎉 Résultat Final

Le système produit une image composite professionnelle avec :

- ✅ Frame décoratif personnalisé
- ✅ Texte adaptatif centré et lisible
- ✅ Logo positionné avec précision
- ✅ Qualité haute résolution préservée
- ✅ Transparence et effets maintenus

---

**Créé par** : Système Article2Post  
**Version** : 2.0.0  
**Date** : 2024 