from django.urls import path

from . import views

app_name = 'agenda'
urlpatterns = [
    path('', views.dia, name='dia'),
    path('nueva/', views.nueva, name='nueva'),
    path('<int:pk>/reprogramar/', views.reprogramar, name='reprogramar'),
    path('<int:pk>/cancelar/', views.cancelar, name='cancelar'),
    path('<int:pk>/asistencia/', views.asistencia, name='asistencia'),
    path('horarios/', views.horarios, name='horarios'),
    path('horarios/<int:odontologo_pk>/nuevo/', views.horario_nuevo, name='horario_nuevo'),
    path('horarios/borrar/<int:pk>/', views.horario_borrar, name='horario_borrar'),
    path('horarios/<int:odontologo_pk>/bloqueo/', views.bloqueo_nuevo, name='bloqueo_nuevo'),
]
