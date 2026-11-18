from django.conf import settings
from django.shortcuts import redirect
from django.urls import reverse

RUTAS_PUBLICAS = ('/cuentas/ingresar/', '/static/')


class LoginObligatorioMiddleware:
    """Toda página exige sesión iniciada, salvo el formulario de ingreso."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if not request.user.is_authenticated and not request.path.startswith(RUTAS_PUBLICAS):
            return redirect(f"{reverse(settings.LOGIN_URL)}?next={request.path}")
        return self.get_response(request)
