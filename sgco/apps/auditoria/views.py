from django.shortcuts import render

from apps.cuentas.models import Rol
from apps.cuentas.permisos import rol_requerido

from .models import RegistroAuditoria


@rol_requerido(Rol.ADMINISTRADOR)
def lista(request):
    registros = RegistroAuditoria.objects.select_related('usuario')
    accion = request.GET.get('accion', '')
    if accion:
        registros = registros.filter(accion=accion)
    acciones = RegistroAuditoria.objects.order_by('accion').values_list('accion', flat=True).distinct()
    return render(request, 'auditoria/lista.html', {'registros': registros[:200], 'acciones': acciones, 'accion': accion})
