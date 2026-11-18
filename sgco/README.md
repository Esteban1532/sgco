# SGCO - Sistema de Gestión del Consultorio Odontológico

Prototipo funcional del proyecto de Ingeniería de Software (Fase 3). Gestiona la agenda de citas sin cruces, la historia
clínica con control de acceso y auditoría, y los planes de tratamiento con pagos y abonos.

## Tecnologías

| Parte | Tecnología |
|---|---|
| Lenguaje y framework | Python 3.12 o superior, Django 5.2 LTS |
| Base de datos | SQLite en el prototipo; PostgreSQL en producción (variable `SGCO_DB_ENGINE=postgres`) |
| Interfaz | Plantillas de Django y Bootstrap 5.3 (incluido en `static/vendor`, no requiere internet) |
| Pruebas | Pruebas de Django (`unittest`) |

## Estructura

```
sgco/
├── config/                 configuración (settings, urls)
├── apps/
│   ├── cuentas/            usuarios, roles, inicio de sesión, permisos por rol
│   ├── pacientes/          registro y búsqueda de pacientes
│   ├── agenda/             horarios, bloqueos, citas y AgendaService
│   ├── historia_clinica/   historia clínica y evoluciones
│   ├── tratamientos/       planes, ítems, pagos y PagoService
│   ├── notificaciones/     interfaz Notificador, mensajes y recordatorios
│   ├── auditoria/          registro de auditoría y comando de respaldo
│   └── reportes/           reportes y exportación CSV
├── templates/              plantillas comunes
├── static/                 estilos y Bootstrap
├── pruebas/                pruebas unitarias, casos de prueba (CP-01 a CP-21) y medición de rendimiento
└── docs/                   capturas de pantalla y resultados de las pruebas
```

## Instalación y ejecución (Windows)

```bash
cd sgco
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py cargar_datos_demo
python manage.py runserver
```

Abrir http://127.0.0.1:8000 en el navegador.

En Linux o macOS se activa el entorno con `source .venv/bin/activate`.

### Usuarios de prueba (solo para desarrollo)

Todos usan la contraseña `Consultorio2026*`.

| Usuario | Rol |
|---|---|
| `admin` | Administrador |
| `recepcion` | Recepcionista |
| `dra.mora` | Odontóloga (general) |
| `dr.vega` | Odontólogo (ortodoncia) |
| `dr.ibarra` | Odontólogo (endodoncia) |

Los pacientes y demás datos de prueba son ficticios.

## Pruebas

```bash
python manage.py test pruebas                          # 66 pruebas unitarias y funcionales
python manage.py test pruebas.medicion_rendimiento     # medición de tiempos (RNF11)
```

Los últimos resultados están en `docs/resultados-pruebas.txt` y `docs/resultados-rendimiento.txt`.

## Tareas programadas

```bash
python manage.py enviar_recordatorios   # recordatorios de mañana y reintento de mensajes pendientes (RF10, RNF07)
python manage.py respaldar              # copia de seguridad en respaldos/ (RNF06)
```

En producción ambos comandos se programan con cron en el servidor.

## Variables de entorno

| Variable | Uso | Valor por defecto |
|---|---|---|
| `SGCO_SECRET_KEY` | clave secreta de Django | solo desarrollo |
| `SGCO_DEBUG` | `0` en producción (activa HTTPS obligatorio y cookies seguras) | `1` |
| `SGCO_ALLOWED_HOSTS` | dominios permitidos | `localhost,127.0.0.1` |
| `SGCO_DB_ENGINE` | `postgres` para usar PostgreSQL | SQLite |
| `SGCO_NOTIFICADOR` | `correo`, `whatsapp` (simulado) o `falla` (simula caída) | `correo` |
| `SGCO_EMAIL_BACKEND` | backend de correo de Django | consola |

## Limitaciones conocidas

- El envío por WhatsApp está simulado: no hay cuenta de WhatsApp Business. Los correos se muestran en la consola.
- El respaldo se guarda en una carpeta local; falta el envío cifrado a un almacenamiento externo.
- No se implementaron la solicitud de cita en línea (RF12), el odontograma (RF15), los adjuntos (RF21),
  la historia en PDF (RF22) ni la lista de espera (RF23).
