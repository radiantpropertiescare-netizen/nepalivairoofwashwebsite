import re

with open('colour-preview-raw.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update selectSwatch script
old_script = """function selectSwatch(sectionId, swatchElement, colorHex, imageUrl) {
            // Update preview image
            const previewImage = document.getElementById(sectionId + '-preview');
            if (previewImage && imageUrl) {
                // In a real app, this would load the actual coloured roof image.
                // We'll simulate by adding a subtle tint filter to the image for demonstration if imageUrl isn't provided,
                // or just leave it as is since we don't have separate images.
            }"""

new_script = """function selectSwatch(sectionId, swatchElement, colorHex, imageUrl) {
            // Update preview image
            const previewImage = document.getElementById(sectionId + '-preview');
            if (previewImage && imageUrl) {
                previewImage.src = imageUrl;
            }"""

content = content.replace(old_script, new_script)

# 2. Add imageUrl to all swatches.
concrete_colors = {
    "Monument": "Monument.jpg",
    "Charcoal": "Charcoal.jpg",
    "Dark Grey": "Dark Grey.jpg",
    "Slate Grey": "Slate Grey.jpg",
    "Woodland Grey": "Woodland Grey.jpg",
    "Basalt": "Basalt.jpg",
    "Ironstone": "Ironstone.jpg",
    "Surfmist": "Surfmist.jpg",
    "Shale Grey": "Shale Grey.jpg",
    "Dune": "Dune.jpg",
    "Deep Ocean": "Deep Ocean.jpg",
    "Manor Red": "Manor Red.jpg",
    "Classic Red": "Classic Red.jpg",
    "Earth Brown": "Earth Brown.jpg",
    "Terracotta Red": "Terrcota Red.jpg",
}

colorbond_colors = {
    "Monument": "Monument.jpg",
    "Woodland Grey": "Woodland Grey.jpg",
    "Surfmist": "Surfmist.jpg",
    "Shale Grey": "Shale Grey.jpg",
    "Basalt": "Basalt.jpg",
    "Dune": "Dune.jpg",
    "Deep Ocean": "Deep Ocean.jpg",
    "Ironstone": "Ironstone.jpg",
    "Manor Red": "Manor Red.jpg",
    "Night Sky": "Nightsky.jpg",
    "Windspray": "Windspray.jpg",
    "Jasper": "Jasper.jpg",
    "Gully": "Gully.jpg",
    "Wallaby": "Wallaby.jpg",
    "Dover White": "Dover white.jpg",
}

terracotta_colors = {
    "Natural Terracotta": "Natural Terracota.jpg",
    "Classic Clay": "Classic Clay.jpg",
    "Aged Terracotta": "Aged Terracota.jpg",
    "Deep Terracotta": "Deep Terracota.jpg",
    "Heritage Red": "Heritage Red.jpg",
    "Earth Brown": "Earth Brown.jpg",
    "Burnt Orange": "Burnt Orange.jpg",
    "Rustic Red": "Rustic Red.jpg",
    "Antique Red": "Antique Red.jpg",
    "Warm Brown": "Warm brown.jpg",
}

def replace_swatch(match):
    section_id = match.group(1)
    color_hex = match.group(2)
    inner_html = match.group(3)
    
    label_match = re.search(r'>([^<]+)</span>', inner_html)
    label_text = label_match.group(1).strip() if label_match else ""
    
    img_url = ""
    if section_id == "concrete-section":
        filename = concrete_colors.get(label_text, "")
        if filename:
            img_url = f"Images/Colorpreview/Concrete%20JPG/{filename.replace(' ', '%20')}"
    elif section_id == "colorbond-section":
        filename = colorbond_colors.get(label_text, "")
        if filename:
            img_url = f"Images/Colorpreview/Colorbonde%20JPG/{filename.replace(' ', '%20')}"
    elif section_id == "terracotta-section":
        filename = terracotta_colors.get(label_text, "")
        if filename:
            img_url = f"Images/Colorpreview/Terracota%20JPG/{filename.replace(' ', '%20')}"
            
    if img_url:
        return f"onclick=\"selectSwatch('{section_id}', this, '{color_hex}', '{img_url}')\">\n{inner_html}"
    return match.group(0)

pattern = r"onclick=\"selectSwatch\('([^']+)',\s*this,\s*'([^']+)'\)\">\n(.*?(?:</span>|<\/div>).*?</span>)"
content = re.sub(pattern, replace_swatch, content, flags=re.DOTALL)

# 3. Update the default image src
concrete_img_pattern = r'(id="concrete-section-preview"[^>]*src=")[^"]+(")'
content = re.sub(concrete_img_pattern, r'\g<1>' + "Images/Colorpreview/Concrete%20JPG/Monument.jpg" + r'\g<2>', content)

colorbond_img_pattern = r'(id="colorbond-section-preview"[^>]*src=")[^"]+(")'
content = re.sub(colorbond_img_pattern, r'\g<1>' + "Images/Colorpreview/Colorbonde%20JPG/Monument.jpg" + r'\g<2>', content)

terracotta_img_pattern = r'(id="terracotta-section-preview"[^>]*src=")[^"]+(")'
content = re.sub(terracotta_img_pattern, r'\g<1>' + "Images/Colorpreview/Terracota%20JPG/Natural%20Terracota.jpg" + r'\g<2>', content)

with open('colour-preview-raw.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated colour-preview-raw.html successfully!")
