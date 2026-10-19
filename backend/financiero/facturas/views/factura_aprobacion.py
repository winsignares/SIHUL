from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
import logging
from django.utils import timezone

from financiero.facturas.models import HistorialFactura, RechazoDevolucion
from financiero.facturas.sla import actualizar_sla_factura


from .helpers import ESTADO_CARGADA, ESTADO_DEVUELTA, ESTADO_ENVIADA_RECTORIA, ESTADO_RECHAZADA_POR_RECTORIA, ESTADO_REVISADA_DIRECCION_FINANCIERA, _estado_matches, _factura_ciclo_documental_actual

logger = logging.getLogger(__name__)


class FacturaAprobacionMixin:
    """Flujo de aprobaciones (Rectoria, Auditoria, Direccion Financiera) y rechazos."""


    @action(detail=True, methods=['post'], url_path='cargar_direccion_financiera')
    def cargar_direccion_financiera(self, request, pk=None):
        """Registrar el cargue formal en Dirección Financiera antes de rectoría."""
        factura = self.get_object()

        if not any(
            _estado_matches(factura.estado, estado_valido)
            for estado_valido in [
                ESTADO_REVISADA_DIRECCION_FINANCIERA,
                ESTADO_DEVUELTA,
                ESTADO_RECHAZADA_POR_RECTORIA,
            ]
        ):
            return Response(
                {'error': 'La factura debe estar revisada o devuelta para ser cargada en Dirección Financiera'},
                status=status.HTTP_400_BAD_REQUEST
            )

        observaciones = (request.data.get('observaciones') or '').strip()
        estado_anterior = factura.estado

        factura.estado = ESTADO_CARGADA
        factura.fecha_cargue = timezone.now().date()
        factura.etapa_actual = 'Autorización de Pago'
        factura.fecha_inicio_etapa = factura.fecha_cargue
        factura.usuario_responsable = request.user

        if observaciones:
            factura.observaciones = '\n'.join(filter(None, [factura.observaciones, f"[Dirección Financiera] {observaciones}"]))

        factura.save()

        actualizar_sla_factura(factura)

        HistorialFactura.objects.create(
            factura=factura,
            accion='Factura cargada en dirección financiera',
            estado_anterior=estado_anterior,
            estado_nuevo=ESTADO_CARGADA,
            usuario=request.user,
            usuario_nombre=request.user.nombre,
            usuario_rol=request.user.rol.nombre if request.user.rol else 'Sin rol',
            observacion=observaciones or None,
        )

        self._notificar_transicion(factura, estado_anterior, ESTADO_CARGADA)

        return Response(
            self._factura_response_data(factura),
            status=status.HTTP_200_OK
        )


    @action(detail=True, methods=['post'], url_path='enviar_rectoria')
    def enviar_rectoria(self, request, pk=None):
        """Enviar una factura cargada a Rectoría para autorización final."""
        factura = self.get_object()

        if not _estado_matches(factura.estado, ESTADO_CARGADA):
            return Response(
                {'error': 'La factura debe estar cargada para enviarla a Rectoría'},
                status=status.HTTP_400_BAD_REQUEST
            )

        observaciones = (request.data.get('observaciones') or '').strip()
        estado_anterior = factura.estado

        factura.estado = ESTADO_ENVIADA_RECTORIA
        factura.fecha_envio_rectoria = timezone.now().date()
        factura.etapa_actual = 'Autorización de Pago'
        factura.fecha_inicio_etapa = factura.fecha_envio_rectoria
        factura.usuario_responsable = request.user

        if observaciones:
            factura.observaciones = '\n'.join(filter(None, [factura.observaciones, f"[Dirección Financiera - Envío] {observaciones}"]))

        factura.save()

        actualizar_sla_factura(factura)

        HistorialFactura.objects.create(
            factura=factura,
            accion='Factura enviada a rectoría',
            estado_anterior=estado_anterior,
            estado_nuevo=ESTADO_ENVIADA_RECTORIA,
            usuario=request.user,
            usuario_nombre=request.user.nombre,
            usuario_rol=request.user.rol.nombre if request.user.rol else 'Sin rol',
            observacion=observaciones or None,
        )

        self._notificar_transicion(factura, estado_anterior, ESTADO_ENVIADA_RECTORIA)

        return Response(
            self._factura_response_data(factura),
            status=status.HTTP_200_OK
        )


    @action(detail=True, methods=['post'], url_path='autorizar_rectoria')
    def autorizar_rectoria(self, request, pk=None):
        """Autorizar una factura desde Rectoría para continuar con tesorería."""
        factura = self.get_object()

        if not _estado_matches(factura.estado, ESTADO_ENVIADA_RECTORIA):
            return Response(
                {'error': 'La factura debe estar enviada a Rectoría para autorizarla'},
                status=status.HTTP_400_BAD_REQUEST
            )

        observaciones = (request.data.get('observaciones') or '').strip()
        estado_anterior = factura.estado

        hoy = timezone.now().date()

        factura.estado = 'Autorizada'
        factura.fecha_autorizacion = hoy
        factura.etapa_actual = 'Aplicación de Pago'
        factura.fecha_inicio_etapa = hoy
        factura.usuario_responsable = request.user

        if observaciones:
            factura.observaciones = '\n'.join(filter(None, [factura.observaciones, f"[Rectoría] {observaciones}"]))

        factura.save()

        actualizar_sla_factura(factura)

        HistorialFactura.objects.create(
            factura=factura,
            accion='Factura autorizada por Rectoría',
            estado_anterior=estado_anterior,
            estado_nuevo='Autorizada',
            usuario=request.user,
            usuario_nombre=request.user.nombre,
            usuario_rol=request.user.rol.nombre if request.user.rol else 'Sin rol',
            observacion=observaciones or None,
        )

        self._notificar_transicion(factura, estado_anterior, 'Autorizada')

        return Response(
            self._factura_response_data(factura),
            status=status.HTTP_200_OK
        )


    @action(detail=True, methods=['post'], url_path='rechazar_rectoria')
    def rechazar_rectoria(self, request, pk=None):
        """Rechazar una factura desde Rectoría y devolverla a Dirección Financiera."""
        factura = self.get_object()

        if not _estado_matches(factura.estado, ESTADO_ENVIADA_RECTORIA):
            return Response(
                {'error': 'La factura debe estar enviada a Rectoría para rechazarla'},
                status=status.HTTP_400_BAD_REQUEST
            )

        motivo = (request.data.get('motivo') or '').strip()
        if len(motivo) < 10:
            return Response(
                {'error': 'Debe registrar un motivo de rechazo (mínimo 10 caracteres)'},
                status=status.HTTP_400_BAD_REQUEST
            )

        estado_anterior = factura.estado
        factura.estado = ESTADO_RECHAZADA_POR_RECTORIA
        factura.etapa_actual = 'Corrección Dirección Financiera'
        factura.fecha_inicio_etapa = timezone.now().date()
        factura.usuario_responsable = None
        factura.observaciones = '\n'.join(filter(None, [factura.observaciones, f"[Rectoría - Rechazo] {motivo}"]))
        factura.save()

        actualizar_sla_factura(factura)

        RechazoDevolucion.objects.create(
            factura=factura,
            tipo='Rechazo',
            etapa_rechazo='Rectoría',
            motivo=motivo,
            estado_devolucion='Pendiente Corrección',
            usuario_rechaza=request.user,
        )

        HistorialFactura.objects.create(
            factura=factura,
            accion='Factura rechazada por rectoría',
            estado_anterior=estado_anterior,
            estado_nuevo=ESTADO_RECHAZADA_POR_RECTORIA,
            usuario=request.user,
            usuario_nombre=request.user.nombre,
            usuario_rol=request.user.rol.nombre if request.user.rol else 'Sin rol',
            observacion=motivo,
        )

        self._notificar_transicion(factura, estado_anterior, ESTADO_RECHAZADA_POR_RECTORIA)

        return Response(
            self._factura_response_data(factura),
            status=status.HTTP_200_OK
        )


    @action(detail=True, methods=['post'], url_path='aprobar_auditoria')
    def aprobar_auditoria(self, request, pk=None):
        """Aprobar una factura en control previo de auditoría."""
        factura = self.get_object()

        if factura.estado != 'Alistada':
            return Response(
                {'error': 'La factura debe estar alistada para auditoría'},
                status=status.HTTP_400_BAD_REQUEST
            )

        observaciones = (request.data.get('observaciones') or '').strip()
        estado_anterior = factura.estado

        factura.estado = 'Aprobada Auditoría'
        factura.fecha_aprobacion_auditoria = timezone.now().date()
        factura.etapa_actual = 'Cargue Formal'
        factura.fecha_inicio_etapa = factura.fecha_aprobacion_auditoria
        factura.usuario_responsable = request.user

        if observaciones:
            factura.observaciones = '\n'.join(filter(None, [factura.observaciones, f"[Auditoría] {observaciones}"]))

        factura.save()

        actualizar_sla_factura(factura)

        HistorialFactura.objects.create(
            factura=factura,
            accion='Factura aprobada por auditoría',
            estado_anterior=estado_anterior,
            estado_nuevo='Aprobada Auditoría',
            usuario=request.user,
            usuario_nombre=request.user.nombre,
            usuario_rol=request.user.rol.nombre if request.user.rol else 'Sin rol',
            observacion=observaciones or None,
        )

        self._notificar_transicion(factura, estado_anterior, 'Aprobada Auditoría')

        return Response(
            self._factura_response_data(factura),
            status=status.HTTP_200_OK
        )


    @action(detail=True, methods=['post'], url_path='rechazar_auditoria')
    def rechazar_auditoria(self, request, pk=None):
        """Rechazar una factura en auditoría y devolverla a tesorería."""
        factura = self.get_object()

        if factura.estado != 'Alistada':
            return Response(
                {'error': 'La factura debe estar alistada para auditoría'},
                status=status.HTTP_400_BAD_REQUEST
            )

        motivo = (request.data.get('motivo') or '').strip()
        if len(motivo) < 10:
            return Response(
                {'error': 'Debe registrar un motivo de rechazo (mínimo 10 caracteres)'},
                status=status.HTTP_400_BAD_REQUEST
            )

        estado_anterior = factura.estado
        factura.estado = 'Rechazada Auditoría'
        factura.etapa_actual = 'Tesorería - Ajustes internos'
        factura.fecha_inicio_etapa = timezone.now().date()
        factura.usuario_responsable = None
        factura.observaciones = '\n'.join(filter(None, [factura.observaciones, f"[Auditoría - Rechazo] {motivo}"]))
        factura.save()

        actualizar_sla_factura(factura)

        HistorialFactura.objects.create(
            factura=factura,
            accion='Factura rechazada por auditoría',
            estado_anterior=estado_anterior,
            estado_nuevo='Rechazada Auditoría',
            usuario=request.user,
            usuario_nombre=request.user.nombre,
            usuario_rol=request.user.rol.nombre if request.user.rol else 'Sin rol',
            observacion=motivo,
        )

        self._notificar_transicion(factura, estado_anterior, 'Rechazada Auditoría')

        return Response(
            self._factura_response_data(factura),
            status=status.HTTP_200_OK
        )


    @action(detail=True, methods=['post'])
    def rechazar(self, request, pk=None):
        """Rechazar una factura con motivo"""
        factura = self.get_object()
        motivo = (request.data.get('motivo') or '').strip()

        if len(motivo) < 10:
            return Response(
                {'error': 'El motivo de rechazo/devolución es obligatorio (mínimo 10 caracteres).'},
                status=status.HTTP_400_BAD_REQUEST
            )

        estado_anterior = factura.estado

        rol_nombre = (request.user.rol.nombre if getattr(request.user, 'rol', None) else '').strip()
        destino = (request.data.get('destino') or '').strip().lower()

        if rol_nombre == 'Funcionario':
            estado_destino = 'Devuelta'
            etapa_destino = 'Devolución'
            responsable_destino = None
        elif destino == 'radicacion':
            estado_destino = 'Radicada'
            etapa_destino = 'Corrección Radicación'
            responsable_destino = None
        elif destino == 'proveedor':
            estado_destino = 'Devuelta'
            etapa_destino = 'Corrección Proveedor'
            responsable_destino = factura.creado_por
        elif destino == 'funcionario' or estado_anterior in ['Recibida', 'Registrada', 'Radicada']:
            estado_destino = 'Registrada'
            etapa_destino = 'Corrección Funcionario'
            responsable_destino = factura.creado_por
        else:
            estado_destino = 'Devuelta'
            etapa_destino = 'Devolución'
            responsable_destino = None
        
        n_devoluciones = RechazoDevolucion.objects.filter(factura=factura).count()

        RechazoDevolucion.objects.create(
            factura=factura,
            tipo='Rechazo',
            etapa_rechazo=factura.etapa_actual,
            motivo=motivo,
            estado_devolucion='Pendiente Corrección',
            usuario_rechaza=request.user
        )

        factura.estado = estado_destino
        factura.etapa_actual = etapa_destino
        factura.fecha_inicio_etapa = timezone.now().date()
        factura.usuario_responsable = responsable_destino
        factura.ciclo_documental_actual = _factura_ciclo_documental_actual(factura) + 1
        factura.save()

        # Archivar documentos del NAS cuando se devuelve al proveedor
        if estado_destino == 'Devuelta':
            from financiero.facturas.shared_storage import shared_storage
            version_label = f'devolucion_{n_devoluciones + 1:02d}'
            result = shared_storage.archive_documents_folder(factura, version_label)
            if not result.success and result.error_code not in ('DISABLED', 'NETWORK_ERROR'):
                logger.warning(
                    '[SHARED_STORAGE] No se pudieron archivar documentos al devolver. factura_id=%s error=%s',
                    factura.id, result.error_code,
                )

        actualizar_sla_factura(factura)

        HistorialFactura.objects.create(
            factura=factura,
            accion='Factura devuelta',
            estado_anterior=estado_anterior,
            estado_nuevo=estado_destino,
            usuario=request.user,
            usuario_nombre=request.user.nombre,
            usuario_rol=request.user.rol.nombre if request.user.rol else 'Sin rol',
            observacion=motivo
        )

        self._notificar_transicion(factura, estado_anterior, estado_destino)

        return Response(
            {'mensaje': f'Factura rechazada y enviada a {estado_destino}'},
            status=status.HTTP_200_OK
        )
