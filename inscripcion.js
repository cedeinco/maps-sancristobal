/* ============================================================
   Inscripción a rutas — Rutas San Cristóbal / Cedeinco
   Script único y compartido: se referencia desde cada página de
   ruta con <script src="inscripcion.js" data-ruta="SLUG"></script>
   No requiere tocar el resto del HTML/CSS de cada ruta.
   ============================================================ */
(function () {
  "use strict";

  // ⚠️ Reemplaza esta URL por la de tu Web App de Apps Script
  // (Implementar > Nueva implementación > Aplicación web > Acceso: Cualquier usuario)
  var API_URL = "https://script.google.com/macros/s/REEMPLAZA_ESTE_ID/exec";

  var CUPO_MAXIMO = 30;
  var FECHA_RUTA = "";
  var HORARIO_RUTA = "";

  var currentScript = document.currentScript;
  var RUTA_SLUG = currentScript ? currentScript.getAttribute("data-ruta") : null;

  if (!RUTA_SLUG) {
    console.warn("[inscripcion.js] Falta data-ruta en el <script>. No se activa el botón de inscripción.");
    return;
  }

  /* ---------------- estilos ---------------- */
  var css = ""
    + ".insc-btn-wrap{display:inline-flex;align-items:center;}"
    + ".btn-inscribir{background:var(--green);color:#fff;border-color:var(--green);}"
    + ".btn-inscribir:hover{filter:brightness(1.08);}"
    + ".btn-inscribir[disabled]{background:var(--surface-2);color:var(--text-muted);border-color:var(--border);cursor:not-allowed;filter:none;}"
    + ".insc-cupos{font-family:'JetBrains Mono',monospace;font-weight:700;}"
    + ".insc-overlay{position:fixed;inset:0;background:rgba(20,28,20,0.55);display:flex;align-items:center;justify-content:center;padding:20px;z-index:9999;opacity:0;pointer-events:none;transition:opacity .15s ease;}"
    + ".insc-overlay.open{opacity:1;pointer-events:auto;}"
    + ".insc-modal{background:var(--surface);color:var(--text);border-radius:var(--radius);box-shadow:var(--shadow);width:100%;max-width:440px;max-height:90vh;overflow-y:auto;padding:22px 22px 24px;position:relative;font-family:'Work Sans',sans-serif;}"
    + ".insc-close{position:absolute;top:12px;right:12px;width:30px;height:30px;border-radius:50%;border:none;background:var(--surface-2);color:var(--text);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;}"
    + ".insc-close:hover{filter:brightness(0.92);}"
    + ".insc-title{font-family:'Playfair Display',Georgia,serif;font-size:20px;font-weight:700;margin:0 0 4px;padding-right:24px;}"
    + ".insc-sub{font-size:13px;color:var(--text-muted);margin:0 0 18px;line-height:1.45;}"
    + ".insc-field{display:flex;flex-direction:column;gap:5px;margin-bottom:13px;}"
    + ".insc-field label{font-size:12px;font-weight:600;color:var(--text-muted);}"
    + ".insc-field input,.insc-field select{font:inherit;font-size:14px;padding:9px 11px;border-radius:9px;border:1px solid var(--border);background:var(--surface);color:var(--text);}"
    + ".insc-field input:focus,.insc-field select:focus{outline:2px solid var(--accent);outline-offset:1px;}"
    + ".insc-submit{width:100%;margin-top:6px;padding:11px 16px;border-radius:999px;border:none;background:var(--accent);color:#fff;font-weight:700;font-size:14px;cursor:pointer;font-family:'Work Sans',sans-serif;}"
    + ".insc-submit:hover{filter:brightness(0.94);}"
    + ".insc-submit[disabled]{opacity:0.6;cursor:default;}"
    + ".insc-msg{font-size:13px;padding:10px 12px;border-radius:9px;margin-bottom:14px;line-height:1.4;}"
    + ".insc-fecha{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-weight:600;color:var(--text-muted);margin:0 0 24px;}"
    + ".insc-fecha svg{flex:none;color:var(--accent);}"
    + ".insc-msg.error{background:#f6d9d0;color:#7a2e12;}"
    + ".insc-msg.ok{background:#dcecd9;color:#1c3320;}"
    + ":root:not([data-theme=\"light\"]) .insc-msg.error{background:#3a2018;color:#f3b39c;}"
    + ":root:not([data-theme=\"light\"]) .insc-msg.ok{background:#1e2b1e;color:#cfe3cd;}"
    + ":root[data-theme=\"dark\"] .insc-msg.error{background:#3a2018;color:#f3b39c;}"
    + ":root[data-theme=\"dark\"] .insc-msg.ok{background:#1e2b1e;color:#cfe3cd;}"
    + ".insc-success{text-align:center;padding:10px 0 4px;}"
    + ".insc-success svg{color:var(--green);margin-bottom:10px;}"
    + ".insc-spinner{display:inline-block;width:14px;height:14px;border:2px solid rgba(255,255,255,0.5);border-top-color:#fff;border-radius:50%;animation:insc-spin .7s linear infinite;vertical-align:-2px;margin-right:6px;}"
    + "@keyframes insc-spin{to{transform:rotate(360deg);}}";
  var styleEl = document.createElement("style");
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ---------------- botón ---------------- */
  var actions = document.querySelector(".maps-actions");
  if (!actions) return;

  var btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn btn-inscribir";
  btn.id = "btn-inscribirse";
  btn.innerHTML =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><rect x="3" y="5" width="18" height="14" rx="2.5" stroke="currentColor" stroke-width="1.8"/></svg>' +
    'Inscribirse · <span class="insc-cupos">cargando…</span>';
  actions.appendChild(btn);
  btn.disabled = true;

  var fechaLine = document.createElement("p");
  fechaLine.className = "insc-fecha";
  fechaLine.style.display = "none";
  fechaLine.innerHTML =
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M3 9.5h18M8 3v4M16 3v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>' +
    '<span></span>';
  if (actions.parentNode) {
    actions.parentNode.insertBefore(fechaLine, actions.nextSibling);
  }

  /* ---------------- modal ---------------- */
  var overlay = document.createElement("div");
  overlay.className = "insc-overlay";
  overlay.innerHTML =
    '<div class="insc-modal" role="dialog" aria-modal="true" aria-labelledby="insc-title">' +
      '<button type="button" class="insc-close" aria-label="Cerrar">&times;</button>' +
      '<div id="insc-body"></div>' +
    '</div>';
  document.body.appendChild(overlay);

  var modalBody = overlay.querySelector("#insc-body");
  var closeBtn = overlay.querySelector(".insc-close");

  function closeModal() {
    overlay.classList.remove("open");
  }
  closeBtn.addEventListener("click", closeModal);
  overlay.addEventListener("click", function (ev) {
    if (ev.target === overlay) closeModal();
  });
  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape") closeModal();
  });

  function renderForm(routeName, disponibles) {
    var fechaHorario = (FECHA_RUTA ? FECHA_RUTA : "") + (FECHA_RUTA && HORARIO_RUTA ? " · " : "") + (HORARIO_RUTA ? HORARIO_RUTA : "");
    modalBody.innerHTML =
      '<h3 class="insc-title" id="insc-title">Inscripción a la ruta</h3>' +
      '<p class="insc-sub">' + routeName + ' · <span class="insc-cupos">' + disponibles + ' cupo' + (disponibles === 1 ? '' : 's') + ' disponible' + (disponibles === 1 ? '' : 's') + '</span> de ' + CUPO_MAXIMO +
        (fechaHorario ? '<br>' + fechaHorario : '') +
      '</p>' +
      '<div id="insc-alert"></div>' +
      '<form id="insc-form">' +
        '<div class="insc-field"><label for="insc-nombre">Nombre y Apellido</label><input id="insc-nombre" name="nombre" type="text" required autocomplete="name"></div>' +
        '<div class="insc-field"><label for="insc-celular">Número de celular de contacto</label><input id="insc-celular" name="celular" type="tel" inputmode="tel" required autocomplete="tel"></div>' +
        '<div class="insc-field"><label for="insc-correo">Correo</label><input id="insc-correo" name="correo" type="email" required autocomplete="email"></div>' +
        '<div class="insc-field"><label for="insc-documento">Número de documento de identidad</label><input id="insc-documento" name="documento" type="text" inputmode="numeric" required></div>' +
        '<div class="insc-field"><label for="insc-eps">EPS a la que pertenece</label><input id="insc-eps" name="eps" type="text" required></div>' +
        '<button type="submit" class="insc-submit">Confirmar inscripción</button>' +
      '</form>';

    var form = modalBody.querySelector("#insc-form");
    var alertBox = modalBody.querySelector("#insc-alert");
    var submitBtn = form.querySelector(".insc-submit");

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      alertBox.innerHTML = "";
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="insc-spinner"></span> Enviando…';

      var payload = {
        ruta: RUTA_SLUG,
        nombre: form.nombre.value.trim(),
        celular: form.celular.value.trim(),
        correo: form.correo.value.trim(),
        documento: form.documento.value.trim(),
        eps: form.eps.value.trim()
      };

      fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (res.ok) {
            showSuccess(routeName);
            updateButton(res.disponibles, res.cerrado);
          } else if (res.error === "cupos_agotados") {
            alertBox.innerHTML = '<div class="insc-msg error">Lo sentimos, los cupos para esta ruta se acaban de agotar.</div>';
            submitBtn.disabled = true;
            submitBtn.textContent = "Cupos agotados";
            updateButton(0, true);
          } else {
            alertBox.innerHTML = '<div class="insc-msg error">No se pudo completar la inscripción. Intenta de nuevo en unos minutos.</div>';
            submitBtn.disabled = false;
            submitBtn.textContent = "Confirmar inscripción";
          }
        })
        .catch(function () {
          alertBox.innerHTML = '<div class="insc-msg error">Error de conexión. Verifica tu internet e intenta de nuevo.</div>';
          submitBtn.disabled = false;
          submitBtn.textContent = "Confirmar inscripción";
        });
    });
  }

  function showSuccess(routeName) {
    modalBody.innerHTML =
      '<div class="insc-success">' +
        '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.8"/><path d="M8 12.5l2.5 2.5L16 9.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '<h3 class="insc-title" style="text-align:center;padding-right:0;">¡Inscripción registrada!</h3>' +
        '<p class="insc-sub" style="text-align:center;">Quedaste inscrito en <b>' + routeName + '</b>. Pronto te contactaremos con los detalles de la jornada.</p>' +
      '</div>';
  }

  function renderClosed(routeName) {
    modalBody.innerHTML =
      '<h3 class="insc-title" id="insc-title">Cupos agotados</h3>' +
      '<p class="insc-sub">Ya se completaron los ' + CUPO_MAXIMO + ' cupos disponibles para <b>' + routeName + '</b>. Sigue las demás rutas del catálogo para más opciones.</p>';
  }

  function updateFechaLine() {
    if (!FECHA_RUTA && !HORARIO_RUTA) return;
    var span = fechaLine.querySelector("span");
    var texto = FECHA_RUTA ? capitalize_(FECHA_RUTA) : "";
    if (HORARIO_RUTA) texto += (texto ? " · " : "") + HORARIO_RUTA;
    span.textContent = texto;
    fechaLine.style.display = "inline-flex";
  }

  function capitalize_(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  var ROUTE_NAME = (document.querySelector("h1") || {}).textContent || "esta ruta";
  var lastDisponibles = null;

  function updateButton(disponibles, cerrado) {
    lastDisponibles = disponibles;
    var label = btn.querySelector(".insc-cupos");
    if (cerrado) {
      btn.disabled = true;
      btn.innerHTML = 'Cupos agotados';
    } else {
      btn.disabled = false;
      if (label) {
        label.textContent = disponibles + " cupo" + (disponibles === 1 ? "" : "s") + " disponible" + (disponibles === 1 ? "" : "s");
      }
    }
  }

  btn.addEventListener("click", function () {
    if (btn.disabled) return;
    if (lastDisponibles !== null && lastDisponibles <= 0) {
      renderClosed(ROUTE_NAME.trim());
    } else {
      renderForm(ROUTE_NAME.trim(), lastDisponibles === null ? CUPO_MAXIMO : lastDisponibles);
    }
    overlay.classList.add("open");
  });

  /* ---------------- consulta inicial de cupos ---------------- */
  fetch(API_URL + "?action=cupos&ruta=" + encodeURIComponent(RUTA_SLUG))
    .then(function (r) { return r.json(); })
    .then(function (res) {
      if (res.ok) {
        if (typeof res.cupoMaximo === "number") CUPO_MAXIMO = res.cupoMaximo;
        if (res.fecha) FECHA_RUTA = res.fecha;
        if (res.horario) HORARIO_RUTA = res.horario;
        updateFechaLine();
        updateButton(res.disponibles, res.cerrado);
      } else {
        btn.innerHTML = "Inscribirse";
        btn.disabled = false;
      }
    })
    .catch(function () {
      btn.innerHTML = "Inscribirse";
      btn.disabled = false;
    });
})();
