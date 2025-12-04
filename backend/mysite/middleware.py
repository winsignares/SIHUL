"""
Middleware para filtrado de datos por sede del usuario
"""
from django.utils.deprecation import MiddlewareMixin


class SedeFilterMiddleware(MiddlewareMixin):
    """
    Middleware que agrega la sede del usuario autenticado a cada request.
    Permite filtrar automáticamente los datos según la sede del usuario.
    """
    
    def process_request(self, request):
        """
        Procesa cada request y agrega información de la sede del usuario
        """
        # Obtener el ID de usuario desde la sesión
        user_id = request.session.get('user_id')
        
        if user_id:
            try:
                from usuarios.models import Usuario
                usuario = Usuario.objects.select_related('sede').get(id=user_id)
                
                # Agregar información de sede al request
                request.sede_id = usuario.sede_id if usuario.sede else None
                request.sede = usuario.sede
                request.user_obj = usuario  # También agregar el usuario completo
                
            except Usuario.DoesNotExist:
                # Usuario no encontrado, establecer valores por defecto
                request.sede_id = None
                request.sede = None
                request.user_obj = None
        else:
            # No hay usuario autenticado
            request.sede_id = None
            request.sede = None
            request.user_obj = None
