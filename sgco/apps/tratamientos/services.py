from django.db import transaction

from apps.auditoria.services import AuditoriaService

from .models import EstadoPlan, Pago, PlanTratamiento


class PagoError(Exception):
    pass


class PagoService:
    @staticmethod
    def registrar(plan, valor, medio_pago, usuario):
        """Registra un pago o abono. El saldo nunca puede quedar negativo (RF17, RF18)."""
        with transaction.atomic():
            plan = PlanTratamiento.objects.select_for_update().get(pk=plan.pk)
            if plan.estado == EstadoPlan.CANCELADO:
                raise PagoError('No se pueden registrar pagos a un plan cancelado.')
            if valor <= 0:
                raise PagoError('El valor debe ser mayor que cero.')
            if valor > plan.saldo():
                raise PagoError(f'El valor supera el saldo pendiente ({plan.saldo():,.0f}).')
            pago = Pago.objects.create(plan=plan, valor=valor, medio_pago=medio_pago, registrado_por=usuario)
        AuditoriaService.registrar(usuario, 'registrar pago', pago, f'{valor:,.0f} a plan {plan.pk}')
        return pago
