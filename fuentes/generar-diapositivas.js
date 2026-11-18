// Genera las diapositivas de sustentación (Fase 1 y Fase 2).
// Uso: node generar-diapositivas.js <ruta-node_modules> <archivo-salida>
const path = require('path');
const fs = require('fs');
const PptxGenJS = require(path.join(process.argv[2], 'pptxgenjs'));
const F = require('./datos');
const IMG = path.join(__dirname, '..', 'imagenes');

const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_WIDE';
const LETRA = 'Arial';
const { I1 } = F.EQUIPO;
const hist = (id) => F.historias.find((h) => h[0] === id);
let n = 0;

function nueva(titulo) {
  const s = pptx.addSlide();
  s.background = { color: 'FFFFFF' };
  n += 1;
  if (titulo) s.addText(titulo, { x: 0.5, y: 0.3, w: 12.3, h: 0.7, fontFace: LETRA, fontSize: 26, bold: true, color: '000000' });
  s.addText(String(n), { x: 12.3, y: 7.0, w: 0.6, h: 0.3, fontFace: LETRA, fontSize: 10, color: '666666', align: 'right' });
  return s;
}
function puntos(s, items, o = {}) {
  s.addText(items.map((t) => ({ text: t, options: { bullet: true, breakLine: true } })), {
    x: o.x ?? 0.6, y: o.y ?? 1.2, w: o.w ?? 12.1, h: o.h ?? 5.6, fontFace: LETRA, fontSize: o.tam ?? 18, color: '000000', valign: 'top', paraSpaceAfter: 8,
  });
}
function tabla(s, enc, filas, o = {}) {
  const c = (t, neg) => ({ text: String(t), options: { bold: neg, fontFace: LETRA, fontSize: o.tam ?? 13, color: '000000' } });
  s.addTable([enc.map((e) => c(e, true)), ...filas.map((f) => f.map((v) => c(v, false)))], {
    x: o.x ?? 0.6, y: o.y ?? 1.2, w: o.w ?? 12.1, colW: o.colW, border: { type: 'solid', pt: 0.75, color: '000000' }, margin: 0.05,
  });
}
function imagen(s, archivo, caja) {
  const buf = fs.readFileSync(path.join(IMG, archivo));
  const w = buf.readUInt32BE(16);
  const h = buf.readUInt32BE(20);
  let ancho = caja.w;
  let alto = (caja.w * h) / w;
  if (alto > caja.h) { alto = caja.h; ancho = (caja.h * w) / h; }
  s.addImage({ path: path.join(IMG, archivo), x: caja.x + (caja.w - ancho) / 2, y: caja.y, w: ancho, h: alto });
}

let s = nueva();
s.addText('Sistema de gestión de citas e historias clínicas para un consultorio odontológico', { x: 0.8, y: 1.9, w: 11.7, h: 1.3, fontFace: LETRA, fontSize: 32, bold: true, color: '000000', align: 'center' });
s.addText('Fase 1: Ingeniería de requerimientos · Fase 2: Diseño y planeación', { x: 0.8, y: 3.3, w: 11.7, h: 0.6, fontFace: LETRA, fontSize: 20, color: '000000', align: 'center' });
s.addText(`${I1}\nIngeniería de Software - Fredys Alberto Simanca Herrera\nUniversidad Cooperativa de Colombia - Octubre de 2026`, { x: 0.8, y: 4.6, w: 11.7, h: 1.0, fontFace: LETRA, fontSize: 16, color: '000000', align: 'center' });

s = nueva('La organización y el problema');
puntos(s, [
  'Consultorio odontológico privado: 3 odontólogos, 1 recepcionista y la administradora; unos 35 pacientes al día.',
  'Agenda en cuaderno y hoja de cálculo: citas cruzadas.',
  'Cerca de 1 de cada 5 pacientes no llega a su cita; los recordatorios se hacen llamando uno por uno.',
  'Historias clínicas en papel: difíciles de encontrar, sin respaldo y sin saber quién las consultó.',
  'Pagos y abonos en un talonario: no se conoce el saldo de cada paciente.',
]);

s = nueva('Objetivo y alcance');
puntos(s, [
  'Objetivo: sistema web que integre citas, historia clínica y pagos, protegiendo la información de los pacientes.',
  'Incluye: usuarios, pacientes, horarios, citas, recordatorios, historia clínica, odontograma, tratamientos, pagos, reportes y auditoría.',
  'No incluye (Won\'t): facturación electrónica DIAN, integración con EPS/RIPS, app móvil nativa, inventario.',
  'Elicitación: entrevistas, observación de la recepción, análisis documental y prototipo en papel.',
]);

s = nueva('Requerimientos priorizados con MoSCoW');
const c = (l, m) => l.filter((r) => r[3] === m).length;
tabla(s, ['Tipo', 'Must', 'Should', 'Could', 'Total'], [
  ['Funcionales', c(F.RF, 'Must'), c(F.RF, 'Should'), c(F.RF, 'Could'), F.RF.length],
  ['No funcionales', c(F.RNF, 'Must'), c(F.RNF, 'Should'), c(F.RNF, 'Could'), F.RNF.length],
].map((f) => f.map(String)), { colW: [3.3, 2.2, 2.2, 2.2, 2.2], tam: 16 });
puntos(s, [
  'Must: inicio de sesión, pacientes, horarios, agendar sin cruces, historia clínica, evoluciones, pagos y auditoría.',
  'Should: recordatorios, asistencia, citas en línea, odontograma, planes de tratamiento y reportes.',
  'Could: adjuntos, historia en PDF y lista de espera.',
], { y: 2.7, h: 3.8, tam: 16 });

s = nueva('Atributos de calidad (ISO/IEC 25010), ciclo de vida y roles');
tabla(s, ['Prioridad', 'Atributo', 'Razón'], [
  ['1', 'Seguridad', 'Historias clínicas protegidas por la ley.'],
  ['2', 'Usabilidad', 'La recepción debe agendar en menos de 1 minuto.'],
  ['3', 'Fiabilidad', 'La agenda no se detiene si falla la mensajería.'],
], { colW: [1.4, 2.6, 8.1], tam: 15 });
puntos(s, [
  'Ciclo de vida: Scrum, sprints de 2 semanas (requerimientos que cambian y entrega temprana de valor).',
  `IEEE 1074: ${I1} es analista, diseñador, programador y probador (proyecto individual).`,
  'Belbin: implementador y finalizador; el monitor evaluador lo cubren las pruebas y el docente.',
], { y: 3.3, h: 3.4, tam: 16 });

s = nueva('Fase 1: diagrama de casos de uso');
imagen(s, 'f1-casos-uso.png', { x: 0.5, y: 1.1, w: 12.3, h: 5.9 });

s = nueva('Fase 2: trazabilidad (extracto)');
tabla(s, ['Requerimiento', 'Elemento de diseño', 'Verificación'], [
  ['RF06 Agendar cita', 'AgendaService.agendar()', 'Diagrama de secuencia'],
  ['RF07 Control de cruces', 'Cita.seCruzaCon(); transacción con bloqueo', 'Prueba unitaria y concurrente'],
  ['RF10 Recordatorios', 'RecordatorioService + interfaz Notificador', 'Prueba con mensajería caída'],
  ['RF13 Historia clínica', 'Paciente 1 - 1 HistoriaClinica', 'Acceso solo del odontólogo'],
  ['RF20 Auditoría', 'AuditoriaService.registrar()', 'Revisión de registros'],
  ['RNF02 Acceso por rol', 'Control de sesión y rol en la capa de control', 'Pruebas con cada rol'],
], { colW: [3.4, 5.2, 3.5], tam: 14 });

s = nueva('Arquitectura: cliente-servidor en capas con MVC');
imagen(s, 'f2-arquitectura.png', { x: 0.5, y: 1.4, w: 12.3, h: 3.6 });
puntos(s, [
  'Seguridad: un solo punto de control de acceso. Usabilidad: plantillas separadas de la lógica. Fiabilidad: pocas piezas y mensajería aislada.',
  'Se sacrifica: escalado por módulo, interactividad de una SPA y un solo servidor (compensado con respaldos).',
], { y: 5.3, h: 1.6, tam: 15 });

s = nueva('Diseño orientado a objetos');
imagen(s, 'f2-clases-nucleo.png', { x: 0.3, y: 1.1, w: 7.4, h: 6.0 });
puntos(s, [
  'Herencia: Persona → Paciente, Usuario → Odontologo.',
  'Composición: HistoriaClinica, Evolucion, HorarioAtencion, ItemTratamiento.',
  'Agregación: PlanTratamiento - Pago.',
  'SOLID: S (servicios separados), O y D (interfaz Notificador), L (notificadores intercambiables).',
], { x: 7.9, y: 1.3, w: 5.0, h: 5.5, tam: 15 });

s = nueva('Diagrama de secuencia: Agendar cita');
imagen(s, 'f2-secuencia-agendar.png', { x: 0.5, y: 1.1, w: 12.3, h: 5.9 });

s = nueva('Diagramas de componentes y de despliegue');
imagen(s, 'f2-componentes.png', { x: 0.3, y: 1.2, w: 5.6, h: 5.7 });
imagen(s, 'f2-despliegue.png', { x: 6.1, y: 1.8, w: 6.9, h: 5.0 });

s = nueva('Herramienta CASE: Mermaid');
puntos(s, [
  'Gratuita y de código abierto; genera los diagramas a partir de texto.',
  'Los diagramas (.mmd) se guardan en el repositorio junto al código y se actualizan fácil.',
  'Limitación: casos de uso, componentes y despliegue se dibujan como diagramas de flujo con notación UML.',
  'StarUML, Visual Paradigm y Enterprise Architect generan código, pero no hacía falta; Rational Rose y Enterprise Architect tienen licencias costosas.',
]);

s = nueva('Planeación ágil');
puntos(s, [
  `Product backlog: ${F.historias.length} historias, ${F.historias.reduce((a, h) => a + h[5], 0)} puntos, 8 épicas, estimadas por comparación con una historia de referencia.`,
  'Formato: Como [rol], quiero [funcionalidad], para [beneficio].',
], { h: 1.3 });
tabla(s, ['Sprint', 'Fechas', 'Objetivo', 'Historias', 'Pts.'], F.sprints.map((sp) => [sp.nombre, sp.fechas, sp.objetivo, sp.items.map((i) => i[0]).join(', '), String(sp.items.reduce((a, [id]) => a + hist(id)[5], 0))]), { y: 2.6, colW: [1.2, 2.1, 5.3, 2.8, 0.7], tam: 14 });

s = nueva('Definición de hecho (Definition of Done)');
puntos(s, [
  'Cumple todos sus criterios de aceptación.',
  'Código autorrevisado con lista de chequeo y en la rama principal.',
  'Pruebas automáticas de la lógica de negocio pasando.',
  'Pasa la lista de chequeo de seguridad.',
  'Diagramas y trazabilidad actualizados.',
  'Aceptada por el Product Owner en el Sprint Review.',
]);

s = nueva('Gestión de riesgos');
tabla(s, ['Riesgo', 'Prob.', 'Impacto', 'Mitigación'], F.riesgos.map((r) => [r[1], r[2], r[3], r[4]]), { colW: [4.6, 1.0, 1.1, 5.4], tam: 13 });

s = nueva('Comunicaciones, calidad y roles');
puntos(s, [
  'Daily individual (nota diaria); Planning, Review y Retrospectiva por sprint.',
  `Actas a cargo del Scrum Master (${I1}); tablero Kanban y repositorio Git.`,
  'Seguridad: revisión de la matriz de roles y lista de chequeo por historia.',
  'Usabilidad: prueba con prototipo, agendar 5 citas en menos de 1 minuto cada una.',
  'Fiabilidad: agendar con la mensajería apagada; pruebas de cruces y saldos.',
  'Roles IEEE 1074 y Belbin: sin cambios frente a la Fase 1.',
]);

s = nueva('ADR-001: cliente-servidor en capas con MVC');
tabla(s, ['Campo', 'Contenido'], [
  ['Estado', 'Aceptado'],
  ['Contexto', 'Datos de salud protegidos, recepción que necesita rapidez, mensajería externa que puede fallar, equipo pequeño y bajo presupuesto.'],
  ['Decisión', 'Monolito Django en capas con MVC, PostgreSQL, servidor virtual en la nube; mensajería por la interfaz Notificador.'],
  ['Consecuencias', 'Gana: control de acceso único, simplicidad, bajo costo, continuidad sin mensajería. Sacrifica: escalado por módulo, interactividad de SPA, un solo servidor.'],
], { colW: [2.2, 9.9], tam: 15 });

s = nueva('Síntesis y siguientes pasos');
puntos(s, [
  'Fase 1: problema, alcance, SRS con MoSCoW, atributos de calidad, Scrum y roles.',
  'Fase 2: arquitectura, clases del núcleo, secuencia, componentes, despliegue, trazabilidad, sprints y plan de gestión.',
  'Fase 3: ejecutar los sprints, construir el prototipo, hacer las pruebas de concepto y preparar la defensa.',
]);

pptx.writeFile({ fileName: process.argv[3] }).then(() => console.log('OK', process.argv[3], '| diapositivas:', n));
