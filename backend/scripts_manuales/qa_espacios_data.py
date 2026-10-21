#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysite.settings')
django.setup()

from espacios.models import EspacioFisico
from sedes.models import Sede
from espacios.serializers import EspacioFisicoSerializer

print('Total espacios:', EspacioFisico.objects.count())
print('Total sedes:', Sede.objects.count())
print('---')

e = EspacioFisico.objects.first()
if e:
    print('Primer espacio:', e.nombre)
    print('sede_id:', e.sede_id, '-> sede:', e.sede)
    print('tipo_id:', e.tipo_id, '-> tipo:', e.tipo)
    print()
    print('Serializado:')
    s = EspacioFisicoSerializer(e)
    import json
    print(json.dumps(s.data, indent=2, default=str))

print('---')
print('Verificar que sedes tiene datos:')
sedes = Sede.objects.all()[:3]
for s in sedes:
    print(f'  Sede {s.id}: {s.nombre}')
