// Genera el documento final consolidado (Fase 1, Fase 2 y Fase 3).
// Uso: node generar-documento.js <ruta-node_modules> <archivo-salida>
const fs = require('fs');
const path = require('path');
const d = require(path.join(process.argv[2], 'docx'));
const F = require('./datos');
const IMG = path.join(__dirname, '..', 'imagenes');
const CAPTURAS = path.join(__dirname, '..', 'sgco', 'docs', 'capturas');
const fase3 = require('./fase3');

const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType,
  BorderStyle, ImageRun, PageBreak, LevelFormat, Footer, PageNumber, TableOfContents,
} = d;

const LETRA = 'Arial';
const ANCHO = 9360;
const borde = { style: BorderStyle.SINGLE, size: 4, color: '000000' };
const bordes = { top: borde, bottom: borde, left: borde, right: borde };

const p = (texto, opts = {}) =>
  new Paragraph({
    keepNext: !!opts.junto,
    keepLines: !!opts.junto,
    spacing: { after: 120, line: 300 },
    alignment: opts.centro ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
    children: [].concat(texto).map((t) => (typeof t === 'string' ? new TextRun({ text: t, bold: opts.negrita, size: opts.tam }) : t)),
  });
const b = (t) => new TextRun({ text: t, bold: true });
const h1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(t)] });
const h2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t)] });
const vineta = (t) => new Paragraph({ numbering: { reference: 'vinetas', level: 0 }, spacing: { after: 60 }, children: [].concat(t).map((x) => (typeof x === 'string' ? new TextRun(x) : x)) });
const salto = () => new Paragraph({ children: [new PageBreak()] });
const blanco = () => new Paragraph({ spacing: { after: 60 }, children: [] });
const leyenda = (t) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 60, after: 240 }, children: [new TextRun({ text: t, italics: true, size: 18 })] });

function tabla(encabezados, filas, anchos) {
  const celda = (texto, negrita, w) =>
    new TableCell({
      borders: bordes,
      width: { size: w, type: WidthType.DXA },
      margins: { top: 50, bottom: 50, left: 80, right: 80 },
      children: String(texto).split('\n').map((linea) => new Paragraph({ children: [new TextRun({ text: linea, bold: negrita, size: 18 })] })),
    });
  return new Table({
    width: { size: ANCHO, type: WidthType.DXA },
    columnWidths: anchos,
    rows: [
      new TableRow({ tableHeader: true, children: encabezados.map((e, i) => celda(e, true, anchos[i])) }),
      ...filas.map((f) => new TableRow({ cantSplit: true, children: f.map((v, i) => celda(v, false, anchos[i])) })),
    ],
  });
}

let fig = 0;
function figura(archivo, titulo, anchoPx = 600, altoMax = 800, carpeta = IMG) {
  const buf = fs.readFileSync(path.join(carpeta, archivo));
  const w = buf.readUInt32BE(16);
  const h = buf.readUInt32BE(20);
  let ancho = anchoPx;
  let alto = Math.round((anchoPx * h) / w);
  if (alto > altoMax) { alto = altoMax; ancho = Math.round((altoMax * w) / h); }
  return [
    new Paragraph({ alignment: AlignmentType.CENTER, keepNext: true, children: [new ImageRun({ type: 'png', data: buf, transformation: { width: ancho, height: alto } })] }),
    leyenda(`Figura ${++fig}. ${titulo}.`),
  ];
}

const { I1 } = F.EQUIPO;
const MOSCOW = { Must: 'Must', Should: 'Should', Could: 'Could' };
const hist = (id) => F.historias.find((h) => h[0] === id);
const puntosSprint = (s) => s.items.reduce((a, [id]) => a + hist(id)[5], 0);
const totalPuntos = F.historias.reduce((a, h) => a + h[5], 0);
const cuenta = (lista, m) => lista.filter((r) => r[3] === m).length;

// ------------------------------------------------------------------ Portada
const portada = [
  new Paragraph({ spacing: { before: 2000 } }),
  p('SGCO', { centro: true, negrita: true, tam: 44 }),
  p('SISTEMA DE GESTIÓN DEL CONSULTORIO ODONTOLÓGICO', { centro: true, negrita: true, tam: 28 }),
  p('Gestión de citas, historias clínicas y pagos', { centro: true, tam: 22 }),
  new Paragraph({ spacing: { before: 500 } }),
  p('Documento final consolidado del proyecto', { centro: true, tam: 24 }),
  p('Fase 1: Ingeniería de requerimientos', { centro: true }),
  p('Fase 2: Diseño de la solución y planeación del trabajo', { centro: true }),
  p('Fase 3: Implementación, verificación y cierre', { centro: true }),
  new Paragraph({ spacing: { before: 1000 } }),
  p('Autor:', { centro: true, negrita: true }),
  p(I1, { centro: true }),
  p('C.C. 1028661248', { centro: true }),
  new Paragraph({ spacing: { before: 500 } }),
  p('Docente: Fredys Alberto Simanca Herrera', { centro: true }),
  p('Ingeniería de Software', { centro: true }),
  p('Ingeniería de Sistemas - Universidad Cooperativa de Colombia', { centro: true }),
  p('Bogotá, noviembre de 2026', { centro: true }),
  salto(),
];

// ------------------------------------------------------------------ Control de versiones
const inicio = [
  new Paragraph({ children: [new TextRun({ text: 'Control de versiones', bold: true, size: 28 })] }),
  tabla(['Fecha', 'Versión', 'Cambios'], [
    ['[fecha de entrega Fase 1]', '1.0', 'Propuesta y SRS iniciales.'],
    ['[fecha de ajustes]', '1.1', 'Ajustes a la Fase 1 hechos durante el diseño:\n' +
      '- El requerimiento "gestionar citas" se dividió en RF06 (agendar), RF07 (control de cruces) y RF08 (reprogramar y cancelar), porque como estaba no se podía verificar.\n' +
      '- Los requerimientos no funcionales de usabilidad y rendimiento se cuantificaron (RNF08, RNF09 y RNF11); antes decían "fácil de usar" y "rápido".\n' +
      '- Se agregó la categoría Won\'t de MoSCoW para dejar por escrito lo que no hará esta versión.\n' +
      '- Se agregó RNF07 (tolerancia a fallos del servicio de mensajes), que salió del análisis del caso de uso Agendar cita.'],
    ['[fecha de entrega Fase 2]', '2.0', 'Diseño de la solución, planeación ágil y plan de gestión: trazabilidad, arquitectura, diagrama de clases detallado, diagramas de secuencia, componentes y despliegue, herramienta CASE, sprints, riesgos, comunicaciones, calidad y ADR.'],
    ['[fecha de ajustes]', '2.1', 'Ajustes a la Fase 2:\n' +
      '- Se adoptó el nombre SGCO (Sistema de Gestión del Consultorio Odontológico).\n' +
      '- Se corrigió la herramienta CASE: los diagramas se hicieron con Mermaid, no con StarUML (sección 17).\n' +
      '- Usuario hereda de la clase de autenticación de Django en lugar de Persona, para reutilizar el manejo seguro de contraseñas.\n' +
      '- Se agregaron al diseño BloqueoAgenda, Mensaje y ServicioMensajes, que RF05 y RNF07 necesitaban y no estaban en el diagrama.\n' +
      'El detalle y la razón de cada cambio están en la sección 22.6.'],
    ['[fecha de entrega Fase 3]', '3.0', 'Implementación, verificación, resultados y cierre: prototipo SGCO, estado por requerimiento, casos de prueba, matriz de trazabilidad completa, atributos de calidad medidos, deuda técnica, evaluación de objetivos, retrospectiva, trabajo futuro y contribución individual.'],
  ], [1900, 900, 6560]),
  blanco(),
  new Paragraph({ children: [new TextRun({ text: 'Contenido', bold: true, size: 28 })] }),
  new TableOfContents('Contenido', { hyperlink: true, headingStyleRange: '1-2' }),
  salto(),
];

// ------------------------------------------------------------------ PARTE I
const fase1 = [
  h1('PARTE I. FASE 1: INGENIERÍA DE REQUERIMIENTOS'),
  h1('1. Introducción'),
  p('La ingeniería de requerimientos es una de las fases más importantes del desarrollo de software, porque es el punto de partida para que un sistema responda a las necesidades reales de los usuarios y de la organización. Su propósito es identificar, analizar, documentar y validar de forma ordenada lo que se espera del sistema y las restricciones que guiarán su construcción.'),
  p('En esta disciplina se combinan aspectos técnicos y de comunicación. No basta con aplicar métodos para capturar y modelar los requerimientos; también hay que hablar con los interesados para entender lo que necesitan y escribirlo de forma clara y verificable. Una buena gestión de requerimientos evita ambigüedades, reduce los reprocesos y sirve de base para diseñar, construir y evaluar la solución.'),
  p('En este documento se aplica esa disciplina a un caso concreto: un consultorio odontológico que necesita organizar su agenda, sus historias clínicas y el cobro de sus tratamientos. El sistema propuesto se llama SGCO (Sistema de Gestión del Consultorio Odontológico). La Parte I contiene la especificación de requerimientos (Fase 1), la Parte II el diseño de la solución y la planeación del trabajo (Fase 2) y la Parte III la implementación del prototipo, su verificación y el cierre del proyecto (Fase 3).'),

  h1('2. Descripción de la organización'),
  p('La organización del caso de estudio es un consultorio odontológico privado de una ciudad intermedia de Colombia. Atiende de lunes a sábado con tres odontólogos (uno general, uno en ortodoncia y uno en endodoncia), una recepcionista y la administradora, que también es dueña del consultorio. Atiende en promedio 35 pacientes al día, la mayoría particulares, con tratamientos que pueden durar varios meses y se pagan por abonos.'),
  p('Hoy la agenda se lleva en un cuaderno y en una hoja de cálculo compartida, los recordatorios se hacen llamando uno por uno, las historias clínicas están en carpetas de papel y los pagos se anotan en un talonario.'),

  h1('3. Planteamiento del problema'),
  p('La forma actual de trabajo genera problemas que afectan los ingresos y la atención:'),
  vineta([b('Citas cruzadas: '), 'como la agenda está en dos lugares, a veces se asignan dos pacientes al mismo odontólogo a la misma hora.']),
  vineta([b('Inasistencias: '), 'la administradora estima que cerca de 1 de cada 5 pacientes no llega a su cita. Llamar a todos el día anterior toma más de una hora de la recepcionista y no siempre se hace.']),
  vineta([b('Historias clínicas en papel: '), 'se demoran en encontrarse, pueden perderse, no se sabe quién las consultó y no hay copia de respaldo.']),
  vineta([b('Pagos sin control: '), 'no es fácil saber cuánto debe un paciente de su tratamiento ni cuánto ingresó en el mes.']),
  p('El problema se resume así: el consultorio no tiene una herramienta que integre la agenda, la historia clínica y los pagos, lo que causa pérdida de tiempo, citas perdidas y riesgo sobre información de salud que la ley obliga a proteger.'),

  h1('4. Justificación'),
  p('Un sistema web que centralice la información permite evitar cruces de citas, enviar recordatorios automáticos para bajar las inasistencias, tener la historia clínica disponible y protegida, y conocer el estado de cuenta de cada paciente. Además, ayuda al consultorio a cumplir la Ley 1581 de 2012 sobre protección de datos personales y la Resolución 1995 de 1999 sobre el manejo de la historia clínica. Se eligió una aplicación web porque no requiere instalar nada en los equipos del consultorio y el paciente puede solicitar citas desde su celular.'),

  h1('5. Objetivos'),
  h2('5.1 Objetivo general'),
  p('Desarrollar un sistema web para el consultorio odontológico que integre la gestión de citas, la historia clínica y el control de pagos de los tratamientos, protegiendo la información de los pacientes.'),
  h2('5.2 Objetivos específicos'),
  vineta('Levantar y especificar los requerimientos del sistema con los interesados del consultorio.'),
  vineta('Diseñar una agenda que evite cruces de citas y envíe recordatorios automáticos.'),
  vineta('Diseñar el registro de la historia clínica y la evolución de cada atención con control de acceso y auditoría.'),
  vineta('Diseñar el registro de planes de tratamiento, pagos y abonos.'),
  vineta('Planear la construcción del sistema por sprints con Scrum.'),

  h1('6. Alcance'),
  p('El sistema cubrirá la gestión de usuarios, pacientes, horarios, citas, recordatorios, historia clínica, evoluciones, odontograma, planes de tratamiento, pagos, reportes y auditoría. Lo usarán la administradora, la recepcionista, los odontólogos y, para solicitar citas, los pacientes.'),
  p([b('Fuera del alcance (Won\'t en esta versión):')]),
  ...F.WONT.map((t) => vineta(t)),

  h1('7. Interesados y técnicas de elicitación'),
  h2('7.1 Interesados'),
  tabla(['Interesado', 'Rol en el proyecto', 'Interés principal'], [
    ['Administradora (dueña)', 'Product Owner del caso', 'Reducir inasistencias, controlar ingresos y cumplir la ley.'],
    ['Recepcionista', 'Usuario principal', 'Agendar rápido y sin errores; no tener que llamar a todos los pacientes.'],
    ['Odontólogos', 'Usuarios', 'Ver su agenda y tener la historia clínica a mano durante la atención.'],
    ['Pacientes', 'Usuarios externos', 'Pedir citas sin llamar y recibir recordatorios.'],
    ['Autor del proyecto', 'Desarrollo', 'Entregar un sistema que cumpla los requerimientos en el tiempo del curso.'],
  ], [2400, 2200, 4760]),
  blanco(),
  h2('7.2 Técnicas de elicitación'),
  vineta([b('Entrevista semiestructurada '), 'con la administradora y con un odontólogo, para conocer los procesos de agenda, atención y cobro.']),
  vineta([b('Observación '), 'de la recepción durante una mañana de trabajo: cómo se agenda, cómo se confirma y cómo se cobra.']),
  vineta([b('Análisis documental '), 'del formato de historia clínica en papel, la hoja de cálculo de la agenda, la Ley 1581 de 2012 y la Resolución 1995 de 1999.']),
  vineta([b('Prototipo en papel '), 'de la pantalla de agendamiento, revisado con la recepcionista.']),
  h2('7.3 Validación de requerimientos'),
  p('Los requerimientos se validaron con una revisión junto a la administradora y con una lista de chequeo de calidad: cada requerimiento debe ser claro, verificable, sin ambigüedad, factible y con prioridad. Los que no pasaron la revisión se ajustaron (ver versión 1.1 en el control de versiones).'),

  h1('8. Especificación de requerimientos de software (SRS)'),
  h2('8.1 Actores'),
  tabla(['Actor', 'Descripción'], [
    ['Administrador', 'Gestiona usuarios y horarios, consulta reportes y la auditoría.'],
    ['Recepcionista', 'Registra pacientes, agenda, reprograma y cancela citas, marca asistencia y registra pagos.'],
    ['Odontólogo', 'Consulta su agenda, registra la historia clínica, las evoluciones y los planes de tratamiento.'],
    ['Paciente', 'Solicita citas en línea y recibe recordatorios.'],
    ['Servicio de mensajería (sistema externo)', 'Envía correos y mensajes de WhatsApp.'],
  ], [3000, 6360]),
  blanco(),
  h2('8.2 Requerimientos funcionales'),
  p(`La prioridad se asignó con el método MoSCoW: Must (debe tener), Should (debería tener), Could (podría tener) y Won't (no tendrá en esta versión). Hay ${cuenta(F.RF, 'Must')} requerimientos Must, ${cuenta(F.RF, 'Should')} Should y ${cuenta(F.RF, 'Could')} Could; los Won't están en la sección 6.`),
  tabla(['ID', 'Nombre', 'Descripción', 'Prioridad'], F.RF.map((r) => [r[0], r[1], r[2], MOSCOW[r[3]]]), [800, 2000, 5560, 1000]),
  blanco(),
  h2('8.3 Requerimientos no funcionales'),
  tabla(['ID', 'Atributo', 'Descripción', 'Prioridad'], F.RNF.map((r) => [r[0], r[1], r[2], MOSCOW[r[3]]]), [900, 1600, 5860, 1000]),
  blanco(),
  h2('8.4 Descripción del caso de uso principal'),
  tabla(['Campo', 'Descripción'], [
    ['Caso de uso', 'CU3 Agendar cita'],
    ['Actor', 'Recepcionista'],
    ['Requerimientos', 'RF06, RF07, RF10, RNF07, RNF08'],
    ['Precondición', 'La recepcionista inició sesión y el paciente está registrado.'],
    ['Flujo básico', '1. La recepcionista busca al paciente.\n2. Elige el odontólogo y la fecha.\n3. El sistema muestra las franjas libres (incluye CU4 Verificar disponibilidad).\n4. La recepcionista elige la franja y escribe el motivo.\n5. El sistema guarda la cita y envía la confirmación al paciente.'],
    ['Flujo alterno', '3a. No hay franjas libres: el sistema muestra el siguiente día con disponibilidad.\n5a. Otra persona tomó la franja al mismo tiempo: el sistema avisa y vuelve al paso 3.\n5b. El servicio de mensajes no responde: la cita se guarda y el envío se reintenta.'],
    ['Postcondición', 'La cita queda en estado Programada en la agenda del odontólogo.'],
  ], [2000, 7360]),
  blanco(),

  h1('9. Atributos de calidad priorizados (ISO/IEC 25010)'),
  p('De las características del modelo ISO/IEC 25010 se priorizaron tres, porque son las que más influyen en que el sistema sirva al consultorio:'),
  tabla(['Prioridad', 'Atributo (subcaracterísticas)', 'Por qué es prioritario', 'Requerimientos'], [
    ['1', 'Seguridad (confidencialidad, integridad, responsabilidad)', 'La historia clínica es información sensible protegida por la ley; un acceso indebido tiene consecuencias legales.', 'RNF01-RNF04, RF01, RF02, RF20'],
    ['2', 'Usabilidad (facilidad de aprendizaje y de operación)', 'La recepcionista atiende teléfono y pacientes al mismo tiempo; si agendar es lento, volverá al cuaderno.', 'RNF08-RNF10'],
    ['3', 'Fiabilidad (disponibilidad, tolerancia a fallos, recuperabilidad)', 'Sin el sistema no se puede atender; una falla de un servicio externo no debe detener la agenda.', 'RNF05-RNF07'],
  ], [1000, 2400, 3860, 2100]),
  blanco(),
  p('La eficiencia de desempeño y la mantenibilidad también se especificaron (RNF11 y RNF12), pero se tratan como restricciones y no como factores que definan la arquitectura.'),

  h1('10. Modelo de ciclo de vida'),
  p('Se eligió Scrum, un modelo ágil e iterativo, por estas razones:'),
  vineta('Los requerimientos de la recepción y de los odontólogos se entienden mejor viendo funcionar el sistema, y es probable que cambien al usarlo.'),
  vineta('El consultorio necesita valor pronto: la agenda sin cruces y los recordatorios pueden usarse antes de tener la historia clínica completa.'),
  vineta('El proyecto lo desarrolla una sola persona. Scrum se adapta bien a ese caso: los sprints cortos obligan a entregar algo funcionando cada dos semanas y la revisión con el docente al final de cada sprint reemplaza la mirada de un compañero.'),
  p('Se descartó el modelo en cascada porque exige cerrar todos los requerimientos antes de diseñar, y el modelo en espiral porque el proyecto no tiene riesgos técnicos tan altos como para justificar su costo de análisis. Se trabajará con sprints de dos semanas, estimación en puntos de historia y los eventos de Scrum.'),
  tabla(['Rol Scrum', 'Responsable'], [
    ['Product Owner', 'Administradora del consultorio (en el curso la representa el docente)'],
    ['Scrum Master', I1],
    ['Equipo de desarrollo', `${I1} (único integrante)`],
  ], [2600, 6760]),
  blanco(),
  p('Como Scrum está pensado para equipos, se hicieron tres ajustes: el Daily Scrum es una nota diaria en el tablero, la retrospectiva es una reflexión escrita y la revisión de código se reemplaza por pruebas automáticas y una lista de chequeo (sección 18.4).'),

  h1('11. Roles del proyecto'),
  h2('11.1 Roles según IEEE 1074'),
  tabla(['Rol', 'Responsable', 'Responsabilidades'], F.rolesIEEE, [1700, 2600, 5060]),
  blanco(),
  h2('11.2 Roles de Belbin'),
  p(`Los roles de Belbin describen cómo aporta cada persona a un equipo. Con un solo integrante, ${I1} identificó sus roles fuertes y definió cómo cubrir el que le falta:`),
  tabla(['Rol de Belbin', 'Cómo se cubre'], F.rolesBelbin, [2400, 6960]),
  blanco(),

  h1('12. Modelos UML de la Fase 1'),
  h2('12.1 Diagrama de casos de uso'),
  p('Muestra los cuatro actores, el sistema externo de mensajería y los casos de uso. Agendar cita y Solicitar cita en línea incluyen Verificar disponibilidad; Enviar recordatorio extiende a Agendar cita.', { junto: true }),
  ...figura('f1-casos-uso.png', 'Diagrama de casos de uso', 600, 580),
  h2('12.2 Diagrama de clases del dominio'),
  p('Diagrama estructural con los conceptos principales del negocio y sus relaciones. En la Fase 2 (sección 15) se detalla con atributos tipados, métodos y servicios.', { junto: true }),
  ...figura('f1-clases-dominio.png', 'Diagrama de clases del dominio', 600, 540),
];

// ------------------------------------------------------------------ PARTE II
const filasTrazaRF = F.RF.filter((r) => r[3] !== 'Could').map((r) => [`${r[0]} (${r[3]})`, r[1], ...F.trazaRF[r[0]]]);
const filasSprint = (s) => s.items.map(([id, resp]) => [id, hist(id)[2], String(hist(id)[5]), resp]);
const [s1, s2] = F.sprints;

const fase2 = [
  h1('PARTE II. FASE 2: DISEÑO DE LA SOLUCIÓN Y PLANEACIÓN'),
  p('Esta parte extiende la Fase 1. El problema, la organización y el alcance no cambian; aquí se define cómo se construirá la solución y cómo se organiza el trabajo.'),

  h1('13. Trazabilidad con la Fase 1'),
  p('La matriz relaciona cada requerimiento Must y Should de la SRS con el elemento de diseño que lo atiende y con la forma de verificarlo. Los requerimientos Could (RF21, RF22 y RF23) están en el backlog para el Sprint 4.'),
  h2('13.1 Requerimientos funcionales'),
  tabla(['ID (Fase 1)', 'Descripción breve', 'Elemento de diseño (Fase 2)', 'Verificación'], filasTrazaRF, [1300, 1900, 3560, 2600]),
  blanco(),
  h2('13.2 Requerimientos no funcionales'),
  tabla(['ID (Fase 1)', 'Descripción breve', 'Decisión de diseño relacionada', 'Verificación'], F.trazaRNF, [1100, 2000, 3760, 2500]),
  blanco(),
  p('Todos los elementos del diseño responden a un requerimiento. La interfaz Notificador, que aparece en esta fase, atiende RF10 y RNF07.'),

  h1('14. Arquitectura de la solución'),
  h2('14.1 Estilo elegido'),
  p('Se eligió una arquitectura cliente-servidor con el servidor organizado en capas y el patrón MVC en la parte web. El cliente es el navegador (en la recepción, en los consultorios o en el celular del paciente). El servidor es una aplicación monolítica hecha con Django (Python) y organizada en cinco capas: presentación (plantillas HTML con Bootstrap), control (vistas y formularios, con el control de sesión y de rol), servicios de negocio (AgendaService, HistoriaService, PagoService y AuditoriaService), acceso a datos (modelos del ORM sobre PostgreSQL) e integraciones (la interfaz Notificador para correo y WhatsApp). Una tarea programada envía los recordatorios y hace las copias de respaldo.'),
  ...figura('f2-arquitectura.png', 'Arquitectura de la solución: componentes y conectores', 600, 300),
  p('Los conectores son: HTTPS entre el navegador y el servidor; llamadas directas entre capas, siempre de arriba hacia abajo; SQL entre el ORM y PostgreSQL; y HTTPS o SMTP entre las integraciones y el servicio de mensajería.'),
  h2('14.2 Justificación frente a los atributos de calidad'),
  vineta([b('Seguridad: '), 'todas las peticiones pasan por la capa de control, donde se verifica la sesión y el rol antes de llegar a los servicios. Así la regla "solo el odontólogo ve la historia clínica" se aplica en un solo lugar. Las páginas se generan en el servidor, por lo que no hay una API pública expuesta. AuditoriaService registra los accesos desde la capa de servicios.']),
  vineta([b('Usabilidad: '), 'el patrón MVC separa las plantillas de la lógica, lo que permite ajustar las pantallas según las pruebas con la recepcionista sin tocar las reglas de negocio. Bootstrap da una interfaz responsiva para el celular del paciente.']),
  vineta([b('Fiabilidad: '), 'el monolito tiene pocas piezas que puedan fallar y se respalda con una sola copia diaria. El servicio de mensajería está aislado detrás de la interfaz Notificador: si falla, la cita ya quedó guardada y el envío se reintenta.']),
  h2('14.3 Lo que se sacrifica'),
  vineta('Escalabilidad independiente: no se puede escalar solo la agenda; se escala toda la aplicación. Para un consultorio con 20 usuarios simultáneos no es un problema.'),
  vineta('Interactividad: las páginas generadas en el servidor son menos dinámicas que una aplicación de una sola página (SPA).'),
  vineta('Punto único de falla: todo corre en un servidor. Se compensa con el respaldo diario y un tiempo de recuperación de 4 horas (RNF06), aceptado por el consultorio.'),
  vineta('Se descartaron los microservicios y la arquitectura orientada a eventos porque su costo de operación es alto para el tamaño del sistema y para un proyecto de una sola persona.'),

  h1('15. Diseño orientado a objetos'),
  p('El diagrama de clases detalla el núcleo del sistema: personas, agenda, historia clínica, tratamientos y los servicios que coordinan el agendamiento y los mensajes. Cada clase tiene sus atributos con tipo y visibilidad, y sus métodos.'),
  ...figura('f2-clases-nucleo.png', 'Diagrama de clases detallado del núcleo del sistema', 624, 640),
  p('Relaciones usadas:'),
  vineta([b('Herencia: '), 'Paciente y Usuario heredan de la clase abstracta Persona (documento, nombres, teléfono, correo); Odontologo hereda de Usuario y agrega el registro profesional y la especialidad.']),
  vineta([b('Composición: '), 'Paciente con HistoriaClinica (1 a 1), HistoriaClinica con Evolucion (1 a 0..*), Odontologo con HorarioAtencion (1 a 1..*) y PlanTratamiento con ItemTratamiento (1 a 1..*). Las partes no existen sin el todo.']),
  vineta([b('Agregación: '), 'PlanTratamiento con Pago (1 a 0..*). El pago es un registro contable que se conserva aunque el plan se cancele.']),
  vineta([b('Asociación: '), 'Paciente y Odontologo con Cita (1 a 0..*); Evolucion con la Cita en la que se hizo (0..1) y con el Odontologo que la registra.']),
  vineta([b('Realización: '), 'CorreoNotificador y WhatsAppNotificador implementan la interfaz Notificador.']),
  h2('15.1 Bajo acoplamiento y alta cohesión'),
  vineta([b('Alta cohesión: '), 'cada clase tiene una sola razón de ser. Cita sabe si se cruza con otra cita; HorarioAtencion sabe si una franja está dentro del horario; AgendaService coordina el agendamiento; AuditoriaService solo registra.']),
  vineta([b('Bajo acoplamiento: '), 'AgendaService y RecordatorioService no conocen el proveedor de mensajes, solo la interfaz Notificador. Las vistas (capa de control) llaman a los servicios y no consultan la base de datos directamente. Los módulos dependen solo de los módulos que necesitan (ver diagrama de componentes).']),
  h2('15.2 Principios SOLID aplicados'),
  tabla(['Principio', 'Dónde se aplica', 'Beneficio'], [
    ['S: responsabilidad única', 'AgendaService (agenda), RecordatorioService (recordatorios), AuditoriaService (registro) y PagoService (pagos) están separados.', 'Un cambio en los recordatorios no afecta el agendamiento.'],
    ['O: abierto/cerrado', 'Para enviar SMS se crea una clase SmsNotificador que implemente Notificador.', 'No hay que modificar AgendaService ni RecordatorioService.'],
    ['L: sustitución de Liskov', 'Cualquier implementación de Notificador puede usarse donde se espera la interfaz; todas devuelven true o false sin lanzar errores al servicio.', 'El servicio funciona igual con correo o WhatsApp.'],
    ['D: inversión de dependencias', 'AgendaService recibe el Notificador en su constructor y depende de la abstracción, no de la clase concreta.', 'En las pruebas se usa un notificador falso.'],
  ], [2200, 4260, 2900]),
  blanco(),

  h1('16. Modelado UML ampliado'),
  p('Los diagramas de la Fase 1 (casos de uso, Figura 1, y clases del dominio, Figura 2) no se repiten. Sobre ellos se agregan tres diagramas nuevos coherentes con la arquitectura en capas.'),
  h2('16.1 Diagrama de secuencia: Agendar cita'),
  p('Es el caso de uso más crítico, porque de él dependen RF06 y RF07 y es el que más usa la recepción. El diagrama muestra el paso por las capas, la transacción que evita que dos personas tomen la misma franja y el manejo de una falla del servicio de mensajes.', { junto: true }),
  ...figura('f2-secuencia-agendar.png', 'Diagrama de secuencia del caso de uso Agendar cita', 600, 560),
  h2('16.2 Diagrama de componentes'),
  p('Muestra cómo se agrupan las clases en módulos de Django. Agenda depende de pacientes, notificaciones y auditoría; historia_clinica y tratamientos dependen de pacientes y auditoría; reportes solo lee de agenda y tratamientos. No hay dependencias circulares.', { junto: true }),
  ...figura('f2-componentes.png', 'Diagrama de componentes', 560, 480),
  h2('16.3 Diagrama de despliegue'),
  p('El sistema se instala en un servidor virtual Linux en la nube con Nginx (HTTPS), Gunicorn con la aplicación Django, PostgreSQL y la carpeta de adjuntos. Los equipos del consultorio y los celulares de los pacientes se conectan por HTTPS. Las copias de respaldo se guardan cifradas en un almacenamiento externo.', { junto: true }),
  ...figura('f2-despliegue.png', 'Diagrama de despliegue', 600, 360),

  h1('17. Herramienta CASE utilizada'),
  p('Los diagramas se elaboraron con Mermaid, una herramienta de modelado que genera los diagramas a partir de una descripción en texto. Se eligió por tres razones:'),
  vineta('Es gratuita y de código abierto, y no requiere instalar un programa de escritorio ni una licencia.'),
  vineta('Cada diagrama es un archivo de texto (carpeta fuentes/diagramas, extensión .mmd) que se guarda en el repositorio junto al código. Así se puede ver en el historial qué cambió en el diseño y cuándo, igual que con el código.'),
  vineta('Actualizar un diagrama es editar unas líneas y volver a generarlo, lo que facilita mantenerlos al día con la matriz de trazabilidad, como pide la Definition of Done.'),
  p('Soporta de forma nativa los diagramas de clases y de secuencia. Los diagramas de casos de uso, componentes y despliegue no tienen un tipo propio en Mermaid, así que se dibujaron con su diagrama de flujo usando la notación UML (actores, casos de uso como elipses, componentes y nodos). Esa es su principal limitación frente a herramientas como StarUML, Visual Paradigm o Enterprise Architect, que además generan código e ingeniería inversa; para el tamaño de este proyecto esas funciones no eran necesarias, y Enterprise Architect y Rational Rose tienen licencias costosas.'),

  h1('18. Planeación ágil'),
  h2('18.1 Product backlog'),
  p('Las historias de usuario se derivan de los requerimientos priorizados con MoSCoW en la Fase 1 y se agrupan en épicas. La estimación se hizo en puntos de historia (serie de Fibonacci: 1, 2, 3, 5, 8) por comparación entre historias: cada una se comparó con HU-04 (2 puntos), la más pequeña y mejor entendida. Como el proyecto es individual, no se usó planning poker, que necesita varios estimadores.'),
  tabla(['Épica', 'Nombre', 'Requerimientos'], F.epicas, [1000, 4500, 3860]),
  blanco(),
  tabla(['ID', 'Historia de usuario', 'Criterio de aceptación', 'MoSCoW', 'Pts.', 'Sprint'],
    F.historias.map((h) => [h[0], h[2], h[3], h[4], String(h[5]), String(h[6])]), [700, 4000, 2660, 800, 500, 700]),
  blanco(),
  p(`Total: ${totalPuntos} puntos en ${F.historias.length} historias, para cuatro sprints de dos semanas.`),
  h2(`18.2 ${s1.nombre} (${s1.fechas})`),
  p([b('Objetivo: '), s1.objetivo]),
  tabla(['Historia', 'Descripción', 'Pts.', 'Responsable'], filasSprint(s1), [900, 5760, 700, 2000]),
  blanco(),
  p(`Capacidad comprometida: ${puntosSprint(s1)} puntos.`),
  h2(`18.3 ${s2.nombre} (${s2.fechas})`),
  p([b('Objetivo: '), s2.objetivo]),
  tabla(['Historia', 'Descripción', 'Pts.', 'Responsable'], filasSprint(s2), [900, 5760, 700, 2000]),
  blanco(),
  p(`Capacidad comprometida: ${puntosSprint(s2)} puntos. Los sprints 3 (tratamientos, pagos, reportes y solicitud en línea) y 4 (odontograma, adjuntos, PDF, lista de espera e infraestructura) se planearán en la Fase 3.`),
  h2('18.4 Definición de hecho (Definition of Done)'),
  p('Una historia está terminada cuando:'),
  vineta('Cumple todos sus criterios de aceptación.'),
  vineta('El código está en la rama principal y pasó la autorrevisión con la lista de chequeo (no hay un segundo programador que revise).'),
  vineta('Tiene pruebas automáticas de su lógica de negocio y todas pasan.'),
  vineta('Pasa la lista de chequeo de seguridad (vista protegida, rol verificado, formulario validado).'),
  vineta('Los diagramas y la matriz de trazabilidad están actualizados si la historia los afecta.'),
  vineta('El Product Owner la aceptó en el Sprint Review.'),

  h1('19. Plan de gestión del proyecto'),
  h2('19.1 Gestión de riesgos'),
  tabla(['ID', 'Riesgo', 'Prob.', 'Impacto', 'Estrategia de mitigación'], F.riesgos, [600, 3200, 900, 900, 3760]),
  blanco(),
  h2('19.2 Gestión de comunicaciones'),
  tabla(['Actividad', 'Frecuencia', 'Medio', 'Responsable', 'Registro'], F.comunicaciones, [1700, 1700, 2200, 1900, 1860]),
  blanco(),
  p(`El responsable de las actas es ${I1}, como Scrum Master. Las actas, el tablero y el documento se guardan en la carpeta del proyecto y se comparten con el docente.`),
  h2('19.3 Gestión de la calidad'),
  p('Los atributos priorizados en la Fase 1 se verifican durante el diseño así:'),
  tabla(['Atributo', 'Actividad de verificación', 'Criterio de aceptación'], F.calidad, [1500, 4660, 3200]),
  blanco(),
  h2('19.4 Roles actualizados'),
  p('No hubo cambios en la asignación de roles IEEE 1074 y Belbin de la Fase 1 (sección 11). Se mantiene la misma distribución para la Fase 2.'),

  h1('20. ADR-001: Arquitectura cliente-servidor en capas con MVC'),
  tabla(['Campo', 'Contenido'], [
    ['Estado', 'Aceptado'],
    ['Contexto', 'El consultorio maneja historias clínicas protegidas por la ley (seguridad), la recepción necesita agendar rápido (usabilidad) y la agenda no puede detenerse si falla el servicio de mensajes (fiabilidad). El proyecto lo desarrolla un solo estudiante, con poco tiempo, y el consultorio tiene un presupuesto bajo para servidores.'],
    ['Decisión', 'Construir una aplicación web cliente-servidor: un monolito en Django organizado en capas (presentación, control, servicios, datos e integraciones) con el patrón MVC, PostgreSQL como base de datos, desplegado en un servidor virtual en la nube. Los servicios de mensajería se usan a través de la interfaz Notificador.'],
    ['Consecuencias', 'Se gana: un solo punto de control de acceso, desarrollo y despliegue simples, bajo costo, separación entre pantallas y reglas de negocio y continuidad cuando falla la mensajería.\nSe sacrifica: escalado independiente por módulo, la interactividad de una SPA y la tolerancia a la caída del servidor, que se compensa con respaldos diarios.'],
    ['Alternativas consideradas', 'Microservicios (costo de operación alto); SPA con API REST separada (más trabajo y una API pública más que proteger); aplicación de escritorio (no permite que el paciente pida citas).'],
  ], [2200, 7160]),
  blanco(),

  h1('21. Síntesis y siguientes pasos'),
  p('En la Fase 1 se especificaron los requerimientos del sistema de gestión de citas e historias clínicas del consultorio, con su prioridad MoSCoW, los atributos de calidad (seguridad, usabilidad y fiabilidad) y el modelo Scrum. En la Fase 2 quedó diseñada la solución: una arquitectura cliente-servidor en capas con MVC, el diagrama de clases del núcleo con herencia, composición, agregación y principios SOLID, y los diagramas de secuencia, componentes y despliegue, todos rastreados a la SRS. También quedaron planeados los sprints 1 y 2 y el plan de riesgos, comunicaciones y calidad. Para la Fase 3 queda ejecutar los sprints, construir el prototipo funcional, hacer las pruebas de concepto de usabilidad y de fallo de mensajería, y preparar la defensa.'),

  h1('Referencias'),
  vineta('Congreso de Colombia. (2012). Ley Estatutaria 1581 de 2012, por la cual se dictan disposiciones generales para la protección de datos personales.'),
  vineta('Ministerio de Salud. (1999). Resolución 1995 de 1999, por la cual se establecen normas para el manejo de la historia clínica.'),
  vineta('ISO/IEC 25010:2011. Systems and software engineering - Systems and software Quality Requirements and Evaluation (SQuaRE).'),
  vineta('IEEE Std 830-1998. Recommended Practice for Software Requirements Specifications.'),
  vineta('IEEE Std 1074-2006. Standard for Developing a Software Project Life Cycle Process.'),
  vineta('Schwaber, K. y Sutherland, J. (2020). La Guía de Scrum.'),
  vineta('Sommerville, I. (2011). Ingeniería de software (9.a ed.). Pearson.'),
  vineta('Pressman, R. y Maxim, B. (2021). Ingeniería del software: un enfoque práctico (9.a ed.). McGraw-Hill.'),
];

const parte3 = fase3({
  p, b, h1, h2, vineta, tabla, blanco, salto, EQUIPO: F.EQUIPO,
  figuraCaptura: (archivo, titulo) => figura(archivo, titulo, 560, 380, CAPTURAS),
});

const pie = new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, font: LETRA })] })] });
const pagina = { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } };

const doc = new Document({
  creator: I1,
  title: 'SGCO - Documento final consolidado',
  features: { updateFields: true },
  styles: {
    default: { document: { run: { font: LETRA, size: 22 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 28, bold: true, font: LETRA, color: '000000' }, paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 0, keepNext: true } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 24, bold: true, font: LETRA, color: '000000' }, paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1, keepNext: true } },
    ],
  },
  numbering: { config: [{ reference: 'vinetas', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }] },
  sections: [
    { properties: pagina, children: portada },
    { properties: pagina, footers: { default: pie }, children: [...inicio, ...fase1, salto(), ...fase2, salto(), ...parte3] },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(process.argv[3], buf);
  console.log('OK', process.argv[3], '| figuras:', fig, '| S1:', puntosSprint(s1), '| S2:', puntosSprint(s2), '| total:', totalPuntos);
});
