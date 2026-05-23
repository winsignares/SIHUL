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