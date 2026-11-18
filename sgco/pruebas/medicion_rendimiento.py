"""Medición de rendimiento (RNF11). No corre con las pruebas normales; se ejecuta con:

    python manage.py test pruebas.medicion_rendimiento

Carga un mes de agenda (3 odontólogos, 16 citas diarias cada uno) y mide el tiempo de respuesta del servidor
para la agenda del día y para agendar una cita.
"""

import statistics
import time as reloj
from datetime import time, timedelta

from django.test import TestCase, override_settings

from apps.agenda.models import Cita, EstadoCita, HorarioAtencion
from apps.cuentas.models import Rol

from .utilidades import crear_odontologo, crear_paciente, crear_usuario, proximo_lunes

REPETICIONES = 30


@override_settings(SGCO_NOTIFICADOR='whatsapp', PASSWORD_HASHERS=['django.contrib.auth.hashers.MD5PasswordHasher'])
class MedicionRendimiento(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.recepcion = crear_usuario('recep', Rol.RECEPCIONISTA)
        cls.odontologos = [crear_odontologo(f'odo{i}') for i in range(3)]
        for odo in cls.odontologos:
            for dia in range(0, 5):
                HorarioAtencion.objects.create(odontologo=odo, dia_semana=dia, hora_inicio=time(14), hora_fin=time(18))
        pacientes = [crear_paciente(str(5000 + i), f'Paciente{i}', 'Prueba') for i in range(200)]
        inicio = proximo_lunes() - timedelta(days=28)
        horas = [time(h, m) for h in (8, 9, 10, 11, 14, 15, 16, 17) for m in (0, 30)]
        citas = []
        for d in range(35):
            fecha = inicio + timedelta(days=d)
            if fecha.weekday() >= 5:
                continue
            for o, odo in enumerate(cls.odontologos):
                for k, hora in enumerate(horas):
                    citas.append(Cita(paciente=pacientes[(d * 48 + o * 16 + k) % 200], odontologo=odo, fecha=fecha,
                                      hora_inicio=hora, motivo='Control', estado=EstadoCita.ATENDIDA))
        Cita.objects.bulk_create(citas)
        cls.total_citas = len(citas)
        cls.fecha_llena = proximo_lunes() - timedelta(days=7)
        cls.fecha_libre = proximo_lunes() + timedelta(days=7)
        cls.paciente = pacientes[0]

    def medir(self, accion):
        tiempos = []
        for i in range(REPETICIONES):
            t0 = reloj.perf_counter()
            respuesta = accion(i)
            tiempos.append((reloj.perf_counter() - t0) * 1000)
            self.assertIn(respuesta.status_code, (200, 302))
        return statistics.mean(tiempos), statistics.median(tiempos), max(tiempos)

    def test_tiempos(self):
        self.client.force_login(self.recepcion)
        agenda = self.medir(lambda i: self.client.get(f'/agenda/?fecha={self.fecha_llena}'))
        franjas = self.medir(lambda i: self.client.get('/agenda/nueva/', {
            'paciente': self.paciente.pk, 'odontologo': self.odontologos[0].pk, 'fecha': self.fecha_llena.isoformat(),
            'duracion_min': 30, 'motivo': 'Control'}))
        horas = [time(h, m) for h in (8, 9, 10, 11, 14, 15, 16, 17) for m in (0, 30)]

        def agendar(i):
            odo = self.odontologos[i % 3]
            hora = horas[i // 3]
            return self.client.post('/agenda/nueva/', {
                'paciente': self.paciente.pk, 'odontologo': odo.pk, 'fecha': self.fecha_libre.isoformat(),
                'duracion_min': 30, 'motivo': 'Control', 'hora': hora.strftime('%H:%M')})

        antes = Cita.objects.count()
        agendado = self.medir(agendar)
        self.assertEqual(Cita.objects.count() - antes, REPETICIONES)  # todas las citas quedaron guardadas
        print(f'\nDatos: {self.total_citas} citas, 200 pacientes, 3 odontólogos. {REPETICIONES} repeticiones por operación.')
        for nombre, (media, mediana, maximo) in (
            ('Cargar agenda del día (48 citas)', agenda),
            ('Ver horas libres al agendar', franjas),
            ('Guardar una cita (validación + auditoría + mensaje)', agendado),
        ):
            print(f'{nombre}: promedio {media:.1f} ms, mediana {mediana:.1f} ms, máximo {maximo:.1f} ms')
