from decimal import Decimal

from django.conf import settings
from django.db import models
from django.db.models import Sum

from apps.cuentas.models import Odontologo
from apps.pacientes.models import Paciente


class EstadoPlan(models.TextChoices):
    PENDIENTE = 'PENDIENTE', 'Pendiente de aprobación'
    APROBADO = 'APROBADO', 'Aprobado'
    CANCELADO = 'CANCELADO', 'Cancelado'


class MedioPago(models.TextChoices):
    EFECTIVO = 'EFECTIVO', 'Efectivo'
    TARJETA = 'TARJETA', 'Tarjeta'
    TRANSFERENCIA = 'TRANSFERENCIA', 'Transferencia'


class PlanTratamiento(models.Model):
    paciente = models.ForeignKey(Paciente, on_delete=models.PROTECT, related_name='planes')
    odontologo = models.ForeignKey(Odontologo, on_delete=models.PROTECT, related_name='planes')
    fecha = models.DateField('fecha', auto_now_add=True)
    descripcion = models.CharField('descripción', max_length=150)
    estado = models.CharField('estado', max_length=10, choices=EstadoPlan.choices, default=EstadoPlan.PENDIENTE)

    class Meta:
        ordering = ['-fecha', '-id']
        verbose_name = 'plan de tratamiento'
        verbose_name_plural = 'planes de tratamiento'

    def valor_total(self):
        return self.items.aggregate(t=Sum('valor'))['t'] or Decimal('0')

    def total_pagado(self):
        return self.pagos.aggregate(t=Sum('valor'))['t'] or Decimal('0')

    def saldo(self):
        return self.valor_total() - self.total_pagado()

    def __str__(self):
        return f'{self.descripcion} ({self.paciente})'


class ItemTratamiento(models.Model):
    plan = models.ForeignKey(PlanTratamiento, on_delete=models.CASCADE, related_name='items')
    procedimiento = models.CharField('procedimiento', max_length=120)
    pieza = models.CharField('pieza dental', max_length=10, blank=True)
    valor = models.DecimalField('valor', max_digits=12, decimal_places=0)


class Pago(models.Model):
    """Abono a un plan. Se conserva aunque el plan se cancele (agregación)."""

    plan = models.ForeignKey(PlanTratamiento, on_delete=models.PROTECT, related_name='pagos')
    fecha = models.DateField('fecha', auto_now_add=True)
    valor = models.DecimalField('valor', max_digits=12, decimal_places=0)
    medio_pago = models.CharField('medio de pago', max_length=14, choices=MedioPago.choices)
    registrado_por = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name='+')

    class Meta:
        ordering = ['-fecha', '-id']
