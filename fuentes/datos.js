// Datos del proyecto: sistema de gestión de citas e historias clínicas para un consultorio odontológico.

// Autor. El proyecto lo desarrolla una sola persona.
const I1 = 'Esteban Reinoso';
module.exports.EQUIPO = { I1 };

// [id, nombre, descripción, MoSCoW]
module.exports.RF = [
  ['RF01', 'Inicio de sesión', 'El sistema debe permitir el ingreso con usuario y contraseña y cerrar la sesión tras 15 minutos de inactividad.', 'Must'],
  ['RF02', 'Gestión de usuarios y roles', 'El administrador debe crear, editar e inactivar usuarios con rol de administrador, recepcionista u odontólogo.', 'Must'],
  ['RF03', 'Registro de pacientes', 'El sistema debe registrar pacientes con documento, nombres, fecha de nacimiento, teléfono, correo y autorización de tratamiento de datos.', 'Must'],
  ['RF04', 'Búsqueda de pacientes', 'El sistema debe buscar pacientes por documento, nombre o teléfono.', 'Must'],
  ['RF05', 'Horarios de atención', 'El administrador debe configurar los horarios de cada odontólogo y bloquear franjas (vacaciones, capacitaciones).', 'Must'],
  ['RF06', 'Agendar cita', 'La recepcionista debe agendar una cita indicando paciente, odontólogo, fecha, hora, duración y motivo.', 'Must'],
  ['RF07', 'Control de cruces', 'El sistema no debe permitir dos citas del mismo odontólogo en franjas que se crucen ni citas fuera de su horario.', 'Must'],
  ['RF08', 'Reprogramar y cancelar', 'La recepcionista debe reprogramar o cancelar una cita registrando el motivo.', 'Must'],
  ['RF09', 'Agenda diaria', 'El sistema debe mostrar la agenda del día por odontólogo con el estado de cada cita.', 'Must'],
  ['RF10', 'Recordatorios', 'El sistema debe enviar un recordatorio por correo o WhatsApp 24 horas antes de la cita a los pacientes que lo autorizaron.', 'Should'],
  ['RF11', 'Asistencia', 'La recepcionista debe marcar cada cita como atendida o inasistencia.', 'Should'],
  ['RF12', 'Solicitud de cita en línea', 'El paciente debe poder solicitar una cita en las franjas libres desde un formulario web; la recepción la confirma.', 'Should'],
  ['RF13', 'Historia clínica', 'El odontólogo debe registrar anamnesis, antecedentes, alergias y examen inicial del paciente.', 'Must'],
  ['RF14', 'Evolución de la atención', 'El odontólogo debe registrar en cada cita el procedimiento realizado y sus observaciones; el registro no se puede borrar.', 'Must'],
  ['RF15', 'Odontograma', 'El odontólogo debe marcar en un odontograma el estado de cada pieza dental.', 'Should'],
  ['RF16', 'Plan de tratamiento', 'El odontólogo debe crear un plan con los procedimientos y su valor, que el paciente aprueba.', 'Should'],
  ['RF17', 'Pagos y abonos', 'La recepcionista debe registrar pagos o abonos a un plan de tratamiento con su medio de pago.', 'Must'],
  ['RF18', 'Estado de cuenta', 'El sistema debe mostrar el valor del plan, lo pagado y el saldo de cada paciente.', 'Should'],
  ['RF19', 'Reportes', 'El administrador debe consultar reportes de citas, inasistencias e ingresos por periodo y por odontólogo.', 'Should'],
  ['RF20', 'Auditoría', 'El sistema debe registrar quién consultó o modificó una historia clínica y cuándo.', 'Must'],
  ['RF21', 'Adjuntos', 'El odontólogo debe adjuntar radiografías y consentimientos firmados a la historia clínica.', 'Could'],
  ['RF22', 'Historia en PDF', 'El sistema debe generar la historia clínica en PDF cuando el paciente la solicite.', 'Could'],
  ['RF23', 'Lista de espera', 'La recepcionista debe registrar pacientes en espera y ver quién puede tomar una cita cancelada.', 'Could'],
];

module.exports.WONT = [
  'Facturación electrónica ante la DIAN.',
  'Integración con EPS o con el RIPS del Ministerio de Salud.',
  'Aplicación móvil nativa y teleconsulta.',
  'Inventario de materiales e insumos.',
];

// [id, atributo ISO 25010, descripción, MoSCoW]
module.exports.RNF = [
  ['RNF01', 'Seguridad', 'Las contraseñas se guardan con un algoritmo de hash seguro y toda la comunicación usa HTTPS.', 'Must'],
  ['RNF02', 'Seguridad', 'Solo el odontólogo puede ver y editar la historia clínica; la recepción ve datos de contacto, citas y pagos.', 'Must'],
  ['RNF03', 'Seguridad', 'El tratamiento de datos cumple la Ley 1581 de 2012 y la historia clínica se conserva según la Resolución 1995 de 1999.', 'Must'],
  ['RNF04', 'Seguridad', 'Los registros de auditoría no se pueden modificar ni borrar desde la aplicación.', 'Must'],
  ['RNF05', 'Fiabilidad', 'El sistema debe estar disponible el 99 % del horario de atención (lunes a sábado, 7:00 a 19:00).', 'Should'],
  ['RNF06', 'Fiabilidad', 'Se hace una copia de seguridad diaria de la base de datos; ante una falla se recupera en menos de 4 horas.', 'Must'],
  ['RNF07', 'Fiabilidad', 'Si el servicio de mensajes falla, la cita se guarda igual y el mensaje se reintenta.', 'Must'],
  ['RNF08', 'Usabilidad', 'Una recepcionista capacitada agenda una cita en menos de 1 minuto y en máximo 3 pantallas.', 'Should'],
  ['RNF09', 'Usabilidad', 'Un usuario nuevo aprende las funciones de su rol en una capacitación de máximo 2 horas.', 'Should'],
  ['RNF10', 'Usabilidad', 'La interfaz se adapta a computador, tableta y celular.', 'Should'],
  ['RNF11', 'Eficiencia', 'La agenda del día carga en menos de 2 segundos con 20 usuarios conectados.', 'Should'],
  ['RNF12', 'Mantenibilidad', 'El código se organiza en módulos por funcionalidad y la lógica de negocio tiene pruebas automáticas.', 'Should'],
  ['RNF13', 'Compatibilidad', 'Funciona en las dos últimas versiones de Chrome, Edge y Firefox.', 'Could'],
  ['RNF14', 'Restricción', 'El costo de operación mensual (servidor y mensajes) no debe superar el presupuesto aprobado por el consultorio.', 'Should'],
];

// Trazabilidad RF: id -> [elemento de diseño, verificación]
module.exports.trazaRF = {
  RF01: ['Clase Usuario.verificarClave(); capa de control (sesión); HU-01', 'Prueba de ingreso válido, inválido y cierre por inactividad.'],
  RF02: ['Clase Usuario con atributo rol; módulo cuentas; HU-02; CU13', 'Prueba de permisos con un usuario de cada rol.'],
  RF03: ['Clase Paciente (hereda de Persona); módulo pacientes; HU-03; CU2', 'Criterios de aceptación de HU-03.'],
  RF04: ['Módulo pacientes (búsqueda); HU-04; CU2', 'Búsqueda por documento, nombre y teléfono.'],
  RF05: ['Composición Odontologo 1 - 1..* HorarioAtencion; HU-05', 'Una franja bloqueada no aparece como disponible.'],
  RF06: ['AgendaService.agendar(); clase Cita; HU-06; CU3; secuencia', 'Diagrama de secuencia y criterios de HU-06.'],
  RF07: ['Cita.seCruzaCon(); HorarioAtencion.contiene(); transacción con bloqueo', 'Prueba unitaria de cruces y prueba con dos usuarios a la vez.'],
  RF08: ['AgendaService.reprogramar() y cancelar(); HU-07; CU5', 'El motivo queda registrado en auditoría.'],
  RF09: ['AgendaService.disponibilidad(); vista de agenda; HU-08', 'Revisión de la agenda con datos de prueba.'],
  RF10: ['RecordatorioService con interfaz Notificador; HU-09; CU7', 'Prueba con el servicio de mensajes activo y caído.'],
  RF11: ['Cita.marcarAsistencia(); enumeración EstadoCita; HU-10; CU6', 'Cambio de estado visible en la agenda.'],
  RF12: ['Formulario público que usa AgendaService.disponibilidad(); HU-17; CU8', 'Prueba desde un celular.'],
  RF13: ['Composición Paciente 1 - 1 HistoriaClinica; HU-11; CU9', 'Solo el rol odontólogo accede (RNF02).'],
  RF14: ['HistoriaClinica.agregarEvolucion(); clase Evolucion; HU-12; CU10', 'No existe opción de borrar una evolución.'],
  RF16: ['Composición PlanTratamiento 1 - 1..* ItemTratamiento; HU-14; CU11', 'Valor total calculado con valorTotal().'],
  RF17: ['Agregación PlanTratamiento 1 - 0..* Pago; HU-15; CU12', 'Prueba de abonos parciales.'],
  RF18: ['PlanTratamiento.saldo(); HU-15', 'Saldo = valor total - pagos.'],
  RF19: ['Módulo reportes; HU-16; CU14', 'Totales comparados con los datos de prueba.'],
  RF20: ['AuditoriaService.registrar(); módulo auditoria; HU-13', 'Cada consulta de historia deja registro.'],
  RF15: ['Módulo historia_clinica (odontograma); HU-18', 'Revisión con un odontólogo.'],
};

module.exports.trazaRNF = [
  ['RNF01', 'Hash de contraseñas y HTTPS', 'Nginx con certificado TLS; hash del framework (diagrama de despliegue).', 'Lista de chequeo de seguridad.'],
  ['RNF02', 'Acceso por rol', 'Control de sesión y de rol en la capa de control; Usuario.tienePermiso().', 'Pruebas de acceso con cada rol.'],
  ['RNF03-04', 'Datos personales y auditoría', 'AuditoriaService transversal; evoluciones sin borrado.', 'Revisión de la auditoría tras cada flujo.'],
  ['RNF05-06', 'Disponibilidad y respaldo', 'Servidor en la nube; tarea programada de respaldo a almacenamiento externo.', 'Prueba de restauración de una copia.'],
  ['RNF07', 'Tolerancia a fallos de mensajería', 'Interfaz Notificador; la cita se guarda antes de notificar (secuencia).', 'Prueba con el servicio de mensajes apagado.'],
  ['RNF08-10', 'Usabilidad', 'Capa de presentación con Bootstrap; agendamiento en una pantalla con búsqueda y franjas libres.', 'Prueba con usuarios: tiempo de agendamiento.'],
  ['RNF11', 'Rendimiento', 'Consultas por odontólogo y fecha con índice; plantillas del lado del servidor.', 'Medición del tiempo de carga.'],
  ['RNF12', 'Mantenibilidad', 'Estilo en capas y módulos por funcionalidad (ADR-001); SRP y DIP.', 'Revisión de diseño y de código.'],
];

module.exports.historias = [
  ['HU-01', 'E1', 'Como usuario del consultorio, quiero iniciar sesión con usuario y contraseña, para acceder solo a las funciones de mi rol.', 'Clave incorrecta muestra un mensaje sin decir qué dato falló; la sesión se cierra a los 15 min sin uso.', 'Must', 3, 1],
  ['HU-02', 'E1', 'Como administrador, quiero crear e inactivar usuarios con su rol, para controlar quién usa el sistema.', 'Un usuario inactivo no puede ingresar.', 'Must', 3, 1],
  ['HU-03', 'E2', 'Como recepcionista, quiero registrar un paciente con sus datos y su autorización de datos, para poder asignarle citas.', 'El documento no se repite; la autorización es obligatoria.', 'Must', 3, 1],
  ['HU-04', 'E2', 'Como recepcionista, quiero buscar pacientes por documento, nombre o teléfono, para encontrarlos rápido cuando llaman.', 'Resultados en menos de 2 s.', 'Must', 2, 1],
  ['HU-05', 'E3', 'Como administrador, quiero configurar los horarios de cada odontólogo y bloquear franjas, para que solo se agende cuando hay atención.', 'Las franjas bloqueadas no aparecen libres.', 'Must', 5, 1],
  ['HU-06', 'E3', 'Como recepcionista, quiero agendar una cita viendo las franjas libres del odontólogo, para no cruzar citas.', 'No se guarda una cita cruzada ni fuera de horario; se muestra la cita en la agenda.', 'Must', 8, 1],
  ['HU-07', 'E3', 'Como recepcionista, quiero reprogramar o cancelar una cita con su motivo, para mantener la agenda al día.', 'El motivo es obligatorio y queda en auditoría.', 'Must', 3, 2],
  ['HU-08', 'E3', 'Como odontólogo, quiero ver mi agenda del día con el estado de cada cita, para organizar mi jornada.', 'Agenda ordenada por hora con estado.', 'Must', 3, 1],
  ['HU-09', 'E4', 'Como paciente, quiero recibir un recordatorio 24 horas antes, para no olvidar mi cita.', 'Solo se envía si el paciente autorizó; si falla se reintenta.', 'Should', 5, 2],
  ['HU-10', 'E3', 'Como recepcionista, quiero marcar la asistencia o inasistencia de cada cita, para medir el ausentismo.', 'Solo citas del día o anteriores.', 'Should', 2, 2],
  ['HU-11', 'E5', 'Como odontólogo, quiero registrar la anamnesis, los antecedentes y las alergias, para atender al paciente con seguridad.', 'Las alergias se muestran resaltadas al abrir la historia.', 'Must', 5, 2],
  ['HU-12', 'E5', 'Como odontólogo, quiero registrar la evolución de cada atención, para tener el historial de procedimientos.', 'La evolución no se puede borrar; se puede agregar una nota aclaratoria.', 'Must', 5, 2],
  ['HU-13', 'E1', 'Como administrador, quiero ver quién consultó o modificó cada historia clínica, para cumplir con la protección de datos.', 'Registro con usuario, acción y fecha; no editable.', 'Must', 3, 2],
  ['HU-14', 'E6', 'Como odontólogo, quiero crear un plan de tratamiento con procedimientos y valores, para presentarle el presupuesto al paciente.', 'Total calculado; estado aprobado o pendiente.', 'Should', 5, 3],
  ['HU-15', 'E6', 'Como recepcionista, quiero registrar pagos y abonos y ver el saldo, para controlar lo que debe cada paciente.', 'El saldo nunca es negativo.', 'Must', 5, 3],
  ['HU-16', 'E7', 'Como administrador, quiero reportes de citas, inasistencias e ingresos, para tomar decisiones sobre el consultorio.', 'Filtros por periodo y odontólogo; exportar a CSV.', 'Should', 5, 3],
  ['HU-17', 'E4', 'Como paciente, quiero solicitar una cita desde el celular, para no tener que llamar.', 'Solo franjas libres; queda pendiente de confirmación.', 'Should', 8, 3],
  ['HU-18', 'E5', 'Como odontólogo, quiero marcar el estado de cada pieza en un odontograma, para ver de forma gráfica la salud oral.', 'Odontograma de adulto y de niño.', 'Should', 8, 4],
  ['HU-19', 'E5', 'Como odontólogo, quiero adjuntar radiografías y consentimientos, para tener todo en la historia.', 'PDF o imagen de máximo 10 MB.', 'Could', 3, 4],
  ['HU-20', 'E5', 'Como recepcionista, quiero generar la historia clínica en PDF, para entregarla cuando el paciente la pida.', 'Solo con autorización del odontólogo.', 'Could', 3, 4],
  ['HU-21', 'E3', 'Como recepcionista, quiero una lista de espera, para ofrecer las citas canceladas.', 'Al cancelar se muestran los pacientes en espera.', 'Could', 3, 4],
  ['HT-01', 'E8', 'Como desarrollador, quiero configurar el servidor, HTTPS y las copias de respaldo diarias, para operar el sistema de forma segura.', 'Restauración de prueba exitosa.', 'Must', 5, 4],
];

module.exports.epicas = [
  ['E1', 'Seguridad y usuarios', 'RF01, RF02, RF20'],
  ['E2', 'Pacientes', 'RF03, RF04'],
  ['E3', 'Agenda y citas', 'RF05-RF09, RF11, RF23'],
  ['E4', 'Comunicación con el paciente', 'RF10, RF12'],
  ['E5', 'Historia clínica', 'RF13-RF15, RF21, RF22'],
  ['E6', 'Tratamientos y pagos', 'RF16-RF18'],
  ['E7', 'Reportes', 'RF19'],
  ['E8', 'Infraestructura', 'RNF01, RNF05, RNF06'],
];

// Sprints planeados: [historia, responsable]
module.exports.sprints = [
  {
    nombre: 'Sprint 1', fechas: '20 al 31 de octubre de 2026',
    objetivo: 'La recepción puede ingresar al sistema, registrar pacientes y agendar citas sin cruces en los horarios de cada odontólogo.',
    items: [['HU-01', I1], ['HU-02', I1], ['HU-03', I1], ['HU-04', I1], ['HU-05', I1], ['HU-06', I1], ['HU-08', I1]],
  },
  {
    nombre: 'Sprint 2', fechas: '3 al 14 de noviembre de 2026',
    objetivo: 'Se reduce el ausentismo con recordatorios y control de asistencia, y el odontólogo registra la historia clínica con auditoría.',
    items: [['HU-07', I1], ['HU-09', I1], ['HU-10', I1], ['HU-11', I1], ['HU-12', I1], ['HU-13', I1]],
  },
];

module.exports.rolesIEEE = [
  ['Analista', I1, 'Levanta y mantiene la SRS, el backlog y la matriz de trazabilidad.'],
  ['Diseñador', I1, 'Elabora la arquitectura, los diagramas UML y los ADR.'],
  ['Programador', I1, 'Implementa las historias de cada sprint.'],
  ['Probador', I1, 'Define los casos de prueba y verifica los criterios de aceptación.'],
];
// [rol de Belbin, cómo se cubre en un proyecto de una sola persona]
module.exports.rolesBelbin = [
  ['Implementador', 'Rol principal del autor: convierte las decisiones en tareas del tablero y las lleva a código.'],
  ['Finalizador', 'Rol principal del autor: revisa que cada entregable quede completo antes de cerrarlo.'],
  ['Cerebro (Plant)', 'Rol secundario: propone las soluciones de diseño y deja escritas las alternativas en los ADR.'],
  ['Monitor evaluador', 'Es el rol más débil al trabajar solo. Se compensa con la lista de chequeo de la Definition of Done, las pruebas automáticas y la revisión del docente en cada entrega.'],
];

module.exports.riesgos = [
  ['R1', 'El consultorio cambia o agrega requerimientos durante el proyecto (por ejemplo, facturación).', 'Alta', 'Medio', 'Backlog priorizado con MoSCoW; los cambios entran por el Product Owner al siguiente sprint.'],
  ['R2', 'Fuga o acceso indebido a historias clínicas.', 'Baja', 'Alto', 'Acceso por rol, HTTPS, auditoría, contraseñas con hash y datos de prueba ficticios en desarrollo.'],
  ['R3', 'El servicio de WhatsApp o correo cambia de precio o deja de responder.', 'Media', 'Medio', 'Interfaz Notificador con dos implementaciones; la cita no depende del envío.'],
  ['R4', 'Poca disponibilidad del autor, que trabaja solo, por otras materias y parciales.', 'Alta', 'Alto', 'Sprints de 2 semanas con holgura; tareas pequeñas; alcance priorizado con MoSCoW para recortar primero los Should y Could.'],
  ['R5', 'Pérdida de datos por falla del servidor.', 'Baja', 'Alto', 'Respaldo diario fuera del servidor y prueba de restauración en cada sprint desde el Sprint 4.'],
];

module.exports.comunicaciones = [
  ['Daily Scrum (individual)', 'Lunes a viernes, 10 min', 'Nota diaria en el tablero: qué hice, qué haré, qué me bloquea', 'Autor', 'Comentario en la tarjeta'],
  ['Sprint Planning', 'Inicio de cada sprint', 'Revisión del backlog con el docente (Product Owner)', 'Autor', 'Acta con historias y tareas'],
  ['Sprint Review', 'Fin de cada sprint', 'Reunión con el docente', 'Autor', 'Acta y versión del documento'],
  ['Retrospectiva', 'Fin de cada sprint', 'Reflexión escrita', 'Autor', 'Acta con acciones de mejora'],
  ['Seguimiento', 'Permanente', 'Tablero Kanban y repositorio Git', 'Autor', 'Tarjetas y commits'],
];

module.exports.calidad = [
  ['Seguridad', 'Revisión de diseño de cada pantalla con la matriz de roles: qué rol ve qué dato.', 'Ninguna vista de historia clínica es accesible para recepción o paciente.'],
  ['Seguridad', 'Lista de chequeo por historia: vista protegida, rol verificado, formulario validado, sin claves en el código.', 'El 100 % de las historias la cumple antes de cerrarse.'],
  ['Usabilidad', 'Prueba de concepto con un prototipo en papel o navegable: una persona agenda 5 citas.', 'Tiempo promedio menor a 1 minuto por cita (RNF08).'],
  ['Fiabilidad', 'Prueba de concepto de fallo de mensajería: agendar con el servicio de mensajes apagado.', 'La cita se guarda y el envío queda pendiente de reintento.'],
  ['Fiabilidad', 'Pruebas unitarias de cruces de citas y cálculo de saldo en cada cambio.', 'Todas las pruebas pasan antes de unir a la rama principal.'],
];
