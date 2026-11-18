// Genera las diapositivas de la sustentación final (Fase 3).
// Uso: node generar-diapositivas-final.js <ruta-node_modules> <archivo-salida>
const path = require('path');
const fs = require('fs');
const PptxGenJS = require(path.join(process.argv[2], 'pptxgenjs'));
const F = require('./datos');
const IMG = path.join(__dirname, '..', 'imagenes');
const CAP = path.join(__dirname, '..', 'sgco', 'docs', 'capturas');

const C = {
  azul: '1F4E79', verde: '2A9D8F', coral: 'E76F51', ambar: 'E9A23B',
  claro: 'EAF2F8', fondo: 'F7FAFC', texto: '1E293B', gris: '64748B', blanco: 'FFFFFF',
};
const LETRA = 'Arial';
const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_WIDE';
const { I1 } = F.EQUIPO;
let n = 0;

function nueva(titulo, color = C.azul) {
  const s = pptx.addSlide();
  s.background = { color: C.blanco };
  n += 1;
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 1.0, fill: { color }, line: { color } });
  s.addText(titulo, { x: 0.5, y: 0.12, w: 12.3, h: 0.76, fontFace: LETRA, fontSize: 26, bold: true, color: C.blanco, valign: 'middle' });
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 7.15, w: 13.33, h: 0.35, fill: { color: C.claro }, line: { color: C.claro } });
  s.addText('SGCO · Sistema de Gestión del Consultorio Odontológico', { x: 0.5, y: 7.15, w: 10, h: 0.35, fontFace: LETRA, fontSize: 10, color: C.gris, valign: 'middle' });
  s.addText(String(n), { x: 12.2, y: 7.15, w: 0.7, h: 0.35, fontFace: LETRA, fontSize: 10, bold: true, color: C.azul, align: 'right', valign: 'middle' });
  return s;
}

function tarjeta(s, x, y, w, h, color, titulo, texto, o = {}) {
  s.addShape(pptx.ShapeType.rect, { x, y, w, h, fill: { color: C.fondo }, line: { color: 'D5DEE8', width: 0.75 } });
  s.addShape(pptx.ShapeType.rect, { x, y, w, h: 0.12, fill: { color }, line: { color } });
  s.addText(titulo, { x: x + 0.2, y: y + 0.22, w: w - 0.4, h: 0.5, fontFace: LETRA, fontSize: o.tamTitulo ?? 18, bold: true, color });
  s.addText(texto, { x: x + 0.2, y: y + 0.75, w: w - 0.4, h: h - 0.9, fontFace: LETRA, fontSize: o.tam ?? 14, color: C.texto, valign: 'top' });
}

function cifra(s, x, y, w, h, color, num, texto) {
  s.addShape(pptx.ShapeType.rect, { x, y, w, h, fill: { color }, line: { color } });
  s.addText(num, { x, y, w, h: h * 0.62, fontFace: LETRA, fontSize: 30, bold: true, color: C.blanco, align: 'center', valign: 'bottom' });
  s.addText(texto, { x, y: y + h * 0.6, w, h: h * 0.35, fontFace: LETRA, fontSize: 13, color: C.blanco, align: 'center', valign: 'top' });
}

function tabla(s, enc, filas, o = {}) {
  const color = o.color ?? C.azul;
  const head = enc.map((e) => ({ text: String(e), options: { bold: true, color: C.blanco, fill: { color }, fontFace: LETRA, fontSize: o.tam ?? 13 } }));
  const body = filas.map((f, i) => f.map((v) => {
    const op = { color: C.texto, fill: { color: i % 2 ? C.claro : C.blanco }, fontFace: LETRA, fontSize: o.tam ?? 13 };
    if (v === 'Pasó') Object.assign(op, { bold: true, color: C.verde });
    if (v === 'Pendiente') Object.assign(op, { bold: true, color: C.coral });
    return { text: String(v), options: op };
  }));
  s.addTable([head, ...body], { x: o.x ?? 0.6, y: o.y ?? 1.3, w: o.w ?? 12.1, colW: o.colW, border: { type: 'solid', pt: 0.75, color: 'C9D6E3' }, margin: 0.06, valign: 'middle' });
}

function imagen(s, ruta, caja, pie) {
  const buf = fs.readFileSync(ruta);
  const w = buf.readUInt32BE(16);
  const h = buf.readUInt32BE(20);
  let ancho = caja.w;
  let alto = (caja.w * h) / w;
  if (alto > caja.h) { alto = caja.h; ancho = (caja.h * w) / h; }
  const x = caja.x + (caja.w - ancho) / 2;
  s.addShape(pptx.ShapeType.rect, { x: x - 0.04, y: caja.y - 0.04, w: ancho + 0.08, h: alto + 0.08, fill: { color: C.blanco }, line: { color: 'D5DEE8', width: 0.75 } });
  s.addImage({ path: ruta, x, y: caja.y, w: ancho, h: alto });
  if (pie) s.addText(pie, { x: caja.x, y: caja.y + alto + 0.06, w: caja.w, h: 0.3, fontFace: LETRA, fontSize: 11, color: C.gris, align: 'center', italic: true });
}

function nota(s, texto, color = C.verde, y = 6.35) {
  s.addShape(pptx.ShapeType.rect, { x: 0.6, y, w: 0.1, h: 0.6, fill: { color }, line: { color } });
  s.addText(texto, { x: 0.8, y, w: 11.9, h: 0.6, fontFace: LETRA, fontSize: 14, color: C.texto, valign: 'middle', italic: true });
}

// 1. Portada
let s = pptx.addSlide();
n += 1;
s.background = { color: C.azul };
s.addShape(pptx.ShapeType.rect, { x: 0, y: 5.6, w: 13.33, h: 1.9, fill: { color: C.blanco }, line: { color: C.blanco } });
[[0, C.verde], [4.44, C.ambar], [8.88, C.coral]].forEach(([x, c]) => s.addShape(pptx.ShapeType.rect, { x, y: 5.5, w: 4.45, h: 0.1, fill: { color: c }, line: { color: c } }));
s.addText('SGCO', { x: 0.8, y: 1.1, w: 11.7, h: 1.2, fontFace: LETRA, fontSize: 60, bold: true, color: C.blanco });
s.addText('Sistema de Gestión del Consultorio Odontológico', { x: 0.8, y: 2.3, w: 11.7, h: 0.7, fontFace: LETRA, fontSize: 28, color: C.blanco });
s.addText('Sustentación final · Fase 3: implementación, verificación y cierre', { x: 0.8, y: 3.4, w: 11.7, h: 0.6, fontFace: LETRA, fontSize: 18, color: 'BFD7EA' });
s.addText(I1, { x: 0.8, y: 5.85, w: 11.7, h: 0.5, fontFace: LETRA, fontSize: 18, bold: true, color: C.azul });
s.addText('Ingeniería de Software  ·  Docente: Fredys Alberto Simanca Herrera  ·  Universidad Cooperativa de Colombia  ·  Noviembre de 2026', { x: 0.8, y: 6.4, w: 11.7, h: 0.5, fontFace: LETRA, fontSize: 14, color: C.gris });

// 2. Problema y alcance
s = nueva('Problema y alcance');
[
  [C.coral, 'Citas cruzadas', 'Agenda en cuaderno y hoja de cálculo.'],
  [C.ambar, 'Inasistencias', '1 de cada 5 pacientes no llega.'],
  [C.verde, 'Historias en papel', 'Sin respaldo ni control de acceso.'],
  [C.azul, 'Pagos sin control', 'No se conoce el saldo de cada paciente.'],
].forEach(([c, t, d], i) => tarjeta(s, 0.6 + i * 3.05, 1.3, 2.85, 2.1, c, t, d, { tam: 14 }));
tarjeta(s, 0.6, 3.7, 5.95, 2.4, C.verde, 'Alcance', 'Usuarios y roles, pacientes, horarios, citas sin cruces, recordatorios, historia clínica, tratamientos, pagos, reportes y auditoría.', { tam: 15 });
tarjeta(s, 6.75, 3.7, 5.95, 2.4, C.gris, 'Fuera del alcance', 'Facturación electrónica DIAN, integración con EPS, app móvil nativa e inventario.', { tam: 15 });
nota(s, 'Consultorio de caso de estudio: 3 odontólogos, 1 recepcionista y unos 35 pacientes al día.', C.azul, 6.35);

// 3. Requerimientos priorizados y estado
s = nueva('Requerimientos priorizados y qué se implementó');
cifra(s, 0.6, 1.3, 2.85, 1.45, C.verde, '13 / 13', 'Must funcionales implementados');
cifra(s, 3.65, 1.3, 2.85, 1.45, C.azul, '5', 'Should implementados (1 parcial)');
cifra(s, 6.7, 1.3, 2.85, 1.45, C.ambar, '2', 'Should pendientes');
cifra(s, 9.75, 1.3, 2.95, 1.45, C.gris, '3', 'Could pendientes');
tabla(s, ['Prioridad', 'Implementado', 'No implementado (y por qué)'], [
  ['Must', 'Inicio de sesión, usuarios y roles, pacientes, búsqueda, horarios, agendar, control de cruces, reprogramar y cancelar, agenda diaria, historia clínica, evoluciones, pagos, auditoría', '-'],
  ['Should', 'Recordatorios (mensajería simulada), asistencia, plan de tratamiento, estado de cuenta, reportes', 'Citas en línea y odontograma: se priorizaron los Must'],
  ['Could', '-', 'Adjuntos, historia en PDF y lista de espera'],
], { y: 3.0, colW: [1.4, 6.6, 4.1], tam: 13 });

// 4. Arquitectura y ADR
s = nueva('Arquitectura y decisión principal (ADR-001)');
imagen(s, path.join(IMG, 'f2-arquitectura.png'), { x: 0.6, y: 1.3, w: 12.1, h: 3.1 });
tarjeta(s, 0.6, 4.75, 3.95, 2.2, C.azul, 'Decisión', 'Cliente-servidor en capas con MVC, monolito Django y PostgreSQL. Se mantuvo en la implementación.', { tam: 13 });
tarjeta(s, 4.7, 4.75, 3.95, 2.2, C.verde, 'Se gana', 'Seguridad en un solo punto, simplicidad, bajo costo y agenda que sigue sin mensajería.', { tam: 13 });
tarjeta(s, 8.8, 4.75, 3.9, 2.2, C.coral, 'Se sacrifica', 'Escalado por módulo, interactividad de una SPA y dependencia de un solo servidor.', { tam: 13 });

// 5. Modelo de clases y cambios
s = nueva('Modelo de clases y cambios en la implementación');
imagen(s, path.join(IMG, 'f2-clases-nucleo.png'), { x: 0.4, y: 1.25, w: 6.6, h: 5.75 });
tarjeta(s, 7.3, 1.25, 5.4, 5.7, C.ambar, 'Qué cambió frente a la Fase 2', '■ Usuario hereda de la autenticación de Django (contraseñas seguras sin programarlas).\n\n■ Nuevas clases: BloqueoAgenda (RF05), Mensaje y ServicioMensajes (reintento, RNF07).\n\n■ SQLite en el prototipo; PostgreSQL por variable de entorno.\n\n■ WhatsApp simulado: no hay cuenta de WhatsApp Business. Con la interfaz Notificador, conectarlo es agregar una clase.', { tam: 14 });

// 6. Demo (respaldo)
s = nueva('Demostración: agendar sin cruces', C.verde);
imagen(s, path.join(CAP, '04-agendar-horas-libres.png'), { x: 0.4, y: 1.25, w: 6.1, h: 4.9 }, 'Horas libres del odontólogo (RF06)');
imagen(s, path.join(CAP, '05-agendar-cruce-rechazado.png'), { x: 6.8, y: 1.25, w: 6.1, h: 4.9 }, 'Cita cruzada rechazada (RF07)');
nota(s, 'Demo en vivo: ingresar como recepción, agendar, intentar una cita cruzada, abrir la historia como odontóloga y ver la auditoría.', C.coral, 6.45);

// 7. Demo historia y seguridad
s = nueva('Demostración: historia clínica protegida', C.verde);
imagen(s, path.join(CAP, '11-historia-clinica.png'), { x: 0.4, y: 1.25, w: 6.1, h: 5.2 }, 'Odontóloga: historia con alergia resaltada (RF13, RF14)');
imagen(s, path.join(CAP, '08-historia-acceso-denegado.png'), { x: 6.8, y: 1.25, w: 6.1, h: 2.5 }, 'Recepción intenta abrir la historia (RNF02)');
imagen(s, path.join(CAP, '15-auditoria.png'), { x: 6.8, y: 4.2, w: 6.1, h: 2.3 }, 'Auditoría de accesos (RF20)');

// 8. Pruebas y trazabilidad
s = nueva('Pruebas y trazabilidad');
cifra(s, 0.6, 1.3, 2.85, 1.4, C.verde, '66', 'pruebas automáticas, 0 fallos');
cifra(s, 3.65, 1.3, 2.85, 1.4, C.azul, '21', 'pruebas unitarias');
cifra(s, 6.7, 1.3, 2.85, 1.4, C.azul, '21', 'casos de prueba (CP)');
cifra(s, 9.75, 1.3, 2.95, 1.4, C.ambar, '100 %', 'Must con cadena completa');
tabla(s, ['Requerimiento', 'Diseño (Fase 2)', 'Implementación', 'Prueba', 'Resultado'], [
  ['RF07 Control de cruces', 'Cita.seCruzaCon()', 'agenda/models.py, agenda/services.py', 'CP-07', 'Pasó'],
  ['RF14 Evolución', 'agregarEvolucion()', 'historia_clinica/models.py', 'CP-11', 'Pasó'],
  ['RF17 Pagos', 'PagoService', 'tratamientos/services.py', 'CP-12', 'Pasó'],
  ['RNF02 Acceso por rol', 'Capa de control', 'cuentas/permisos.py', 'CP-14', 'Pasó'],
  ['RNF07 Mensajería', 'Interfaz Notificador', 'notificaciones/services.py', 'CP-15', 'Pasó'],
  ['RF15 Odontograma', 'historia_clinica', 'No implementado', '-', 'Pendiente'],
], { y: 2.95, colW: [2.6, 2.4, 3.6, 1.2, 2.3], tam: 13 });

// 9. Atributos de calidad
s = nueva('Atributos de calidad verificados');
tarjeta(s, 0.6, 1.3, 3.95, 4.6, C.azul, 'Seguridad: cumple', '■ Matriz de permisos: 15 de 15 combinaciones correctas (CP-14).\n■ Cada consulta de historia queda en auditoría (CP-13).\n■ Contraseñas con hash PBKDF2 (CP-16).', { tam: 14 });
tarjeta(s, 4.7, 1.3, 3.95, 4.6, C.verde, 'Fiabilidad: cumple', '■ Con la mensajería caída la cita se guarda y el mensaje queda pendiente; el reintento lo envía (CP-15).\n■ Respaldo de datos probado (CP-17).\n■ Disponibilidad: sin verificar (no desplegado).', { tam: 14 });
tarjeta(s, 8.8, 1.3, 3.9, 4.6, C.coral, 'Usabilidad: parcial', '■ Agendar: 1 pantalla, 5 campos y 1 clic (límite: 3 pantallas).\n■ Falta la prueba con 3 personas (protocolo MU-01).', { tam: 14 });
nota(s, 'Rendimiento (RNF11): la agenda del día carga en 28,6 ms en promedio con 1.200 citas; el límite es 2 s.', C.ambar, 6.2);

// 10. Gestión y proceso
s = nueva('Gestión y proceso (Scrum de una persona)');
tabla(s, ['Sprint', 'Objetivo', 'Puntos terminados'], [
  ['Sprint 1', 'Ingreso, pacientes y agenda sin cruces', '27 de 27'],
  ['Sprint 2', 'Recordatorios, asistencia, historia clínica y auditoría', '23 de 23'],
  ['Sprint 3', 'Planes, pagos, reportes y citas en línea', '15 de 23'],
  ['Sprint 4', 'Odontograma, adjuntos, PDF, lista de espera y despliegue', '0 de 22 (trabajo futuro)'],
], { colW: [1.6, 7.4, 3.1], tam: 14 });
tarjeta(s, 0.6, 4.2, 5.95, 2.75, C.coral, 'Riesgo que se materializó', 'R3: no se consiguió cuenta de WhatsApp Business. La interfaz Notificador permitió simular el envío sin frenar la agenda.', { tam: 14 });
tarjeta(s, 6.75, 4.2, 5.95, 2.75, C.verde, 'Definition of Done aplicada', 'Sin un segundo revisor, cada historia terminada debía tener pruebas automáticas, pasar la lista de seguridad y quedar en la matriz de trazabilidad.', { tam: 14 });

// 11. Lo que no funciona, lecciones y trabajo futuro
s = nueva('Lo que no funciona, lecciones y trabajo futuro');
tarjeta(s, 0.6, 1.3, 3.95, 5.65, C.coral, 'Lo que no funciona', '■ WhatsApp simulado; el correo solo en consola.\n■ No está desplegado: HTTPS y disponibilidad sin verificar.\n■ Falta la nota aclaratoria de evoluciones.\n■ Sin límite de intentos de ingreso.\n■ Pendientes: citas en línea y odontograma.', { tam: 14 });
tarjeta(s, 4.7, 1.3, 3.95, 5.65, C.azul, 'Lecciones', '■ La trazabilidad hizo fácil decidir qué probar.\n■ Una buena interfaz en el diseño resolvió un riesgo real.\n■ Desplegar al final fue un error: hay que tener un ambiente de pruebas desde el Sprint 1.', { tam: 14 });
tarjeta(s, 8.8, 1.3, 3.9, 5.65, C.verde, 'Trabajo futuro', '1. Desplegar con HTTPS y respaldos externos.\n2. Mensajería real.\n3. Prueba con usuarios.\n4. Nota aclaratoria y límite de intentos.\n5. Citas en línea y odontograma.\n6. Adjuntos, PDF y lista de espera.', { tam: 14 });

// 12. Cierre
s = pptx.addSlide();
n += 1;
s.background = { color: C.azul };
s.addText('Gracias', { x: 0.8, y: 1.9, w: 11.7, h: 1.2, fontFace: LETRA, fontSize: 54, bold: true, color: C.blanco, align: 'center' });
s.addText('SGCO evita citas cruzadas, avisa al paciente y protege la historia clínica.', { x: 0.8, y: 3.15, w: 11.7, h: 0.6, fontFace: LETRA, fontSize: 20, color: 'BFD7EA', align: 'center' });
s.addText('Repositorio: https://github.com/Esteban1532/sgco', { x: 0.8, y: 4.1, w: 11.7, h: 0.5, fontFace: LETRA, fontSize: 16, color: C.blanco, align: 'center' });
s.addText('¿Preguntas?', { x: 0.8, y: 4.9, w: 11.7, h: 0.7, fontFace: LETRA, fontSize: 26, color: C.blanco, align: 'center' });
[[5.17, C.verde], [6.17, C.ambar], [7.17, C.coral]].forEach(([x, c]) => s.addShape(pptx.ShapeType.rect, { x, y: 5.85, w: 1.0, h: 0.08, fill: { color: c }, line: { color: c } }));

pptx.writeFile({ fileName: process.argv[3] }).then(() => console.log('OK', process.argv[3], '| diapositivas:', n));
