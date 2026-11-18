"""Pruebas unitarias de las clases principales del diagrama de clases (Fase 2)."""

from datetime import date, datetime, time, timedelta
from decimal import Decimal

from django.test import TestCase
from django.utils import timezone

from apps.agenda.models import BloqueoAgenda, Cita, EstadoCita, HorarioAtencion
from apps.agenda.services import AgendaService, DisponibilidadError
from apps.auditoria.models import RegistroAuditoria
from apps.cuentas.models import Rol
from apps.historia_clinica.models import HistoriaClinica
from apps.tratamientos.models import ItemTratamiento, MedioPago, PlanTratamiento
from apps.tratamientos.services import PagoError, PagoService

from .utilidades import NotificadorFalso, crear_odontologo, crear_paciente, crear_usuario, proximo_lunes


class CitaTests(TestCase):
    """Cita.se_cruza_con(), hora_fin(), cancelar() y marcar_asistencia()."""

    def setUp(self):
        self.odo = crear_odontologo()
        self.paciente = crear_paciente()
        self.fecha = proximo_lunes()

    def cita(self, hora, duracion=30, odo=None, estado=EstadoCita.PROGRAMADA):
        return Cita(paciente=self.paciente, odontologo=odo or self.odo, fecha=self.fecha, hora_inicio=hora,
                    duracion_min=duracion, motivo='x', estado=estado)

    def test_hora_fin(self):
        self.assertEqual(self.cita(time(9, 45), 30).hora_fin(), time(10, 15))

    def test_se_cruzan_si_se_solapan(self):
        self.assertTrue(self.cita(time(9), 60).se_cruza_con(self.cita(time(9, 30))))

    def test_no_se_cruzan_si_son_consecutivas(self):
        self.assertFalse(self.cita(time(9), 30).se_cruza_con(self.cita(time(9, 30))))

    def test_no_se_cruzan_con_otro_odontologo(self):
        otro = crear_odontologo('otro')
        self.assertFalse(self.cita(time(9)).se_cruza_con(self.cita(time(9), odo=otro)))

    def test_cita_cancelada_no_ocupa_la_franja(self):
        self.assertFalse(self.cita(time(9)).se_cruza_con(self.cita(time(9), estado=EstadoCita.CANCELADA)))

    def test_cancelar_exige_motivo(self):
        with self.assertRaises(ValueError):
            self.cita(time(9)).cancelar('')

    def test_marcar_asistencia(self):
        c = self.cita(time(9))
        c.marcar_asistencia(False)
        self.assertEqual(c.estado, EstadoCita.INASISTENCIA)

    def test_no_marca_asistencia_de_cancelada(self):
        with self.assertRaises(ValueError):
            self.cita(time(9), estado=EstadoCita.CANCELADA).marcar_asistencia(True)


class HorarioAtencionTests(TestCase):
    def test_contiene(self):
        h = HorarioAtencion(dia_semana=0, hora_inicio=time(8), hora_fin=time(12))
        self.assertTrue(h.contiene(time(8), time(8, 30)))
        self.assertTrue(h.contiene(time(11, 30), time(12)))
        self.assertFalse(h.contiene(time(11, 45), time(12, 15)))
        self.assertFalse(h.contiene(time(7, 30), time(8)))


class AgendaServiceTests(TestCase):
    def setUp(self):
        self.odo = crear_odontologo()
        self.paciente = crear_paciente()
        self.recepcion = crear_usuario('recep', Rol.RECEPCIONISTA)
        self.fecha = proximo_lunes()
        self.notificador = NotificadorFalso()
        self.servicio = AgendaService(notificador=self.notificador)

    def datos(self, hora, **extra):
        return {'paciente': self.paciente, 'odontologo': self.odo, 'fecha': self.fecha, 'hora_inicio': hora,
                'duracion_min': 30, 'motivo': 'Control', **extra}

    def test_disponibilidad_lunes_de_8_a_12_son_8_franjas(self):
        self.assertEqual(len(self.servicio.disponibilidad(self.odo, self.fecha)), 8)

    def test_disponibilidad_excluye_franjas_ocupadas(self):
        self.servicio.agendar(self.datos(time(9)), self.recepcion)
        franjas = self.servicio.disponibilidad(self.odo, self.fecha)
        self.assertNotIn(time(9), franjas)
        self.assertEqual(len(franjas), 7)

    def test_domingo_no_hay_franjas(self):
        domingo = self.fecha + timedelta(days=6)
        self.assertEqual(self.servicio.disponibilidad(self.odo, domingo), [])

    def test_agendar_notifica_y_audita(self):
        cita = self.servicio.agendar(self.datos(time(10)), self.recepcion)
        self.assertEqual(len(self.notificador.enviados), 1)
        self.assertTrue(RegistroAuditoria.objects.filter(accion='crear cita', objeto_id=str(cita.pk)).exists())

    def test_agendar_rechaza_bloqueo(self):
        tz = timezone.get_current_timezone()
        BloqueoAgenda.objects.create(
            odontologo=self.odo, motivo='Capacitación',
            inicio=timezone.make_aware(datetime.combine(self.fecha, time(8)), tz),
            fin=timezone.make_aware(datetime.combine(self.fecha, time(10)), tz),
        )
        with self.assertRaises(DisponibilidadError):
            self.servicio.agendar(self.datos(time(9)), self.recepcion)
        self.assertNotIn(time(9), self.servicio.disponibilidad(self.odo, self.fecha))


class PlanTratamientoTests(TestCase):
    def setUp(self):
        self.odo = crear_odontologo()
        self.recepcion = crear_usuario('recep', Rol.RECEPCIONISTA)
        self.plan = PlanTratamiento.objects.create(paciente=crear_paciente(), odontologo=self.odo, descripcion='Plan')
        ItemTratamiento.objects.create(plan=self.plan, procedimiento='Resina', valor=Decimal('150000'))
        ItemTratamiento.objects.create(plan=self.plan, procedimiento='Limpieza', valor=Decimal('80000'))

    def test_valor_total_y_saldo(self):
        self.assertEqual(self.plan.valor_total(), Decimal('230000'))
        PagoService.registrar(self.plan, Decimal('30000'), MedioPago.EFECTIVO, self.recepcion)
        self.assertEqual(self.plan.saldo(), Decimal('200000'))

    def test_no_se_paga_mas_del_saldo(self):
        with self.assertRaises(PagoError):
            PagoService.registrar(self.plan, Decimal('230001'), MedioPago.EFECTIVO, self.recepcion)

    def test_no_se_aceptan_valores_negativos(self):
        with self.assertRaises(PagoError):
            PagoService.registrar(self.plan, Decimal('-1'), MedioPago.EFECTIVO, self.recepcion)


class InmutabilidadTests(TestCase):
    def test_evolucion_no_se_borra_ni_se_modifica(self):
        odo = crear_odontologo()
        historia = HistoriaClinica.objects.create(paciente=crear_paciente())
        evolucion = historia.agregar_evolucion(odo, 'Limpieza', 'Sin novedad')
        with self.assertRaises(PermissionError):
            evolucion.delete()
        evolucion.descripcion = 'cambio'
        with self.assertRaises(PermissionError):
            evolucion.save()

    def test_auditoria_no_se_borra_ni_se_modifica(self):
        registro = RegistroAuditoria.objects.create(accion='prueba', modelo='X')
        with self.assertRaises(PermissionError):
            registro.delete()
        registro.detalle = 'cambio'
        with self.assertRaises(PermissionError):
            registro.save()


class PersonaTests(TestCase):
    def test_edad(self):
        paciente = crear_paciente(fecha_nacimiento=date(2000, 6, 15))
        self.assertEqual(paciente.edad(hoy=date(2026, 6, 14)), 25)
        self.assertEqual(paciente.edad(hoy=date(2026, 6, 15)), 26)

    def test_usuario_inactivo_no_tiene_rol(self):
        usuario = crear_usuario('x', Rol.RECEPCIONISTA)
        usuario.is_active = False
        self.assertFalse(usuario.tiene_rol(Rol.RECEPCIONISTA))
