"""
Script de prueba para verificar que las señales de notificaciones funcionan correctamente
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysite.settings')
django.setup()

from usuarios.models import Usuario, Rol
from notificaciones.models import Notificacion
from notificaciones.signals import set_current_user

print("🧪 PRUEBA DEL SISTEMA DE NOTIFICACIONES")
print("=" * 60)

# Obtener usuario admin para las pruebas
try:
    admin_user = Usuario.objects.get(id=1)
    print(f"✅ Usuario admin encontrado: {admin_user.nombre}")
    set_current_user(admin_user)
except Usuario.DoesNotExist:
    print("❌ No se encontró usuario con ID 1. Las notificaciones se asignarán al sistema.")
    admin_user = None

# Contar notificaciones iniciales
count_inicial = Notificacion.objects.count()
print(f"\n📊 Notificaciones iniciales en el sistema: {count_inicial}")

print("\n" + "=" * 60)
print("TEST 1: Crear un Rol")
print("-" * 60)

# Test 1: Crear un Rol
try:
    rol_test, created = Rol.objects.get_or_create(
        nombre='test_rol',
        defaults={'descripcion': 'Rol de prueba'}
    )
    if created:
        print(f"✅ Rol creado: {rol_test.nombre}")
        # Verificar notificación
        notif = Notificacion.objects.filter(tipo_notificacion='ROL_CREADO').last()
        if notif:
            print(f"✅ Notificación generada: {notif.tipo_notificacion}")
            print(f"   Mensaje: {notif.mensaje}")
        else:
            print("❌ No se generó notificación de ROL_CREADO")
    else:
        print(f"ℹ️  Rol ya existía: {rol_test.nombre}")
except Exception as e:
    print(f"❌ Error creando rol: {e}")

print("\n" + "=" * 60)
print("TEST 2: Crear un Usuario")
print("-" * 60)

# Test 2: Crear un Usuario
try:
    import random
    random_num = random.randint(1000, 9999)
    usuario_test, created = Usuario.objects.get_or_create(
        correo=f'test.usuario{random_num}@unilibre.edu.co',
        defaults={
            'nombre': f'Usuario Test {random_num}',
            'contrasena_hash': 'hash_test',
            'rol': rol_test
        }
    )
    if created:
        print(f"✅ Usuario creado: {usuario_test.nombre}")
        # Verificar notificaciones
        notif_creado = Notificacion.objects.filter(tipo_notificacion='USUARIO_CREADO').last()
        notif_cuenta = Notificacion.objects.filter(tipo_notificacion='CUENTA_CREADA').last()
        
        if notif_creado:
            print(f"✅ Notificación USUARIO_CREADO generada")
            print(f"   Mensaje: {notif_creado.mensaje}")
        if notif_cuenta:
            print(f"✅ Notificación CUENTA_CREADA generada para el nuevo usuario")
            print(f"   Mensaje: {notif_cuenta.mensaje}")
    else:
        print(f"ℹ️  Usuario ya existía: {usuario_test.nombre}")
except Exception as e:
    print(f"❌ Error creando usuario: {e}")

print("\n" + "=" * 60)
print("TEST 3: Actualizar Usuario")
print("-" * 60)

# Test 3: Actualizar Usuario
try:
    usuario_test.nombre = f"Usuario Test {random_num} Actualizado"
    usuario_test.save()
    print(f"✅ Usuario actualizado: {usuario_test.nombre}")
    
    # Verificar notificación
    notif = Notificacion.objects.filter(tipo_notificacion='USUARIO_ACTUALIZADO').last()
    if notif:
        print(f"✅ Notificación USUARIO_ACTUALIZADO generada")
        print(f"   Mensaje: {notif.mensaje}")
    else:
        print("❌ No se generó notificación de USUARIO_ACTUALIZADO")
except Exception as e:
    print(f"❌ Error actualizando usuario: {e}")

print("\n" + "=" * 60)
print("TEST 4: Eliminar Usuario de Prueba")
print("-" * 60)

# Test 4: Eliminar Usuario
try:
    nombre_usuario = usuario_test.nombre
    usuario_test.delete()
    print(f"✅ Usuario eliminado: {nombre_usuario}")
    
    # Verificar notificación
    notif = Notificacion.objects.filter(tipo_notificacion='USUARIO_ELIMINADO').last()
    if notif:
        print(f"✅ Notificación USUARIO_ELIMINADO generada")
        print(f"   Mensaje: {notif.mensaje}")
    else:
        print("❌ No se generó notificación de USUARIO_ELIMINADO")
except Exception as e:
    print(f"❌ Error eliminando usuario: {e}")

print("\n" + "=" * 60)
print("TEST 5: Eliminar Rol de Prueba")
print("-" * 60)

# Test 5: Eliminar Rol
try:
    nombre_rol = rol_test.nombre
    rol_test.delete()
    print(f"✅ Rol eliminado: {nombre_rol}")
    
    # Verificar notificación
    notif = Notificacion.objects.filter(tipo_notificacion='ROL_ELIMINADO').last()
    if notif:
        print(f"✅ Notificación ROL_ELIMINADO generada")
        print(f"   Mensaje: {notif.mensaje}")
    else:
        print("❌ No se generó notificación de ROL_ELIMINADO")
except Exception as e:
    print(f"❌ Error eliminando rol: {e}")

print("\n" + "=" * 60)
print("RESUMEN FINAL")
print("=" * 60)

# Contar notificaciones finales
count_final = Notificacion.objects.count()
nuevas_notificaciones = count_final - count_inicial

print(f"📊 Notificaciones iniciales: {count_inicial}")
print(f"📊 Notificaciones finales: {count_final}")
print(f"📊 Nuevas notificaciones generadas: {nuevas_notificaciones}")

print("\n🔍 Últimas 10 notificaciones generadas:")
print("-" * 60)

ultimas = Notificacion.objects.order_by('-fecha_creacion')[:10]
for notif in ultimas:
    print(f"• [{notif.tipo_notificacion}] {notif.mensaje}")
    print(f"  Usuario: {notif.id_usuario} | Prioridad: {notif.prioridad} | Leída: {notif.es_leida}")
    print(f"  Fecha: {notif.fecha_creacion}")
    print()

print("=" * 60)
print("✅ PRUEBA COMPLETADA")
