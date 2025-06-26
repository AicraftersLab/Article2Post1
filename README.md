
# ArticleToPost

🚀 **Une application web puissante qui convertit automatiquement des articles en posts optimisés pour les réseaux sociaux avec génération d'images AI et interface moderne.**


### Backend
- **FastAPI** - Framework web haute performance
- **OpenAI API** - Génération d'images et résumés
- **Python 3.9+** - Langage principal
- **Pillow** - Traitement d'images
- **Requests** - Communication HTTP

### Frontend
- **React 18** - Framework UI
- **TypeScript** - JavaScript typé
- **Tailwind CSS** - Framework CSS utilitaire
- **Zustand** - Gestion d'état
- **Vite** - Build tool moderne
- **Axios** - Client HTTP

## 🚀 Installation et Démarrage

### Prérequis

- **Python 3.9+**
- **Node.js 18+**
- **npm ou yarn**
- **Clé API OpenAI**

### 1. Cloner le Repository

```bash
git clone https://github.com/AicraftersLab/Article2Post1.git
cd ArticleToPost
```

### 2. Configuration du Backend

```bash
cd Article2Post

# Créer et activer l'environnement virtuel
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt
```

### 3. Configuration du Frontend

```bash
cd ../articleToPost-ui
npm install
```

### 4. Configuration des Variables d'Environnement

Créez un fichier `.env` dans le dossier `Article2Post/` :

```env
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here  # Optionnel
```

### 5. Lancer l'Application

#### Mode Développement

**Terminal 1 - Backend :**
```bash
cd Article2Post
python api_main.py
```

**Terminal 2 - Frontend :**
```bash
cd articleToPost-ui
npm run dev
```

**Accès :** `http://localhost:5173`

#### Mode Production

```bash
# Build du frontend
cd articleToPost-ui
npm run build

# Déploiement du backend
cd ../Article2Post
uvicorn api_main:app --host 0.0.0.0 --port 8000
```

## 📖 Guide d'Utilisation

### Workflow Principal

1. **📝 Saisie d'Article** 
   - Coller une URL d'article ou du texte directement
   - L'application extrait automatiquement le contenu

2. **🎯 Génération de Points Clés**
   - L'IA analyse le contenu et extrait les points principaux
   - Possibilité d'éditer et personnaliser les points

3. **🖼️ Personnalisation Visuelle**
   - Upload de frames personnalisés (optionnel)
   - Ajout de logos d'entreprise
   - Prévisualisation en temps réel

4. **🎨 Génération d'Images**
   - Création automatique d'images AI pour chaque point
   - Personnalisation des styles et couleurs

5. **📱 Export de Posts Sociaux**
   - Génération de contenu optimisé pour différentes plateformes
   - Téléchargement des images et textes

## 🔧 API Endpoints

### Articles
- `POST /api/articles/process/` - Traitement d'article
- `GET /api/articles/{article_id}/` - Récupération d'article
- `GET /api/articles/` - Liste des articles

### Points Clés
- `PUT /api/articles/{article_id}/bullet-points/{id}/` - Mise à jour
- `POST /api/articles/{article_id}/bullet-points/regenerate-all/` - Régénération

### Images
- `POST /api/images/generate/` - Génération d'image
- `POST /api/images/upload-frame/` - Upload de frame
- `POST /api/images/upload-logo/` - Upload de logo

### Utilitaires
- `GET /api/health` - Vérification santé
- `POST /api/cache/clear/` - Nettoyage cache

## 📁 Structure du Projet

```
ArticleToPost/
├── Article2Post/                    #  Backend Python
│   ├── api_main.py                 #  Point d'entrée FastAPI
│   ├── core/                       #  Logique métier
│   │   ├── image_generator.py      #  Génération d'images AI
│   │   ├── text_processor.py       #  Traitement de texte
│   │   ├── social_post_generator.py #  Posts sociaux
│   │   └── ...
│   ├── services/                   #  Services externes
│   │   ├── web_scraper.py         #  Scraping web
│   │   ├── openai_client.py       # Client OpenAI
│   │   └── ...
│   ├── utils/                      #  Utilitaires
│   ├── config/                     #  Configuration
│   ├── prompts/                    #  Templates IA
│   └── requirements.txt            #  Dépendances Python
│
├── articleToPost-ui/               # frontend React
│   ├── src/
│   │   ├── components/            # Composants
│   │   │   ├── layout/           # Layout
│   │   │   ├── steps/            # Étapes workflow
│   │   │   └── ui/               # Composants UI
│   │   ├── services/             # PI client
│   │   ├── store/                # tat global
│   │   ├── utils/                # Utilitaires
│   │   └── types/                # Types TypeScript
│   ├── package.json              # Dépendances Node
│   └── ...
│
└── README.md                       # 📚 Documentation
```

## 🔍 Dépannage

### Problèmes Courants

**1. Erreurs d'import Python**
```bash
# Vérifiez que vous êtes dans le bon répertoire
cd Article2Post
python api_main.py
```

**2. Problèmes de clés API**
- Vérifiez votre fichier `.env`
- Testez vos clés API OpenAI
- Vérifiez vos crédits API

**3. Connexion Frontend-Backend**
- Vérifiez que le backend tourne sur le port 8000
- Contrôlez les paramètres CORS
- Vérifiez la configuration API dans `src/config.ts`

**4. Problèmes de build**
```bash
# Nettoyer les dépendances
cd articleToPost-ui
rm -rf node_modules package-lock.json
npm install
```

## 🎯 Configuration Avancée

### Personnalisation des Prompts
Les templates IA se trouvent dans `Article2Post/prompts/` :
- `image_generation_prompt.py` - Génération d'images
- `openai_summarization_prompt.py` - Résumés d'articles

### Variables d'Environnement Complètes
```env
# API Keys
OPENAI_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here

# Configuration
MAX_BULLET_POINTS=10
DEFAULT_IMAGE_SIZE=1024x1024
CACHE_DURATION=3600

# Développement
DEBUG=true
LOG_LEVEL=INFO


