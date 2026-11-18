// Toma las capturas de pantalla del prototipo SGCO con el servidor en marcha.
// Uso: node capturas.js <ruta-node_modules> <url-base> <carpeta-salida>
const path = require('path');
const puppeteer = require(path.join(process.argv[2], 'puppeteer-core'));
const BASE = process.argv[3];
const SALIDA = process.argv[4];
const CLAVE = 'Consultorio2026*';

function fechaLocal(desplazamiento = 0) {
  const d = new Date();
  d.setDate(d.getDate() + desplazamiento);
  if (d.getDay() === 0) d.setDate(d.getDate() + 1); // domingo -> lunes
  return d.toISOString().slice(0, 10);
}

(async () => {
  const navegador = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
    args: ['--no-sandbox'],
  });
  const pagina = await navegador.newPage();
  await pagina.setViewport({ width: 1366, height: 820, deviceScaleFactor: 1 });
  let n = 0;
  const foto = async (nombre, completa = false) => {
    n += 1;
    const archivo = path.join(SALIDA, `${String(n).padStart(2, '0')}-${nombre}.png`);
    await pagina.screenshot({ path: archivo, fullPage: completa });
    console.log(archivo);
  };
  const ir = (ruta) => pagina.goto(BASE + ruta, { waitUntil: 'networkidle0' });
  const entrar = async (usuario) => {
    const salir = await pagina.$('form[action="/cuentas/salir/"] button');
    if (salir) await Promise.all([pagina.waitForNavigation(), pagina.evaluate(() => document.querySelector('form[action="/cuentas/salir/"]').submit())]);
    await ir('/cuentas/ingresar/');
    await pagina.type('#id_username', usuario);
    await pagina.type('#id_password', CLAVE);
    await Promise.all([pagina.waitForNavigation(), pagina.click('button[type=submit], form button')]);
  };

  await ir('/cuentas/ingresar/');
  await foto('ingreso');

  await entrar('recepcion');
  await foto('inicio-recepcion');
  await ir(`/agenda/?fecha=${fechaLocal(0)}`);
  await foto('agenda-del-dia', true);

  // Agendar: datos y franjas libres para mañana con la Dra. Mora
  const manana = fechaLocal(1);
  await ir('/pacientes/?q=Laura');
  const laura = await pagina.$eval('table a[href^="/pacientes/"]', (a) => a.getAttribute('href'));
  const idLaura = laura.split('/')[2];
  const odontologos = await (async () => {
    await ir('/agenda/nueva/');
    return pagina.$$eval('#id_odontologo option', (os) => os.map((o) => [o.value, o.textContent]));
  })();
  const idMora = odontologos.find((o) => o[1].includes('Mora'))[0];
  await ir(`/agenda/nueva/?paciente=${idLaura}&odontologo=${idMora}&fecha=${manana}&duracion_min=30&motivo=Control`);
  await foto('agendar-horas-libres', true);

  // Intento de cita cruzada: 08:30 ya está ocupada por los datos de prueba
  await pagina.evaluate(() => {
    const form = document.querySelector('main form[method=post]');
    const b = document.createElement('input');
    b.type = 'hidden'; b.name = 'hora'; b.value = '08:30';
    form.appendChild(b);
    form.submit();
  });
  await pagina.waitForNavigation({ waitUntil: 'networkidle0' });
  await foto('agendar-cruce-rechazado', true);

  await ir('/pacientes/?q=gomez');
  await foto('busqueda-pacientes');
  await ir(`/pacientes/${idLaura}/`);
  await foto('detalle-paciente', true);

  // La recepcionista intenta abrir la historia clínica
  await ir(`/historia/${idLaura}/`);
  await foto('historia-acceso-denegado');

  await ir('/mensajes/');
  await foto('mensajes', true);

  // Odontóloga: historia clínica y plan de tratamiento
  await entrar('dra.mora');
  await foto('inicio-odontologa');
  await ir(`/historia/${idLaura}/`);
  await foto('historia-clinica', true);
  await ir(`/pacientes/${idLaura}/`);
  const plan = await pagina.$eval('a[href^="/tratamientos/"]', (a) => a.getAttribute('href'));
  await ir(plan);
  await foto('plan-y-pagos', true);

  // Administradora
  await entrar('admin');
  await ir('/agenda/horarios/');
  await foto('horarios', true);
  await ir('/reportes/?desde=' + fechaLocal(-30) + '&hasta=' + fechaLocal(0));
  await foto('reportes');
  await ir('/auditoria/');
  await foto('auditoria', true);
  await ir('/cuentas/usuarios/');
  await foto('usuarios');

  // Vista en celular
  await pagina.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true });
  await entrar('recepcion');
  await ir(`/agenda/nueva/?paciente=${idLaura}&odontologo=${idMora}&fecha=${manana}&duracion_min=30&motivo=Control`);
  await foto('celular-agendar', true);

  await navegador.close();
})().catch((e) => { console.error(e); process.exit(1); });
