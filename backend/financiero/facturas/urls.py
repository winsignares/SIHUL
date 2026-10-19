from .views import ComentarioFacturaViewSet, DocumentoAdjuntoViewSet, FacturaViewSet, HistorialFacturaViewSet, RechazoDevolacionViewSet

registrations = [
    (r'documentos', DocumentoAdjuntoViewSet, 'documento'),
    (r'historial', HistorialFacturaViewSet, 'historial'),
    (r'comentarios', ComentarioFacturaViewSet, 'comentario'),
    (r'rechazos', RechazoDevolacionViewSet, 'rechazo'),
    (r'facturas', FacturaViewSet, 'factura'),
]
