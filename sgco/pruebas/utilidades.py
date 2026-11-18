"""Datos comunes para las pruebas."""

from datetime import date, time, timedelta

from django.utils import timezone

from apps.agenda.models import HorarioAtencion
from apps.cuentas.models import Odontologo, Rol, Usuario
from apps.pacientes.models import Paciente

CLAVE = 'ClavePrueba2026*'


def proximo_lunes():
    hoy = timezone.localdate()
    return hoy + timedelta(days=(7 - hoy.weekday()) % 7 or 7)


def lunes_anterior():
    hoy = timezone.localdate()
    return hoy - timedelta(days=hoy.weekday() or 7)


def crear_usuario(username, rol, modelo=Usuario, **extra):
    usuario = modelo(username=username, first_name=username.title(), last_name='Prueba', rol=rol,
                     documento=f'doc-{username}', **extra)
    usuario.set_password(CLAVE)
    usuario.save()
    return usuario


def crear_odontologo(username='odonto', **extra):
    odo = crear_usuario(username, Rol.ODONTOLOGO, Odontologo, registro_profesional='RO-1', **extra)
    for dia in range(0, 6):
        HorarioAtencion.objects.create(odontologo=odo, dia_semana=dia, hora_inicio=time(8), hora_fin=time(12))
    return odo


def crear_paciente(documento='111', nombres='Ana', apellidos='López', **extra):
    datos = dict(documento=documento, nombres=nombres, apellidos=apellidos, fecha_nacimiento=date(1990, 1, 1),
                 telefono='3000000000', correo='ana@ejemplo.com', autoriza_datos=True, acepta_mensajes=True)
    datos.update(extra)
    return Paciente.objects.create(**datos)


class NotificadorFalso:
    """Notificador de prueba: registra los envíos y puede simular una caída."""

    def __init__(self, funciona=True):
        self.funciona = funciona
        self.enviados = []

    def enviar(self, destinatario, mensaje):
        if self.funciona:
            self.enviados.append((destinatario, mensaje))
        return self.funciona
