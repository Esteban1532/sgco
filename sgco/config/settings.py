"""Configuración de SGCO (Sistema de Gestión del Consultorio Odontológico)."""

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# Las claves y la configuración sensible se leen de variables de entorno (RNF01).
SECRET_KEY = os.environ.get('SGCO_SECRET_KEY', 'solo-para-desarrollo-cambiar-en-produccion')
DEBUG = os.environ.get('SGCO_DEBUG', '1') == '1'
ALLOWED_HOSTS = os.environ.get('SGCO_ALLOWED_HOSTS', 'localhost,127.0.0.1,testserver').split(',')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.humanize',
    'apps.cuentas',
    'apps.pacientes',
    'apps.agenda',
    'apps.historia_clinica',
    'apps.tratamientos',
    'apps.notificaciones',
    'apps.auditoria',
    'apps.reportes',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'apps.cuentas.middleware.LoginObligatorioMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# Base de datos: SQLite para el prototipo; PostgreSQL en producción (diagrama de despliegue).
if os.environ.get('SGCO_DB_ENGINE') == 'postgres':
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ.get('SGCO_DB_NAME', 'sgco'),
            'USER': os.environ.get('SGCO_DB_USER', 'sgco'),
            'PASSWORD': os.environ.get('SGCO_DB_PASSWORD', ''),
            'HOST': os.environ.get('SGCO_DB_HOST', 'localhost'),
            'PORT': os.environ.get('SGCO_DB_PORT', '5432'),
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

AUTH_USER_MODEL = 'cuentas.Usuario'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 8}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# RF01: la sesión se cierra tras 15 minutos sin actividad.
SESSION_COOKIE_AGE = 15 * 60
SESSION_SAVE_EVERY_REQUEST = True
SESSION_EXPIRE_AT_BROWSER_CLOSE = True
SESSION_COOKIE_HTTPONLY = True

# RNF01: en producción todo viaja por HTTPS.
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000

LOGIN_URL = 'cuentas:login'
LOGIN_REDIRECT_URL = 'inicio'
LOGOUT_REDIRECT_URL = 'cuentas:login'

LANGUAGE_CODE = 'es-co'
TIME_ZONE = 'America/Bogota'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATICFILES_DIRS = [BASE_DIR / 'static']
STATIC_ROOT = BASE_DIR / 'staticfiles'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Mensajería (RF10). En desarrollo los correos se muestran en la consola.
EMAIL_BACKEND = os.environ.get('SGCO_EMAIL_BACKEND', 'django.core.mail.backends.console.EmailBackend')
DEFAULT_FROM_EMAIL = 'SGCO <no-responder@sgco.local>'
SGCO_NOTIFICADOR = os.environ.get('SGCO_NOTIFICADOR', 'correo')  # correo | whatsapp | falla

# Agenda: duración de cada franja que se ofrece al agendar.
SGCO_MINUTOS_FRANJA = 30
