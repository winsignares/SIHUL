"""Registro unico y ordenado de todos los seeders de SIHUL.

Para agregar un seeder: crea su modulo en esta carpeta e inscribelo en PASOS
en la posicion correcta (respetando dependencias). El comando `seed` lo ejecuta.

Banderas de cada paso:
  requerido  -> configuracion/catalogos que el sistema necesita SIEMPRE
                (se ejecuta con `seed --solo-requeridos`, apto para produccion).
  opcional   -> no corre por defecto (datos pesados o que requieren red);
                se pide con `--solo <clave>` o con su bandera propia.

Los seeders se ejecutan SOLO de forma manual; nada los dispara automaticamente.
"""
from dataclasses import dataclass
from typing import Callable

from . import (
    agentes_seeder,
    asignaturas_programa_seeder,
    asignaturas_seeder,
    componentes_rol_seeder,
    componentes_seeder,
    espacios_permitidos_seeder,
    espacios_seeder,
    facultades_seeder,
    financiero_facturas_stress_seeder,
    financiero_seeder,
    geografia_colombia_seeder,
    grupos_norte_seeder,
    grupos_seeder,
    horarios_norte_seeder,
    horarios_seeder,
    periodos_seeder,
    preguntas_sugeridas_seeder,
    programas_seeder,
    recursos_seeder,
    roles_seeder,
    sedes_seeder,
    tipos_actividad_seeder,
    tipos_espacio_seeder,
    usuarios_seeder,
)


@dataclass(frozen=True)
class Paso:
    clave: str
    etiqueta: str
    ejecutar: Callable  # (out, sty) -> None
    requerido: bool = False
    opcional: bool = False
    red: bool = False   # necesita internet: corre fuera de la transaccion principal


def _grupos(out, sty):
    grupos_norte_seeder.create_grupos(out, sty)
    grupos_seeder.create_grupos(out, sty)


# El orden es el de dependencias (el mismo que usaba el antiguo seed_initial_data).
PASOS = [
    # Tablas primarias
    Paso('roles', 'Roles del sistema', roles_seeder.create_roles, requerido=True),
    Paso('sedes', 'Sedes', sedes_seeder.create_sedes, requerido=True),
    Paso('tipos_espacio', 'Tipos de espacio', tipos_espacio_seeder.create_tipos_espacio, requerido=True),
    Paso('tipos_actividad', 'Tipos de actividad', tipos_actividad_seeder.create_tipos_actividad, requerido=True),
    # Estructura academica
    Paso('facultades', 'Facultades', facultades_seeder.create_facultades),
    Paso('programas', 'Programas', programas_seeder.create_programas),
    Paso('periodos', 'Periodos academicos', periodos_seeder.create_periodos_academicos, requerido=True),
    Paso('asignaturas', 'Asignaturas', asignaturas_seeder.create_asignaturas),
    Paso('asignaturas_programa', 'Asignaturas por programa', asignaturas_programa_seeder.create_asignaturas_programa),
    # Usuarios
    Paso('usuarios_sistema', 'Usuarios fundamentales del sistema', usuarios_seeder.create_usuarios_sistema, requerido=True),
    Paso('usuarios_docentes', 'Docentes de prueba', usuarios_seeder.create_usuarios_docentes),
    # Espacios y recursos
    Paso('espacios', 'Espacios fisicos', espacios_seeder.create_espacios_fisicos),
    Paso('recursos', 'Recursos para espacios', recursos_seeder.create_recursos, requerido=True),
    Paso('espacios_permitidos', 'Espacios permitidos (supervisores)', espacios_permitidos_seeder.create_espacios_permitidos, requerido=True),
    # Permisos
    Paso('componentes', 'Componentes del sistema', componentes_seeder.create_componentes, requerido=True),
    Paso('componentes_rol', 'Componentes por rol', componentes_rol_seeder.create_componentes_rol, requerido=True),
    # Grupos y horarios
    Paso('grupos', 'Grupos academicos', _grupos),
    Paso('horarios_sede_centro', 'Horarios sede Centro', horarios_seeder.create_horarios_sede_centro),
    Paso('horarios_sede_principal', 'Horarios sede Principal', horarios_norte_seeder.create_horarios_sede_principal),
    # Chatbot
    Paso('agentes', 'Agentes de chatbot', agentes_seeder.create_agentes, requerido=True),
    Paso('preguntas_sugeridas', 'Preguntas sugeridas', preguntas_sugeridas_seeder.create_preguntas_sugeridas, requerido=True),
    # Financiero
    Paso('financiero', 'Modulo financiero (catalogos, SLA, proveedores y usuarios de prueba)', financiero_seeder.create_financiero_data),
    # Opcionales: no corren por defecto
    Paso('facturas_stress', 'Facturas de estres (carga pesada de prueba)', financiero_facturas_stress_seeder.create_facturas_stress_data, opcional=True),
    Paso('geografia_colombia', 'Departamentos y municipios de Colombia (DIVIPOLA/DANE, requiere red)', geografia_colombia_seeder.create_geografia_colombia, opcional=True, red=True),
]

PASOS_POR_CLAVE = {p.clave: p for p in PASOS}
