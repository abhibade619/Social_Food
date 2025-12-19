from PIL import Image
import numpy as np

def process_logo(input_path, output_path):
    print(f"Processing {input_path}...")
    try:
        img = Image.open(input_path)
        img = img.convert("RGBA")
        datas = img.getdata()
        
        newData = []
        # Checkerboard colors often used:
        # White: (255, 255, 255)
        # Light Gray: (204, 204, 204) or similar
        # Let's sample the corners to be sure
        width, height = img.size
        corners = [
            img.getpixel((0, 0)),
            img.getpixel((width-1, 0)),
            img.getpixel((0, height-1)),
            img.getpixel((width-1, height-1))
        ]
        print(f"Corner pixels: {corners}")
        
        # It seems the user uploaded a screenshot of a transparent png, so it has the checkerboard.
        # We need to make the checkerboard transparent.
        # A simple heuristic: if a pixel is white or the light gray of the checkerboard, make it transparent.
        # But we must be careful not to remove parts of the logo if they are the same color.
        # The logo is Orange and Dark Gray.
        
        # Let's try to detect the content bounding box first by excluding the background colors.
        # Assuming background is the checkerboard.
        
        # We can also just use a flood fill from the corners if the logo is contained?
        # No, the text might have holes.
        
        # Let's iterate and replace.
        # Common checkerboard gray is often around 204 (0xCC) or 238 (0xEE).
        
        # Let's look at the unique colors in the image to identify the checkerboard.
        # Or just use the corner colors as the "background" set.
        
        background_colors = set(corners)
        # Add common checkerboard variations just in case
        background_colors.add((255, 255, 255, 255)) # White
        background_colors.add((204, 204, 204, 255)) # Gray
        
        print(f"Treating these as background: {background_colors}")

        for item in datas:
            if item in background_colors:
                newData.append((255, 255, 255, 0))
            else:
                # Also check for "near" background colors (antialiasing edges of the checkerboard?)
                # For now, exact match.
                newData.append(item)

        img.putdata(newData)
        
        # Now crop to content
        bbox = img.getbbox()
        if bbox:
            print(f"Cropping to {bbox}")
            img = img.crop(bbox)
        else:
            print("No content found!")

        img.save(output_path, "PNG")
        print(f"Saved to {output_path}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    process_logo("public/khrunch-logo-v2.png", "public/khrunch-logo-transparent.png")
