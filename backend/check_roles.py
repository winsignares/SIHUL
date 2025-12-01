from usuarios.models import Usuario, Rol

print("\n📊 Usuarios por Rol:\n")
for rol in Rol.objects.all():
    usuarios_count = Usuario.objects.filter(rol=rol).count()
    print(f"  {rol.nombre}: {usuarios_count} usuarios")

sin_rol = Usuario.objects.filter(rol__isnull=True).count()
print(f"\n  Sin rol: {sin_rol} usuarios")

print(f"\n📋 Muestra de Docentes con rol:\n")
docentes = Usuario.objects.select_related('rol').filter(correo__startswith='docente.')[:10]
for u in docentes:
    print(f"  {u.nombre} - Rol: {u.rol.nombre if u.rol else 'Sin rol'}")
    print(f"    📧 {u.correo}")

print(f"\n📋 Muestra de Estudiantes con rol:\n")
estudiantes = Usuario.objects.select_related('rol').filter(correo__startswith='estudiante.')[:10]
for u in estudiantes:
    print(f"  {u.nombre} - Rol: {u.rol.nombre if u.rol else 'Sin rol'}")
    print(f"    📧 {u.correo}")

print(f"\n✅ Resumen:")
print(f"   - Total usuarios: {Usuario.objects.count()}")
print(f"   - Con rol asignado: {Usuario.objects.exclude(rol__isnull=True).count()}")
print(f"   - Sin rol: {Usuario.objects.filter(rol__isnull=True).count()}")
