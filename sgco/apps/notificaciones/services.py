from datetime import timedelta

from django.utils import timezone

from .models import EstadoMensaje, Mensaje, TipoMensaje
from .notificadores import notificador_configurado


class ServicioMensajes:
    """Guarda el mensaje y lo intenta enviar. Si el envío falla queda pendiente de reintento."""

    def __init__(self, notificador=None):
        self.notificador = notificador or notificador_configurado()

    def enviar(self, paciente, contenido, tipo, cita=None):
        mensaje = Mensaje.objects.create(paciente=paciente, cita=cita, tipo=tipo, contenido=contenido)
        self._intentar(mensaje)
        return mensaje

    def reintentar_pendientes(self):
        enviados = 0
        for mensaje in Mensaje.objects.filter(estado=EstadoMensaje.PENDIENTE).select_related('paciente'):
            enviados += self._intentar(mensaje)
        return enviados

    def _intentar(self, mensaje):
        mensaje.intentos += 1
        if self.notificador.enviar(mensaje.paciente, mensaje.contenido):
            mensaje.estado = EstadoMensaje.ENVIADO
            mensaje.enviado_en = timezone.now()
        mensaje.save()
        return mensaje.estado == EstadoMensaje.ENVIADO


class RecordatorioService:
    """Envía los recordatorios de las citas del día siguiente (RF10)."""

    def __init__(self, notificador=None):
        self.mensajes = ServicioMensajes(notificador)

    def enviar_recordatorios_de(self, fecha=None):
        from apps.agenda.models import Cita, EstadoCita

        fecha = fecha or (timezone.localdate() + timedelta(days=1))
        citas = Cita.objects.filter(
            fecha=fecha, estado=EstadoCita.PROGRAMADA, paciente__acepta_mensajes=True
        ).select_related('paciente', 'odontologo')
        total = 0
        for cita in citas:
            if cita.mensajes.filter(tipo=TipoMensaje.RECORDATORIO).exists():
                continue
            texto = (
                f'Hola {cita.paciente.nombres}, le recordamos su cita de mañana {cita.fecha:%d/%m/%Y} '
                f'a las {cita.hora_inicio:%H:%M} con {cita.odontologo}.'
            )
            self.mensajes.enviar(cita.paciente, texto, TipoMensaje.RECORDATORIO, cita)
            total += 1
        return total
