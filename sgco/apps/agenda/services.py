from datetime import datetime, timedelta

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from apps.auditoria.services import AuditoriaService
from apps.cuentas.models import Odontologo
from apps.notificaciones.models import TipoMensaje
from apps.notificaciones.services import ServicioMensajes

from .models import BloqueoAgenda, Cita, EstadoCita


class DisponibilidadError(Exception):
    """La franja pedida está fuera de horario, bloqueada o se cruza con otra cita."""


class AgendaService:
    """Coordina el agendamiento. Depende de la interfaz Notificador, no de un proveedor concreto."""

    def __init__(self, notificador=None, auditoria=AuditoriaService):
        self.mensajes = ServicioMensajes(notificador)
        self.auditoria = auditoria

    # ------------------------------------------------------------ consultas
    def disponibilidad(self, odontologo, fecha, duracion_min=None):
        """Franjas libres (hora de inicio) del odontólogo en la fecha (RF09)."""
        paso = timedelta(minutes=settings.SGCO_MINUTOS_FRANJA)
        duracion = timedelta(minutes=duracion_min or settings.SGCO_MINUTOS_FRANJA)
        citas = list(Cita.objects.filter(odontologo=odontologo, fecha=fecha).exclude(estado=EstadoCita.CANCELADA))
        franjas = []
        for horario in odontologo.horario_del(fecha):
            inicio = datetime.combine(fecha, horario.hora_inicio)
            while inicio + duracion <= datetime.combine(fecha, horario.hora_fin):
                prueba = Cita(odontologo=odontologo, fecha=fecha, hora_inicio=inicio.time(),
                              duracion_min=int(duracion.total_seconds() // 60))
                if not self._bloqueada(prueba) and not any(prueba.se_cruza_con(c) for c in citas):
                    franjas.append(inicio.time())
                inicio += paso
        return franjas

    # ------------------------------------------------------------ operaciones
    def agendar(self, datos, usuario):
        """Crea la cita si la franja está libre. Lanza DisponibilidadError si no (RF06, RF07)."""
        with transaction.atomic():
            # Bloquea la agenda del odontólogo mientras se valida y se guarda.
            odontologo = Odontologo.objects.select_for_update().get(pk=datos['odontologo'].pk)
            cita = Cita(
                paciente=datos['paciente'], odontologo=odontologo, fecha=datos['fecha'],
                hora_inicio=datos['hora_inicio'], duracion_min=datos.get('duracion_min', 30),
                motivo=datos['motivo'], creada_por=usuario,
            )
            self._validar(cita)
            cita.save()
        self.auditoria.registrar(usuario, 'crear cita', cita, str(cita))
        self.mensajes.enviar(
            cita.paciente,
            f'Su cita quedó agendada para el {cita.fecha:%d/%m/%Y} a las {cita.hora_inicio:%H:%M} con {cita.odontologo}.',
            TipoMensaje.CONFIRMACION, cita,
        )
        return cita

    def reprogramar(self, cita, fecha, hora_inicio, motivo, usuario):
        """Mueve la cita a otra franja libre (RF08)."""
        if not motivo:
            raise ValueError('El motivo es obligatorio.')
        anterior = f'{cita.fecha} {cita.hora_inicio:%H:%M}'
        with transaction.atomic():
            Odontologo.objects.select_for_update().get(pk=cita.odontologo_id)
            cita.fecha, cita.hora_inicio, cita.motivo_cambio = fecha, hora_inicio, motivo
            self._validar(cita)
            cita.save()
        self.auditoria.registrar(usuario, 'reprogramar cita', cita, f'{anterior} -> {cita.fecha} {cita.hora_inicio:%H:%M}. {motivo}')
        self.mensajes.enviar(
            cita.paciente,
            f'Su cita fue cambiada al {cita.fecha:%d/%m/%Y} a las {cita.hora_inicio:%H:%M}.',
            TipoMensaje.CAMBIO, cita,
        )
        return cita

    def cancelar(self, cita, motivo, usuario):
        cita.cancelar(motivo)
        cita.save()
        self.auditoria.registrar(usuario, 'cancelar cita', cita, motivo)
        self.mensajes.enviar(cita.paciente, f'Su cita del {cita.fecha:%d/%m/%Y} fue cancelada.', TipoMensaje.CAMBIO, cita)

    def marcar_asistencia(self, cita, asistio, usuario):
        cita.marcar_asistencia(asistio)
        cita.save()
        self.auditoria.registrar(usuario, 'marcar asistencia', cita, cita.get_estado_display())

    # ------------------------------------------------------------ reglas
    def _validar(self, cita):
        if not any(h.contiene(cita.hora_inicio, cita.hora_fin()) for h in cita.odontologo.horario_del(cita.fecha)):
            raise DisponibilidadError('La hora está fuera del horario de atención del odontólogo.')
        if self._bloqueada(cita):
            raise DisponibilidadError('El odontólogo tiene la agenda bloqueada en esa franja.')
        otras = Cita.objects.filter(odontologo=cita.odontologo, fecha=cita.fecha).exclude(estado=EstadoCita.CANCELADA)
        if any(cita.se_cruza_con(o) for o in otras):
            raise DisponibilidadError('La franja se cruza con otra cita del mismo odontólogo.')

    @staticmethod
    def _bloqueada(cita):
        tz = timezone.get_current_timezone()
        inicio = timezone.make_aware(datetime.combine(cita.fecha, cita.hora_inicio), tz)
        fin = timezone.make_aware(datetime.combine(cita.fecha, cita.hora_fin()), tz)
        return BloqueoAgenda.objects.filter(odontologo_id=cita.odontologo_id, inicio__lt=fin, fin__gt=inicio).exists()
