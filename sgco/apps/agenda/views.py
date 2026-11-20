from datetime import date, datetime, timedelta

from django.contrib import messages
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone
from django.views.decorators.http import require_POST

from apps.auditoria.services import AuditoriaService
from apps.cuentas.models import Odontologo, Rol
from apps.cuentas.permisos import rol_requerido

from .forms import BloqueoForm, BuscarFranjaForm, HorarioForm, ReprogramarForm
from .models import Cita, EstadoCita, HorarioAtencion
from .services import AgendaService, DisponibilidadError

TODOS = (Rol.ADMINISTRADOR, Rol.RECEPCIONISTA, Rol.ODONTOLOGO)
RECEPCION = (Rol.ADMINISTRADOR, Rol.RECEPCIONISTA)


def _fecha(valor, por_defecto):
    try:
        return date.fromisoformat(valor)
    except (TypeError, ValueError):
        return por_defecto


@rol_requerido(*TODOS)
def dia(request):
    """Agenda del día por odontólogo con el estado de cada cita (RF09)."""
    fecha = _fecha(request.GET.get('fecha'), timezone.localdate())
    odontologos = Odontologo.objects.filter(is_active=True)
    if request.user.es_odontologo:
        odontologos = odontologos.filter(pk=request.user.pk)
    elif request.GET.get('odontologo'):
        odontologos = odontologos.filter(pk=request.GET['odontologo'])
    columnas = [
        (o, Cita.objects.filter(odontologo=o, fecha=fecha).select_related('paciente').order_by('hora_inicio'))
        for o in odontologos
    ]
    return render(request, 'agenda/dia.html', {
        'fecha': fecha, 'columnas': columnas,
        'anterior': fecha - timedelta(days=1), 'siguiente': fecha + timedelta(days=1),
        'todos_odontologos': Odontologo.objects.filter(is_active=True),
    })


@rol_requerido(*RECEPCION)
def nueva(request):
    """Agendar cita en una sola pantalla: datos, franjas libres y confirmación (RF06, RF07, RNF08)."""
    servicio = AgendaService()
    datos_iniciales = {'paciente': request.GET.get('paciente'), 'fecha': timezone.localdate(), 'duracion_min': 30}
    # Si solo llega ?paciente= (botón Agendar de la ficha), el formulario se muestra sin errores.
    busqueda = request.GET if 'odontologo' in request.GET else None
    form = BuscarFranjaForm(request.POST or busqueda, initial=datos_iniciales)
    franjas = None
    if form.is_bound and form.is_valid():
        d = form.cleaned_data
        if request.method == 'POST':
            try:
                hora = datetime.strptime(request.POST['hora'], '%H:%M').time()
                cita = servicio.agendar({**d, 'hora_inicio': hora}, request.user)
                messages.success(request, f'Cita agendada: {cita.fecha:%d/%m/%Y} {cita.hora_inicio:%H:%M} con {cita.odontologo}.')
                return redirect(f"/agenda/?fecha={cita.fecha.isoformat()}")
            except (KeyError, ValueError):
                messages.error(request, 'Seleccione una hora.')
            except DisponibilidadError as error:
                messages.error(request, f'No se pudo agendar: {error} Elija otra franja.')
        franjas = servicio.disponibilidad(d['odontologo'], d['fecha'], d['duracion_min'])
    return render(request, 'agenda/nueva.html', {'form': form, 'franjas': franjas})


@rol_requerido(*RECEPCION)
def reprogramar(request, pk):
    cita = get_object_or_404(Cita, pk=pk, estado=EstadoCita.PROGRAMADA)
    servicio = AgendaService()
    form = ReprogramarForm(request.POST or request.GET or None, initial={'fecha': cita.fecha})
    franjas = None
    if form.is_bound and form.is_valid():
        d = form.cleaned_data
        if request.method == 'POST' and request.POST.get('hora'):
            try:
                hora = datetime.strptime(request.POST['hora'], '%H:%M').time()
                servicio.reprogramar(cita, d['fecha'], hora, d['motivo'], request.user)
                messages.success(request, 'Cita reprogramada.')
                return redirect(f"/agenda/?fecha={cita.fecha.isoformat()}")
            except DisponibilidadError as error:
                cita.refresh_from_db()
                messages.error(request, f'No se pudo reprogramar: {error}')
        franjas = servicio.disponibilidad(cita.odontologo, d['fecha'], cita.duracion_min)
    return render(request, 'agenda/reprogramar.html', {'cita': cita, 'form': form, 'franjas': franjas})


@require_POST
@rol_requerido(*RECEPCION)
def cancelar(request, pk):
    cita = get_object_or_404(Cita, pk=pk, estado=EstadoCita.PROGRAMADA)
    try:
        AgendaService().cancelar(cita, request.POST.get('motivo', '').strip(), request.user)
        messages.success(request, 'Cita cancelada.')
    except ValueError as error:
        messages.error(request, str(error))
    return redirect(f"/agenda/?fecha={cita.fecha.isoformat()}")


@require_POST
@rol_requerido(*RECEPCION)
def asistencia(request, pk):
    cita = get_object_or_404(Cita, pk=pk)
    if cita.fecha > timezone.localdate():
        messages.error(request, 'Solo se marca asistencia de citas de hoy o anteriores.')
    else:
        try:
            AgendaService().marcar_asistencia(cita, request.POST.get('asistio') == '1', request.user)
            messages.success(request, f'Cita marcada como {cita.get_estado_display().lower()}.')
        except ValueError as error:
            messages.error(request, str(error))
    return redirect(f"/agenda/?fecha={cita.fecha.isoformat()}")


@rol_requerido(Rol.ADMINISTRADOR)
def horarios(request):
    return render(request, 'agenda/horarios.html', {'odontologos': Odontologo.objects.prefetch_related('horarios', 'bloqueos')})


@rol_requerido(Rol.ADMINISTRADOR)
def horario_nuevo(request, odontologo_pk):
    odontologo = get_object_or_404(Odontologo, pk=odontologo_pk)
    form = HorarioForm(request.POST or None)
    if request.method == 'POST' and form.is_valid():
        horario = form.save(commit=False)
        horario.odontologo = odontologo
        horario.save()
        AuditoriaService.registrar(request.user, 'crear horario', horario, f'{odontologo}: {horario}')
        messages.success(request, 'Horario agregado.')
        return redirect('agenda:horarios')
    return render(request, 'formulario.html', {'form': form, 'titulo': f'Horario de {odontologo}', 'volver': 'agenda:horarios'})


@require_POST
@rol_requerido(Rol.ADMINISTRADOR)
def horario_borrar(request, pk):
    horario = get_object_or_404(HorarioAtencion, pk=pk)
    AuditoriaService.registrar(request.user, 'borrar horario', horario, f'{horario.odontologo}: {horario}')
    horario.delete()
    messages.success(request, 'Horario eliminado.')
    return redirect('agenda:horarios')


@rol_requerido(Rol.ADMINISTRADOR)
def bloqueo_nuevo(request, odontologo_pk):
    odontologo = get_object_or_404(Odontologo, pk=odontologo_pk)
    form = BloqueoForm(request.POST or None)
    if request.method == 'POST' and form.is_valid():
        bloqueo = form.save(commit=False)
        bloqueo.odontologo = odontologo
        bloqueo.save()
        AuditoriaService.registrar(request.user, 'bloquear agenda', bloqueo, f'{odontologo}: {bloqueo.motivo}')
        messages.success(request, 'Bloqueo registrado.')
        return redirect('agenda:horarios')
    return render(request, 'formulario.html', {'form': form, 'titulo': f'Bloquear agenda de {odontologo}', 'volver': 'agenda:horarios'})
