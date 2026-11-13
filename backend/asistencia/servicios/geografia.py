from math import asin, cos, radians, sin, sqrt

RADIO_TIERRA_METROS = 6371000


def distancia_metros(lat1, lon1, lat2, lon2):
    """Distancia entre dos coordenadas (fórmula de haversine)."""
    lat1, lon1, lat2, lon2 = (radians(float(v)) for v in (lat1, lon1, lat2, lon2))
    a = sin((lat2 - lat1) / 2) ** 2 + cos(lat1) * cos(lat2) * sin((lon2 - lon1) / 2) ** 2
    return 2 * RADIO_TIERRA_METROS * asin(sqrt(a))
