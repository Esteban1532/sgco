from django.urls import path

from . import views

app_name = 'tratamientos'
urlpatterns = [
    path('nuevo/<int:paciente_pk>/', views.nuevo, name='nuevo'),
    path('<int:pk>/', views.detalle, name='detalle'),
    path('<int:pk>/estado/', views.cambiar_estado, name='estado'),
    path('<int:pk>/pagar/', views.pagar, name='pagar'),
]
