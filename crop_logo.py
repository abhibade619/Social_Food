from PIL import Image
import os

source_path = r'C:/Users/abhib/.gemini/antigravity/brain/01b96fc7-dd42-49f2-8769-0bc4c7db5e25/uploaded_image_1766034410960.png'
dest_path = r'c:/Users/abhib/Food social/food-social/public/khrunch-logo.png'

try:
    img = Image.open(source_path)
    width, height = img.size
    print(f"Original size: {width}x{height}")
    
    # The image has 3 logos side by side. We want the middle one.
    # Assuming they are equally spaced.
    single_width = width // 3
    
    # Crop the middle section
    left = single_width
    right = single_width * 2
    top = 0
    bottom = height
    
    # Refine crop to remove whitespace if needed, but for now just split by 3
    # Actually, let's just take the middle one.
    cropped = img.crop((left, top, right, bottom))
    
    # Save
    cropped.save(dest_path)
    print(f"Saved to {dest_path}")
    
except Exception as e:
    print(f"Error: {e}")
