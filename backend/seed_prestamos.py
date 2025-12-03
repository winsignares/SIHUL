"""
Script para crear préstamos de espacios de prueba
Ejecutar con: docker-compose exec backend python manage.py shell < seed_prestamos.py
"""

from prestamos.models import PrestamoEspacio, TipoActividad, PrestamoRecurso
from espacios.models import EspacioFisico
from usuarios.models import Usuario
from recursos.models import Recurso
from datetime import date, time, timedelta
import random

print("=" * 70)
print("🏢 CREANDO PRÉSTAMOS DE ESPACIOS")
print("=" * 70)

# ========== OBTENER TIPOS DE ACTIVIDAD EXISTENTES ==========
print("\n📋 Obteniendo Tipos de Actividad existentes...")
# Usar los tipos de actividad ya existentes en la BD (de migración 0003)
tipos_actividad_nombres = [
    'Tutoria Grupal', 
    'Conferencia',
    'Taller',
    'Reunion Academica',
    'Asesoria de Proyecto',
    'Examen Especial',
    'Evento Cultural',
    'Otro'
]

tipos_actividad = {}
for nombre in tipos_actividad_nombres:
    tipo = TipoActividad.objects.filter(nombre=nombre).first()
    if tipo:
        tipos_actividad[nombre] = tipo
        print(f"  ✅ Encontrado: {tipo.nombre}")
    else:
        print(f"  ⚠️  No encontrado: {nombre}")

if not tipos_actividad:
    print("  ⚠️  No hay tipos de actividad. Ejecuta las migraciones primero.")
    exit(1)

# ========== OBTENER DATOS NECESARIOS ==========
print("\n🔍 Obteniendo datos existentes...")

# Usuarios
admin = Usuario.objects.filter(correo='admin@unilibre.edu.co').first()
planeacion_ing = Usuario.objects.filter(correo='planeacion.ingenieria@unilibre.edu.co').first()
planeacion_derecho = Usuario.objects.filter(correo='planeacion.derecho@unilibre.edu.co').first()
docente = Usuario.objects.filter(correo='docente@unilibre.edu.co').first()
estudiante = Usuario.objects.filter(correo='estudiante@unilibre.edu.co').first()

usuarios_solicitantes = [u for u in [docente, estudiante, planeacion_ing] if u]
administradores = [u for u in [admin, planeacion_ing, planeacion_derecho] if u]

if not usuarios_solicitantes:
    print("  ⚠️  No se encontraron usuarios. Ejecuta: docker-compose exec backend python manage.py seed_users")
    exit(1)

print(f"  ✅ Usuarios solicitantes: {len(usuarios_solicitantes)}")
print(f"  ✅ Administradores: {len(administradores)}")

# Espacios
espacios = list(EspacioFisico.objects.all())
if not espacios:
    print("  ⚠️  No hay espacios físicos. Crea espacios primero.")
    exit(1)

print(f"  ✅ Espacios disponibles: {len(espacios)}")

# Recursos
recursos = list(Recurso.objects.all())
print(f"  ✅ Recursos disponibles: {len(recursos)}")

# ========== CREAR PRÉSTAMOS ==========
print("\n📅 Creando préstamos...")

# Configuración de fechas
hoy = date.today()
ayer = hoy - timedelta(days=1)
manana = hoy + timedelta(days=1)
proxima_semana = hoy + timedelta(days=7)
mes_pasado = hoy - timedelta(days=30)

# Préstamos de ejemplo
prestamos_data = [
    # PRÉSTAMOS APROBADOS (pasados y actuales)
    {
        'espacio': random.choice(espacios),
        'usuario': random.choice(usuarios_solicitantes),
        'administrador': random.choice(administradores),
        'tipo_actividad': tipos_actividad.get('Tutoria Grupal'),
        'fecha': mes_pasado,
        'hora_inicio': time(8, 0),
        'hora_fin': time(10, 0),
        'motivo': 'Clase de Cálculo I - Grupo A',
        'asistentes': 35,
        'telefono': '3001234567',
        'estado': 'Aprobado',
        'recursos': ['Proyector', 'Tablero', 'Marcadores']
    },
    {
        'espacio': random.choice(espacios),
        'usuario': docente if docente else random.choice(usuarios_solicitantes),
        'administrador': admin if admin else random.choice(administradores),
        'tipo_actividad': tipos_actividad.get('Conferencia'),
        'fecha': ayer,
        'hora_inicio': time(14, 0),
        'hora_fin': time(16, 0),
        'motivo': 'Conferencia sobre Inteligencia Artificial',
        'asistentes': 80,
        'telefono': '3001234568',
        'estado': 'Aprobado',
        'recursos': ['Proyector', 'Micrófono', 'Sonido', 'Videoconferencia']
    },
    {
        'espacio': random.choice(espacios),
        'usuario': random.choice(usuarios_solicitantes),
        'administrador': planeacion_ing if planeacion_ing else random.choice(administradores),
        'tipo_actividad': tipos_actividad.get('Taller'),
        'fecha': hoy,
        'hora_inicio': time(10, 0),
        'hora_fin': time(12, 0),
        'motivo': 'Taller de programación Python',
        'asistentes': 25,
        'telefono': '3001234569',
        'estado': 'Aprobado',
        'recursos': ['Computadores', 'Proyector', 'Internet']
    },
    {
        'espacio': random.choice(espacios),
        'usuario': estudiante if estudiante else random.choice(usuarios_solicitantes),
        'administrador': random.choice(administradores),
        'tipo_actividad': tipos_actividad.get('Reunion Academica'),
        'fecha': hoy,
        'hora_inicio': time(15, 0),
        'hora_fin': time(17, 0),
        'motivo': 'Reunión de grupo de investigación',
        'asistentes': 12,
        'telefono': '3001234570',
        'estado': 'Aprobado',
        'recursos': ['Pizarra Digital', 'Mesas']
    },
    {
        'espacio': random.choice(espacios),
        'usuario': docente if docente else random.choice(usuarios_solicitantes),
        'administrador': admin if admin else random.choice(administradores),
        'tipo_actividad': tipos_actividad.get('Examen Especial'),
        'fecha': manana,
        'hora_inicio': time(8, 0),
        'hora_fin': time(10, 0),
        'motivo': 'Examen final de Base de Datos',
        'asistentes': 40,
        'telefono': '3001234571',
        'estado': 'Aprobado',
        'recursos': ['Sillas Adicionales', 'Aire Acondicionado']
    },
    {
        'espacio': random.choice(espacios),
        'usuario': random.choice(usuarios_solicitantes),
        'administrador': random.choice(administradores),
        'tipo_actividad': tipos_actividad.get('Tutoria Grupal'),
        'fecha': proxima_semana,
        'hora_inicio': time(9, 0),
        'hora_fin': time(12, 0),
        'motivo': 'Seminario de actualización profesional',
        'asistentes': 50,
        'telefono': '3001234572',
        'estado': 'Aprobado',
        'recursos': ['Proyector', 'Sonido', 'Atril', 'Pantalla Extra']
    },
    
    # PRÉSTAMOS PENDIENTES
    {
        'espacio': random.choice(espacios),
        'usuario': estudiante if estudiante else random.choice(usuarios_solicitantes),
        'administrador': None,
        'tipo_actividad': tipos_actividad.get('Evento Cultural'),
        'fecha': hoy + timedelta(days=3),
        'hora_inicio': time(18, 0),
        'hora_fin': time(21, 0),
        'motivo': 'Evento de integración estudiantil',
        'asistentes': 100,
        'telefono': '3001234573',
        'estado': 'Pendiente',
        'recursos': ['Sonido', 'Micrófono', 'Sillas Adicionales']
    },
    {
        'espacio': random.choice(espacios),
        'usuario': random.choice(usuarios_solicitantes),
        'administrador': None,
        'tipo_actividad': tipos_actividad.get('Asesoria de Proyecto'),
        'fecha': hoy + timedelta(days=5),
        'hora_inicio': time(14, 0),
        'hora_fin': time(16, 0),
        'motivo': 'Sustentación de trabajo de grado',
        'asistentes': 15,
        'telefono': '3001234574',
        'estado': 'Pendiente',
        'recursos': ['Proyector', 'Videoconferencia']
    },
    {
        'espacio': random.choice(espacios),
        'usuario': docente if docente else random.choice(usuarios_solicitantes),
        'administrador': None,
        'tipo_actividad': tipos_actividad.get('Taller'),
        'fecha': hoy + timedelta(days=2),
        'hora_inicio': time(7, 0),
        'hora_fin': time(11, 0),
        'motivo': 'Práctica de laboratorio de física',
        'asistentes': 30,
        'telefono': '3001234575',
        'estado': 'Pendiente',
        'recursos': ['Computadores', 'Tablero']
    },
    
    # PRÉSTAMOS RECHAZADOS
    {
        'espacio': random.choice(espacios),
        'usuario': random.choice(usuarios_solicitantes),
        'administrador': admin if admin else random.choice(administradores),
        'tipo_actividad': tipos_actividad.get('Evento Cultural'),
        'fecha': hoy - timedelta(days=2),
        'hora_inicio': time(20, 0),
        'hora_fin': time(23, 0),
        'motivo': 'Fiesta de fin de semestre',
        'asistentes': 200,
        'telefono': '3001234576',
        'estado': 'Rechazado',
        'recursos': ['Sonido', 'Micrófono']
    },
    {
        'espacio': random.choice(espacios),
        'usuario': estudiante if estudiante else random.choice(usuarios_solicitantes),
        'administrador': planeacion_derecho if planeacion_derecho else random.choice(administradores),
        'tipo_actividad': tipos_actividad.get('Reunion Academica'),
        'fecha': ayer,
        'hora_inicio': time(22, 0),
        'hora_fin': time(23, 30),
        'motivo': 'Reunión fuera de horario regular',
        'asistentes': 10,
        'telefono': '3001234577',
        'estado': 'Rechazado',
        'recursos': []
    },
    
    # PRÉSTAMOS VENCIDOS
    {
        'espacio': random.choice(espacios),
        'usuario': random.choice(usuarios_solicitantes),
        'administrador': None,
        'tipo_actividad': tipos_actividad.get('Conferencia'),
        'fecha': mes_pasado - timedelta(days=5),
        'hora_inicio': time(8, 0),
        'hora_fin': time(10, 0),
        'motivo': 'Clase de programación',
        'asistentes': 28,
        'telefono': '3001234578',
        'estado': 'Vencido',
        'recursos': ['Computadores', 'Proyector']
    },
    {
        'espacio': random.choice(espacios),
        'usuario': docente if docente else random.choice(usuarios_solicitantes),
        'administrador': None,
        'tipo_actividad': tipos_actividad.get('Taller'),
        'fecha': mes_pasado - timedelta(days=10),
        'hora_inicio': time(14, 0),
        'hora_fin': time(17, 0),
        'motivo': 'Taller de metodología de investigación',
        'asistentes': 20,
        'telefono': '3001234579',
        'estado': 'Vencido',
        'recursos': ['Proyector', 'Tablero', 'Marcadores']
    },
]

# Crear los préstamos
contador_creados = 0
contador_existentes = 0

for prestamo_data in prestamos_data:
    # Separar recursos de los datos del préstamo
    recursos_nombres = prestamo_data.pop('recursos', [])
    
    # Verificar si ya existe un préstamo similar
    existe = PrestamoEspacio.objects.filter(
        espacio=prestamo_data['espacio'],
        fecha=prestamo_data['fecha'],
        hora_inicio=prestamo_data['hora_inicio'],
        hora_fin=prestamo_data['hora_fin']
    ).exists()
    
    if not existe:
        # Crear el préstamo
        prestamo = PrestamoEspacio.objects.create(**prestamo_data)
        
        # Agregar recursos al préstamo
        for recurso_nombre in recursos_nombres:
            recurso = Recurso.objects.filter(nombre=recurso_nombre).first()
            if recurso:
                PrestamoRecurso.objects.create(
                    prestamo=prestamo,
                    recurso=recurso,
                    cantidad=1
                )
        
        print(f"  ✅ Préstamo creado: {prestamo.estado} - {prestamo.espacio.nombre} - {prestamo.tipo_actividad.nombre} - {prestamo.fecha}")
        contador_creados += 1
    else:
        print(f"  ⚠️  Ya existe préstamo similar para {prestamo_data['espacio'].nombre} el {prestamo_data['fecha']}")
        contador_existentes += 1

# ========== ESTADÍSTICAS FINALES ==========
print("\n" + "=" * 70)
print("📊 ESTADÍSTICAS FINALES")
print("=" * 70)

print(f"\nPréstamos creados: {contador_creados}")
print(f"Préstamos existentes: {contador_existentes}")

print("\nPréstamos por estado:")
for estado_nombre, _ in PrestamoEspacio.ESTADO_CHOICES:
    count = PrestamoEspacio.objects.filter(estado=estado_nombre).count()
    print(f"  - {estado_nombre}: {count}")

print(f"\nTipos de actividad: {TipoActividad.objects.count()}")
print(f"Recursos asignados a préstamos: {PrestamoRecurso.objects.count()}")

print("\n✨ ¡Préstamos creados exitosamente!")
