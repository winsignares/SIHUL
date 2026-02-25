import re

file_path = r'c:\Users\SOPORTE\Documents\SIHUL\backend\mysite\management\commands\seeders\horarios_seeder.py'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

six_element_tuples = []
all_tuple_counts = {}
tuple_pattern = re.compile(r'^\s*\(')

for line_num, line in enumerate(lines, 1):
    if tuple_pattern.match(line):
        # Count string literals in the tuple
        # Expected format: ('str1', 'str2', 'str3', 'str4', 'str5', 'str6', 'str7'),
        strings = re.findall(r"'[^']*'", line)
        num_elements = len(strings)
        
        # Track all tuple sizes
        all_tuple_counts[num_elements] = all_tuple_counts.get(num_elements, 0) + 1
        
        if num_elements == 6:
            six_element_tuples.append((line_num, line.strip(), num_elements))

print(f'Tuple size distribution:')
for size in sorted(all_tuple_counts.keys()):
    print(f'  {size} elements: {all_tuple_counts[size]} tuples')
print()

print(f'Found {len(six_element_tuples)} tuples with 6 elements:\n')
for line_num, content, num_elem in six_element_tuples:
    print(f'Line {line_num} ({num_elem} elements):')
    print(f'{content}')
    print()

if len(six_element_tuples) == 0:
    print('No tuples with 6 elements found. All tuples appear to have the correct format.')
