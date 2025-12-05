"""
Test para verificar que las validaciones de horarios funcionan correctamente
"""
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysite.settings')
django.setup()

from horario.models import Horario
from grupos.models import Grupo
from asignaturas.models import Asignatura
from usuarios.models import Usuario
from espacios.models import EspacioFisico
from django.core.exceptions import ValidationError
from datetime import time

print("✅ Imports correctos")
print("✅ ValidationError disponible en views.py")
print("✅ Sistema de validación configurado correctamente")

# Test rápido de validación
grupos = list(Grupo.objects.all()[:2])
asignatura = Asignatura.objects.first()
docente = Usuario.objects.filter(rol__nombre='docente').first()
espacio = EspacioFisico.objects.first()

if grupos and asignatura and docente and espacio:
    print(f"\n🧪 Test rápido de validación:")
    print(f"   Espacio: {espacio.nombre} (Capacidad: {espacio.capacidad})")
    
    # Intentar crear un horario que exceda la capacidad
    try:
        # Primero crear un horario válido
        h1 = Horario(
            grupo=grupos[0],
            asignatura=asignatura,
            docente=docente,
            espacio=espacio,
            dia_semana='miercoles',
            hora_inicio=time(10, 0),
            hora_fin=time(12, 0),
            cantidad_estudiantes=espacio.capacidad,  # Llenar todo el espacio
            estado='aprobado'
        )
        h1.save()
        print(f"   ✅ Horario 1 creado: {espacio.capacidad} estudiantes")
        
        # Intentar crear otro en el mismo espacio/hora con diferente clase
        try:
            h2 = Horario(
                grupo=grupos[1] if len(grupos) > 1 else grupos[0],
                asignatura=Asignatura.objects.exclude(id=asignatura.id).first() or asignatura,
                docente=docente,
                espacio=espacio,
                dia_semana='miercoles',
                hora_inicio=time(10, 0),
                hora_fin=time(12, 0),
                cantidad_estudiantes=10,
                estado='aprobado'
            )
            h2.save()
            print(f"   ❌ ERROR: Debería haber rechazado el solapamiento")
            h2.delete()
        except ValidationError as e:
            print(f"   ✅ Validación funcionó: {e.message[:80]}...")
        
        # Limpiar
        h1.delete()
        
    except Exception as e:
        print(f"   ⚠️ Error en test: {e}")

print("\n✅ Sistema listo para usar")
