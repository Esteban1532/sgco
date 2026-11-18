"""Casos de prueba funcionales: uno o más por requerimiento Must (CP-01 a CP-17) y algunos Should.

Cada prueba recorre el sistema como lo haría el usuario, a través de las páginas web.
"""

import io
import json
import tempfile
from datetime import time
from decimal import Decimal
from pathlib import Path

from django.conf import settings
from django.core.management import call_command
from django.test import TestCase, override_settings

from apps.agenda.models import Cita, EstadoCita, HorarioAtencion
from apps.agenda.services import AgendaService
from apps.auditoria.models import RegistroAuditoria
from apps.cuentas.models import Odontologo, Rol, Usuario
from apps.historia_clinica.models import Evolucion, HistoriaClinica
from apps.notificaciones.models import EstadoMensaje, Mensaje
from apps.notificaciones.services import RecordatorioService, ServicioMensajes
from apps.pacientes.models import Paciente
from apps.tratamientos.models import ItemTratamiento, PlanTratamiento

from .utilidades import (CLAVE, NotificadorFalso, crear_odontologo, crear_paciente, crear_usuario, lunes_anterior,
                         proximo_lunes)


@override_settings(SGCO_NOTIFICADOR='whatsapp')
class Base(TestCase):
    def setUp(self):
        self.admin = crear_usuario('admin', Rol.ADMINISTRADOR)
        self.recepcion = crear_usuario('recep', Rol.RECEPCIONISTA)
        self.odo = crear_odontologo('odonto')
        self.paciente = crear_paciente()
        self.fecha = proximo_lunes()

    def entrar(self, usuario):
        self.client.force_login(usuario)

    def agendar(self, hora, **extra):
        datos = {'paciente': self.paciente.pk, 'odontologo': self.odo.pk, 'fecha': self.fecha.isoformat(),
                 'duracion_min': 30, 'motivo': 'Control', 'hora': hora, **extra}
        return self.client.post('/agenda/nueva/', datos)


class CP01_InicioSesion(Base):
    """RF01: ingreso con usuario y contraseña y cierre por inactividad."""

    def test_ingreso_valido(self):
        r = self.client.post('/cuentas/ingresar/', {'username': 'recep', 'password': CLAVE})
        self.assertRedirects(r, '/')

    def test_ingreso_invalido_muestra_mensaje_generico(self):
        r = self.client.post('/cuentas/ingresar/', {'username': 'recep', 'password': 'otra'})
        self.assertContains(r, 'Usuario o contraseña incorrectos.')

    def test_usuario_inactivo_no_ingresa(self):
        self.recepcion.is_active = False
        self.recepcion.save()
        r = self.client.post('/cuentas/ingresar/', {'username': 'recep', 'password': CLAVE})
        self.assertContains(r, 'Usuario o contraseña incorrectos.')

    def test_sesion_expira_a_los_15_minutos_sin_uso(self):
        self.assertEqual(settings.SESSION_COOKIE_AGE, 900)
        self.assertTrue(settings.SESSION_SAVE_EVERY_REQUEST)
        self.entrar(self.recepcion)
        self.client.get('/')
        self.assertEqual(self.client.session.get_expiry_age(), 900)

    def test_sin_sesion_redirige_al_ingreso(self):
        self.assertRedirects(self.client.get('/pacientes/'), '/cuentas/ingresar/?next=/pacientes/')


class CP02_UsuariosYRoles(Base):
    """RF02: el administrador crea e inactiva usuarios con su rol."""

    def test_admin_crea_odontologo(self):
        self.entrar(self.admin)
        r = self.client.post('/cuentas/usuarios/nuevo/', {
            'username': 'nuevo.odo', 'first_name': 'Nuevo', 'last_name': 'Odo', 'documento': '555', 'email': '',
            'telefono': '', 'rol': Rol.ODONTOLOGO, 'registro_profesional': 'RO-9', 'especialidad': 'General',
            'password1': 'OtraClave2026*', 'password2': 'OtraClave2026*'})
        self.assertRedirects(r, '/cuentas/usuarios/')
        self.assertTrue(Odontologo.objects.filter(username='nuevo.odo', rol=Rol.ODONTOLOGO).exists())

    def test_admin_inactiva_usuario(self):
        self.entrar(self.admin)
        self.client.post(f'/cuentas/usuarios/{self.recepcion.pk}/activar/')
        self.recepcion.refresh_from_db()
        self.assertFalse(self.recepcion.is_active)

    def test_recepcion_no_gestiona_usuarios(self):
        self.entrar(self.recepcion)
        self.assertEqual(self.client.get('/cuentas/usuarios/').status_code, 403)


class CP03_RegistroPacientes(Base):
    """RF03: registro de pacientes con autorización de datos obligatoria."""

    def datos(self, **extra):
        return {'documento': '999', 'nombres': 'Luis', 'apellidos': 'Díaz', 'fecha_nacimiento': '1999-02-02',
                'telefono': '3100000000', 'correo': 'luis@ejemplo.com', 'acepta_mensajes': 'on',
                'autoriza_datos': 'on', **extra}

    def test_registra_paciente(self):
        self.entrar(self.recepcion)
        r = self.client.post('/pacientes/nuevo/', self.datos())
        paciente = Paciente.objects.get(documento='999')
        self.assertRedirects(r, f'/pacientes/{paciente.pk}/')

    def test_sin_autorizacion_no_registra(self):
        self.entrar(self.recepcion)
        datos = self.datos()
        datos.pop('autoriza_datos')
        r = self.client.post('/pacientes/nuevo/', datos)
        self.assertContains(r, 'Sin la autorización de tratamiento de datos')
        self.assertFalse(Paciente.objects.filter(documento='999').exists())

    def test_documento_no_se_repite(self):
        self.entrar(self.recepcion)
        r = self.client.post('/pacientes/nuevo/', self.datos(documento=self.paciente.documento))
        self.assertEqual(r.status_code, 200)
        self.assertEqual(Paciente.objects.filter(documento=self.paciente.documento).count(), 1)


class CP04_BusquedaPacientes(Base):
    """RF04: búsqueda por documento, nombre o teléfono."""

    def setUp(self):
        super().setUp()
        crear_paciente('222', 'Pedro', 'Suárez', telefono='3209998877')
        self.entrar(self.recepcion)

    def test_por_documento(self):
        self.assertContains(self.client.get('/pacientes/?q=222'), 'Pedro Suárez')

    def test_por_nombre(self):
        r = self.client.get('/pacientes/?q=suárez')
        self.assertContains(r, 'Pedro Suárez')
        self.assertNotContains(r, 'Ana López')

    def test_por_telefono(self):
        self.assertContains(self.client.get('/pacientes/?q=3209998877'), 'Pedro Suárez')


class CP05_Horarios(Base):
    """RF05: el administrador configura horarios y bloqueos."""

    def test_agrega_horario_de_tarde(self):
        self.entrar(self.admin)
        self.client.post(f'/agenda/horarios/{self.odo.pk}/nuevo/', {'dia_semana': 0, 'hora_inicio': '14:00', 'hora_fin': '18:00'})
        self.assertEqual(len(AgendaService().disponibilidad(self.odo, self.fecha)), 16)

    def test_franja_bloqueada_no_aparece_libre(self):
        self.entrar(self.admin)
        self.client.post(f'/agenda/horarios/{self.odo.pk}/bloqueo/', {
            'inicio': f'{self.fecha}T08:00', 'fin': f'{self.fecha}T12:00', 'motivo': 'Capacitación'})
        self.assertEqual(AgendaService().disponibilidad(self.odo, self.fecha), [])

    def test_recepcion_no_cambia_horarios(self):
        self.entrar(self.recepcion)
        self.assertEqual(self.client.get('/agenda/horarios/').status_code, 403)


class CP06_AgendarCita(Base):
    """RF06: agendar cita viendo las franjas libres."""

    def test_muestra_franjas_libres(self):
        self.entrar(self.recepcion)
        r = self.client.get('/agenda/nueva/', {'paciente': self.paciente.pk, 'odontologo': self.odo.pk,
                                               'fecha': self.fecha.isoformat(), 'duracion_min': 30, 'motivo': 'Control'})
        self.assertEqual(len(r.context['franjas']), 8)

    def test_agenda_y_queda_programada(self):
        self.entrar(self.recepcion)
        r = self.agendar('09:00')
        self.assertEqual(r.status_code, 302)
        cita = Cita.objects.get()
        self.assertEqual((cita.hora_inicio, cita.estado), (time(9), EstadoCita.PROGRAMADA))
        self.assertTrue(Mensaje.objects.filter(cita=cita, tipo='CONFIRMACION').exists())

    def test_odontologo_no_agenda(self):
        self.entrar(self.odo)
        self.assertEqual(self.agendar('09:00').status_code, 403)


class CP07_ControlCruces(Base):
    """RF07: no se permiten citas cruzadas ni fuera de horario."""

    def setUp(self):
        super().setUp()
        self.entrar(self.recepcion)
        self.agendar('09:00')

    def test_rechaza_cita_cruzada(self):
        otro = crear_paciente('333', 'Rosa', 'Peña')
        r = self.agendar('09:00', paciente=otro.pk)
        self.assertContains(r, 'se cruza con otra cita')
        self.assertEqual(Cita.objects.count(), 1)

    def test_rechaza_solapamiento_parcial(self):
        r = self.agendar('08:30', duracion_min=60)
        self.assertContains(r, 'se cruza con otra cita')

    def test_rechaza_fuera_de_horario(self):
        r = self.agendar('13:00')
        self.assertContains(r, 'fuera del horario')
        self.assertEqual(Cita.objects.count(), 1)


class CP08_ReprogramarCancelar(Base):
    """RF08: reprogramar o cancelar con motivo."""

    def setUp(self):
        super().setUp()
        self.entrar(self.recepcion)
        self.agendar('09:00')
        self.cita = Cita.objects.get()

    def test_reprograma_con_motivo(self):
        self.client.post(f'/agenda/{self.cita.pk}/reprogramar/', {'fecha': self.fecha.isoformat(), 'motivo': 'Paciente pidió cambio', 'hora': '10:00'})
        self.cita.refresh_from_db()
        self.assertEqual(self.cita.hora_inicio, time(10))
        self.assertTrue(RegistroAuditoria.objects.filter(accion='reprogramar cita').exists())

    def test_cancelar_sin_motivo_no_cancela(self):
        self.client.post(f'/agenda/{self.cita.pk}/cancelar/', {'motivo': ''})
        self.cita.refresh_from_db()
        self.assertEqual(self.cita.estado, EstadoCita.PROGRAMADA)

    def test_cancelar_con_motivo_libera_la_franja(self):
        self.client.post(f'/agenda/{self.cita.pk}/cancelar/', {'motivo': 'Viaje'})
        self.cita.refresh_from_db()
        self.assertEqual(self.cita.estado, EstadoCita.CANCELADA)
        self.assertIn(time(9), AgendaService().disponibilidad(self.odo, self.fecha))
        self.assertTrue(RegistroAuditoria.objects.filter(accion='cancelar cita', detalle='Viaje').exists())


class CP09_AgendaDiaria(Base):
    """RF09: agenda del día por odontólogo con el estado de cada cita."""

    def setUp(self):
        super().setUp()
        self.otro = crear_odontologo('otro.odo')
        self.entrar(self.recepcion)
        self.agendar('09:00')
        self.agendar('10:00', odontologo=self.otro.pk)

    def test_recepcion_ve_todos_los_odontologos(self):
        r = self.client.get(f'/agenda/?fecha={self.fecha}')
        self.assertEqual(len(r.context['columnas']), 2)
        self.assertContains(r, 'Programada')

    def test_odontologo_solo_ve_su_agenda(self):
        self.entrar(self.odo)
        r = self.client.get(f'/agenda/?fecha={self.fecha}')
        self.assertEqual([o for o, _ in r.context['columnas']], [self.odo])


class CP10_HistoriaClinica(Base):
    """RF13: el odontólogo registra anamnesis, antecedentes y alergias."""

    def test_odontologo_abre_historia(self):
        self.entrar(self.odo)
        self.client.post(f'/historia/{self.paciente.pk}/editar/', {
            'motivo_consulta': 'Dolor', 'antecedentes': 'Ninguno', 'alergias': 'Látex', 'medicamentos': '', 'examen_inicial': ''})
        historia = HistoriaClinica.objects.get(paciente=self.paciente)
        self.assertEqual(historia.alergias, 'Látex')
        self.assertContains(self.client.get(f'/historia/{self.paciente.pk}/'), 'Látex')


class CP11_Evolucion(Base):
    """RF14: evolución de cada atención, sin opción de borrado."""

    def test_registra_evolucion(self):
        HistoriaClinica.objects.create(paciente=self.paciente)
        self.entrar(self.odo)
        self.client.post(f'/historia/{self.paciente.pk}/evolucion/', {'procedimiento': 'Resina 26', 'descripcion': 'Sin complicaciones'})
        evolucion = Evolucion.objects.get()
        self.assertEqual(evolucion.odontologo.pk, self.odo.pk)
        with self.assertRaises(PermissionError):
            evolucion.delete()


class CP12_Pagos(Base):
    """RF17 y RF18: pagos y abonos con saldo."""

    def setUp(self):
        super().setUp()
        self.plan = PlanTratamiento.objects.create(paciente=self.paciente, odontologo=self.odo, descripcion='Plan')
        ItemTratamiento.objects.create(plan=self.plan, procedimiento='Resina', valor=Decimal('200000'))
        self.entrar(self.recepcion)

    def test_registra_abono_y_calcula_saldo(self):
        self.client.post(f'/tratamientos/{self.plan.pk}/pagar/', {'valor': '50000', 'medio_pago': 'EFECTIVO'})
        self.assertEqual(self.plan.saldo(), Decimal('150000'))

    def test_rechaza_pago_mayor_al_saldo(self):
        r = self.client.post(f'/tratamientos/{self.plan.pk}/pagar/', {'valor': '250000', 'medio_pago': 'EFECTIVO'}, follow=True)
        self.assertContains(r, 'supera el saldo')
        self.assertEqual(self.plan.pagos.count(), 0)


class CP13_Auditoria(Base):
    """RF20: queda registro de quién consultó o modificó la historia clínica."""

    def test_consulta_de_historia_queda_registrada(self):
        HistoriaClinica.objects.create(paciente=self.paciente)
        self.entrar(self.odo)
        self.client.get(f'/historia/{self.paciente.pk}/')
        registro = RegistroAuditoria.objects.get(accion='consultar historia')
        self.assertEqual(registro.usuario.pk, self.odo.pk)

    def test_solo_admin_ve_la_auditoria(self):
        self.entrar(self.recepcion)
        self.assertEqual(self.client.get('/auditoria/').status_code, 403)
        self.entrar(self.admin)
        self.assertEqual(self.client.get('/auditoria/').status_code, 200)


class CP14_AccesoPorRol(Base):
    """RNF02: solo el odontólogo ve la historia clínica; matriz de permisos por rol."""

    def test_matriz_de_permisos(self):
        HistoriaClinica.objects.create(paciente=self.paciente)
        rutas = {
            f'/historia/{self.paciente.pk}/': {self.odo: 200, self.recepcion: 403, self.admin: 403},
            '/cuentas/usuarios/': {self.odo: 403, self.recepcion: 403, self.admin: 200},
            '/reportes/': {self.odo: 403, self.recepcion: 403, self.admin: 200},
            '/agenda/nueva/': {self.odo: 403, self.recepcion: 200, self.admin: 200},
            '/agenda/': {self.odo: 200, self.recepcion: 200, self.admin: 200},
        }
        for ruta, esperados in rutas.items():
            for usuario, codigo in esperados.items():
                self.entrar(usuario)
                with self.subTest(ruta=ruta, rol=usuario.rol):
                    self.assertEqual(self.client.get(ruta).status_code, codigo)


class CP15_ToleranciaMensajeria(Base):
    """RNF07: si la mensajería falla, la cita se guarda y el mensaje se reintenta."""

    def test_cita_se_guarda_con_mensajeria_caida(self):
        servicio = AgendaService(notificador=NotificadorFalso(funciona=False))
        cita = servicio.agendar({'paciente': self.paciente, 'odontologo': self.odo, 'fecha': self.fecha,
                                 'hora_inicio': time(9), 'motivo': 'Control'}, self.recepcion)
        self.assertTrue(Cita.objects.filter(pk=cita.pk).exists())
        mensaje = Mensaje.objects.get(cita=cita)
        self.assertEqual(mensaje.estado, EstadoMensaje.PENDIENTE)

        enviados = ServicioMensajes(notificador=NotificadorFalso(funciona=True)).reintentar_pendientes()
        mensaje.refresh_from_db()
        self.assertEqual((enviados, mensaje.estado, mensaje.intentos), (1, EstadoMensaje.ENVIADO, 2))

    @override_settings(SGCO_NOTIFICADOR='falla')
    def test_vista_agenda_aunque_falle_la_mensajeria(self):
        self.entrar(self.recepcion)
        self.assertEqual(self.agendar('09:00').status_code, 302)
        self.assertEqual(Mensaje.objects.get().estado, EstadoMensaje.PENDIENTE)


class CP16_ContrasenasYHttps(Base):
    """RNF01: contraseñas con hash y configuración segura en producción."""

    def test_contrasena_no_se_guarda_en_texto_plano(self):
        guardada = Usuario.objects.get(username='recep').password
        self.assertNotIn(CLAVE, guardada)
        self.assertTrue(guardada.startswith('pbkdf2_sha256$'))

    def test_produccion_exige_https(self):
        import importlib

        import config.settings as modulo
        with self.settings():
            import os
            anterior = os.environ.get('SGCO_DEBUG')
            os.environ['SGCO_DEBUG'] = '0'
            try:
                prod = importlib.reload(modulo)
                self.assertTrue(prod.SECURE_SSL_REDIRECT and prod.SESSION_COOKIE_SECURE and prod.CSRF_COOKIE_SECURE)
            finally:
                if anterior is None:
                    os.environ.pop('SGCO_DEBUG')
                else:
                    os.environ['SGCO_DEBUG'] = anterior
                importlib.reload(modulo)


class CP17_Respaldo(Base):
    """RNF06: copia de seguridad de los datos."""

    def test_genera_respaldo_con_los_pacientes(self):
        with tempfile.TemporaryDirectory() as carpeta:
            call_command('respaldar', carpeta=carpeta, stdout=io.StringIO())
            archivo = next(Path(carpeta).glob('sgco-*.json'))
            datos = json.loads(archivo.read_text(encoding='utf-8'))
        self.assertTrue(any(r['model'] == 'pacientes.paciente' and r['fields']['documento'] == '111' for r in datos))


# ------------------------------------------------------------------ requerimientos Should implementados
class CP18_Recordatorios(Base):
    """RF10: recordatorio 24 h antes solo a quien lo autorizó."""

    def test_envia_recordatorio_a_quien_acepta(self):
        servicio = AgendaService(notificador=NotificadorFalso())
        no_acepta = crear_paciente('444', 'Sin', 'Mensajes', acepta_mensajes=False)
        for paciente, hora in ((self.paciente, time(9)), (no_acepta, time(10))):
            servicio.agendar({'paciente': paciente, 'odontologo': self.odo, 'fecha': self.fecha, 'hora_inicio': hora,
                              'motivo': 'Control'}, self.recepcion)
        notificador = NotificadorFalso()
        total = RecordatorioService(notificador).enviar_recordatorios_de(self.fecha)
        self.assertEqual(total, 1)
        self.assertEqual(notificador.enviados[0][0], self.paciente)
        self.assertEqual(RecordatorioService(notificador).enviar_recordatorios_de(self.fecha), 0)  # no se repite


class CP19_Asistencia(Base):
    """RF11: marcar asistencia o inasistencia."""

    def test_marca_inasistencia(self):
        pasada = lunes_anterior()
        cita = Cita.objects.create(paciente=self.paciente, odontologo=self.odo, fecha=pasada, hora_inicio=time(9), motivo='Control')
        self.entrar(self.recepcion)
        self.client.post(f'/agenda/{cita.pk}/asistencia/', {'asistio': '0'})
        cita.refresh_from_db()
        self.assertEqual(cita.estado, EstadoCita.INASISTENCIA)

    def test_no_marca_citas_futuras(self):
        cita = Cita.objects.create(paciente=self.paciente, odontologo=self.odo, fecha=self.fecha, hora_inicio=time(9), motivo='Control')
        self.entrar(self.recepcion)
        self.client.post(f'/agenda/{cita.pk}/asistencia/', {'asistio': '1'})
        cita.refresh_from_db()
        self.assertEqual(cita.estado, EstadoCita.PROGRAMADA)


class CP20_PlanTratamiento(Base):
    """RF16: el odontólogo crea un plan con procedimientos y valores."""

    def test_crea_plan_con_items(self):
        self.entrar(self.odo)
        datos = {'descripcion': 'Rehabilitación', 'items-TOTAL_FORMS': '5', 'items-INITIAL_FORMS': '0',
                 'items-MIN_NUM_FORMS': '1', 'items-MAX_NUM_FORMS': '1000',
                 'items-0-procedimiento': 'Corona', 'items-0-pieza': '11', 'items-0-valor': '900000',
                 'items-1-procedimiento': 'Resina', 'items-1-pieza': '21', 'items-1-valor': '150000'}
        self.client.post(f'/tratamientos/nuevo/{self.paciente.pk}/', datos)
        plan = PlanTratamiento.objects.get()
        self.assertEqual(plan.valor_total(), Decimal('1050000'))


class CP21_Reportes(Base):
    """RF19: reporte de citas, inasistencias e ingresos."""

    def test_porcentaje_de_inasistencia(self):
        pasada = lunes_anterior()
        for hora, estado in ((time(8), EstadoCita.ATENDIDA), (time(9), EstadoCita.INASISTENCIA),
                             (time(10), EstadoCita.ATENDIDA), (time(11), EstadoCita.ATENDIDA)):
            Cita.objects.create(paciente=self.paciente, odontologo=self.odo, fecha=pasada, hora_inicio=hora, motivo='x', estado=estado)
        self.entrar(self.admin)
        r = self.client.get('/reportes/', {'desde': pasada.isoformat(), 'hasta': pasada.isoformat()})
        self.assertEqual(r.context['porcentaje_inasistencia'], 25.0)
        csv = self.client.get('/reportes/citas.csv', {'desde': pasada.isoformat(), 'hasta': pasada.isoformat()})
        self.assertEqual(csv.content.decode('utf-8').count('\n'), 5)
