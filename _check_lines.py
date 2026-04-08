with open(r'C:\Users\ihsan\Desktop\BOOK\web\src\lib\marketing-data.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()
for i in range(203, 221):
    print(f'{i+1}: {lines[i].rstrip()}')
