// Genera la versión a color de las diapositivas de sustentación.
// Uso: node generar-diapositivas-color.js <ruta-node_modules> <archivo-salida>
const path = require('path');
const fs = require('fs');
const PptxGenJS = require(path.join(process.argv[2], 'pptxgenjs'));
const F = require('./datos');
const IMG = path.join(__dirname, '..', 'imagenes');

const C = {
  azul: '1F4E79',
  verde: '2A9D8F',
  coral: 'E76F51',
  ambar: 'E9A23B',
  claro: 'EAF2F8',
  fondo: 'F7FAFC',
  texto: '1E293B',
  gris: '64748B',
  blanco: 'FFFFFF',
};
const LETRA = 'Arial';

const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5 in
const { I1 } = F.EQUIPO;
const hist = (id) => F.historias.find((h) => h[0] === id);
let n = 0;

// ------------------------------------------------------------ utilidades
function nueva(titulo, color = C.azul) {
  const s = pptx.addSlide();
  s.background = { color: C.blanco };
  n += 1;
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 1.0, fill: { color }, line: { color } });
  s.addText(titulo, { x: 0.5, y: 0.12, w: 12.3, h: 0.76, fontFace: LETRA, fontSize: 26, bold: true, color: C.blanco, valign: 'middle' });
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 7.15, w: 13.33, h: 0.35, fill: { color: C.claro }, line: { color: C.claro } });
  s.addText('Sistema de gestión de citas e historias clínicas · Consultorio odontológico', { x: 0.5, y: 7.15, w: 10, h: 0.35, fontFace: LETRA, fontSize: 10, color: C.gris, valign: 'middle' });
  s.addText(String(n), { x: 12.2, y: 7.15, w: 0.7, h: 0.35, fontFace: LETRA, fontSize: 10, bold: true, color: C.azul, align: 'right', valign: 'middle' });
  return s;
}

function separador(numero, titulo, subtitulo, color) {
  const s = pptx.addSlide();
  n += 1;
  s.background = { color };
  s.addText(numero, { x: 0.8, y: 1.8, w: 11.7, h: 1.0, fontFace: LETRA, fontSize: 24, bold: true, color: C.blanco, transparency: 20 });
  s.addText(titulo, { x: 0.8, y: 2.7, w: 11.7, h: 1.3, fontFace: LETRA, fontSize: 44, bold: true, color: C.blanco });
  s.addShape(pptx.ShapeType.rect, { x: 0.8, y: 4.15, w: 2.0, h: 0.08, fill: { color: C.blanco }, line: { color: C.blanco } });
  s.addText(subtitulo, { x: 0.8, y: 4.4, w: 11.7, h: 1.0, fontFace: LETRA, fontSize: 20, color: C.blanco });
}

function puntos(s, items, o = {}) {
  s.addText(items.map((t) => ({ text: t, options: { bullet: { code: '25A0' }, breakLine: true } })), {
    x: o.x ?? 0.6, y: o.y ?? 1.3, w: o.w ?? 12.1, h: o.h ?? 5.6,
    fontFace: LETRA, fontSize: o.tam ?? 18, color: C.texto, valign: 'top', paraSpaceAfter: 10,
  });
}

function tabla(s, enc, filas, o = {}) {
  const color = o.color ?? C.azul;
  const head = enc.map((e) => ({ text: String(e), options: { bold: true, color: C.blanco, fill: { color }, fontFace: LETRA, fontSize: o.tam ?? 13 } }));
  const body = filas.map((f, i) => f.map((v) => ({ text: String(v), options: { color: C.texto, fill: { color: i % 2 ? C.claro : C.blanco }, fontFace: LETRA, fontSize: o.tam ?? 13 } })));
  s.addTable([head, ...body], {
    x: o.x ?? 0.6, y: o.y ?? 1.3, w: o.w ?? 12.1, colW: o.colW,
    border: { type: 'solid', pt: 0.75, color: 'C9D6E3' }, margin: 0.07, valign: 'middle',
  });
}

// tarjeta con franja de color arriba
function tarjeta(s, x, y, w, h, color, titulo, texto, o = {}) {
  s.addShape(pptx.ShapeType.rect, { x, y, w, h, fill: { color: C.fondo }, line: { color: 'D5DEE8', width: 0.75 } });
  s.addShape(pptx.ShapeType.rect, { x, y, w, h: 0.12, fill: { color }, line: { color } });
  s.addText(titulo, { x: x + 0.2, y: y + 0.25, w: w - 0.4, h: 0.55, fontFace: LETRA, fontSize: o.tamTitulo ?? 18, bold: true, color });
  s.addText(texto, { x: x + 0.2, y: y + 0.8, w: w - 0.4, h: h - 0.95, fontFace: LETRA, fontSize: o.tam ?? 14, color: C.texto, valign: 'top' });
}

function imagen(s, archivo, caja) {
  const buf = fs.readFileSync(path.join(IMG, archivo));
  const w = buf.readUInt32BE(16);
  const h = buf.readUInt32BE(20);
  let ancho = caja.w;
  let alto = (caja.w * h) / w;
  if (alto > caja.h) { alto = caja.h; ancho = (caja.h * w) / h; }
  const x = caja.x + (caja.w - ancho) / 2;
  s.addShape(pptx.ShapeType.rect, { x: x - 0.05, y: caja.y - 0.05, w: ancho + 0.1, h: alto + 0.1, fill: { color: C.blanco }, line: { color: 'D5DEE8', width: 0.75 } });
  s.addImage({ path: path.join(IMG, archivo), x, y: caja.y, w: ancho, h: alto });
}

function nota(s, texto, color = C.verde, y = 6.35) {
  s.addShape(pptx.ShapeType.rect, { x: 0.6, y, w: 0.1, h: 0.6, fill: { color }, line: { color } });
  s.addText(texto, { x: 0.8, y, w: 11.9, h: 0.6, fontFace: LETRA, fontSize: 14, color: C.texto, valign: 'middle', italic: true });
}

// ------------------------------------------------------------ portada
let s = pptx.addSlide();
n += 1;
s.background = { color: C.azul };
s.addShape(pptx.ShapeType.rect, { x: 0, y: 5.6, w: 13.33, h: 1.9, fill: { color: C.blanco }, line: { color: C.blanco } });
s.addShape(pptx.ShapeType.rect, { x: 0, y: 5.5, w: 4.44, h: 0.1, fill: { color: C.verde }, line: { color: C.verde } });
s.addShape(pptx.ShapeType.rect, { x: 4.44, y: 5.5, w: 4.44, h: 0.1, fill: { color: C.ambar }, line: { color: C.ambar } });
s.addShape(pptx.ShapeType.rect, { x: 8.88, y: 5.5, w: 4.45, h: 0.1, fill: { color: C.coral }, line: { color: C.coral } });
s.addText('Sistema de gestión de citas e historias clínicas', { x: 0.8, y: 1.3, w: 11.7, h: 1.0, fontFace: LETRA, fontSize: 38, bold: true, color: C.blanco });
s.addText('para un consultorio odontológico', { x: 0.8, y: 2.25, w: 11.7, h: 0.8, fontFace: LETRA, fontSize: 30, color: C.blanco });
s.addText('Fase 2: Diseño de la solución y planeación del trabajo', { x: 0.8, y: 3.5, w: 11.7, h: 0.6, fontFace: LETRA, fontSize: 18, color: 'BFD7EA' });
s.addText(I1, { x: 0.8, y: 5.85, w: 11.7, h: 0.5, fontFace: LETRA, fontSize: 18, bold: true, color: C.azul });
s.addText('Ingeniería de Software  ·  Docente: Fredys Alberto Simanca Herrera  ·  Universidad Cooperativa de Colombia  ·  Octubre de 2026', { x: 0.8, y: 6.4, w: 11.7, h: 0.5, fontFace: LETRA, fontSize: 14, color: C.gris });

// ------------------------------------------------------------ CONTEXTO
s = nueva('Punto de partida');
tarjeta(s, 0.6, 1.3, 12.1, 1.5, C.azul, 'Problema (Fase 1)', 'Consultorio odontológico con agenda en cuaderno, citas cruzadas, 1 de cada 5 pacientes sin llegar, historias clínicas en papel y pagos sin control.', { tam: 16 });
[
  [C.azul, '1. Seguridad', 'Historia clínica protegida por la ley.'],
  [C.verde, '2. Usabilidad', 'Agendar en menos de 1 minuto.'],
  [C.coral, '3. Fiabilidad', 'La agenda no se detiene si falla la mensajería.'],
].forEach(([color, t, d], i) => tarjeta(s, 0.6 + i * 4.07, 3.1, 3.87, 2.4, color, t, d, { tam: 15, tamTitulo: 20 }));
nota(s, 'Atributos de calidad priorizados en la Fase 1 (ISO/IEC 25010): guían todas las decisiones de esta fase.', C.ambar, 5.85);

s = nueva('Control de versiones del documento');
tabla(s, ['Versión', 'Cambios'], [
  ['1.0', 'Propuesta y SRS iniciales (Fase 1).'],
  ['1.1', 'Ajustes a la Fase 1: RF de citas dividido en RF06, RF07 y RF08; RNF de usabilidad y rendimiento cuantificados; categoría Won\'t; RNF07 de tolerancia a fallos.'],
  ['2.0', 'Fase 2: diseño de la solución, planeación ágil y plan de gestión.'],
], { colW: [1.5, 10.6], tam: 16 });

// ------------------------------------------------------------ FASE 2
separador('PARTE 1', 'Diseño de la solución', 'Trazabilidad, arquitectura, diseño orientado a objetos y UML', C.verde);

s = nueva('Trazabilidad con la Fase 1 (extracto)');
tabla(s, ['Requerimiento', 'Elemento de diseño', 'Verificación'], [
  ['RF06 Agendar cita', 'AgendaService.agendar()', 'Diagrama de secuencia'],
  ['RF07 Control de cruces', 'Cita.seCruzaCon() + transacción con bloqueo', 'Prueba unitaria y concurrente'],
  ['RF10 Recordatorios', 'RecordatorioService + interfaz Notificador', 'Prueba con mensajería caída'],
  ['RF13 Historia clínica', 'Paciente 1 - 1 HistoriaClinica', 'Acceso solo del odontólogo'],
  ['RF20 Auditoría', 'AuditoriaService.registrar()', 'Revisión de registros'],
  ['RNF02 Acceso por rol', 'Control de sesión y rol en la capa de control', 'Pruebas con cada rol'],
], { colW: [3.4, 5.2, 3.5], tam: 15 });
nota(s, 'Cada requerimiento Must y Should tiene un elemento de diseño y una forma de verificarlo.', C.verde, 6.2);

s = nueva('Arquitectura: cliente-servidor en capas con MVC');
imagen(s, 'f2-arquitectura.png', { x: 0.6, y: 1.3, w: 12.1, h: 3.4 });
[
  [C.azul, 'Seguridad', 'Un solo punto de control de sesión y rol.'],
  [C.verde, 'Usabilidad', 'MVC separa pantallas de la lógica.'],
  [C.coral, 'Fiabilidad', 'Pocas piezas; mensajería aislada.'],
].forEach(([color, t, d], i) => tarjeta(s, 0.6 + i * 4.07, 5.0, 3.87, 1.95, color, t, d, { tam: 14 }));

s = nueva('Lo que ganamos y lo que sacrificamos');
tarjeta(s, 0.6, 1.3, 5.95, 4.4, C.verde, 'Ganamos', '■ Control de acceso en un solo lugar\n■ Desarrollo y despliegue simples\n■ Bajo costo para el consultorio\n■ La agenda sigue aunque falle WhatsApp', { tam: 17 });
tarjeta(s, 6.75, 1.3, 5.95, 4.4, C.coral, 'Sacrificamos', '■ Escalar un módulo por separado\n■ La interactividad de una SPA\n■ Dependemos de un solo servidor (lo compensa el respaldo diario)', { tam: 17 });
nota(s, 'Descartamos microservicios: demasiado complejos para 20 usuarios y un proyecto de una sola persona.', C.azul, 6.0);

s = nueva('Diseño orientado a objetos');
imagen(s, 'f2-clases-nucleo.png', { x: 0.4, y: 1.25, w: 7.2, h: 5.75 });
tarjeta(s, 7.9, 1.25, 4.8, 2.6, C.azul, 'Relaciones', 'Herencia: Persona → Paciente, Usuario → Odontologo\nComposición: HistoriaClinica, Evolucion\nAgregación: PlanTratamiento - Pago\nRealización: Notificador', { tam: 13 });
tarjeta(s, 7.9, 4.05, 4.8, 2.95, C.coral, 'SOLID', 'S: cada servicio tiene una sola tarea\nO: SMS = clase nueva, sin tocar la agenda\nL: cualquier notificador sirve\nD: la agenda depende de la interfaz Notificador, no de WhatsApp', { tam: 13 });

s = nueva('Diagrama de secuencia: Agendar cita');
imagen(s, 'f2-secuencia-agendar.png', { x: 0.4, y: 1.25, w: 8.6, h: 5.75 });
tarjeta(s, 9.3, 1.3, 3.4, 2.6, C.azul, 'Sin cruces', 'Transacción y bloqueo: dos personas no pueden tomar la misma hora.', { tam: 14 });
tarjeta(s, 9.3, 4.1, 3.4, 2.6, C.coral, 'Si falla el mensaje', 'La cita ya quedó guardada; el envío se reintenta después.', { tam: 14 });

s = nueva('Diagramas de componentes y de despliegue');
imagen(s, 'f2-componentes.png', { x: 0.4, y: 1.3, w: 5.8, h: 5.6 });
imagen(s, 'f2-despliegue.png', { x: 6.5, y: 1.9, w: 6.4, h: 4.5 });

s = nueva('Herramienta CASE: Mermaid');
tarjeta(s, 0.6, 1.3, 5.95, 4.6, C.verde, 'Por qué Mermaid', '■ Gratuita y de código abierto, sin instalar nada\n■ Cada diagrama es texto que va al repositorio con el código\n■ Fácil de mantener al día con cada cambio', { tam: 17 });
tarjeta(s, 6.75, 1.3, 5.95, 4.6, C.gris, 'Limitación y alternativas', '■ Sin tipo propio para casos de uso, componentes y despliegue: se dibujaron con notación UML en diagramas de flujo\n■ StarUML, Visual Paradigm y Enterprise Architect generan código, pero no hacía falta\n■ Rational Rose y Enterprise Architect: licencias costosas', { tam: 17 });

// ------------------------------------------------------------ PLANEACIÓN
separador('PARTE 2', 'Planeación y gestión del proyecto', 'Sprints, riesgos, comunicación y calidad', C.coral);

s = nueva('Product backlog y sprints');
[
  [C.azul, String(F.historias.length), 'historias de usuario'],
  [C.verde, String(F.historias.reduce((a, h) => a + h[5], 0)), 'puntos de historia'],
  [C.ambar, String(F.epicas.length), 'épicas'],
  [C.coral, '4', 'sprints de 2 semanas'],
].forEach(([color, num, t], i) => {
  const x = 0.6 + i * 3.05;
  s.addShape(pptx.ShapeType.rect, { x, y: 1.3, w: 2.85, h: 1.3, fill: { color }, line: { color } });
  s.addText(num, { x, y: 1.3, w: 2.85, h: 0.8, fontFace: LETRA, fontSize: 32, bold: true, color: C.blanco, align: 'center', valign: 'bottom' });
  s.addText(t, { x, y: 2.05, w: 2.85, h: 0.45, fontFace: LETRA, fontSize: 14, color: C.blanco, align: 'center' });
});
tabla(s, ['Sprint', 'Fechas', 'Objetivo', 'Historias', 'Pts.'], F.sprints.map((sp) => [sp.nombre, sp.fechas, sp.objetivo, sp.items.map((i) => i[0]).join(', '), String(sp.items.reduce((a, [id]) => a + hist(id)[5], 0))]), { y: 2.9, colW: [1.2, 2.1, 5.3, 2.8, 0.7], tam: 13 });
nota(s, 'Formato: Como [rol], quiero [funcionalidad], para [beneficio]. Estimación por comparación con una historia de referencia.', C.verde, 6.2);

s = nueva('Definición de hecho (Definition of Done)');
[
  'Cumple todos sus criterios de aceptación',
  'Autorrevisión con lista de chequeo',
  'Pruebas automáticas pasando',
  'Pasa la lista de chequeo de seguridad',
  'Diagramas y trazabilidad actualizados',
  'Aceptada por el Product Owner',
].forEach((t, i) => {
  const col = i % 2;
  const fila = Math.floor(i / 2);
  const x = 0.6 + col * 6.15;
  const y = 1.4 + fila * 1.65;
  const color = [C.azul, C.verde, C.ambar, C.coral, C.verde, C.azul][i];
  s.addShape(pptx.ShapeType.ellipse, { x, y: y + 0.15, w: 0.9, h: 0.9, fill: { color }, line: { color } });
  s.addText(String(i + 1), { x, y: y + 0.15, w: 0.9, h: 0.9, fontFace: LETRA, fontSize: 24, bold: true, color: C.blanco, align: 'center', valign: 'middle' });
  s.addText(t, { x: x + 1.1, y, w: 4.8, h: 1.2, fontFace: LETRA, fontSize: 18, color: C.texto, valign: 'middle' });
});

s = nueva('Gestión de riesgos');
const colorNivel = (v) => ({ Alta: C.coral, Alto: C.coral, Media: C.ambar, Medio: C.ambar, Baja: C.verde }[v]);
const headR = ['Riesgo', 'Prob.', 'Impacto', 'Mitigación'].map((e) => ({ text: e, options: { bold: true, color: C.blanco, fill: { color: C.azul }, fontFace: LETRA, fontSize: 13 } }));
const bodyR = F.riesgos.map((r, i) => {
  const base = { color: C.texto, fill: { color: i % 2 ? C.claro : C.blanco }, fontFace: LETRA, fontSize: 12 };
  const nivel = (v) => ({ text: v, options: { ...base, bold: true, color: C.blanco, fill: { color: colorNivel(v) }, align: 'center' } });
  return [{ text: r[1], options: base }, nivel(r[2]), nivel(r[3]), { text: r[4], options: base }];
});
s.addTable([headR, ...bodyR], { x: 0.6, y: 1.3, w: 12.1, colW: [4.6, 1.0, 1.1, 5.4], border: { type: 'solid', pt: 0.75, color: 'C9D6E3' }, margin: 0.07, valign: 'middle' });

s = nueva('Comunicaciones, calidad y roles');
tarjeta(s, 0.6, 1.3, 3.87, 4.9, C.azul, 'Comunicación', `■ Daily individual: nota diaria en el tablero\n■ Planning, Review y Retrospectiva por sprint\n■ Actas y revisión con el docente\n■ Tablero Kanban y Git`, { tam: 14 });
tarjeta(s, 4.67, 1.3, 3.87, 4.9, C.verde, 'Calidad', '■ Seguridad: revisar qué rol ve cada dato\n■ Usabilidad: agendar 5 citas, menos de 1 min cada una\n■ Fiabilidad: agendar con la mensajería apagada', { tam: 14 });
tarjeta(s, 8.74, 1.3, 3.96, 4.9, C.ambar, 'Roles', `■ ${I1} ocupa todos los roles IEEE 1074\n■ Belbin: Implementador y Finalizador\n■ Monitor evaluador: lo cubren las pruebas y el docente`, { tam: 14 });

s = nueva('ADR-001: arquitectura en capas con MVC');
[
  [C.gris, 'Estado', 'Aceptado'],
  [C.azul, 'Contexto', 'Datos de salud protegidos, recepción que necesita rapidez, mensajería externa que puede fallar, equipo pequeño y bajo presupuesto.'],
  [C.verde, 'Decisión', 'Monolito Django en capas con MVC y PostgreSQL, en un servidor virtual en la nube. La mensajería pasa por la interfaz Notificador.'],
  [C.coral, 'Consecuencias', 'Gana: control de acceso único, simplicidad, bajo costo y continuidad sin mensajería. Sacrifica: escalado por módulo, interactividad de SPA y un solo servidor.'],
].forEach(([color, t, d], i) => {
  const y = 1.3 + i * 1.4;
  s.addShape(pptx.ShapeType.rect, { x: 0.6, y, w: 2.4, h: 1.25, fill: { color }, line: { color } });
  s.addText(t, { x: 0.6, y, w: 2.4, h: 1.25, fontFace: LETRA, fontSize: 18, bold: true, color: C.blanco, align: 'center', valign: 'middle' });
  s.addShape(pptx.ShapeType.rect, { x: 3.0, y, w: 9.7, h: 1.25, fill: { color: C.fondo }, line: { color: 'D5DEE8', width: 0.75 } });
  s.addText(d, { x: 3.2, y, w: 9.3, h: 1.25, fontFace: LETRA, fontSize: 15, color: C.texto, valign: 'middle' });
});

s = nueva('Síntesis y siguientes pasos', C.verde);
tarjeta(s, 0.6, 1.3, 3.87, 4.6, C.verde, 'Quedó diseñado', 'Arquitectura en capas con MVC, clases del núcleo con SOLID, diagramas de secuencia, componentes y despliegue, y trazabilidad con la Fase 1.', { tam: 15 });
tarjeta(s, 4.67, 1.3, 3.87, 4.6, C.azul, 'Quedó planeado', 'Backlog, sprints 1 y 2, definición de hecho, riesgos, comunicaciones, calidad y ADR-001.', { tam: 15 });
tarjeta(s, 8.74, 1.3, 3.96, 4.6, C.coral, 'Pendiente (Fase 3)', 'Ejecutar los sprints, construir el prototipo, hacer las pruebas de concepto y preparar la defensa.', { tam: 15 });
nota(s, 'Cada decisión responde a tres atributos: seguridad, usabilidad y fiabilidad.', C.ambar, 6.2);

// cierre
s = pptx.addSlide();
n += 1;
s.background = { color: C.azul };
s.addText('Gracias', { x: 0.8, y: 2.4, w: 11.7, h: 1.2, fontFace: LETRA, fontSize: 54, bold: true, color: C.blanco, align: 'center' });
s.addText('¿Preguntas?', { x: 0.8, y: 3.6, w: 11.7, h: 0.8, fontFace: LETRA, fontSize: 26, color: 'BFD7EA', align: 'center' });
s.addShape(pptx.ShapeType.rect, { x: 5.17, y: 4.6, w: 1.0, h: 0.08, fill: { color: C.verde }, line: { color: C.verde } });
s.addShape(pptx.ShapeType.rect, { x: 6.17, y: 4.6, w: 1.0, h: 0.08, fill: { color: C.ambar }, line: { color: C.ambar } });
s.addShape(pptx.ShapeType.rect, { x: 7.17, y: 4.6, w: 1.0, h: 0.08, fill: { color: C.coral }, line: { color: C.coral } });

pptx.writeFile({ fileName: process.argv[3] }).then(() => console.log('OK', process.argv[3], '| diapositivas:', n));
