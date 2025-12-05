"""
Script para reordenar los tipos de actividad
dejando "Otro" como el último registro
"""

from prestamos.models import TipoActividad, PrestamoEspacio
from django.db import connection, transaction

print("=" * 70)
print("🔄 REORDENANDO TIPOS DE ACTIVIDAD")
print("=" * 70)

print("\n📊 Estado inicial:")
print("-" * 50)
tipos_actuales = list(TipoActividad.objects.all().order_by('id'))
for tipo in tipos_actuales:
    count = PrestamoEspacio.objects.filter(tipo_actividad=tipo).count()
    print(f"ID {tipo.id}: {tipo.nombre} ({count} préstamos)")

# Orden deseado (Otro al final)
orden_deseado = [
    ('Clase Adicional', 'Clase fuera del horario habitual'),
    ('Tutoria Grupal', 'Sesion de tutoria para grupos'),
    ('Conferencia', 'Evento tipo conferencia o charla'),
    ('Taller', 'Actividad practica o taller'),
    ('Reunion Academica', 'Reunion de docentes o area'),
    ('Asesoria de Proyecto', 'Asesoria para proyectos de grado o investigacion'),
    ('Examen Especial', 'Examen de validacion o supletorio'),
    ('Evento Cultural', 'Actividad cultural o artistica'),
    ('Otro', 'Otras actividades academicas')  # Siempre al final
]

print("\n🔄 Iniciando reordenamiento...")
print("-" * 50)

with transaction.atomic():
    # Crear diccionario con tipos existentes
    tipos_existentes = {tipo.nombre: tipo for tipo in tipos_actuales}
    
    # Crear tabla temporal para mapeo de IDs
    mapeo_ids = {}
    
    # Eliminar todos los tipos temporalmente (si no tienen préstamos)
    # O usar un ID temporal muy alto para evitar conflictos
    
    print("\n1️⃣ Moviendo tipos existentes a IDs temporales...")
    id_temporal = 1000
    for tipo in tipos_actuales:
        # Actualizar a ID temporal para liberar los IDs bajos
        with connection.cursor() as cursor:
            cursor.execute(
                "UPDATE prestamos_tipoactividad SET id = %s WHERE id = %s",
                [id_temporal, tipo.id]
            )
        mapeo_ids[tipo.nombre] = (tipo.id, id_temporal)
        print(f"   {tipo.nombre}: ID {tipo.id} → {id_temporal}")
        id_temporal += 1
    
    # Resetear la secuencia
    with connection.cursor() as cursor:
        cursor.execute("ALTER SEQUENCE prestamos_tipoactividad_id_seq RESTART WITH 1")
    
    print("\n2️⃣ Reasignando IDs en el orden correcto...")
    nuevo_id = 1
    for nombre, descripcion in orden_deseado:
        if nombre in tipos_existentes:
            # Obtener el ID temporal actual
            _, id_temp = mapeo_ids[nombre]
            
            # Actualizar a nuevo ID secuencial
            with connection.cursor() as cursor:
                cursor.execute(
                    "UPDATE prestamos_tipoactividad SET id = %s WHERE id = %s",
                    [nuevo_id, id_temp]
                )
            print(f"   {nombre}: {nuevo_id}")
            nuevo_id += 1
        else:
            # Crear el tipo si no existe
            TipoActividad.objects.create(
                id=nuevo_id,
                nombre=nombre,
                descripcion=descripcion
            )
            print(f"   {nombre}: {nuevo_id} (creado)")
            nuevo_id += 1
    
    # Actualizar la secuencia al valor correcto
    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT setval('prestamos_tipoactividad_id_seq', %s, true)",
            [nuevo_id - 1]
        )
    
    print("\n✅ Reordenamiento completado")

print("\n📊 Estado final:")
print("-" * 50)
tipos_finales = list(TipoActividad.objects.all().order_by('id'))
for tipo in tipos_finales:
    count = PrestamoEspacio.objects.filter(tipo_actividad=tipo).count()
    print(f"ID {tipo.id}: {tipo.nombre} ({count} préstamos)")

print(f"\n✨ Total de tipos: {TipoActividad.objects.count()}")
print("🎯 'Otro' ahora es el último registro")
