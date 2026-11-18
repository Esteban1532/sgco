from django.contrib import messages
from django.shortcuts import redirect, render
from django.views.decorators.http import require_POST

from apps.cuentas.models import Rol
from apps.cuentas.permisos import rol_requerido

from .models import EstadoMensaje, Mensaje
from .services import RecordatorioService, ServicioMensajes


@rol_requerido(Rol.ADMINISTRADOR, Rol.RECEPCIONISTA)
def lista(request):
    return render(request, 'notificaciones/lista.html', {
        'mensajes': Mensaje.objects.select_related('paciente', 'cita')[:100],
        'pendientes': Mensaje.objects.filter(estado=EstadoMensaje.PENDIENTE).count(),
    })


@require_POST
@rol_requerido(Rol.ADMINISTRADOR, Rol.RECEPCIONISTA)
def recordatorios(request):
    total = RecordatorioService().enviar_recordatorios_de()
    messages.success(request, f'Se procesaron {total} recordatorios para las citas de mañana.')
    return redirect('notificaciones:lista')


@require_POST
@rol_requerido(Rol.ADMINISTRADOR, Rol.RECEPCIONISTA)
def reintentar(request):
    enviados = ServicioMensajes().reintentar_pendientes()
    messages.success(request, f'Reintento terminado: {enviados} mensajes enviados.')
    return redirect('notificaciones:lista')
