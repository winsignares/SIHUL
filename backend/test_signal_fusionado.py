"""
Script para probar el signal de HorarioFusionado
"""

from horario.models import Horario, HorarioFusionado
from grupos.models import Grupo
from asignaturas.models import Asignatura
from usuarios.models import Usuario
from espacios.models import EspacioFisico

print("=" * 70)
print("🧪 PROBANDO SIGNAL DE HORARIO FUSIONADO")
print("=" * 70)

# Obtener datos existentes
grupos = list(Grupo.objects.all()[:3])
asignatura = Asignatura.objects.first()
docente = Usuario.objects.filter(rol__nombre='docente').first()
espacio = EspacioFisico.objects.first()

if not grupos or len(grupos) < 2:
    print("❌ No hay suficientes grupos para la prueba")
    exit(1)

if not asignatura or not docente or not espacio:
    print("❌ Faltan datos necesarios (asignatura, docente o espacio)")
    exit(1)

print(f"\n📊 Datos de prueba:")
print(f"  - Grupos: {[g.nombre for g in grupos]}")
print(f"  - Asignatura: {asignatura.nombre}")
print(f"  - Docente: {docente.nombre}")
print(f"  - Espacio: {espacio.nombre}")

# Limpiar horarios fusionados anteriores para esta prueba
HorarioFusionado.objects.filter(
    asignatura=asignatura,
    dia_semana='lunes',
    hora_inicio='08:00'
).delete()

# Limpiar horarios anteriores de los grupos de prueba
Horario.objects.filter(
    grupo__in=grupos,
    asignatura=asignatura,
    dia_semana='lunes',
    hora_inicio='08:00'
).delete()

print("\n🔄 Creando horarios para grupos compartiendo la misma clase...")

# Crear primer horario
horario1 = Horario.objects.create(
    grupo=grupos[0],
    asignatura=asignatura,
    docente=docente,
    espacio=espacio,
    dia_semana='lunes',
    hora_inicio='08:00',
    hora_fin='10:00',
    cantidad_estudiantes=30
)
print(f"  ✅ Horario 1 creado para grupo {grupos[0].nombre}")

# Verificar que NO se creó fusionado (solo hay 1 grupo)
fusionados_count = HorarioFusionado.objects.filter(
    asignatura=asignatura,
    dia_semana='lunes',
    hora_inicio='08:00'
).count()
print(f"  📊 HorariosFusionados después del 1er horario: {fusionados_count} (esperado: 0)")

# Crear segundo horario (mismo espacio, día, hora, asignatura, docente)
horario2 = Horario.objects.create(
    grupo=grupos[1],
    asignatura=asignatura,
    docente=docente,
    espacio=espacio,
    dia_semana='lunes',
    hora_inicio='08:00',
    hora_fin='10:00',
    cantidad_estudiantes=25
)
print(f"  ✅ Horario 2 creado para grupo {grupos[1].nombre}")

# Verificar que SÍ se creó fusionado (2 grupos compartiendo)
fusionados = HorarioFusionado.objects.filter(
    asignatura=asignatura,
    dia_semana='lunes',
    hora_inicio='08:00'
)
fusionados_count = fusionados.count()
print(f"  📊 HorariosFusionados después del 2do horario: {fusionados_count} (esperado: 1)")

if fusionados_count > 0:
    fusionado = fusionados.first()
    print(f"\n✅ HORARIO FUSIONADO CREADO AUTOMÁTICAMENTE:")
    print(f"  - ID: {fusionado.id}")
    print(f"  - Grupo 1: {fusionado.grupo1.nombre if fusionado.grupo1 else 'N/A'}")
    print(f"  - Grupo 2: {fusionado.grupo2.nombre if fusionado.grupo2 else 'N/A'}")
    print(f"  - Grupo 3: {fusionado.grupo3.nombre if fusionado.grupo3 else 'N/A'}")
    print(f"  - Asignatura: {fusionado.asignatura.nombre}")
    print(f"  - Docente: {fusionado.docente.nombre if fusionado.docente else 'N/A'}")
    print(f"  - Espacio: {fusionado.espacio.nombre}")
    print(f"  - Día: {fusionado.dia_semana}")
    print(f"  - Horario: {fusionado.hora_inicio} - {fusionado.hora_fin}")
    print(f"  - Total estudiantes: {fusionado.cantidad_estudiantes} (esperado: 55)")
    print(f"  - Comentario: {fusionado.comentario}")

# Si hay un tercer grupo, agregarlo
if len(grupos) >= 3:
    print(f"\n🔄 Agregando tercer grupo...")
    horario3 = Horario.objects.create(
        grupo=grupos[2],
        asignatura=asignatura,
        docente=docente,
        espacio=espacio,
        dia_semana='lunes',
        hora_inicio='08:00',
        hora_fin='10:00',
        cantidad_estudiantes=20
    )
    print(f"  ✅ Horario 3 creado para grupo {grupos[2].nombre}")
    
    # Verificar actualización del fusionado
    fusionado_actualizado = HorarioFusionado.objects.filter(
        asignatura=asignatura,
        dia_semana='lunes',
        hora_inicio='08:00'
    ).first()
    
    if fusionado_actualizado:
        print(f"\n✅ HORARIO FUSIONADO ACTUALIZADO:")
        print(f"  - ID: {fusionado_actualizado.id}")
        print(f"  - Grupo 1: {fusionado_actualizado.grupo1.nombre if fusionado_actualizado.grupo1 else 'N/A'}")
        print(f"  - Grupo 2: {fusionado_actualizado.grupo2.nombre if fusionado_actualizado.grupo2 else 'N/A'}")
        print(f"  - Grupo 3: {fusionado_actualizado.grupo3.nombre if fusionado_actualizado.grupo3 else 'N/A'}")
        print(f"  - Total estudiantes: {fusionado_actualizado.cantidad_estudiantes} (esperado: 75)")

print("\n" + "=" * 70)
print("✨ PRUEBA COMPLETADA")
print("=" * 70)
