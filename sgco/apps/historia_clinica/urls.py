from django.urls import path

from . import views

app_name = 'historia'
urlpatterns = [
    path('<int:paciente_pk>/', views.ver, name='ver'),
    path('<int:paciente_pk>/editar/', views.editar, name='editar'),
    path('<int:paciente_pk>/evolucion/', views.evolucion, name='evolucion'),
]
