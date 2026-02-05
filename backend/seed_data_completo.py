"""
Script para crear datos de prueba completos:
- Sedes
- Facultades
- Programas
- Asignaturas
- AsignaturaPrograma (relación asignaturas con programas por semestre)

Ejecutar con: python manage.py shell < seed_data_completo.py
"""

from django.db import transaction
from sedes.models import Sede
from facultades.models import Facultad
from programas.models import Programa
from asignaturas.models import Asignatura, AsignaturaPrograma

print("🚀 Iniciando creación de datos de prueba...")

# Usar savepoint para permitir rollback parcial en caso de error
sid = transaction.savepoint()

# ========== SEDES ==========
print("\n📍 Creando Sedes...")
sedes_data = [
    {"nombre": "Sede Centro", "direccion": "Cra. 46 #48", "ciudad": "Barranquilla"},
    {"nombre": "Sede Norte", "direccion": "Cra. 51B #135 -100", "ciudad": "Barranquilla"}
    ]

for sede_data in sedes_data:
    sede, created = Sede.objects.get_or_create(
        nombre=sede_data["nombre"],
        defaults=sede_data
    )
    if created:
        print(f"  ✅ Sede creada: {sede.nombre}")
    else:
        print(f"  ⏭️  Sede ya existe: {sede.nombre}")

# ========== FACULTADES ==========
print("\n🏛️ Obteniendo Facultades existentes...")
# Las facultades se crean con: python manage.py seed_facultades
# Obtenemos las facultades que ya existen en la base de datos
facultades_existentes = Facultad.objects.all()
if not facultades_existentes.exists():
    print("  ⚠️  No hay facultades en la base de datos.")
    print("  ⚠️  Por favor ejecuta: python manage.py seed_facultades")
    exit(1)

facultades = {}
for facultad in facultades_existentes:
    facultades[facultad.nombre] = facultad
    print(f"  ✅ Facultad encontrada: {facultad.nombre}")

# ========== PROGRAMAS ==========
print("\n🎓 Creando Programas...")
programas_data = [
    {"nombre": "Ingeniería de Sistemas", "facultad": "Ingeniería", "semestres": 10},
    {"nombre": "Ingeniería Industrial", "facultad": "Ingeniería", "semestres": 10},
    {"nombre": "Ingeniería Civil", "facultad": "Ingeniería", "semestres": 10},
    {"nombre": "Derecho", "facultad": "Derecho", "semestres": 10},
    {"nombre": "Medicina", "facultad": "Ciencias de la Salud", "semestres": 12},
    {"nombre": "Administración de Empresas", "facultad": "Ciencias Económicas", "semestres": 9},
    {"nombre": "Contaduría Pública", "facultad": "Ciencias Económicas", "semestres": 9},
    {"nombre": "Licenciatura en Educación Infantil", "facultad": "Ciencias de la Educación", "semestres": 8},
    {"nombre": "Filosofía", "facultad": "Filosofía", "semestres": 8},
]

programas = {}
for prog_data in programas_data:
    facultad_nombre = prog_data["facultad"]
    if facultad_nombre not in facultades:
        print(f"  ⚠️  Facultad '{facultad_nombre}' no encontrada, omitiendo programa {prog_data['nombre']}")
        continue
    
    facultad = facultades[facultad_nombre]
    programa, created = Programa.objects.get_or_create(
        nombre=prog_data["nombre"],
        facultad=facultad,
        defaults={"semestres": prog_data["semestres"]}
    )
    programas[prog_data["nombre"]] = programa
    if created:
        print(f"  ✅ Programa creado: {programa.nombre} ({facultad.nombre})")
    else:
        print(f"  ⏭️  Programa ya existe: {programa.nombre}")

# ========== ASIGNATURAS ==========
print("\n📚 Creando Asignaturas...")
asignaturas_data = [
    # Asignaturas de Ingeniería
    {"nombre": "Cálculo I", "codigo": "MAT101", "creditos": 4, "tipo": "teórica", "horas": 4},
    {"nombre": "Cálculo II", "codigo": "MAT102", "creditos": 4, "tipo": "teórica", "horas": 4},
    {"nombre": "Cálculo III", "codigo": "MAT103", "creditos": 4, "tipo": "teórica", "horas": 4},
    {"nombre": "Álgebra Lineal", "codigo": "MAT104", "creditos": 3, "tipo": "teórica", "horas": 3},
    {"nombre": "Física I", "codigo": "FIS101", "creditos": 4, "tipo": "mixta", "horas": 6},
    {"nombre": "Física II", "codigo": "FIS102", "creditos": 4, "tipo": "mixta", "horas": 6},
    {"nombre": "Programación I", "codigo": "SIS101", "creditos": 3, "tipo": "mixta", "horas": 6},
    {"nombre": "Programación II", "codigo": "SIS102", "creditos": 3, "tipo": "mixta", "horas": 6},
    {"nombre": "Estructuras de Datos", "codigo": "SIS201", "creditos": 4, "tipo": "mixta", "horas": 6},
    {"nombre": "Base de Datos I", "codigo": "SIS202", "creditos": 3, "tipo": "mixta", "horas": 6},
    {"nombre": "Base de Datos II", "codigo": "SIS203", "creditos": 3, "tipo": "mixta", "horas": 6},
    {"nombre": "Ingeniería de Software I", "codigo": "SIS301", "creditos": 4, "tipo": "mixta", "horas": 6},
    {"nombre": "Ingeniería de Software II", "codigo": "SIS302", "creditos": 4, "tipo": "mixta", "horas": 6},
    {"nombre": "Redes de Computadores", "codigo": "SIS303", "creditos": 3, "tipo": "mixta", "horas": 6},
    {"nombre": "Sistemas Operativos", "codigo": "SIS304", "creditos": 3, "tipo": "mixta", "horas": 6},
    
    # Asignaturas de Ingeniería Industrial
    {"nombre": "Estadística I", "codigo": "EST101", "creditos": 3, "tipo": "teórica", "horas": 4},
    {"nombre": "Estadística II", "codigo": "EST102", "creditos": 3, "tipo": "teórica", "horas": 4},
    {"nombre": "Investigación de Operaciones I", "codigo": "IND201", "creditos": 4, "tipo": "mixta", "horas": 6},
    {"nombre": "Investigación de Operaciones II", "codigo": "IND202", "creditos": 4, "tipo": "mixta", "horas": 6},
    {"nombre": "Diseño de Plantas", "codigo": "IND301", "creditos": 3, "tipo": "práctica", "horas": 6},
    {"nombre": "Control de Calidad", "codigo": "IND302", "creditos": 3, "tipo": "mixta", "horas": 5},
    {"nombre": "Gestión de Producción", "codigo": "IND303", "creditos": 3, "tipo": "teórica", "horas": 3},
    
    # Asignaturas de Ingeniería Civil
    {"nombre": "Mecánica de Materiales", "codigo": "CIV201", "creditos": 4, "tipo": "mixta", "horas": 6},
    {"nombre": "Hidráulica", "codigo": "CIV202", "creditos": 4, "tipo": "mixta", "horas": 6},
    {"nombre": "Estructuras I", "codigo": "CIV301", "creditos": 4, "tipo": "mixta", "horas": 6},
    {"nombre": "Estructuras II", "codigo": "CIV302", "creditos": 4, "tipo": "mixta", "horas": 6},
    {"nombre": "Construcción I", "codigo": "CIV303", "creditos": 3, "tipo": "práctica", "horas": 6},
    
    # Asignaturas de Ciencias Económicas
    {"nombre": "Contabilidad General", "codigo": "CON101", "creditos": 3, "tipo": "teórica", "horas": 3},
    {"nombre": "Contabilidad de Costos", "codigo": "CON201", "creditos": 3, "tipo": "teórica", "horas": 3},
    {"nombre": "Administración I", "codigo": "ADM101", "creditos": 3, "tipo": "teórica", "horas": 3},
    {"nombre": "Administración II", "codigo": "ADM201", "creditos": 3, "tipo": "teórica", "horas": 3},
    {"nombre": "Microeconomía", "codigo": "ECO101", "creditos": 3, "tipo": "teórica", "horas": 3},
    {"nombre": "Macroeconomía", "codigo": "ECO102", "creditos": 3, "tipo": "teórica", "horas": 3},
    {"nombre": "Finanzas Corporativas", "codigo": "FIN301", "creditos": 3, "tipo": "teórica", "horas": 3},
    
    # Asignaturas comunes/humanísticas
    {"nombre": "Expresión Oral y Escrita", "codigo": "HUM101", "creditos": 2, "tipo": "teórica", "horas": 2},
    {"nombre": "Ética Profesional", "codigo": "HUM201", "creditos": 2, "tipo": "teórica", "horas": 2},
    {"nombre": "Constitución Política", "codigo": "HUM202", "creditos": 2, "tipo": "teórica", "horas": 2},
    {"nombre": "Inglés I", "codigo": "ING101", "creditos": 2, "tipo": "teórica", "horas": 4},
    {"nombre": "Inglés II", "codigo": "ING102", "creditos": 2, "tipo": "teórica", "horas": 4},
    {"nombre": "Inglés III", "codigo": "ING103", "creditos": 2, "tipo": "teórica", "horas": 4},
]

asignaturas = {}
for asig_data in asignaturas_data:
    asignatura, created = Asignatura.objects.get_or_create(
        codigo=asig_data["codigo"],
        defaults=asig_data
    )
    asignaturas[asig_data["codigo"]] = asignatura
    if created:
        print(f"  ✅ Asignatura creada: {asignatura.codigo} - {asignatura.nombre}")
    else:
        print(f"  ⏭️  Asignatura ya existe: {asignatura.codigo} - {asignatura.nombre}")

# ========== ASIGNATURA-PROGRAMA (Pensum) ==========
print("\n🔗 Creando relaciones Asignatura-Programa (Pensum)...")

# Ingeniería de Sistemas
sistemas_pensum = [
    # Semestre 1
    ("MAT101", 1, "básica"),
    ("FIS101", 1, "básica"),
    ("SIS101", 1, "profesional"),
    ("HUM101", 1, "humanística"),
    ("ING101", 1, "humanística"),
    # Semestre 2
    ("MAT102", 2, "básica"),
    ("FIS102", 2, "básica"),
    ("SIS102", 2, "profesional"),
    ("MAT104", 2, "básica"),
    ("ING102", 2, "humanística"),
    # Semestre 3
    ("MAT103", 3, "básica"),
    ("SIS201", 3, "profesional"),
    ("SIS202", 3, "profesional"),
    ("ING103", 3, "humanística"),
    # Semestre 4
    ("SIS203", 4, "profesional"),
    ("SIS301", 4, "profesional"),
    ("EST101", 4, "básica"),
    ("HUM201", 4, "humanística"),
    # Semestre 5
    ("SIS302", 5, "profesional"),
    ("SIS303", 5, "profesional"),
    ("SIS304", 5, "profesional"),
    ("HUM202", 5, "humanística"),
]

# Ingeniería Industrial
industrial_pensum = [
    # Semestre 1
    ("MAT101", 1, "básica"),
    ("FIS101", 1, "básica"),
    ("HUM101", 1, "humanística"),
    ("ING101", 1, "humanística"),
    ("ADM101", 1, "profesional"),
    # Semestre 2
    ("MAT102", 2, "básica"),
    ("FIS102", 2, "básica"),
    ("MAT104", 2, "básica"),
    ("ING102", 2, "humanística"),
    ("EST101", 2, "básica"),
    # Semestre 3
    ("MAT103", 3, "básica"),
    ("EST102", 3, "básica"),
    ("IND201", 3, "profesional"),
    ("ING103", 3, "humanística"),
    # Semestre 4
    ("IND202", 4, "profesional"),
    ("IND301", 4, "profesional"),
    ("HUM201", 4, "humanística"),
    # Semestre 5
    ("IND302", 5, "profesional"),
    ("IND303", 5, "profesional"),
    ("HUM202", 5, "humanística"),
]

# Ingeniería Civil
civil_pensum = [
    # Semestre 1
    ("MAT101", 1, "básica"),
    ("FIS101", 1, "básica"),
    ("HUM101", 1, "humanística"),
    ("ING101", 1, "humanística"),
    # Semestre 2
    ("MAT102", 2, "básica"),
    ("FIS102", 2, "básica"),
    ("MAT104", 2, "básica"),
    ("ING102", 2, "humanística"),
    # Semestre 3
    ("MAT103", 3, "básica"),
    ("CIV201", 3, "profesional"),
    ("ING103", 3, "humanística"),
    # Semestre 4
    ("CIV202", 4, "profesional"),
    ("CIV301", 4, "profesional"),
    ("HUM201", 4, "humanística"),
    # Semestre 5
    ("CIV302", 5, "profesional"),
    ("CIV303", 5, "profesional"),
    ("HUM202", 5, "humanística"),
]

# Administración de Empresas
admin_pensum = [
    # Semestre 1
    ("MAT101", 1, "básica"),
    ("CON101", 1, "profesional"),
    ("ADM101", 1, "profesional"),
    ("HUM101", 1, "humanística"),
    ("ING101", 1, "humanística"),
    # Semestre 2
    ("EST101", 2, "básica"),
    ("CON201", 2, "profesional"),
    ("ADM201", 2, "profesional"),
    ("ECO101", 2, "básica"),
    ("ING102", 2, "humanística"),
    # Semestre 3
    ("ECO102", 3, "básica"),
    ("ING103", 3, "humanística"),
    ("HUM201", 3, "humanística"),
    # Semestre 4
    ("FIN301", 4, "profesional"),
    ("HUM202", 4, "humanística"),
]

# Contaduría Pública
contaduria_pensum = [
    # Semestre 1
    ("MAT101", 1, "básica"),
    ("CON101", 1, "profesional"),
    ("ADM101", 1, "profesional"),
    ("HUM101", 1, "humanística"),
    ("ING101", 1, "humanística"),
    # Semestre 2
    ("EST101", 2, "básica"),
    ("CON201", 2, "profesional"),
    ("ECO101", 2, "básica"),
    ("ING102", 2, "humanística"),
    # Semestre 3
    ("ECO102", 3, "básica"),
    ("ING103", 3, "humanística"),
    ("HUM201", 3, "humanística"),
    # Semestre 4
    ("FIN301", 4, "profesional"),
    ("HUM202", 4, "humanística"),
]

# Crear relaciones
pensums = {
    "Ingeniería de Sistemas": sistemas_pensum,
    "Ingeniería Industrial": industrial_pensum,
    "Ingeniería Civil": civil_pensum,
    "Administración de Empresas": admin_pensum,
    "Contaduría Pública": contaduria_pensum,
}

contador = 0
for programa_nombre, pensum in pensums.items():
    programa = programas[programa_nombre]
    print(f"\n  📋 Programa: {programa_nombre}")
    for codigo_asignatura, semestre, componente in pensum:
        asignatura = asignaturas[codigo_asignatura]
        asig_prog, created = AsignaturaPrograma.objects.get_or_create(
            programa=programa,
            asignatura=asignatura,
            semestre=semestre,
            defaults={"componente_formativo": componente}
        )
        if created:
            contador += 1
            print(f"    ✅ {asignatura.nombre} - Semestre {semestre} ({componente})")
        else:
            print(f"    ⏭️  {asignatura.nombre} - Semestre {semestre} (ya existe)")

print(f"\n✨ ¡Fase 1 completada!")
print(f"   - Sedes: {Sede.objects.count()}")
print(f"   - Facultades: {Facultad.objects.count()}")
print(f"   - Programas: {Programa.objects.count()}")
print(f"   - Asignaturas: {Asignatura.objects.count()}")
print(f"   - Relaciones Asignatura-Programa: {AsignaturaPrograma.objects.count()} ({contador} nuevas)")

# Commit del savepoint si todo salió bien
try:
    transaction.savepoint_commit(sid)
    print("✅ Transacción fase 1 confirmada exitosamente")
except Exception as e:
    print(f"⚠️  Error al confirmar transacción: {e}")
    transaction.savepoint_rollback(sid)
    raise

# Ejecutar script avanzado
print("\n" + "="*60)
print("Ejecutando Fase 2: Datos Avanzados...")
print("="*60)
try:
    exec(open('seed_data_avanzado.py').read())
except Exception as e:
    print(f"⚠️  Error ejecutando seed_data_avanzado.py: {e}")
    import traceback
    traceback.print_exc()
