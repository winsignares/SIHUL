"""
Prueba de extremo a extremo de los anexos (documentos de soporte) del chatbot.

Corre contra el stack real levantado con docker compose (Django + RAG FastAPI + Postgres +
Redis + OpenAI). Se ejecuta dentro del contenedor del backend:

    docker cp <carpeta_con_archivos> sihul-backend:/tmp/anexos
    docker cp e2e_anexos.py sihul-backend:/tmp/e2e_anexos.py
    docker exec sihul-backend python /tmp/e2e_anexos.py /tmp/anexos

La carpeta debe contener los archivos de prueba reales (generados con Word y Excel):
    Formato_cancelacion_matricula.doc / .docx, Instructivo_cancelacion_matricula.pdf,
    Tabla_devoluciones_matricula.xls / .xlsx

Usa el agente 1 (con documentos en Barranquilla) y los usuarios semilla
admin@unilibre.edu.co / estudiante@unilibre.edu.co. Deja los datos como estaban: borra
lo que crea.
"""
import hashlib
import io
import json
import os
import re
import sys
import time

import requests

BASE = os.getenv('E2E_BASE', 'http://localhost:8000')
API = f'{BASE}/api/chatbot'
AGENTE = int(os.getenv('E2E_AGENTE', '1'))
SEDE = os.getenv('E2E_SEDE', 'barranquilla')
CARPETA = sys.argv[1] if len(sys.argv) > 1 else '/tmp/anexos'

ARCHIVOS = [
    'Formato_cancelacion_matricula.docx',
    'Formato_cancelacion_matricula.doc',
    'Instructivo_cancelacion_matricula.pdf',
    'Tabla_devoluciones_matricula.xlsx',
    'Tabla_devoluciones_matricula.xls',
]
MIME = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
}

resultados = []


def check(nombre, condicion, detalle=''):
    resultados.append((nombre, bool(condicion), detalle))
    estado = 'OK  ' if condicion else 'FALLO'
    print(f'[{estado}] {nombre}' + (f' -> {detalle}' if detalle else ''))
    return condicion


def sha(data):
    return hashlib.sha256(data).hexdigest()


def login(correo, contrasena):
    s = requests.Session()
    r = s.post(f'{BASE}/usuarios/login/', json={'correo': correo, 'contrasena': contrasena}, timeout=30)
    r.raise_for_status()
    return s, r.json()


def preguntar(s, user, pregunta, chat_id=None):
    body = {'agente_id': AGENTE, 'pregunta': pregunta, 'id_usuario': user['id'], 'nombre_usuario': user['nombre']}
    if chat_id:
        body['chat_id'] = chat_id
    r = s.post(f'{API}/pregunta/', json=body, timeout=60)
    r.raise_for_status()
    return r.json()


def main():
    originales = {n: open(os.path.join(CARPETA, n), 'rb').read() for n in ARCHIVOS}
    admin, admin_data = login('admin@unilibre.edu.co', 'admin123')
    admin_user = admin_data.get('usuario') or admin_data.get('user') or admin_data
    est, est_data = login('estudiante@unilibre.edu.co', 'est123')
    est_user = est_data.get('usuario') or est_data.get('user') or est_data
    print(f'Admin id={admin_user.get("id")}  Estudiante id={est_user.get("id")}')
    creados = []

    try:
        # ---------- 1. Regresión: pregunta sin preguntas-respuestas registradas ----------
        r0 = preguntar(est, est_user, '¿Cuáles son las faltas graves según el manual de convivencia?')
        check('Chat sin anexos registrados responde normal', r0.get('respuesta') and not r0.get('error'), r0.get('respuesta', '')[:120])
        check('Chat sin anexos devuelve anexos=[]', r0.get('anexos') == [], r0.get('anexos'))

        # ---------- 2. Carga de anexos en los formatos solicitados ----------
        files = [('anexos', (n, originales[n])) for n in ARCHIVOS]
        r = admin.post(f'{API}/admin/preguntas-respuestas/', data={
            'agente': AGENTE, 'sede': SEDE,
            'pregunta': '¿Cómo hago para cancelar una matrícula?',
            'respuesta': ('Para cancelar la matrícula debes radicar la solicitud de cancelación en la '
                          'Secretaría Académica de tu programa, diligenciando el formato de cancelación '
                          'de matrícula con tu firma, antes de la fecha límite del calendario académico. '
                          'La devolución depende de la fecha en que se presente la solicitud.'),
            'activo': 'true',
        }, files=files, timeout=60)
        check('Crear pregunta-respuesta con 5 anexos (doc, docx, pdf, xls, xlsx) -> 201', r.status_code == 201, r.status_code)
        pareja = r.json()
        creados.append(pareja['id'])
        por_nombre = {a['nombre']: a for a in pareja['anexos']}
        check('Se guardaron los 5 anexos', len(pareja['anexos']) == 5, [a['nombre'] for a in pareja['anexos']])
        for n in ARCHIVOS:
            a = por_nombre.get(n, {})
            ext = n.rsplit('.', 1)[1]
            check(f'  {n}: MIME y tamaño correctos', a.get('tipo') == MIME[ext] and a.get('tamano') == len(originales[n]), f"{a.get('tipo')} {a.get('tamano')}")

        # Descarga desde la gestión (enlace de administración)
        for n in ARCHIVOS:
            d = requests.get(por_nombre[n]['url'], timeout=30)
            check(f'  Descarga (gestión) {n}: archivo idéntico', d.status_code == 200 and sha(d.content) == sha(originales[n]), d.status_code)

        # ---------- 3. Validaciones de seguridad en la carga ----------
        malos = [
            ('virus.exe', b'MZ\x90\x00' + b'0' * 100, 'extensión no permitida'),
            ('notas.txt', b'hola', 'extensión no permitida'),
            ('falso.pdf', b'MZ\x90\x00 esto no es un pdf', 'PDF con contenido falso'),
            ('falso.docx', b'PK\x03\x04' + b'0' * 50, 'ZIP que no es Word'),
            ('falso.xls', b'%PDF-1.4 renombrado', 'XLS con contenido falso'),
            ('grande.pdf', b'%PDF-' + b'0' * (15 * 1024 * 1024 + 10), 'supera 15 MB'),
            ('vacio.pdf', b'', 'archivo vacío'),
        ]
        for nombre, contenido, motivo in malos:
            r = admin.post(f'{API}/admin/preguntas-respuestas/', data={
                'agente': AGENTE, 'sede': SEDE, 'pregunta': 'x?', 'respuesta': 'y',
            }, files=[('anexos', (nombre, contenido))], timeout=60)
            check(f'Rechaza {nombre} ({motivo}) -> 400', r.status_code == 400, r.json().get('error') if r.status_code == 400 else r.status_code)
        r = admin.post(f'{API}/admin/preguntas-respuestas/', data={
            'agente': AGENTE, 'sede': SEDE, 'pregunta': 'x?', 'respuesta': 'y',
        }, files=[('anexos', (n, originales[ARCHIVOS[0]])) for n in ['a.docx'] * 6], timeout=60)
        check('Rechaza más de 5 anexos -> 400', r.status_code == 400, r.json().get('error'))
        r = admin.post(f'{API}/admin/preguntas-respuestas/', data={'agente': AGENTE, 'sede': SEDE, 'pregunta': '', 'respuesta': ''}, timeout=30)
        check('Rechaza pregunta/respuesta vacías -> 400', r.status_code == 400)

        # ---------- 4. Permisos de gestión ----------
        r = est.get(f'{API}/admin/preguntas-respuestas/?sede={SEDE}', timeout=30)
        check('Estudiante NO puede listar la gestión -> 403', r.status_code == 403, r.status_code)
        r = est.post(f'{API}/admin/preguntas-respuestas/', data={'agente': AGENTE, 'sede': SEDE, 'pregunta': 'a?', 'respuesta': 'b'}, timeout=30)
        check('Estudiante NO puede crear -> 403', r.status_code == 403, r.status_code)
        r = requests.get(f'{API}/admin/preguntas-respuestas/?sede={SEDE}', timeout=30)
        check('Sin sesión NO puede listar la gestión -> 401/403', r.status_code in (401, 403), r.status_code)
        r = admin.get(f'{API}/admin/preguntas-respuestas/?sede={SEDE}&agente={AGENTE}', timeout=30)
        check('Admin lista la pregunta creada', r.status_code == 200 and any(p['id'] == pareja['id'] for p in r.json()))

        # ---------- 5. Chat autenticado: la respuesta incluye el anexo ----------
        time.sleep(1)
        r1 = preguntar(est, est_user, '¿Cómo puedo cancelar mi matrícula?')
        print('    Respuesta:', r1.get('respuesta', '')[:300].replace('\n', ' '))
        check('Chat (pregunta parafraseada) responde', r1.get('respuesta') and not r1.get('error'))
        anexos_chat = r1.get('anexos') or []
        check('Chat devuelve los 5 anexos con nombre, url y tipo', len(anexos_chat) == 5 and all({'nombre', 'url', 'tipo'} <= set(a) for a in anexos_chat), [a.get('nombre') for a in anexos_chat])
        for a in anexos_chat:
            d = requests.get(a['url'], timeout=30)  # sin sesión: como un clic en el enlace
            cd = d.headers.get('Content-Disposition', '')
            check(f"  Descarga (chat) {a['nombre']}: 200, attachment, idéntico",
                  d.status_code == 200 and cd.startswith('attachment') and a['nombre'] in cd
                  and sha(d.content) == sha(originales[a['nombre']]) and d.headers.get('Content-Type') == a['tipo'],
                  f"{d.status_code} {d.headers.get('Content-Type')}")

        check('Respuesta oficial no se atribuye a otro PDF', 'MANUAL-DE-CONVIVENCIA' not in r1.get('respuesta', ''), r1.get('respuesta', '')[-80:])

        # Seguimiento en el mismo hilo y luego historial
        chat_id = r1['chat_id']
        rs = preguntar(est, est_user, '¿y qué formato tengo que llenar?', chat_id=chat_id)
        check('Seguimiento en el mismo hilo ("¿y qué formato…?") entrega los anexos', len(rs.get('anexos') or []) == 5, rs.get('respuesta', '')[:120])
        sin_enlaces = all(not re.search(r'\]\(|https?://', r.get('respuesta', '')) for r in (r1, rs))
        check('El texto no inventa enlaces (los anexos van como botones)', sin_enlaces, rs.get('respuesta', '')[:200])
        rmt = preguntar(est, est_user, '¿Cómo pago la matrícula?')
        check('Mismo tema, otra intención ("¿Cómo pago la matrícula?") NO lleva anexos', rmt.get('anexos') == [], rmt.get('respuesta', '')[:120])
        h = est.get(f"{API}/historial/?chat_id={chat_id}&id_usuario={est_user['id']}", timeout=30).json()
        bots = [m for m in h['mensajes'] if m['tipo'] == 'bot']
        check('Historial conserva los anexos de la respuesta', bots and len(bots[-1].get('anexos', [])) == 5)
        d = requests.get(bots[-1]['anexos'][0]['url'], timeout=30)
        check('Enlace del historial descarga el archivo', d.status_code == 200)

        # ---------- 6. Pregunta no relacionada: sin anexos (comportamiento previo) ----------
        r2 = preguntar(est, est_user, '¿Cuáles son las faltas graves según el manual de convivencia?')
        check('Pregunta no relacionada NO lleva anexos', r2.get('anexos') == [], [a['nombre'] for a in r2.get('anexos', [])])
        check('Pregunta no relacionada sigue citando el PDF del RAG', '.pdf' in r2.get('respuesta', ''), r2.get('respuesta', '')[-80:])

        # ---------- 7. Chat público (sin sesión) ----------
        rp = requests.post(f'{API}/public/pregunta/', json={'agente_id': AGENTE, 'pregunta': 'quiero cancelar la matrícula, ¿qué debo hacer?', 'seccional': 'Barranquilla'}, timeout=60).json()
        check('Chat público devuelve los anexos', len(rp.get('anexos') or []) == 5, rp.get('respuesta', '')[:100])
        if rp.get('anexos'):
            d = requests.get(rp['anexos'][0]['url'], timeout=30)
            check('Chat público: descarga sin sesión', d.status_code == 200)
        rp2 = requests.post(f'{API}/public/pregunta/', json={'agente_id': AGENTE, 'pregunta': '¿Cuál es el horario de la biblioteca?', 'seccional': 'Barranquilla'}, timeout=60).json()
        check('Chat público, pregunta no relacionada: sin anexos', rp2.get('anexos') == [])
        rp3 = requests.post(f'{API}/public/pregunta/', json={'agente_id': AGENTE, 'pregunta': '¿Cómo hago para cancelar una matrícula?', 'seccional': 'Bogota'}, timeout=60).json()
        check('Otra sede (Bogotá) NO recibe anexos de Barranquilla', rp3.get('anexos') == [])

        # ---------- 8. Seguridad del enlace de descarga ----------
        url = anexos_chat[0]['url']
        base_url, token = url.split('?token=')
        otro_id = anexos_chat[1]['id']
        check('Sin token -> 403', requests.get(base_url, timeout=30).status_code == 403)
        check('Token alterado -> 403', requests.get(f'{base_url}?token={token[:-2]}xx', timeout=30).status_code == 403)
        url_otro = base_url.replace(f"/anexos/{anexos_chat[0]['id']}/", f'/anexos/{otro_id}/')
        check('Token de un anexo no sirve para otro -> 403', requests.get(f'{url_otro}?token={token}', timeout=30).status_code == 403)
        d = requests.get(url, timeout=30)
        check('Cabeceras seguras (nosniff, no-store)', d.headers.get('X-Content-Type-Options') == 'nosniff' and 'no-store' in d.headers.get('Cache-Control', ''))

        # ---------- 9. Edición: quitar y agregar anexos ----------
        quitar = [por_nombre['Formato_cancelacion_matricula.doc']['id'], por_nombre['Tabla_devoluciones_matricula.xls']['id']]
        r = admin.patch(f"{API}/admin/preguntas-respuestas/{pareja['id']}/",
                        data={'anexos_eliminar': quitar},
                        files=[('anexos', ('Formato_cancelacion_v2.docx', originales['Formato_cancelacion_matricula.docx']))], timeout=60)
        nombres = sorted(a['nombre'] for a in r.json().get('anexos', []))
        check('Editar: quita .doc y .xls y agrega un .docx nuevo', r.status_code == 200 and len(nombres) == 4 and 'Formato_cancelacion_v2.docx' in nombres, nombres)
        r1b = preguntar(est, est_user, '¿Cómo puedo cancelar mi matrícula?')
        check('Chat refleja la edición (4 anexos, sin caché vieja)', len(r1b.get('anexos') or []) == 4, [a['nombre'] for a in r1b.get('anexos', [])])
        eliminado = next(a for a in anexos_chat if a['id'] in quitar)
        d = requests.get(eliminado['url'], timeout=30)
        check('Anexo eliminado ya no se descarga -> 404', d.status_code == 404, d.status_code)
        time.sleep(1)
        en_disco = admin.get(f"{API}/admin/preguntas-respuestas/{pareja['id']}/", timeout=30).json()
        check('Edición conserva el resto de anexos descargables',
              all(requests.get(a['url'], timeout=30).status_code == 200 for a in en_disco['anexos']))

        # ---------- 10. Desactivar la pregunta-respuesta ----------
        r = admin.patch(f"{API}/admin/preguntas-respuestas/{pareja['id']}/", data={'activo': 'false'}, timeout=30)
        check('Desactivar -> 200', r.status_code == 200 and r.json()['activo'] is False)
        url_activa = r1b['anexos'][0]['url']
        check('Enlace de chat de una pregunta inactiva -> 404', requests.get(url_activa, timeout=30).status_code == 404)
        check('Enlace de gestión sigue sirviendo (para el administrador)', requests.get(r.json()['anexos'][0]['url'], timeout=30).status_code == 200)
        r3 = preguntar(est, est_user, '¿Cómo puedo cancelar mi matrícula?')
        check('Chat con la pregunta inactiva: sin anexos', r3.get('anexos') == [], r3.get('respuesta', '')[:100])

        # ---------- 11. Servicio RAG directo: campo `anexos` en la API ----------
        admin.patch(f"{API}/admin/preguntas-respuestas/{pareja['id']}/", data={'activo': 'true'}, timeout=30)
        rf = requests.post('http://chatbot:8001/api/v1/chat/ask', json={'nombre': 'Prueba', 'chatbot_id': AGENTE, 'sede': SEDE, 'question': 'cancelar matrícula'}, timeout=60).json()
        check('API RAG /chat/ask expone anexos', isinstance(rf.get('anexos'), list) and len(rf['anexos']) == 4, [a.get('nombre') for a in rf.get('anexos', [])])

        # ---------- 12. Eliminar: borra filas y archivos ----------
        rutas = [a['id'] for a in r.json()['anexos']]
        r = admin.delete(f"{API}/admin/preguntas-respuestas/{pareja['id']}/", timeout=30)
        check('Eliminar pregunta-respuesta -> 204', r.status_code == 204)
        creados.remove(pareja['id'])
        check('Sus anexos ya no se descargan', requests.get(r1b['anexos'][0]['url'], timeout=30).status_code in (403, 404))
        r4 = preguntar(est, est_user, '¿Cómo puedo cancelar mi matrícula?')
        check('Chat tras eliminar: sin anexos, sigue respondiendo', r4.get('anexos') == [] and r4.get('respuesta'))
        print('    Anexos eliminados:', rutas)
    finally:
        for pk in creados:
            admin.delete(f'{API}/admin/preguntas-respuestas/{pk}/', timeout=30)

    total = len(resultados)
    ok = sum(1 for _, v, _ in resultados if v)
    print(f'\nRESULTADO: {ok}/{total} verificaciones correctas')
    with open('/tmp/e2e_anexos_resultado.json', 'w', encoding='utf-8') as fh:
        json.dump([{'prueba': n, 'ok': v, 'detalle': str(d)} for n, v, d in resultados], fh, ensure_ascii=False, indent=2)
    sys.exit(0 if ok == total else 1)


if __name__ == '__main__':
    main()
