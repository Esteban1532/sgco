from django.urls import path

from . import views

app_name = 'notificaciones'
urlpatterns = [
    path('', views.lista, name='lista'),
    path('recordatorios/', views.recordatorios, name='recordatorios'),
    path('reintentar/', views.reintentar, name='reintentar'),
]
