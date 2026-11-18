from datetime import date

from django.db import models

from apps.cuentas.models import Persona


class Paciente(Persona):
    fecha_nacimiento = models.DateField('fecha de nacimiento')
    acepta_mensajes = models.BooleanField('acepta recordatorios por correo o WhatsApp', default=True)
    autoriza_datos = models.BooleanField('autoriza el tratamiento de datos (Ley 1581 de 2012)', default=False)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['apellidos', 'nombres']

    def edad(self, hoy=None):
        hoy = hoy or date.today()
        f = self.fecha_nacimiento
        return hoy.year - f.year - ((hoy.month, hoy.day) < (f.month, f.day))
