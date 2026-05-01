from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

import re
from usuarios.models import Rol, Usuario
from componentes.models import Componente, ComponenteRol
from financiero.models import (
    Departamento,
    ParametroSLA,
    ParametrosFinanciero,
    Proveedor,
    Factura,
    HistorialFactura,
    CuentaContable,
    CentroCosto,
)


class Command(BaseCommand):
    help = "Seed inicial del modulo financiero (roles, componentes, permisos, SLA y parametros)."

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING("Iniciando seed financiero..."))

        roles = self._seed_roles()
        componentes = self._seed_componentes()
        self._seed_permisos(roles, componentes)
        self._seed_departamentos()
        self._seed_catalogos_contables()
        self._seed_demo_data()
        self._seed_usuarios_proveedores(roles)
        self._seed_sla()
        self._seed_parametros()

        self.stdout.write(self.style.SUCCESS("Seed financiero completado correctamente."))

    def _seed_roles(self):
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
        self.stdout.write("\n[1/6] Roles")
        for nombre, descripcion in roles_data.items():
            rol, created = Rol.objects.get_or_create(
                nombre=nombre,
                defaults={"descripcion": descripcion},
            )
            result[nombre] = rol
            msg = "Creado" if created else "Existente"
            self.stdout.write(f"  - {msg}: {nombre}")

        return result

    def _seed_componentes(self):
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
            ("Consultar Facturas", "Consulta y seguimiento de facturas"),
            ("Gestión de Facturas", "Componente general del modulo de facturas"),

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
            ("Autorizar Pago", "Alias de autorizacion final"),

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
        self.stdout.write("\n[2/6] Componentes")
        for nombre, descripcion in componentes_data:
            componente, created = Componente.objects.get_or_create(
                nombre=nombre,
                defaults={"descripcion": descripcion},
            )
            result[nombre] = componente
            msg = "Creado" if created else "Existente"
            self.stdout.write(f"  - {msg}: {nombre}")

        return result

    def _seed_permisos(self, roles, componentes):
        permisos_por_rol = {
            "Funcionario": [
                "Dashboard Financiero",
                "Mis Pendientes",
                "Registrar Factura",
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

        self.stdout.write("\n[3/6] Permisos por rol")
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
                    self.stdout.write(f"  - Asignado: {rol_nombre} -> {componente_nombre}")

    def _seed_departamentos(self):
        departamentos = [
            ("FIN", "Financiero", "Financiero"),
            ("CON", "Contabilidad", "Financiero"),
            ("TES", "Tesorería", "Financiero"),
            ("AUD", "Auditoría", "Financiero"),
            ("DIR", "Dirección Financiera", "Financiero"),
            ("REC", "Rectoría", "Administrativo"),
            ("ADM", "Administración", "Administrativo"),
        ]

        self.stdout.write("\n[4/6] Departamentos")
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
            self.stdout.write(f"  - {msg}: {codigo} {nombre}")

    def _seed_catalogos_contables(self):
        self.stdout.write("\n[4b/6] Catálogos contables (cuentas y centros de costo)")

        cuentas_contables = [
            {
                'codigo': '110505',
                'nombre': 'Caja General',
                'tipo_cuenta': 'Activo',
                'nivel': 4,
                'cuenta_padre': '1105',
                'naturaleza': 'Débito',
                'acepta_movimiento': True,
                'requiere_tercero': False,
                'requiere_centro_costo': False,
                'estado': 'Activo',
            },
            {
                'codigo': '111005',
                'nombre': 'Bancos Nacionales',
                'tipo_cuenta': 'Activo',
                'nivel': 4,
                'cuenta_padre': '1110',
                'naturaleza': 'Débito',
                'acepta_movimiento': True,
                'requiere_tercero': False,
                'requiere_centro_costo': False,
                'estado': 'Activo',
            },
            {
                'codigo': '130505',
                'nombre': 'Clientes Nacionales',
                'tipo_cuenta': 'Activo',
                'nivel': 4,
                'cuenta_padre': '1305',
                'naturaleza': 'Débito',
                'acepta_movimiento': True,
                'requiere_tercero': True,
                'requiere_centro_costo': False,
                'estado': 'Activo',
            },
            {
                'codigo': '220505',
                'nombre': 'Proveedores Nacionales',
                'tipo_cuenta': 'Pasivo',
                'nivel': 4,
                'cuenta_padre': '2205',
                'naturaleza': 'Crédito',
                'acepta_movimiento': True,
                'requiere_tercero': True,
                'requiere_centro_costo': False,
                'estado': 'Activo',
            },
            {
                'codigo': '236540',
                'nombre': 'Retención en la Fuente',
                'tipo_cuenta': 'Pasivo',
                'nivel': 4,
                'cuenta_padre': '2365',
                'naturaleza': 'Crédito',
                'acepta_movimiento': True,
                'requiere_tercero': True,
                'requiere_centro_costo': False,
                'estado': 'Activo',
            },
            {
                'codigo': '413595',
                'nombre': 'Ingresos por Servicios Académicos',
                'tipo_cuenta': 'Ingreso',
                'nivel': 4,
                'cuenta_padre': '4135',
                'naturaleza': 'Crédito',
                'acepta_movimiento': True,
                'requiere_tercero': True,
                'requiere_centro_costo': True,
                'estado': 'Activo',
            },
            {
                'codigo': '513505',
                'nombre': 'Servicios Públicos',
                'tipo_cuenta': 'Gasto',
                'nivel': 4,
                'cuenta_padre': '5135',
                'naturaleza': 'Débito',
                'acepta_movimiento': True,
                'requiere_tercero': True,
                'requiere_centro_costo': True,
                'estado': 'Activo',
            },
            {
                'codigo': '513595',
                'nombre': 'Otros Servicios Administrativos',
                'tipo_cuenta': 'Gasto',
                'nivel': 4,
                'cuenta_padre': '5135',
                'naturaleza': 'Débito',
                'acepta_movimiento': True,
                'requiere_tercero': True,
                'requiere_centro_costo': True,
                'estado': 'Activo',
            },
            {
                'codigo': '519595',
                'nombre': 'Gastos Diversos',
                'tipo_cuenta': 'Gasto',
                'nivel': 4,
                'cuenta_padre': '5195',
                'naturaleza': 'Débito',
                'acepta_movimiento': True,
                'requiere_tercero': True,
                'requiere_centro_costo': True,
                'estado': 'Activo',
            },
            {
                'codigo': '613505',
                'nombre': 'Costos de Servicios Educativos',
                'tipo_cuenta': 'Costo',
                'nivel': 4,
                'cuenta_padre': '6135',
                'naturaleza': 'Débito',
                'acepta_movimiento': True,
                'requiere_tercero': True,
                'requiere_centro_costo': True,
                'estado': 'Activo',
            },
        ]

        centros_costo = [
            {'codigo': 'CC-ADM-001', 'nombre': 'Administración General', 'tipo': 'Administrativo', 'departamento_codigo': 'ADM'},
            {'codigo': 'CC-CONT-001', 'nombre': 'Gestión Contable', 'tipo': 'Administrativo', 'departamento_codigo': 'CONT'},
            {'codigo': 'CC-TESO-001', 'nombre': 'Tesorería Institucional', 'tipo': 'Administrativo', 'departamento_codigo': 'TESO'},
            {'codigo': 'CC-ACAD-001', 'nombre': 'Operación Académica', 'tipo': 'Académico', 'departamento_codigo': 'ACAD'},
            {'codigo': 'CC-BIEN-001', 'nombre': 'Bienestar Universitario', 'tipo': 'Operativo', 'departamento_codigo': 'BIENESTAR'},
            {'codigo': 'CC-INFRA-001', 'nombre': 'Infraestructura y Mantenimiento', 'tipo': 'Operativo', 'departamento_codigo': 'INFRA'},
            {'codigo': 'CC-TI-001', 'nombre': 'Tecnología y Sistemas', 'tipo': 'Operativo', 'departamento_codigo': 'TI'},
            {'codigo': 'CC-INV-001', 'nombre': 'Proyectos de Investigación', 'tipo': 'Investigación', 'departamento_codigo': 'INVESTIG'},
            {'codigo': 'CC-EXT-001', 'nombre': 'Extensión y Proyección Social', 'tipo': 'Extensión', 'departamento_codigo': 'EXTENSION'},
            {'codigo': 'CC-COMP-001', 'nombre': 'Compras y Contratación', 'tipo': 'Administrativo', 'departamento_codigo': 'COMPRAS'},
        ]

        self.stdout.write("  - Cuentas contables:")
        for cuenta in cuentas_contables:
            _, created = CuentaContable.objects.get_or_create(
                codigo=cuenta['codigo'],
                defaults=cuenta,
            )
            msg = "Creada" if created else "Existente"
            self.stdout.write(f"    · {msg}: {cuenta['codigo']} - {cuenta['nombre']}")

        self.stdout.write("  - Centros de costo:")
        for centro in centros_costo:
            depto_codigo = centro.pop('departamento_codigo')
            departamento = Departamento.objects.filter(codigo=depto_codigo).first()
            defaults = {
                'nombre': centro['nombre'],
                'tipo': centro['tipo'],
                'departamento': departamento,
                'estado': 'Activo',
            }
            _, created = CentroCosto.objects.get_or_create(
                codigo=centro['codigo'],
                defaults=defaults,
            )
            msg = "Creado" if created else "Existente"
            self.stdout.write(f"    · {msg}: {centro['codigo']} - {centro['nombre']}")

    def _seed_sla(self):
        etapas = [
            ("Registro y Recepción", "Funcionario", 2, "Registro inicial de factura recibida"),
            ("Radicación", "Contabilidad", 3, "Radicacion formal de la factura"),
            ("Causación", "Contabilidad", 2, "Causacion contable"),
            ("Alistamiento", "Tesorería", 3, "Preparacion para pago"),
            ("Control Previo", "Auditoría", 4, "Revision de auditoria"),
            ("Envío a Dirección Financiera", "Tesorería", 1, "Traslado hacia direccion financiera"),
            ("Cargue Formal", "Dirección Financiera", 2, "Cargue para autorizacion final"),
            ("Autorización de Pago", "Rectoría", 3, "Autorizacion institucional"),
            ("Aplicación de Pago", "Tesorería", 1, "Aplicacion de pago"),
            ("Comprobante de Egreso", "Tesorería", 1, "Generacion de comprobante"),
        ]

        self.stdout.write("\n[5/6] Parametros SLA")
        for etapa, rol, dias, descripcion in etapas:
            _, created = ParametroSLA.objects.get_or_create(
                etapa=etapa,
                defaults={
                    "rol_responsable": rol,
                    "dias_maximos": dias,
                    "alerta_amarillo_porcentaje": 60,
                    "alerta_roja_porcentaje": 80,
                    "descripcion": descripcion,
                    "activo": True,
                    "aplica_dias_habiles": True,
                },
            )
            msg = "Creado" if created else "Existente"
            self.stdout.write(f"  - {msg}: {etapa}")

    def _seed_demo_data(self):
        self.stdout.write("\n[5/6] Datos demo (proveedores y facturas)")

        proveedores_demo = [
            ('900123456-7', 'Tecnologia Global SAS', 'Servicios'),
            ('900234567-8', 'Editorial Academica Colombia', 'Bienes'),
            ('900345678-9', 'Mantenimiento y Obras SAS', 'Servicios'),
            ('900456789-0', 'Distribuidora de Recursos Educativos', 'Bienes'),
            ('900567890-1', 'Soluciones de Infraestructura Digital', 'Servicios'),
        ]

        proveedores = {}
        for nit, razon_social, tipo in proveedores_demo:
            proveedor, created = Proveedor.objects.get_or_create(
                nit=nit,
                defaults={
                    'razon_social': razon_social,
                    'tipo_proveedor': tipo,
                    'estado': 'Activo',
                },
            )
            proveedores[nit] = proveedor
            msg = "Creado" if created else "Existente"
            self.stdout.write(f"  - {msg}: Proveedor {nit}")

        # Crear múltiples departamentos para una universidad
        departamentos_default = {}
        departamentos_data = [
            ('ADM', 'Administración', 'Administrativo'),
            ('ACAD', 'Académica', 'Académico'),
            ('THHH', 'Talento Humano', 'Administrativo'),
            ('INFRA', 'Infraestructura y Mantenimiento', 'Administrativo'),
            ('TI', 'Tecnología (TI)', 'Tecnológico'),
            ('CONT', 'Contabilidad', 'Financiero'),
            ('TESO', 'Tesorería', 'Financiero'),
            ('PRES', 'Presupuesto', 'Financiero'),
            ('COMPRAS', 'Compras y Contratación', 'Administrativo'),
            ('BIENESTAR', 'Bienestar Universitario', 'Administrativo'),
            ('INVESTIG', 'Investigación', 'Académico'),
            ('EXTENSION', 'Extensión y Proyección Social', 'Académico'),
            ('JURIDICA', 'Área Jurídica', 'Administrativa'),
        ]
        
        for codigo, nombre, tipo in departamentos_data:
            dept, _ = Departamento.objects.get_or_create(
                codigo=codigo,
                defaults={
                    'nombre': nombre,
                    'tipo': tipo,
                    'estado': 'Activo',
                },
            )
            departamentos_default[codigo] = dept
        
        # Para facturas demo, usar Administración
        departamento = departamentos_default['ADM']

        hoy = timezone.now().date()
        facturas_demo = [
            {
                'numero_factura': 'FAC-2026-0001',
                'proveedor': proveedores['900123456-7'],
                'departamento': departamento,
                'valor_subtotal': 8000000,
                'valor_iva': 1520000,
                'valor_total': 9520000,
                'tipo_documento': 'Factura',
                'descripcion': 'Servicios TI institucionales',
                'fecha_factura': hoy,
                'fecha_recepcion': hoy,
                'estado': 'Recibida',
                'etapa_actual': 'Registro y Recepción',
            },
            {
                'numero_factura': 'FAC-2026-0002',
                'proveedor': proveedores['900234567-8'],
                'departamento': departamento,
                'valor_subtotal': 3000000,
                'valor_iva': 570000,
                'valor_total': 3570000,
                'tipo_documento': 'Factura',
                'descripcion': 'Material bibliografico',
                'fecha_factura': hoy,
                'fecha_recepcion': hoy,
                'estado': 'Radicada',
                'etapa_actual': 'Radicación',
                'numero_radicado': 'RAD-2026-0002',
                'fecha_radicacion': hoy,
            },
            {
                'numero_factura': 'FAC-2026-0003',
                'proveedor': proveedores['900345678-9'],
                'departamento': departamento,
                'valor_subtotal': 4500000,
                'valor_iva': 855000,
                'valor_total': 5355000,
                'tipo_documento': 'Factura',
                'descripcion': 'Mantenimiento preventivo',
                'fecha_factura': hoy,
                'fecha_recepcion': hoy,
                'estado': 'Causada',
                'etapa_actual': 'Causación',
                'numero_radicado': 'RAD-2026-0003',
                'fecha_radicacion': hoy,
                'fecha_causacion': hoy,
            },
            {
                'numero_factura': 'FAC-2026-0004',
                'proveedor': proveedores['900456789-0'],
                'departamento': departamento,
                'valor_subtotal': 2000000,
                'valor_iva': 380000,
                'valor_total': 2380000,
                'tipo_documento': 'Factura Electrónica',
                'descripcion': 'Materiales educativos digitales',
                'fecha_factura': hoy,
                'fecha_recepcion': hoy,
                'estado': 'Recibida',
                'etapa_actual': 'Registro y Recepción',
            },
            {
                'numero_factura': 'FAC-2026-0005',
                'proveedor': proveedores['900567890-1'],
                'departamento': departamento,
                'valor_subtotal': 15000000,
                'valor_iva': 2850000,
                'valor_total': 17850000,
                'tipo_documento': 'Factura',
                'descripcion': 'Implementación de plataforma de gestión académica',
                'fecha_factura': hoy,
                'fecha_recepcion': hoy,
                'estado': 'Radicada',
                'etapa_actual': 'Radicación',
                'numero_radicado': 'RAD-2026-0005',
                'fecha_radicacion': hoy,
            },
            {
                'numero_factura': 'FAC-2026-0006',
                'proveedor': proveedores['900234567-8'],
                'departamento': departamento,
                'valor_subtotal': 5000000,
                'valor_iva': 950000,
                'valor_total': 5950000,
                'tipo_documento': 'Cuenta de Cobro',
                'descripcion': 'Servicios de consultoría académica',
                'fecha_factura': hoy,
                'fecha_recepcion': hoy,
                'estado': 'Causada',
                'etapa_actual': 'Causación',
                'numero_radicado': 'RAD-2026-0006',
                'fecha_radicacion': hoy,
                'fecha_causacion': hoy,
            },
        ]

        # COMENTADO: Seed data de facturas elimado por conflictos
        # Las facturas deben ser creadas manualmente a través del panel
        # para evitar inconsistencias en la base de datos
        if False:  # Deshabilitado intencionalmente
            for data in facturas_demo:
                factura, created = Factura.objects.get_or_create(
                    numero_factura=data['numero_factura'],
                    defaults=data,
                )
                msg = "Creada" if created else "Existente"
                self.stdout.write(f"  - {msg}: Factura {factura.numero_factura}")

            # Garantiza trazabilidad para timeline en datos de demo.
            if factura.estado == 'Recibida':
                HistorialFactura.objects.get_or_create(
                    factura=factura,
                    accion='Factura registrada',
                    estado_nuevo='Recibida',
                    defaults={
                        'usuario_nombre': 'Sistema',
                        'usuario_rol': 'Funcionario',
                    },
                )

            if factura.estado in ['Radicada', 'Causada']:
                HistorialFactura.objects.get_or_create(
                    factura=factura,
                    accion='Factura registrada',
                    estado_nuevo='Recibida',
                    defaults={
                        'usuario_nombre': 'Sistema',
                        'usuario_rol': 'Funcionario',
                    },
                )
                HistorialFactura.objects.get_or_create(
                    factura=factura,
                    accion='Factura radicada',
                    estado_anterior='Recibida',
                    estado_nuevo='Radicada',
                    defaults={
                        'usuario_nombre': 'Sistema',
                        'usuario_rol': 'Contabilidad',
                    },
                )

            if factura.estado == 'Causada':
                HistorialFactura.objects.get_or_create(
                    factura=factura,
                    accion='Factura causada',
                    estado_anterior='Radicada',
                    estado_nuevo='Causada',
                    defaults={
                        'usuario_nombre': 'Sistema',
                        'usuario_rol': 'Contabilidad',
                    },
                )

    def _seed_usuarios_proveedores(self, roles):
        """
        Crea un usuario de acceso por cada proveedor en la BD.
        - Email:      generado desde la razón social si el proveedor no tiene email.
        - Contraseña: Prov + NIT sin guion + *
        - Rol:        Proveedor
        El email del usuario = email del proveedor => vinculación automática al entrar.
        Usa get_or_create en ambos modelos para ser idempotente (re-ejecutable).
        """
        self.stdout.write("\n[5b/6] Usuarios de proveedores")

        def slugify_email(razon_social):
            s = razon_social.lower()
            s = re.sub(r'\b(sas|s\.a\.s|s\.a|ltda|e\.u|s\.a\.s\.)\b', '', s)
            s = re.sub(r'[^a-z0-9]+', '.', s).strip('.')
            return s

        rol_proveedor = roles.get('Proveedor')
        if not rol_proveedor:
            rol_proveedor, _ = Rol.objects.get_or_create(
                nombre='Proveedor',
                defaults={'descripcion': 'Usuario externo que consulta estado de facturas.'}
            )

        for prov in Proveedor.objects.all():
            # 1. Asignar email al proveedor si no tiene
            if not prov.email:
                slug = slugify_email(prov.razon_social)
                prov.email = f'{slug}@proveedor.sihul.edu.co'
                prov.save(update_fields=['email'])

            correo = prov.email
            nit_limpio = re.sub(r'[^0-9]', '', prov.nit)
            contrasena = f'Prov{nit_limpio}*'

            # 2. Crear o actualizar usuario
            if Usuario.objects.filter(correo=correo).exists():
                u = Usuario.objects.get(correo=correo)
                u.rol = rol_proveedor
                u.activo = True
                u.set_password(contrasena)
                u.contrasena_hash = u.password
                u.save()
                accion = 'Actualizado'
            else:
                u = Usuario(
                    nombre=prov.razon_social,
                    correo=correo,
                    rol=rol_proveedor,
                    activo=True,
                )
                u.set_password(contrasena)
                u.contrasena_hash = u.password
                u.save()
                accion = 'Creado'

            self.stdout.write(
                f"  - {accion}: {prov.razon_social} | {correo} | Pass: {contrasena}"
            )

    def _seed_parametros(self):
        parametros = [
            ("nombre_institucion", "Universidad Libre", "string", "general", "Nombre de la institucion"),
            ("monto_autorizacion_especial", "10000000", "number", "autorizacion", "Umbral para autorizacion especial"),
            ("alerta_automatica_activa", "true", "boolean", "sla", "Activa calculo automatico de alertas SLA"),
            ("dias_retencion_documental", "3650", "number", "sistema", "Dias de retencion documental"),
            (
                "areas_solicitantes_excluidas",
                '["Financiero","Contabilidad","Tesorería","Auditoría","Dirección Financiera","Rectoría"]',
                "json",
                "general",
                "Areas de flujo financiero que no deben mostrarse como area solicitante",
            ),
            ("email_notificaciones_financiero", "notificaciones@unilibre.edu.co", "string", "email", "Correo para alertas financieras"),
        ]

        self.stdout.write("\n[6/6] Parametros financieros")
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
            self.stdout.write(f"  - {msg}: {clave}")
