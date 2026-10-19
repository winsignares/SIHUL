from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
import logging
from django.utils import timezone

from financiero.facturas.models import Factura, HistorialFactura, ItemFactura, RechazoDevolucion
from financiero.facturas.serializers import FacturaDetailSerializer, ItemFacturaSerializer
from financiero.facturas.sla import actualizar_sla_factura


from .helpers import _documento_upload_metadata, _guardar_documento_en_carpeta_compartida, _regenerar_pdf_unificado_nas

logger = logging.getLogger(__name__)


class FacturaRegistroMixin:
    """Registro y correccion de la factura (numero sugerido, radicar, causar, alistar, completar, corregir)."""


    @action(detail=False, methods=['get'])
    def numero_sugerido(self, request):
        """Retorna el próximo número sugerido de factura con formato FAC-YYYY-####."""
        year = timezone.now().year
        prefix = f"FAC-{year}-"
        
        # Obtener todas las facturas del año para ordenarlas numéricamente
        all_facturas = (
            Factura.objects
            .filter(numero_factura__startswith=prefix)
            .values_list('numero_factura', flat=True)
        )
        
        next_seq = 1
        if all_facturas:
            try:
                # Extraer secuencias numéricas y encontrar la máxima
                sequences = []
                for num in all_facturas:
                    seq_str = str(num).split('-')[-1]
                    try:
                        seq = int(seq_str)
                        sequences.append(seq)
                    except (TypeError, ValueError):
                        continue
                
                if sequences:
                    next_seq = max(sequences) + 1
            except Exception:
                next_seq = 1
        
        numero_sugerido = f"{prefix}{next_seq:04d}"
        return Response({'numero_factura': numero_sugerido})


    @action(detail=True, methods=['post'])
    def radicar(self, request, pk=None):
        """Radicar una factura"""
        factura = self.get_object()

        if factura.estado not in ['Recibida', 'Registrada']:
            return Response(
                {'error': 'La factura debe estar en estado Recibida o Registrada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        faltantes = self._obtener_faltantes_radicacion(factura)
        if faltantes:
            return Response(
                {
                    'error': 'No se puede radicar: faltan soportes obligatorios.',
                    'faltantes': faltantes,
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        estado_anterior = factura.estado
        observaciones = (request.data.get('observaciones') or '').strip()
        numero_operacion = (request.data.get('numero_operacion_contable') or '').strip()
        consecutivo_operacion = (request.data.get('consecutivo_operacion') or '').strip()

        if not observaciones:
            return Response(
                {'error': 'Las observaciones son obligatorias para radicar.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not numero_operacion:
            return Response(
                {'error': 'El numero de operacion contable es obligatorio para radicar.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not consecutivo_operacion:
            return Response(
                {'error': 'El consecutivo de operacion es obligatorio para radicar.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        duplicado = Factura.objects.filter(
            consecutivo_operacion=consecutivo_operacion
        ).exclude(pk=factura.pk).first()
        if duplicado:
            return Response(
                {
                    'error': f'El consecutivo "{consecutivo_operacion}" ya está registrado en la factura {duplicado.numero_factura} (Radicado: {duplicado.numero_radicado}). El consecutivo debe ser único en el sistema.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        factura.estado = 'Radicada'
        factura.fecha_radicacion = timezone.now().date()
        factura.fecha_causacion = timezone.now().date()
        factura.numero_radicado = f"{numero_operacion}-{consecutivo_operacion}"
        factura.numero_operacion_contable = numero_operacion
        factura.consecutivo_operacion = consecutivo_operacion
        # Radicación y causación comparten una única etapa SLA de Contabilidad.
        factura.etapa_actual = 'Radicación y Causación'
        factura.fecha_inicio_etapa = factura.fecha_inicio_etapa or factura.fecha_radicacion
        factura.usuario_responsable = request.user
        factura.save()

        actualizar_sla_factura(factura)

        HistorialFactura.objects.create(
            factura=factura,
            accion='Factura radicada',
            estado_anterior=estado_anterior,
            estado_nuevo='Radicada',
            usuario=request.user,
            usuario_nombre=request.user.nombre,
            usuario_rol=request.user.rol.nombre if request.user.rol else 'Sin rol',
            observacion=observaciones or None,
        )

        self._notificar_transicion(factura, estado_anterior, 'Radicada')

        return Response(
            self._factura_response_data(factura),
            status=status.HTTP_200_OK
        )


    @action(detail=True, methods=['post'])
    def causar(self, request, pk=None):
        """Causar una factura"""
        factura = self.get_object()
        
        if factura.estado != 'Radicada':
            return Response(
                {'error': 'La factura debe estar radicada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        observaciones = request.data.get('observaciones', '')
        soporte_causacion = request.FILES.get('soporte_causacion')

        if not soporte_causacion:
            return Response({'error': 'Debe adjuntar el soporte PDF de causacion en Seven.'}, status=status.HTTP_400_BAD_REQUEST)

        nombre_archivo = getattr(soporte_causacion, 'name', 'soporte_causacion_seven.pdf') or 'soporte_causacion_seven.pdf'
        if not nombre_archivo.lower().endswith('.pdf'):
            return Response({'error': 'El soporte de causacion debe estar en formato PDF.'}, status=status.HTTP_400_BAD_REQUEST)
        content_bytes, tamano_bytes, hash_archivo = _documento_upload_metadata(soporte_causacion)

        try:
            _guardar_documento_en_carpeta_compartida(
                factura=factura,
                nombre_archivo=nombre_archivo,
                tipo_documento='Soporte Causacion Seven',
                tipo_mime=getattr(soporte_causacion, 'content_type', '') or 'application/pdf',
                content_bytes=content_bytes,
                tamano_bytes=tamano_bytes,
                hash_archivo=hash_archivo,
                usuario=request.user,
            )
        except ValidationError as exc:
            return Response({'error': 'No fue posible guardar el soporte en la carpeta compartida.', 'detail': exc.detail}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        factura.estado = 'Causada'
        factura.fecha_causacion = timezone.now().date()
        factura.etapa_actual = 'Alistamiento'
        factura.fecha_inicio_etapa = factura.fecha_causacion
        factura.usuario_responsable = request.user
        factura.save()

        _regenerar_pdf_unificado_nas(factura)

        actualizar_sla_factura(factura)

        HistorialFactura.objects.create(
            factura=factura,
            accion='Factura causada',
            estado_anterior='Radicada',
            estado_nuevo='Causada',
            usuario=request.user,
            usuario_nombre=request.user.nombre,
            usuario_rol=request.user.rol.nombre if request.user.rol else 'Sin rol',
            observacion=observaciones or None
        )

        self._notificar_transicion(factura, 'Radicada', 'Causada')

        return Response(
            self._factura_response_data(factura),
            status=status.HTTP_200_OK
        )


    @action(detail=True, methods=['post'])
    def alistar(self, request, pk=None):
        """Alistar una factura"""
        factura = self.get_object()
        
        if factura.estado not in ['Radicada', 'Causada', 'Detenida']:
            return Response(
                {'error': 'La factura debe estar causada o detenida en tesorería'},
                status=status.HTTP_400_BAD_REQUEST
            )

        numero_proceso_pago = (request.data.get('numero_proceso_pago') or '').strip()
        archivo_plano_generado = (request.data.get('archivo_plano_generado') or '').strip()
        observaciones = (request.data.get('observaciones') or '').strip()

        if not numero_proceso_pago and not archivo_plano_generado:
            return Response(
                {'error': 'Debe registrar el número de proceso de pago o un archivo plano generado'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if numero_proceso_pago:
            duplicado = Factura.objects.filter(
                numero_proceso_pago=numero_proceso_pago
            ).exclude(pk=factura.pk).first()
            if duplicado:
                return Response(
                    {'error': f'El número de proceso de pago "{numero_proceso_pago}" ya está registrado en la factura {duplicado.numero_factura}. Cada proceso de pago debe ser único.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        estado_anterior = factura.estado

        if numero_proceso_pago:
            factura.numero_proceso_pago = numero_proceso_pago
        if archivo_plano_generado:
            factura.archivo_plano_generado = archivo_plano_generado
        if observaciones:
            factura.observaciones = '\n'.join(filter(None, [factura.observaciones, f"[Tesorería] {observaciones}"]))

        factura.estado = 'Alistada'
        factura.fecha_alistamiento = timezone.now().date()
        factura.etapa_actual = 'Control Previo'
        factura.fecha_inicio_etapa = factura.fecha_alistamiento
        factura.usuario_responsable = request.user
        factura.save()

        actualizar_sla_factura(factura)

        HistorialFactura.objects.create(
            factura=factura,
            accion='Factura alistada',
            estado_anterior=estado_anterior,
            estado_nuevo='Alistada',
            usuario=request.user,
            usuario_nombre=request.user.nombre,
            usuario_rol=request.user.rol.nombre if request.user.rol else 'Sin rol',
            observacion=observaciones or None,
        )

        self._notificar_transicion(factura, estado_anterior, 'Alistada')

        return Response(
            self._factura_response_data(factura),
            status=status.HTTP_200_OK
        )


    @action(detail=True, methods=['patch'])
    def corregir(self, request, pk=None):
        """Permite al proveedor corregir y reenviar una factura devuelta/rechazada."""
        factura = self.get_object()
        rol_nombre = (request.user.rol.nombre if getattr(request.user, 'rol', None) else '').strip()

        if rol_nombre != 'Proveedor':
            return Response({'error': 'No autorizado para corregir esta factura.'}, status=status.HTTP_403_FORBIDDEN)

        if factura.estado not in ['Devuelta', 'Rechazada']:
            return Response(
                {'error': 'Solo se pueden corregir facturas en estado Devuelta o Rechazada.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        estado_anterior = factura.estado
        # Separar items antes de pasar al serializer de detalle (que no los acepta en escritura)
        items_data = request.data.get('items', None)

        serializer = FacturaDetailSerializer(
            factura,
            data=request.data,
            partial=True,
            context={'request': request}
        )

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()

        # Si vienen items nuevos, reemplazar los existentes
        if items_data is not None:
            items_serializer = ItemFacturaSerializer(data=items_data, many=True)
            items_serializer.is_valid(raise_exception=True)
            if not items_serializer.validated_data:
                return Response(
                    {'items': ['Debe registrar al menos un bien o servicio.']},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            with transaction.atomic():
                ItemFactura.objects.filter(factura=factura).delete()
                for orden, item in enumerate(items_serializer.validated_data, start=1):
                    item.pop('orden', None)
                    ItemFactura.objects.create(factura=factura, orden=orden, **item)

        factura.estado = 'Recibida'
        factura.etapa_actual = 'Recepción y Registro'
        factura.usuario_responsable = None
        factura.fecha_inicio_etapa = timezone.now().date()
        factura.fecha_recepcion = timezone.now().date()
        factura.save(update_fields=['estado', 'etapa_actual', 'usuario_responsable', 'fecha_inicio_etapa', 'fecha_recepcion'])

        observaciones_correccion = (request.data.get('observaciones_correccion') or '').strip()
        if not observaciones_correccion:
            observaciones_correccion = 'Corrección enviada por proveedor.'

        ultimo_rechazo = (
            RechazoDevolucion.objects
            .filter(factura=factura)
            .order_by('-fecha_rechazo')
            .first()
        )
        if ultimo_rechazo:
            ultimo_rechazo.estado_devolucion = 'Reenviada'
            ultimo_rechazo.fecha_correccion = timezone.now()
            ultimo_rechazo.usuario_corrige = request.user
            ultimo_rechazo.observaciones_correccion = observaciones_correccion
            ultimo_rechazo.save(update_fields=[
                'estado_devolucion',
                'fecha_correccion',
                'usuario_corrige',
                'observaciones_correccion'
            ])

        HistorialFactura.objects.create(
            factura=factura,
            accion='Corrección enviada por proveedor',
            estado_anterior=estado_anterior,
            estado_nuevo='Recibida',
            usuario=request.user,
            usuario_nombre=request.user.nombre,
            usuario_rol=request.user.rol.nombre if request.user.rol else 'Sin rol',
            observacion=observaciones_correccion
        )

        actualizar_sla_factura(factura)
        self._notificar_transicion(factura, estado_anterior, factura.estado)

        return Response(
            FacturaDetailSerializer(factura, context={'request': request}).data,
            status=status.HTTP_200_OK
        )


    @action(detail=True, methods=['patch'], url_path='completar_registro')
    def completar_registro(self, request, pk=None):
        """Completar registro de una factura pendiente (desde Mis Pendientes)"""
        factura = self.get_object()
        estado_anterior = factura.estado
        
        # Permitir facturas en estado 'Recibida', 'Registrada' o 'Devuelta' para reproceso.
        if factura.estado not in ['Recibida', 'Registrada', 'Devuelta']:
            return Response(
                {'error': f'Solo se pueden completar facturas en estado Recibida, Registrada o Devuelta. Estado actual: {factura.estado}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Permitir actualización de campos específicos sin validaciones estrictas
        serializer = FacturaDetailSerializer(
            factura, 
            data=request.data, 
            partial=True
        )
        
        if serializer.is_valid():
            # Cambiar estado a 'Registrada' al completar el registro
            factura.estado = 'Registrada'
            factura.etapa_actual = 'Radicación y Causación'
            # Asignar responsable si no está asignado
            if not factura.usuario_responsable:
                factura.usuario_responsable = request.user

            if not factura.fecha_inicio_etapa:
                factura.fecha_inicio_etapa = timezone.now().date()

            serializer.save()
            factura.save(update_fields=['estado', 'etapa_actual', 'usuario_responsable', 'fecha_inicio_etapa'])

            actualizar_sla_factura(factura)
            
            # Crear registro en historial
            from financiero.facturas.models import HistorialFactura
            HistorialFactura.objects.create(
                factura=factura,
                accion='Completar Registro',
                estado_anterior=estado_anterior,
                estado_nuevo='Registrada',
                usuario=request.user,
                usuario_nombre=request.user.get_full_name() or request.user.username,
                usuario_rol='Funcionario',
                observacion='Factura registrada correctamente por el funcionario'
            )

            self._notificar_transicion(factura, estado_anterior, 'Registrada')
            
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
