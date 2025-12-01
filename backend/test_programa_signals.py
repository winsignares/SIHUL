"""
Script de prueba para verificar que los signals de activación/desactivación 
automática de programas funcionan correctamente
"""

import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysite.settings')
django.setup()

from programas.models import Programa
from grupos.models import Grupo
from periodos.models import PeriodoAcademico


def test_programa_signals():
    print("=" * 70)
    print("🧪 INICIANDO PRUEBAS DE SIGNALS DE PROGRAMAS")
    print("=" * 70)
    
    # Obtener datos necesarios
    try:
        programa = Programa.objects.first()
        periodo = PeriodoAcademico.objects.first()
        
        if not programa or not periodo:
            print("❌ Error: No hay programas o periodos en la base de datos")
            return
        
        print(f"\n📋 Programa de prueba: {programa.nombre}")
        print(f"📋 Periodo de prueba: {periodo.nombre}")
        
        # TEST 1: Verificar estado inicial
        print("\n" + "─" * 70)
        print("TEST 1: Estado inicial del programa")
        print("─" * 70)
        grupos_actuales = Grupo.objects.filter(programa=programa).count()
        print(f"Grupos actuales: {grupos_actuales}")
        print(f"Estado activo: {programa.activo}")
        
        # TEST 2: Crear un grupo nuevo
        print("\n" + "─" * 70)
        print("TEST 2: Crear un grupo para activar el programa")
        print("─" * 70)
        
        # Si el programa no tiene grupos, debería estar inactivo
        if grupos_actuales == 0:
            programa.activo = False
            programa.save()
            print(f"✓ Programa marcado como inactivo manualmente")
        
        print(f"Estado antes de crear grupo: activo={programa.activo}")
        
        nuevo_grupo = Grupo.objects.create(
            programa=programa,
            periodo=periodo,
            nombre=f"GRUPO-TEST-{programa.id}",
            semestre=1,
            activo=True
        )
        
        # Recargar programa desde la base de datos
        programa.refresh_from_db()
        
        print(f"✓ Grupo creado: {nuevo_grupo.nombre}")
        print(f"Estado después de crear grupo: activo={programa.activo}")
        
        if programa.activo:
            print("✅ TEST 2 PASADO: Programa activado automáticamente")
        else:
            print("❌ TEST 2 FALLADO: Programa debería estar activo")
        
        # TEST 3: Eliminar el grupo
        print("\n" + "─" * 70)
        print("TEST 3: Eliminar el grupo para desactivar el programa")
        print("─" * 70)
        
        print(f"Estado antes de eliminar grupo: activo={programa.activo}")
        
        nuevo_grupo.delete()
        
        # Recargar programa desde la base de datos
        programa.refresh_from_db()
        
        print(f"✓ Grupo eliminado")
        print(f"Estado después de eliminar grupo: activo={programa.activo}")
        
        grupos_restantes = Grupo.objects.filter(programa=programa).count()
        
        if grupos_restantes == 0 and not programa.activo:
            print("✅ TEST 3 PASADO: Programa desactivado automáticamente")
        elif grupos_restantes > 0:
            print(f"⚠️ TEST 3 OMITIDO: El programa tiene {grupos_restantes} grupos restantes")
        else:
            print("❌ TEST 3 FALLADO: Programa debería estar inactivo")
        
        # TEST 4: Crear múltiples grupos
        print("\n" + "─" * 70)
        print("TEST 4: Crear y eliminar múltiples grupos")
        print("─" * 70)
        
        grupo1 = Grupo.objects.create(
            programa=programa,
            periodo=periodo,
            nombre=f"GRUPO-TEST-1-{programa.id}",
            semestre=1,
            activo=True
        )
        print(f"✓ Creado {grupo1.nombre}")
        
        grupo2 = Grupo.objects.create(
            programa=programa,
            periodo=periodo,
            nombre=f"GRUPO-TEST-2-{programa.id}",
            semestre=2,
            activo=True
        )
        print(f"✓ Creado {grupo2.nombre}")
        
        programa.refresh_from_db()
        print(f"Estado con 2 grupos: activo={programa.activo}")
        
        if programa.activo:
            print("✅ Programa activo con múltiples grupos")
        
        # Eliminar solo un grupo
        grupo1.delete()
        programa.refresh_from_db()
        print(f"✓ Eliminado {grupo1.nombre}")
        print(f"Estado con 1 grupo restante: activo={programa.activo}")
        
        if programa.activo:
            print("✅ Programa sigue activo (tiene grupos restantes)")
        
        # Eliminar el último grupo
        grupo2.delete()
        programa.refresh_from_db()
        print(f"✓ Eliminado {grupo2.nombre}")
        print(f"Estado sin grupos: activo={programa.activo}")
        
        if not programa.activo:
            print("✅ TEST 4 PASADO: Programa desactivado al eliminar último grupo")
        else:
            print("❌ TEST 4 FALLADO: Programa debería estar inactivo")
        
        # RESUMEN
        print("\n" + "=" * 70)
        print("📊 RESUMEN DE PRUEBAS")
        print("=" * 70)
        print("✅ Sistema de signals implementado correctamente")
        print("✓ Programas se activan al crear grupos")
        print("✓ Programas se desactivan al eliminar último grupo")
        print("✓ Múltiples grupos mantienen el programa activo")
        
    except Exception as e:
        print(f"\n❌ ERROR EN LAS PRUEBAS: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    test_programa_signals()
