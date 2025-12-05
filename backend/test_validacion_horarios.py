"""
Script para probar la validación de horarios:
1. Solapamiento de horarios en el mismo espacio
2. Validación de capacidad cuando grupos comparten clase
"""

from horario.models import Horario, HorarioFusionado
from grupos.models import Grupo
from asignaturas.models import Asignatura
from usuarios.models import Usuario
from espacios.models import EspacioFisico
from django.core.exceptions import ValidationError
from datetime import time

print("=" * 70)
print("🧪 PROBANDO VALIDACIÓN DE HORARIOS")
print("=" * 70)

# Obtener datos existentes
grupos = list(Grupo.objects.all()[:3])
asignatura = Asignatura.objects.first()
docente = Usuario.objects.filter(rol__nombre='docente').first()
espacio = EspacioFisico.objects.first()

if not grupos or not asignatura or not docente or not espacio:
    print("❌ No hay datos suficientes para realizar las pruebas")
    exit(1)

print(f"\n📊 Datos de prueba:")
print(f"  - Grupos: {[g.nombre for g in grupos]}")
print(f"  - Asignatura: {asignatura.nombre}")
print(f"  - Docente: {docente.nombre}")
print(f"  - Espacio: {espacio.nombre} (Capacidad: {espacio.capacidad})")

# Limpiar horarios de prueba anteriores
print(f"\n🧹 Limpiando horarios de prueba anteriores en el espacio {espacio.nombre}...")
# Limpiar TODOS los horarios del lunes 14:00-16:00 en este espacio
horarios_eliminados = Horario.objects.filter(
    espacio=espacio,
    dia_semana='lunes',
    hora_inicio=time(14, 0),
    hora_fin=time(16, 0)
).delete()
print(f"   Horarios eliminados: {horarios_eliminados[0]}")

# También limpiar fusionados relacionados
fusionados_eliminados = HorarioFusionado.objects.filter(
    espacio=espacio,
    dia_semana='lunes',
    hora_inicio=time(14, 0),
    hora_fin=time(16, 0)
).delete()
print(f"   Fusionados eliminados: {fusionados_eliminados[0]}")

# ========================================
# PRUEBA 1: Crear horario base
# ========================================
print("\n" + "=" * 70)
print("📝 PRUEBA 1: Crear horario base")
print("=" * 70)

try:
    horario1 = Horario(
        grupo=grupos[0],
        asignatura=asignatura,
        docente=docente,
        espacio=espacio,
        dia_semana='lunes',
        hora_inicio=time(14, 0),  # Usar 14:00-16:00 para evitar conflictos
        hora_fin=time(16, 0),
        cantidad_estudiantes=30,
        estado='aprobado'
    )
    horario1.save()
    print(f"✅ Horario 1 creado: Grupo {grupos[0].nombre}, Lunes 14:00-16:00, 30 estudiantes")
except ValidationError as e:
    print(f"❌ Error: {e.message}")

# ========================================
# PRUEBA 2: Intentar solapamiento (debe fallar)
# ========================================
print("\n" + "=" * 70)
print("📝 PRUEBA 2: Intentar crear horario con solapamiento (debe fallar)")
print("=" * 70)

try:
    horario_solapado = Horario(
        grupo=grupos[1],
        asignatura=Asignatura.objects.all()[1] if Asignatura.objects.count() > 1 else asignatura,  # Diferente asignatura
        docente=docente,
        espacio=espacio,  # Mismo espacio
        dia_semana='lunes',  # Mismo día
        hora_inicio=time(15, 0),  # Solapa con 14:00-16:00
        hora_fin=time(17, 0),
        cantidad_estudiantes=25,
        estado='aprobado'
    )
    horario_solapado.save()
    print(f"❌ ERROR: El horario solapado NO debería haberse guardado")
except ValidationError as e:
    print(f"✅ Validación correcta: {e.message}")

# ========================================
# PRUEBA 3: Compartir clase con capacidad suficiente (debe funcionar)
# ========================================
print("\n" + "=" * 70)
print("📝 PRUEBA 3: Compartir clase con capacidad suficiente (debe funcionar)")
print("=" * 70)

estudiantes_grupo2 = min(25, espacio.capacidad - 30)  # No exceder capacidad

try:
    horario2 = Horario(
        grupo=grupos[1],
        asignatura=asignatura,  # Misma asignatura
        docente=docente,  # Mismo docente
        espacio=espacio,  # Mismo espacio
        dia_semana='lunes',  # Mismo día
        hora_inicio=time(14, 0),  # Misma hora
        hora_fin=time(16, 0),
        cantidad_estudiantes=estudiantes_grupo2,
        estado='aprobado'
    )
    horario2.save()
    print(f"✅ Horario 2 creado: Grupo {grupos[1].nombre}, Lunes 14:00-16:00, {estudiantes_grupo2} estudiantes")
    print(f"   Total estudiantes: {30 + estudiantes_grupo2}/{espacio.capacidad}")
except ValidationError as e:
    print(f"❌ Error inesperado: {e.message}")

# ========================================
# PRUEBA 4: Exceder capacidad del espacio (debe fallar)
# ========================================
print("\n" + "=" * 70)
print("📝 PRUEBA 4: Intentar exceder capacidad del espacio (debe fallar)")
print("=" * 70)

# Calcular cuántos estudiantes excederían la capacidad
estudiantes_exceso = espacio.capacidad - 30 - estudiantes_grupo2 + 10  # +10 para exceder

try:
    horario3 = Horario(
        grupo=grupos[2],
        asignatura=asignatura,  # Misma asignatura
        docente=docente,  # Mismo docente
        espacio=espacio,  # Mismo espacio
        dia_semana='lunes',  # Mismo día
        hora_inicio=time(14, 0),  # Misma hora
        hora_fin=time(16, 0),
        cantidad_estudiantes=estudiantes_exceso,
        estado='aprobado'
    )
    horario3.save()
    print(f"❌ ERROR: El horario NO debería haberse guardado (excede capacidad)")
except ValidationError as e:
    print(f"✅ Validación correcta: {e.message}")

# ========================================
# PRUEBA 5: Horario en diferente día (debe funcionar)
# ========================================
print("\n" + "=" * 70)
print("📝 PRUEBA 5: Crear horario en diferente día (debe funcionar)")
print("=" * 70)

try:
    horario4 = Horario(
        grupo=grupos[2],
        asignatura=asignatura,
        docente=docente,
        espacio=espacio,
        dia_semana='martes',  # Diferente día
        hora_inicio=time(14, 0),
        hora_fin=time(16, 0),
        cantidad_estudiantes=30,
        estado='aprobado'
    )
    horario4.save()
    print(f"✅ Horario 4 creado: Grupo {grupos[2].nombre}, Martes 14:00-16:00, 30 estudiantes")
except ValidationError as e:
    print(f"❌ Error inesperado: {e.message}")

# ========================================
# PRUEBA 6: Verificar HorarioFusionado
# ========================================
print("\n" + "=" * 70)
print("📝 PRUEBA 6: Verificar creación de HorarioFusionado")
print("=" * 70)

fusionados = HorarioFusionado.objects.filter(
    asignatura=asignatura,
    docente=docente,
    dia_semana='lunes',
    hora_inicio=time(14, 0)
)

print(f"  📊 HorariosFusionados encontrados: {fusionados.count()}")
for fusionado in fusionados:
    print(f"    - ID: {fusionado.id}")
    print(f"      Grupo 1: {fusionado.grupo1.nombre if fusionado.grupo1 else 'N/A'}")
    print(f"      Grupo 2: {fusionado.grupo2.nombre if fusionado.grupo2 else 'N/A'}")
    print(f"      Grupo 3: {fusionado.grupo3.nombre if fusionado.grupo3 else 'N/A'}")
    print(f"      Total estudiantes: {fusionado.cantidad_estudiantes}")

print("\n" + "=" * 70)
print("✨ PRUEBAS COMPLETADAS")
print("=" * 70)
