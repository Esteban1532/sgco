from django.contrib.auth.models import AbstractUser
from django.db import models


class Persona(models.Model):
    """Datos comunes de las personas del sistema (clase abstracta)."""

    documento = models.CharField('documento', max_length=20, unique=True)
    nombres = models.CharField('nombres', max_length=80)
    apellidos = models.CharField('apellidos', max_length=80)
    telefono = models.CharField('teléfono', max_length=20)
    correo = models.EmailField('correo', blank=True)

    class Meta:
        abstract = True

    def nombre_completo(self):
        return f'{self.nombres} {self.apellidos}'.strip()

    def __str__(self):
        return self.nombre_completo()


class Rol(models.TextChoices):
    ADMINISTRADOR = 'ADMIN', 'Administrador'
    RECEPCIONISTA = 'RECEPCION', 'Recepcionista'
    ODONTOLOGO = 'ODONTOLOGO', 'Odontólogo'


class Usuario(AbstractUser):
    """Usuario del consultorio. Reutiliza la autenticación de Django (hash de contraseñas)."""

    documento = models.CharField('documento', max_length=20, unique=True, null=True, blank=True)
    telefono = models.CharField('teléfono', max_length=20, blank=True)
    rol = models.CharField('rol', max_length=12, choices=Rol.choices, default=Rol.RECEPCIONISTA)

    def nombre_completo(self):
        return self.get_full_name() or self.username

    def tiene_rol(self, *roles):
        return self.is_active and self.rol in roles

    @property
    def es_administrador(self):
        return self.rol == Rol.ADMINISTRADOR

    @property
    def es_recepcionista(self):
        return self.rol == Rol.RECEPCIONISTA

    @property
    def es_odontologo(self):
        return self.rol == Rol.ODONTOLOGO

    def __str__(self):
        return self.nombre_completo()


class Odontologo(Usuario):
    """Usuario con rol de odontólogo y sus datos profesionales."""

    registro_profesional = models.CharField('registro profesional', max_length=30)
    especialidad = models.CharField('especialidad', max_length=60, default='General')

    class Meta:
        verbose_name = 'odontólogo'
        verbose_name_plural = 'odontólogos'

    def save(self, *args, **kwargs):
        self.rol = Rol.ODONTOLOGO
        super().save(*args, **kwargs)

    def horario_del(self, fecha):
        return self.horarios.filter(dia_semana=fecha.weekday()).order_by('hora_inicio')
