from django.conf import settings
from django.db import models


class RegistroAuditoria(models.Model):
    """Registro inmutable de quién hizo qué y cuándo (RF20, RNF04)."""

    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name='+')
    accion = models.CharField('acción', max_length=60)
    modelo = models.CharField('registro', max_length=60)
    objeto_id = models.CharField('id', max_length=40, blank=True)
    detalle = models.CharField('detalle', max_length=255, blank=True)
    fecha = models.DateTimeField('fecha', auto_now_add=True)

    class Meta:
        ordering = ['-fecha']
        verbose_name = 'registro de auditoría'
        verbose_name_plural = 'registros de auditoría'

    def save(self, *args, **kwargs):
        if self.pk:
            raise PermissionError('Los registros de auditoría no se pueden modificar.')
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise PermissionError('Los registros de auditoría no se pueden borrar.')

    def __str__(self):
        return f'{self.fecha:%Y-%m-%d %H:%M} {self.usuario} {self.accion} {self.modelo} {self.objeto_id}'
