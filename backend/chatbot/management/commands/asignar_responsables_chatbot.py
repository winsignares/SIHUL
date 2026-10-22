"""Asocia correos a un chatbot como responsables de su documentación.

Por defecto solo MUESTRA qué pasaría (vista previa). Con --aplicar guarda los cambios.

Ejemplos (dentro del contenedor del backend):
    python manage.py asignar_responsables_chatbot --agente "Agente Biblioteca" --correos ana@unilibre.edu.co,luis@unilibre.edu.co
    python manage.py asignar_responsables_chatbot --agente 3 --correos ana@unilibre.edu.co --aplicar
    python manage.py asignar_responsables_chatbot --archivo asignaciones.csv --aplicar      # columnas: correo,chatbot
    python manage.py asignar_responsables_chatbot --agente 3 --correos ana@unilibre.edu.co --quitar --aplicar

Quien es responsable de un chatbot puede subir y gestionar los documentos y las preguntas-respuestas
de ESE chatbot, siempre de la seccional de su propio usuario; no necesita un rol especial.
"""
import csv

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from chatbot.models import Agente, AgenteResponsable
from usuarios.models import Usuario


class Command(BaseCommand):
    help = 'Asigna (o quita) responsables de la documentación de un chatbot a partir de sus correos.'

    def add_arguments(self, parser):
        parser.add_argument('--agente', help='ID o nombre exacto del chatbot')
        parser.add_argument('--correos', help='Correos separados por comas')
        parser.add_argument('--archivo', help='CSV con columnas correo,chatbot (el chatbot es ID o nombre)')
        parser.add_argument('--quitar', action='store_true', help='Quitar la asignación en vez de crearla')
        parser.add_argument('--aplicar', action='store_true', help='Guardar los cambios (sin esto solo es vista previa)')

    def _agente(self, referencia):
        referencia = str(referencia).strip()
        if referencia.isdigit():
            agente = Agente.objects.filter(pk=int(referencia)).first()
        else:
            coincidencias = list(Agente.objects.filter(nombre__iexact=referencia))
            if len(coincidencias) > 1:
                raise CommandError(f'Hay varios chatbots llamados «{referencia}»: usa el ID.')
            agente = coincidencias[0] if coincidencias else None
        if not agente:
            disponibles = ', '.join(f'{a.id}={a.nombre}' for a in Agente.objects.order_by('id'))
            raise CommandError(f'No encuentro el chatbot «{referencia}». Disponibles: {disponibles}')
        return agente

    def _pares(self, opciones):
        pares = []
        if opciones['archivo']:
            with open(opciones['archivo'], newline='', encoding='utf-8-sig') as f:
                for fila in csv.DictReader(f):
                    correo = (fila.get('correo') or '').strip().lower()
                    chatbot = (fila.get('chatbot') or opciones['agente'] or '').strip()
                    if correo:
                        pares.append((correo, chatbot))
        if opciones['correos']:
            if not opciones['agente']:
                raise CommandError('Con --correos hay que indicar --agente.')
            pares += [(c.strip().lower(), opciones['agente']) for c in opciones['correos'].split(',') if c.strip()]
        if not pares:
            raise CommandError('Indica --correos con --agente, o --archivo.')
        return pares

    def handle(self, *args, **opciones):
        pares = self._pares(opciones)
        aplicar, quitar = opciones['aplicar'], opciones['quitar']
        self.stdout.write(self.style.WARNING(
            ('APLICANDO' if aplicar else 'VISTA PREVIA (no se guarda nada; agrega --aplicar)')
            + (' · QUITAR' if quitar else ' · ASIGNAR')
        ))

        resumen = {'asignados': 0, 'ya_estaban': 0, 'no_existen': 0, 'quitados': 0, 'avisos': 0}
        with transaction.atomic():
            for correo, referencia in pares:
                agente = self._agente(referencia)
                usuario = Usuario.objects.filter(correo__iexact=correo).select_related('rol', 'seccional').first()
                etiqueta = f'{correo} -> «{agente.nombre}»'
                if not usuario:
                    resumen['no_existen'] += 1
                    self.stdout.write(self.style.ERROR(f'  NO EXISTE   {etiqueta}'))
                    continue

                avisos = []
                if not usuario.activo:
                    avisos.append('usuario inactivo')
                if not usuario.rol:
                    avisos.append('sin rol: no verá el menú')
                if not (usuario.seccional_id or getattr(usuario.sede, 'seccional_id', None)):
                    avisos.append('sin seccional: no podrá subir documentos')
                resumen['avisos'] += bool(avisos)
                detalle = (f' [rol: {usuario.rol.nombre}]' if usuario.rol else '') + (f' ⚠ {"; ".join(avisos)}' if avisos else '')

                existente = AgenteResponsable.objects.filter(agente=agente, usuario=usuario)
                if quitar:
                    if existente.exists():
                        resumen['quitados'] += 1
                        if aplicar:
                            existente.delete()
                        self.stdout.write(f'  QUITAR      {etiqueta}{detalle}')
                    else:
                        self.stdout.write(f'  no estaba   {etiqueta}')
                    continue

                if existente.exists():
                    resumen['ya_estaban'] += 1
                    self.stdout.write(f'  ya estaba   {etiqueta}{detalle}')
                    continue
                resumen['asignados'] += 1
                if aplicar:
                    AgenteResponsable.objects.create(agente=agente, usuario=usuario)
                self.stdout.write(self.style.SUCCESS(f'  ASIGNAR     {etiqueta}{detalle}'))

            if not aplicar:
                transaction.set_rollback(True)

        self.stdout.write(
            f"\nResumen: {resumen['asignados']} por asignar, {resumen['ya_estaban']} ya estaban, "
            f"{resumen['quitados']} por quitar, {resumen['no_existen']} no existen, {resumen['avisos']} con avisos."
        )
