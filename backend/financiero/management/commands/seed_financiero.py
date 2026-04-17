from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from usuarios.models import Rol
from componentes.models import Componente, ComponenteRol
from financiero.models import Departamento, ParametroSLA, ParametrosFinanciero, Proveedor, Factura


class Command(BaseCommand):
    help = "Seed inicial del modulo financiero (roles, componentes, permisos, SLA y parametros)."

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING("Iniciando seed financiero..."))

        roles = self._seed_roles()
        componentes = self._seed_componentes()
        self._seed_permisos(roles, componentes)
        self._seed_departamentos()
        self._seed_demo_data()
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
            ("Causar Factura", "Causacion contable individual"),
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
            ("Autorizar Pago", "Alias de autorizacion final"),

            # Admin Financiero
            ("Dashboard Admin Financiero", "Dashboard administrativo financiero"),
            ("Gestion Usuarios Financiero", "Gestion de usuarios del modulo financiero"),
            ("Gestion Proveedores", "Gestion de proveedores"),
            ("Parametrizacion SLA", "Parametrizacion de SLA por etapa"),
            ("Reportes Consolidados Financiero", "Reportes financieros consolidados"),
            ("Configuracion Sistema Financiero", "Configuracion del sistema financiero"),
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

        departamento, _ = Departamento.objects.get_or_create(
            codigo='ADM',
            defaults={
                'nombre': 'Administración',
                'tipo': 'Administrativo',
                'estado': 'Activo',
            },
        )

        hoy = timezone.now().date()
        facturas_demo = [
            {
                'numero_factura': 'FAC-2026-001',
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
                'numero_factura': 'FAC-2026-002',
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
                'numero_factura': 'FAC-2026-003',
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
        ]

        for data in facturas_demo:
            factura, created = Factura.objects.get_or_create(
                numero_factura=data['numero_factura'],
                defaults=data,
            )
            msg = "Creada" if created else "Existente"
            self.stdout.write(f"  - {msg}: Factura {factura.numero_factura}")

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
