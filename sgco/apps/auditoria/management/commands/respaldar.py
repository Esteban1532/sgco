"""Copia de seguridad de la base de datos en JSON (RNF06).

En producción esta tarea la ejecuta el cron del servidor cada noche y la copia se envía cifrada a un
almacenamiento externo. En el prototipo se guarda en la carpeta respaldos/.
"""

from pathlib import Path

from django.conf import settings
from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.utils import timezone


class Command(BaseCommand):
    help = 'Genera una copia de seguridad de los datos del consultorio.'

    def add_arguments(self, parser):
        parser.add_argument('--carpeta', default=str(Path(settings.BASE_DIR) / 'respaldos'))

    def handle(self, *args, **options):
        carpeta = Path(options['carpeta'])
        carpeta.mkdir(parents=True, exist_ok=True)
        archivo = carpeta / f'sgco-{timezone.localtime():%Y%m%d-%H%M%S}.json'
        with archivo.open('w', encoding='utf-8') as salida:
            call_command('dumpdata', '--natural-foreign', '--exclude=contenttypes', '--exclude=auth.permission',
                         '--exclude=sessions', '--indent=1', stdout=salida)
        self.stdout.write(str(archivo))
