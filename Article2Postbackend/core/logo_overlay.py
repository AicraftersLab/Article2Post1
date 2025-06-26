#!/usr/bin/env python3
"""
Logo Overlay Module
Handles adding brand logos to generated images for social media posts
"""

import os
import logging
from PIL import Image
from typing import Optional, Tuple, Dict, Any
from .frame_overlay import frame_overlay  # 👈 NOUVEAU IMPORT

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LogoOverlay:
    """Handle logo overlay operations on images"""
    
    def __init__(self):
        self.persistent_logo_path = "cache/persistent_logo.png"
        self.default_logo_size = (150, 70)
        self.default_position = "top_right"  # top_right, top_left, bottom_right, bottom_left, center
        
    def save_persistent_logo(self, logo_image: Image.Image) -> bool:
        """
        Save logo as persistent for future use
        
        Args:
            logo_image (Image.Image): Logo image to save
            
        Returns:
            bool: Success status
        """
        try:
            # Create cache directory if not exists
            os.makedirs("cache", exist_ok=True)
            
            # Convert to RGBA and save
            logo_rgba = logo_image.convert('RGBA')
            logo_rgba.save(self.persistent_logo_path, "PNG")
            
            logger.info(f"Logo saved persistently at {self.persistent_logo_path}")
            return True
            
        except Exception as e:
            logger.error(f"Error saving persistent logo: {e}")
            return False
    
    def load_persistent_logo(self) -> Optional[Image.Image]:
        """
        Load persistent logo if exists
        
        Returns:
            Image.Image or None: Loaded logo or None if not found
        """
        try:
            if os.path.exists(self.persistent_logo_path):
                logo = Image.open(self.persistent_logo_path).convert("RGBA")
                logger.info("Persistent logo loaded successfully")
                return logo
            else:
                logger.info("No persistent logo found")
                return None
                
        except Exception as e:
            logger.error(f"Error loading persistent logo: {e}")
            return None
    
    def calculate_logo_position(self, image_size: Tuple[int, int], logo_size: Tuple[int, int], 
                               position: str = "top_right", offset: Tuple[int, int] = (30, 30)) -> Tuple[int, int]:
        """
        Calculate logo position based on image size and desired position
        
        Args:
            image_size (tuple): (width, height) of base image
            logo_size (tuple): (width, height) of logo
            position (str): Position preference
            offset (tuple): Offset from edges
            
        Returns:
            tuple: (x, y) coordinates for logo placement
        """
        img_width, img_height = image_size
        logo_width, logo_height = logo_size
        offset_x, offset_y = offset
        
        positions = {
            "top_right": (img_width - logo_width - offset_x, 30),  # 👈 Position Y fixe à 30px du haut
            "top_left": (offset_x, 30),  # 👈 Position Y fixe à 30px du haut
            "bottom_right": (img_width - logo_width - offset_x, img_height - logo_height - offset_y),
            "bottom_left": (offset_x, img_height - logo_height - offset_y),
            "center": ((img_width - logo_width) // 2, (img_height - logo_height) // 2),
            "center_custom": ((img_width - logo_width + 760) // 2, 30)  # 👈 Position inspirée de votre code
        }
        
        return positions.get(position, positions["top_right"])
    
    def add_logo_to_image(self, base_image_path: str, logo_image: Optional[Image.Image] = None,
                         output_path: str = None, logo_size: Tuple[int, int] = None,
                         position: str = "top_right", offset: Tuple[int, int] = (30, 30)) -> Dict[str, Any]:
        """
        Add logo overlay to an image
        
        Args:
            base_image_path (str): Path to the base image
            logo_image (Image.Image, optional): Logo to overlay. If None, loads persistent logo
            output_path (str, optional): Output path. If None, overwrites original
            logo_size (tuple, optional): Logo size. If None, uses default
            position (str): Logo position
            offset (tuple): Offset from edges
            
        Returns:
            dict: Result with status and details
        """
        try:
            # Load base image
            if not os.path.exists(base_image_path):
                raise FileNotFoundError(f"Base image not found: {base_image_path}")
            
            base_image = Image.open(base_image_path).convert('RGBA')
            img_width, img_height = base_image.size
            
            # Get logo
            if logo_image is None:
                logo_image = self.load_persistent_logo()
                if logo_image is None:
                    return {
                        "status": "error",
                        "message": "No logo provided and no persistent logo found",
                        "output_path": None
                    }
            
            # Prepare logo
            logo_rgba = logo_image.convert('RGBA') if logo_image.mode != 'RGBA' else logo_image
            
            # Use fixed logo size inspired by your code: 150x70 pixels
            FIXED_LOGO_SIZE = (150, 70)  # 👈 TAILLE FINALE DU LOGO : 150x70 pixels
            
            if logo_size is None:
                logo_size = FIXED_LOGO_SIZE  # Use fixed size by default
            
            # Always resize logo to specified size with high quality
            logo_resized = logo_rgba.resize(logo_size, Image.LANCZOS)  # 👈 REDIMENSIONNEMENT haute qualité
            
            # Calculate position
            logo_x, logo_y = self.calculate_logo_position(
                (img_width, img_height), logo_size, position, offset
            )
            
            # Create logo overlay
            logo_overlay = Image.new('RGBA', (img_width, img_height), (0, 0, 0, 0))
            logo_overlay.paste(logo_resized, (logo_x, logo_y), logo_resized)
            
            # Composite final image
            final_image = Image.alpha_composite(base_image, logo_overlay)
            
            # Save result
            output_path = output_path or base_image_path
            final_image_rgb = final_image.convert('RGB')
            final_image_rgb.save(output_path, "JPEG", quality=95)
            
            logger.info(f"Logo overlay applied successfully to {output_path}")
            
            return {
                "status": "success",
                "message": "Logo overlay applied successfully",
                "output_path": output_path,
                "logo_position": (logo_x, logo_y),
                "logo_size": logo_size
            }
            
        except Exception as e:
            logger.error(f"Error adding logo overlay: {e}")
            return {
                "status": "error",
                "message": str(e),
                "output_path": None
            }
    
    def batch_add_logo(self, image_paths: list, logo_image: Optional[Image.Image] = None,
                      **kwargs) -> Dict[str, Any]:
        """
        Add logo to multiple images
        
        Args:
            image_paths (list): List of image paths
            logo_image (Image.Image, optional): Logo to use
            **kwargs: Additional arguments for add_logo_to_image
            
        Returns:
            dict: Batch processing results
        """
        results = []
        success_count = 0
        
        for image_path in image_paths:
            result = self.add_logo_to_image(image_path, logo_image, **kwargs)
            results.append({
                "image_path": image_path,
                "result": result
            })
            
            if result["status"] == "success":
                success_count += 1
        
        return {
            "total_processed": len(image_paths),
            "success_count": success_count,
            "failure_count": len(image_paths) - success_count,
            "results": results
        }

    def apply_logo_and_frame(self, base_image_path: str, bullet_point_text: str = None,
                            logo_image: Optional[Image.Image] = None,
                            frame_image: Optional[Image.Image] = None,
                            output_path: str = None,
                            logo_size: Tuple[int, int] = None,
                            position: str = "top_right",
                            article_data: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Apply both frame with text and logo to an image in one operation
        
        Args:
            base_image_path (str): Path to the base image
            bullet_point_text (str): Text to overlay on the frame (auto si None)
            logo_image (Image.Image, optional): Logo to overlay
            frame_image (Image.Image, optional): Frame to overlay
            output_path (str, optional): Output path. If None, overwrites original
            logo_size (tuple, optional): Logo size. If None, uses default (150, 70)
            position (str): Logo position
            article_data (dict, optional): Données de l'article pour génération automatique
            
        Returns:
            dict: Combined result with status and details
        """
        try:
            # Étape 1: Appliquer le frame avec le texte (AVEC INTELLIGENCE)
            logger.info("Step 1: Applying intelligent frame with text...")
            frame_result = frame_overlay.apply_frame_with_text(
                base_image_path, 
                bullet_point_text, 
                frame_image, 
                output_path,
                article_data=article_data  # 🎨 PASSER LES DONNÉES DE L'ARTICLE
            )
            
            if frame_result["status"] != "success":
                return {
                    "status": "error",
                    "message": f"Frame application failed: {frame_result['message']}",
                    "frame_result": frame_result,
                    "logo_result": None
                }
            
            # Étape 2: Appliquer le logo sur l'image avec frame
            logger.info("Step 2: Applying logo on top of intelligent frame...")
            logo_result = self.add_logo_to_image(
                frame_result["output_path"],
                logo_image,
                output_path,
                logo_size,
                position
            )
            
            if logo_result["status"] != "success":
                return {
                    "status": "error", 
                    "message": f"Logo application failed: {logo_result['message']}",
                    "frame_result": frame_result,
                    "logo_result": logo_result
                }
            
            logger.info("✅ Intelligent Frame + Logo application completed successfully!")
            
            return {
                "status": "success",
                "message": "Intelligent frame with text and logo applied successfully",
                "output_path": logo_result["output_path"],
                "frame_result": frame_result,
                "logo_result": logo_result,
                "text_content": frame_result.get("text_content"),
                "logo_position": logo_result.get("logo_position"),
                "logo_size": logo_result.get("logo_size"),
                "smart_frame_used": frame_result.get("smart_frame_used", False)  # 🎨 NOUVEAU
            }
            
        except Exception as e:
            logger.error(f"Error in combined intelligent frame + logo application: {e}")
            return {
                "status": "error",
                "message": str(e),
                "frame_result": None,
                "logo_result": None
            }

# Global instance
logo_overlay = LogoOverlay()

def add_logo_to_image(image_path: str, logo_image: Optional[Image.Image] = None, **kwargs) -> Dict[str, Any]:
    """
    Convenience function to add logo to image
    """
    return logo_overlay.add_logo_to_image(image_path, logo_image, **kwargs)

def save_logo(logo_image: Image.Image) -> bool:
    """
    Convenience function to save persistent logo
    """
    return logo_overlay.save_persistent_logo(logo_image)

def load_logo() -> Optional[Image.Image]:
    """
    Convenience function to load persistent logo
    """
    return logo_overlay.load_persistent_logo() 