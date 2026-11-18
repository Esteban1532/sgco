from django.db import models

from apps.cuentas.models import Odontologo
from apps.pacientes.models import Paciente


class HistoriaClinica(models.Model):
    paciente = models.OneToOneField(Paciente, on_delete=models.PROTECT, related_name='historia')
    fecha_apertura = models.DateField('fecha de apertura', auto_now_add=True)
    motivo_consulta = models.TextField('motivo de consulta', blank=True)
    antecedentes = models.TextField('antecedentes médicos y odontológicos', blank=True)
    alergias = models.CharField('alergias', max_length=255, blank=True)
    medicamentos = models.CharField('medicamentos actuales', max_length=255, blank=True)
    examen_inicial = models.TextField('examen inicial', blank=True)

    class Meta:
        verbose_name = 'historia clínica'
        verbose_name_plural = 'historias clínicas'

    def agregar_evolucion(self, odontologo, procedimiento, descripcion, cita=None):
        return Evolucion.objects.create(
            historia=self, odontologo=odontologo, procedimiento=procedimiento, descripcion=descripcion, cita=cita
        )

    def __str__(self):
        return f'Historia de {self.paciente}'


class Evolucion(models.Model):
    """Registro de cada atención. No se puede modificar ni borrar (RF14, Resolución 1995 de 1999)."""

    historia = models.ForeignKey(HistoriaClinica, on_delete=models.PROTECT, related_name='evoluciones')
    odontologo = models.ForeignKey(Odontologo, on_delete=models.PROTECT, related_name='evoluciones')
    cita = models.ForeignKey('agenda.Cita', null=True, blank=True, on_delete=models.SET_NULL, related_name='evoluciones')
    fecha = models.DateTimeField('fecha', auto_now_add=True)
    procedimiento = models.CharField('procedimiento', max_length=150)
    descripcion = models.TextField('descripción')

    class Meta:
        ordering = ['-fecha']
        verbose_name = 'evolución'
        verbose_name_plural = 'evoluciones'

    def save(self, *args, **kwargs):
        if self.pk:
            raise PermissionError('Una evolución registrada no se puede modificar; agregue una nota aclaratoria.')
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise PermissionError('Las evoluciones de la historia clínica no se pueden borrar.')
