"""
Script para crear datos avanzados (Fase 2):
- Periodos Académicos
- Tipos de Espacios
- Espacios Físicos
- Recursos para Espacios
- Grupos
- Horarios

Ejecutar DESPUÉS de seed_data_completo.py
"""

from datetime import date, time
from periodos.models import PeriodoAcademico
from espacios.models import TipoEspacio, EspacioFisico
from recursos.models import Recurso, EspacioRecurso
from grupos.models import Grupo
from horario.models import Horario, HorarioEstudiante
from programas.models import Programa
from asignaturas.models import AsignaturaPrograma
from sedes.models import Sede
from usuarios.models import Usuario, Rol
import random

print("🚀 Iniciando creación de datos avanzados (Fase 2)...")

# ========== PERIODOS ACADÉMICOS ==========
print("\n📅 Creando Periodos Académicos...")
periodos_data = [
    {
        "nombre": "2024-1",
        "fecha_inicio": date(2024, 2, 1),
        "fecha_fin": date(2024, 6, 30),
        "activo": False
    },
    {
        "nombre": "2024-2",
        "fecha_inicio": date(2024, 8, 1),
        "fecha_fin": date(2024, 12, 15),
        "activo": False
    },
    {
        "nombre": "2025-1",
        "fecha_inicio": date(2025, 2, 1),
        "fecha_fin": date(2025, 6, 30),
        "activo": True
    },
]

periodos = {}
for periodo_data in periodos_data:
    periodo, created = PeriodoAcademico.objects.get_or_create(
        nombre=periodo_data["nombre"],
        defaults=periodo_data
    )
    periodos[periodo_data["nombre"]] = periodo
    if created:
        print(f"  ✅ Periodo creado: {periodo.nombre} ({'ACTIVO' if periodo.activo else 'inactivo'})")
    else:
        print(f"  ⏭️  Periodo ya existe: {periodo.nombre}")

# ========== TIPOS DE ESPACIOS ==========
print("\n🏢 Creando Tipos de Espacios...")
tipos_espacio_data = [
    {"nombre": "Aula", "descripcion": "Salón de clases estándar"},
    {"nombre": "Laboratorio", "descripcion": "Laboratorio equipado"},
    {"nombre": "Auditorio", "descripcion": "Auditorio para eventos grandes"},
    {"nombre": "Sala de Cómputo", "descripcion": "Sala con computadores"},
    {"nombre": "Taller", "descripcion": "Espacio para trabajo práctico"},
    {"nombre": "Sala de Reuniones", "descripcion": "Sala pequeña para reuniones"},
]

tipos_espacio = {}
for tipo_data in tipos_espacio_data:
    tipo, created = TipoEspacio.objects.get_or_create(
        nombre=tipo_data["nombre"],
        defaults=tipo_data
    )
    tipos_espacio[tipo_data["nombre"]] = tipo
    if created:
        print(f"  ✅ Tipo creado: {tipo.nombre}")
    else:
        print(f"  ⏭️  Tipo ya existe: {tipo.nombre}")

# ========== ESPACIOS FÍSICOS ==========
print("\n🚪 Creando Espacios Físicos...")
sede_principal = Sede.objects.get(nombre="Sede Principal")
sede_norte = Sede.objects.get(nombre="Sede Norte")

espacios_data = [
    # Sede Principal - Aulas
    {"nombre": "A-101", "sede": sede_principal, "tipo": "Aula", "capacidad": 40, "ubicacion": "Bloque A - Piso 1"},
    {"nombre": "A-102", "sede": sede_principal, "tipo": "Aula", "capacidad": 40, "ubicacion": "Bloque A - Piso 1"},
    {"nombre": "A-103", "sede": sede_principal, "tipo": "Aula", "capacidad": 35, "ubicacion": "Bloque A - Piso 1"},
    {"nombre": "A-201", "sede": sede_principal, "tipo": "Aula", "capacidad": 45, "ubicacion": "Bloque A - Piso 2"},
    {"nombre": "A-202", "sede": sede_principal, "tipo": "Aula", "capacidad": 45, "ubicacion": "Bloque A - Piso 2"},
    {"nombre": "A-203", "sede": sede_principal, "tipo": "Aula", "capacidad": 50, "ubicacion": "Bloque A - Piso 2"},
    
    # Sede Principal - Laboratorios
    {"nombre": "LAB-101", "sede": sede_principal, "tipo": "Laboratorio", "capacidad": 30, "ubicacion": "Bloque B - Piso 1"},
    {"nombre": "LAB-102", "sede": sede_principal, "tipo": "Laboratorio", "capacidad": 30, "ubicacion": "Bloque B - Piso 1"},
    {"nombre": "LAB-201", "sede": sede_principal, "tipo": "Laboratorio", "capacidad": 25, "ubicacion": "Bloque B - Piso 2"},
    
    # Sede Principal - Salas de Cómputo
    {"nombre": "COMP-101", "sede": sede_principal, "tipo": "Sala de Cómputo", "capacidad": 35, "ubicacion": "Bloque C - Piso 1"},
    {"nombre": "COMP-102", "sede": sede_principal, "tipo": "Sala de Cómputo", "capacidad": 35, "ubicacion": "Bloque C - Piso 1"},
    {"nombre": "COMP-201", "sede": sede_principal, "tipo": "Sala de Cómputo", "capacidad": 40, "ubicacion": "Bloque C - Piso 2"},
    
    # Sede Principal - Auditorios
    {"nombre": "AUDIT-PRINCIPAL", "sede": sede_principal, "tipo": "Auditorio", "capacidad": 200, "ubicacion": "Bloque D"},
    {"nombre": "AUDIT-102", "sede": sede_principal, "tipo": "Auditorio", "capacidad": 100, "ubicacion": "Bloque D - Piso 1"},
    
    # Sede Principal - Talleres
    {"nombre": "TALLER-1", "sede": sede_principal, "tipo": "Taller", "capacidad": 25, "ubicacion": "Bloque E - Piso 1"},
    {"nombre": "TALLER-2", "sede": sede_principal, "tipo": "Taller", "capacidad": 25, "ubicacion": "Bloque E - Piso 1"},
    
    # Sede Norte
    {"nombre": "N-101", "sede": sede_norte, "tipo": "Aula", "capacidad": 40, "ubicacion": "Edificio Norte - Piso 1"},
    {"nombre": "N-102", "sede": sede_norte, "tipo": "Aula", "capacidad": 40, "ubicacion": "Edificio Norte - Piso 1"},
    {"nombre": "N-LAB-101", "sede": sede_norte, "tipo": "Laboratorio", "capacidad": 30, "ubicacion": "Edificio Norte - Piso 1"},
    {"nombre": "N-COMP-101", "sede": sede_norte, "tipo": "Sala de Cómputo", "capacidad": 35, "ubicacion": "Edificio Norte - Piso 2"},
]

espacios = {}
for espacio_data in espacios_data:
    tipo = tipos_espacio[espacio_data["tipo"]]
    espacio, created = EspacioFisico.objects.get_or_create(
        nombre=espacio_data["nombre"],
        sede=espacio_data["sede"],
        defaults={
            "tipo": tipo,
            "capacidad": espacio_data["capacidad"],
            "ubicacion": espacio_data["ubicacion"],
            "estado": "Disponible"
        }
    )
    espacios[espacio_data["nombre"]] = espacio
    if created:
        print(f"  ✅ Espacio creado: {espacio.nombre} ({tipo.nombre}) - Cap: {espacio.capacidad}")
    else:
        print(f"  ⏭️  Espacio ya existe: {espacio.nombre}")

# ========== RECURSOS PARA ESPACIOS ==========
print("\n🔧 Asignando Recursos a Espacios...")

# Obtener recursos existentes
recursos = {r.nombre: r for r in Recurso.objects.all()}

# Configuración de recursos por tipo de espacio
recursos_por_tipo = {
    "Aula": ["Proyector", "Tablero", "Marcadores", "Borrador", "Aire Acondicionado"],
    "Laboratorio": ["Proyector", "Computadores", "Tablero", "Aire Acondicionado", "Internet"],
    "Sala de Cómputo": ["Proyector", "Computadores", "Internet", "Aire Acondicionado"],
    "Auditorio": ["Proyector", "Micrófono", "Sonido", "Videoconferencia", "Aire Acondicionado", "Sillas Adicionales"],
    "Taller": ["Tablero", "Mesas", "Internet"],
    "Sala de Reuniones": ["Proyector", "Pizarra Digital", "Videoconferencia", "Internet"],
}

contador_recursos = 0
for espacio in EspacioFisico.objects.all():
    tipo_nombre = espacio.tipo.nombre
    if tipo_nombre in recursos_por_tipo:
        for recurso_nombre in recursos_por_tipo[tipo_nombre]:
            if recurso_nombre in recursos:
                recurso = recursos[recurso_nombre]
                espacio_recurso, created = EspacioRecurso.objects.get_or_create(
                    espacio=espacio,
                    recurso=recurso,
                    defaults={"estado": "disponible"}
                )
                if created:
                    contador_recursos += 1

print(f"  ✅ Asignados {contador_recursos} recursos a espacios")

# ========== GRUPOS ==========
print("\n👥 Creando Grupos...")

periodo_activo = periodos["2025-1"]
programa_sistemas = Programa.objects.get(nombre="Ingeniería de Sistemas")
programa_industrial = Programa.objects.get(nombre="Ingeniería Industrial")
programa_civil = Programa.objects.get(nombre="Ingeniería Civil")
programa_admin = Programa.objects.get(nombre="Administración de Empresas")

grupos_data = [
    # Ingeniería de Sistemas
    {"programa": programa_sistemas, "nombre": "Sistemas-A", "semestre": 1, "periodo": periodo_activo},
    {"programa": programa_sistemas, "nombre": "Sistemas-B", "semestre": 1, "periodo": periodo_activo},
    {"programa": programa_sistemas, "nombre": "Sistemas-2A", "semestre": 2, "periodo": periodo_activo},
    {"programa": programa_sistemas, "nombre": "Sistemas-3A", "semestre": 3, "periodo": periodo_activo},
    {"programa": programa_sistemas, "nombre": "Sistemas-4A", "semestre": 4, "periodo": periodo_activo},
    {"programa": programa_sistemas, "nombre": "Sistemas-5A", "semestre": 5, "periodo": periodo_activo},
    
    # Ingeniería Industrial
    {"programa": programa_industrial, "nombre": "Industrial-A", "semestre": 1, "periodo": periodo_activo},
    {"programa": programa_industrial, "nombre": "Industrial-2A", "semestre": 2, "periodo": periodo_activo},
    {"programa": programa_industrial, "nombre": "Industrial-3A", "semestre": 3, "periodo": periodo_activo},
    {"programa": programa_industrial, "nombre": "Industrial-4A", "semestre": 4, "periodo": periodo_activo},
    
    # Ingeniería Civil
    {"programa": programa_civil, "nombre": "Civil-A", "semestre": 1, "periodo": periodo_activo},
    {"programa": programa_civil, "nombre": "Civil-2A", "semestre": 2, "periodo": periodo_activo},
    
    # Administración
    {"programa": programa_admin, "nombre": "Admin-A", "semestre": 1, "periodo": periodo_activo},
    {"programa": programa_admin, "nombre": "Admin-2A", "semestre": 2, "periodo": periodo_activo},
]

grupos = {}
for grupo_data in grupos_data:
    grupo, created = Grupo.objects.get_or_create(
        nombre=grupo_data["nombre"],
        periodo=grupo_data["periodo"],
        defaults={
            "programa": grupo_data["programa"],
            "semestre": grupo_data["semestre"],
            "activo": True
        }
    )
    grupos[grupo_data["nombre"]] = grupo
    if created:
        print(f"  ✅ Grupo creado: {grupo.nombre} - {grupo.programa.nombre} (Sem {grupo.semestre})")
    else:
        print(f"  ⏭️  Grupo ya existe: {grupo.nombre}")

# ========== HORARIOS ==========
print("\n📅 Creando Horarios...")

# Función de validación de conflictos
def validar_horario(grupo, asignatura_codigo, docente, espacio, dia, hora_inicio, hora_fin, estudiantes, horarios_existentes):
    """
    Valida que no existan conflictos de horarios.
    Retorna (valido, mensaje_error)
    """
    from collections import defaultdict
    
    # Convertir hora a minutos para comparación
    def hora_a_minutos(hora):
        return hora.hour * 60 + hora.minute
    
    inicio_nuevo = hora_a_minutos(hora_inicio)
    fin_nuevo = hora_a_minutos(hora_fin)
    
    # 1. Validar que el profesor no tenga conflictos
    for h_data in horarios_existentes:
        if h_data['docente'] == docente and h_data['dia'] == dia:
            inicio_exist = hora_a_minutos(h_data['hora_inicio'])
            fin_exist = hora_a_minutos(h_data['hora_fin'])
            
            # Verificar superposición de horarios
            if not (fin_nuevo <= inicio_exist or inicio_nuevo >= fin_exist):
                # Hay superposición - verificar si es la misma clase
                if h_data['asignatura_codigo'] != asignatura_codigo:
                    return False, f"❌ Conflicto: {docente.nombre} ya tiene clase de {h_data['asignatura_codigo']} el {dia} de {h_data['hora_inicio']}-{h_data['hora_fin']}"
    
    # 2. Validar capacidad del espacio para clases compartidas
    # Buscar todas las clases que comparten mismo espacio, docente, asignatura, día y hora
    total_estudiantes = estudiantes
    grupos_compartiendo = [grupo]
    
    for h_data in horarios_existentes:
        if (h_data['espacio'] == espacio and 
            h_data['docente'] == docente and
            h_data['asignatura_codigo'] == asignatura_codigo and
            h_data['dia'] == dia):
            
            inicio_exist = hora_a_minutos(h_data['hora_inicio'])
            fin_exist = hora_a_minutos(h_data['hora_fin'])
            
            # Verificar si comparten el mismo horario exacto
            if inicio_nuevo == inicio_exist and fin_nuevo == fin_exist:
                total_estudiantes += h_data['estudiantes']
                grupos_compartiendo.append(h_data['grupo'])
    
    if total_estudiantes > espacio.capacidad:
        grupos_str = ', '.join([g.nombre if hasattr(g, 'nombre') else g for g in grupos_compartiendo])
        return False, f"❌ Capacidad excedida: {total_estudiantes} estudiantes ({grupos_str}) exceden capacidad de {espacio.nombre} ({espacio.capacidad})"
    
    # 3. Validar que el espacio no esté ocupado por otra clase diferente
    for h_data in horarios_existentes:
        if h_data['espacio'] == espacio and h_data['dia'] == dia:
            inicio_exist = hora_a_minutos(h_data['hora_inicio'])
            fin_exist = hora_a_minutos(h_data['hora_fin'])
            
            # Verificar superposición
            if not (fin_nuevo <= inicio_exist or inicio_nuevo >= fin_exist):
                # Hay superposición - verificar si NO es la misma clase
                if not (h_data['docente'] == docente and h_data['asignatura_codigo'] == asignatura_codigo):
                    return False, f"❌ Conflicto: Espacio {espacio.nombre} ocupado el {dia} de {h_data['hora_inicio']}-{h_data['hora_fin']} por {h_data['grupo']}"
    
    return True, "✅ Horario válido"

# Crear/obtener docentes para diferentes áreas
print("  👨‍🏫 Configurando docentes...")

# Obtener el rol de docente
rol_docente, _ = Rol.objects.get_or_create(
    nombre='docente',
    defaults={'descripcion': 'Docente'}
)

# Docentes de Matemáticas y Ciencias Básicas
docente_matematicas, _ = Usuario.objects.get_or_create(
    correo="docente.matematicas@unilibre.edu.co",
    defaults={
        "nombre": "Dr. Carlos Rodríguez",
        "activo": True,
        "contrasena_hash": "doc123",
        "rol": rol_docente
    }
)

docente_fisica, _ = Usuario.objects.get_or_create(
    correo="docente.fisica@unilibre.edu.co",
    defaults={
        "nombre": "Dra. María González",
        "activo": True,
        "contrasena_hash": "doc123",
        "rol": rol_docente
    }
)

# Docentes de Ingeniería de Sistemas
docente_programacion, _ = Usuario.objects.get_or_create(
    correo="docente.programacion@unilibre.edu.co",
    defaults={
        "nombre": "Ing. Luis Martínez",
        "activo": True,
        "contrasena_hash": "doc123",
        "rol": rol_docente
    }
)

docente_bd, _ = Usuario.objects.get_or_create(
    correo="docente.bd@unilibre.edu.co",
    defaults={
        "nombre": "Ing. Ana Pérez",
        "activo": True,
        "contrasena_hash": "doc123",
        "rol": rol_docente
    }
)

# Docentes de Ingeniería Industrial
docente_estadistica, _ = Usuario.objects.get_or_create(
    correo="docente.estadistica@unilibre.edu.co",
    defaults={
        "nombre": "Dr. Jorge López",
        "activo": True,
        "contrasena_hash": "doc123",
        "rol": rol_docente
    }
)

docente_industrial, _ = Usuario.objects.get_or_create(
    correo="docente.industrial@unilibre.edu.co",
    defaults={
        "nombre": "Ing. Patricia Ramírez",
        "activo": True,
        "contrasena_hash": "doc123",
        "rol": rol_docente
    }
)

# Docentes de Ingeniería Civil
docente_civil, _ = Usuario.objects.get_or_create(
    correo="docente.civil@unilibre.edu.co",
    defaults={
        "nombre": "Ing. Roberto Sánchez",
        "activo": True,
        "contrasena_hash": "doc123",
        "rol": rol_docente
    }
)

# Docentes de Ciencias Económicas
docente_administracion, _ = Usuario.objects.get_or_create(
    correo="docente.administracion@unilibre.edu.co",
    defaults={
        "nombre": "Mg. Carmen Torres",
        "activo": True,
        "contrasena_hash": "doc123",
        "rol": rol_docente
    }
)

docente_contabilidad, _ = Usuario.objects.get_or_create(
    correo="docente.contabilidad@unilibre.edu.co",
    defaults={
        "nombre": "Cont. Diana Vargas",
        "activo": True,
        "contrasena_hash": "doc123",
        "rol": rol_docente
    }
)

# Docentes de Humanidades
docente_humanidades, _ = Usuario.objects.get_or_create(
    correo="docente.humanidades@unilibre.edu.co",
    defaults={
        "nombre": "Lic. Alberto Castro",
        "activo": True,
        "contrasena_hash": "doc123",
        "rol": rol_docente
    }
)

docente_ingles, _ = Usuario.objects.get_or_create(
    correo="docente.ingles@unilibre.edu.co",
    defaults={
        "nombre": "Lic. Sandra Morales",
        "activo": True,
        "contrasena_hash": "doc123",
        "rol": rol_docente
    }
)

print(f"  ✅ {Usuario.objects.filter(activo=True).count()} docentes configurados")

# Definir horarios con docentes específicos para cada asignatura
horarios_data = [
    # ==================== SEMESTRE 1 ====================
    
    # Sistemas-A (Semestre 1)
    {"grupo": "Sistemas-A", "asignatura_codigo": "MAT101", "docente": docente_matematicas, "espacio": "A-203", "dia": "lunes", "hora_inicio": time(7, 0), "hora_fin": time(9, 0), "estudiantes": 35},
    {"grupo": "Sistemas-A", "asignatura_codigo": "FIS101", "docente": docente_fisica, "espacio": "LAB-101", "dia": "martes", "hora_inicio": time(7, 0), "hora_fin": time(9, 0), "estudiantes": 35},
    {"grupo": "Sistemas-A", "asignatura_codigo": "SIS101", "docente": docente_programacion, "espacio": "COMP-101", "dia": "miércoles", "hora_inicio": time(7, 0), "hora_fin": time(9, 0), "estudiantes": 35},
    {"grupo": "Sistemas-A", "asignatura_codigo": "HUM101", "docente": docente_humanidades, "espacio": "A-101", "dia": "jueves", "hora_inicio": time(9, 0), "hora_fin": time(11, 0), "estudiantes": 35},
    {"grupo": "Sistemas-A", "asignatura_codigo": "ING101", "docente": docente_ingles, "espacio": "A-102", "dia": "viernes", "hora_inicio": time(7, 0), "hora_fin": time(9, 0), "estudiantes": 35},
    
    # Sistemas-B (Semestre 1) - Cálculo I en horario diferente
    {"grupo": "Sistemas-B", "asignatura_codigo": "MAT101", "docente": docente_matematicas, "espacio": "A-201", "dia": "lunes", "hora_inicio": time(9, 0), "hora_fin": time(11, 0), "estudiantes": 30},
    {"grupo": "Sistemas-B", "asignatura_codigo": "FIS101", "docente": docente_fisica, "espacio": "LAB-102", "dia": "martes", "hora_inicio": time(9, 0), "hora_fin": time(11, 0), "estudiantes": 30},
    {"grupo": "Sistemas-B", "asignatura_codigo": "SIS101", "docente": docente_programacion, "espacio": "COMP-102", "dia": "miércoles", "hora_inicio": time(9, 0), "hora_fin": time(11, 0), "estudiantes": 30},
    {"grupo": "Sistemas-B", "asignatura_codigo": "HUM101", "docente": docente_humanidades, "espacio": "A-102", "dia": "jueves", "hora_inicio": time(11, 0), "hora_fin": time(13, 0), "estudiantes": 30},
    {"grupo": "Sistemas-B", "asignatura_codigo": "ING101", "docente": docente_ingles, "espacio": "A-103", "dia": "viernes", "hora_inicio": time(9, 0), "hora_fin": time(11, 0), "estudiantes": 30},
    
    # Industrial-A (Semestre 1) - Cálculo I en horario diferente
    {"grupo": "Industrial-A", "asignatura_codigo": "MAT101", "docente": docente_matematicas, "espacio": "A-202", "dia": "lunes", "hora_inicio": time(11, 0), "hora_fin": time(13, 0), "estudiantes": 25},
    {"grupo": "Industrial-A", "asignatura_codigo": "FIS101", "docente": docente_fisica, "espacio": "LAB-101", "dia": "miércoles", "hora_inicio": time(11, 0), "hora_fin": time(13, 0), "estudiantes": 25},
    {"grupo": "Industrial-A", "asignatura_codigo": "HUM101", "docente": docente_humanidades, "espacio": "A-201", "dia": "jueves", "hora_inicio": time(7, 0), "hora_fin": time(9, 0), "estudiantes": 25},
    {"grupo": "Industrial-A", "asignatura_codigo": "ING101", "docente": docente_ingles, "espacio": "A-202", "dia": "viernes", "hora_inicio": time(11, 0), "hora_fin": time(13, 0), "estudiantes": 25},
    {"grupo": "Industrial-A", "asignatura_codigo": "ADM101", "docente": docente_administracion, "espacio": "A-201", "dia": "martes", "hora_inicio": time(7, 0), "hora_fin": time(9, 0), "estudiantes": 25},
    
    # Civil-A (Semestre 1)
    {"grupo": "Civil-A", "asignatura_codigo": "MAT101", "docente": docente_matematicas, "espacio": "A-101", "dia": "martes", "hora_inicio": time(7, 0), "hora_fin": time(9, 0), "estudiantes": 28},
    {"grupo": "Civil-A", "asignatura_codigo": "FIS101", "docente": docente_fisica, "espacio": "LAB-201", "dia": "martes", "hora_inicio": time(11, 0), "hora_fin": time(13, 0), "estudiantes": 28},
    {"grupo": "Civil-A", "asignatura_codigo": "HUM101", "docente": docente_humanidades, "espacio": "A-103", "dia": "miércoles", "hora_inicio": time(7, 0), "hora_fin": time(9, 0), "estudiantes": 28},
    {"grupo": "Civil-A", "asignatura_codigo": "ING101", "docente": docente_ingles, "espacio": "A-103", "dia": "jueves", "hora_inicio": time(7, 0), "hora_fin": time(9, 0), "estudiantes": 28},
    
    # Admin-A (Semestre 1)
    {"grupo": "Admin-A", "asignatura_codigo": "MAT101", "docente": docente_matematicas, "espacio": "A-101", "dia": "miércoles", "hora_inicio": time(9, 0), "hora_fin": time(11, 0), "estudiantes": 32},
    {"grupo": "Admin-A", "asignatura_codigo": "CON101", "docente": docente_contabilidad, "espacio": "A-203", "dia": "miércoles", "hora_inicio": time(9, 0), "hora_fin": time(11, 0), "estudiantes": 32},
    {"grupo": "Admin-A", "asignatura_codigo": "ADM101", "docente": docente_administracion, "espacio": "A-203", "dia": "jueves", "hora_inicio": time(9, 0), "hora_fin": time(11, 0), "estudiantes": 32},
    {"grupo": "Admin-A", "asignatura_codigo": "HUM101", "docente": docente_humanidades, "espacio": "A-202", "dia": "viernes", "hora_inicio": time(9, 0), "hora_fin": time(11, 0), "estudiantes": 32},
    {"grupo": "Admin-A", "asignatura_codigo": "ING101", "docente": docente_ingles, "espacio": "A-201", "dia": "lunes", "hora_inicio": time(9, 0), "hora_fin": time(11, 0), "estudiantes": 32},
    
    # ==================== SEMESTRE 2 ====================
    
    # Sistemas-2A (Semestre 2)
    {"grupo": "Sistemas-2A", "asignatura_codigo": "MAT102", "docente": docente_matematicas, "espacio": "A-101", "dia": "lunes", "hora_inicio": time(11, 0), "hora_fin": time(13, 0), "estudiantes": 30},
    {"grupo": "Sistemas-2A", "asignatura_codigo": "FIS102", "docente": docente_fisica, "espacio": "LAB-102", "dia": "martes", "hora_inicio": time(7, 0), "hora_fin": time(9, 0), "estudiantes": 30},
    {"grupo": "Sistemas-2A", "asignatura_codigo": "SIS102", "docente": docente_programacion, "espacio": "COMP-101", "dia": "miércoles", "hora_inicio": time(11, 0), "hora_fin": time(13, 0), "estudiantes": 30},
    {"grupo": "Sistemas-2A", "asignatura_codigo": "MAT104", "docente": docente_matematicas, "espacio": "A-102", "dia": "jueves", "hora_inicio": time(7, 0), "hora_fin": time(9, 0), "estudiantes": 30},
    {"grupo": "Sistemas-2A", "asignatura_codigo": "ING102", "docente": docente_ingles, "espacio": "A-101", "dia": "viernes", "hora_inicio": time(9, 0), "hora_fin": time(11, 0), "estudiantes": 30},
    
    # Industrial-2A (Semestre 2)
    {"grupo": "Industrial-2A", "asignatura_codigo": "MAT102", "docente": docente_matematicas, "espacio": "A-203", "dia": "lunes", "hora_inicio": time(9, 0), "hora_fin": time(11, 0), "estudiantes": 26},
    {"grupo": "Industrial-2A", "asignatura_codigo": "FIS102", "docente": docente_fisica, "espacio": "LAB-201", "dia": "martes", "hora_inicio": time(9, 0), "hora_fin": time(11, 0), "estudiantes": 26},
    {"grupo": "Industrial-2A", "asignatura_codigo": "MAT104", "docente": docente_matematicas, "espacio": "A-202", "dia": "miércoles", "hora_inicio": time(9, 0), "hora_fin": time(11, 0), "estudiantes": 26},
    {"grupo": "Industrial-2A", "asignatura_codigo": "ING102", "docente": docente_ingles, "espacio": "A-203", "dia": "jueves", "hora_inicio": time(11, 0), "hora_fin": time(13, 0), "estudiantes": 26},
    {"grupo": "Industrial-2A", "asignatura_codigo": "EST101", "docente": docente_estadistica, "espacio": "A-201", "dia": "viernes", "hora_inicio": time(7, 0), "hora_fin": time(9, 0), "estudiantes": 26},
    
    # Civil-2A (Semestre 2)
    {"grupo": "Civil-2A", "asignatura_codigo": "MAT102", "docente": docente_matematicas, "espacio": "A-202", "dia": "lunes", "hora_inicio": time(7, 0), "hora_fin": time(9, 0), "estudiantes": 24},
    {"grupo": "Civil-2A", "asignatura_codigo": "FIS102", "docente": docente_fisica, "espacio": "LAB-102", "dia": "miércoles", "hora_inicio": time(11, 0), "hora_fin": time(13, 0), "estudiantes": 24},
    {"grupo": "Civil-2A", "asignatura_codigo": "MAT104", "docente": docente_matematicas, "espacio": "A-103", "dia": "jueves", "hora_inicio": time(9, 0), "hora_fin": time(11, 0), "estudiantes": 24},
    {"grupo": "Civil-2A", "asignatura_codigo": "ING102", "docente": docente_ingles, "espacio": "A-102", "dia": "viernes", "hora_inicio": time(11, 0), "hora_fin": time(13, 0), "estudiantes": 24},
    
    # Admin-2A (Semestre 2)
    {"grupo": "Admin-2A", "asignatura_codigo": "EST101", "docente": docente_estadistica, "espacio": "A-203", "dia": "lunes", "hora_inicio": time(7, 0), "hora_fin": time(9, 0), "estudiantes": 28},
    {"grupo": "Admin-2A", "asignatura_codigo": "CON201", "docente": docente_contabilidad, "espacio": "A-203", "dia": "martes", "hora_inicio": time(9, 0), "hora_fin": time(11, 0), "estudiantes": 28},
    {"grupo": "Admin-2A", "asignatura_codigo": "ADM201", "docente": docente_administracion, "espacio": "A-201", "dia": "miércoles", "hora_inicio": time(11, 0), "hora_fin": time(13, 0), "estudiantes": 28},
    {"grupo": "Admin-2A", "asignatura_codigo": "ECO101", "docente": docente_administracion, "espacio": "A-202", "dia": "jueves", "hora_inicio": time(7, 0), "hora_fin": time(9, 0), "estudiantes": 28},
    {"grupo": "Admin-2A", "asignatura_codigo": "ING102", "docente": docente_ingles, "espacio": "A-203", "dia": "viernes", "hora_inicio": time(9, 0), "hora_fin": time(11, 0), "estudiantes": 28},
    
    # ==================== SEMESTRE 3 ====================
    
    # Sistemas-3A (Semestre 3)
    {"grupo": "Sistemas-3A", "asignatura_codigo": "MAT103", "docente": docente_matematicas, "espacio": "A-102", "dia": "lunes", "hora_inicio": time(9, 0), "hora_fin": time(11, 0), "estudiantes": 28},
    {"grupo": "Sistemas-3A", "asignatura_codigo": "SIS201", "docente": docente_programacion, "espacio": "COMP-201", "dia": "martes", "hora_inicio": time(9, 0), "hora_fin": time(11, 0), "estudiantes": 28},
    {"grupo": "Sistemas-3A", "asignatura_codigo": "SIS202", "docente": docente_bd, "espacio": "COMP-101", "dia": "miércoles", "hora_inicio": time(9, 0), "hora_fin": time(11, 0), "estudiantes": 28},
    {"grupo": "Sistemas-3A", "asignatura_codigo": "ING103", "docente": docente_ingles, "espacio": "A-101", "dia": "jueves", "hora_inicio": time(11, 0), "hora_fin": time(13, 0), "estudiantes": 28},
    
    # Industrial-3A (Semestre 3)
    {"grupo": "Industrial-3A", "asignatura_codigo": "MAT103", "docente": docente_matematicas, "espacio": "A-201", "dia": "martes", "hora_inicio": time(11, 0), "hora_fin": time(13, 0), "estudiantes": 22},
    {"grupo": "Industrial-3A", "asignatura_codigo": "EST102", "docente": docente_estadistica, "espacio": "A-202", "dia": "miércoles", "hora_inicio": time(7, 0), "hora_fin": time(9, 0), "estudiantes": 22},
    {"grupo": "Industrial-3A", "asignatura_codigo": "IND201", "docente": docente_industrial, "espacio": "A-203", "dia": "jueves", "hora_inicio": time(7, 0), "hora_fin": time(9, 0), "estudiantes": 22},
    {"grupo": "Industrial-3A", "asignatura_codigo": "ING103", "docente": docente_ingles, "espacio": "A-202", "dia": "viernes", "hora_inicio": time(11, 0), "hora_fin": time(13, 0), "estudiantes": 22},
    
    # ==================== SEMESTRE 4 ====================
    
    # Sistemas-4A (Semestre 4)
    {"grupo": "Sistemas-4A", "asignatura_codigo": "SIS203", "docente": docente_bd, "espacio": "COMP-201", "dia": "lunes", "hora_inicio": time(7, 0), "hora_fin": time(9, 0), "estudiantes": 26},
    {"grupo": "Sistemas-4A", "asignatura_codigo": "SIS301", "docente": docente_programacion, "espacio": "COMP-102", "dia": "martes", "hora_inicio": time(11, 0), "hora_fin": time(13, 0), "estudiantes": 26},
    {"grupo": "Sistemas-4A", "asignatura_codigo": "EST101", "docente": docente_estadistica, "espacio": "A-103", "dia": "miércoles", "hora_inicio": time(11, 0), "hora_fin": time(13, 0), "estudiantes": 26},
    {"grupo": "Sistemas-4A", "asignatura_codigo": "HUM201", "docente": docente_humanidades, "espacio": "A-102", "dia": "viernes", "hora_inicio": time(7, 0), "hora_fin": time(9, 0), "estudiantes": 26},
    
    # Industrial-4A (Semestre 4)
    {"grupo": "Industrial-4A", "asignatura_codigo": "IND202", "docente": docente_industrial, "espacio": "A-201", "dia": "lunes", "hora_inicio": time(11, 0), "hora_fin": time(13, 0), "estudiantes": 20},
    {"grupo": "Industrial-4A", "asignatura_codigo": "IND301", "docente": docente_industrial, "espacio": "TALLER-1", "dia": "miércoles", "hora_inicio": time(7, 0), "hora_fin": time(10, 0), "estudiantes": 20},
    {"grupo": "Industrial-4A", "asignatura_codigo": "HUM201", "docente": docente_humanidades, "espacio": "A-203", "dia": "viernes", "hora_inicio": time(7, 0), "hora_fin": time(9, 0), "estudiantes": 20},
    
    # ==================== SEMESTRE 5 ====================
    
    # Sistemas-5A (Semestre 5)
    {"grupo": "Sistemas-5A", "asignatura_codigo": "SIS302", "docente": docente_programacion, "espacio": "COMP-201", "dia": "lunes", "hora_inicio": time(9, 0), "hora_fin": time(11, 0), "estudiantes": 24},
    {"grupo": "Sistemas-5A", "asignatura_codigo": "SIS303", "docente": docente_bd, "espacio": "COMP-102", "dia": "martes", "hora_inicio": time(7, 0), "hora_fin": time(9, 0), "estudiantes": 24},
    {"grupo": "Sistemas-5A", "asignatura_codigo": "SIS304", "docente": docente_programacion, "espacio": "COMP-101", "dia": "jueves", "hora_inicio": time(7, 0), "hora_fin": time(9, 0), "estudiantes": 24},
    {"grupo": "Sistemas-5A", "asignatura_codigo": "HUM202", "docente": docente_humanidades, "espacio": "A-103", "dia": "viernes", "hora_inicio": time(9, 0), "hora_fin": time(11, 0), "estudiantes": 24},
]

contador_horarios = 0
contador_actualizados = 0
contador_rechazados = 0
horarios_creados = []  # Para validación

for horario_data in horarios_data:
    grupo = grupos.get(horario_data["grupo"])
    if not grupo:
        print(f"  ⚠️  Grupo {horario_data['grupo']} no encontrado")
        continue
    
    # Buscar la asignatura en el pensum del programa y semestre del grupo
    asignatura_programa = AsignaturaPrograma.objects.filter(
        programa=grupo.programa,
        asignatura__codigo=horario_data["asignatura_codigo"],
        semestre=grupo.semestre
    ).first()
    
    if not asignatura_programa:
        print(f"  ⚠️  Asignatura {horario_data['asignatura_codigo']} no encontrada en pensum de {grupo.nombre}")
        continue
    
    asignatura = asignatura_programa.asignatura
    espacio = espacios.get(horario_data["espacio"])
    if not espacio:
        print(f"  ⚠️  Espacio {horario_data['espacio']} no encontrado")
        continue
    
    # VALIDAR CONFLICTOS ANTES DE CREAR
    valido, mensaje = validar_horario(
        grupo=grupo.nombre,
        asignatura_codigo=horario_data["asignatura_codigo"],
        docente=horario_data["docente"],
        espacio=espacio,
        dia=horario_data["dia"],
        hora_inicio=horario_data["hora_inicio"],
        hora_fin=horario_data["hora_fin"],
        estudiantes=horario_data["estudiantes"],
        horarios_existentes=horarios_creados
    )
    
    if not valido:
        contador_rechazados += 1
        print(f"  {mensaje}")
        continue
    
    # Intentar actualizar horario existente o crear uno nuevo
    horario, created = Horario.objects.update_or_create(
        grupo=grupo,
        asignatura=asignatura,
        dia_semana=horario_data["dia"],
        hora_inicio=horario_data["hora_inicio"],
        hora_fin=horario_data["hora_fin"],
        defaults={
            "docente": horario_data["docente"],
            "espacio": espacio,
            "cantidad_estudiantes": horario_data["estudiantes"]
        }
    )
    
    # Agregar a la lista de horarios creados para validaciones futuras
    horarios_creados.append({
        'grupo': grupo.nombre,
        'asignatura_codigo': horario_data["asignatura_codigo"],
        'docente': horario_data["docente"],
        'espacio': espacio,
        'dia': horario_data["dia"],
        'hora_inicio': horario_data["hora_inicio"],
        'hora_fin': horario_data["hora_fin"],
        'estudiantes': horario_data["estudiantes"]
    })
    
    if created:
        contador_horarios += 1
        print(f"  ✅ Horario creado: {grupo.nombre} - {asignatura.nombre} - {horario_data['docente'].nombre} ({horario_data['dia']} {horario_data['hora_inicio']}-{horario_data['hora_fin']})")
    else:
        contador_actualizados += 1
        print(f"  🔄 Horario actualizado: {grupo.nombre} - {asignatura.nombre} - {horario_data['docente'].nombre}")

if contador_rechazados > 0:
    print(f"\n  ⚠️  {contador_rechazados} horarios rechazados por conflictos")

# ========== ESTUDIANTES ==========
print("\n👨‍🎓 Creando Estudiantes...")

# Obtener el rol de estudiante
rol_estudiante, _ = Rol.objects.get_or_create(
    nombre='estudiante',
    defaults={'descripcion': 'Estudiante'}
)

# Crear estudiantes para cada grupo
estudiantes_data = []
nombres_estudiantes = [
    "Juan", "María", "Carlos", "Ana", "Luis", "Laura", "Pedro", "Sofía",
    "Diego", "Valentina", "Andrés", "Camila", "Miguel", "Isabella", "Santiago",
    "Daniela", "Sebastián", "Gabriela", "Alejandro", "Natalia", "David", "Paula",
    "Felipe", "Carolina", "Jorge", "Andrea", "Daniel", "Juliana", "Ricardo", "Fernanda"
]

apellidos = [
    "García", "Rodríguez", "Martínez", "López", "González", "Pérez", "Sánchez",
    "Ramírez", "Torres", "Flores", "Rivera", "Gómez", "Díaz", "Hernández", "Morales"
]

# Crear estudiantes para cada grupo (basado en cantidad_estudiantes promedio)
estudiantes_por_grupo = {}
contador_estudiantes = 0

for grupo_nombre, grupo in grupos.items():
    # Determinar cantidad aproximada de estudiantes por grupo
    cantidad = {
        "Sistemas-A": 35, "Sistemas-B": 30, "Sistemas-2A": 30, "Sistemas-3A": 28,
        "Sistemas-4A": 26, "Sistemas-5A": 24, "Industrial-A": 25, "Industrial-2A": 26,
        "Industrial-3A": 22, "Industrial-4A": 20, "Civil-A": 28, "Civil-2A": 24,
        "Admin-A": 32, "Admin-2A": 28
    }.get(grupo_nombre, 25)
    
    estudiantes_grupo = []
    for i in range(cantidad):
        nombre_completo = f"{random.choice(nombres_estudiantes)} {random.choice(apellidos)} {random.choice(apellidos)}"
        correo = f"estudiante.{grupo_nombre.lower()}.{i+1}@unilibre.edu.co"
        
        estudiante, created = Usuario.objects.get_or_create(
            correo=correo,
            defaults={
                "nombre": nombre_completo,
                "activo": True,
                "contrasena_hash": "est123",
                "rol": rol_estudiante
            }
        )
        
        if created:
            contador_estudiantes += 1
        
        estudiantes_grupo.append(estudiante)
    
    estudiantes_por_grupo[grupo_nombre] = estudiantes_grupo
    print(f"  ✅ {len(estudiantes_grupo)} estudiantes para {grupo_nombre}")

print(f"  ✅ Total estudiantes creados: {contador_estudiantes}")

# ========== ACTUALIZAR ROLES DE USUARIOS EXISTENTES ==========
print("\n🔄 Actualizando roles de usuarios existentes...")

# Actualizar docentes que no tienen rol
docentes_sin_rol = Usuario.objects.filter(
    correo__startswith='docente.',
    rol__isnull=True
)
docentes_actualizados = docentes_sin_rol.update(rol=rol_docente)
if docentes_actualizados > 0:
    print(f"  ✅ {docentes_actualizados} docentes actualizados con rol")

# Actualizar estudiantes que no tienen rol
estudiantes_sin_rol = Usuario.objects.filter(
    correo__startswith='estudiante.',
    rol__isnull=True
)
estudiantes_actualizados = estudiantes_sin_rol.update(rol=rol_estudiante)
if estudiantes_actualizados > 0:
    print(f"  ✅ {estudiantes_actualizados} estudiantes actualizados con rol")

# ========== INSCRIPCIONES A HORARIOS ==========
print("\n📝 Inscribiendo estudiantes a horarios...")

contador_inscripciones = 0
for horario in Horario.objects.all():
    grupo_nombre = horario.grupo.nombre
    estudiantes = estudiantes_por_grupo.get(grupo_nombre, [])
    
    # Inscribir a todos los estudiantes del grupo en el horario
    for estudiante in estudiantes:
        inscripcion, created = HorarioEstudiante.objects.get_or_create(
            horario=horario,
            estudiante=estudiante
        )
        if created:
            contador_inscripciones += 1

print(f"  ✅ {contador_inscripciones} inscripciones creadas")

print(f"\n✨ ¡Proceso completado!")
print(f"   - Periodos: {PeriodoAcademico.objects.count()}")
print(f"   - Tipos de Espacios: {TipoEspacio.objects.count()}")
print(f"   - Espacios Físicos: {EspacioFisico.objects.count()}")
print(f"   - Recursos Asignados: {EspacioRecurso.objects.count()}")
print(f"   - Grupos: {Grupo.objects.count()}")
print(f"   - Docentes: {Usuario.objects.filter(activo=True).count()}")
print(f"   - Estudiantes: {len([e for grupo_est in estudiantes_por_grupo.values() for e in grupo_est])}")
print(f"   - Horarios: {Horario.objects.count()} ({contador_horarios} nuevos, {contador_actualizados} actualizados)")
print(f"   - Inscripciones: {HorarioEstudiante.objects.count()}")

# Ejecutar script prestamos
print("\n" + "="*60)
print("Ejecutando Fase 3: Datos Préstamos...")
print("="*60)
exec(open('seed_prestamos.py').read())