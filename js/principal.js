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
  var UMBRAL_NUCLEOS_LIGERO = 4; // hasta este número de núcleos se usa el modelo ligero también en escritorio
  var UMBRAL_FPS_MIN = 24;       // fps medios de los primeros 3 s por debajo de los cuales se degrada
  var ANCHO_MOVIL_PX = 768;      // táctil por debajo de este ancho → nivel ligero
  var RETRASO_3D_TRAS_CARGA_MS = 2000; // espera tras el evento load antes de cargar three.js y el modelo (el póster se ve mientras tanto)
  var UMBRAL_REVELADO_ON = 0.5; // apertura a partir de la cual «Servicios» se puede pulsar
  var UMBRAL_REVELADO_OFF = 0.45;
  var BLOQUEO_VELOCIDAD = 1.25;  // progreso máximo por segundo durante el bloqueo de introducción (≥ 0,8 s en total)
  var DISTANCIA_RUEDA = 0.9;     // alturas de ventana de rueda que equivalen a todo el progreso
  var DISTANCIA_TOQUE = 0.6;     // alturas de ventana de arrastre táctil que equivalen a todo el progreso
  var PASO_TECLA = 0.35;         // progreso que avanza una pulsación de Espacio / RePág
  var IMPULSO_TOQUE_MS = 400;   // al soltar un deslizamiento rápido, el dedo «sigue» este tiempo a su última velocidad
  var VELOCIDAD_MIN_TOQUE = 0.3; // px/ms mínimos para aplicar ese impulso
  var UMBRAL_REFRESCO_PX = 1.5;  // arrastre hacia abajo (con la boca cerrada y en lo alto) que se deja al navegador para refrescar
  var PULSACION_LARGA_MS = 450;     // un toque más largo que esto (o con el dedo movido) no abre/cierra la mandíbula
  var UMBRAL_MOVIMIENTO_TOQUE_PX = 12;
  var HOLGURA_TOQUE_PX = 14;     // el dedo es menos preciso que el ratón: se amplía así el área de toque
  var PAUSA_CURSOR_MS = 80;      // mínimo entre comprobaciones de «el ratón está sobre el modelo» (cambia el cursor)
  var ELIPSE_RESPALDO = { ancho: 0.42, alto: 0.45 }; // área de clic mientras el 3D no ha cargado (fracción de la figura)
  var CONSULTA_APAISADO_BAJO = "(orientation: landscape) and (max-height: 500px)"; // móvil en horizontal: hero normal, sin bloqueo
  // Rediseño estético (spec 003): paradas del fondo continuo, header translúcido y gesto de toque del hero
  var LINEA_REFERENCIA = 0.5;    // fracción del alto de la ventana donde se mide la posición del scroll para el color de fondo
  var UMBRAL_HEADER_PX = 8;      // scroll a partir del cual el header de escritorio pasa a translúcido
  var GESTO_ESPERA_MS = 2500;    // inactividad con la mandíbula cerrada antes de mostrar el gesto de scroll
  var GESTO_DURACION_MS = 2600;  // duración de cada gesto (la misma que su animación en css/estilos.css)
  var GESTO_PAUSA_MS = 5500;     // pausa entre gestos
  var GESTO_MAX_CICLOS = 3;      // veces que se muestra el gesto por visita, como máximo
  // Paradas {ancla, f, token}: el color de fondo en cada punto de la página (ancla + fracción de su alto; colores = tokens de :root)
  var PARADAS_FONDO = [
    { ancla: "servicios", f: 0, token: "--azul-50" },
    { ancla: "servicios", f: 0.25, token: "--azul-100" },
    { ancla: "servicios", f: 0.5, token: "--azul-300" },
    { ancla: "servicios", f: 0.75, token: "--azul-600" },
    { ancla: "servicios", f: 1, token: "--azul-800" },
    { ancla: "doctor", f: 0.35, token: "--color-gris" },
    { ancla: "resenas", f: 1, token: "--color-gris" },
    { ancla: "ubicacion", f: 0.5, token: "--color-blanco" }
  ];
  // Pantalla de presentación (spec 003, D-25)
  var PRESENTACION_MIN_MS = 2000;     // los 4 pares de dientes tardan ≈ 1,6 s en entrar; esta es la espera mínima antes de cerrar
  var PRESENTACION_TOPE_MS = 4500;    // tope absoluto: nunca se retiene la página más de esto (el CSS la oculta sola a los 7 s)
  var PRESENTACION_CIERRE_MS = 750;   // retraso (.15 s) + duración (.6 s) del cierre de los dientes (css/estilos.css, fila-baja / fila-sube)
  var PRESENTACION_SALIDA_MS = 450;   // duración del desvanecimiento final
  var RETRASO_3D_PRESENTACION_MS = 150; // con la presentación activa el 3D no espera: la página aún no se ve
  var RUTA_MODELO_COMPLETO = "assets/models/craneo.glb";
  var RUTA_MODELO_LIGERO = "assets/models/craneo-ligero.glb";

  // Función del módulo 3D que dice si un punto de la ventana está cerca del cráneo; null mientras no hay 3D
  var detectorModelo = null;

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
      { dia: "Domingo", horas: "Solo con cita" }
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
    // Móvil táctil estrecho o equipo de pocos núcleos: modelo ligero (menos triángulos, sin antialias, menos píxeles)
    var pocosNucleos = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= UMBRAL_NUCLEOS_LIGERO;
    return (tactil && window.innerWidth < ANCHO_MOVIL_PX) || pocosNucleos ? "ligero" : "completo";
  }

  /**
   * Bloqueo de introducción del hero (constitución v2.6.0, principio II). Es el mismo en los dos modos del hero
   * (3D e imágenes): el progreso gobierna la mandíbula del 3D o el fundido del cráneo cerrado al abierto.
   *
   * Al cargar la página en lo alto, las primeras acciones de scroll (rueda, arrastre táctil o
   * teclas) NO desplazan la página: avanzan la apertura de la mandíbula (progreso 0–1), con una
   * velocidad máxima, de modo que un gesto largo no se salte la animación, y el eslogan y el botón
   * aparecen poco a poco (opacidad creciente). Al llegar a 1 el bloqueo se libera y la página se
   * desplaza con normalidad.
   *
   * Salidas de emergencia (nunca debe atrapar a nadie): Tab, clic en un ancla interna, cualquier
   * desplazamiento externo (barra de scroll, buscar en la página, ancla en la URL), móvil apaisado
   * bajo o cargar la página ya desplazada. Si el 3D falla o se pasa al modo de imágenes, el bloqueo
   * sigue como estaba (mismo progreso). Los accesos de contacto (barra fija, botón flotante,
   * teléfono) no dependen del scroll y siguen pulsables.
   *
   * Al volver al inicio del todo tras haber bajado, el hero se rearma: la mandíbula se cierra y
   * el bloqueo vuelve a abrirla (cerrada ya si el hero salió de pantalla del todo).
   *
   * Publica el progreso como propiedad CSS --apertura, evento dentadura:apertura y atributo
   * data-revelado. Vive aquí y no en el módulo 3D para que el eslogan y el botón se revelen
   * aunque el 3D tarde en cargar o falle. Devuelve la función que libera el bloqueo.
   */
  function publicarApertura(hero) {
    var raiz = document.documentElement;
    var progreso = 0;
    var objetivo = 0;
    var publicado = -1;
    var eventoPublicado = -1;
    var ultimo = 0;
    var cuadro = 0;
    var bloqueado = false;
    var yTactil = null;
    var tTactil = 0;
    var velTactil = 0;
    var figura = hero.querySelector(".hero__figura");
    var clicActivo = false;

    function acotar(x) { return Math.min(1, Math.max(0, x)); }

    function publicar() {
      if (Math.abs(progreso - publicado) >= 0.0005) {
        publicado = progreso;
        hero.style.setProperty("--apertura", progreso.toFixed(3));
      }
      if (Math.abs(progreso - eventoPublicado) >= 0.005 || progreso === 1 || progreso === 0) {
        eventoPublicado = progreso;
        document.dispatchEvent(new CustomEvent("dentadura:apertura", { detail: { progreso: progreso } }));
      }
      // Histéresis para que el botón no parpadee en el umbral
      if (progreso > UMBRAL_REVELADO_ON) hero.setAttribute("data-revelado", "");
      else if (progreso < UMBRAL_REVELADO_OFF) hero.removeAttribute("data-revelado");
      if (clicActivo) figura.setAttribute("aria-pressed", hero.hasAttribute("data-revelado") ? "true" : "false");
    }

    function avanzar(t) {
      cuadro = 0;
      var dt = Math.min((t - ultimo) / 1000, 0.1);
      ultimo = t;
      var tope = BLOQUEO_VELOCIDAD * dt;
      progreso += Math.max(-tope, Math.min(tope, objetivo - progreso));
      publicar();
      if (progreso >= 1 && objetivo >= 1) liberar();
      else if (progreso !== objetivo) cuadro = window.requestAnimationFrame(avanzar);
    }

    function empujar(delta) {
      if (!bloqueado) return;
      objetivo = acotar(objetivo + delta);
      if (!cuadro) {
        ultimo = performance.now();
        cuadro = window.requestAnimationFrame(avanzar);
      }
    }

    // En un móvil en horizontal el hero no cabe en pantalla: se comporta como una página normal
    function apaisadoBajo() {
      if (!window.matchMedia || !window.matchMedia(CONSULTA_APAISADO_BAJO).matches) return false;
      liberar();
      return true;
    }

    function alRueda(e) {
      if (e.ctrlKey) return;   // zoom del navegador
      if (apaisadoBajo()) return;
      e.preventDefault();
      var px = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * window.innerHeight : e.deltaY;
      empujar(px / (window.innerHeight * DISTANCIA_RUEDA));
    }
    function alTocar(e) {
      yTactil = e.touches.length === 1 ? e.touches[0].clientY : null;
      tTactil = e.timeStamp;
      velTactil = 0;
    }
    function alMoverToque(e) {
      if (yTactil === null || e.touches.length !== 1) return;
      if (apaisadoBajo()) return;
      var y = e.touches[0].clientY;
      var dy = yTactil - y;
      var dt = e.timeStamp - tTactil;
      yTactil = y;
      tTactil = e.timeStamp;
      // Arrastre hacia abajo con la boca cerrada y en lo alto: es el gesto de «tirar para refrescar»
      // del navegador; no se intercepta (si no, la página no se puede actualizar)
      if (dy < -UMBRAL_REFRESCO_PX && objetivo <= 0 && window.pageYOffset <= 0) {
        velTactil = 0;
        return;
      }
      if (dt > 0) velTactil = 0.6 * (dy / dt) + 0.4 * velTactil;
      if (e.cancelable) e.preventDefault();
      empujar(dy / (window.innerHeight * DISTANCIA_TOQUE));
    }
    // Un deslizamiento rápido mueve poco el dedo: al soltarlo se añade el impulso que habría tenido el scroll
    function alSoltarToque(e) {
      var reciente = e.timeStamp - tTactil < 80;
      if (yTactil !== null && reciente && Math.abs(velTactil) > VELOCIDAD_MIN_TOQUE) {
        empujar(velTactil * IMPULSO_TOQUE_MS / (window.innerHeight * DISTANCIA_TOQUE));
      }
      yTactil = null;
      velTactil = 0;
    }
    function alTeclear(e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (apaisadoBajo()) return;
      if (e.key === "Tab") { liberar(); return; }   // navegar con teclado nunca se bloquea
      var t = e.target;
      if (t && (/^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(t.tagName) || t.isContentEditable)) return;
      var paso = 0;
      if (e.key === " ") paso = e.shiftKey ? -PASO_TECLA : PASO_TECLA;
      else if (e.key === "PageDown") paso = PASO_TECLA;
      else if (e.key === "PageUp") paso = -PASO_TECLA;
      else if (e.key === "ArrowDown") paso = PASO_TECLA / 2;
      else if (e.key === "ArrowUp") paso = -PASO_TECLA / 2;
      else if (e.key === "End") paso = 1;
      else if (e.key === "Home") paso = -1;
      else return;
      e.preventDefault();
      empujar(paso);
    }
    function alDesplazar() {
      if (window.pageYOffset > 2) liberar();   // desplazamiento externo: barra de scroll, ancla, buscar…
    }
    function alHacerClic(e) {
      var el = e.target;
      if (el && el.closest && el.closest('a[href^="#"]')) liberar();
    }

    // Al volver al inicio del todo, el hero se rearma: la mandíbula se cierra y el bloqueo de
    // introducción vuelve a hacerla abrir. Mientras el hero está fuera de pantalla se cierra sin
    // que se note, para que al regresar ya esté cerrada.
    var vigilando = false;
    var salio = false;

    function alVolver() {
      var y = window.pageYOffset;
      if (y > 2) salio = true;
      if (hero.getBoundingClientRect().bottom <= 0) {
        if (progreso !== 0) { objetivo = progreso = 0; publicar(); }
      } else if (salio && y <= 2) {
        activar();
      }
    }

    function vigilar() {
      if (vigilando) return;
      vigilando = true;
      salio = window.pageYOffset > 2;
      window.addEventListener("scroll", alVolver, { passive: true });
    }

    function dejarDeVigilar() {
      if (!vigilando) return;
      vigilando = false;
      window.removeEventListener("scroll", alVolver);
    }

    function activar() {
      dejarDeVigilar();
      bloqueado = true;
      objetivo = 0;
      raiz.setAttribute("data-bloqueo", "");
      window.addEventListener("wheel", alRueda, { passive: false });
      window.addEventListener("touchstart", alTocar, { passive: true });
      window.addEventListener("touchmove", alMoverToque, { passive: false });
      window.addEventListener("touchend", alSoltarToque, { passive: true });
      window.addEventListener("touchcancel", alSoltarToque, { passive: true });
      window.addEventListener("keydown", alTeclear);
      window.addEventListener("scroll", alDesplazar, { passive: true });
      document.addEventListener("click", alHacerClic, true);
      if (progreso !== objetivo) {
        ultimo = performance.now();
        cuadro = window.requestAnimationFrame(avanzar);
      } else {
        publicar();
      }
    }

    // definitivo = true: no volver a rearmar el bloqueo
    function liberar(definitivo) {
      if (bloqueado) {
        bloqueado = false;
        if (cuadro) { window.cancelAnimationFrame(cuadro); cuadro = 0; }
        window.removeEventListener("wheel", alRueda);
        window.removeEventListener("touchstart", alTocar);
        window.removeEventListener("touchmove", alMoverToque);
        window.removeEventListener("touchend", alSoltarToque);
        window.removeEventListener("touchcancel", alSoltarToque);
        window.removeEventListener("keydown", alTeclear);
        window.removeEventListener("scroll", alDesplazar);
        document.removeEventListener("click", alHacerClic, true);
        raiz.removeAttribute("data-bloqueo");
        // Si se libera antes de terminar, el módulo 3D (o el fundido de imágenes) completa la apertura a su ritmo
        objetivo = progreso = 1;
        publicar();
      }
      if (definitivo === true) dejarDeVigilar();
      else vigilar();
    }

    /*
     * Clic (o Intro / Espacio con la figura enfocada) sobre el cráneo: abre la mandíbula y, con
     * otro clic, la cierra. Funciona con o sin bloqueo de introducción. Si se cierra estando en
     * lo alto de la página, el bloqueo se rearma para que el scroll vuelva a abrirla.
     */
    function alternar() {
      var abrir = objetivo < 0.5;
      if (abrir) {
        objetivo = 1;
      } else if (!bloqueado && window.pageYOffset <= 2) {
        activar();   // deja objetivo = 0 y arranca la animación de cierre
        return;
      } else {
        objetivo = 0;
      }
      if (!cuadro) {
        ultimo = performance.now();
        cuadro = window.requestAnimationFrame(avanzar);
      }
    }
    // ¿Está el punto cerca del cráneo? Con 3D, lo decide el módulo (vértices proyectados); antes de que
    // cargue, una elipse centrada en la figura aproxima la silueta del póster.
    function sobreElModelo(x, y, esToque) {
      if (detectorModelo) return detectorModelo(x, y, esToque ? HOLGURA_TOQUE_PX : 0);
      var r = figura.getBoundingClientRect();
      var nx = (x - (r.left + r.width / 2)) / (r.width * ELIPSE_RESPALDO.ancho);
      var ny = (y - (r.top + r.height / 2)) / (r.height * ELIPSE_RESPALDO.alto);
      return nx * nx + ny * ny <= 1;
    }
    // Pulsación larga (táctil): no es un toque. Al soltar tras mantener pulsado no se abre/cierra la mandíbula, y el menú
    // contextual (guardar imagen, etc.) se suprime.
    var tPulsacion = 0;
    var yPulsacion = 0;
    var xPulsacion = 0;
    function alPulsarFigura(e) {
      tPulsacion = performance.now();
      xPulsacion = e.clientX;
      yPulsacion = e.clientY;
    }
    function esPulsacionLarga(e) {
      var tactil = e.pointerType === "touch" || (window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
      if (!tactil || !tPulsacion) return false;
      var largo = performance.now() - tPulsacion > PULSACION_LARGA_MS;
      var movido = Math.hypot(e.clientX - xPulsacion, e.clientY - yPulsacion) > UMBRAL_MOVIMIENTO_TOQUE_PX;
      return largo || movido;
    }
    function alMenuContextual(e) {
      if (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) e.preventDefault();
    }
    function alClicFigura(e) {
      if (e.detail !== 0 && esPulsacionLarga(e)) return;
      // Activación sin puntero (lector de pantalla, teclado) → siempre; con puntero, solo cerca del modelo
      if (e.detail !== 0 && e.pointerType !== "" && !sobreElModelo(e.clientX, e.clientY, e.pointerType === "touch")) return;
      alternar();
    }
    var tCursor = 0;
    function alMoverSobreFigura(e) {
      if (e.pointerType && e.pointerType !== "mouse") return;
      var ahora = performance.now();
      if (ahora - tCursor < PAUSA_CURSOR_MS) return;
      tCursor = ahora;
      figura.classList.toggle("is-sobre-modelo", sobreElModelo(e.clientX, e.clientY));
    }
    function alSalirDeFigura() { figura.classList.remove("is-sobre-modelo"); }
    function alTeclearFigura(e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      e.stopPropagation();   // que el bloqueo no lo trate como desplazamiento con Espacio
      alternar();
    }
    function activarClic() {
      if (!figura || clicActivo) return;
      clicActivo = true;
      figura.setAttribute("role", "button");
      figura.setAttribute("tabindex", "0");
      figura.setAttribute("aria-label", "Abrir o cerrar la mandíbula");
      figura.setAttribute("aria-pressed", hero.hasAttribute("data-revelado") ? "true" : "false");
      figura.addEventListener("click", alClicFigura);
      figura.addEventListener("pointerdown", alPulsarFigura, { passive: true });
      figura.addEventListener("contextmenu", alMenuContextual);
      figura.addEventListener("pointermove", alMoverSobreFigura, { passive: true });
      figura.addEventListener("pointerleave", alSalirDeFigura, { passive: true });
      figura.addEventListener("keydown", alTeclearFigura);
    }
    function desactivarClic() {
      if (!figura || !clicActivo) return;
      clicActivo = false;
      ["role", "tabindex", "aria-label", "aria-pressed"].forEach(function (a) { figura.removeAttribute(a); });
      figura.removeEventListener("click", alClicFigura);
      figura.removeEventListener("pointerdown", alPulsarFigura);
      figura.removeEventListener("contextmenu", alMenuContextual);
      figura.removeEventListener("pointermove", alMoverSobreFigura);
      figura.removeEventListener("pointerleave", alSalirDeFigura);
      figura.classList.remove("is-sobre-modelo");
      figura.removeEventListener("keydown", alTeclearFigura);
    }

    function liberarParaSiempre() { liberar(true); desactivarClic(); }

    activarClic();

    if (window.pageYOffset > 2 || (window.matchMedia && window.matchMedia(CONSULTA_APAISADO_BAJO).matches)) {
      // Página cargada ya desplazada (recarga, ancla) o móvil en horizontal: sin bloqueo y con la boca abierta
      objetivo = progreso = 1;
      publicar();
      vigilar();
      return liberarParaSiempre;
    }

    activar();
    return liberarParaSiempre;
  }

  /**
   * Cráneo abierto del hero estático (contrato §1 y §5): los <img> de .hero__abierto (hueso y dientes) arrancan con un GIF vacío y sus
   * <source> llevan un media que solo casa con movimiento reducido. Aquí se cambia ese media por el de data-media
   * y el navegador elige y pide la imagen real. Cuándo (motivo): "carga" → tras load y con el navegador libre
   * (con ahorro de datos equivale a "apertura"); "apertura" → solo si la persona empieza a abrir el cráneo (y el 3D
   * no está listo: así el eslogan no aparece sobre un cráneo todavía cerrado); "inmediato" → ya. Si la imagen real falla, data-abierto-fallo deja
   * el póster cerrado con el eslogan y el botón siempre visibles. El onload de ambos <img> marca data-abierto-listo.
   */
  var imagenAbiertaActivada = false;

  function activarImagenAbierta(hero) {
    if (imagenAbiertaActivada) return;
    imagenAbiertaActivada = true;
    var fuentes = hero.querySelectorAll(".hero__abierto source");
    for (var i = 0; i < fuentes.length; i++) fuentes[i].media = fuentes[i].getAttribute("data-media") || "all";
  }

  function habilitarImagenAbierta(hero, motivo) {
    // Hueso y dientes del cráneo abierto: si cualquiera de las dos imágenes falla, el póster cerrado se queda
    var imagenes = hero.querySelectorAll(".hero__abierto img");
    Array.prototype.forEach.call(imagenes, function (imagen) {
      if (imagen.getAttribute("data-vigilada")) return;
      imagen.setAttribute("data-vigilada", "");
      imagen.addEventListener("error", function () {
        if (imagen.currentSrc && imagen.currentSrc.slice(0, 5) !== "data:") {
          document.documentElement.setAttribute("data-abierto-fallo", "");
        }
      });
    });
    function activar() { activarImagenAbierta(hero); }
    if (motivo === "carga" && navigator.connection && navigator.connection.saveData) motivo = "apertura";
    function cuandoLibre() {
      function libre() {
        if (window.requestIdleCallback) window.requestIdleCallback(activar, { timeout: 4000 });
        else window.setTimeout(activar, 200);
      }
      if (document.readyState === "complete") libre();
      else window.addEventListener("load", libre, { once: true });
    }
    if (motivo === "inmediato") {
      activar();
    } else if (motivo === "apertura") {
      var alApertura = function (e) {
        if (!e.detail || !(e.detail.progreso > 0)) return;
        document.removeEventListener("dentadura:apertura", alApertura);
        if (!document.querySelector(".hero__figura.is-3d")) activar();   // con el 3D ya listo no hace falta
      };
      document.addEventListener("dentadura:apertura", alApertura);
    } else {
      cuandoLibre();
    }
  }

  function iniciarDentadura() {
    var raiz = document.documentElement;
    // Solo desarrollo (specs/002-hero-estatico-scroll, contrato §5): ?captura carga el 3D sin bloqueo ni espera
    // y expone window.__craneo para generar las imágenes del hero estático (referencias/herramientas/hero.mjs)
    var captura = /[?&]captura(?:[&=]|$)/.test(window.location.search);
    if (captura) raiz.dataset.hero = "animado";
    var hero = document.getElementById("inicio");
    var figura = hero && hero.querySelector(".hero__figura");

    // Modo de imágenes (sin 3D): ahorro de datos, equipo lento, «reducir movimiento»…; mismo bloqueo de introducción
    // que el 3D (el progreso funde el cráneo cerrado con el abierto), mismo clic sobre el cráneo
    if (raiz.dataset.hero !== "animado" || (!captura && esEquipoModesto()) || !figura) {
      raiz.dataset.hero = "estatico";
      if (hero && figura) {
        publicarApertura(hero);
        habilitarImagenAbierta(hero, "carga");
      }
      return;
    }

    if (!captura) publicarApertura(hero);

    // Si el 3D falla (sin WebGL, modelo, contexto perdido, FPS bajos) el hero pasa al modo de imágenes con el mismo
    // progreso (el bloqueo de introducción sigue como estaba) y se pide ya el cráneo abierto; mientras llega se ve
    // el póster cerrado.
    document.addEventListener("dentadura:estado", function (e) {
      if (e.detail && e.detail.estado === "estatico") habilitarImagenAbierta(hero, "inmediato");
    });
    if (!captura) habilitarImagenAbierta(hero, "apertura");

    var nivel = elegirNivel();
    var rutaModelo = nivel === "ligero" ? RUTA_MODELO_LIGERO : RUTA_MODELO_COMPLETO;

    var instancia = null;

    // Si la persona activa «reducir movimiento» con la página abierta, se pasa al modo de imágenes (sin 3D) con
    // el mismo progreso
    if (window.matchMedia) {
      var reducir = window.matchMedia("(prefers-reduced-motion: reduce)");
      var alCambiar = function (e) {
        if (!e.matches) return;
        if (instancia) instancia.destruir();
        detectorModelo = null;
        raiz.dataset.hero = "estatico";
        habilitarImagenAbierta(hero, "inmediato");
      };
      if (reducir.addEventListener) reducir.addEventListener("change", alCambiar);
    }

    function cargar() {
      import("./dentadura.js")
        .then(function (modulo) {
          return modulo.iniciar({
            hero: hero,
            figura: figura,
            nivel: nivel,
            rutaModelo: rutaModelo,
            umbralFps: UMBRAL_FPS_MIN,
            captura: captura
          });
        })
        .then(function (resultado) {
          instancia = resultado;
          detectorModelo = resultado && resultado.sobreModelo ? resultado.sobreModelo : null;
          if (captura) window.__craneo = resultado;
        })
        .catch(function () {
          raiz.dataset.hero = "estatico";
          habilitarImagenAbierta(hero, "inmediato");
        });
    }

    // Después de la carga y con el navegador libre, para no competir con el LCP (el póster)
    // ni con el resto de la página: compilar shaders y leer el modelo ocupa el hilo principal.
    function programarCarga() {
      window.setTimeout(function () {
        if (window.requestIdleCallback) window.requestIdleCallback(cargar);
        else cargar();
      }, document.documentElement.classList.contains("cargando") ? RETRASO_3D_PRESENTACION_MS : RETRASO_3D_TRAS_CARGA_MS);
    }
    if (captura) cargar();
    else if (document.readyState === "complete") programarCarga();
    else window.addEventListener("load", programarCarga, { once: true });
  }


  /* ---------- 3b. Rediseño estético (spec 003) ---------- */
  function leerHex(texto) {
    var m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((texto || "").trim());
    if (!m) return null;
    var h = m[1];
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }

  // Luminancia relativa (WCAG 2.x) de un color [r, g, b]
  function luminancia(c) {
    function lin(v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
    return 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
  }

  /**
   * Fondo continuo (specs/003, research R1 y R2): una capa fija de color cuyo valor sigue al scroll. Las paradas
   * PARADAS_FONDO fijan el color en puntos de la página (ancla + fracción de su alto); entre dos paradas se mezcla en sRGB
   * según la posición del scroll medida a LINEA_REFERENCIA del alto de la ventana. El texto sobre fondo libre no se
   * interpola: conmuta entre el color oscuro y el claro en la luminancia de igual contraste con ambos
   * (≥ 4,5 : 1 a los dos lados). Escribe --fondo y --texto en <html> y data-tono («claro» = fondo claro, texto oscuro).
   * Con «reducir movimiento», sin las anclas o sin tokens legibles no se activa y cada sección usa su color fijo.
   * También alterna .is-desplazado del header (translúcido en escritorio).
   */
  function iniciarFondoYEncabezado() {
    var raiz = document.documentElement;
    var encabezado = document.querySelector(".encabezado");
    var reducir = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
    var paradas = null;      // [{pos, color}] en px de documento, crecientes
    var colores = null;      // tokens leídos
    var cuadro = 0;
    var tono = "";
    var desplazado = null;
    var activo = false;

    function cargarColores() {
      var estilo = window.getComputedStyle(raiz);
      var oscuro = leerHex(estilo.getPropertyValue("--color-texto-oscuro"));
      var claro = leerHex(estilo.getPropertyValue("--color-texto-claro"));
      var lista = [];
      for (var i = 0; i < PARADAS_FONDO.length; i++) {
        var c = leerHex(estilo.getPropertyValue(PARADAS_FONDO[i].token));
        var el = document.getElementById(PARADAS_FONDO[i].ancla);
        if (!c || !el) return null;
        lista.push({ def: PARADAS_FONDO[i], color: c, el: el });
      }
      if (!oscuro || !claro) return null;
      var lo = luminancia(oscuro), ll = luminancia(claro);
      return {
        lista: lista,
        textoOscuro: estilo.getPropertyValue("--color-texto-oscuro").trim(),
        textoClaro: estilo.getPropertyValue("--color-texto-claro").trim(),
        // luminancia del fondo donde el contraste con el texto oscuro y con el claro es el mismo
        cruce: Math.sqrt((ll + 0.05) * (lo + 0.05)) - 0.05
      };
    }

    function medir() {
      cuadro = 0;
      if (!colores) return;
      var sy = window.pageYOffset || 0;
      paradas = colores.lista.map(function (p) {
        var r = p.el.getBoundingClientRect();
        return { pos: r.top + sy + p.def.f * r.height, color: p.color };
      });
      // La última parada debe poder alcanzarse con la página al final (la línea de referencia no pasa de aquí)
      var alcance = document.documentElement.scrollHeight - window.innerHeight * (1 - LINEA_REFERENCIA) - 40;
      var ultima = paradas[paradas.length - 1];
      if (ultima.pos > alcance) ultima.pos = Math.max(alcance, paradas[paradas.length - 2].pos + 1);
      for (var i = 1; i < paradas.length; i++) if (paradas[i].pos <= paradas[i - 1].pos) paradas[i].pos = paradas[i - 1].pos + 1;
    }

    function pintar() {
      cuadro = 0;
      var sy = window.pageYOffset || 0;
      if (encabezado) {
        var d = sy > UMBRAL_HEADER_PX;
        if (d !== desplazado) {
          desplazado = d;
          encabezado.classList.toggle("is-desplazado", d);
        }
      }
      if (!activo || !paradas) return;
      var r = sy + window.innerHeight * LINEA_REFERENCIA;
      var c;
      if (r <= paradas[0].pos) c = paradas[0].color;
      else if (r >= paradas[paradas.length - 1].pos) c = paradas[paradas.length - 1].color;
      else {
        var i = 1;
        while (paradas[i].pos < r) i++;
        var a = paradas[i - 1], b = paradas[i];
        var t = (r - a.pos) / (b.pos - a.pos);
        c = [0, 1, 2].map(function (k) { return Math.round(a.color[k] + (b.color[k] - a.color[k]) * t); });
      }
      raiz.style.setProperty("--fondo", "rgb(" + c[0] + "," + c[1] + "," + c[2] + ")");
      var nuevo = luminancia(c) > colores.cruce ? "claro" : "oscuro";
      if (nuevo !== tono) {
        tono = nuevo;
        raiz.setAttribute("data-tono", tono);
        raiz.style.setProperty("--texto", tono === "claro" ? colores.textoOscuro : colores.textoClaro);
      }
    }

    function pedir() { if (!cuadro) cuadro = window.requestAnimationFrame(pintar); }
    function remedir() { medir(); pedir(); }

    function activar() {
      if (activo) return;
      colores = colores || cargarColores();
      if (!colores) return;
      activo = true;
      tono = "";
      medir();
      raiz.setAttribute("data-fondo", "continuo");
      pintar();
    }
    function desactivar() {
      if (!activo) return;
      activo = false;
      raiz.removeAttribute("data-fondo");
      raiz.removeAttribute("data-tono");
      raiz.style.removeProperty("--fondo");
      raiz.style.removeProperty("--texto");
    }

    window.addEventListener("scroll", pedir, { passive: true });
    window.addEventListener("resize", remedir);
    window.addEventListener("load", remedir);
    // Las imágenes diferidas cambian la altura de la página: se vuelven a medir las paradas
    if (window.ResizeObserver) new ResizeObserver(remedir).observe(document.body);

    function alCambiarMovimiento() {
      if (reducir && reducir.matches) desactivar();
      else activar();
    }
    if (reducir && reducir.addEventListener) reducir.addEventListener("change", alCambiarMovimiento);
    alCambiarMovimiento();
    pintar();
  }

  /**
   * Gesto de scroll del hero (specs/003, R8, D-26): con la mandíbula cerrada, tras unos segundos sin actividad, una rueda
   * (ratón) o un dedo que desliza (táctil) invita a desplazar sobre el cráneo (.hero__efectos.is-gesto). Como mucho GESTO_MAX_CICLOS veces; la primera interacción de la persona
   * (rueda, toque, tecla, clic) o la apertura lo descartan durante toda la visita. No se muestra con «reducir
   * movimiento», en móvil apaisado bajo, con el hero fuera de pantalla ni con la pestaña oculta.
   */
  function iniciarGestoScroll() {
    var hero = document.getElementById("inicio");
    var efectos = hero && hero.querySelector(".hero__efectos");
    if (!efectos || !window.matchMedia) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia(CONSULTA_APAISADO_BAJO).matches) return;
    var progreso = 0;
    var descartado = false;
    var enPantalla = true;
    var ciclos = 0;
    var temporizador = 0;
    var esperadoPresentacion = false;
    var EVENTOS = ["wheel", "touchstart", "keydown", "pointerdown"];

    function puede() {
      return !descartado && progreso < 0.02 && enPantalla && !document.hidden && ciclos < GESTO_MAX_CICLOS &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
    function cancelar() {
      window.clearTimeout(temporizador);
      efectos.classList.remove("is-gesto");
    }
    function programar(ms) {
      window.clearTimeout(temporizador);
      temporizador = window.setTimeout(mostrar, ms);
    }
    function mostrar() {
      // La pantalla de presentación tapa el hero: el gesto espera a que termine (si no, se gastaría detrás de ella)
      if (document.documentElement.classList.contains("cargando")) { esperadoPresentacion = true; programar(300); return; }
      if (esperadoPresentacion) { esperadoPresentacion = false; programar(GESTO_ESPERA_MS); return; }
      if (!puede()) return;
      ciclos++;
      efectos.classList.add("is-gesto");
      temporizador = window.setTimeout(function () {
        efectos.classList.remove("is-gesto");
        if (puede()) programar(GESTO_PAUSA_MS);
      }, GESTO_DURACION_MS);
    }
    function descartar() {
      if (descartado) return;
      descartado = true;
      cancelar();
      EVENTOS.forEach(function (n) { window.removeEventListener(n, descartar, true); });
    }

    EVENTOS.forEach(function (n) { window.addEventListener(n, descartar, { capture: true, passive: true }); });
    document.addEventListener("dentadura:apertura", function (e) {
      progreso = e.detail ? e.detail.progreso : 0;
      if (progreso >= 0.02) cancelar();
    });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) cancelar();
      else if (puede()) programar(GESTO_ESPERA_MS);
    });
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (entradas) {
        enPantalla = entradas[entradas.length - 1].isIntersecting;
        if (!enPantalla) cancelar();
        else if (puede()) programar(GESTO_ESPERA_MS);
      }).observe(hero);
    }
    programar(document.documentElement.classList.contains("cargando") ? 300 : GESTO_ESPERA_MS);
  }

  /**
   * Menú desplegable del header en móvil y tableta (< 1024 px, D-24): el botón abre y cierra el <nav> de secciones.
   * Se cierra con Escape (devolviendo el foco al botón), al elegir una sección, al pulsar fuera, al pasar a escritorio
   * y al desplazar la página. Sin JavaScript el menú queda oculto y la barra fija inferior sigue dando acceso a «Llamar».
   */
  function iniciarMenuMovil() {
    var encabezado = document.querySelector(".encabezado");
    var boton = encabezado && encabezado.querySelector(".encabezado__menu-boton");
    var nav = encabezado && encabezado.querySelector(".encabezado__nav");
    if (!boton || !nav) return;
    var escritorio = window.matchMedia ? window.matchMedia("(min-width: 1024px)") : null;
    var origenScroll = 0;

    function abierto() { return encabezado.classList.contains("is-abierto"); }
    function fijar(abrir) {
      encabezado.classList.toggle("is-abierto", abrir);
      boton.setAttribute("aria-expanded", abrir ? "true" : "false");
      boton.setAttribute("aria-label", abrir ? "Cerrar el menú de secciones" : "Abrir el menú de secciones");
      origenScroll = window.pageYOffset || 0;
    }

    boton.addEventListener("click", function () { fijar(!abierto()); });
    nav.addEventListener("click", function (e) {
      if (e.target.closest && e.target.closest("a")) fijar(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && abierto()) {
        fijar(false);
        boton.focus();
      }
    });
    document.addEventListener("click", function (e) {
      if (abierto() && !encabezado.contains(e.target)) fijar(false);
    });
    window.addEventListener("scroll", function () {
      if (abierto() && Math.abs((window.pageYOffset || 0) - origenScroll) > 80) fijar(false);
    }, { passive: true });
    if (escritorio && escritorio.addEventListener) {
      escritorio.addEventListener("change", function (e) { if (e.matches) fijar(false); });
    }
  }


  /**
   * Pantalla de presentación (specs/003, D-25; constitución v2.8.0, excepción del principio II). Tapa la página mientras se
   * decide el modo del hero (el 3D tarda en cargar y, mientras, se vería el modo de imágenes). La clase «cargando» de <html>
   * la pone el <head> (solo con JavaScript, sin «reducir movimiento»; también con ancla en la URL). Mientras dura:
   * - la página es inerte (atributo inert: sin foco ni clics) y los gestos de scroll, teclas y clics se detienen en la fase de
   *   captura, antes de que los vea el bloqueo de introducción del hero;
   * - los cuatro pares de dientes entran en ≈ 1,6 s; cuando terminaron Y el hero ya sabe su modo (3D listo, o imágenes), los
   *   dientes se cierran sobre el logo (--cierra) y la pantalla se desvanece (--sale);
   * - si algo no responde, a los PRESENTACION_TOPE_MS se cierra igualmente.
   * Al terminar quita la clase, el inert y los bloqueos, y borra el elemento.
   */
  function iniciarPresentacion() {
    var raiz = document.documentElement;
    var pantalla = document.getElementById("presentacion");
    if (!pantalla || !raiz.classList.contains("cargando")) return;
    var inertes = Array.prototype.slice.call(document.querySelectorAll(".salto-contenido, .encabezado, main, footer, .barra-fija, .whatsapp-flotante"));
    var animacionLista = false;
    var heroListo = raiz.dataset.hero !== "animado";
    var cerrando = false;
    var terminada = false;
    var EVENTOS = ["wheel", "touchstart", "touchmove", "keydown", "click", "pointerdown", "mousedown"];

    var TECLAS = [" ", "Spacebar", "Enter", "Tab", "ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"];
    function detener(e) {
      // Solo las teclas que mueven la página o activan controles; los atajos del navegador (F5, Ctrl+…) pasan
      if (e.type === "keydown" && (e.ctrlKey || e.metaKey || e.altKey || TECLAS.indexOf(e.key) < 0)) return;
      e.stopImmediatePropagation();
      if (e.cancelable) e.preventDefault();
    }
    inertes.forEach(function (el) { el.setAttribute("inert", ""); });
    EVENTOS.forEach(function (n) { window.addEventListener(n, detener, { capture: true, passive: false }); });

    function terminar() {
      if (terminada) return;
      terminada = true;
      EVENTOS.forEach(function (n) { window.removeEventListener(n, detener, true); });
      inertes.forEach(function (el) { el.removeAttribute("inert"); });
      raiz.classList.remove("cargando");
      if (window.performance && performance.mark) performance.mark("presentacion-fin");   // para medir su duración (verificacion.md)
      if (pantalla.parentNode) pantalla.parentNode.removeChild(pantalla);
    }
    function salir() {
      pantalla.classList.add("presentacion--sale");
      window.setTimeout(terminar, PRESENTACION_SALIDA_MS);
    }
    function cerrar() {
      if (cerrando) return;
      cerrando = true;
      pantalla.classList.add("presentacion--cierra");
      window.setTimeout(salir, PRESENTACION_CIERRE_MS);
    }
    function intentar() { if (animacionLista && heroListo) cerrar(); }

    // Los tiempos cuentan desde que la animación arranca (logo y tipografía cargados: clase --lista, que pone el HTML)
    var arrancada = false;
    function arrancar() {
      if (arrancada) return;
      arrancada = true;
      window.setTimeout(function () { animacionLista = true; intentar(); }, PRESENTACION_MIN_MS);
      window.setTimeout(function () { animacionLista = true; heroListo = true; cerrar(); }, PRESENTACION_TOPE_MS);
    }
    if (pantalla.classList.contains("presentacion--lista")) arrancar();
    else {
      pantalla.addEventListener("presentacion:lista", arrancar);
      window.setTimeout(arrancar, 1500);   // por si el script del HTML no llegó a avisar
    }
    // El hero está listo cuando el 3D termina de cargar (animado) o falla (estatico), o si pasa al modo de imágenes
    document.addEventListener("dentadura:estado", function (e) {
      if (e.detail && e.detail.estado && e.detail.estado !== "cargando") {
        // el canvas se funde en ≈ 0,4 s: se deja un instante para que no se vea el paso
        window.setTimeout(function () { heroListo = true; intentar(); }, 350);
      }
    });
    if (window.MutationObserver) {
      new MutationObserver(function () {
        if (raiz.dataset.hero !== "animado") { heroListo = true; intentar(); }
      }).observe(raiz, { attributes: true, attributeFilter: ["data-hero"] });
    }
  }

  /* ---------- 4. Inicio ---------- */
  iniciarPresentacion();
  document.addEventListener("DOMContentLoaded", function () {
    propagarDatosNegocio();
    iniciarDentadura();
    iniciarFondoYEncabezado();
    iniciarGestoScroll();
    iniciarMenuMovil();
  });
})();
