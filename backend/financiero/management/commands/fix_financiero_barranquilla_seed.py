from django.core.management.base import BaseCommand
from django.db.models import Q

from componentes.models import Componente, ComponenteRol
from financiero.models import (
    CentroCosto,
    CuentaContable,
    Departamento,
    Factura,
    ParametroSLA,
    ParametrosFinanciero,
    Proveedor,
    ReporteGenerado,
)
from sedes.models import Seccional, Sede
from usuarios.models import Rol, Usuario


FINANCIAL_ROLE_NAMES = [
    'Funcionario',
    'Contabilidad',
    'Tesorería',
    'Tesoreria',
    'Auditoría',
    'Auditoria',
    'Dirección Financiera',
    'Direccion Financiera',
    'Rectoría',
    'Rectoria',
    'Admin Financiero',
    'Proveedor',
]

FINANCIAL_COMPONENT_NAMES = [
    'Dashboard Financiero',
    'Mis Pendientes',
    'Registrar Factura',
    'Consultar Facturas',
    'Gestión de Facturas',
    'Dashboard Contabilidad',
    'Mis Pendientes Contabilidad',
    'Radicar Facturas',
    'Causar Facturas',
    'Dashboard Tesoreria',
    'Mis Pendientes Tesoreria',
    'Alistar Pagos',
    'Enviar Direccion Financiera',
    'Registrar Pago Aplicado',
    'Factura Pagada',
    'Dashboard Auditoria',
    'Mis Pendientes Auditoria',
    'Control Previo',
    'Dashboard Direccion Financiera',
    'Mis Pendientes Direccion Financiera',
    'Revisar Pagos Direccion Financiera',
    'Enviar a Rectoria',
    'Confirmacion Pagos Direccion Financiera',
    'Dashboard Rectoria',
    'Mis Pendientes Rectoria',
    'Autorizar Pagos',
    'Dashboard Admin Financiero',
    'Gestion Usuarios Financiero',
    'Gestion Proveedores',
    'Parametrizacion SLA',
    'Reportes Consolidados Financiero',
    'Configuracion Sistema Financiero',
    'Dashboard Proveedor',
    'Mis Facturas Proveedor',
    'Consultar Estado Facturas',
]


class Command(BaseCommand):
    help = 'Repara seeds financieros antiguos asignándolos a la seccional Barranquilla.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--seccional',
            default='Barranquilla',
            help='Ciudad de la seccional financiera destino. Default: Barranquilla.',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Muestra qué se corregiría sin escribir cambios.',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        seccional, sede = self._resolve_scope(options['seccional'], dry_run=dry_run)

        self.stdout.write(self.style.NOTICE(
            f'Scope destino: seccional={seccional.ciudad} sede={sede.nombre} dry_run={dry_run}'
        ))

        total = 0
        total += self._assign_unique_catalog(Proveedor, seccional, 'nit', dry_run)
        total += self._assign_unique_catalog(Departamento, seccional, 'codigo', dry_run)
        total += self._assign_unique_catalog(CuentaContable, seccional, 'codigo', dry_run)
        total += self._assign_unique_catalog(CentroCosto, seccional, 'codigo', dry_run)
        total += self._assign_null_seccional(Factura, seccional, dry_run)
        total += self._assign_unique_catalog(ParametroSLA, seccional, 'etapa', dry_run)
        total += self._assign_unique_catalog(ParametrosFinanciero, seccional, 'clave', dry_run)
        total += self._assign_null_seccional(ReporteGenerado, seccional, dry_run)
        total += self._assign_financial_component_roles(seccional, dry_run)
        total += self._assign_financial_users(seccional, sede, dry_run)
        total += self._link_provider_users(seccional, sede, dry_run)

        if dry_run:
            self.stdout.write(self.style.WARNING(f'Dry-run completo. Cambios pendientes estimados: {total}.'))
        else:
            self.stdout.write(self.style.SUCCESS(f'Reparación completa. Registros actualizados: {total}.'))

    def _resolve_scope(self, seccional_ciudad, dry_run=False):
        ciudad = (seccional_ciudad or 'Barranquilla').strip() or 'Barranquilla'
        seccional = Seccional.objects.filter(ciudad__iexact=ciudad).first()
        if not seccional:
            if dry_run:
                seccional = Seccional(ciudad=ciudad, activa=True)
                seccional.id = -1
            else:
                seccional = Seccional.objects.create(ciudad=ciudad, activa=True)
        elif not seccional.activa and not dry_run:
            seccional.activa = True
            seccional.save(update_fields=['activa'])

        sede = None
        if seccional.pk and seccional.pk > 0:
            sede = (
                Sede.objects
                .filter(seccional=seccional, nombre__icontains=ciudad)
                .order_by('id')
                .first()
            )
            if not sede:
                sede = Sede.objects.filter(seccional=seccional).order_by('id').first()

        if not sede:
            if dry_run:
                sede = Sede(nombre=ciudad, direccion='', seccional=seccional, activa=True)
                sede.id = -1
            else:
                sede = Sede.objects.create(nombre=ciudad, direccion='', seccional=seccional, activa=True)

        return seccional, sede

    def _assign_null_seccional(self, model, seccional, dry_run):
        queryset = model.objects.filter(seccional__isnull=True)
        count = queryset.count()
        if count and not dry_run:
            queryset.update(seccional=seccional)
        self.stdout.write(f'{model.__name__}: {count} sin seccional -> {seccional.ciudad}')
        return count

    def _assign_unique_catalog(self, model, seccional, unique_field, dry_run):
        count = 0
        for obj in model.objects.filter(seccional__isnull=True):
            value = getattr(obj, unique_field)
            target = model.objects.filter(seccional=seccional, **{unique_field: value}).exclude(pk=obj.pk).first()
            count += 1
            if dry_run:
                continue
            if target:
                self._move_known_references(obj, target)
                obj.delete()
            else:
                obj.seccional = seccional
                obj.save(update_fields=['seccional'])
        self.stdout.write(f'{model.__name__}: {count} registros legacy -> {seccional.ciudad}')
        return count

    def _move_known_references(self, source, target):
        if isinstance(source, Proveedor):
            Factura.objects.filter(proveedor=source).update(proveedor=target)
            if source.usuario_id and not target.usuario_id:
                target.usuario = source.usuario
                target.save(update_fields=['usuario'])
            return

        if isinstance(source, Departamento):
            Factura.objects.filter(departamento=source).update(departamento=target)
            CentroCosto.objects.filter(departamento=source).update(departamento=target)
            return

        if isinstance(source, CuentaContable):
            Factura.objects.filter(cuenta_contable=source).update(cuenta_contable=target)
            return

        if isinstance(source, CentroCosto):
            Factura.objects.filter(centro_costo=source).update(centro_costo=target)

    def _assign_financial_component_roles(self, seccional, dry_run):
        roles = Rol.objects.filter(nombre__in=FINANCIAL_ROLE_NAMES)
        componentes = Componente.objects.filter(nombre__in=FINANCIAL_COMPONENT_NAMES)
        queryset = ComponenteRol.objects.filter(
            seccional__isnull=True,
            rol__in=roles,
            componente__in=componentes,
        )
        count = queryset.count()
        if count and not dry_run:
            for componente_rol in queryset:
                target = ComponenteRol.objects.filter(
                    seccional=seccional,
                    rol=componente_rol.rol,
                    componente=componente_rol.componente,
                ).exclude(pk=componente_rol.pk).first()
                if target:
                    componente_rol.delete()
                else:
                    componente_rol.seccional = seccional
                    componente_rol.save(update_fields=['seccional'])
        self.stdout.write(f'ComponenteRol financiero: {count} globales -> {seccional.ciudad}')
        return count

    def _assign_financial_users(self, seccional, sede, dry_run):
        queryset = Usuario.objects.filter(rol__nombre__in=FINANCIAL_ROLE_NAMES).filter(
            Q(sede__isnull=True) | Q(seccional__isnull=True) | ~Q(sede=sede)
        )
        count = queryset.count()
        if count and not dry_run:
            for usuario in queryset:
                usuario.sede = sede
                usuario.save(update_fields=['sede', 'seccional', 'is_active'])
        self.stdout.write(f'Usuarios financieros sin sede: {count} -> {sede.nombre}')
        return count

    def _link_provider_users(self, seccional, sede, dry_run):
        count = 0
        proveedores = Proveedor.objects.filter(seccional=seccional, usuario__isnull=True).exclude(email__isnull=True).exclude(email='')
        for proveedor in proveedores:
            usuario = Usuario.objects.filter(correo__iexact=proveedor.email).first()
            if not usuario:
                continue
            count += 1
            if dry_run:
                continue
            usuario.sede = sede
            if usuario.rol_id is None:
                usuario.rol = Rol.objects.filter(nombre='Proveedor').first()
            usuario.activo = True
            usuario.save(update_fields=['sede', 'seccional', 'rol', 'activo', 'is_active'])
            proveedor.usuario = usuario
            proveedor.save(update_fields=['usuario'])
        self.stdout.write(f'Proveedores vinculables por email: {count}')
        return count
