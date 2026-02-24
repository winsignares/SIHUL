"""
Improved script to reorganize horarios by physical space using AST parsing
"""

import ast
import re
from collections import defaultdict

# Read the current horarios_seeder.py file
with open(r'c:\Users\salacomputocentro.ba\Documents\SIHUL\backend\mysite\management\commands\seeders\horarios_seeder.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Define space name normalization mapping based on espacios_seeder.py
SPACE_NORMALIZATION = {
    # Sede Centro spaces
    'SALON 103B-CENTRO': 'SALON 103B-CENTRO',
    'SALON 401NB': 'SALON 401NB',
    'SALON 402NB': 'SALON 402NB',
    'SALON 715NB': 'SALON 715NB',
    'SALON 403NB': 'SALON 403NB',
    'SALON 404NB': 'SALON 404NB',
    'SALON 405NB': 'SALON 405NB',
    'SALON 406NB': 'SALON 406NB',
    'SALÓN 406NB': 'SALON 406NB',
    'SALON 407NB': 'SALON 407NB',
    'SALÓN 407NB': 'SALON 407NB',
    'SALON 408NB': 'SALON 408NB',
    'SALÓN 408NB': 'SALON 408NB',
    'SALON 409NB': 'SALON 409NB',
    'SALÓN 409NB': 'SALON 409NB',
    'SALON 409 BN': 'SALON 409NB',
    'SALON  409 BN': 'SALON 409NB',
    'SALON 410NB': 'SALON 410NB',
    'SALÓN 410NB': 'SALON 410NB',
    'SALÓN 410 NB': 'SALON 410NB',
    'SALON 411NB': 'SALON 411NB',
    'SALÓN 411NB': 'SALON 411NB',
    'SALÓN 4111NB': 'SALON 411NB',
    'SALON 412NB': 'SALON 412NB',
    'SALÓN 412NB': 'SALON 412NB',
    'SALON 413NB': 'SALON 413NB',
    'SALÓN 413NB': 'SALON 413NB',
    'SALON 414NB': 'SALON 414NB',
    'SALÓN 414NB': 'SALON 414NB',
    'SALÓN 414 NB': 'SALON 414NB',
    'SALON 415NB': 'SALON 415NB',
    'SALÓN 415NB': 'SALON 415NB',
    'SALON 416NB': 'SALON 416NB',
    'SALÓN 416NB': 'SALON 416NB',
    'SALON 500NB': 'SALON 500NB',
    'SALON 501NB': 'SALON 501NB',
    'SALÓN 501NB': 'SALON 501NB',
    'SALON 502NB': 'SALON 502NB',
    'SALÓN 502NB': 'SALON 502NB',
    'SALON 503NB': 'SALON 503NB',
    'SALON 504NB': 'SALON 504NB',
    'SALON 505NB': 'SALON 505NB',
    'SALÓN 505NB': 'SALON 505NB',
    'SALON 506NB': 'SALON 506NB',
    'SALÓN 506NB': 'SALON 506NB',
    'SALON 507NB': 'SALON 507NB',
    'SALÓN 507NB': 'SALON 507NB',
    'ALON 507NB': 'SALON 507NB',
    'SALON 508NB': 'SALON 508NB',
    'SALÓN 508NB': 'SALON 508NB',
    'SALON 509NB': 'SALON 509NB',
    'SALÓN 509NB': 'SALON 509NB',
    'SALON 510NB': 'SALON 510NB',
    'SALÓN 510NB': 'SALON 510NB',
    'SALON 511NB': 'SALON 511NB',
    'SALÓN 511NB': 'SALON 511NB',
    'SALÓN 511 NB': 'SALON 511NB',
    'SALON 512NB': 'SALON 512NB',
    'SALÓN 512NB': 'SALON 512NB',
    'SALON 512 NB': 'SALON 512NB',
    'SALON 513NB': 'SALON 513NB',
    'SALÓN 513NB': 'SALON 513NB',
    'SALON 514NB': 'SALON 514NB',
    'SALÓN 514NB': 'SALON 514NB',
    'SALÓN 514 NB': 'SALON 514NB',
    'SALON 515NB': 'SALON 515NB',
    'SALÓN 515NB': 'SALON 515NB',
    'SALÓN 515 NB': 'SALON 515NB',
    'SALON 516NB': 'SALON 516NB',
    'SALÓN 516NB': 'SALON 516NB',
    'SALÓN 516 NB': 'SALON 516NB',
    'SALON 516 NB': 'SALON 516NB',
    'SALON 517NB': 'SALON 517NB',
    'SALON 600NB': 'SALON 600NB',
    'SALON 601NB': 'SALON 601NB',
    'SALON 602NB': 'SALON 602NB',
    'SALON 603NB': 'SALON 603NB',
    'SALON 604NB': 'SALON 604NB',
    'SALÓN 604NB': 'SALON 604NB',
    'SALÓN 604 NB': 'SALON 604NB',
    'SALON 605NB': 'SALON 605NB',
    'SALON 606NB': 'SALON 606NB',
    'SALON 607NB': 'SALON 607NB',
    'SALÓN 607NB': 'SALON 607NB',
    'SALON 608NB': 'SALON 608NB',
    'SALÓN 608NB': 'SALON 608NB',
    'SALON 609NB': 'SALON 609NB',
    'SALON 610NB': 'SALON 610NB',
    'SALON 611NB': 'SALON 611NB',
    'SALÓN 611NB': 'SALON 611NB',
    'SALΌN 611 NB': 'SALON 611NB',
    'SALON 612NB': 'SALON 612NB',
    'SALÓN 612NB': 'SALON 612NB',
    'SALÓN 612 NB': 'SALON 612NB',
    'SALON 6121NB': 'SALON 612NB',
    'SALON 613NB': 'SALON 613NB',
    'SALON 614NB': 'SALON 614NB',
    'SALON 615NB': 'SALON 615NB',
    'SALÓN 615NB': 'SALON 615NB',
    'SALON 616NB': 'SALON 616NB',
    'SALÓN 616NB': 'SALON 616NB',
    'SALON 617NB': 'SALON 617NB',
    'SALON 701NB': 'SALON 701NB',
    'SALON 702NB': 'SALON 702NB',
    'SALON 703NB': 'SALON 703NB',
    'SALON 704NB': 'SALON 704NB',
    'SALON 709NB': 'SALON 709NB',
    'SALON 710NB': 'SALON 710NB',
    'SALON 711NB': 'SALON 711NB',
    'SALON 713NB': 'SALON 713NB',
    'SALON 714NB': 'SALON 714NB',
    'SALON 717NB': 'SALON 717NB',
    'SALON 718NB': 'SALON 718NB',
    'AUDITORIO': 'AUDITORIO',
    
    # Sede Principal spaces - normalize to base name without capacity
    'TORREON 1': 'TORREON 1',
    'TORREON 2': 'TORREON 2',
    'SALON TORREON 1': 'TORREON 1',
    'SALÓN TORREON 1': 'TORREON 1',
    'SALON TORREON 2': 'TORREON 2',
    'SALÓN TORREON 2': 'TORREON 2',
    'TORREON 1 (130': 'TORREON 1',
    'TORREON 2 (130': 'TORREON 2',
    'SALON 302A': 'SALON 302A',
    'SALÓN 302A': 'SALON 302A',
    'SALÓN 302A (100': 'SALON 302A',
    'SALÓN 302A (100)': 'SALON 302A',
    'SALON 303A': 'SALON 303A',
    'SALÓN 303A': 'SALON 303A',
    'SALÓN 303A (100': 'SALON 303A',
    'SALÓN 303A (100)': 'SALON 303A',
    'SALON 101B': 'SALON 101B',
    'SALÓN 101B': 'SALON 101B',
    'SALÓN 101B (100': 'SALON 101B',
    'SALÓN 101B (100)': 'SALON 101B',
    'SALON 102B': 'SALON 102B',
    'SALÓN 102B': 'SALON 102B',
    'SALÓN 102B (50': 'SALON 102B',
    'SALÓN 102B (50)': 'SALON 102B',
    'SALON 103B': 'SALON 103B',
    'SALÓN 103B': 'SALON 103B',
    'SALÓN 103B (50': 'SALON 103B',
    'SALÓN 103B (50)': 'SALON 103B',
    'SALON 104B': 'SALON 104B',
    'SALÓN 104B': 'SALON 104B',
    'SALÓN 104B (50': 'SALON 104B',
    'SALÓN 104B (50)': 'SALON 104B',
    'SALON 105B': 'SALON 105B',
    'SALÓN 105B': 'SALON 105B',
    'SALÓN 105B (50': 'SALON 105B',
    'SALÓN 105B (50)': 'SALON 105B',
    'SALON 106B': 'SALON 106B',
    'SALÓN 106B': 'SALON 106B',
    'SALÓN 106B (100': 'SALON 106B',
    'SALÓN 106B (100)': 'SALON 106B',
    'SALON 107B': 'SALON 107B',
    'SALÓN 107B': 'SALON 107B',
    'SALÓN 107B (50': 'SALON 107B',
    'SALÓN 107B (50)': 'SALON 107B',
    'SALA COMPUTO 201B': 'SALA COMPUTO 201B',
    'SALA COMPUTO 202B': 'SALA COMPUTO 202B',
    'SALÓN 202B': 'SALA COMPUTO 202B',
    'SALON 202B': 'SALA COMPUTO 202B',
    'SALON 201B': 'SALA COMPUTO 201B',
    'SALÓN 201B': 'SALA COMPUTO 201B',
    'SALA COMPUTO 202B (40': 'SALA COMPUTO 202B',
    'SALA COMPUTO 203B': 'SALA COMPUTO 203B',
    'SALON 203A': 'SALON 203A',
    'SALÓN 203A': 'SALON 203A',
    'SALON 203B': 'SALON 203B',
    'SALÓN 203B': 'SALON 203B',
    'SALÓN 203B (50': 'SALON 203B',
    'SALÓN 203B (50)': 'SALON 203B',
    'SALON 204A': 'SALON 204A',
    'SALÓN 204A': 'SALON 204A',
    'SALON 204B': 'SALON 204B',
    'SALÓN 204B': 'SALON 204B',
    'SALÓN 204B (50': 'SALON 204B',
    'SALÓN 204B (50)': 'SALON 204B',
    'SALON 205B': 'SALON 205B',
    'SALÓN 205B': 'SALON 205B',
    'SALÓN 205B (50': 'SALON 205B',
    'SALÓN 205B (50)': 'SALON 205B',
    'SALON 205NB': 'SALON 205NB',
    'SALON 206B': 'SALON 206B',
    'SALÓN 206B': 'SALON 206B',
    'SALÓN 206B (50': 'SALON 206B',
    'SALÓN 206B (50)': 'SALON 206B',
    'SALON 301B': 'SALON 301B',
    'SALÓN 301B': 'SALON 301B',
    'SALÓN 301B (50': 'SALON 301B',
    'SALÓN 301B (50)': 'SALON 301B',
    'SALON 302B': 'SALON 302B',
    'SALÓN 302B': 'SALON 302B',
    'SALÓN 302B (50': 'SALON 302B',
    'SALÓN 302B (50)': 'SALON 302B',
    'SALON 303B': 'SALON 303B',
    'SALÓN 303B': 'SALON 303B',
    'SALÓN 303B (50': 'SALON 303B',
    'SALÓN 303B (50)': 'SALON 303B',
    'SALON 304B': 'SALON 304B',
    'SALÓN 304B': 'SALON 304B',
    'SALÓN 304B (50': 'SALON 304B',
    'SALÓN 304B (50)': 'SALON 304B',
    'SALÓN 304B (50)': 'SALON 304B',
    'SALON 305B': 'SALON 305B',
    'SALÓN 305B': 'SALON 305B',
    'SALÓN 305B (50': 'SALON 305B',
    'SALÓN 305B (50)': 'SALON 305B',
    'SALON 306B': 'SALON 306B',
    'SALÓN 306B': 'SALON 306B',
    'SALÓN 306B (100': 'SALON 306B',
    'SALÓN 306B (100)': 'SALON 306B',
    'SALON 307B': 'SALON 307B',
    'SALÓN 307B': 'SALON 307B',
    'SALÓN 307B (100': 'SALON 307B',
    'SALÓN 307B (100)': 'SALON 307B',
    'SALON 308B': 'SALON 308B',
    'SALÓN 308B': 'SALON 308B',
    'SALÓN 308B (100': 'SALON 308B',
    'SALÓN 308B (100)': 'SALON 308B',
}

# Sede spaces from espacios_seeder.py
SEDE_CENTRO_SPACES = [
    'SALON 103B-CENTRO', 'SALON 401NB', 'SALON 402NB', 'SALON 715NB', 'SALON 403NB',
    'SALON 404NB', 'SALON 405NB', 'SALON 406NB', 'SALON 407NB', 'SALON 408NB',
    'SALON 409NB', 'SALON 410NB', 'SALON 411NB', 'SALON 412NB', 'SALON 413NB',
    'SALON 414NB', 'SALON 415NB', 'SALON 416NB', 'SALON 500NB', 'SALON 501NB',
    'SALON 502NB', 'SALON 503NB', 'SALON 504NB', 'SALON 505NB', 'SALON 506NB',
    'SALON 507NB', 'SALON 508NB', 'SALON 509NB', 'SALON 510NB', 'SALON 511NB',
    'SALON 512NB', 'SALON 513NB', 'SALON 514NB', 'SALON 515NB', 'SALON 516NB',
    'SALON 517NB', 'SALON 600NB', 'SALON 601NB', 'SALON 602NB', 'SALON 603NB',
    'SALON 604NB', 'SALON 605NB', 'SALON 606NB', 'SALON 607NB', 'SALON 608NB',
    'SALON 609NB', 'SALON 610NB', 'SALON 611NB', 'SALON 612NB', 'SALON 613NB',
    'SALON 614NB', 'SALON 615NB', 'SALON 616NB', 'SALON 617NB', 'SALON 701NB',
    'SALON 702NB', 'SALON 703NB', 'SALON 704NB', 'SALON 709NB', 'SALON 710NB',
    'SALON 711NB', 'SALON 713NB', 'SALON 714NB', 'SALON 717NB', 'SALON 718NB',
    'AUDITORIO'
]

SEDE_PRINCIPAL_SPACES = [
    'TORREON 1', 'TORREON 2', 'SALON 302A', 'SALON 303A', 'SALON 101B',
    'SALON 102B', 'SALON 103B', 'SALON 104B', 'SALON 105B', 'SALON 106B',
    'SALON 107B', 'SALA COMPUTO 201B', 'SALA COMPUTO 202B', 'SALA COMPUTO 203B',
    'SALON 203A', 'SALON 204A', 'SALON 203B', 'SALON 204B', 'SALON 205B', 'SALON 206B', 'SALON 301B',
    'SALON 302B', 'SALON 303B', 'SALON 304B', 'SALON 305B', 'SALON 306B',
    'SALON 307B', 'SALON 308B'
]

def normalize_space_name(space):
    """Normalize space name"""
    space = space.strip()
    if space in SPACE_NORMALIZATION:
        return SPACE_NORMALIZATION[space]
    return space

def extract_schedules_line_by_line(lines, start_line, end_line):
    """Extract schedules from lines using line-by-line parsing"""
    schedules = []
    in_array = False
    
    for i in range(start_line, min(end_line, len(lines))):
        line = lines[i].strip()
        
        # Check if we're entering the horarios_data array
        if 'horarios_data = [' in line:
            in_array = True
            continue
        
        # Check if we're exiting the array
        if in_array and line.startswith(']'):
            break
        
        # Process tuple lines
        if in_array and line.startswith('('):
            try:
                # Remove comments
                if '#' in line:
                    line = line[:line.index('#')]
                
                # Try to evaluate the tuple
                line = line.strip().rstrip(',')
                tuple_data = eval(line)
                
                if len(tuple_data) == 7:
                    grupo, materia, profesor, dia, hora_inicio, hora_fin, espacio = tuple_data
                    normalized_space = normalize_space_name(espacio)
                    schedules.append((grupo, materia, profesor, dia, hora_inicio, hora_fin, normalized_space))
            except Exception as e:
                print(f"Error parsing line {i}: {line[:50]}... - {e}")
                continue
    
    return schedules

print("Extracting schedules from Sede Centro...")
# Sede Centro: horarios_data starts around line 39
centro_schedules = extract_schedules_line_by_line(lines, 0, 1100)

print("Extracting schedules from Sede Principal...")
# Sede Principal: horarios_data starts around line 1099  
principal_schedules = extract_schedules_line_by_line(lines, 1075, len(lines))

print(f"\nExtracted {len(centro_schedules)} schedules from Sede Centro")
print(f"Extracted {len(principal_schedules)} schedules from Sede Principal")

# Group schedules by space
def group_by_space(schedules):
    grouped = defaultdict(list)
    for schedule in schedules:
        space = schedule[6]  # espacio is the 7th element
        grouped[space].append(schedule)
    return grouped

centro_by_space = group_by_space(centro_schedules)
principal_by_space = group_by_space(principal_schedules)

print(f"\nSede Centro: {len(centro_by_space)} unique spaces")
print(f"Sede Principal: {len(principal_by_space)} unique spaces")

# Generate formatted output
def format_schedules_for_sede(grouped_schedules, space_list, sede_name):
    """Generate formatted Python code for schedules organized by space"""
    output_lines = []
    output_lines.append(f"    # ═══════════════════════════════════════════════════════")
    output_lines.append(f"    # HORARIOS ORGANIZADOS POR ESPACIO FÍSICO - {sede_name}")
    output_lines.append(f"    # ═══════════════════════════════════════════════════════")
    output_lines.append("")
    
    # Sort spaces alphabetically
    sorted_spaces = sorted([s for s in grouped_schedules.keys() if s in space_list])
    
    # Add schedules that might not be in the official list
    unknown_spaces = sorted([s for s in grouped_schedules.keys() if s not in space_list and s not in ['SALON 205NB', 'SALON 516NB', 'SALÓN 403NB', 'SALÓN 404NB', 'SALÓN 405NB', 'SALÓN 507NB', 'I CONTADURIA AN', 'SALON 103B', 'SALON  409 BN']])
    
    for space in sorted_spaces + unknown_spaces:
        schedules = grouped_schedules[space]
        count = len(schedules)
        
        if space in unknown_spaces:
            output_lines.append(f"        # ── {space} ({count} horarios) [ESPACIO NO OFICIAL] ──")
        else:
            output_lines.append(f"        # ── {space} ({count} horarios) ──")
        
        for grupo, materia, profesor, dia, hora_inicio, hora_fin, espacio in schedules:
            line = f"        ('{grupo}', '{materia}', '{profesor}', '{dia}', '{hora_inicio}', '{hora_fin}', '{space}'),"
            output_lines.append(line)
        
        output_lines.append("")
    
    return "\n".join(output_lines)

print("\nGenerating formatted output for Sede Centro...")
centro_formatted = format_schedules_for_sede(centro_by_space, SEDE_CENTRO_SPACES, "SEDE CENTRO")

print("Generating formatted output for Sede Principal...")
principal_formatted = format_schedules_for_sede(principal_by_space, SEDE_PRINCIPAL_SPACES, "SEDE PRINCIPAL")

# Save to output files
output_dir = r'c:\Users\salacomputocentro.ba\Documents\SIHUL'

with open(f'{output_dir}\\horarios_centro_organized.txt', 'w', encoding='utf-8') as f:
    f.write(centro_formatted)

with open(f'{output_dir}\\horarios_principal_organized.txt', 'w', encoding='utf-8') as f:
    f.write(principal_formatted)

print(f"\n✓ Output saved to:")
print(f"  - {output_dir}\\horarios_centro_organized.txt")
print(f"  - {output_dir}\\horarios_principal_organized.txt")

# Print summary
print("\n" + "="*70)
print("RESUMEN DE ESPACIOS")
print("="*70)
print("\nSede Centro:")
for space in sorted(centro_by_space.keys()):
    count = len(centro_by_space[space])
    status = "✓" if space in SEDE_CENTRO_SPACES else "⚠"
    print(f"  {status} {space}: {count} horarios")

print("\nSede Principal:")
for space in sorted(principal_by_space.keys()):
    count = len(principal_by_space[space])
    status = "✓" if space in SEDE_PRINCIPAL_SPACES else "⚠"
    print(f"  {status} {space}: {count} horarios")
