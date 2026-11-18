"""Carga datos de prueba realistas y ficticios (ningún dato pertenece a una persona real)."""

from datetime import time, timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.agenda.models import Cita, EstadoCita, HorarioAtencion
from apps.agenda.services import AgendaService
from apps.cuentas.models import Odontologo, Rol, Usuario
from apps.historia_clinica.models import HistoriaClinica
from apps.notificaciones.notificadores import WhatsAppNotificador
from apps.pacientes.models import Paciente
from apps.tratamientos.models import EstadoPlan, ItemTratamiento, MedioPago, PlanTratamiento
from apps.tratamientos.services import PagoService

CLAVE_DEMO = 'Consultorio2026*'

PACIENTES = [
    ('1010101010', 'Laura', 'Gómez Rincón', '1990-03-14', '3001112233', 'laura.gomez@ejemplo.com'),
    ('1020202020', 'Andrés', 'Pérez Duarte', '1985-07-02', '3002223344', 'andres.perez@ejemplo.com'),
    ('1030303030', 'Valentina', 'Rojas Mejía', '2001-11-23', '3003334455', 'valentina.rojas@ejemplo.com'),
    ('1040404040', 'Carlos', 'Martínez Ruiz', '1972-01-30', '3004445566', ''),
    ('1050505050', 'Sofía', 'Herrera Castro', '2012-05-09', '3005556677', 'familia.herrera@ejemplo.com'),
    ('1060606060', 'Jorge', 'Ramírez Ortiz', '1968-09-17', '3006667788', 'jorge.ramirez@ejemplo.com'),
    ('1070707070', 'Daniela', 'Torres Vargas', '1995-12-01', '3007778899', 'daniela.torres@ejemplo.com'),
    ('1080808080', 'Miguel', 'Castillo León', '1988-04-21', '3008889900', 'miguel.castillo@ejemplo.com'),
]


class Command(BaseCommand):
    help = 'Carga usuarios, horarios, pacientes, citas, historias y pagos de prueba.'

    @transaction.atomic
    def handle(self, *args, **options):
        if Usuario.objects.exists():
            self.stdout.write('La base de datos ya tiene datos; no se cargó nada.')
            return

        admin = self._usuario(Usuario, 'admin', 'Marta', 'Salazar', Rol.ADMINISTRADOR, '900100100')
        recepcion = self._usuario(Usuario, 'recepcion', 'Paola', 'Quintero', Rol.RECEPCIONISTA, '900200200')
        odo1 = self._usuario(Odontologo, 'dra.mora', 'Catalina', 'Mora', Rol.ODONTOLOGO, '900300300',
                             registro_profesional='RO-55821', especialidad='General')
        odo2 = self._usuario(Odontologo, 'dr.vega', 'Felipe', 'Vega', Rol.ODONTOLOGO, '900400400',
                             registro_profesional='RO-61477', especialidad='Ortodoncia')
        self._usuario(Odontologo, 'dr.ibarra', 'Tomás', 'Ibarra', Rol.ODONTOLOGO, '900500500',
                      registro_profesional='RO-70310', especialidad='Endodoncia')

        for odo in Odontologo.objects.all():
            for dia in range(0, 6):  # lunes a sábado
                HorarioAtencion.objects.create(odontologo=odo, dia_semana=dia, hora_inicio=time(8), hora_fin=time(12))
                if dia < 5:
                    HorarioAtencion.objects.create(odontologo=odo, dia_semana=dia, hora_inicio=time(14), hora_fin=time(18))

        pacientes = [
            Paciente.objects.create(documento=d, nombres=n, apellidos=a, fecha_nacimiento=f, telefono=t, correo=c,
                                    autoriza_datos=True, acepta_mensajes=True)
            for d, n, a, f, t, c in PACIENTES
        ]

        # Citas de la semana pasada, hoy y mañana. Se agendan con el servicio para aplicar las mismas reglas.
        agenda = AgendaService(notificador=WhatsAppNotificador())
        hoy = timezone.localdate()
        dia_habil = lambda f: f if f.weekday() < 6 else f + timedelta(days=1)
        hace_una_semana, manana = dia_habil(hoy - timedelta(days=7)), dia_habil(hoy + timedelta(days=1))
        plan_citas = [
            (pacientes[0], odo1, hace_una_semana, time(8), 'Valoración inicial', EstadoCita.ATENDIDA),
            (pacientes[1], odo1, hace_una_semana, time(9), 'Limpieza', EstadoCita.INASISTENCIA),
            (pacientes[2], odo2, hace_una_semana, time(10), 'Control de ortodoncia', EstadoCita.ATENDIDA),
            (pacientes[3], odo1, dia_habil(hoy), time(8), 'Resina', None),
            (pacientes[4], odo1, dia_habil(hoy), time(9), 'Control', None),
            (pacientes[5], odo2, dia_habil(hoy), time(10), 'Ajuste de brackets', None),
            (pacientes[6], odo2, dia_habil(hoy), time(11), 'Valoración ortodoncia', None),
            (pacientes[0], odo1, manana, time(8, 30), 'Resina pieza 26', None),
            (pacientes[7], odo1, manana, time(9, 30), 'Valoración inicial', None),
        ]
        for paciente, odo, fecha, hora, motivo, estado in plan_citas:
            cita = agenda.agendar({'paciente': paciente, 'odontologo': odo, 'fecha': fecha, 'hora_inicio': hora,
                                   'duracion_min': 30, 'motivo': motivo}, recepcion)
            if estado:
                Cita.objects.filter(pk=cita.pk).update(estado=estado)

        historia = HistoriaClinica.objects.create(
            paciente=pacientes[0], motivo_consulta='Sensibilidad al frío en molar superior izquierdo.',
            antecedentes='Sin antecedentes médicos relevantes. Última limpieza hace dos años.',
            alergias='Penicilina', medicamentos='Ninguno',
            examen_inicial='Caries oclusal en pieza 26. Encías sanas.',
        )
        cita_atendida = Cita.objects.filter(paciente=pacientes[0], estado=EstadoCita.ATENDIDA).first()
        historia.agregar_evolucion(odo1, 'Valoración y radiografía', 'Se confirma caries en 26. Se propone resina.', cita_atendida)
        HistoriaClinica.objects.create(paciente=pacientes[2], motivo_consulta='Tratamiento de ortodoncia en curso.',
                                       alergias='', antecedentes='Usa brackets desde 2025.')

        plan = PlanTratamiento.objects.create(paciente=pacientes[0], odontologo=odo1, descripcion='Rehabilitación pieza 26',
                                              estado=EstadoPlan.APROBADO)
        ItemTratamiento.objects.create(plan=plan, procedimiento='Resina compuesta', pieza='26', valor=Decimal('180000'))
        ItemTratamiento.objects.create(plan=plan, procedimiento='Profilaxis', pieza='', valor=Decimal('90000'))
        PagoService.registrar(plan, Decimal('100000'), MedioPago.EFECTIVO, recepcion)

        plan2 = PlanTratamiento.objects.create(paciente=pacientes[2], odontologo=odo2, descripcion='Ortodoncia (12 controles)',
                                               estado=EstadoPlan.APROBADO)
        ItemTratamiento.objects.create(plan=plan2, procedimiento='Controles de ortodoncia', pieza='', valor=Decimal('1800000'))
        PagoService.registrar(plan2, Decimal('600000'), MedioPago.TRANSFERENCIA, recepcion)

        self.stdout.write(self.style.SUCCESS(
            f'Datos de prueba cargados. Usuarios: admin, recepcion, dra.mora, dr.vega, dr.ibarra. Contraseña: {CLAVE_DEMO}'
        ))

    @staticmethod
    def _usuario(modelo, username, nombres, apellidos, rol, documento, **extra):
        usuario = modelo(username=username, first_name=nombres, last_name=apellidos, rol=rol, documento=documento,
                         email=f'{username}@consultorio.local', **extra)
        usuario.set_password(CLAVE_DEMO)
        usuario.save()
        return usuario
