#!/usr/bin/env python3
import os
import re
from pathlib import Path

src_dir = Path("/home/gabodev/Escritorio/SIHUL/frontend/src")
modified_count = 0

# Patrones a remover (console.log, console.info, console.warn, console.debug)
# Pero mantener console.error
patterns_to_remove = [
    r'\s*console\.(log|info|warn|debug)\([^)]*\);?\s*\n',
    r'\s*console\.(log|info|warn|debug)\([^)]*\);?',
]

for file_path in src_dir.rglob("*.ts*"):
    if "node_modules" in str(file_path) or "dist" in str(file_path):
        continue
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original = content
        
        # Remover console.log/info/warn/debug
        for pattern in patterns_to_remove:
            content = re.sub(pattern, '\n', content, flags=re.MULTILINE)
        
        # Limpiar múltiples saltos de línea
        content = re.sub(r'\n\s*\n\s*\n+', '\n\n', content)
        
        if content != original:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            modified_count += 1
            print(f"✓ {file_path.relative_to(src_dir)}")
    
    except Exception as e:
        print(f"✗ Error en {file_path}: {e}")

print(f"\n✅ Completado: {modified_count} archivos modificados")
