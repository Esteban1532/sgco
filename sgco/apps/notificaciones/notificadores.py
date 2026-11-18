"""Interfaz Notificador y sus implementaciones (principios O, L y D de SOLID)."""

import logging
from abc import ABC, abstractmethod

from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger('sgco.notificaciones')


class Notificador(ABC):
    @abstractmethod
    def enviar(self, destinatario, mensaje):
        """Envía el mensaje al paciente. Devuelve True si se envió y False si no. No lanza excepciones."""


class CorreoNotificador(Notificador):
    def enviar(self, destinatario, mensaje):
        if not destinatario.correo:
            return False
        try:
            send_mail('Consultorio odontológico', mensaje, settings.DEFAULT_FROM_EMAIL, [destinatario.correo])
            return True
        except Exception as error:  # el servicio externo no debe detener la agenda
            logger.warning('No se pudo enviar el correo: %s', error)
            return False


class WhatsAppNotificador(Notificador):
    """Esqueleto para la API de WhatsApp Business.

    El prototipo no tiene una cuenta de WhatsApp Business, así que solo registra el mensaje en el log.
    """

    def enviar(self, destinatario, mensaje):
        if not destinatario.telefono:
            return False
        logger.info('[WhatsApp simulado] a %s: %s', destinatario.telefono, mensaje)
        return True


class FallaNotificador(Notificador):
    """Simula que el servicio de mensajería está caído (pruebas de fiabilidad)."""

    def enviar(self, destinatario, mensaje):
        return False


NOTIFICADORES = {
    'correo': CorreoNotificador,
    'whatsapp': WhatsAppNotificador,
    'falla': FallaNotificador,
}


def notificador_configurado():
    return NOTIFICADORES.get(settings.SGCO_NOTIFICADOR, CorreoNotificador)()
