/**
 * Clínica Dental Dr. Héctor Manuel Rojas Pérez — Atlacomulco
 * Script único de comportamiento. Sin dependencias externas (RNF-02).
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

  /* ---------- 3. Slider del hero (T-15 / T-16) ---------- */
  function iniciarSliderHero() {
    var slider = document.getElementById("heroSlider");
    if (!slider) return;

    var slides = Array.prototype.slice.call(slider.querySelectorAll(".hero__slide"));
    var contenedorPuntos = document.getElementById("heroPuntos");
    if (slides.length <= 1) return; // una sola imagen: queda fija, sin rotación (RF-10 / T-16)

    var prefiereMenosMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefiereMenosMovimiento) return; // se anula toda la rotación (T-16)

    var indiceActual = 0;
    var intervaloMs = 6000;
    var temporizador = null;
    var puntos = [];

    slides.forEach(function (slide, i) {
      slide.classList.toggle("is-activa", i === 0);
    });

    if (contenedorPuntos) {
      slides.forEach(function (_, i) {
        var boton = document.createElement("button");
        boton.type = "button";
        boton.className = "hero__punto" + (i === 0 ? " is-activo" : "");
        boton.setAttribute("role", "tab");
        boton.setAttribute("aria-label", "Mostrar imagen " + (i + 1) + " de " + slides.length);
        boton.setAttribute("aria-selected", i === 0 ? "true" : "false");
        boton.addEventListener("click", function () {
          irASlide(i);
          reiniciarTemporizador();
        });
        contenedorPuntos.appendChild(boton);
        puntos.push(boton);
      });
    }

    function irASlide(indice) {
      slides[indiceActual].classList.remove("is-activa");
      if (puntos[indiceActual]) {
        puntos[indiceActual].classList.remove("is-activo");
        puntos[indiceActual].setAttribute("aria-selected", "false");
      }
      indiceActual = indice;
      slides[indiceActual].classList.add("is-activa");
      if (puntos[indiceActual]) {
        puntos[indiceActual].classList.add("is-activo");
        puntos[indiceActual].setAttribute("aria-selected", "true");
      }
    }

    function siguienteSlide() {
      irASlide((indiceActual + 1) % slides.length);
    }

    function reiniciarTemporizador() {
      if (temporizador) clearInterval(temporizador);
      temporizador = setInterval(siguienteSlide, intervaloMs);
    }

    reiniciarTemporizador();

    slider.addEventListener("mouseenter", function () {
      if (temporizador) clearInterval(temporizador);
    });
    slider.addEventListener("mouseleave", reiniciarTemporizador);
  }

  /* ---------- 4. Inicio ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    propagarDatosNegocio();
    iniciarSliderHero();
  });
})();
