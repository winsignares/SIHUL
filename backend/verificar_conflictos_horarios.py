"""
Script para verificar conflictos en horarios existentes
Ejecutar con: python manage.py shell < verificar_conflictos_horarios.py
"""

from horario.models import Horario
from collections import defaultdict
from datetime import time

print("🔍 Verificando conflictos en horarios existentes...\n")

# Obtener todos los horarios
horarios = Horario.objects.select_related(
    'grupo', 'asignatura', 'docente', 'espacio'
).all()

print(f"📊 Total de horarios: {horarios.count()}\n")

# Función para convertir hora a minutos
def hora_a_minutos(hora):
    return hora.hour * 60 + hora.minute

# Estructuras para detectar conflictos
conflictos_docente = []
conflictos_espacio = []
conflictos_capacidad = []

# Agrupar horarios por día
horarios_por_dia = defaultdict(list)
for horario in horarios:
    horarios_por_dia[horario.dia_semana].append(horario)

# 1. VERIFICAR CONFLICTOS DE DOCENTES
print("👨‍🏫 Verificando conflictos de docentes...")
for dia, horarios_dia in horarios_por_dia.items():
    # Agrupar por docente
    docentes = defaultdict(list)
    for h in horarios_dia:
        if h.docente:
            docentes[h.docente.id].append(h)
    
    # Verificar superposiciones por docente
    for docente_id, horarios_docente in docentes.items():
        for i, h1 in enumerate(horarios_docente):
            for h2 in horarios_docente[i+1:]:
                inicio1 = hora_a_minutos(h1.hora_inicio)
                fin1 = hora_a_minutos(h1.hora_fin)
                inicio2 = hora_a_minutos(h2.hora_inicio)
                fin2 = hora_a_minutos(h2.hora_fin)
                
                # Verificar superposición
                if not (fin1 <= inicio2 or inicio1 >= fin2):
                    # Hay superposición - verificar si NO es la misma clase
                    if h1.asignatura_id != h2.asignatura_id:
                        conflictos_docente.append({
                            'docente': h1.docente.nombre,
                            'dia': dia,
                            'horario1': f"{h1.grupo.nombre} - {h1.asignatura.nombre} ({h1.hora_inicio}-{h1.hora_fin})",
                            'horario2': f"{h2.grupo.nombre} - {h2.asignatura.nombre} ({h2.hora_inicio}-{h2.hora_fin})",
                            'espacio1': h1.espacio.nombre,
                            'espacio2': h2.espacio.nombre
                        })

if conflictos_docente:
    print(f"  ❌ {len(conflictos_docente)} conflictos encontrados:")
    for c in conflictos_docente:
        print(f"     - {c['docente']} el {c['dia']}:")
        print(f"       • {c['horario1']} en {c['espacio1']}")
        print(f"       • {c['horario2']} en {c['espacio2']}")
else:
    print("  ✅ No hay conflictos de docentes")

# 2. VERIFICAR CONFLICTOS DE ESPACIOS
print("\n🚪 Verificando conflictos de espacios...")
for dia, horarios_dia in horarios_por_dia.items():
    # Agrupar por espacio
    espacios = defaultdict(list)
    for h in horarios_dia:
        espacios[h.espacio.id].append(h)
    
    # Verificar superposiciones por espacio
    for espacio_id, horarios_espacio in espacios.items():
        for i, h1 in enumerate(horarios_espacio):
            for h2 in horarios_espacio[i+1:]:
                inicio1 = hora_a_minutos(h1.hora_inicio)
                fin1 = hora_a_minutos(h1.hora_fin)
                inicio2 = hora_a_minutos(h2.hora_inicio)
                fin2 = hora_a_minutos(h2.hora_fin)
                
                # Verificar superposición
                if not (fin1 <= inicio2 or inicio1 >= fin2):
                    # Hay superposición - verificar si NO es la misma clase
                    misma_clase = (
                        h1.asignatura_id == h2.asignatura_id and
                        h1.docente_id == h2.docente_id and
                        inicio1 == inicio2 and
                        fin1 == fin2
                    )
                    
                    if not misma_clase:
                        conflictos_espacio.append({
                            'espacio': h1.espacio.nombre,
                            'dia': dia,
                            'horario1': f"{h1.grupo.nombre} - {h1.asignatura.nombre} - {h1.docente.nombre if h1.docente else 'Sin docente'} ({h1.hora_inicio}-{h1.hora_fin})",
                            'horario2': f"{h2.grupo.nombre} - {h2.asignatura.nombre} - {h2.docente.nombre if h2.docente else 'Sin docente'} ({h2.hora_inicio}-{h2.hora_fin})"
                        })

if conflictos_espacio:
    print(f"  ❌ {len(conflictos_espacio)} conflictos encontrados:")
    for c in conflictos_espacio:
        print(f"     - {c['espacio']} el {c['dia']}:")
        print(f"       • {c['horario1']}")
        print(f"       • {c['horario2']}")
else:
    print("  ✅ No hay conflictos de espacios")

# 3. VERIFICAR CAPACIDAD EN CLASES COMPARTIDAS
print("\n👥 Verificando capacidad en clases compartidas...")
# Agrupar clases compartidas (mismo docente, asignatura, día, hora)
clases_compartidas = defaultdict(list)
for horario in horarios:
    if horario.docente and horario.asignatura:
        key = (
            horario.docente.id,
            horario.asignatura.id,
            horario.dia_semana,
            horario.hora_inicio.strftime('%H:%M'),
            horario.hora_fin.strftime('%H:%M'),
            horario.espacio.id
        )
        clases_compartidas[key].append(horario)

for key, horarios_grupo in clases_compartidas.items():
    if len(horarios_grupo) > 1:
        # Calcular total de estudiantes
        total_estudiantes = sum(h.cantidad_estudiantes or 0 for h in horarios_grupo)
        espacio = horarios_grupo[0].espacio
        
        if total_estudiantes > espacio.capacidad:
            grupos = [h.grupo.nombre for h in horarios_grupo]
            conflictos_capacidad.append({
                'asignatura': horarios_grupo[0].asignatura.nombre,
                'docente': horarios_grupo[0].docente.nombre,
                'espacio': espacio.nombre,
                'capacidad': espacio.capacidad,
                'total_estudiantes': total_estudiantes,
                'grupos': ', '.join(grupos),
                'dia': horarios_grupo[0].dia_semana,
                'hora': f"{horarios_grupo[0].hora_inicio}-{horarios_grupo[0].hora_fin}",
                'exceso': total_estudiantes - espacio.capacidad
            })

if conflictos_capacidad:
    print(f"  ❌ {len(conflictos_capacidad)} conflictos de capacidad encontrados:")
    for c in conflictos_capacidad:
        print(f"     - {c['asignatura']} con {c['docente']}")
        print(f"       Espacio: {c['espacio']} (capacidad: {c['capacidad']})")
        print(f"       Grupos: {c['grupos']}")
        print(f"       Total estudiantes: {c['total_estudiantes']} (exceso: {c['exceso']})")
        print(f"       Horario: {c['dia']} {c['hora']}")
else:
    print("  ✅ No hay conflictos de capacidad")

# RESUMEN
print("\n" + "="*70)
print("📋 RESUMEN DE VALIDACIÓN")
print("="*70)
print(f"Horarios analizados: {horarios.count()}")
print(f"Conflictos de docentes: {len(conflictos_docente)}")
print(f"Conflictos de espacios: {len(conflictos_espacio)}")
print(f"Conflictos de capacidad: {len(conflictos_capacidad)}")
print(f"\nTotal de conflictos: {len(conflictos_docente) + len(conflictos_espacio) + len(conflictos_capacidad)}")

if len(conflictos_docente) + len(conflictos_espacio) + len(conflictos_capacidad) == 0:
    print("\n✅ ¡Todos los horarios están correctos!")
else:
    print("\n⚠️  Se encontraron conflictos que deben ser corregidos")
