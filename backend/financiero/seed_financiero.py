"""
Script para cargar datos iniciales de Financiero
Ejecutar: python manage.py shell < financiero/seed_financiero.py
"""

from usuarios.models import Usuario, Rol
from componentes.models import Componente, ComponenteRol
from financiero.models import (
    Departamento, ParametroSLA, ParametrosFinanciero
)
from django.utils import timezone

print("=" * 60)
print("INICIANDO CARGA DE DATOS FINANCIERO")
print("=" * 60)

# ============================================================
# 1. CREAR ROLES FINANCIEROS
# ============================================================
print("\n[1/5] Creando roles financieros...")

roles_financieros = {
    'Funcionario': 'Usuario que recibe facturas de proveedores',
    'Contabilidad': 'Encargado de radicar y causar facturas',
    'Tesorería': 'Prepara pagos y genera comprobantes',
    'Auditoría': 'Revisa documentación y causación',
    'Dirección Financiera': 'Cargue de pagos en portal bancario',
    'Rectoría': 'Autoriza pagos finales',
    'Admin Financiero': 'Administrador del módulo financiero',
    'Proveedor': 'Usuario externo que consulta estado de facturas'
}

roles_dict = {}
for nombre, descripcion in roles_financieros.items():
    rol, created = Rol.objects.get_or_create(
        nombre=nombre,
        defaults={'descripcion': descripcion}
    )
    roles_dict[nombre] = rol
    status = "✅ Creado" if created else "⚠️  Existente"
    print(f"  {status}: {nombre}")

# ============================================================
# 2. CREAR COMPONENTES FINANCIEROS
# ============================================================
print("\n[2/5] Creando componentes financieros...")

componentes_financieros = [
    ('Gestión de Facturas', 'Acceso al módulo de gestión de facturas'),
    ('Registrar Factura', 'Registrar nuevas facturas en el sistema'),
    ('Radicar Factura', 'Radicar facturas recibidas'),
    ('Causar Factura', 'Causar facturas radicadas'),
    ('Alistar Pago', 'Alistar pagos en tesorería'),
    ('Control Previo', 'Realizar control previo de auditoría'),
    ('Cargue de Pago', 'Cargar pagos en portal bancario'),
    ('Autorizar Pago', 'Autorizar pagos finales'),
    ('Consultar Facturas', 'Consultar todas las facturas'),
    ('Reportes Financiero', 'Acceso a reportes financieros'),
    ('Administración Financiera', 'Administración del módulo'),
    ('Dashboard Financiero', 'Ver dashboard de facturas'),
    ('Dashboard Proveedor', 'Dashboard del rol Proveedor'),
    ('Mis Facturas Proveedor', 'Consulta de facturas del proveedor'),
]

componentes_dict = {}
for nombre, descripcion in componentes_financieros:
    componente, created = Componente.objects.get_or_create(
        nombre=nombre,
        defaults={
            'descripcion': descripcion,
        }
    )
    componentes_dict[nombre] = componente
    status = "✅ Creado" if created else "⚠️  Existente"
    print(f"  {status}: {nombre}")

# ============================================================
# 3. ASIGNAR PERMISOS (Rol → Componente)
# ============================================================
print("\n[3/5] Asignando permisos a roles...")

permisos = {
    'Funcionario': [
        'Gestión de Facturas',
        'Registrar Factura',
        'Consultar Facturas',
        'Dashboard Financiero',
    ],
    'Contabilidad': [
        'Gestión de Facturas',
        'Radicar Factura',
        'Causar Factura',
        'Consultar Facturas',
        'Reportes Financiero',
        'Dashboard Financiero',
    ],
    'Tesorería': [
        'Gestión de Facturas',
        'Alistar Pago',
        'Consultar Facturas',
        'Reportes Financiero',
        'Dashboard Financiero',
    ],
    'Auditoría': [
        'Gestión de Facturas',
        'Control Previo',
        'Consultar Facturas',
        'Reportes Financiero',
        'Dashboard Financiero',
    ],
    'Dirección Financiera': [
        'Gestión de Facturas',
        'Cargue de Pago',
        'Consultar Facturas',
        'Reportes Financiero',
        'Dashboard Financiero',
    ],
    'Rectoría': [
        'Gestión de Facturas',
        'Autorizar Pago',
        'Consultar Facturas',
        'Reportes Financiero',
        'Dashboard Financiero',
    ],
    'Admin Financiero': [
        'Gestión de Facturas',
        'Registrar Factura',
        'Radicar Factura',
        'Causar Factura',
        'Alistar Pago',
        'Control Previo',
        'Cargue de Pago',
        'Autorizar Pago',
        'Consultar Facturas',
        'Reportes Financiero',
        'Administración Financiera',
        'Dashboard Financiero',
    ],
    'Proveedor': [
        'Dashboard Proveedor',
        'Mis Facturas Proveedor',
    ],
}

for rol_nombre, componentes_nombres in permisos.items():
    rol = roles_dict[rol_nombre]
    for comp_nombre in componentes_nombres:
        componente = componentes_dict[comp_nombre]
        comp_rol, created = ComponenteRol.objects.get_or_create(
            rol=rol,
            componente=componente,
            defaults={'permiso': 'EDITAR'}
        )
        if created:
            print(f"  ✅ {rol_nombre} → {comp_nombre}")

# ============================================================
# 4. CREAR USUARIOS DE PRUEBA
# ============================================================
print("\n[4/5] Creando usuarios de prueba...")

usuarios_prueba = [
    ('funcionario@financiera.edu.co', 'func123', 'Funcionario', 'Funcionario'),
    ('contabilidad@financiera.edu.co', 'conta123', 'Contabilidad', 'Usuario Contabilidad'),
    ('tesoreria@financiera.edu.co', 'teso123', 'Tesorería', 'Usuario Tesorería'),
    ('auditoria@financiera.edu.co', 'audit123', 'Auditoría', 'Usuario Auditoría'),
    ('direccion-financiera@financiera.edu.co', 'dirfin123', 'Dirección Financiera', 'Dir. Financiera'),
    ('rectoria@financiera.edu.co', 'recto123', 'Rectoría', 'Rectoría'),
    ('admin.financiero@financiera.edu.co', 'adminfin123', 'Admin Financiero', 'Admin Financiero'),
]

usuarios_dict = {}
for correo, password, rol_nombre, nombre in usuarios_prueba:
    rol = roles_dict[rol_nombre]
    usuario, created = Usuario.objects.get_or_create(
        correo=correo,
        defaults={
            'nombre': nombre,
            'rol': rol,
            'activo': True,
            'is_active': True,
        }
    )
    if created:
        usuario.set_password(password)
        usuario.save()
        print(f"  ✅ Creado: {correo} / {password}")
    else:
        print(f"  ⚠️  Existente: {correo}")
    usuarios_dict[correo] = usuario

# ============================================================
# 5. CREAR PARÁMETROS SLA
# ============================================================
print("\n[5/5] Creando parámetros SLA...")

parametros_sla = [
    ('Recepción y Registro', 'Funcionario', 2, 'Registro inicial de factura'),
    ('Radicación', 'Contabilidad', 3, 'Radicación en contabilidad'),
    ('Causación', 'Contabilidad', 2, 'Causación contable'),
    ('Alistamiento', 'Tesorería', 3, 'Alistamiento sin CE'),
    ('Control Previo', 'Auditoría', 4, 'Control previo de auditoría'),
    ('Cargue Formal', 'Dirección Financiera', 2, 'Cargue para autorización'),
    ('Autorización de Pago', 'Rectoría', 3, 'Autorización por Rectoría'),
    ('Aplicación de Pago', 'Tesorería', 1, 'Ejecución de pago'),
    ('Generación Comprobante', 'Tesorería', 1, 'Comprobante de egreso'),
]

for etapa, rol, dias, descripcion in parametros_sla:
    param, created = ParametroSLA.objects.get_or_create(
        etapa=etapa,
        defaults={
            'rol_responsable': rol,
            'dias_maximos': dias,
            'descripcion': descripcion,
            'activo': True,
            'alerta_amarillo_porcentaje': 60,
            'alerta_roja_porcentaje': 80,
        }
    )
    status = "✅ Creado" if created else "⚠️  Existente"
    print(f"  {status}: {etapa} ({dias} días)")

# ============================================================
# 6. CREAR PARÁMETROS FINANCIERO
# ============================================================
print("\n[EXTRA] Creando parámetros financiero...")

parametros_financiero = [
    ('nombre_institucion', 'Universidad Libre de Colombia', 'string', 'general'),
    ('nit_institucion', '860013798-1', 'string', 'general'),
    ('monto_autorizacion_especial', '10000000', 'number', 'autorizacion'),
    ('dias_retencion_documentos', '3650', 'number', 'sistema'),
    ('alerta_automatica_activa', 'true', 'boolean', 'sla'),
    ('email_notificaciones', 'notificaciones@financiera.edu.co', 'string', 'email'),
]

for clave, valor, tipo, categoria in parametros_financiero:
    param, created = ParametrosFinanciero.objects.get_or_create(
        clave=clave,
        defaults={
            'valor': valor,
            'tipo_dato': tipo,
            'categoria': categoria,
            'editable': True,
        }
    )
    status = "✅ Creado" if created else "⚠️  Existente"
    print(f"  {status}: {clave} = {valor}")

# ============================================================
# RESUMEN
# ============================================================
print("\n" + "=" * 60)
print("✅ CARGA DE DATOS COMPLETADA")
print("=" * 60)
print(f"\n📊 Resumen:")
print(f"  • Roles: {len(roles_dict)}")
print(f"  • Componentes: {len(componentes_dict)}")
print(f"  • Usuarios: {len(usuarios_dict)}")
print(f"\n🔐 Usuarios de prueba:")
for correo, password, rol, nombre in usuarios_prueba:
    print(f"  • {correo} / {password}")

print("\n" + "=" * 60)
