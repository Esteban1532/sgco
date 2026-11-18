from django.contrib import messages
from django.contrib.auth import views as auth_views
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone
from django.views.decorators.http import require_POST

from apps.agenda.models import Cita, EstadoCita
from apps.auditoria.services import AuditoriaService

from .forms import UsuarioEdicionForm, UsuarioNuevoForm
from .models import Rol, Usuario
from .permisos import rol_requerido


class IngresarView(auth_views.LoginView):
    template_name = 'cuentas/ingresar.html'
    redirect_authenticated_user = True


def inicio(request):
    hoy = timezone.localdate()
    citas = Cita.objects.filter(fecha=hoy).select_related('paciente', 'odontologo')
    if request.user.es_odontologo:
        citas = citas.filter(odontologo_id=request.user.pk)
    return render(request, 'cuentas/inicio.html', {
        'hoy': hoy,
        'citas': citas,
        'programadas': citas.filter(estado=EstadoCita.PROGRAMADA).count(),
        'atendidas': citas.filter(estado=EstadoCita.ATENDIDA).count(),
        'inasistencias': citas.filter(estado=EstadoCita.INASISTENCIA).count(),
    })


@rol_requerido(Rol.ADMINISTRADOR)
def usuarios(request):
    return render(request, 'cuentas/usuarios.html', {'usuarios': Usuario.objects.order_by('rol', 'first_name')})


@rol_requerido(Rol.ADMINISTRADOR)
def usuario_nuevo(request):
    form = UsuarioNuevoForm(request.POST or None)
    if request.method == 'POST' and form.is_valid():
        usuario = form.save()
        AuditoriaService.registrar(request.user, 'crear usuario', usuario, f'{usuario.username} ({usuario.get_rol_display()})')
        messages.success(request, f'Usuario {usuario.username} creado.')
        return redirect('cuentas:usuarios')
    return render(request, 'formulario.html', {'form': form, 'titulo': 'Nuevo usuario', 'volver': 'cuentas:usuarios'})


@rol_requerido(Rol.ADMINISTRADOR)
def usuario_editar(request, pk):
    usuario = get_object_or_404(Usuario, pk=pk)
    form = UsuarioEdicionForm(request.POST or None, instance=usuario)
    if request.method == 'POST' and form.is_valid():
        form.save()
        AuditoriaService.registrar(request.user, 'editar usuario', usuario, usuario.username)
        messages.success(request, 'Usuario actualizado.')
        return redirect('cuentas:usuarios')
    return render(request, 'formulario.html', {'form': form, 'titulo': f'Editar {usuario.username}', 'volver': 'cuentas:usuarios'})


@require_POST
@rol_requerido(Rol.ADMINISTRADOR)
def usuario_activar(request, pk):
    usuario = get_object_or_404(Usuario, pk=pk)
    if usuario == request.user:
        messages.error(request, 'No puede inactivar su propio usuario.')
        return redirect('cuentas:usuarios')
    usuario.is_active = not usuario.is_active
    usuario.save(update_fields=['is_active'])
    accion = 'activar usuario' if usuario.is_active else 'inactivar usuario'
    AuditoriaService.registrar(request.user, accion, usuario, usuario.username)
    messages.success(request, f'Usuario {usuario.username} {"activado" if usuario.is_active else "inactivado"}.')
    return redirect('cuentas:usuarios')
