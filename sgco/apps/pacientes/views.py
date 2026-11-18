from django.contrib import messages
from django.db.models import Q
from django.shortcuts import get_object_or_404, redirect, render

from apps.auditoria.services import AuditoriaService
from apps.cuentas.models import Rol
from apps.cuentas.permisos import rol_requerido

from .forms import PacienteForm
from .models import Paciente

TODOS = (Rol.ADMINISTRADOR, Rol.RECEPCIONISTA, Rol.ODONTOLOGO)


@rol_requerido(*TODOS)
def lista(request):
    q = request.GET.get('q', '').strip()
    pacientes = Paciente.objects.all()
    if q:
        filtro = Q(documento__icontains=q) | Q(telefono__icontains=q)
        for palabra in q.split():
            filtro |= Q(nombres__icontains=palabra) | Q(apellidos__icontains=palabra)
        pacientes = pacientes.filter(filtro)
    return render(request, 'pacientes/lista.html', {'pacientes': pacientes[:50], 'q': q})


@rol_requerido(Rol.ADMINISTRADOR, Rol.RECEPCIONISTA)
def nuevo(request):
    form = PacienteForm(request.POST or None)
    if request.method == 'POST' and form.is_valid():
        paciente = form.save()
        AuditoriaService.registrar(request.user, 'crear paciente', paciente, paciente.documento)
        messages.success(request, f'Paciente {paciente} registrado.')
        return redirect('pacientes:detalle', paciente.pk)
    return render(request, 'formulario.html', {'form': form, 'titulo': 'Nuevo paciente', 'volver': 'pacientes:lista'})


@rol_requerido(Rol.ADMINISTRADOR, Rol.RECEPCIONISTA)
def editar(request, pk):
    paciente = get_object_or_404(Paciente, pk=pk)
    form = PacienteForm(request.POST or None, instance=paciente)
    if request.method == 'POST' and form.is_valid():
        form.save()
        AuditoriaService.registrar(request.user, 'editar paciente', paciente, paciente.documento)
        messages.success(request, 'Datos del paciente actualizados.')
        return redirect('pacientes:detalle', paciente.pk)
    return render(request, 'formulario.html', {'form': form, 'titulo': f'Editar {paciente}', 'volver': 'pacientes:lista'})


@rol_requerido(*TODOS)
def detalle(request, pk):
    paciente = get_object_or_404(Paciente, pk=pk)
    return render(request, 'pacientes/detalle.html', {
        'paciente': paciente,
        'citas': paciente.citas.select_related('odontologo').order_by('-fecha', '-hora_inicio')[:20],
        'planes': paciente.planes.all(),
    })
