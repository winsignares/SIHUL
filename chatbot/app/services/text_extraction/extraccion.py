"""Punto de entrada de la extracción: según la extensión, PDF o texto."""
from .errores import IngestionError
from .texto_plano import _csv_to_text, _decode
from .pdf import _pdf_text


def extract_text(raw: bytes, filename: str) -> str:
    name = filename.lower()
    if name.endswith(".pdf"):
        text = _pdf_text(raw)
        if not text.strip():
            raise IngestionError(
                "El PDF no contiene texto extraíble. Si es un documento escaneado "
                "(páginas como imagen) debe pasar por OCR antes de subirlo."
            )
        return text

    text = _decode(raw)
    if name.endswith(".csv"):
        text = _csv_to_text(text)
    if not text.strip():
        raise IngestionError("El archivo está vacío.")
    return text
