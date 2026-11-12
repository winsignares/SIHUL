"""Error de ingesta."""



class IngestionError(Exception):
    """El archivo no se puede ingerir; `status_code` es el HTTP que corresponde."""

    def __init__(self, message: str, status_code: int = 422):
        super().__init__(message)
        self.status_code = status_code
