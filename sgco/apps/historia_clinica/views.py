from django.contrib import messages
from django.shortcuts import get_object_or_404, redirect, render
from django.views.decorators.http import require_POST

from apps.auditoria.services import AuditoriaService
from apps.cuentas.models import Odontologo, Rol
from apps.cuentas.permisos import rol_requerido
from apps.pacientes.models import Paciente

from .forms import EvolucionForm, HistoriaForm
from .models import HistoriaClinica

# RNF02: solo el odontólogo ve y edita la historia clínica.
SOLO_ODONTOLOGO = rol_requerido(Rol.ODONTOLOGO)


@SOLO_ODONTOLOGO
def ver(request, paciente_pk):
    paciente = get_object_or_404(Paciente, pk=paciente_pk)
    historia = HistoriaClinica.objects.filter(paciente=paciente).first()
    if historia is None:
        return redirect('historia:editar', paciente.pk)
    AuditoriaService.registrar(request.user, 'consultar historia', historia, str(paciente))
    return render(request, 'historia_clinica/ver.html', {
        'paciente': paciente, 'historia': historia,
        'evoluciones': historia.evoluciones.select_related('odontologo', 'cita'),
        'form_evolucion': EvolucionForm(paciente=paciente),
    })


@SOLO_ODONTOLOGO
def editar(request, paciente_pk):
    paciente = get_object_or_404(Paciente, pk=paciente_pk)
    historia = HistoriaClinica.objects.filter(paciente=paciente).first()
    form = HistoriaForm(request.POST or None, instance=historia)
    if request.method == 'POST' and form.is_valid():
        nueva = historia is None
        historia = form.save(commit=False)
        historia.paciente = paciente
        historia.save()
        AuditoriaService.registrar(request.user, 'abrir historia' if nueva else 'editar historia', historia, str(paciente))
        messages.success(request, 'Historia clínica guardada.')
        return redirect('historia:ver', paciente.pk)
    titulo = f'Historia clínica de {paciente}' if historia else f'Abrir historia clínica de {paciente}'
    return render(request, 'formulario.html', {'form': form, 'titulo': titulo, 'volver_url': f'/pacientes/{paciente.pk}/'})


@require_POST
@SOLO_ODONTOLOGO
def evolucion(request, paciente_pk):
    paciente = get_object_or_404(Paciente, pk=paciente_pk)
    historia = get_object_or_404(HistoriaClinica, paciente=paciente)
    form = EvolucionForm(request.POST, paciente=paciente)
    if form.is_valid():
        d = form.cleaned_data
        odontologo = Odontologo.objects.get(pk=request.user.pk)
        nueva = historia.agregar_evolucion(odontologo, d['procedimiento'], d['descripcion'], d.get('cita'))
        AuditoriaService.registrar(request.user, 'registrar evolución', nueva, d['procedimiento'])
        messages.success(request, 'Evolución registrada.')
    else:
        messages.error(request, 'Revise los datos de la evolución.')
    return redirect('historia:ver', paciente.pk)
