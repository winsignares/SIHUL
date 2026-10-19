"""
Regresión de los módulos existentes contra el stack real (solo lectura: no crea ni modifica
datos). Comprueba que autenticación, horarios, espacios, préstamos, notificaciones,
periodos, reportes y el chatbot siguen respondiendo como antes del cambio de anexos.

    docker cp regresion_modulos.py sihul-backend:/tmp/regresion_modulos.py
    docker exec sihul-backend python /tmp/regresion_modulos.py
"""
import json
import os
import sys

import requests

BASE = os.getenv('E2E_BASE', 'http://localhost:8000')

resultados = []


def check(nombre, condicion, detalle=''):
    resultados.append((nombre, bool(condicion), detalle))
    print(f"[{'OK  ' if condicion else 'FALLO'}] {nombre}" + (f' -> {detalle}' if detalle else ''))


def login(correo, contrasena):
    s = requests.Session()
    r = s.post(f'{BASE}/usuarios/login/', json={'correo': correo, 'contrasena': contrasena}, timeout=30)
    return s, r


def get(s, ruta, **params):
    return s.get(f'{BASE}{ruta}', params=params, timeout=60)


def main():
    # Autenticación
    _, malo = login('admin@unilibre.edu.co', 'contraseña-incorrecta')
    check('Login con contraseña incorrecta se rechaza', malo.status_code in (400, 401, 403), malo.status_code)
    admin, r = login('admin@unilibre.edu.co', 'admin123')
    check('Login admin', r.status_code == 200, r.status_code)
    admin_user = r.json()
    est, r = login('estudiante@unilibre.edu.co', 'est123')
    check('Login estudiante', r.status_code == 200, r.status_code)
    est_user = r.json()
    r = get(admin, '/api/usuarios/session-auth-state/')
    check('Estado de sesión del admin', r.status_code == 200, r.status_code)

    # Listados de cada módulo con la sesión de admin
    rutas_admin = [
        ('Seccionales', '/api/seccionales/'),
        ('Sedes', '/api/sedes/'),
        ('Facultades', '/api/facultades/'),
        ('Programas', '/api/programas/'),
        ('Asignaturas', '/api/asignaturas/'),
        ('Grupos', '/api/grupos/'),
        ('Tipos de espacio', '/api/tipos-espacio/'),
        ('Espacios', '/api/espacios/'),
        ('Horarios', '/api/horarios/'),
        ('Horarios extendidos', '/api/horarios/list/extendidos/'),
        ('Horarios fusionados', '/api/horarios-fusionados/'),
        ('Solicitudes de espacio', '/api/solicitudes-espacio/'),
        ('Recursos', '/api/recursos/'),
        ('Roles', '/api/roles/'),
        ('Usuarios', '/api/usuarios/'),
        ('Periodos', '/api/periodos/'),
        ('Componentes', '/api/componentes/'),
        ('Préstamos: tipos de actividad', '/api/prestamos/tipos-actividad/'),
        ('Préstamos de espacios', '/api/prestamos/espacios/'),
        ('Préstamos públicos', '/api/prestamos/publicos/'),
        ('Notificaciones', '/api/notificaciones/'),
        ('Reporte de capacidad', '/api/espacios/reporte/capacidad/'),
        ('Reporte de ocupación', '/api/espacios/reporte/ocupacion/'),
        ('Chatbot: agentes', '/api/chatbot/agentes/'),
        ('Chatbot: preguntas sugeridas', '/api/chatbot/preguntas/'),
        ('Chatbot: documentos RAG', '/api/chatbot/admin/documentos/'),
        ('Chatbot: agentes públicos', '/api/chatbot/public/agentes/'),
    ]
    for nombre, ruta in rutas_admin:
        r = get(admin, ruta)
        check(f'{nombre} ({ruta})', r.status_code == 200, r.status_code)

    r = admin.post(f'{BASE}/api/espacios/reporte/capacidad/pdf/', json={'semana_offset': 0}, timeout=60)
    check('Reporte de capacidad en PDF', r.status_code == 200 and r.content[:5] == b'%PDF-', f"{r.status_code} {r.headers.get('Content-Type')}")

    # Vistas del estudiante
    for nombre, ruta, params in [
        ('Mi horario (estudiante)', '/api/horarios/mi-horario-estudiante/', {'usuario_id': est_user['id']}),
        ('Notificaciones (estudiante)', '/api/notificaciones/', {}),
        ('Chatbot: agentes (estudiante)', '/api/chatbot/agentes/', {}),
    ]:
        r = get(est, ruta, **params)
        check(nombre, r.status_code == 200, r.status_code)
    r = get(est, '/api/horarios/mi-horario-estudiante/', usuario_id=admin_user['id'])
    check('Estudiante NO ve el horario de otro usuario', r.status_code == 403, r.status_code)
    r = get(est, '/api/chatbot/admin/documentos/')
    check('Estudiante NO entra a la gestión de documentos del chatbot', r.status_code == 403, r.status_code)

    # Cierre de sesión
    r = admin.post(f'{BASE}/api/usuarios/logout/', timeout=30)
    check('Logout admin', r.status_code in (200, 204), r.status_code)
    r = get(admin, '/api/usuarios/')
    check('Tras el logout no se accede a usuarios', r.status_code in (401, 403), r.status_code)

    ok = sum(1 for _, v, _ in resultados if v)
    print(f'\nRESULTADO: {ok}/{len(resultados)} verificaciones correctas')
    with open('/tmp/regresion_modulos_resultado.json', 'w', encoding='utf-8') as fh:
        json.dump([{'prueba': n, 'ok': v, 'detalle': str(d)} for n, v, d in resultados], fh, ensure_ascii=False, indent=2)
    sys.exit(0 if ok == len(resultados) else 1)


if __name__ == '__main__':
    main()
