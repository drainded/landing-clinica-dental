/**
 * Clínica Dental Dr. Héctor Manuel Rojas Pérez — Atlacomulco
 * Script base de comportamiento, sin dependencias externas (RNF-02).
 * La dentadura 3D del hero vive en js/dentadura.js y se carga de forma
 * diferida desde aquí (iniciarDentadura).
 *
 * IMPORTANTE (T-04, D-10): todos los datos reales del negocio se cambian
 * en el objeto NEGOCIO de abajo, y se propagan solos a header, hero, barra
 * fija y footer a través de los atributos data-campo="..." del HTML.
 *
 * Excepción deliberada: las etiquetas <title>, <meta description>,
 * Open Graph/Twitter Card y el JSON-LD del <head> están escritas de forma
 * literal en index.html, NO se generan aquí. Los rastreadores que arman la
 * tarjeta de vista previa (por ejemplo el de WhatsApp) leen el HTML crudo
 * y no ejecutan JavaScript, así que esos valores deben quedar en el propio
 * HTML. Al sustituir los datos de prueba por los reales (T-23), hay que
 * actualizarlos en los DOS sitios: aquí abajo, y en el <head> de index.html.
 */
(function () {
  "use strict";

  /* ---------- 0. Constantes de la dentadura 3D ---------- */
  // Umbrales de equipo modesto: el script de <head> en index.html usa los mismos
  // valores; si se recalibran (T042), cambiarlos en los dos sitios.
  var UMBRAL_MEMORIA_GB = 2;
  var UMBRAL_NUCLEOS = 2;
  var UMBRAL_FPS_MIN = 24;       // fps medios de los primeros 3 s por debajo de los cuales se degrada
  var ANCHO_MOVIL_PX = 768;      // táctil por debajo de este ancho → nivel ligero
  var RETRASO_CARGA_MS = 200;    // respaldo si no hay requestIdleCallback
  var RUTA_MODELO_COMPLETO = "assets/models/diente.glb";
  var RUTA_MODELO_LIGERO = "assets/models/diente-ligero.glb";

  /* ---------- 1. Datos del negocio (sección 8 del spec — valores de prueba) ---------- */
  var NEGOCIO = {
    nombre: "Clínica Dental Dr. Héctor Manuel Rojas Pérez",

    // Teléfono real del negocio (sección 8 del spec). Formato de visualización vs. formato para "tel:".
    telefonoDisplay: "712 139 0384",
    telefonoTel: "+527121390384",

    // Número de WhatsApp real: código de país (52) + 10 dígitos, sin signos.
    whatsappNumero: "527121390384",
    whatsappMensaje: "Buen día, me gustaría agendar una cita",

    // Horario
    horarioResumen: "Lun–Vie 9:00–19:00 · Sáb 9:00–14:00",
    horarioCompleto: [
      { dia: "Lunes a viernes", horas: "9:00 – 19:00" },
      { dia: "Sábado", horas: "9:00 – 14:00" },
      { dia: "Domingo", horas: "Cerrado" }
    ],

    // Dirección real del negocio (sección 8 del spec)
    direccion: "Calle Rafael Favila 14A, Colonia El Calvario, C.P. 50450, Atlacomulco, Estado de México",

    // Ubicación confirmada (no es un dato pendiente, ver sección 8 del spec)
    coordenadas: { lat: 19.7975627, lng: -99.8719214 }
  };

  function construirEnlaceWhatsapp() {
    var texto = encodeURIComponent(NEGOCIO.whatsappMensaje);
    return "https://wa.me/" + NEGOCIO.whatsappNumero + "?text=" + texto;
  }

  function construirEnlaceTel() {
    return "tel:" + NEGOCIO.telefonoTel.replace(/\s+/g, "");
  }

  function construirEnlaceMapa() {
    return (
      "https://www.google.com/maps/search/?api=1&query=" +
      NEGOCIO.coordenadas.lat + "," + NEGOCIO.coordenadas.lng
    );
  }

  /* ---------- 2. Propagar los datos al DOM ---------- */
  function propagarDatosNegocio() {
    var enlaceWhatsapp = construirEnlaceWhatsapp();
    var enlaceTel = construirEnlaceTel();
    var enlaceMapa = construirEnlaceMapa();

    document.querySelectorAll('[data-campo="telefono-display"]').forEach(function (el) {
      el.textContent = NEGOCIO.telefonoDisplay;
    });
    document.querySelectorAll('[data-campo="telefono-href"]').forEach(function (el) {
      el.setAttribute("href", enlaceTel);
    });
    document.querySelectorAll('[data-campo="whatsapp-href"]').forEach(function (el) {
      el.setAttribute("href", enlaceWhatsapp);
    });
    document.querySelectorAll('[data-campo="mapa-href"]').forEach(function (el) {
      el.setAttribute("href", enlaceMapa);
    });
    document.querySelectorAll('[data-campo="horario-resumen"]').forEach(function (el) {
      el.textContent = NEGOCIO.horarioResumen;
    });
    document.querySelectorAll('[data-campo="direccion"]').forEach(function (el) {
      el.textContent = NEGOCIO.direccion;
    });
    document.querySelectorAll('[data-campo="horario-completo-lista"]').forEach(function (contenedor) {
      contenedor.innerHTML = "";
      NEGOCIO.horarioCompleto.forEach(function (fila) {
        var li = document.createElement("li");
        var dia = document.createElement("span");
        dia.textContent = fila.dia;
        var horas = document.createElement("span");
        horas.textContent = fila.horas;
        li.appendChild(dia);
        li.appendChild(horas);
        contenedor.appendChild(li);
      });
    });

    var anio = document.getElementById("anioActual");
    if (anio) anio.textContent = new Date().getFullYear();
  }

  /* ---------- 3. Dentadura 3D del hero (carga diferida) ---------- */
  function esEquipoModesto() {
    var memoria = navigator.deviceMemory;
    var nucleos = navigator.hardwareConcurrency;
    return (memoria !== undefined && memoria <= UMBRAL_MEMORIA_GB) ||
           (nucleos !== undefined && nucleos <= UMBRAL_NUCLEOS);
  }

  function elegirNivel() {
    var tactil = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
    return tactil && window.innerWidth < ANCHO_MOVIL_PX ? "ligero" : "completo";
  }

  function iniciarDentadura() {
    var raiz = document.documentElement;
    if (raiz.dataset.hero !== "animado" || esEquipoModesto()) {
      raiz.dataset.hero = "estatico";
      return;
    }

    var hero = document.getElementById("inicio");
    var figura = hero && hero.querySelector(".hero__figura");
    if (!figura) {
      raiz.dataset.hero = "estatico";
      return;
    }

    var nivel = elegirNivel();
    var rutaModelo = nivel === "ligero" ? RUTA_MODELO_LIGERO : RUTA_MODELO_COMPLETO;

    function cargar() {
      import("./dentadura.js")
        .then(function (modulo) {
          return modulo.iniciar({
            hero: hero,
            figura: figura,
            nivel: nivel,
            rutaModelo: rutaModelo,
            umbralFps: UMBRAL_FPS_MIN
          });
        })
        .catch(function () {
          raiz.dataset.hero = "estatico";
        });
    }

    // Tras el primer pintado, para no competir con el LCP (el póster)
    if (window.requestIdleCallback) {
      window.requestIdleCallback(cargar);
    } else {
      setTimeout(cargar, RETRASO_CARGA_MS);
    }
  }

  /* ---------- 4. Inicio ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    propagarDatosNegocio();
    iniciarDentadura();
  });
})();
