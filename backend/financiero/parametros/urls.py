from .views import ParametroSLAViewSet, ParametrosFinancieroViewSet

registrations = [
    (r'parametros-sla', ParametroSLAViewSet, 'parametro-sla'),
    (r'parametros-financiero', ParametrosFinancieroViewSet, 'parametro-financiero'),
]
