import os
import base64
from PIL import Image, ImageDraw, ImageFont
import textwrap
from io import BytesIO
import hashlib
import re
import shutil
from openai import OpenAI
from core.text_processor import fix_unicode
from utils.image_utils import calculate_shadow, smart_wrap_text
from prompts.image_generation_prompt import get_image_generation_prompt_from_json
from utils.openai_utils import generate_image_prompt, generate_batch_image_prompts
import requests
import json
import time

def add_text_to_image(image, text):
    """Draw text onto an image."""
    draw = ImageDraw.Draw(image)
    try:
        font = ImageFont.truetype("fonts/Leelawadee Bold.ttf", 60)
    except IOError:
        font = ImageFont.load_default()

    wrapped_text = textwrap.fill(text, width=30)
    text_color = (255, 255, 255)
    shadow_color = (0, 0, 0)

    img_w, img_h = image.size
    text_bbox = draw.textbbox((0, 0), wrapped_text, font=font)
    text_w = text_bbox[2] - text_bbox[0]
    text_h = text_bbox[3] - text_bbox[1]
    
    x = (img_w - text_w) / 2
    y = img_h - text_h - 60  # Position near the bottom

    # Draw shadow
    draw.text((x+2, y+2), wrapped_text, font=font, fill=shadow_color)
    # Draw text
    draw.text((x, y), wrapped_text, font=font, fill=text_color)
    
    return image

def generate_images_for_bullet_points(bullet_points, article_text, output_dir="cache/img/"):
    """
    Generate images for all bullet points in a batch
    
    Args:
        bullet_points (list): List of bullet point texts
        article_text (str): The full article text for context
        output_dir (str): Directory to save the generated images
        
    Returns:
        list: List of paths to the generated images
    """
    os.makedirs(output_dir, exist_ok=True)
    image_paths = []
    
    try:
        # Generate all image prompts in one batch API call
        print(f"Generating image prompts for {len(bullet_points)} bullet points...")
        image_prompts_data = generate_batch_image_prompts(bullet_points, article_text)
        
        # Process each image prompt
        for i, prompt_data in enumerate(image_prompts_data):
            bullet_point = prompt_data["bullet_point"]
            image_prompt = prompt_data["image_prompt"]
            keywords = prompt_data.get("keywords", [])
            
            print(f"Generating image {i+1}/{len(bullet_points)}: {bullet_point[:30]}...")
            
            # Create a sequential filename with zero-padding for easier tracking
            output_file = os.path.join(output_dir, f"point_{i+1:02d}.jpg")
            
            # Generate the image using the optimized prompt
            try:
                print(f"Generating image with prompt: {image_prompt[:100]}...")
                generate_image_with_prompt(image_prompt, output_file)
                if os.path.exists(output_file):
                    print(f"Successfully generated image: {output_file}")
                    image_paths.append(output_file)
                else:
                    print(f"Image generation failed - file not created: {output_file}")
                    raise Exception("Image file not created")
            except Exception as e:
                print(f"Error generating image for bullet point {i+1}: {e}")
                # Create fallback image with consistent naming
                fallback_file = os.path.join(output_dir, f"point_{i+1:02d}.jpg")
                create_fallback_image(bullet_point, output_dir, fallback_file)
                image_paths.append(fallback_file)
    
    except Exception as e:
        print(f"Error in batch image generation: {e}")
        # Create fallback images for all bullet points
        for i, bullet_point in enumerate(bullet_points):
            fallback_file = os.path.join(output_dir, f"point_{i+1:02d}.jpg")
            create_fallback_image(bullet_point, output_dir, fallback_file)
            image_paths.append(fallback_file)
    
    return image_paths

def generate_image_from_json(article_id, output_dir="cache/img/"):
    """
    Generate image for article using data from JSON file
    
    Args:
        article_id (int): The article ID to load from JSON
        output_dir (str): Directory to save the generated image
        
    Returns:
        str: Path to the generated image
    """
    os.makedirs(output_dir, exist_ok=True)
    
    try:
        # Get image generation prompt from JSON data
        print(f"Loading article {article_id} from JSON for image generation...")
        prompt_data = get_image_generation_prompt_from_json(article_id)
        
        if not prompt_data:
            print(f"No data found for article {article_id}")
            return None
        
        # Load the bullet point from JSON for fallback
        json_file_path = "cache/articles_data.json"
        bullet_point = ""
        if os.path.exists(json_file_path):
            try:
                with open(json_file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    article_data = data.get(str(article_id), {})
                    bullet_point = article_data.get("bullet_point", "")
            except Exception as e:
                print(f"Error loading bullet point from JSON: {e}")
        
        # Generate image prompt using OpenAI
        print(f"Generating image prompt for article {article_id}...")
        try:
            client = OpenAI()
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=prompt_data["messages"],
                temperature=0.7,
                max_tokens=500
            )
            
            image_prompt = response.choices[0].message.content
            print(f"Generated image prompt: {image_prompt[:200]}...")
            
        except Exception as e:
            print(f"Error generating image prompt: {e}")
            # Use a simple fallback prompt
            image_prompt = f"Professional editorial photograph related to: {bullet_point}"
        
        # Create output file
        output_file = os.path.join(output_dir, f"point_01.jpg")
        
        # Generate the image
        try:
            print(f"Generating image for article {article_id}...")
            generate_image_with_prompt(image_prompt, output_file)
            
            if os.path.exists(output_file):
                print(f"Successfully generated image: {output_file}")
                return output_file
            else:
                print(f"Image generation failed - file not created")
                raise Exception("Image file not created")
                
        except Exception as e:
            print(f"Error generating image: {e}")
            # Create fallback image
            create_fallback_image(bullet_point, output_dir, output_file)
            return output_file
    
    except Exception as e:
        print(f"Error in JSON-based image generation: {e}")
        return None

def generate_image_with_prompt(prompt, output_file, overlay_text=None):
    """
    Generate an image using OpenAI's DALL-E model with a specific prompt
    
    Args:
        prompt (str): The detailed image prompt 
        output_file (str): Path to save the generated image
        overlay_text (str, optional): Text to draw on the image. Defaults to None.
        
    Returns:
        None
    """
    # Ensure we're using the standardized naming convention
    # Extract the bullet point ID if present in the path
    import re
    match = re.search(r'(\d+)\.jpg$', output_file)
    if match:
        bp_id = int(match.group(1))
        # Force the correct naming convention
        dirname = os.path.dirname(output_file)
        output_file = os.path.join(dirname, f"point_{bp_id:02d}.jpg")
        print(f"Standardized output filename to: {output_file}")
    print(f"Generating image with prompt: {prompt[:10000]}...")

    try:
        # Initialize OpenAI client. It will automatically use the OPENAI_API_KEY from the environment.
        client = OpenAI()
        
        # Use a try-except block specifically for the API call
        try:
            # Call OpenAI's image generation with gpt-image-1 model
            response = client.images.generate(
                model="gpt-image-1",
                prompt=prompt,
                n=1,
                size="1024x1024"
            )
            
            print("API call completed successfully")
            
            # Debug: Print the actual response structure
            print(f"Response type: {type(response)}")
            print(f"Response data: {response.data if hasattr(response, 'data') else 'No data attribute'}")
            if hasattr(response, 'data') and response.data:
                print(f"First data item type: {type(response.data[0])}")
                print(f"First data item attributes: {dir(response.data[0])}")
                print(f"First data item: {response.data[0]}")
            
            # Check if the response contains valid data
            if not response.data:
                print("Error: API response missing data")
                raise ValueError("Invalid response from OpenAI API - missing data")
            
            # Check for different possible response formats
            first_item = response.data[0]
            if hasattr(first_item, 'url') and first_item.url:
                image_url = first_item.url
                print(f"Found URL: {image_url}")
            elif hasattr(first_item, 'b64_json') and first_item.b64_json:
                print("Found base64 data instead of URL")
                # Handle base64 data
                image_bytes = base64.b64decode(first_item.b64_json)
                print(f"Decoded {len(image_bytes)} bytes of image data")
                img = Image.open(BytesIO(image_bytes))
                print(f"Successfully opened image: {img.format}, {img.size}")
            else:
                print("Error: API response missing both URL and base64 data")
                raise ValueError("Invalid response from OpenAI API - missing image data")
            
            # Handle the response based on what we found
            if hasattr(first_item, 'url') and first_item.url:
                # Download image from URL
                print(f"Downloading image from URL: {image_url}")
                
                response_img = requests.get(image_url)
                if response_img.status_code != 200:
                    raise ValueError(f"Failed to download image: HTTP {response_img.status_code}")
                
                image_bytes = response_img.content
                print(f"Downloaded {len(image_bytes)} bytes of image data")
                
                # Create PIL Image from bytes
                try:
                    img = Image.open(BytesIO(image_bytes))
                    print(f"Successfully opened image: {img.format}, {img.size}")
                except Exception as img_open_error:
                    print(f"Error opening image from bytes: {img_open_error}")
                    raise ValueError(f"Failed to create image from API response: {img_open_error}")
            
            # If we already processed base64 data above, img is already created
            
            # Create a new image with desired dimensions (landscape format for social media)
            target_width = 1920
            target_height = 1080

            # Calculate dimensions to maintain aspect ratio
            original_aspect = img.width / img.height
            target_aspect = target_width / target_height

            if original_aspect > target_aspect:
                # Original image is wider than target
                new_width = int(target_height * original_aspect)
                new_height = target_height
                img = img.resize((new_width, new_height))
                left = (new_width - target_width) // 2
                img = img.crop((left, 0, left + target_width, target_height))
            else:
                # Original image is taller than target
                new_height = int(target_width / original_aspect)
                new_width = target_width
                img = img.resize((new_width, new_height))
                top = (new_height - target_height) // 2
                img = img.crop((0, top, target_width, top + target_height))

            print(f"Resized image to {target_width}x{target_height}")
            
            # Convert back to bytes
            img_byte_arr = BytesIO()
            img.save(img_byte_arr, format='JPEG')
            
            # Make sure the output directory exists
            os.makedirs(os.path.dirname(os.path.abspath(output_file)), exist_ok=True)

            # Write the image to file
            try:
                with open(output_file, 'wb') as f:
                    f.write(img_byte_arr.getvalue())
                print(f"Image saved to {output_file}")
                
                # Verify that the file was created and is a valid image
                if os.path.exists(output_file):
                    with Image.open(output_file) as verify_img:
                        # Just checking that we can open it
                        img_size = verify_img.size
                        print(f"Verified saved image: {verify_img.format}, {img_size}")
                else:
                    print(f"Warning: File {output_file} was not created")
                    raise IOError(f"File not created: {output_file}")
                    
            except Exception as save_error:
                print(f"Error saving image: {save_error}")
                raise IOError(f"Failed to save image to {output_file}: {save_error}")
                
            if overlay_text:
                img = add_text_to_image(img, overlay_text)
                
            # FINAL CHECK: Look for any generated images with the old naming convention and rename them
            cache_dir = os.path.dirname(output_file)
            # Extract the bullet point ID from our target filename
            match = re.search(r'point_(\d+)\.jpg$', output_file)
            if match:
                bp_id = match.group(1)
                # Check for the old naming convention file
                old_format_file = os.path.join(cache_dir, f"generated_slide_{int(bp_id)}.jpg")
                if os.path.exists(old_format_file) and old_format_file != output_file:
                    print(f"Found image with old naming convention: {old_format_file}")
                    try:
                        # If the correct file doesn't exist yet, copy the old one
                        if not os.path.exists(output_file):
                            import shutil
                            shutil.copy(old_format_file, output_file)
                            print(f"Renamed {old_format_file} to {output_file}")
                        # Delete the old file
                        os.remove(old_format_file)
                        print(f"Removed old file: {old_format_file}")
                    except Exception as rename_error:
                        print(f"Error renaming file: {rename_error}")
                
        except Exception as api_error:
            print(f"OpenAI API error: {api_error}")
            raise ValueError(f"OpenAI API error: {api_error}")
        
    except Exception as e:
        print(f"Error generating image: {str(e)}")
        raise e

def create_fallback_image(text, output_dir, fallback_file=None):
    """
    Create a fallback image with the given text
    
    Args:
        text (str): The text to display on the fallback image
        output_dir (str): Directory to save the fallback image
        fallback_file (str, optional): Specific filename to use. If None, generates one.
        
    Returns:
        str: Path to the created fallback image
    """
    text = fix_unicode(text)
    
    if fallback_file is None:
        text_hash = hashlib.md5(text.encode()).hexdigest()[:10]
        fallback_file = os.path.join(output_dir, f"fallback_{text_hash}.jpg")
    
    try:
        fallback_img = Image.new('RGB', (1920, 1080), color=(50, 50, 50))
        draw = ImageDraw.Draw(fallback_img)
        
        try:
            # First try with our custom font
            font = ImageFont.truetype("fonts/Leelawadee Bold.ttf", 40)
        except Exception as font_error:
            print(f"Error loading custom font: {font_error}, using default font")
            # Fall back to default font
            font = ImageFont.load_default()
            
        wrapped_text = textwrap.fill(text, width=30)
        text_color = (255, 255, 255)
        
        # Calculate text position to center it
        text_bbox = draw.textbbox((0, 0), wrapped_text, font=font)
        text_width = text_bbox[2] - text_bbox[0]
        text_height = text_bbox[3] - text_bbox[1]
        position = ((1920 - text_width) // 2, (1080 - text_height) // 2)
        
        # Draw the text
        draw.text(position, wrapped_text, font=font, fill=text_color)
        
        # Save the fallback image
        fallback_img.save(fallback_file)
        print(f"Created fallback image: {fallback_file}")
        
        return fallback_file
    except Exception as fallback_error:
        print(f"Critical error creating fallback image: {fallback_error}")
        # Last resort: try one more time with absolute minimal approach
        try:
            print("Attempting emergency fallback image creation...")
            simple_img = Image.new('RGB', (1920, 1080), color=(0, 0, 0))
            simple_img.save(fallback_file)
            return fallback_file
        except:
            print("CRITICAL FAILURE: Could not create even a simple fallback image")
            # Return the path anyway, let the caller handle missing file
            return fallback_file

def generate_image(text, output_file, overlay_text=None):
    """
    High-level function to generate an image from text.
    It now uses a prompt generation model to create a detailed prompt.
    
    Args:
        text (str): The input text (e.g., a bullet point)
        output_file (str): Path to save the generated image
        overlay_text (str, optional): Text to draw on the image. Defaults to None.
    """
    # Ensure we're using the standardized naming convention
    # Extract the bullet point ID if present in the path
    import re
    match = re.search(r'(\d+)\.jpg$', output_file)
    if match:
        bp_id = int(match.group(1))
        # Force the correct naming convention
        dirname = os.path.dirname(output_file)
        output_file = os.path.join(dirname, f"point_{bp_id:02d}.jpg")
        print(f"Standardized output filename to: {output_file}")
    try:
        print(f"Generating image prompt for: {text[:100]}...")
        # Use the full text as both headline and context for better prompts
        prompt = generate_image_prompt(text, text)
        
        # Generate the image using the prompt
        generate_image_with_prompt(prompt, output_file, overlay_text)
        
    except Exception as e:
        print(f"Error in generate_image: {str(e)}, creating fallback image...")
        # Create a fallback image with the overlay text or the base text
        fallback_text = overlay_text or text
        fallback_file = create_fallback_image(fallback_text, os.path.dirname(output_file))
        
        # Copy fallback to the expected output path if it's different
        if fallback_file != output_file:
            try:
                shutil.copy(fallback_file, output_file)
            except Exception as copy_error:
                print(f"Error copying fallback image: {copy_error}")

def generate_image_for_text(text, output_file=None, article_text=None, index=None, force_regenerate=False):
    """
    Generate an image for the given text and return the path to the created image
    
    Args:
        text (str): The text to generate an image for
        output_file (str, optional): Specific output file path. If None, one will be generated.
        article_text (str, optional): Additional context for image generation
        index (int, optional): Index number for the image (for ordering)
        force_regenerate (bool): If True, regenerate the image even if it exists
        
    Returns:
        str: Path to the generated image
    """
    try:
        # Ensure cache directory exists
        os.makedirs("cache/img/", exist_ok=True)
        
        # If output_file is not specified, create one based on index or hash
        if output_file is None:
            if index is not None:
                # Use zero-padded numbering for consistency
                output_file = f"cache/img/point_{index:02d}.jpg"
            else:
                # Create a unique filename based on the hash of the text
                text_hash = hashlib.md5(text.encode()).hexdigest()[:10]
                output_file = f"cache/img/{text_hash}.jpg"
        
        print(f"Output file will be: {output_file}")
        
        # Check if the image already exists to avoid regenerating
        if not force_regenerate and os.path.exists(output_file):
            print(f"Using cached image: {output_file}")
            # Verify the file is a valid image
            try:
                with Image.open(output_file) as img:
                    # Just checking if we can open it
                    img_format = img.format
                    img_size = img.size
                    if img_size[0] < 100 or img_size[1] < 100:
                        print(f"Cached image is too small ({img_size}), regenerating...")
                        # Force regeneration
                        force_regenerate = True
                    else:
                        print(f"Verified cached image: {img_format}, {img_size}")
                        return output_file
            except Exception as img_error:
                print(f"Error verifying cached image: {img_error}, regenerating...")
                force_regenerate = True
        
        # If force_regenerate is True or the file doesn't exist or is invalid, generate a new image
        if force_regenerate or not os.path.exists(output_file):
            print(f"Generating new image for text: {text[:50]}...")
            
            try:
                # Try to generate image with OpenAI
                generate_image(text, output_file)
                
                # Verify the image was created and is valid
                if os.path.exists(output_file):
                    try:
                        with Image.open(output_file) as img:
                            # Check if the image is valid
                            img_format = img.format
                            img_size = img.size
                            print(f"Successfully generated image: {output_file} ({img_format}, {img_size})")
                            return output_file
                    except Exception as img_verify_error:
                        print(f"Error verifying generated image: {img_verify_error}, creating fallback...")
                        raise Exception(f"Invalid image generated: {img_verify_error}")
                else:
                    raise FileNotFoundError(f"Image generation failed - file not created: {output_file}")
            except Exception as gen_error:
                print(f"Error in image generation: {str(gen_error)}, creating fallback image...")
                # Let it continue to the fallback
                raise gen_error
    except Exception as e:
        print(f"Error in generate_image_for_text: {str(e)}")
        # Create a fallback image
        if index is not None:
            fallback_file = f"cache/img/point_{index:02d}.jpg"
            return create_fallback_image(text, "cache/img/", fallback_file)
        else:
            return create_fallback_image(text, "cache/img/")
            
    # FINAL CHECK: Look for any generated images with the old naming convention and rename them
    if index is not None:
        cache_dir = "cache/img/"
        # Check for the old naming convention file
        old_format_file = os.path.join(cache_dir, f"generated_slide_{index}.jpg")
        correct_file = os.path.join(cache_dir, f"point_{index:02d}.jpg")
        
        if os.path.exists(old_format_file):
            print(f"Found image with old naming convention: {old_format_file}")
            try:
                # If the correct file doesn't exist yet, copy the old one
                if not os.path.exists(correct_file):
                    import shutil
                    shutil.copy(old_format_file, correct_file)
                    print(f"Renamed {old_format_file} to {correct_file}")
                # Delete the old file
                os.remove(old_format_file)
                print(f"Removed old file: {old_format_file}")
                # Return the path to the correctly named file
                return correct_file
            except Exception as rename_error:
                print(f"Error renaming file: {rename_error}")
    
    return output_file 