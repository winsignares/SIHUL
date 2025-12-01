"""
Prueba simple y directa del sistema de signals
"""
from programas.models import Programa
from grupos.models import Grupo
from periodos.models import PeriodoAcademico

print("\n" + "="*70)
print("🧪 PRUEBA SIMPLE DE SIGNALS")
print("="*70)

# Crear programa de prueba
facultad_id = 1  # Asumiendo que existe la facultad 1
p = Programa.objects.create(
    nombre='TEST-SIGNAL-PROGRAMA',
    semestres=10,
    activo=False,
    facultad_id=facultad_id
)
print(f"\n1️⃣ Programa creado: {p.nombre}")
print(f"   Estado inicial: activo={p.activo}")

# Crear un grupo
periodo = PeriodoAcademico.objects.first()
g = Grupo.objects.create(
    programa=p,
    periodo=periodo,
    nombre='TEST-SIGNAL-GRUPO',
    semestre=1,
    activo=True
)

# Recargar programa
p.refresh_from_db()
print(f"\n2️⃣ Grupo creado: {g.nombre}")
print(f"   Programa después de crear grupo: activo={p.activo}")

if p.activo:
    print("   ✅ ÉXITO: Programa activado automáticamente")
else:
    print("   ❌ ERROR: Programa debería estar activo")

# Eliminar el grupo
g.delete()
p.refresh_from_db()
print(f"\n3️⃣ Grupo eliminado")
print(f"   Programa después de eliminar grupo: activo={p.activo}")

if not p.activo:
    print("   ✅ ÉXITO: Programa desactivado automáticamente")
else:
    print("   ❌ ERROR: Programa debería estar inactivo")

# Limpiar
p.delete()
print(f"\n4️⃣ Programa de prueba eliminado\n")
print("="*70)
