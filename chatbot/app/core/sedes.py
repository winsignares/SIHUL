from enum import Enum


class Sede(str, Enum):
    NACIONAL = "nacional"
    VIRTUAL = "virtual"
    EL_SOCORRO = "el_socorro"
    CALI = "cali"
    BARRANQUILLA = "barranquilla"
    BOGOTA = "bogota"
    CUCUTA = "cucuta"
    CARTAGENA = "cartagena"
    PEREIRA = "pereira"

    @classmethod
    def list(cls) -> list[str]:
        return [s.value for s in cls]

def normalizar_sede(valor) -> str | None:
    """'El Socorro' -> 'el_socorro'. None si no es una seccional que conozca el servicio.

    Misma regla que `backend/chatbot/sedes.py` (Django): ambos deben producir el mismo valor.
    """
    import re
    import unicodedata

    if not valor:
        return None
    texto = unicodedata.normalize("NFKD", str(valor)).encode("ascii", "ignore").decode("ascii")
    texto = texto.strip().lower().replace(" ", "_")
    texto = re.sub(r"[^a-z0-9_]+", "", texto)
    texto = re.sub(r"_+", "_", texto)
    return texto if texto in Sede.list() else None
