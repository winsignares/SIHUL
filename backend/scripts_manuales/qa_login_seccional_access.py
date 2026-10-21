import json
import os

from django.test import Client


def parse_espacios(response):
    data = response.json()
    if isinstance(data, dict) and 'results' in data:
        return data['results']
    if isinstance(data, list):
        return data
    return []


def nombres_espacios(response):
    espacios = parse_espacios(response)
    return sorted([item.get('nombre') for item in espacios if item.get('nombre')])


def login_and_fetch(correo, password):
    client = Client()

    login_payload = json.dumps({'correo': correo, 'contrasena': password})
    login_resp = client.post('/usuarios/login/', data=login_payload, content_type='application/json')

    api_resp = client.get('/api/espacios/')
    return login_resp, api_resp


qa_password = os.getenv('QA_TEST_PASSWORD')
if not qa_password:
    raise RuntimeError('Define QA_TEST_PASSWORD en el entorno para ejecutar esta prueba.')

cases = [
    {
        'correo': 'qa.norte@sihul.local',
        'password': qa_password,
        'must_have': {'QA ESPACIO NORTE'},
        'must_not_have': {'QA ESPACIO SUR'},
        'label': 'Usuario Norte',
    },
    {
        'correo': 'qa.sur@sihul.local',
        'password': qa_password,
        'must_have': {'QA ESPACIO SUR'},
        'must_not_have': {'QA ESPACIO NORTE'},
        'label': 'Usuario Sur',
    },
    {
        'correo': 'qa.admin.global@sihul.local',
        'password': qa_password,
        'must_have': {'QA ESPACIO NORTE', 'QA ESPACIO SUR'},
        'must_not_have': set(),
        'label': 'Admin Global',
    },
]

failures = []

print('--- PRUEBA DE LOGIN + ACCESO API ---')

for case in cases:
    login_resp, api_resp = login_and_fetch(case['correo'], case['password'])

    print(f"{case['label']} -> login_status={login_resp.status_code}, api_status={api_resp.status_code}")

    if login_resp.status_code != 200:
        failures.append(f"{case['label']}: login falló con status {login_resp.status_code}")
        continue

    if api_resp.status_code != 200:
        failures.append(f"{case['label']}: /api/espacios/ devolvió {api_resp.status_code}")
        continue

    visibles = set(nombres_espacios(api_resp))
    print(f"{case['label']} -> contiene QA: {sorted([n for n in visibles if n.startswith('QA ESPACIO')])}")

    missing = case['must_have'] - visibles
    wrong = case['must_not_have'] & visibles

    if missing:
        failures.append(f"{case['label']}: faltan espacios esperados {sorted(missing)}")

    if wrong:
        failures.append(f"{case['label']}: ve espacios que no debería {sorted(wrong)}")

# Caso sin login
anon_client = Client()
anon_resp = anon_client.get('/api/espacios/')
print(f"Anonimo -> api_status={anon_resp.status_code}")
if anon_resp.status_code == 200:
    failures.append('Anonimo no debería tener acceso a /api/espacios/.')

if failures:
    print('--- FALLAS ---')
    for failure in failures:
        print(f'- {failure}')
    raise SystemExit(1)

print('--- OK: Login y control de acceso por seccional validados ---')
