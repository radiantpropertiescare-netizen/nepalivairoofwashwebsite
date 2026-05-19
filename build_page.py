import re

with open('index.html', 'r', encoding='utf-8') as f:
    index_html = f.read()

with open('colour-preview-raw.html', 'r', encoding='utf-8') as f:
    raw_html = f.read()

# Extract <main> from raw_html
main_match = re.search(r'(<main[^>]*>.*?</main>)', raw_html, re.DOTALL)
main_content = main_match.group(1) if main_match else ''

# Extract <style> and <script> from raw_html
head_extras = ''
style_match = re.search(r'(<style>.*?</style>)', raw_html, re.DOTALL)
if style_match:
    head_extras += '\n' + style_match.group(1)

script_match = re.search(r'(<script>\s*function selectSwatch.*?</script>)', raw_html, re.DOTALL)
if script_match:
    head_extras += '\n' + script_match.group(1)

# Modify main_content to match brand styling
main_content = main_content.replace('font-display', 'font-headline')
main_content = main_content.replace('font-body', 'font-[\'Inter\']')

# Replace get quote buttons classes to match brand #e52920 styling
main_content = re.sub(r'btn-primary.*?', r'bg-[#e52920] text-white px-8 py-4 rounded-xl font-headline font-bold text-lg tracking-wide hover:bg-[#c00007] transition-all shadow-md', main_content)
main_content = main_content.replace('bg-surface-container-low', 'bg-[#f3f4f5]')
main_content = main_content.replace('bg-surface', 'bg-white')
main_content = main_content.replace('text-on-surface-variant', 'text-[#5d6b82]')
main_content = main_content.replace('text-on-surface', 'text-[#1d2b45]')

# Replace <main> in index_html
index_main_match = re.search(r'(<main[^>]*>.*?</main>)', index_html, re.DOTALL)
if index_main_match:
    new_html = index_html.replace(index_main_match.group(1), main_content)
else:
    new_html = index_html

# Insert head_extras before </head>
new_html = new_html.replace('</head>', head_extras + '\n</head>')

# Update title
new_html = re.sub(r'<title>.*?</title>', '<title>Colour Preview | Nepali Vai Roof Wash</title>', new_html)

with open('colour-preview.html', 'w', encoding='utf-8') as f:
    f.write(new_html)

print('Generated colour-preview.html correctly')
