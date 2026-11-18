from django.urls import include, path

from apps.auditoria import views as auditoria
from apps.cuentas import views as cuentas
from apps.reportes import views as reportes

urlpatterns = [
    path('', cuentas.inicio, name='inicio'),
    path('cuentas/', include('apps.cuentas.urls')),
    path('pacientes/', include('apps.pacientes.urls')),
    path('agenda/', include('apps.agenda.urls')),
    path('historia/', include('apps.historia_clinica.urls')),
    path('tratamientos/', include('apps.tratamientos.urls')),
    path('mensajes/', include('apps.notificaciones.urls')),
    path('auditoria/', auditoria.lista, name='auditoria'),
    path('reportes/', reportes.resumen, name='reportes'),
    path('reportes/citas.csv', reportes.citas_csv, name='reportes_csv'),
]
