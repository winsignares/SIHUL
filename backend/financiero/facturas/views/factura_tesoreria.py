from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import IntegrityError, transaction
from django.http import HttpResponse
import logging
from io import BytesIO
from django.utils import timezone
from django.utils.dateparse import parse_date
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.pdfgen import canvas

from financiero.facturas.models import Factura, HistorialFactura
from financiero.facturas.serializers import DocumentoAdjuntoSerializer
from financiero.facturas.upload_paths import _safe_path_segment
from financiero.facturas.sla import actualizar_sla_factura


from .helpers import _documento_upload_metadata, _guardar_documento_en_carpeta_compartida, _regenerar_pdf_unificado_nas

logger = logging.getLogger(__name__)


class FacturaTesoreriaMixin:
    """Control de pago, tesoreria, pago aplicado y comprobantes."""


    @action(detail=True, methods=['post'], url_path='confirmar_control_pago')
    def confirmar_control_pago(self, request, pk=None):
        """Registrar control de pago sin cerrar la etapa de pago aplicado."""
        factura = self.get_object()

        if factura.estado != 'Autorizada':
            return Response(
                {'error': 'La factura debe estar autorizada para confirmar control de pago'},
                status=status.HTTP_400_BAD_REQUEST
            )

        observaciones = (request.data.get('observaciones') or '').strip()

        if not factura.numero_confirmacion:
            for _ in range(5):
                factura.numero_confirmacion = self._generar_numero_confirmacion()
                try:
                    factura.save(update_fields=['numero_confirmacion'])
                    break
                except IntegrityError:
                    factura.numero_confirmacion = None

            if not factura.numero_confirmacion:
                return Response(
                    {'error': 'No fue posible generar un número de confirmación único'},
                    status=status.HTTP_409_CONFLICT
                )

        factura.etapa_actual = 'Control de Pago Bancario'
        factura.fecha_inicio_etapa = timezone.now().date()
        factura.usuario_responsable = request.user

        if observaciones:
            factura.observaciones = '\n'.join(filter(None, [factura.observaciones, f"[Control Pago] {observaciones}"]))

        factura.save()

        actualizar_sla_factura(factura)

        HistorialFactura.objects.create(
            factura=factura,
            accion='Control de pago bancario confirmado',
            estado_anterior='Autorizada',
            estado_nuevo='Control de Pago Bancario',
            usuario=request.user,
            usuario_nombre=request.user.nombre,
            usuario_rol=request.user.rol.nombre if request.user.rol else 'Sin rol',
            observacion=observaciones or None,
            datos_adicionales={'numero_confirmacion': factura.numero_confirmacion},
        )

        return Response(
            self._factura_response_data(factura),
            status=status.HTTP_200_OK
        )


    @action(detail=True, methods=['post'], url_path='generar_numero_confirmacion')
    def generar_numero_confirmacion(self, request, pk=None):
        """Generar y persistir el numero de confirmacion antes de confirmar el control."""
        factura = self.get_object()

        if factura.estado != 'Autorizada':
            return Response(
                {'error': 'La factura debe estar autorizada para generar el numero de confirmacion'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not factura.numero_confirmacion:
            for _ in range(5):
                factura.numero_confirmacion = self._generar_numero_confirmacion()
                try:
                    factura.save(update_fields=['numero_confirmacion'])
                    break
                except IntegrityError:
                    factura.numero_confirmacion = None

            if not factura.numero_confirmacion:
                return Response(
                    {'error': 'No fue posible generar un numero de confirmacion unico'},
                    status=status.HTTP_409_CONFLICT
                )

        return Response(
            self._factura_response_data(factura),
            status=status.HTTP_200_OK
        )


    @action(detail=True, methods=['post'], url_path='enviar_direccion_financiera')
    def enviar_direccion_financiera(self, request, pk=None):
        """Enviar una factura aprobada a Dirección Financiera."""
        factura = self.get_object()

        if factura.estado != 'Aprobada Auditoría':
            return Response(
                {'error': 'La factura debe estar aprobada por Auditoría'},
                status=status.HTTP_400_BAD_REQUEST
            )

        observaciones = (request.data.get('observaciones') or '').strip()
        estado_anterior = factura.estado

        factura.estado = 'Revisada Dir. Financiera'
        factura.fecha_revision_direccion = timezone.now().date()
        factura.etapa_actual = 'Cargue Formal'
        factura.fecha_inicio_etapa = factura.fecha_revision_direccion
        factura.usuario_responsable = request.user

        if observaciones:
            factura.observaciones = '\n'.join(filter(None, [factura.observaciones, f"[Tesorería] {observaciones}"]))

        factura.save()

        actualizar_sla_factura(factura)

        HistorialFactura.objects.create(
            factura=factura,
            accion='Factura enviada a Dirección Financiera',
            estado_anterior=estado_anterior,
            estado_nuevo='Revisada Dir. Financiera',
            usuario=request.user,
            usuario_nombre=request.user.nombre,
            usuario_rol=request.user.rol.nombre if request.user.rol else 'Sin rol',
            observacion=observaciones or None,
        )

        self._notificar_transicion(factura, estado_anterior, 'Revisada Dir. Financiera')

        return Response(
            self._factura_response_data(factura),
            status=status.HTTP_200_OK
        )


    @action(detail=True, methods=['post'], url_path='registrar_pago_aplicado')
    def registrar_pago_aplicado(self, request, pk=None):
        """Registrar pago aplicado en tesorería."""
        factura = self.get_object()

        if factura.estado != 'Autorizada':
            return Response(
                {'error': 'La factura debe estar autorizada para pago'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not factura.numero_confirmacion:
            return Response(
                {'error': 'Debe confirmar el control de pago en Dirección Financiera antes de registrar el pago aplicado'},
                status=status.HTTP_400_BAD_REQUEST
            )

        numero_transaccion = (request.data.get('numero_transaccion') or '').strip()
        observaciones = (request.data.get('observaciones') or '').strip()
        fecha_pago = request.data.get('fecha_pago_aplicado')
        fecha_pago_parsed = None
        if fecha_pago:
            fecha_pago_parsed = parse_date(str(fecha_pago))
            if not fecha_pago_parsed:
                return Response(
                    {'error': 'La fecha de pago aplicado no es valida. Use el formato YYYY-MM-DD.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        comprobante_bancario = request.FILES.get('comprobante_bancario')

        if not numero_transaccion:
            return Response(
                {'error': 'Debe registrar el número de transacción bancaria'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if Factura.objects.filter(numero_transaccion=numero_transaccion).exclude(pk=factura.pk).exists():
            return Response(
                {'error': 'El número de transacción bancaria ya está registrado en otra factura.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not comprobante_bancario:
            return Response(
                {'error': 'Debe adjuntar el comprobante bancario en archivo (PDF/XML/PNG/JPG).'},
                status=status.HTTP_400_BAD_REQUEST
            )

        estado_anterior = factura.estado

        try:
            with transaction.atomic():
                factura.numero_transaccion = numero_transaccion
                factura.fecha_pago_aplicado = fecha_pago_parsed or timezone.now().date()
                factura.fecha_comprobante = factura.fecha_pago_aplicado
                factura.estado = 'Pagada'
                factura.etapa_actual = 'Pago Aplicado'
                factura.fecha_inicio_etapa = factura.fecha_pago_aplicado
                factura.usuario_responsable = request.user

                if observaciones:
                    factura.observaciones = '\n'.join(filter(None, [factura.observaciones, f"[Tesorería] {observaciones}"]))

                factura.save()

                actualizar_sla_factura(factura)

                documento_data = {
                    'factura': factura.id,
                    'nombre_archivo': comprobante_bancario.name,
                    'tipo_documento': 'Comprobante de Pago',
                    'url_storage': comprobante_bancario.name,
                    'tamano_bytes': comprobante_bancario.size,
                    'tipo_mime': getattr(comprobante_bancario, 'content_type', '') or None,
                    'archivo': comprobante_bancario,
                }
                documento_serializer = DocumentoAdjuntoSerializer(
                    data=documento_data,
                    context={'request': request}
                )
                documento_serializer.is_valid(raise_exception=True)
                content_bytes, tamano_bytes, hash_archivo = _documento_upload_metadata(comprobante_bancario)
                _guardar_documento_en_carpeta_compartida(
                    factura=factura,
                    nombre_archivo=documento_serializer.validated_data.get('nombre_archivo') or comprobante_bancario.name,
                    tipo_documento='Comprobante de Pago',
                    tipo_mime=documento_serializer.validated_data.get('tipo_mime') or getattr(comprobante_bancario, 'content_type', ''),
                    content_bytes=content_bytes,
                    tamano_bytes=tamano_bytes,
                    hash_archivo=hash_archivo,
                    usuario=request.user,
                )
                _regenerar_pdf_unificado_nas(factura)

                HistorialFactura.objects.create(
                    factura=factura,
                    accion='Pago aplicado y factura pagada',
                    estado_anterior=estado_anterior,
                    estado_nuevo='Pagada',
                    usuario=request.user,
                    usuario_nombre=request.user.nombre,
                    usuario_rol=request.user.rol.nombre if request.user.rol else 'Sin rol',
                    observacion=observaciones or None,
                )

                self._notificar_transicion(factura, estado_anterior, 'Pagada')
        except IntegrityError:
            return Response(
                {'error': 'El número de transacción bancaria ya está registrado en otra factura.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except ValidationError as exc:
            return Response(
                {
                    'error': 'Datos de validacion incorrectos.',
                    'detail': exc.detail,
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as exc:
            logger.exception('Error registrando pago aplicado factura_id=%s', factura.id)
            return Response(
                {
                    'error': 'No fue posible registrar el pago aplicado.',
                    'detail': str(exc),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response(
            self._factura_response_data(factura),
            status=status.HTTP_200_OK
        )


    @action(detail=True, methods=['post'], url_path='generar_comprobante')
    def generar_comprobante(self, request, pk=None):
        """Compatibilidad: cerrar facturas antiguas en Pago Aplicado como Pagada."""
        factura = self.get_object()

        if factura.estado not in ['Pago Aplicado', 'Pagada']:
            return Response(
                {'error': 'La factura debe estar con pago aplicado o pagada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        numero_comprobante = (request.data.get('numero_comprobante') or '').strip()
        observaciones = (request.data.get('observaciones') or '').strip()

        estado_anterior = factura.estado

        if numero_comprobante:
            factura.numero_comprobante = numero_comprobante
        factura.fecha_comprobante = factura.fecha_comprobante or factura.fecha_pago_aplicado or timezone.now().date()
        factura.estado = 'Pagada'
        factura.etapa_actual = 'Pago Aplicado'
        factura.fecha_inicio_etapa = factura.fecha_comprobante
        factura.usuario_responsable = request.user

        if observaciones:
            factura.observaciones = '\n'.join(filter(None, [factura.observaciones, f"[Tesorería] {observaciones}"]))

        factura.save()

        actualizar_sla_factura(factura)

        HistorialFactura.objects.create(
            factura=factura,
            accion='Factura marcada como pagada',
            estado_anterior=estado_anterior,
            estado_nuevo='Pagada',
            usuario=request.user,
            usuario_nombre=request.user.nombre,
            usuario_rol=request.user.rol.nombre if request.user.rol else 'Sin rol',
            observacion=observaciones or None,
        )

        self._notificar_transicion(factura, estado_anterior, 'Pagada')

        return Response(
            self._factura_response_data(factura),
            status=status.HTTP_200_OK
        )


    @action(detail=True, methods=['get'], url_path='comprobante_pdf')
    def comprobante_pdf(self, request, pk=None):
        """Compatibilidad: entregar el expediente unificado de la factura pagada."""
        factura = self.get_object()

        if factura.estado not in ['Pago Aplicado', 'Pagada']:
            return Response(
                {'error': 'La factura debe estar en pago aplicado o pagada para descargar el expediente.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        scope = self._resolve_scope_documental(request)
        documentos = self._documentos_filtrados_por_scope(factura, scope)
        content = self._pdf_consolidado_documentos(factura, documentos, scope)
        filename = f"Expediente_{_safe_path_segment(factura.numero_factura or factura.id)}.pdf"
        response = HttpResponse(content, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

        proveedor = factura.proveedor
        departamento = factura.departamento
        fecha_emision = factura.fecha_comprobante or timezone.now().date()
        numero_factura = factura.numero_factura or f"FAC-{factura.id}"

        output = BytesIO()
        pdf = canvas.Canvas(output, pagesize=letter)
        width, height = letter

        # Encabezado
        pdf.setFillColor(colors.HexColor('#991b1b'))
        pdf.rect(0, height - 80, width, 80, stroke=0, fill=1)
        pdf.setFillColor(colors.white)
        pdf.setFont('Helvetica-Bold', 16)
        pdf.drawString(40, height - 50, 'Comprobante de Egreso')
        pdf.setFont('Helvetica', 9)
        pdf.drawString(40, height - 66, 'Sistema Benji - Tesoreria')

        # Metadatos principales
        pdf.setFillColor(colors.black)
        pdf.setFont('Helvetica-Bold', 10)
        pdf.drawString(40, height - 110, f"Comprobante: {factura.numero_comprobante}")
        pdf.drawString(320, height - 110, f"Fecha: {fecha_emision}")

        # Seccion proveedor
        y = height - 145
        pdf.setFont('Helvetica-Bold', 11)
        pdf.drawString(40, y, 'Proveedor')
        pdf.setFont('Helvetica', 9)
        y -= 14
        pdf.drawString(40, y, f"Razon social: {proveedor.razon_social}")
        y -= 12
        pdf.drawString(40, y, f"NIT: {proveedor.nit}")
        y -= 12
        pdf.drawString(40, y, f"Contacto: {proveedor.email or 'Sin correo'} | {proveedor.telefono or 'Sin telefono'}")

        # Seccion factura
        y -= 22
        pdf.setFont('Helvetica-Bold', 11)
        pdf.drawString(40, y, 'Factura')
        pdf.setFont('Helvetica', 9)
        y -= 14
        pdf.drawString(40, y, f"Numero factura: {numero_factura}")
        pdf.drawString(320, y, f"Numero radicado: {factura.numero_radicado or 'Sin radicado'}")
        y -= 12
        pdf.drawString(40, y, f"Proceso de pago: {factura.numero_proceso_pago or 'Sin proceso'}")
        pdf.drawString(320, y, f"Transaccion bancaria: {factura.numero_transaccion or 'Sin transaccion'}")
        y -= 12
        pdf.drawString(40, y, f"Fecha autorizacion: {factura.fecha_autorizacion or 'Sin fecha'}")
        pdf.drawString(320, y, f"Fecha pago aplicado: {factura.fecha_pago_aplicado or 'Sin fecha'}")
        y -= 12
        pdf.drawString(40, y, f"Area solicitante: {departamento.nombre if departamento else 'Sin area'}")

        # Valores
        y -= 22
        pdf.setFont('Helvetica-Bold', 11)
        pdf.drawString(40, y, 'Valores')
        pdf.setFont('Helvetica', 9)
        y -= 14
        pdf.drawString(40, y, f"Subtotal: ${factura.valor_subtotal:,.2f}")
        pdf.drawString(200, y, f"IVA: ${factura.valor_iva:,.2f}")
        pdf.drawString(320, y, f"Retenciones: ${factura.valor_retencion_renta + factura.valor_retencion_iva + factura.valor_retencion_ica:,.2f}")
        y -= 12
        pdf.setFont('Helvetica-Bold', 10)
        pdf.drawString(40, y, f"Total pagado: ${factura.valor_total:,.2f}")

        # Observaciones
        y -= 26
        pdf.setFont('Helvetica-Bold', 11)
        pdf.drawString(40, y, 'Observaciones')
        pdf.setFont('Helvetica', 9)
        y -= 14
        pdf.drawString(40, y, (factura.observaciones or 'Sin observaciones')[:160])

        # Firma
        pdf.setFont('Helvetica', 8)
        pdf.drawString(40, 60, f"Generado por: {request.user.nombre} | Rol: {request.user.rol.nombre if request.user.rol else 'Sin rol'}")
        pdf.drawString(40, 45, 'Este documento es valido sin firma manuscrita y queda registrado en el sistema.')

        pdf.save()
        content = output.getvalue()
        output.close()

        filename = f"Comprobante_Egreso_{factura.numero_comprobante}.pdf"
        response = HttpResponse(content, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response


    @action(detail=True, methods=['post'], url_path='detener_en_tesoreria')
    def detener_en_tesoreria(self, request, pk=None):
        """Detener una factura en tesorería por inconsistencias sin enviarla a auditoría."""
        factura = self.get_object()

        if factura.estado not in ['Causada', 'Detenida']:
            return Response(
                {'error': 'Solo se pueden detener facturas en estado Causada o Detenida'},
                status=status.HTTP_400_BAD_REQUEST
            )

        observaciones = (request.data.get('observaciones') or '').strip()
        if len(observaciones) < 10:
            return Response(
                {'error': 'Debe registrar una observación de al menos 10 caracteres'},
                status=status.HTTP_400_BAD_REQUEST
            )

        estado_anterior = factura.estado
        factura.estado = 'Detenida'
        factura.etapa_actual = 'Tesorería - Ajustes internos'
        factura.fecha_inicio_etapa = timezone.now().date()
        factura.usuario_responsable = request.user
        factura.observaciones = '\n'.join(filter(None, [factura.observaciones, f"[Tesorería - Detenida] {observaciones}"]))
        factura.save()

        actualizar_sla_factura(factura)

        HistorialFactura.objects.create(
            factura=factura,
            accion='Factura detenida en tesorería',
            estado_anterior=estado_anterior,
            estado_nuevo='Detenida',
            usuario=request.user,
            usuario_nombre=request.user.nombre,
            usuario_rol=request.user.rol.nombre if request.user.rol else 'Sin rol',
            observacion=observaciones,
        )

        self._notificar_transicion(factura, estado_anterior, 'Detenida')

        return Response(
            self._factura_response_data(factura),
            status=status.HTTP_200_OK
        )
