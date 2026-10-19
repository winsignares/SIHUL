"""
Similitud entre preguntas registradas y preguntas de usuarios, para justificar
QA_MIN_SIMILARITY (contexto) y QA_ANEXO_MIN_SIMILARITY (entrega de anexos).

    docker cp calibrar_umbral.py sihul-chatbot:/tmp/calibrar_umbral.py
    docker exec -w /app sihul-chatbot python /tmp/calibrar_umbral.py
"""
import asyncio
import math
from datetime import datetime

from app.core.config import get_settings
from app.services import qa_service
from app.services.embedding_service import generate_query_embeddings

REGISTRADAS = [
    '¿Cómo hago para cancelar una matrícula?',
    '¿Cuáles son los requisitos de inscripción para un programa de pregrado?',
    '¿Cómo solicito el aval del comité de ética para mi proyecto de investigación?',
]
USUARIOS = {
    'misma intención': [
        '¿Cómo puedo cancelar mi matrícula?',
        'quiero cancelar la matrícula, ¿qué debo hacer?',
        'cancelar matrícula',
        'Necesito retirarme del semestre y anular la matrícula',
        '¿Qué documentos necesito para inscribirme en pregrado?',
        'requisitos para inscribirme a una carrera',
        '¿Qué necesito para que el comité de ética apruebe mi investigación?',
    ],
    'mismo tema, otra pregunta': [
        '¿Cuánto cuesta la matrícula?',
        '¿Cuándo son las fechas de matrícula?',
        '¿Cómo pago la matrícula?',
        '¿Cuándo publican los resultados de admisión?',
    ],
    'otro tema': [
        '¿Cuáles son las faltas graves según el manual de convivencia?',
        '¿Cuál es el horario de la biblioteca?',
        '¿Puedo ir con tenis de colores?',
    ],
}


def cos(a, b):
    return sum(x * y for x, y in zip(a, b)) / (math.sqrt(sum(x * x for x in a)) * math.sqrt(sum(y * y for y in b)))


SEGUIMIENTOS = [
    # (pregunta anterior, consulta, ¿debe entregar los anexos de la primera registrada?)
    ('¿Cómo hago para cancelar una matrícula?', '¿y qué formato tengo que llenar?', True),
    ('¿Cómo hago para cancelar una matrícula?', '¿y cuánto vale el semestre?', False),
]


async def decidir(q, emb, reg, previo=None, emb_previo=None):
    """Misma lógica que chat_service.ask: candidatas por similitud y luego qa_service.choose."""
    s = get_settings()
    hits = []
    for i, r in enumerate(reg):
        direct = cos(emb, r)
        best = max(direct, cos(emb_previo, r)) if emb_previo else direct
        if best >= s.QA_MIN_SIMILARITY:
            hits.append(qa_service.QAHit(i, REGISTRADAS[i], '', datetime.now(), direct, best, anexos=[{'id': i}]))
    hits.sort(key=lambda h: h.best_similarity, reverse=True)
    near = [h for h in hits if h.best_similarity >= s.QA_ANEXO_MIN_SIMILARITY][:qa_service.MAX_CANDIDATES]
    elegido = await qa_service.choose(near, q, previo)
    return elegido


async def main():
    preguntas = [q for grupo in USUARIOS.values() for q in grupo]
    seguimientos = [f'{p}\n{q}' for p, q, _ in SEGUIMIENTOS]
    embs = await generate_query_embeddings(REGISTRADAS + preguntas + [q for _, q, _ in SEGUIMIENTOS] + seguimientos)
    reg = embs[:len(REGISTRADAS)]
    usr = dict(zip(preguntas, embs[len(REGISTRADAS):len(REGISTRADAS) + len(preguntas)]))
    resto = embs[len(REGISTRADAS) + len(preguntas):]
    aciertos = total = 0
    for grupo, qs in USUARIOS.items():
        print(f'\n== {grupo} ==')
        for q in qs:
            sims = [cos(usr[q], r) for r in reg]
            mejor = max(range(len(sims)), key=sims.__getitem__)
            elegido = await decidir(q, usr[q], reg)
            esperado = mejor if grupo == 'misma intención' else None
            ok = (elegido.id if elegido else None) == esperado
            aciertos += ok
            total += 1
            print(f"{'OK ' if ok else 'MAL'} sim={sims[mejor]:.3f}  anexos={'sí' if elegido else 'no':2}  {q!r}")
    print('\n== seguimientos de conversación ==')
    n = len(SEGUIMIENTOS)
    for (previo, q, debe), emb_q, emb_comb in zip(SEGUIMIENTOS, resto[:n], resto[n:]):
        elegido = await decidir(q, emb_q, reg, previo, emb_comb)
        ok = (elegido is not None and elegido.id == 0) == debe
        aciertos += ok
        total += 1
        print(f"{'OK ' if ok else 'MAL'} anexos={'sí' if elegido else 'no':2}  {previo!r} -> {q!r}")
    print(f'\nDecisiones correctas: {aciertos}/{total}')


asyncio.run(main())
