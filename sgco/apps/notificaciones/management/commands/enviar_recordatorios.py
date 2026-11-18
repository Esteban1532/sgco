from django.core.management.base import BaseCommand

from apps.notificaciones.services import RecordatorioService, ServicioMensajes


class Command(BaseCommand):
    help = 'Envía los recordatorios de las citas de mañana y reintenta los mensajes pendientes (tarea programada diaria).'

    def handle(self, *args, **options):
        reenviados = ServicioMensajes().reintentar_pendientes()
        recordatorios = RecordatorioService().enviar_recordatorios_de()
        self.stdout.write(f'Pendientes reenviados: {reenviados}. Recordatorios procesados: {recordatorios}.')
