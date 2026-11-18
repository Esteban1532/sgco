from django.db import models

from apps.pacientes.models import Paciente


class EstadoMensaje(models.TextChoices):
    PENDIENTE = 'PENDIENTE', 'Pendiente de reintento'
    ENVIADO = 'ENVIADO', 'Enviado'


class TipoMensaje(models.TextChoices):
    CONFIRMACION = 'CONFIRMACION', 'Confirmación de cita'
    RECORDATORIO = 'RECORDATORIO', 'Recordatorio 24 h'
    CAMBIO = 'CAMBIO', 'Cambio o cancelación'


class Mensaje(models.Model):
    """Cada mensaje que el sistema intenta enviar. Si falla queda pendiente (RNF07)."""

    paciente = models.ForeignKey(Paciente, on_delete=models.CASCADE, related_name='mensajes')
    cita = models.ForeignKey('agenda.Cita', null=True, blank=True, on_delete=models.SET_NULL, related_name='mensajes')
    tipo = models.CharField(max_length=14, choices=TipoMensaje.choices)
    contenido = models.TextField()
    estado = models.CharField(max_length=10, choices=EstadoMensaje.choices, default=EstadoMensaje.PENDIENTE)
    intentos = models.PositiveIntegerField(default=0)
    creado_en = models.DateTimeField(auto_now_add=True)
    enviado_en = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-creado_en']
