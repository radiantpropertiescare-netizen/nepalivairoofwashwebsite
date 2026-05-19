import glob
import os

files = glob.glob('*.html')

for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Avoid duplicates
    if 'colour-preview.html' in content and f != 'colour-preview.html':
        continue
    
    desktop_target = 'href="services.html">Services</a>\n'
    desktop_link = '                <a class="font-headline font-bold text-base text-[#5d6b82] hover:text-[#5d6b82] transition-colors"\n                    href="colour-preview.html">Colour Preview</a>\n'
    
    if desktop_target in content:
        content = content.replace(desktop_target, desktop_target + desktop_link)

    # Note: Mobile target has a different class, but both use href="services.html"
    # Actually, in the mobile menu, it looks like:
    # href="services.html">Services</a>\n
    # Wait, the mobile link target looks like:
    # <a class="font-headline font-bold text-2xl text-[#5d6b82] hover:text-[#5d6b82] py-4 border-b border-surface-variant"\n                href="services.html">Services</a>\n
    # So finding href="services.html">Services</a>\n will catch BOTH desktop and mobile. Let's check how many times it gets replaced.
    # We want to use the mobile_link for the second replacement. Or wait, the regex approach is better.

import re

for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Avoid duplicates
    if 'colour-preview.html' in content and f != 'colour-preview.html':
        continue

    # Find all occurrences of the Services link
    # Pattern: <a class="..."\s*href="services.html">Services</a>
    matches = list(re.finditer(r'(<a class="([^"]*)"\s*href="services.html">Services</a>\n)', content))
    
    new_content = content
    # We iterate backwards to not mess up indices
    for match in reversed(matches):
        full_match = match.group(1)
        classes = match.group(2)
        
        # We construct a new link with the exact same classes but pointing to colour-preview.html
        new_link = f'                <a class="{classes}"\n                    href="colour-preview.html">Colour Preview</a>\n'
        
        # Replace
        new_content = new_content[:match.end()] + new_link + new_content[match.end():]
        
    with open(f, 'w', encoding='utf-8') as file:
        file.write(new_content)

print('Updated all files.')
