"""
Evidencia visual de los anexos en la interfaz (React) con el stack real levantado.

Crea una pregunta-respuesta con los cinco anexos, la pregunta desde el chat como
estudiante (captura la respuesta con los anexos y descarga uno haciendo clic), abre la
gestión como administrador y al final borra lo que creó. Usa Microsoft Edge instalado
(Playwright, canal msedge):

    pip install playwright requests
    python capturas_ui.py <carpeta_con_archivos> <carpeta_de_salida>
"""
import hashlib
import os
import sys
from pathlib import Path

import requests
from playwright.sync_api import expect, sync_playwright

FRONT = os.getenv('UI_BASE', 'http://localhost:5173')
API = os.getenv('E2E_BASE', 'http://localhost:8000')
AGENTE = int(os.getenv('E2E_AGENTE', '1'))
ARCHIVOS = [
    'Formato_cancelacion_matricula.docx',
    'Formato_cancelacion_matricula.doc',
    'Instructivo_cancelacion_matricula.pdf',
    'Tabla_devoluciones_matricula.xlsx',
    'Tabla_devoluciones_matricula.xls',
]
PREGUNTA = '¿Cómo hago para cancelar una matrícula?'
RESPUESTA = (
    'Para cancelar la matrícula debes radicar la solicitud de cancelación en la Secretaría '
    'Académica de tu programa, diligenciando el formato de cancelación de matrícula con tu '
    'firma, antes de la fecha límite del calendario académico. La devolución del valor '
    'pagado depende de la fecha en que presentes la solicitud.'
)


def sesion_api(correo, contrasena):
    s = requests.Session()
    s.post(f'{API}/usuarios/login/', json={'correo': correo, 'contrasena': contrasena}, timeout=30).raise_for_status()
    return s


def entrar(page, correo, contrasena):
    # El servidor de desarrollo de Vite compila los módulos en la primera visita
    page.set_default_navigation_timeout(240000)
    page.goto(f'{FRONT}/login', wait_until='domcontentloaded')
    page.locator('input[type="email"]').wait_for(timeout=240000)
    page.locator('input[type="email"]').fill(correo)
    page.locator('input[type="password"]').fill(contrasena)
    page.locator('button[type="submit"]').click()
    page.wait_for_url(lambda url: '/login' not in url, timeout=30000)


def main(carpeta, salida):
    carpeta, salida = Path(carpeta), Path(salida)
    salida.mkdir(parents=True, exist_ok=True)
    admin = sesion_api('admin@unilibre.edu.co', 'admin123')
    archivos = [('anexos', (n, (carpeta / n).read_bytes())) for n in ARCHIVOS]
    r = admin.post(
        f'{API}/api/chatbot/admin/preguntas-respuestas/',
        data={'agente': AGENTE, 'pregunta': PREGUNTA, 'respuesta': RESPUESTA, 'activo': 'true'},
        files=archivos, timeout=60,
    )
    r.raise_for_status()
    pareja_id = r.json()['id']
    print('Pregunta-respuesta creada', pareja_id)

    try:
        with sync_playwright() as p:
            navegador = p.chromium.launch(channel='msedge')

            # Chat del estudiante
            ctx = navegador.new_context(viewport={'width': 1440, 'height': 1250}, accept_downloads=True)
            page = ctx.new_page()
            entrar(page, 'estudiante@unilibre.edu.co', 'est123')
            page.goto(f'{FRONT}/estudiante/asistente-virtual')
            page.get_by_text('Agente Biblioteca', exact=True).first.click()
            caja = page.get_by_placeholder('Escribe un mensaje a Agente Biblioteca...')
            caja.fill('¿Cómo puedo cancelar mi matrícula?')
            caja.press('Enter')
            enlace = page.locator('a[download]', has_text='Instructivo_cancelacion_matricula.pdf')
            expect(enlace).to_be_visible(timeout=90000)
            enlace.scroll_into_view_if_needed()
            page.wait_for_timeout(800)
            page.screenshot(path=str(salida / '01_chat_respuesta_con_anexos.png'))
            print('Anexos visibles en el chat:', page.locator('a[download]').count())

            with page.expect_download() as info:
                enlace.click()
            descarga = info.value
            destino = salida / f'descargado_{descarga.suggested_filename}'
            descarga.save_as(destino)
            original = (carpeta / 'Instructivo_cancelacion_matricula.pdf').read_bytes()
            identico = hashlib.sha256(destino.read_bytes()).hexdigest() == hashlib.sha256(original).hexdigest()
            print('Descarga desde la UI:', descarga.suggested_filename, 'idéntica al original:', identico)
            destino.unlink()

            # Una pregunta sin pareja registrada: el RAG responde con su cita al PDF, sin anexos
            caja.fill('¿Cuáles son las faltas graves según el manual de convivencia?')
            caja.press('Enter')
            expect(page.get_by_text('MANUAL-DE-CONVIVENCIA', exact=False).last).to_be_visible(timeout=90000)
            page.wait_for_timeout(1500)
            page.screenshot(path=str(salida / '02_chat_pregunta_sin_anexo.png'))
            print('Anexos tras la pregunta sin pareja (deben seguir siendo los 5 anteriores):', page.locator('a[download]').count())
            ctx.close()

            # Gestión del administrador
            ctx = navegador.new_context(viewport={'width': 1440, 'height': 900})
            page = ctx.new_page()
            entrar(page, 'admin@unilibre.edu.co', 'admin123')
            page.goto(f'{FRONT}/admin/chatbots')
            page.get_by_text('Preguntas y respuestas', exact=True).click()
            expect(page.get_by_text(PREGUNTA).first).to_be_visible(timeout=30000)
            page.wait_for_timeout(800)
            page.screenshot(path=str(salida / '03_gestion_tabla_pregunta_respuesta_anexo.png'))
            page.get_by_role('button', name='Editar').first.click()
            expect(page.get_by_role('dialog')).to_be_visible()
            page.wait_for_timeout(800)
            page.screenshot(path=str(salida / '04_gestion_dialogo_editar_anexos.png'))
            ctx.close()
            navegador.close()
    finally:
        admin.delete(f'{API}/api/chatbot/admin/preguntas-respuestas/{pareja_id}/', timeout=30)
        print('Pregunta-respuesta eliminada')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
