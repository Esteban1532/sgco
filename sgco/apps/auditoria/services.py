from .models import RegistroAuditoria


class AuditoriaService:
    """Única responsabilidad: dejar registro de las acciones sobre datos sensibles."""

    @staticmethod
    def registrar(usuario, accion, registro, detalle=''):
        return RegistroAuditoria.objects.create(
            usuario=usuario if getattr(usuario, 'is_authenticated', False) else None,
            accion=accion,
            modelo=registro.__class__.__name__,
            objeto_id=str(getattr(registro, 'pk', '') or ''),
            detalle=detalle[:255],
        )
