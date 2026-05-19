import re

with open('colour-preview.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix button classes
bad_button_class = 'bg-[#e52920] text-white px-8 py-4 rounded-xl font-headline font-bold text-lg tracking-wide hover:bg-[#c00007] transition-all shadow-md text-on-primary font-label uppercase tracking-label font-bold py-3 px-8 rounded-md transition-all'
good_button_class = 'bg-[#e52920] text-white px-8 py-4 rounded-xl font-headline font-bold text-lg tracking-wide hover:bg-[#c00007] transition-all shadow-md'
content = content.replace(bad_button_class, good_button_class)

bad_button_class2 = 'bg-[#e52920] text-white px-8 py-4 rounded-xl font-headline font-bold text-lg tracking-wide hover:bg-[#c00007] transition-all shadow-md w-full text-on-primary font-label uppercase tracking-label font-bold py-3 px-8 rounded-md transition-all flex items-center justify-center gap-2 mt-auto'
good_button_class2 = 'w-full bg-[#e52920] text-white px-8 py-4 rounded-xl font-headline font-bold text-lg tracking-wide hover:bg-[#c00007] transition-all shadow-md flex items-center justify-center gap-2 mt-auto'
content = content.replace(bad_button_class2, good_button_class2)

# Also fix the Get Quote for Concrete/Colorbond buttons which still have the old 'border border-secondary/30 ...' classes
old_secondary_btn = 'border border-secondary/30 text-secondary font-label uppercase tracking-label font-bold py-3 px-8 rounded-md hover:bg-secondary/5 transition-all'
new_secondary_btn = 'border-2 border-[#3e5ca3] text-[#3e5ca3] font-headline font-bold text-lg px-8 py-4 rounded-xl hover:bg-[#3e5ca3]/5 transition-all shadow-sm'
content = content.replace(old_secondary_btn, new_secondary_btn)

old_get_quote_secondary = 'mt-auto w-full border border-secondary/30 text-secondary font-label uppercase tracking-label font-bold py-3 px-8 rounded-md hover:bg-secondary/5 transition-all flex items-center justify-center gap-2'
new_get_quote_secondary = 'mt-auto w-full border-2 border-[#3e5ca3] text-[#3e5ca3] font-headline font-bold text-lg px-8 py-4 rounded-xl hover:bg-[#3e5ca3]/5 transition-all shadow-sm flex items-center justify-center gap-2'
content = content.replace(old_get_quote_secondary, new_get_quote_secondary)


# Update selectSwatch logic to add a tint overlay
new_script = """
<script>
        function selectSwatch(sectionId, swatchElement, colorHex, imageUrl) {
            // Tint the preview image
            const container = document.getElementById(sectionId + '-preview').parentElement;
            
            // Check if overlay exists, if not create one
            let overlay = container.querySelector('.tint-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'tint-overlay absolute inset-0 pointer-events-none mix-blend-color transition-colors duration-700 opacity-60';
                container.appendChild(overlay);
            }
            overlay.style.backgroundColor = colorHex;

            // Reset all swatches in this section
            const section = document.getElementById(sectionId);
            const swatches = section.querySelectorAll('.swatch-container');
            swatches.forEach(s => {
                const ring = s.querySelector('.swatch-ring');
                const label = s.querySelector('.swatch-label');
                ring.classList.remove('ring-primary', 'ring-2');
                ring.classList.add('ring-transparent');
                label.classList.remove('text-primary', 'font-bold');
                label.classList.add('text-[#5d6b82]');
            });

            // Set active swatch
            const activeRing = swatchElement.querySelector('.swatch-ring');
            const activeLabel = swatchElement.querySelector('.swatch-label');
            activeRing.classList.remove('ring-transparent');
            activeRing.classList.add('ring-primary', 'ring-2');
            activeLabel.classList.remove('text-[#5d6b82]');
            activeLabel.classList.add('text-primary', 'font-bold');
        }
    </script>
"""

content = re.sub(r'<script>\s*function selectSwatch.*?</script>', new_script, content, flags=re.DOTALL)

with open('colour-preview.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('Fixed styling and swatches.')
