class ErrorAsistencia(Exception):
    """Motivo por el que no se acepta un registro de asistencia."""

    def __init__(self, codigo, mensaje, estado=400):
        super().__init__(mensaje)
        self.codigo = codigo
        self.mensaje = mensaje
        self.estado = estado
