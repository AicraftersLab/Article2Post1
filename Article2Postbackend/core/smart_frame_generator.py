#!/usr/bin/env python3
"""
Smart Frame Generator
Génère automatiquement des frames dans le style de l'utilisateur
"""

import os
import logging
from PIL import Image, ImageDraw, ImageFont
from typing import Optional, Tuple, Dict, Any
from datetime import datetime
import locale

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SmartFrameGenerator:
    """Générateur de frames intelligent basé sur le style utilisateur"""
    
    def __init__(self):
        self.preferred_fonts = [
            "fonts/Montserrat-Bold.ttf",
            "fonts/Leelawadee Bold.ttf", 
            "fonts/Poppins-Bold.ttf",
            "Arial"
        ]
        
        # Couleurs du style utilisateur (EXACTES selon le screenshot)
        self.colors = {
            "orange_primary": (255, 152, 0),        # Orange du bandeau ÉCONOMIE
            "green_primary": (34, 139, 69),         # Vert société
            "black_text_bg": (33, 37, 41),          # Fond noir pour le texte
            "white_text": (255, 255, 255),          # Texte blanc
            "date_green": (76, 175, 80),            # Vert pour la date
            "gradient_start": (255, 152, 0),        # Début du dégradé orange
            "gradient_end": (255, 193, 7)           # Fin du dégradé orange
        }
        
        # Catégories et leurs couleurs (EXACTES selon le style)
        self.categories = {
            "société": (34, 139, 69),               # Vert société
            "économie": (255, 152, 0),              # Orange économie (comme screenshot)
            "technologie": (33, 150, 243),          # Bleu technologie
            "santé": (76, 175, 80),                 # Vert santé
            "éducation": (156, 39, 176),            # Violet éducation
            "sport": (244, 67, 54),                 # Rouge sport
            "culture": (121, 85, 72),               # Marron culture
            "politique": (96, 125, 139),            # Gris politique
            "environnement": (139, 195, 74),        # Vert clair environnement
            "finance": (255, 193, 7),               # Jaune finance
            "default": (34, 139, 69)                # Vert par défaut
        }
    
    def get_font(self, font_paths: list, size: int) -> ImageFont.FreeTypeFont:
        """Obtenir une police avec fallback"""
        for font_path in font_paths:
            try:
                if os.path.exists(font_path):
                    return ImageFont.truetype(font_path, size)
            except Exception as e:
                logger.warning(f"Could not load font {font_path}: {e}")
        
        try:
            return ImageFont.truetype("arial.ttf", size)
        except:
            return ImageFont.load_default()
    
    def detect_category(self, article_title: str, bullet_points: list) -> str:
        """Détecter automatiquement la catégorie de l'article"""
        text_to_analyze = article_title.lower()
        if bullet_points:
            text_to_analyze += " " + " ".join([bp.get('text', '') for bp in bullet_points]).lower()
        
        # Mots-clés par catégorie
        keywords = {
            "société": ["société", "social", "communauté", "population", "citoyen", "public"],
            "économie": ["économie", "économique", "entreprise", "business", "marché", "finance", "prix", "coût"],
            "technologie": ["technologie", "tech", "numérique", "digital", "ia", "intelligence artificielle", "robot"],
            "santé": ["santé", "médical", "médecine", "hôpital", "patient", "traitement", "vaccin"],
            "éducation": ["éducation", "école", "université", "étudiant", "formation", "cours", "apprentissage"],
            "sport": ["sport", "football", "tennis", "olympique", "athlète", "compétition", "match"],
            "culture": ["culture", "art", "musique", "cinéma", "livre", "théâtre", "festival"],
            "politique": ["politique", "gouvernement", "président", "ministre", "élection", "vote", "parlement"],
            "environnement": ["environnement", "écologie", "climat", "pollution", "nature", "durable"],
            "finance": ["finance", "banque", "investissement", "bourse", "action", "crédit", "monnaie"]
        }
        
        # Compter les occurrences
        category_scores = {}
        for category, words in keywords.items():
            score = sum(1 for word in words if word in text_to_analyze)
            if score > 0:
                category_scores[category] = score
        
        # Retourner la catégorie avec le meilleur score
        if category_scores:
            return max(category_scores, key=category_scores.get)
        
        return "société"  # Défaut
    
    def get_french_date(self) -> str:
        """Obtenir la date en français"""
        try:
            # Essayer de définir la locale française
            locale.setlocale(locale.LC_TIME, 'fr_FR.UTF-8')
        except:
            try:
                locale.setlocale(locale.LC_TIME, 'French_France.1252')
            except:
                pass  # Utiliser la locale par défaut
        
        now = datetime.now()
        
        # Jours de la semaine en français
        days_fr = {
            'Monday': 'Lundi',
            'Tuesday': 'Mardi', 
            'Wednesday': 'Mercredi',
            'Thursday': 'Jeudi',
            'Friday': 'Vendredi',
            'Saturday': 'Samedi',
            'Sunday': 'Dimanche'
        }
        
        day_name = days_fr.get(now.strftime('%A'), now.strftime('%A'))
        return f"{day_name}, {now.strftime('%d/%m/%Y')}"
    
    def create_gradient_background(self, width: int, height: int, color1: tuple, color2: tuple) -> Image.Image:
        """Créer un arrière-plan avec dégradé"""
        image = Image.new('RGB', (width, height))
        
        for y in range(height):
            # Calculer la position dans le dégradé (0.0 à 1.0)
            ratio = y / height
            
            # Interpoler entre les deux couleurs
            r = int(color1[0] * (1 - ratio) + color2[0] * ratio)
            g = int(color1[1] * (1 - ratio) + color2[1] * ratio)
            b = int(color1[2] * (1 - ratio) + color2[2] * ratio)
            
            # Dessiner une ligne horizontale avec cette couleur
            for x in range(width):
                image.putpixel((x, y), (r, g, b))
        
        return image
    
    def generate_smart_frame_from_existing(self, base_frame_path: str = "cache/Frame.png", 
                                          category: str = None, article_title: str = "", 
                                          bullet_points: list = None) -> Image.Image:
        """
        Générer un frame intelligent en utilisant le frame existant comme base
        et en ajoutant les éléments du style screenshot
        
        Args:
            base_frame_path (str): Chemin vers le frame de base
            category (str): Catégorie de l'article (auto-détectée si None)
            article_title (str): Titre de l'article pour auto-détection
            bullet_points (list): Points clés pour auto-détection
            
        Returns:
            Image.Image: Frame généré avec les éléments du screenshot
        """
        try:
            # Charger le frame existant comme base
            if not os.path.exists(base_frame_path):
                logger.warning(f"Frame de base non trouvé: {base_frame_path}, génération d'un nouveau frame")
                return self.generate_smart_frame(1920, 1080, category, article_title, bullet_points)
            
            base_frame = Image.open(base_frame_path).convert('RGBA')
            width, height = base_frame.size
            
            # Auto-détecter la catégorie si non fournie
            if not category and (article_title or bullet_points):
                category = self.detect_category(article_title, bullet_points or [])
            
            category = category or "société"
            category_color = self.categories.get(category.lower(), self.colors["green_primary"])
            
            logger.info(f"🎨 Utilisation du frame existant + éléments screenshot pour: {category}")
            
            # Créer une copie du frame de base
            frame = base_frame.copy()
            draw = ImageDraw.Draw(frame)
            
            # 1. BANDEAU CATÉGORIE (style screenshot) - par-dessus le frame existant
            bandeau_height = 80
            
            # Bandeau avec couleur de catégorie (vert pour société)
            draw.rectangle([0, 0, width, bandeau_height], fill=category_color)
            
            # Lignes décoratives blanches sur le bandeau
            line_width = 60
            line_spacing = 120
            line_y = 15
            for x in range(50, width - 100, line_spacing):
                draw.rectangle([x, line_y, x + line_width, line_y + 4], fill=(255, 255, 255, 180))
            
            # Texte de la catégorie (aligné à droite)
            category_font = self.get_font(self.preferred_fonts, 42)
            category_text = category.upper()
            
            bbox = draw.textbbox((0, 0), category_text, font=category_font)
            text_width = bbox[2] - bbox[0]
            text_x = width - text_width - 80
            text_y = (bandeau_height - (bbox[3] - bbox[1])) // 2
            
            draw.text((text_x, text_y), category_text, fill=self.colors["white_text"], font=category_font)
            
            # 2. DATE (style screenshot)
            date_text = self.get_french_date()
            date_font = self.get_font(self.preferred_fonts, 24)
            date_y = bandeau_height + 30
            
            # Ligne verte avant la date
            line_length = 80
            line_y = date_y + 10
            draw.rectangle([60, line_y, 60 + line_length, line_y + 3], fill=self.colors["date_green"])
            
            # Texte de la date en vert
            draw.text((60 + line_length + 20, date_y), date_text, fill=self.colors["date_green"], font=date_font)
            
            # 3. ZONE DE TEXTE (améliorer la zone existante du frame)
            text_zone_height = int(height * 0.35)
            text_zone_y = height - text_zone_height
            
            # Améliorer la zone de texte existante avec une bordure verte
            border_height = 4
            draw.rectangle([0, text_zone_y, width, text_zone_y + border_height], 
                          fill=self.colors["date_green"])
            
            # Assombrir légèrement la zone de texte pour plus de contraste
            overlay = Image.new('RGBA', (width, text_zone_height), (*self.colors["black_text_bg"], 100))
            frame.paste(overlay, (0, text_zone_y), overlay)
            
            logger.info(f"✅ Frame existant modifié avec éléments screenshot: {width}x{height}")
            return frame
            
        except Exception as e:
            logger.error(f"Erreur lors de la modification du frame existant: {e}")
            # Fallback vers la génération normale
            return self.generate_smart_frame(1920, 1080, category, article_title, bullet_points)
    
    def generate_smart_frame(self, width: int = 1920, height: int = 1080, 
                           category: str = None, article_title: str = "", 
                           bullet_points: list = None) -> Image.Image:
        """
        Utiliser EXACTEMENT le frame existant Frame.png sans rien ajouter
        Le texte sera ajouté par le frame_overlay.py
        """
        # Essayer d'utiliser le frame existant EXACTEMENT comme il est
        existing_frame_path = "cache/Frame.png"
        if os.path.exists(existing_frame_path):
            logger.info("🖼️ Utilisation du Frame.png existant EXACTEMENT comme il est")
            try:
                frame = Image.open(existing_frame_path).convert('RGBA')
                logger.info(f"✅ Frame existant chargé: {frame.size}")
                return frame
            except Exception as e:
                logger.error(f"Erreur chargement Frame.png: {e}")
        
        # Si pas de frame existant, créer un frame transparent simple
        logger.info("🆕 Aucun Frame.png trouvé, création d'un frame transparent")
        frame = Image.new('RGBA', (width, height), (0, 0, 0, 0))
        return frame
    
    def _generate_new_frame(self, width: int = 1920, height: int = 1080, 
                           category: str = None, article_title: str = "", 
                           bullet_points: list = None) -> Image.Image:
        """
        Générer un frame intelligent dans le style EXACT du screenshot utilisateur
        
        Args:
            width (int): Largeur du frame
            height (int): Hauteur du frame
            category (str): Catégorie de l'article (auto-détectée si None)
            article_title (str): Titre de l'article pour auto-détection
            bullet_points (list): Points clés pour auto-détection
            
        Returns:
            Image.Image: Frame généré dans le style exact du screenshot
        """
        # Auto-détecter la catégorie si non fournie
        if not category and (article_title or bullet_points):
            category = self.detect_category(article_title, bullet_points or [])
        
        category = category or "société"
        category_color = self.categories.get(category.lower(), self.colors["green_primary"])
        
        logger.info(f"🎨 Génération frame style screenshot pour catégorie: {category} avec couleur {category_color}")
        
        # Créer l'image de base avec fond transparent
        frame = Image.new('RGBA', (width, height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(frame)
        
        # 1. BANDEAU CATÉGORIE (haut) - Style EXACT du screenshot
        bandeau_height = 80
        
        # Fond du bandeau avec la couleur de la catégorie
        draw.rectangle([0, 0, width, bandeau_height], fill=category_color)
        
        # Petites lignes décoratives blanches sur le bandeau (comme dans le screenshot)
        line_width = 60
        line_spacing = 120
        line_y = 15
        for x in range(50, width - 100, line_spacing):
            draw.rectangle([x, line_y, x + line_width, line_y + 4], fill=(255, 255, 255, 180))
        
        # Texte de la catégorie sur le bandeau (aligné à droite comme dans le screenshot)
        category_font = self.get_font(self.preferred_fonts, 42)
        category_text = category.upper()
        
        # Position du texte (aligné à droite avec marge)
        bbox = draw.textbbox((0, 0), category_text, font=category_font)
        text_width = bbox[2] - bbox[0]
        text_x = width - text_width - 80  # Marge droite
        text_y = (bandeau_height - (bbox[3] - bbox[1])) // 2
        
        draw.text((text_x, text_y), category_text, fill=self.colors["white_text"], font=category_font)
        
        # 2. DATE (sous le bandeau) - Style EXACT du screenshot
        date_text = self.get_french_date()
        date_font = self.get_font(self.preferred_fonts, 24)
        date_y = bandeau_height + 30
        
        # Ligne verte avant la date (comme dans le screenshot)
        line_length = 80
        line_y = date_y + 10
        draw.rectangle([60, line_y, 60 + line_length, line_y + 3], fill=self.colors["date_green"])
        
        # Texte de la date (vert comme dans le screenshot)
        draw.text((60 + line_length + 20, date_y), date_text, fill=self.colors["date_green"], font=date_font)
        
        # 3. ZONE DE TEXTE (bas) - Style EXACT du screenshot
        text_zone_height = int(height * 0.35)  # Un peu plus grand pour correspondre au screenshot
        text_zone_y = height - text_zone_height
        
        # Fond noir semi-transparent pour la zone de texte (comme dans le screenshot)
        text_bg_color = (*self.colors["black_text_bg"], 240)  # Plus opaque
        draw.rectangle([0, text_zone_y, width, height], fill=text_bg_color)
        
        # Bordure supérieure verte pour la zone de texte (comme dans le screenshot)
        border_height = 4
        draw.rectangle([0, text_zone_y, width, text_zone_y + border_height], 
                      fill=self.colors["date_green"])
        
        # 4. EFFET D'OMBRE ET PROFONDEUR (comme dans le screenshot)
        # Gradient subtil dans la zone de texte pour donner de la profondeur
        for i in range(text_zone_height):
            alpha = int(240 - (i * 20 / text_zone_height))  # Gradient d'opacité
            alpha = max(200, min(240, alpha))
            y_pos = text_zone_y + i
            if y_pos < height:
                draw.line([(0, y_pos), (width, y_pos)], 
                         fill=(*self.colors["black_text_bg"], alpha))
        
        # 5. ÉLÉMENTS DÉCORATIFS SUBTILS (comme dans le screenshot)
        # Petites lignes décoratives dans la zone de texte
        for i in range(3):
            x_pos = 60 + (i * 200)
            if x_pos < width - 100:
                draw.rectangle([x_pos, text_zone_y + 20, x_pos + 40, text_zone_y + 22], 
                              fill=(255, 255, 255, 30))
        
        logger.info(f"✅ Frame style screenshot généré: {width}x{height}, catégorie: {category}")
        return frame
    
    def save_frame(self, frame: Image.Image, path: str = "cache/smart_frame.png") -> bool:
        """Sauvegarder le frame généré"""
        try:
            os.makedirs(os.path.dirname(path), exist_ok=True)
            frame.save(path, "PNG")
            logger.info(f"Frame sauvegardé: {path}")
            return True
        except Exception as e:
            logger.error(f"Erreur sauvegarde frame: {e}")
            return False

# Instance globale
smart_frame_generator = SmartFrameGenerator()

def generate_smart_frame(article_title: str = "", bullet_points: list = None, 
                        category: str = None, **kwargs) -> Image.Image:
    """
    Fonction de convenance pour générer un frame intelligent
    """
    return smart_frame_generator.generate_smart_frame(
        category=category,
        article_title=article_title,
        bullet_points=bullet_points,
        **kwargs
    ) 