"""Extracción y troceado del texto de los documentos (PDF, CSV y texto plano), dividido por tema.

Todo lo público sigue importándose desde `app.services.text_extraction`.
"""
from .errores import IngestionError  # noqa: F401
from .extraccion import extract_text  # noqa: F401
from .marcas import strip_page_markers  # noqa: F401
from .troceado import _join_split_headings, _settings, chunk_text, chunk_text_with_pages  # noqa: F401
