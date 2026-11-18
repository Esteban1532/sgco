from django.contrib import messages
from django.db import transaction
from django.shortcuts import get_object_or_404, redirect, render
from django.views.decorators.http import require_POST

from apps.auditoria.services import AuditoriaService
from apps.cuentas.models import Odontologo, Rol
from apps.cuentas.permisos import rol_requerido
from apps.pacientes.models import Paciente

from .forms import ItemFormSet, PagoForm, PlanForm
from .models import EstadoPlan, PlanTratamiento
from .services import PagoError, PagoService

TODOS = (Rol.ADMINISTRADOR, Rol.RECEPCIONISTA, Rol.ODONTOLOGO)


@rol_requerido(Rol.ODONTOLOGO)
def nuevo(request, paciente_pk):
    """El odontólogo crea el plan con sus procedimientos y valores (RF16)."""
    paciente = get_object_or_404(Paciente, pk=paciente_pk)
    form = PlanForm(request.POST or None)
    items = ItemFormSet(request.POST or None, prefix='items')
    if request.method == 'POST' and form.is_valid() and items.is_valid():
        with transaction.atomic():
            plan = form.save(commit=False)
            plan.paciente = paciente
            plan.odontologo = Odontologo.objects.get(pk=request.user.pk)
            plan.save()
            items.instance = plan
            items.save()
        AuditoriaService.registrar(request.user, 'crear plan', plan, f'{plan.descripcion}: {plan.valor_total():,.0f}')
        messages.success(request, 'Plan de tratamiento creado.')
        return redirect('tratamientos:detalle', plan.pk)
    return render(request, 'tratamientos/nuevo.html', {'paciente': paciente, 'form': form, 'items': items})


@rol_requerido(*TODOS)
def detalle(request, pk):
    plan = get_object_or_404(PlanTratamiento.objects.select_related('paciente', 'odontologo'), pk=pk)
    return render(request, 'tratamientos/detalle.html', {
        'plan': plan, 'items': plan.items.all(), 'pagos': plan.pagos.select_related('registrado_por'),
        'form_pago': PagoForm(),
    })


@require_POST
@rol_requerido(Rol.ODONTOLOGO, Rol.ADMINISTRADOR)
def cambiar_estado(request, pk):
    plan = get_object_or_404(PlanTratamiento, pk=pk)
    estado = request.POST.get('estado')
    if estado in (EstadoPlan.APROBADO, EstadoPlan.CANCELADO):
        plan.estado = estado
        plan.save(update_fields=['estado'])
        AuditoriaService.registrar(request.user, 'cambiar estado plan', plan, plan.get_estado_display())
        messages.success(request, f'Plan {plan.get_estado_display().lower()}.')
    return redirect('tratamientos:detalle', plan.pk)


@require_POST
@rol_requerido(Rol.RECEPCIONISTA, Rol.ADMINISTRADOR)
def pagar(request, pk):
    plan = get_object_or_404(PlanTratamiento, pk=pk)
    form = PagoForm(request.POST)
    if form.is_valid():
        try:
            PagoService.registrar(plan, form.cleaned_data['valor'], form.cleaned_data['medio_pago'], request.user)
            messages.success(request, 'Pago registrado.')
        except PagoError as error:
            messages.error(request, str(error))
    else:
        messages.error(request, 'Revise el valor del pago.')
    return redirect('tratamientos:detalle', plan.pk)
