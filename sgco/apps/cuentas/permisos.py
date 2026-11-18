from functools import wraps

from django.core.exceptions import PermissionDenied


def rol_requerido(*roles):
    """Permite el acceso a la vista solo a los roles indicados (RNF02)."""

    def decorador(vista):
        @wraps(vista)
        def envoltura(request, *args, **kwargs):
            if not request.user.is_authenticated or not request.user.tiene_rol(*roles):
                raise PermissionDenied
            return vista(request, *args, **kwargs)

        return envoltura

    return decorador
