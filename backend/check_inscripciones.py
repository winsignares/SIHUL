from horario.models import Horario, HorarioEstudiante
from usuarios.models import Usuario
from grupos.models import Grupo

print("\n📊 Resumen de Inscripciones por Grupo:\n")

for grupo in Grupo.objects.all().order_by('nombre'):
    # Contar estudiantes únicos del grupo
    estudiantes_grupo = Usuario.objects.filter(
        horarios_inscritos__horario__grupo=grupo
    ).distinct().count()
    
    # Contar horarios del grupo
    horarios_grupo = Horario.objects.filter(grupo=grupo).count()
    
    # Contar total de inscripciones
    inscripciones = HorarioEstudiante.objects.filter(horario__grupo=grupo).count()
    
    print(f"  {grupo.nombre} ({grupo.programa.nombre} - Sem {grupo.semestre}):")
    print(f"    👨‍🎓 Estudiantes: {estudiantes_grupo}")
    print(f"    📅 Horarios: {horarios_grupo}")
    print(f"    📝 Inscripciones: {inscripciones}")
    print()

print("\n📋 Muestra de Inscripciones (primeras 10):\n")
for inscripcion in HorarioEstudiante.objects.select_related(
    'horario__grupo', 'horario__asignatura', 'estudiante'
)[:10]:
    print(f"  {inscripcion.estudiante.nombre}")
    print(f"    ➜ {inscripcion.horario.grupo.nombre} - {inscripcion.horario.asignatura.nombre}")
    print(f"    ➜ {inscripcion.horario.dia_semana} {inscripcion.horario.hora_inicio}-{inscripcion.horario.hora_fin}")
    print()

print(f"\n✅ Total general:")
print(f"   - Usuarios totales: {Usuario.objects.count()}")
print(f"   - Estudiantes: {Usuario.objects.filter(correo__startswith='estudiante.').count()}")
print(f"   - Docentes: {Usuario.objects.filter(correo__startswith='docente.').count()}")
print(f"   - Inscripciones totales: {HorarioEstudiante.objects.count()}")
