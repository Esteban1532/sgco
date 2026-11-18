from datetime import datetime, timedelta

from django.conf import settings
from django.db import models

from apps.cuentas.models import Odontologo
from apps.pacientes.models import Paciente

DIAS = [(0, 'Lunes'), (1, 'Martes'), (2, 'Miércoles'), (3, 'Jueves'), (4, 'Viernes'), (5, 'Sábado'), (6, 'Domingo')]


class HorarioAtencion(models.Model):
    odontologo = models.ForeignKey(Odontologo, on_delete=models.CASCADE, related_name='horarios')
    dia_semana = models.IntegerField('día', choices=DIAS)
    hora_inicio = models.TimeField('desde')
    hora_fin = models.TimeField('hasta')

    class Meta:
        ordering = ['odontologo', 'dia_semana', 'hora_inicio']
        verbose_name = 'horario de atención'
        verbose_name_plural = 'horarios de atención'

    def contiene(self, inicio, fin):
        return self.hora_inicio <= inicio and fin <= self.hora_fin

    def __str__(self):
        return f'{self.get_dia_semana_display()} {self.hora_inicio:%H:%M}-{self.hora_fin:%H:%M}'


class BloqueoAgenda(models.Model):
    """Franja en la que el odontólogo no atiende (vacaciones, capacitación)."""

    odontologo = models.ForeignKey(Odontologo, on_delete=models.CASCADE, related_name='bloqueos')
    inicio = models.DateTimeField('desde')
    fin = models.DateTimeField('hasta')
    motivo = models.CharField('motivo', max_length=120)

    class Meta:
        ordering = ['inicio']
        verbose_name = 'bloqueo de agenda'
        verbose_name_plural = 'bloqueos de agenda'


class EstadoCita(models.TextChoices):
    PROGRAMADA = 'PROGRAMADA', 'Programada'
    ATENDIDA = 'ATENDIDA', 'Atendida'
    INASISTENCIA = 'INASISTENCIA', 'Inasistencia'
    CANCELADA = 'CANCELADA', 'Cancelada'


class Cita(models.Model):
    paciente = models.ForeignKey(Paciente, on_delete=models.PROTECT, related_name='citas')
    odontologo = models.ForeignKey(Odontologo, on_delete=models.PROTECT, related_name='citas')
    fecha = models.DateField('fecha')
    hora_inicio = models.TimeField('hora')
    duracion_min = models.PositiveIntegerField('duración (min)', default=30)
    motivo = models.CharField('motivo', max_length=200)
    estado = models.CharField('estado', max_length=12, choices=EstadoCita.choices, default=EstadoCita.PROGRAMADA)
    motivo_cambio = models.CharField('motivo de cancelación o cambio', max_length=200, blank=True)
    creada_por = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name='+')
    creada_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['fecha', 'hora_inicio']
        indexes = [models.Index(fields=['odontologo', 'fecha'])]  # RNF11

    def __str__(self):
        return f'{self.fecha} {self.hora_inicio:%H:%M} {self.paciente} con {self.odontologo}'

    @property
    def activa(self):
        return self.estado != EstadoCita.CANCELADA

    def hora_fin(self):
        return (datetime.combine(self.fecha, self.hora_inicio) + timedelta(minutes=self.duracion_min)).time()

    def se_cruza_con(self, otra):
        """True si ambas citas son del mismo odontólogo, el mismo día y sus franjas se solapan (RF07)."""
        if otra.pk and otra.pk == self.pk:
            return False
        if not otra.activa or otra.odontologo_id != self.odontologo_id or otra.fecha != self.fecha:
            return False
        return self.hora_inicio < otra.hora_fin() and otra.hora_inicio < self.hora_fin()

    def cancelar(self, motivo):
        if not motivo:
            raise ValueError('El motivo de cancelación es obligatorio.')
        self.estado = EstadoCita.CANCELADA
        self.motivo_cambio = motivo

    def marcar_asistencia(self, asistio):
        if self.estado == EstadoCita.CANCELADA:
            raise ValueError('No se puede marcar asistencia de una cita cancelada.')
        self.estado = EstadoCita.ATENDIDA if asistio else EstadoCita.INASISTENCIA
