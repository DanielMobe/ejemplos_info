/* ============================================================
   CENTRO DE OPERACIONES DEL ANALISTA — Unidad 1
   Lógica principal de la aplicación
   Todo el estado se guarda en localStorage bajo la clave "coa_state".
   No se usan dependencias externas ni conexión a internet.
   ============================================================ */

(function () {
  "use strict";

  /* ---------------------------------------------------------
     1. CONFIGURACIÓN Y DATOS
  --------------------------------------------------------- */

  const STORAGE_KEY = "coa_state";

  const XP_MINI_RETO = 100;   // XP por cada mini reto correcto
  const XP_PREGUNTA_FINAL = 40; // XP por cada pregunta correcta del desafío final

  const LEVELS = [
    { min: 0, name: "Novato" },
    { min: 100, name: "Explorador" },
    { min: 250, name: "Investigador" },
    { min: 450, name: "Analista Junior" },
    { min: 700, name: "Analista Estratégico" },
  ];
  const MAX_XP = LEVELS[LEVELS.length - 1].min;

  // Preguntas del desafío final (caso de abandono escolar universitario)
  const FINAL_QUESTIONS = [
    {
      tema: "Identificación de un objetivo",
      pregunta: "¿Cuál de las siguientes opciones representa mejor un objetivo de análisis para este caso?",
      opciones: [
        { texto: "Crear una encuesta para los estudiantes.", correcta: false,
          feedback: "Incorrecto. Crear una encuesta es una actividad o herramienta para recolectar datos, no un objetivo de análisis." },
        { texto: "Identificar los factores relacionados con el aumento del abandono escolar.", correcta: true,
          feedback: "Correcto. Expresa con claridad qué se quiere conocer mediante el análisis." },
        { texto: "Reunirse con el equipo directivo.", correcta: false,
          feedback: "Incorrecto. Reunirse es una acción organizativa, pero no define qué se quiere descubrir." },
      ],
    },
    {
      tema: "Evaluación de la situación",
      pregunta: "Antes de analizar, ¿qué dato convierte la alerta de la dirección en un hecho medible?",
      opciones: [
        { texto: "El abandono escolar aumentó un 12% respecto al semestre anterior.", correcta: true,
          feedback: "Correcto. Es una cifra concreta y verificable, no una opinión." },
        { texto: "El abandono escolar es un problema grave.", correcta: false,
          feedback: "Incorrecto. 'Grave' es una opinión; no indica cuánto cambió ni en qué periodo." },
        { texto: "Debemos usar un software de analítica.", correcta: false,
          feedback: "Incorrecto. Eso es una herramienta, no una descripción de la situación actual." },
      ],
    },
    {
      tema: "Identificación de datos necesarios",
      pregunta: "¿Qué información sería más útil recopilar para este análisis?",
      opciones: [
        { texto: "Historial académico y asistencia de los estudiantes que abandonaron.", correcta: true,
          feedback: "Correcto. Es información directamente relacionada con las posibles causas del abandono." },
        { texto: "El color del logo de la universidad.", correcta: false,
          feedback: "Incorrecto. Ese dato no tiene relación con el fenómeno que se quiere entender." },
        { texto: "La cantidad de sillas disponibles en las aulas.", correcta: false,
          feedback: "Incorrecto. Es un dato poco probable de explicar por sí solo el abandono escolar." },
      ],
    },
    {
      tema: "Orden de actividades",
      pregunta: "¿Cuál sería el orden correcto de las primeras actividades del plan de trabajo?",
      opciones: [
        { texto: "Analizar, recopilar datos, preparar datos.", correcta: false,
          feedback: "Incorrecto. No se puede analizar antes de tener los datos recopilados y preparados." },
        { texto: "Recopilar datos, preparar datos, analizar.", correcta: true,
          feedback: "Correcto. Este es el orden lógico: primero se obtienen los datos, luego se preparan y después se analizan." },
        { texto: "Presentar resultados, recopilar datos, analizar.", correcta: false,
          feedback: "Incorrecto. Presentar resultados debe ser la última actividad, no la primera." },
      ],
    },
    {
      tema: "Responsables y tiempos del plan",
      pregunta: "En el plan de trabajo, ¿qué elemento asegura que cada actividad se cumpla a tiempo y alguien se haga cargo?",
      opciones: [
        { texto: "Un responsable y un tiempo definidos para cada actividad.", correcta: true,
          feedback: "Correcto. Sin responsables ni plazos claros, un plan de trabajo no se puede ejecutar ni dar seguimiento." },
        { texto: "Un objetivo muy ambicioso.", correcta: false,
          feedback: "Incorrecto. La ambición del objetivo no garantiza que el plan se cumpla." },
        { texto: "Un informe final extenso.", correcta: false,
          feedback: "Incorrecto. El informe es un resultado, no un mecanismo de organización del trabajo." },
      ],
    },
  ];

  /* ---------------------------------------------------------
     2. ESTADO
  --------------------------------------------------------- */

  function estadoInicial() {
    return {
      nombre: "",
      xp: 0,
      miniRetos: { reto1: false, reto2: false, reto3: false },
      desafioFinal: {
        completado: false,
        correctas: 0,
        respuestas: [], // índice de opción elegida por pregunta
      },
    };
  }

  let estado = cargarEstado();

  function cargarEstado() {
    try {
      const guardado = localStorage.getItem(STORAGE_KEY);
      if (!guardado) return estadoInicial();
      const parsed = JSON.parse(guardado);
      // fusiona con estado inicial por si faltan campos nuevos
      return Object.assign(estadoInicial(), parsed, {
        miniRetos: Object.assign(estadoInicial().miniRetos, parsed.miniRetos || {}),
        desafioFinal: Object.assign(estadoInicial().desafioFinal, parsed.desafioFinal || {}),
      });
    } catch (e) {
      console.warn("No se pudo leer el progreso guardado, se inicia de nuevo.", e);
      return estadoInicial();
    }
  }

  function guardarEstado() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
    } catch (e) {
      console.warn("No se pudo guardar el progreso.", e);
    }
  }

  function otorgarXP(cantidad) {
    estado.xp = Math.min(MAX_XP, estado.xp + cantidad);
    guardarEstado();
    actualizarHUD();
  }

  function obtenerNivel(xp) {
    let actual = LEVELS[0];
    for (const nivel of LEVELS) {
      if (xp >= nivel.min) actual = nivel;
    }
    return actual;
  }

  function obtenerPorcentaje(xp) {
    return Math.min(100, Math.round((xp / MAX_XP) * 100));
  }

  /* ---------------------------------------------------------
     3. NAVEGACIÓN ENTRE PANTALLAS
  --------------------------------------------------------- */

  const screens = document.querySelectorAll(".screen");
  const railLinks = document.querySelectorAll(".rail-link");

  function mostrarPantalla(id, opciones) {
    opciones = opciones || {};
    screens.forEach((s) => s.classList.remove("active"));
    const destino = document.getElementById("screen-" + id);
    if (destino) destino.classList.add("active");

    // sincroniza navegación de la rail (Inicio / Unidad 1 / Mi progreso)
    let navKey = "inicio";
    if (id === "mapa" || id.startsWith("modulo") || id === "final" || id === "resultado") navKey = "mapa";
    if (id === "progreso") navKey = "progreso";

    railLinks.forEach((l) => l.classList.toggle("active", l.dataset.nav === navKey));

    if (!opciones.sinScroll) {
      document.querySelector(".viewport").scrollTop = 0;
      window.scrollTo(0, 0);
    }

    if (id === "mapa") renderMapa();
    if (id === "progreso") renderProgreso();
    if (id === "final") iniciarDesafioFinal();
  }

  railLinks.forEach((link) => {
    link.addEventListener("click", () => {
      const destino = link.dataset.nav;
      if (destino === "inicio") mostrarPantalla("inicio");
      if (destino === "mapa") mostrarPantalla("mapa");
      if (destino === "progreso") mostrarPantalla("progreso");
    });
  });

  document.querySelectorAll("[data-back-to]").forEach((btn) => {
    btn.addEventListener("click", () => mostrarPantalla(btn.dataset.backTo));
  });

  document.querySelectorAll("[data-open-module]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const n = btn.dataset.openModule;
      if (puedeAbrirModulo(n)) mostrarPantalla("modulo-" + n);
    });
  });

  function puedeAbrirModulo(n) {
    if (n === "1") return true;
    if (n === "2") return estado.miniRetos.reto1;
    if (n === "3") return estado.miniRetos.reto2;
    return false;
  }

  /* ---------------------------------------------------------
     4. HUD (barra lateral con nombre / nivel / XP)
  --------------------------------------------------------- */

  function actualizarHUD() {
    const nivel = obtenerNivel(estado.xp);
    const porcentaje = obtenerPorcentaje(estado.xp);

    const nombreMostrado = estado.nombre || "—";

    document.getElementById("hud-nombre").textContent = nombreMostrado;
    document.getElementById("hud-nivel").textContent = nivel.name;
    document.getElementById("hud-xp").textContent = estado.xp + " / " + MAX_XP;
    document.getElementById("hud-bar-fill").style.width = porcentaje + "%";
    document.getElementById("mobile-xp").textContent = estado.xp + " XP";

    document.getElementById("stat-xp").textContent = estado.xp;
    document.getElementById("stat-porcentaje").textContent = porcentaje + "%";
    document.getElementById("stat-nivel").textContent = nivel.name;
  }

  /* ---------------------------------------------------------
     5. PANTALLA DE INICIO — nombre del estudiante
  --------------------------------------------------------- */

  const inputNombre = document.getElementById("input-nombre");
  const btnGuardarNombre = document.getElementById("btn-guardar-nombre");
  const nombreGuardadoMsg = document.getElementById("nombre-guardado-msg");
  const btnIniciarMision = document.getElementById("btn-iniciar-mision");

  if (estado.nombre) inputNombre.value = estado.nombre;

  btnGuardarNombre.addEventListener("click", guardarNombre);
  inputNombre.addEventListener("keydown", (e) => {
    if (e.key === "Enter") guardarNombre();
  });

  function guardarNombre() {
    const valor = inputNombre.value.trim();
    if (!valor) {
      nombreGuardadoMsg.style.color = "var(--danger)";
      nombreGuardadoMsg.textContent = "Escribe un nombre antes de continuar.";
      return;
    }
    estado.nombre = valor;
    guardarEstado();
    actualizarHUD();
    nombreGuardadoMsg.style.color = "var(--success)";
    nombreGuardadoMsg.textContent = "Nombre guardado. ¡Bienvenido/a al centro de operaciones, " + valor + "!";
  }

  btnIniciarMision.addEventListener("click", () => {
    if (!estado.nombre) {
      const valor = inputNombre.value.trim();
      if (valor) {
        estado.nombre = valor;
        guardarEstado();
        actualizarHUD();
      }
    }
    mostrarPantalla("mapa");
  });

  /* ---------------------------------------------------------
     6. MAPA DE MISIÓN
  --------------------------------------------------------- */

  function renderMapa() {
    // Módulo 1: siempre disponible
    actualizarTarjetaModulo(1, true, estado.miniRetos.reto1);
    // Módulo 2: requiere reto 1
    actualizarTarjetaModulo(2, estado.miniRetos.reto1, estado.miniRetos.reto2);
    // Módulo 3: requiere reto 2
    actualizarTarjetaModulo(3, estado.miniRetos.reto2, estado.miniRetos.reto3);

    const todosCompletos = estado.miniRetos.reto1 && estado.miniRetos.reto2 && estado.miniRetos.reto3;
    const btnFinal = document.getElementById("btn-ir-final");
    const descFinal = document.getElementById("final-card-desc");

    if (estado.desafioFinal.completado) {
      btnFinal.disabled = false;
      btnFinal.textContent = "Ver resultado de la operación";
      descFinal.textContent = "Ya completaste esta operación. Puedes revisar tu resultado cuando quieras.";
    } else if (todosCompletos) {
      btnFinal.disabled = false;
      btnFinal.textContent = "Entrar a la operación";
      descFinal.textContent = "Los tres módulos están completos. Es momento de aplicar lo aprendido en un caso real.";
    } else {
      btnFinal.disabled = true;
      btnFinal.textContent = "Entrar a la operación";
      descFinal.textContent = "Completa los tres módulos para desbloquear esta operación.";
    }
  }

  function actualizarTarjetaModulo(n, disponible, completado) {
    const card = document.getElementById("card-modulo-" + n);
    const status = document.getElementById("status-modulo-" + n);
    card.classList.toggle("is-locked", !disponible && !completado);

    if (completado) {
      status.textContent = "Completado";
      status.className = "module-status done";
    } else if (disponible) {
      status.textContent = "Disponible";
      status.className = "module-status available";
    } else {
      status.textContent = "Bloqueado";
      status.className = "module-status";
    }
  }

  document.getElementById("btn-ir-final").addEventListener("click", () => {
    if (estado.desafioFinal.completado) {
      mostrarResultadoFinal();
      mostrarPantalla("resultado");
    } else {
      mostrarPantalla("final");
    }
  });

  /* ---------------------------------------------------------
     7. MINI RETOS (módulos 1, 2 y 3)
  --------------------------------------------------------- */

  function configurarMiniReto(retoId, siguienteBotonId, siguienteModulo) {
    const panel = document.getElementById(retoId === "reto1" ? "reto-1" : retoId === "reto2" ? "reto-2" : "reto-3");
    const opciones = panel.querySelectorAll(".reto-option");
    const feedback = panel.querySelector(".reto-feedback");
    const siguienteBtn = siguienteBotonId ? document.getElementById(siguienteBotonId) : null;

    // Si ya estaba completado, reflejarlo visualmente al cargar
    if (estado.miniRetos[retoId]) {
      opciones.forEach((op) => {
        op.disabled = true;
        if (op.dataset.correct === "true") op.classList.add("is-correct");
      });
      feedback.textContent = "Ya completaste este mini reto. Puedes avanzar al siguiente módulo.";
      feedback.className = "reto-feedback ok";
      if (siguienteBtn) siguienteBtn.disabled = false;
    }

    opciones.forEach((op) => {
      op.addEventListener("click", () => {
        if (op.disabled && estado.miniRetos[retoId]) return; // ya resuelto
        const esCorrecta = op.dataset.correct === "true";

        if (esCorrecta) {
          opciones.forEach((o) => { o.disabled = true; });
          op.classList.add("is-correct");
          feedback.textContent = op.dataset.feedback;
          feedback.className = "reto-feedback ok";

          if (!estado.miniRetos[retoId]) {
            estado.miniRetos[retoId] = true;
            otorgarXP(XP_MINI_RETO);
            guardarEstado();
          }
          if (siguienteBtn) siguienteBtn.disabled = false;
        } else {
          op.classList.add("is-incorrect");
          feedback.textContent = op.dataset.feedback;
          feedback.className = "reto-feedback bad";
        }
      });
    });
  }

  configurarMiniReto("reto1", "btn-continuar-modulo-2", 2);
  configurarMiniReto("reto2", "btn-continuar-modulo-3", 3);
  configurarMiniReto("reto3", null, null);

  /* ---------------------------------------------------------
     8. DESAFÍO FINAL
  --------------------------------------------------------- */

  let preguntaActual = 0;
  let respuestasSesion = [];

  function iniciarDesafioFinal() {
    if (estado.desafioFinal.completado) {
      mostrarResultadoFinal();
      mostrarPantalla("resultado", { sinScroll: true });
      return;
    }
    preguntaActual = 0;
    respuestasSesion = [];
    renderPreguntaFinal();
  }

  function renderPreguntaFinal() {
    const total = FINAL_QUESTIONS.length;
    const contenedor = document.getElementById("final-question-container");
    const data = FINAL_QUESTIONS[preguntaActual];

    document.getElementById("final-progress-label").textContent =
      "Pregunta " + (preguntaActual + 1) + " de " + total;
    document.getElementById("final-progress-fill").style.width =
      Math.round((preguntaActual / total) * 100) + "%";

    const opcionesHTML = data.opciones
      .map((op, i) => `<button class="reto-option" data-index="${i}">${letraOpcion(i)}. ${op.texto}</button>`)
      .join("");

    contenedor.innerHTML = `
      <div class="final-question-card">
        <p class="final-question-title mono">${data.tema}</p>
        <p class="final-question-text">${data.pregunta}</p>
        <div class="reto-options">${opcionesHTML}</div>
        <p class="reto-feedback" id="final-feedback"></p>
        <div class="screen-actions" style="margin-top:18px;">
          <span></span>
          <button class="btn btn-primary" id="btn-siguiente-pregunta" disabled>
            ${preguntaActual === total - 1 ? "Ver resultado" : "Siguiente pregunta"}
          </button>
        </div>
      </div>
    `;

    const opcionesBtns = contenedor.querySelectorAll(".reto-option");
    const feedback = document.getElementById("final-feedback");
    const btnSiguiente = document.getElementById("btn-siguiente-pregunta");
    let respondido = false;

    opcionesBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        if (respondido) return;
        respondido = true;
        const idx = parseInt(btn.dataset.index, 10);
        const opcion = data.opciones[idx];

        opcionesBtns.forEach((b) => (b.disabled = true));

        if (opcion.correcta) {
          btn.classList.add("is-correct");
          feedback.textContent = opcion.feedback;
          feedback.className = "reto-feedback ok";
        } else {
          btn.classList.add("is-incorrect");
          feedback.textContent = opcion.feedback;
          feedback.className = "reto-feedback bad";
          const correctaBtn = contenedor.querySelector('[data-index="' + data.opciones.findIndex(o => o.correcta) + '"]');
          if (correctaBtn) correctaBtn.classList.add("is-correct");
        }

        respuestasSesion[preguntaActual] = { indice: idx, correcta: opcion.correcta };
        btnSiguiente.disabled = false;
      });
    });

    btnSiguiente.addEventListener("click", () => {
      if (preguntaActual < total - 1) {
        preguntaActual++;
        renderPreguntaFinal();
      } else {
        finalizarDesafio();
      }
    });
  }

  function letraOpcion(i) {
    return ["A", "B", "C", "D", "E"][i] || String(i + 1);
  }

  function finalizarDesafio() {
    const total = FINAL_QUESTIONS.length;
    document.getElementById("final-progress-fill").style.width = "100%";

    const correctas = respuestasSesion.filter((r) => r && r.correcta).length;
    const xpGanada = correctas * XP_PREGUNTA_FINAL;

    estado.desafioFinal.completado = true;
    estado.desafioFinal.correctas = correctas;
    estado.desafioFinal.respuestas = respuestasSesion.map((r) => (r ? r.indice : -1));
    otorgarXP(xpGanada);
    guardarEstado();

    mostrarResultadoFinal(xpGanada);
    mostrarPantalla("resultado");
  }

  function mostrarResultadoFinal(xpGanadaSesion) {
    const total = FINAL_QUESTIONS.length;
    const correctas = estado.desafioFinal.correctas;
    const porcentaje = Math.round((correctas / total) * 100);
    const nivel = obtenerNivel(estado.xp);

    document.getElementById("result-correctas").textContent = correctas + "/" + total;
    document.getElementById("result-porcentaje").textContent = porcentaje + "%";
    document.getElementById("result-xp").textContent =
      "+" + (typeof xpGanadaSesion === "number" ? xpGanadaSesion : correctas * XP_PREGUNTA_FINAL) + " XP";
    document.getElementById("result-nivel").textContent = nivel.name;

    let mensaje;
    if (porcentaje === 100) {
      mensaje = "Excelente trabajo. Dominas los tres temas de la unidad: definiste el objetivo con precisión, evaluaste la situación con hechos medibles y ordenaste el plan de trabajo correctamente.";
    } else if (porcentaje >= 60) {
      mensaje = "Buen desempeño. Comprendes la mayoría de los conceptos. Repasa los módulos donde tuviste errores para reforzar los puntos más débiles.";
    } else {
      mensaje = "Necesitas repasar los temas de la unidad. Vuelve a los módulos, revisa los mini retos y vuelve a intentar la operación cuando te sientas listo/a.";
    }
    document.getElementById("result-mensaje").textContent = mensaje;
  }

  /* ---------------------------------------------------------
     9. MI PROGRESO
  --------------------------------------------------------- */

  function renderProgreso() {
    const nivel = obtenerNivel(estado.xp);
    const porcentaje = obtenerPorcentaje(estado.xp);

    document.getElementById("prog-nombre").textContent = estado.nombre || "—";
    document.getElementById("prog-nivel").textContent = nivel.name;
    document.getElementById("prog-xp").textContent = estado.xp + " / " + MAX_XP;
    document.getElementById("prog-porcentaje").textContent = porcentaje + "%";
    document.getElementById("prog-bar-fill").style.width = porcentaje + "%";

    const lista = document.getElementById("progreso-retos-list");
    const nombres = {
      reto1: "Módulo 01 · Determinación de objetivos",
      reto2: "Módulo 02 · Evaluación de la situación",
      reto3: "Módulo 03 · Diseño de plan de trabajo",
    };
    lista.innerHTML = Object.keys(nombres)
      .map((key) => {
        const hecho = estado.miniRetos[key];
        return `<li><span>${nombres[key]}</span><span class="${hecho ? "tag-done" : "tag-pending"} mono">${hecho ? "Completado" : "Pendiente"}</span></li>`;
      })
      .join("");

    const finalStatus = document.getElementById("progreso-final-status");
    if (estado.desafioFinal.completado) {
      finalStatus.textContent =
        "Completado — " + estado.desafioFinal.correctas + "/" + FINAL_QUESTIONS.length + " preguntas correctas.";
      finalStatus.style.color = "var(--success)";
    } else {
      finalStatus.textContent = "Sin completar";
      finalStatus.style.color = "var(--text-faint)";
    }
  }

  /* ---------------------------------------------------------
     10. REINICIAR PROGRESO (con confirmación)
  --------------------------------------------------------- */

  const modalOverlay = document.getElementById("modal-overlay");

  document.getElementById("btn-reiniciar").addEventListener("click", () => {
    modalOverlay.classList.add("active");
  });
  document.getElementById("modal-cancelar").addEventListener("click", () => {
    modalOverlay.classList.remove("active");
  });
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) modalOverlay.classList.remove("active");
  });
  document.getElementById("modal-confirmar").addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    estado = estadoInicial();
    modalOverlay.classList.remove("active");
    inputNombre.value = "";
    nombreGuardadoMsg.textContent = "";
    // vuelve a dejar los mini retos y botones en su estado inicial visualmente
    document.querySelectorAll(".reto-option").forEach((op) => {
      op.disabled = false;
      op.classList.remove("is-correct", "is-incorrect");
    });
    document.querySelectorAll(".reto-feedback").forEach((f) => {
      f.textContent = "";
      f.className = "reto-feedback";
    });
    document.getElementById("btn-continuar-modulo-2").disabled = true;
    document.getElementById("btn-continuar-modulo-3").disabled = true;
    actualizarHUD();
    mostrarPantalla("inicio");
  });

  /* ---------------------------------------------------------
     11. ARRANQUE
  --------------------------------------------------------- */

  function iniciar() {
    actualizarHUD();
    mostrarPantalla("inicio", { sinScroll: true });

    // secuencia de arranque (una sola vez, se puede omitir con reduced-motion)
    const boot = document.getElementById("boot-screen");
    setTimeout(() => boot.classList.add("hidden"), 1500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
