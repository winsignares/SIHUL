"""
Seeder unificado del módulo financiero.
Carga: roles, componentes, permisos, departamentos, catálogos contables,
       proveedores, SLA, parámetros y usuarios de prueba.
"""

import re
from django.utils import timezone
from usuarios.models import Rol, Usuario
from componentes.models import Componente, ComponenteRol
from financiero.models import (
    Departamento,
    ParametroSLA,
    ParametrosFinanciero,
    Proveedor,
    CuentaContable,
    CentroCosto,
    Banco,
    TipoCuenta,
)


def create_financiero_data(out, sty):
    """Función principal que ejecuta todos los seeds del módulo financiero."""
    out.write(sty.SUCCESS('\n[Financiero] Iniciando carga de datos financieros...'))

    roles = _seed_roles(out, sty)
    componentes = _seed_componentes(out, sty)
    _seed_permisos(roles, componentes, out, sty)
    _seed_departamentos(out, sty)
    _seed_catalogos_contables(out, sty)
    _seed_bancos_y_tipos_cuenta(out, sty)
    _seed_proveedores_demo(out, sty)
    _seed_usuarios_proveedores(roles, out, sty)
    _seed_sla(out, sty)
    _seed_parametros(out, sty)
    _seed_usuarios_prueba(roles, out, sty)

    out.write(sty.SUCCESS('[Financiero] Datos financieros cargados exitosamente.'))


def _seed_roles(out, sty):
    """Crea los roles del módulo financiero."""
    roles_data = {
        "Funcionario": "Recibe y registra facturas en el sistema.",
        "Contabilidad": "Radica y causa facturas.",
        "Tesorería": "Alista pagos y aplica pago.",
        "Auditoría": "Realiza control previo y validacion documental.",
        "Dirección Financiera": "Revisa y carga pagos para autorizacion.",
        "Rectoría": "Autoriza pagos finales.",
        "Admin Financiero": "Administra catalogos, usuarios financieros y configuracion.",
        "Proveedor": "Usuario externo que consulta estado de facturas.",
    }

    result = {}
    out.write(sty.NOTICE('\n  Roles financieros:'))
    for nombre, descripcion in roles_data.items():
        rol, created = Rol.objects.get_or_create(
            nombre=nombre,
            defaults={"descripcion": descripcion},
        )
        result[nombre] = rol
        msg = "Creado" if created else "Existente"
        out.write(f"    - {msg}: {nombre}")

    return result


def _seed_componentes(out, sty):
    """Crea los componentes del módulo financiero."""
    componentes_data = [
        # Funcionario
        ("Dashboard Financiero", "Dashboard del rol Funcionario"),
        ("Mis Pendientes", "Bandeja de pendientes del funcionario"),
        ("Registrar Factura", "Registro inicial de factura"),
        ("Consultar Facturas", "Consulta y seguimiento de facturas"),
        ("Gestión de Facturas", "Componente general del modulo de facturas"),

        # Contabilidad
        ("Dashboard Contabilidad", "Dashboard del rol Contabilidad"),
        ("Mis Pendientes Contabilidad", "Pendientes de contabilidad"),
        ("Radicar Facturas", "Radicacion contable"),
        ("Causar Facturas", "Causacion contable"),

        # Tesoreria
        ("Dashboard Tesoreria", "Dashboard del rol Tesoreria"),
        ("Mis Pendientes Tesoreria", "Pendientes de tesoreria"),
        ("Alistar Pagos", "Alistamiento de pagos"),
        ("Enviar Direccion Financiera", "Envio a direccion financiera"),
        ("Registrar Pago Aplicado", "Registro de pago aplicado"),
        ("Generar Comprobante Egreso", "Generacion de comprobante de egreso"),

        # Auditoria
        ("Dashboard Auditoria", "Dashboard del rol Auditoria"),
        ("Mis Pendientes Auditoria", "Pendientes de auditoria"),
        ("Control Previo", "Control previo de auditoria"),

        # Direccion Financiera
        ("Dashboard Direccion Financiera", "Dashboard de direccion financiera"),
        ("Mis Pendientes Direccion Financiera", "Pendientes de direccion financiera"),
        ("Revisar Pagos Direccion Financiera", "Revision de pagos"),
        ("Enviar a Rectoria", "Envio de pagos a rectoria"),
        ("Confirmacion Pagos Direccion Financiera", "Confirmacion de pagos"),

        # Rectoria
        ("Dashboard Rectoria", "Dashboard de rectoria"),
        ("Mis Pendientes Rectoria", "Pendientes de rectoria"),
        ("Autorizar Pagos", "Autorizacion final de pagos"),

        # Admin Financiero
        ("Dashboard Admin Financiero", "Dashboard administrativo financiero"),
        ("Gestion Usuarios Financiero", "Gestion de usuarios del modulo financiero"),
        ("Gestion Proveedores", "Gestion de proveedores"),
        ("Parametrizacion SLA", "Parametrizacion de SLA por etapa"),
        ("Reportes Consolidados Financiero", "Reportes financieros consolidados"),
        ("Configuracion Sistema Financiero", "Configuracion del sistema financiero"),

        # Proveedor
        ("Dashboard Proveedor", "Dashboard del rol Proveedor"),
        ("Mis Facturas Proveedor", "Consulta de facturas del proveedor"),
        ("Consultar Estado Facturas", "Consulta de estado de facturas"),
    ]

    result = {}
    out.write(sty.NOTICE('\n  Componentes financieros:'))
    for nombre, descripcion in componentes_data:
        componente, created = Componente.objects.get_or_create(
            nombre=nombre,
            defaults={"descripcion": descripcion},
        )
        result[nombre] = componente
        msg = "Creado" if created else "Existente"
        out.write(f"    - {msg}: {nombre}")

    return result


def _seed_permisos(roles, componentes, out, sty):
    """Asigna permisos a los roles financieros."""
    permisos_por_rol = {
        "Funcionario": [
            "Dashboard Financiero",
            "Mis Pendientes",
            "Consultar Facturas",
            "Gestión de Facturas",
        ],
        "Contabilidad": [
            "Dashboard Contabilidad",
            "Mis Pendientes Contabilidad",
            "Radicar Facturas",
            "Causar Facturas",
            "Consultar Facturas",
            "Gestión de Facturas",
        ],
        "Tesorería": [
            "Dashboard Tesoreria",
            "Mis Pendientes Tesoreria",
            "Alistar Pagos",
            "Enviar Direccion Financiera",
            "Registrar Pago Aplicado",
            "Generar Comprobante Egreso",
            "Consultar Facturas",
            "Gestión de Facturas",
        ],
        "Auditoría": [
            "Dashboard Auditoria",
            "Mis Pendientes Auditoria",
            "Control Previo",
            "Consultar Facturas",
            "Gestión de Facturas",
        ],
        "Dirección Financiera": [
            "Dashboard Direccion Financiera",
            "Mis Pendientes Direccion Financiera",
            "Revisar Pagos Direccion Financiera",
            "Enviar a Rectoria",
            "Confirmacion Pagos Direccion Financiera",
            "Consultar Facturas",
            "Gestión de Facturas",
        ],
        "Rectoría": [
            "Dashboard Rectoria",
            "Mis Pendientes Rectoria",
            "Autorizar Pagos",
            "Consultar Facturas",
            "Gestión de Facturas",
        ],
        "Admin Financiero": [
            "Dashboard Admin Financiero",
            "Gestion Usuarios Financiero",
            "Gestion Proveedores",
            "Parametrizacion SLA",
            "Reportes Consolidados Financiero",
            "Configuracion Sistema Financiero",
            "Consultar Facturas",
            "Gestión de Facturas",
        ],
        "Proveedor": [
            "Dashboard Proveedor",
            "Mis Facturas Proveedor",
            "Consultar Estado Facturas",
        ],
    }

    out.write(sty.NOTICE('\n  Permisos por rol:'))
    for rol_nombre, componentes_nombres in permisos_por_rol.items():
        rol = roles[rol_nombre]
        for componente_nombre in componentes_nombres:
            componente = componentes[componente_nombre]
            _, created = ComponenteRol.objects.get_or_create(
                rol=rol,
                componente=componente,
                defaults={"permiso": ComponenteRol.Permiso.EDITAR},
            )
            if created:
                out.write(f"    - {rol_nombre} -> {componente_nombre}")


def _seed_departamentos(out, sty):
    """Crea los departamentos financieros."""
    departamentos = [
        ("FIN", "Financiero", "Financiero"),
        ("CON", "Contabilidad", "Financiero"),
        ("TES", "Tesorería", "Financiero"),
        ("AUD", "Auditoría", "Financiero"),
        ("DIR", "Dirección Financiera", "Financiero"),
        ("REC", "Rectoría", "Administrativo"),
        ("ADM", "Administración", "Administrativo"),
    ]

    out.write(sty.NOTICE('\n  Departamentos:'))
    for codigo, nombre, tipo in departamentos:
        _, created = Departamento.objects.get_or_create(
            codigo=codigo,
            defaults={
                "nombre": nombre,
                "tipo": tipo,
                "estado": "Activo",
            },
        )
        msg = "Creado" if created else "Existente"
        out.write(f"    - {msg}: {codigo} {nombre}")


def _seed_catalogos_contables(out, sty):
    """Crea cuentas contables y centros de costo."""
    out.write(sty.NOTICE('\n  Catálogos contables:'))

    cuentas_contables = [
        {
            'codigo': '110505',
            'nombre': 'Caja General',
            'tipo_cuenta': 'Activo',
            'nivel': 4,
            'cuenta_padre': '1105',
            'naturaleza': 'Débito',
            'acepta_movimiento': True,
        },
        {
            'codigo': '111005',
            'nombre': 'Bancos Nacionales',
            'tipo_cuenta': 'Activo',
            'nivel': 4,
            'cuenta_padre': '1110',
            'naturaleza': 'Débito',
            'acepta_movimiento': True,
        },
        {
            'codigo': '220505',
            'nombre': 'Proveedores Nacionales',
            'tipo_cuenta': 'Pasivo',
            'nivel': 4,
            'cuenta_padre': '2205',
            'naturaleza': 'Crédito',
            'acepta_movimiento': True,
        },
        {
            'codigo': '236540',
            'nombre': 'Retención en la Fuente',
            'tipo_cuenta': 'Pasivo',
            'nivel': 4,
            'cuenta_padre': '2365',
            'naturaleza': 'Crédito',
            'acepta_movimiento': True,
        },
        {
            'codigo': '513505',
            'nombre': 'Servicios Públicos',
            'tipo_cuenta': 'Gasto',
            'nivel': 4,
            'cuenta_padre': '5135',
            'naturaleza': 'Débito',
            'acepta_movimiento': True,
        },
    ]

    for cuenta in cuentas_contables:
        _, created = CuentaContable.objects.get_or_create(
            codigo=cuenta['codigo'],
            defaults={
                "nombre": cuenta['nombre'],
                "tipo_cuenta": cuenta['tipo_cuenta'],
                "nivel": cuenta['nivel'],
                "cuenta_padre": cuenta['cuenta_padre'],
                "naturaleza": cuenta['naturaleza'],
                "acepta_movimiento": cuenta['acepta_movimiento'],
                "estado": "Activo",
            },
        )
        msg = "Creado" if created else "Existente"
        out.write(f"    - {msg}: Cuenta {cuenta['codigo']}")

    centros_costo = [
        ("CC-001", "Administración General"),
        ("CC-002", "Recursos Humanos"),
        ("CC-003", "Tecnología"),
        ("CC-004", "Mantenimiento"),
    ]

    for codigo, nombre in centros_costo:
        _, created = CentroCosto.objects.get_or_create(
            codigo=codigo,
            defaults={
                "nombre": nombre,
                "estado": "Activo",
            },
        )
        msg = "Creado" if created else "Existente"
        out.write(f"    - {msg}: Centro {codigo}")


def _seed_proveedores_demo(out, sty):
    """Crea proveedores de demostración."""
    proveedores_demo = [
        ('900123456-7', 'Tecnologia Global SAS', 'Servicios'),
        ('900234567-8', 'Editorial Academica Colombia', 'Bienes'),
        ('900345678-9', 'Mantenimiento y Obras SAS', 'Servicios'),
        ('900456789-0', 'Distribuidora de Recursos Educativos', 'Bienes'),
        ('900567890-1', 'Soluciones de Infraestructura Digital', 'Servicios'),
    ]

    out.write(sty.NOTICE('\n  Proveedores demo:'))
    for nit, razon_social, tipo in proveedores_demo:
        _, created = Proveedor.objects.get_or_create(
            nit=nit,
            defaults={
                'razon_social': razon_social,
                'tipo_proveedor': tipo,
                'estado': 'Activo',
            },
        )
        msg = "Creado" if created else "Existente"
        out.write(f"    - {msg}: {razon_social}")


def _seed_usuarios_proveedores(roles, out, sty):
    """Crea usuarios de acceso para cada proveedor."""
    out.write(sty.NOTICE('\n  Usuarios de proveedores:'))

    rol_proveedor = roles.get('Proveedor')
    if not rol_proveedor:
        return

    for prov in Proveedor.objects.all():
        if not prov.email:
            slug = _slugify_email(prov.razon_social)
            prov.email = f'{slug}@proveedor.sihul.edu.co'
            prov.save(update_fields=['email'])

        correo = prov.email
        nit_limpio = re.sub(r'[^0-9]', '', prov.nit)
        contrasena = f'Prov{nit_limpio}*'

        usuario, created = Usuario.objects.get_or_create(
            correo=correo,
            defaults={
                'nombre': prov.razon_social,
                'rol': rol_proveedor,
                'activo': True,
            },
        )
        usuario.set_password(contrasena)
        usuario.contrasena_hash = usuario.password
        usuario.save()

        accion = "Creado" if created else "Actualizado"
        out.write(f"    - {accion}: {prov.razon_social}")


def _slugify_email(razon_social):
    """Genera un email slug a partir de la razón social."""
    s = razon_social.lower()
    s = re.sub(r'\b(sas|s\.a\.s|s\.a|ltda|e\.u|s\.a\.s\.)\b', '', s)
    s = re.sub(r'[^a-z0-9]+', '.', s).strip('.')
    return s


def _seed_sla(out, sty):
    """Crea los parámetros SLA."""
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

    out.write(sty.NOTICE('\n  Parámetros SLA:'))
    for etapa, rol, dias, descripcion in parametros_sla:
        _, created = ParametroSLA.objects.get_or_create(
            etapa=etapa,
            defaults={
                "rol_responsable": rol,
                "dias_maximos": dias,
                "descripcion": descripcion,
                "activo": True,
                "alerta_amarillo_porcentaje": 60,
                "alerta_roja_porcentaje": 80,
            },
        )
        msg = "Creado" if created else "Existente"
        out.write(f"    - {msg}: {etapa} ({dias} días)")


def _seed_parametros(out, sty):
    """Crea los parámetros del sistema financiero."""
    parametros = [
        ("nombre_institucion", "Universidad Libre", "string", "general", "Nombre de la institucion"),
        ("monto_autorizacion_especial", "10000000", "number", "autorizacion", "Umbral para autorizacion especial"),
        ("alerta_automatica_activa", "true", "boolean", "sla", "Activa calculo automatico de alertas SLA"),
        ("dias_retencion_documental", "3650", "number", "sistema", "Dias de retencion documental"),
        ("email_notificaciones_financiero", "notificaciones@unilibre.edu.co", "string", "email", "Correo para alertas financieras"),
    ]

    out.write(sty.NOTICE('\n  Parámetros financieros:'))
    for clave, valor, tipo_dato, categoria, descripcion in parametros:
        _, created = ParametrosFinanciero.objects.get_or_create(
            clave=clave,
            defaults={
                "valor": valor,
                "tipo_dato": tipo_dato,
                "categoria": categoria,
                "descripcion": descripcion,
                "editable": True,
            },
        )
        msg = "Creado" if created else "Existente"
        out.write(f"    - {msg}: {clave}")


def _seed_usuarios_prueba(roles, out, sty):
    """Crea usuarios de prueba para el módulo financiero."""
    usuarios_prueba = [
        ('funcionario@financiera.edu.co', 'func123', 'Funcionario', 'Funcionario'),
        ('contabilidad@financiera.edu.co', 'conta123', 'Contabilidad', 'Usuario Contabilidad'),
        ('tesoreria@financiera.edu.co', 'teso123', 'Tesorería', 'Usuario Tesorería'),
        ('auditoria@financiera.edu.co', 'audit123', 'Auditoría', 'Usuario Auditoría'),
        ('direccion-financiera@financiera.edu.co', 'dirfin123', 'Dirección Financiera', 'Dir. Financiera'),
        ('rectoria@financiera.edu.co', 'recto123', 'Rectoría', 'Rectoría'),
        ('admin.financiero@financiera.edu.co', 'adminfin123', 'Admin Financiero', 'Admin Financiero'),
    ]

    out.write(sty.NOTICE('\n  Usuarios de prueba:'))
    for correo, password, rol_nombre, nombre in usuarios_prueba:
        rol = roles[rol_nombre]
        usuario, created = Usuario.objects.get_or_create(
            correo=correo,
            defaults={
                'nombre': nombre,
                'rol': rol,
                'activo': True,
                'is_active': True,
            },
        )
        if created:
            usuario.set_password(password)
            usuario.save()
            out.write(f"    - Creado: {correo}")
        else:
            out.write(f"    - Existente: {correo}")


def _seed_bancos_y_tipos_cuenta(out, sty):
    """Crea los bancos y tipos de cuenta colombianos."""
    out.write(sty.NOTICE('\n  Bancos y tipos de cuenta:'))

    bancos_data = [
        ('Bancolombia', 'Bancolombia S.A.', '001'),
        ('Banco de Bogotá', 'Banco de Bogotá S.A.', '002'),
        ('Davivienda', 'Banco Davivienda S.A.', '006'),
        ('BBVA', 'BBVA Colombia S.A.', '013'),
        ('Banco Popular', 'Banco Popular S.A.', '058'),
        ('Banco AV Villas', 'Banco AV Villas S.A.', '052'),
        ('Banco Caja Social', 'Banco Caja Social S.A.', '066'),
        ('Banco de Occidente', 'Banco de Occidente S.A.', '023'),
        ('Scotiabank Colpatria', 'Scotiabank Colpatria S.A.', '065'),
        ('Banco Falabella', 'Banco Falabella S.A.', '062'),
        ('Banco Santander', 'Banco Santander (Colombia) S.A.', '084'),
        ('ICBC', 'ICBC (Colombia) S.A.', '010'),
        ('Banco Itaú', 'Banco Itaú (Colombia) S.A.', '060'),
        ('Banco Pichincha', 'Banco Pichincha S.A.', '012'),
        ('Banco Agrario', 'Banco Agrario de Colombia S.A.', '080'),
        ('Banco Multicolor', 'Banco Multicolor S.A.', '042'),
        ('Banco W', 'Banco W S.A.', '080'),
        ('Nequi', 'Nequi S.A.', '155'),
        ('Nubank', 'Nubank Colombia S.A.', '159'),
        ('Otro', 'Otro banco', '999'),
    ]

    tipos_cuenta_data = [
        ('Ahorros', 'Cuenta de ahorros'),
        ('Corriente', 'Cuenta corriente'),
        ('Nómina', 'Cuenta de nómina'),
    ]

    for nombre, descripcion, codigo in bancos_data:
        _, created = Banco.objects.get_or_create(
            nombre=nombre,
            defaults={
                'descripcion': descripcion,
                'codigo_bancario': codigo,
                'activo': True,
            },
        )
        msg = "Creado" if created else "Existente"
        out.write(f"    - {msg}: Banco {nombre}")

    # Tipos de cuenta es un catalogo unico, no depende del banco seleccionado.
    TipoCuenta.objects.exclude(nombre__in=[nombre for nombre, _ in tipos_cuenta_data]).delete()

    for tipo_nombre, tipo_descripcion in tipos_cuenta_data:
        _, created = TipoCuenta.objects.update_or_create(
            nombre=tipo_nombre,
            defaults={
                'descripcion': tipo_descripcion,
                'activo': True,
            },
        )
        msg = "Creado" if created else "Actualizado"
        out.write(f"    - {msg}: Tipo de cuenta {tipo_nombre}")
