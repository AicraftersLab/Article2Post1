#!/usr/bin/env python3
"""
Frame Overlay Module
Handles adding frames with text to images for social media posts
"""

import os
import logging
from PIL import Image, ImageDraw, ImageFont
from typing import Optional, Tuple, Dict, Any, List
import textwrap
from .smart_frame_generator import smart_frame_generator  # 🎨 NOUVEAU IMPORT

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Constants pour le texte
INITIAL_MAIN_FONT_SIZE = 45
MIN_MAIN_FONT_SIZE = 25
MAIN_TEXT_LINE_SPACING = 15
DEFAULT_TEXT_COLOR = (255, 255, 255)  # Blanc
TEXT_SIDE_MARGIN = 60

class FrameOverlay:
    """Handle frame overlay operations with text on images"""
    
    def __init__(self):
        self.frame_path = "cache/frame.png"
        self.smart_frame_path = "cache/smart_frame.png"  # 🎨 NOUVEAU FRAME INTELLIGENT
        self.preferred_fonts = [
            "fonts/Poppins-Bold.ttf",
            "fonts/Montserrat-Bold.ttf", 
            "fonts/Leelawadee Bold.ttf",
            "Arial"
        ]
        
    def get_font(self, font_paths: List[str], size: int) -> ImageFont.FreeTypeFont:
        """
        Get font with fallback options
        
        Args:
            font_paths (list): List of font paths to try
            size (int): Font size
            
        Returns:
            ImageFont.FreeTypeFont: Font object
        """
        for font_path in font_paths:
            try:
                if os.path.exists(font_path):
                    return ImageFont.truetype(font_path, size)
            except Exception as e:
                logger.warning(f"Could not load font {font_path}: {e}")
        
        # Fallback to default font
        try:
            return ImageFont.truetype("arial.ttf", size)
        except:
            return ImageFont.load_default()
    
    def wrap_text(self, text: str, font: ImageFont.FreeTypeFont, max_width: int) -> List[str]:
        """
        Wrap text to fit within specified width
        
        Args:
            text (str): Text to wrap
            font (ImageFont.FreeTypeFont): Font to use
            max_width (int): Maximum width in pixels
            
        Returns:
            List[str]: List of wrapped lines
        """
        words = text.split()
        lines = []
        current_line = ""
        
        for word in words:
            test_line = current_line + (" " if current_line else "") + word
            bbox = font.getbbox(test_line)
            text_width = bbox[2] - bbox[0]
            
            if text_width <= max_width:
                current_line = test_line
            else:
                if current_line:
                    lines.append(current_line)
                    current_line = word
                else:
                    # Single word is too long, force it
                    lines.append(word)
        
        if current_line:
            lines.append(current_line)
        
        return lines
    
    def draw_main_text(self, draw: ImageDraw.Draw, lines: List[str], font: ImageFont.FreeTypeFont, 
                      start_y: int, img_width: int, color: Tuple[int, int, int], 
                      line_height: int, line_spacing: int) -> None:
        """
        Draw wrapped main text, centered horizontally
        
        Args:
            draw (ImageDraw.Draw): Draw object
            lines (List[str]): Text lines to draw
            font (ImageFont.FreeTypeFont): Font to use
            start_y (int): Starting Y position
            img_width (int): Image width for centering
            color (Tuple[int, int, int]): Text color
            line_height (int): Height of each line
            line_spacing (int): Spacing between lines
        """
        current_y = start_y
        try:
            for line in lines:
                line_bbox = draw.textbbox((0, 0), line, font=font)
                line_width = line_bbox[2] - line_bbox[0]
                start_x = (img_width - line_width) // 2  # Centrage horizontal
                draw.text((start_x, current_y), line, fill=color, font=font)
                current_y += line_height + line_spacing
            logger.info(f"Drew {len(lines)} lines of main text starting at y={start_y}")
        except Exception as e:
            logger.error(f"Error in draw_main_text: {e}")
    
    def save_frame(self, frame_image: Image.Image) -> bool:
        """
        Save frame as persistent for future use
        
        Args:
            frame_image (Image.Image): Frame image to save
            
        Returns:
            bool: Success status
        """
        try:
            # Create cache directory if not exists
            os.makedirs("cache", exist_ok=True)
            
            # Convert to RGBA and save
            frame_rgba = frame_image.convert('RGBA')
            frame_rgba.save(self.frame_path, "PNG")
            
            logger.info(f"Frame saved persistently at {self.frame_path}")
            return True
            
        except Exception as e:
            logger.error(f"Error saving persistent frame: {e}")
            return False
    
    def load_frame(self) -> Optional[Image.Image]:
        """
        Load persistent frame if exists (priorité au frame intelligent)
        
        Returns:
            Image.Image or None: Loaded frame or None if not found
        """
        try:
            # 🎨 PRIORITÉ AU FRAME INTELLIGENT
            if os.path.exists(self.smart_frame_path):
                frame = Image.open(self.smart_frame_path).convert("RGBA")
                logger.info("Smart frame loaded successfully")
                return frame
            elif os.path.exists(self.frame_path):
                frame = Image.open(self.frame_path).convert("RGBA")
                logger.info("Persistent frame loaded successfully")
                return frame
            else:
                logger.info("No persistent frame found")
                return None
                
        except Exception as e:
            logger.error(f"Error loading persistent frame: {e}")
            return None
    
    def generate_smart_frame_for_article(self, article_data: Dict[str, Any]) -> Optional[Image.Image]:
        """
        🎨 SIMPLIFIÉ : Charger exactement le Frame.png existant sans modification
        
        Args:
            article_data (dict): Données de l'article (non utilisées pour le frame simple)
            
        Returns:
            Image.Image or None: Frame existant exactement comme il est
        """
        try:
            # Charger directement le Frame.png existant sans modification
            if os.path.exists(self.frame_path):
                frame = Image.open(self.frame_path).convert("RGBA")
                logger.info("✅ Frame.png existant chargé sans modification")
                return frame
            else:
                logger.warning("❌ Frame.png non trouvé")
                return None
            
        except Exception as e:
            logger.error(f"Erreur chargement Frame.png: {e}")
            return None
    
    def get_bullet_point_text(self, article_data: Dict[str, Any], bullet_point_text: str = None) -> str:
        """
        🎨 NOUVELLE MÉTHODE : Obtenir automatiquement le texte du bullet point
        
        Args:
            article_data (dict): Données de l'article
            bullet_point_text (str): Texte fourni manuellement (optionnel)
            
        Returns:
            str: Texte à utiliser pour le frame
        """
        if bullet_point_text and bullet_point_text.strip():
            return bullet_point_text.strip()
        
        # Utiliser automatiquement le premier bullet point généré
        bullet_points = article_data.get('bullet_points', [])
        if bullet_points and len(bullet_points) > 0:
            first_bp = bullet_points[0]
            if isinstance(first_bp, dict):
                return first_bp.get('text', '').strip()
            elif isinstance(first_bp, str):
                return first_bp.strip()
        
        # Fallback : utiliser le titre si pas de bullet points
        return article_data.get('title', 'Texte par défaut').strip()
    
    def apply_frame_with_text(self, base_image_path: str, bullet_point_text: str = None,
                             frame_image: Optional[Image.Image] = None,
                             output_path: str = None,
                             article_data: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Apply frame with text overlay to an image
        
        Args:
            base_image_path (str): Path to the base image
            bullet_point_text (str): Text to overlay on the frame (auto si None)
            frame_image (Image.Image, optional): Frame to overlay. If None, génère automatiquement
            output_path (str, optional): Output path. If None, overwrites original
            article_data (dict, optional): Données de l'article pour génération automatique
            
        Returns:
            dict: Result with status and details
        """
        try:
            # Load base image
            if not os.path.exists(base_image_path):
                raise FileNotFoundError(f"Base image not found: {base_image_path}")
            
            base_image = Image.open(base_image_path).convert('RGBA')
            target_size = base_image.size
            img_width, img_height = target_size
            
            logger.info(f"Processing image: {target_size}")
            
            # 🎨 GÉNÉRATION AUTOMATIQUE DU FRAME SI NÉCESSAIRE
            if frame_image is None:
                if article_data:
                    # Générer un frame intelligent basé sur l'article
                    frame_image = self.generate_smart_frame_for_article(article_data)
                
                if frame_image is None:
                    # Fallback : charger le frame persistant
                    frame_image = self.load_frame()
                
                if frame_image is None:
                    return {
                        "status": "error",
                        "message": "No frame provided and no persistent frame found",
                        "output_path": None
                    }
            
            # 🎨 OBTENTION AUTOMATIQUE DU TEXTE
            if article_data:
                bullet_point_text = self.get_bullet_point_text(article_data, bullet_point_text)
            
            if not bullet_point_text or not bullet_point_text.strip():
                bullet_point_text = "Texte automatique du bullet point"
            
            logger.info(f"📝 Texte utilisé: {bullet_point_text[:50]}...")
            
            # Resize frame to match image size
            frame_rgba = frame_image.convert('RGBA')
            if frame_rgba.size != target_size:
                logger.warning(f"Resizing frame from {frame_rgba.size} to {target_size}")
                frame_rgba = frame_rgba.resize(target_size, Image.LANCZOS)
            
            # Define text area parameters (32% du bas pour le texte)
            black_band_height_assumption = int(img_height * 0.32)
            text_area_top = img_height - black_band_height_assumption + 60
            text_area_height = black_band_height_assumption - 80
            side_margin = TEXT_SIDE_MARGIN
            max_text_width = img_width - (side_margin * 2)
            
            # Calculate available height for main text
            available_height_for_main_text = text_area_height - 60
            
            # Calculate main text size with adaptive sizing
            current_font_size = INITIAL_MAIN_FONT_SIZE
            final_lines = []
            text_fits = False
            main_font = None
            
            while current_font_size >= MIN_MAIN_FONT_SIZE:
                try:
                    main_font = self.get_font(self.preferred_fonts, current_font_size)
                    wrapped_lines = self.wrap_text(bullet_point_text.strip(), main_font, max_text_width)
                    
                    # Calculate total height needed
                    line_height_bbox = main_font.getbbox('Mg')
                    actual_line_height = line_height_bbox[3] - line_height_bbox[1]
                    total_height = len(wrapped_lines) * actual_line_height + max(0, len(wrapped_lines) - 1) * MAIN_TEXT_LINE_SPACING
                    
                    if total_height <= available_height_for_main_text:
                        final_lines = wrapped_lines
                        text_fits = True
                        logger.info(f"Text fits with font size {current_font_size}px, {len(wrapped_lines)} lines")
                        break
                    else:
                        current_font_size -= 5
                        
                except Exception as e:
                    logger.error(f"Error calculating text size: {e}")
                    current_font_size -= 5
            
            if not text_fits:
                logger.warning(f"Text may not fit properly, using minimum font size {MIN_MAIN_FONT_SIZE}px")
                main_font = self.get_font(self.preferred_fonts, MIN_MAIN_FONT_SIZE)
                final_lines = self.wrap_text(bullet_point_text.strip(), main_font, max_text_width)
            
            # Create text overlay
            text_overlay = Image.new('RGBA', target_size, (0, 0, 0, 0))
            text_draw = ImageDraw.Draw(text_overlay)
            
            # Calculate starting Y position to center text vertically in available area
            line_height_bbox = main_font.getbbox('Mg')
            actual_line_height = line_height_bbox[3] - line_height_bbox[1]
            total_text_height = len(final_lines) * actual_line_height + max(0, len(final_lines) - 1) * MAIN_TEXT_LINE_SPACING
            start_y = text_area_top + (available_height_for_main_text - total_text_height) // 2
            
            # Draw the text
            self.draw_main_text(
                text_draw, 
                final_lines, 
                main_font, 
                start_y, 
                img_width, 
                DEFAULT_TEXT_COLOR, 
                actual_line_height, 
                MAIN_TEXT_LINE_SPACING
            )
            
            # Compositing sequence (ordre important!)
            final_image = base_image                                                    # 1. Image de base
            final_image = Image.alpha_composite(final_image, frame_rgba)               # 2. + Frame
            final_image = Image.alpha_composite(final_image, text_overlay)             # 3. + Texte
            
            # Save result
            output_path = output_path or base_image_path
            final_image_rgb = final_image.convert('RGB')
            final_image_rgb.save(output_path, "JPEG", quality=95)
            
            logger.info(f"Frame with text applied successfully to {output_path}")
            
            return {
                "status": "success",
                "message": "Frame with text applied successfully",
                "output_path": output_path,
                "text_lines": len(final_lines),
                "font_size": current_font_size,
                "text_content": bullet_point_text[:50] + "..." if len(bullet_point_text) > 50 else bullet_point_text,
                "smart_frame_used": article_data is not None  # 🎨 INDICATEUR FRAME INTELLIGENT
            }
            
        except Exception as e:
            logger.error(f"Error applying frame with text: {e}")
            return {
                "status": "error",
                "message": str(e),
                "output_path": None
            }

# Global instance
frame_overlay = FrameOverlay()

def apply_frame_with_text(image_path: str, bullet_point_text: str = None, frame_image: Optional[Image.Image] = None, **kwargs) -> Dict[str, Any]:
    """
    Convenience function to apply frame with text to image
    """
    return frame_overlay.apply_frame_with_text(image_path, bullet_point_text, frame_image, **kwargs)

def save_frame(frame_image: Image.Image) -> bool:
    """
    Convenience function to save persistent frame
    """
    return frame_overlay.save_frame(frame_image)

def load_frame() -> Optional[Image.Image]:
    """
    Convenience function to load persistent frame
    """
    return frame_overlay.load_frame() 