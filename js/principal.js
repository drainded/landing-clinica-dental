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
  var HOLGURA_TOQUE_PX = 14;     // el dedo es menos preciso que el ratón: se amplía así el área de toque
  var PAUSA_CURSOR_MS = 80;      // mínimo entre comprobaciones de «el ratón está sobre el modelo» (cambia el cursor)
  var ELIPSE_RESPALDO = { ancho: 0.42, alto: 0.45 }; // área de clic mientras el 3D no ha cargado (fracción de la figura)
  var CONSULTA_APAISADO_BAJO = "(orientation: landscape) and (max-height: 500px)"; // móvil en horizontal: hero normal, sin bloqueo
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

  /**
   * Bloqueo de introducción del hero (constitución v2.3.0, principio II).
   *
   * Al cargar la página en lo alto, las primeras acciones de scroll (rueda, arrastre táctil o
   * teclas) NO desplazan la página: avanzan la apertura de la mandíbula (progreso 0–1), con una
   * velocidad máxima, de modo que un gesto largo no se salte la animación. Al llegar a 1 el
   * bloqueo se libera y la página se desplaza con normalidad.
   *
   * Salidas de emergencia (nunca debe atrapar a nadie): Tab, clic en un ancla interna, cualquier
   * desplazamiento externo (barra de scroll, buscar en la página, ancla en la URL), pasar a modo
   * estático (reducir movimiento, 3D fallido) o cargar la página ya desplazada. Los accesos de
   * contacto (barra fija, botón flotante, teléfono) no dependen del scroll y siguen pulsables.
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
      document.addEventListener("dentadura:estado", alEstado);
      if (progreso !== objetivo) {
        ultimo = performance.now();
        cuadro = window.requestAnimationFrame(avanzar);
      } else {
        publicar();
      }
    }

    // definitivo = true: no volver a rearmar el bloqueo (modo estático)
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
        document.removeEventListener("dentadura:estado", alEstado);
        raiz.removeAttribute("data-bloqueo");
        // Si se libera antes de terminar, el módulo 3D completa la apertura a su ritmo
        objetivo = progreso = 1;
        publicar();
      }
      if (definitivo === true) dejarDeVigilar();
      else vigilar();
    }

    function alEstado(e) {
      if (e.detail && e.detail.estado === "estatico") liberar(true);
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
    function alClicFigura(e) {
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
      figura.addEventListener("pointermove", alMoverSobreFigura, { passive: true });
      figura.addEventListener("pointerleave", alSalirDeFigura, { passive: true });
      figura.addEventListener("keydown", alTeclearFigura);
      document.addEventListener("dentadura:estado", alEstadoClic);
    }
    function desactivarClic() {
      if (!figura || !clicActivo) return;
      clicActivo = false;
      ["role", "tabindex", "aria-label", "aria-pressed"].forEach(function (a) { figura.removeAttribute(a); });
      figura.removeEventListener("click", alClicFigura);
      figura.removeEventListener("pointermove", alMoverSobreFigura);
      figura.removeEventListener("pointerleave", alSalirDeFigura);
      figura.classList.remove("is-sobre-modelo");
      figura.removeEventListener("keydown", alTeclearFigura);
      document.removeEventListener("dentadura:estado", alEstadoClic);
    }
    function alEstadoClic(e) {
      if (e.detail && e.detail.estado === "estatico") liberarParaSiempre();
    }

    function liberarParaSiempre() { liberar(true); desactivarClic(); }

    if (raiz.dataset.hero !== "animado") return liberarParaSiempre;

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
   * Hero estático con transición por scroll (specs/002-hero-estatico-scroll, contrato §5).
   *
   * Solo con html[data-transicion] (ahorro de datos o equipo lento, sin movimiento reducido): el hero queda
   * anclado (CSS, position: sticky) durante un recorrido de scroll y esta función convierte la posición de scroll
   * en --apertura (0–1), igual que el bloqueo de introducción lo hace en el modo 3D, de modo que el CSS funde el
   * cráneo cerrado con el abierto y revela el eslogan y el botón. No intercepta ni bloquea el scroll nativo.
   *
   * apertura = acotar((scrollY − inicio) / D), con D = alto del hero − alto del escenario (la distancia que dura el
   * anclaje) e inicio = el scroll en el que el escenario empieza a anclarse (0 en escritorio, donde el encabezado ya
   * es fijo; el alto del encabezado en móvil, donde se va con el scroll).
   * El valor mostrado se acerca al objetivo con el mismo suavizado exponencial del 3D, así que Fin, anclas o la
   * inercia no producen saltos. Devuelve la función que la desactiva.
   */
  function controlarTransicionScroll(hero) {
    var escenario = hero.querySelector(".hero__escenario");
    if (!escenario || !document.documentElement.hasAttribute("data-transicion")) return function () {};

    var distancia = 1;
    var inicio = 0;
    var objetivo = 0;
    var mostrado = 0;
    var publicado = -1;
    var ultimo = 0;
    var cuadro = 0;
    var enPantalla = true;
    var activo = true;

    function acotar(x) { return Math.min(1, Math.max(0, x)); }

    function publicar() {
      if (Math.abs(mostrado - publicado) >= 0.0005) {
        publicado = mostrado;
        hero.style.setProperty("--apertura", mostrado.toFixed(3));
      }
      // Histéresis para que el botón no parpadee en el umbral
      if (mostrado > UMBRAL_REVELADO_ON) hero.setAttribute("data-revelado", "");
      else if (mostrado < UMBRAL_REVELADO_OFF) hero.removeAttribute("data-revelado");
    }

    function avanzar(t) {
      cuadro = 0;
      if (!activo) return;
      var dt = Math.min((t - ultimo) / 1000, 0.1);
      ultimo = t;
      mostrado += (objetivo - mostrado) * (1 - Math.exp(-12 * dt));
      if (Math.abs(objetivo - mostrado) < 0.0005) mostrado = objetivo;
      publicar();
      if (mostrado !== objetivo && enPantalla) cuadro = window.requestAnimationFrame(avanzar);
    }

    function agendar() {
      if (cuadro || !enPantalla || !activo) return;
      ultimo = performance.now();
      cuadro = window.requestAnimationFrame(avanzar);
    }

    function medir() {
      var arriba = parseFloat(window.getComputedStyle(escenario).top) || 0;   // donde se ancla el escenario
      distancia = Math.max(1, hero.offsetHeight - escenario.offsetHeight);
      inicio = hero.getBoundingClientRect().top + window.pageYOffset - arriba;
      objetivo = acotar((window.pageYOffset - inicio) / distancia);
    }

    function alDesplazar() {
      objetivo = acotar((window.pageYOffset - inicio) / distancia);
      agendar();
    }

    function alCambiarTamano() {
      medir();
      agendar();
    }

    // Al cargar (recarga ya desplazada, ancla en la URL) se muestra directamente el estado que corresponde
    medir();
    mostrado = objetivo;
    publicar();

    window.addEventListener("scroll", alDesplazar, { passive: true });
    var observadorTamano = window.ResizeObserver ? new window.ResizeObserver(alCambiarTamano) : null;
    if (observadorTamano) { observadorTamano.observe(hero); observadorTamano.observe(escenario); }
    var observadorVisible = window.IntersectionObserver ? new window.IntersectionObserver(function (entradas) {
      enPantalla = entradas[entradas.length - 1].isIntersecting;
      if (enPantalla) { medir(); agendar(); }
    }) : null;
    if (observadorVisible) observadorVisible.observe(hero);

    return function detener() {
      activo = false;
      if (cuadro) { window.cancelAnimationFrame(cuadro); cuadro = 0; }
      window.removeEventListener("scroll", alDesplazar);
      if (observadorTamano) observadorTamano.disconnect();
      if (observadorVisible) observadorVisible.disconnect();
    };
  }

  /**
   * Cráneo abierto del hero estático (contrato §1 y §5): el <img> de .hero__abierto arranca con un GIF vacío y sus
   * <source> llevan un media que solo casa con movimiento reducido. Aquí se cambia ese media por el de data-media
   * y el navegador elige y pide la imagen real. Cuándo (motivo): "transicion" → tras load y con el navegador libre
   * (con ahorro de datos, en el primer scroll); "3d" → solo si la persona empieza a abrir la mandíbula antes de que
   * el 3D esté listo (así el eslogan no aparece sobre un cráneo todavía cerrado); "inmediato" → ya. Si la imagen real falla, data-abierto-fallo deja
   * el póster cerrado con el eslogan y el botón siempre visibles. El onload del <img> marca data-abierto-listo.
   */
  var imagenAbiertaActivada = false;

  function activarImagenAbierta(hero) {
    if (imagenAbiertaActivada) return;
    imagenAbiertaActivada = true;
    var fuentes = hero.querySelectorAll(".hero__abierto source");
    for (var i = 0; i < fuentes.length; i++) fuentes[i].media = fuentes[i].getAttribute("data-media") || "all";
  }

  function habilitarImagenAbierta(hero, motivo) {
    var imagen = hero.querySelector(".hero__abierto img");
    if (imagen && !imagen.getAttribute("data-vigilada")) {
      imagen.setAttribute("data-vigilada", "");
      imagen.addEventListener("error", function () {
        if (imagen.currentSrc && imagen.currentSrc.slice(0, 5) !== "data:") {
          document.documentElement.setAttribute("data-abierto-fallo", "");
        }
      });
    }
    function activar() { activarImagenAbierta(hero); }
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
    } else if (motivo === "3d") {
      var alApertura = function (e) {
        if (!e.detail || !(e.detail.progreso > 0)) return;
        document.removeEventListener("dentadura:apertura", alApertura);
        if (!document.querySelector(".hero__figura.is-3d")) activar();   // con el 3D ya listo no hace falta
      };
      document.addEventListener("dentadura:apertura", alApertura);
    } else if (navigator.connection && navigator.connection.saveData) {
      window.addEventListener("scroll", activar, { once: true, passive: true });
    } else {
      cuandoLibre();
    }
  }

  /**
   * Modo estático (sin 3D): con data-transicion el scroll gobierna la apertura; en el resto, composición final
   * (cráneo abierto, eslogan y botón en la boca, sin animación). Si con la transición activa la persona pide
   * «reducir movimiento» o el móvil pasa a horizontal bajo (el hero no cabe en pantalla), se pasa a la composición
   * final: se detiene el control por scroll, se quita data-transicion y --apertura queda en 1.
   */
  function iniciarEstatico() {
    var raiz = document.documentElement;
    var hero = document.getElementById("inicio");
    if (!hero || !raiz.hasAttribute("data-transicion")) return;
    var detener = null;

    function aComposicionFinal() {
      if (detener) { detener(); detener = null; }
      raiz.removeAttribute("data-transicion");
      hero.style.setProperty("--apertura", "1");
      hero.setAttribute("data-revelado", "");
      habilitarImagenAbierta(hero, "inmediato");
    }

    if (window.matchMedia) {
      var alCambiar = function (e) { if (e.matches) aComposicionFinal(); };
      var reducir = window.matchMedia("(prefers-reduced-motion: reduce)");
      var apaisado = window.matchMedia(CONSULTA_APAISADO_BAJO);
      if (reducir.addEventListener) reducir.addEventListener("change", alCambiar);
      if (apaisado.addEventListener) apaisado.addEventListener("change", alCambiar);
      if (apaisado.matches) { aComposicionFinal(); return; }
    }
    detener = controlarTransicionScroll(hero);
    habilitarImagenAbierta(hero, "transicion");
  }

  function iniciarDentadura() {
    var raiz = document.documentElement;
    // Solo desarrollo (specs/002-hero-estatico-scroll, contrato §5): ?captura carga el 3D sin bloqueo ni espera
    // y expone window.__craneo para generar las imágenes del hero estático (referencias/herramientas/hero.mjs)
    var captura = /[?&]captura(?:[&=]|$)/.test(window.location.search);
    if (captura) raiz.dataset.hero = "animado";
    if (raiz.dataset.hero !== "animado" || (!captura && esEquipoModesto())) {
      raiz.dataset.hero = "estatico";
      iniciarEstatico();
      return;
    }

    var hero = document.getElementById("inicio");
    var figura = hero && hero.querySelector(".hero__figura");
    if (!figura) {
      raiz.dataset.hero = "estatico";
      return;
    }

    var liberarBloqueo = captura ? function () {} : publicarApertura(hero);

    // Si el 3D falla (sin WebGL, modelo, contexto perdido, FPS bajos) el hero pasa a la composición final: la
    // apertura queda en 1 (lo hace el bloqueo al liberarse) y se pide ya el cráneo abierto; mientras llega se
    // ve el póster cerrado. No se reconfigura el hero (sin anclaje ni recorrido) para no mover nada.
    document.addEventListener("dentadura:estado", function (e) {
      if (e.detail && e.detail.estado === "estatico") habilitarImagenAbierta(hero, "inmediato");
    });
    if (!captura) habilitarImagenAbierta(hero, "3d");

    var nivel = elegirNivel();
    var rutaModelo = nivel === "ligero" ? RUTA_MODELO_LIGERO : RUTA_MODELO_COMPLETO;

    var instancia = null;

    // Si la persona activa «reducir movimiento» con la página abierta, se vuelve al póster
    if (window.matchMedia) {
      var reducir = window.matchMedia("(prefers-reduced-motion: reduce)");
      var alCambiar = function (e) {
        if (!e.matches) return;
        if (instancia) instancia.destruir();
        detectorModelo = null;
        raiz.dataset.hero = "estatico";
        liberarBloqueo();
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
        });
    }

    // Después de la carga y con el navegador libre, para no competir con el LCP (el póster)
    // ni con el resto de la página: compilar shaders y leer el modelo ocupa el hilo principal.
    function programarCarga() {
      window.setTimeout(function () {
        if (window.requestIdleCallback) window.requestIdleCallback(cargar);
        else cargar();
      }, RETRASO_3D_TRAS_CARGA_MS);
    }
    if (captura) cargar();
    else if (document.readyState === "complete") programarCarga();
    else window.addEventListener("load", programarCarga, { once: true });
  }

  /* ---------- 4. Inicio ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    propagarDatosNegocio();
    iniciarDentadura();
  });
})();
