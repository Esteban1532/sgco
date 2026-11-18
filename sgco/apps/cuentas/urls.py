from django.contrib.auth import views as auth_views
from django.urls import path

from . import views

app_name = 'cuentas'
urlpatterns = [
    path('ingresar/', views.IngresarView.as_view(), name='login'),
    path('salir/', auth_views.LogoutView.as_view(), name='logout'),
    path('usuarios/', views.usuarios, name='usuarios'),
    path('usuarios/nuevo/', views.usuario_nuevo, name='usuario_nuevo'),
    path('usuarios/<int:pk>/editar/', views.usuario_editar, name='usuario_editar'),
    path('usuarios/<int:pk>/activar/', views.usuario_activar, name='usuario_activar'),
]
