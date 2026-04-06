import sys

filepath = "web/src/app/layout.tsx"

f = open(filepath, 'r', encoding='utf-8')
content = f.read()
f.close()

# Add </LangProvider> closing tag
old = '          <Toaster richColors position="top-right" />\n        </ThemeProvider>'
new = '          <Toaster richColors position="top-right" />\n          </LangProvider>\n        </ThemeProvider>'

if old in content:
    content = content.replace(old, new)
    f = open(filepath, 'w', encoding='utf-8')
    f.write(content)
    f.close()
    print("OK - </LangProvider> added after Toaster")
else:
    print("ALREADY DONE or pattern not found")
    # Check current state
    for i, line in enumerate(content.split('\n')):
        if 'LangProvider' in line or 'Toaster' in line:
            print(f"  L{i+1}: {line}")
