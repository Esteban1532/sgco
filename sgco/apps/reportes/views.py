import csv
from datetime import date, timedelta

from django.db.models import Count, Sum
from django.http import HttpResponse
from django.shortcuts import render
from django.utils import timezone

from apps.agenda.models import Cita, EstadoCita
from apps.cuentas.models import Odontologo, Rol
from apps.cuentas.permisos import rol_requerido
from apps.tratamientos.models import Pago


def _filtros(request):
    hoy = timezone.localdate()
    try:
        desde = date.fromisoformat(request.GET.get('desde', ''))
    except ValueError:
        desde = hoy.replace(day=1)
    try:
        hasta = date.fromisoformat(request.GET.get('hasta', ''))
    except ValueError:
        hasta = hoy
    return desde, hasta, request.GET.get('odontologo', '')


def _datos(desde, hasta, odontologo):
    citas = Cita.objects.filter(fecha__range=(desde, hasta))
    pagos = Pago.objects.filter(fecha__range=(desde, hasta))
    if odontologo:
        citas = citas.filter(odontologo_id=odontologo)
        pagos = pagos.filter(plan__odontologo_id=odontologo)
    por_estado = {e.label: 0 for e in EstadoCita}
    for fila in citas.values('estado').annotate(n=Count('id')):
        por_estado[EstadoCita(fila['estado']).label] = fila['n']
    cerradas = por_estado['Atendida'] + por_estado['Inasistencia']
    porcentaje = round(100 * por_estado['Inasistencia'] / cerradas, 1) if cerradas else 0
    return {
        'total_citas': citas.count(), 'por_estado': por_estado, 'porcentaje_inasistencia': porcentaje,
        'ingresos': pagos.aggregate(t=Sum('valor'))['t'] or 0,
        'por_odontologo': citas.values('odontologo__first_name', 'odontologo__last_name').annotate(n=Count('id')).order_by('-n'),
    }


@rol_requerido(Rol.ADMINISTRADOR)
def resumen(request):
    desde, hasta, odontologo = _filtros(request)
    contexto = {'desde': desde, 'hasta': hasta, 'odontologo': odontologo,
                'odontologos': Odontologo.objects.all(), **_datos(desde, hasta, odontologo)}
    return render(request, 'reportes/resumen.html', contexto)


@rol_requerido(Rol.ADMINISTRADOR)
def citas_csv(request):
    desde, hasta, odontologo = _filtros(request)
    citas = Cita.objects.filter(fecha__range=(desde, hasta)).select_related('paciente', 'odontologo')
    if odontologo:
        citas = citas.filter(odontologo_id=odontologo)
    respuesta = HttpResponse(content_type='text/csv; charset=utf-8')
    respuesta['Content-Disposition'] = f'attachment; filename="citas_{desde}_{hasta}.csv"'
    respuesta.write('﻿')  # para que Excel reconozca las tildes
    escritor = csv.writer(respuesta, delimiter=';')
    escritor.writerow(['Fecha', 'Hora', 'Paciente', 'Odontólogo', 'Motivo', 'Estado'])
    for c in citas:
        escritor.writerow([c.fecha, f'{c.hora_inicio:%H:%M}', c.paciente, c.odontologo, c.motivo, c.get_estado_display()])
    return respuesta
