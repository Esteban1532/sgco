// Interacción de las pantallas del SGCO. Todo funciona igual si este archivo no carga.
document.addEventListener('DOMContentLoaded', function () {
  // Los mensajes de éxito se cierran solos a los 5 segundos.
  document.querySelectorAll('.alert-success').forEach(function (alerta) {
    setTimeout(function () {
      if (window.bootstrap) { bootstrap.Alert.getOrCreateInstance(alerta).close(); }
    }, 5000);
  });

  // Confirmación antes de acciones que no se pueden deshacer (EH-01, hallazgo 2).
  document.querySelectorAll('form[data-confirmar]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      if (!confirm(form.dataset.confirmar)) { e.preventDefault(); e.stopImmediatePropagation(); }
    });
  });

  // Evita el doble envío: el botón se desactiva mientras la página responde.
  document.querySelectorAll('form[method="post"]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      if (e.defaultPrevented) { return; }
      var boton = e.submitter;
      if (!boton) { return; }
      // Se desactiva después del envío para que el valor del botón (la hora elegida) viaje con el formulario.
      setTimeout(function () { boton.disabled = true; boton.classList.add('enviando'); }, 0);
    });
  });

  // Filtro inmediato en la lista de pacientes mientras se escribe.
  var buscador = document.querySelector('[data-filtrar]');
  if (buscador) {
    var filas = document.querySelectorAll(buscador.dataset.filtrar);
    var vacio = document.getElementById('sin-resultados');
    var normalizar = function (t) { return t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); };
    buscador.addEventListener('input', function () {
      var q = normalizar(buscador.value.trim());
      var visibles = 0;
      filas.forEach(function (fila) {
        var ver = normalizar(fila.textContent).indexOf(q) !== -1;
        fila.hidden = !ver;
        if (ver) { visibles += 1; }
      });
      if (vacio) { vacio.hidden = visibles !== 0; }
    });
  }
});
