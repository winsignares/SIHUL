"""Qué modelos publican eventos y con qué nombre de recurso los conoce el frontend.

Un evento solo dice «algo de este recurso cambió»; el frontend vuelve a pedir los datos por la API normal,
con los permisos de siempre. Para publicar un recurso nuevo basta añadir una línea aquí.
"""

# (app_label, Modelo) -> nombre del recurso
RECURSOS = {
    ('sedes', 'Seccional'): 'seccionales',
    ('sedes', 'Sede'): 'sedes',
    ('facultades', 'Facultad'): 'facultades',
    ('programas', 'Programa'): 'programas',
    ('asignaturas', 'Asignatura'): 'asignaturas',
    ('asignaturas', 'AsignaturaPrograma'): 'asignaturas-programa',
    ('grupos', 'Grupo'): 'grupos',
    ('periodos', 'PeriodoAcademico'): 'periodos',
    ('horario', 'Horario'): 'horarios',
    ('horario', 'HorarioFusionado'): 'horarios-fusionados',
    ('horario', 'HorarioEstudiante'): 'horarios-estudiante',
    ('horario', 'SolicitudEspacio'): 'solicitudes-espacio',
    ('espacios', 'TipoEspacio'): 'tipos-espacio',
    ('espacios', 'EspacioFisico'): 'espacios',
    ('espacios', 'EspacioPermitido'): 'espacios-permitidos',
    ('recursos', 'Recurso'): 'recursos',
    ('recursos', 'EspacioRecurso'): 'espacios-recursos',
    ('prestamos', 'TipoActividad'): 'tipos-actividad',
    ('prestamos', 'PrestamoEspacio'): 'prestamos-espacio',
    ('prestamos', 'PrestamoEspacioPublico'): 'prestamos-espacio-publico',
    ('prestamos', 'PrestamoRecurso'): 'prestamos-recurso',
    ('prestamos', 'PrestamoRecursoPublico'): 'prestamos-recurso-publico',
    ('usuarios', 'Rol'): 'roles',
    ('usuarios', 'Usuario'): 'usuarios',
    ('componentes', 'Componente'): 'componentes',
    ('componentes', 'ComponenteRol'): 'componentes-rol',
    ('componentes', 'ComponenteUsuario'): 'componentes-usuario',
    ('notificaciones', 'Notificacion'): 'notificaciones',
    ('chatbot', 'Agente'): 'chatbots',
}

# Cómo llegar a la seccional de un registro, en orden: la primera ruta que dé valor gana.
RUTAS_SECCIONAL = (
    'seccional_id',
    'sede.seccional_id',
    'espacio.sede.seccional_id',
    'usuario.seccional_id',
    'estudiante.seccional_id',
    'docente.seccional_id',
)

# Recursos que solo le importan a un usuario: el evento se entrega únicamente a él (campo del registro con su id).
RECURSOS_PERSONALES = {
    'notificaciones': 'id_usuario',
}


# Recursos que se registran desde fuera de la plataforma (por ejemplo, el módulo financiero) con reglas propias:
# (app_label, Modelo) -> {'recurso', 'audiencia', 'referencia'}
OPCIONES_POR_MODELO = {}


def registrar_recurso(app_label, modelo, recurso, audiencia=None, referencia=None):
    """Publica eventos de un modelo con reglas propias.

    - `referencia(instancia)`: registro al que se refiere el evento (por ejemplo, la factura de un documento).
    - `audiencia(registro)`: `{'usuarios': {ids}, 'roles': {nombres normalizados}}`; solo esas personas (y los
      administradores) reciben el evento. Sin `audiencia` rige la seccional, como en el resto de recursos.
    """
    from .senales import conectar

    OPCIONES_POR_MODELO[(app_label, modelo)] = {'recurso': recurso, 'audiencia': audiencia, 'referencia': referencia}
    conectar(app_label, modelo, recurso, audiencia=audiencia, referencia=referencia)
