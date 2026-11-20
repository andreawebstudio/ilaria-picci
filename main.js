(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Anno dinamico */
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  /* Header: bordo allo scroll */
  var header = document.querySelector(".site-header");
  var onScroll = function () { header.classList.toggle("scrolled", window.scrollY > 8); };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Menu mobile */
  var toggle = document.querySelector(".menu-toggle");
  var nav = document.getElementById("nav");
  function setMenu(open) {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Chiudi il menu" : "Apri il menu");
    nav.classList.toggle("open", open);
    document.body.classList.toggle("menu-open", open);
  }
  toggle.addEventListener("click", function () {
    setMenu(toggle.getAttribute("aria-expanded") !== "true");
  });
  nav.addEventListener("click", function (e) {
    if (e.target.closest("a")) setMenu(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && nav.classList.contains("open")) { setMenu(false); toggle.focus(); }
  });
  window.matchMedia("(min-width: 1024px)").addEventListener("change", function (m) { if (m.matches) setMenu(false); });

  /* Voce di menu attiva */
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav ul a[href^="#"]'));
  if ("IntersectionObserver" in window) {
    var map = {};
    links.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && map[en.target.id]) {
          links.forEach(function (l) { l.classList.remove("active"); l.removeAttribute("aria-current"); });
          map[en.target.id].classList.add("active");
          map[en.target.id].setAttribute("aria-current", "true");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) spy.observe(s); });
  }

  /* Comparsa delicata */
  var reveals = document.querySelectorAll(".reveal");
  if (!reduce && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("visible"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("visible"); });
  }

  /* Come funziona: la linea si riempie con lo scroll e attiva i passaggi */
  var journey = document.getElementById("journey");
  if (journey) {
    var steps = Array.prototype.slice.call(journey.querySelectorAll(".step"));
    var line = journey.querySelector(".journey-line");
    var ticking = false;
    var updateJourney = function () {
      ticking = false;
      var vh = window.innerHeight;
      var r = journey.getBoundingClientRect();
      var lr = line.getBoundingClientRect();
      var vertical = lr.height > lr.width;
      var p;
      if (reduce) p = 1;
      else if (vertical) p = (vh * 0.62 - lr.top) / Math.max(lr.height, 1);
      else p = (vh * 0.78 - r.top) / (vh * 0.42);
      p = Math.min(1, Math.max(0, p));
      journey.style.setProperty("--p", p.toFixed(4));
      steps.forEach(function (s) {
        var d = s.querySelector(".step-dot").getBoundingClientRect();
        var pos = vertical
          ? (d.top + d.height / 2 - lr.top) / Math.max(lr.height, 1)
          : (d.left + d.width / 2 - lr.left) / Math.max(lr.width, 1);
        s.classList.toggle("active", p >= pos - 0.02);
      });
    };
    var req = function () { if (!ticking) { ticking = true; requestAnimationFrame(updateJourney); } };
    window.addEventListener("scroll", req, { passive: true });
    window.addEventListener("resize", req);
    updateJourney();
  }

  /* FAQ accordion: una risposta aperta per volta */
  var qs = Array.prototype.slice.call(document.querySelectorAll(".faq-q"));
  function closePanel(btn) {
    var panel = document.getElementById(btn.getAttribute("aria-controls"));
    btn.setAttribute("aria-expanded", "false");
    if (reduce) { panel.hidden = true; return; }
    panel.style.height = panel.scrollHeight + "px";
    requestAnimationFrame(function () { panel.style.height = "0px"; });
    panel.addEventListener("transitionend", function te() {
      panel.hidden = true; panel.style.height = ""; panel.removeEventListener("transitionend", te);
    });
  }
  function openPanel(btn) {
    var panel = document.getElementById(btn.getAttribute("aria-controls"));
    btn.setAttribute("aria-expanded", "true");
    panel.hidden = false;
    if (reduce) return;
    var h = panel.scrollHeight;
    panel.style.height = "0px";
    requestAnimationFrame(function () { panel.style.height = h + "px"; });
    panel.addEventListener("transitionend", function te() {
      panel.style.height = ""; panel.removeEventListener("transitionend", te);
    });
  }
  qs.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var isOpen = btn.getAttribute("aria-expanded") === "true";
      qs.forEach(function (o) { if (o !== btn && o.getAttribute("aria-expanded") === "true") closePanel(o); });
      if (isOpen) closePanel(btn); else openPanel(btn);
    });
  });

  /* Form contatti: nessun backend configurato.
     Alla conferma apre il client di posta con il messaggio precompilato (mailto). */
  var form = document.getElementById("contact-form");
  var err = document.getElementById("form-error");
  var note = document.getElementById("form-note");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var nome = form.nome, email = form.email, msg = form.messaggio, privacy = form.privacy;
    var problems = [];
    [nome, email, msg].forEach(function (f) { f.removeAttribute("aria-invalid"); });
    if (!nome.value.trim()) { problems.push("il nome"); nome.setAttribute("aria-invalid", "true"); }
    if (!email.value.trim() || !email.checkValidity()) { problems.push("un indirizzo email valido"); email.setAttribute("aria-invalid", "true"); }
    if (!msg.value.trim()) { problems.push("il messaggio"); msg.setAttribute("aria-invalid", "true"); }
    if (!privacy.checked) { problems.push("la presa visione della Privacy Policy"); }
    if (problems.length) {
      err.textContent = "Per procedere inserisci " + problems.join(", ") + ".";
      err.hidden = false;
      var first = form.querySelector('[aria-invalid="true"]') || privacy;
      first.focus();
      return;
    }
    err.hidden = true;
    var body = "Nome: " + nome.value.trim() +
      "\nEmail: " + email.value.trim() +
      (form.telefono.value.trim() ? "\nTelefono: " + form.telefono.value.trim() : "") +
      "\n\n" + msg.value.trim();
    var href = "mailto:ilariapicci.psicologa@gmail.com" +
      "?subject=" + encodeURIComponent("Richiesta di consulenza dal sito — " + nome.value.trim()) +
      "&body=" + encodeURIComponent(body);
    window.location.href = href;
    note.hidden = false;
    note.innerHTML = "Se il programma di posta non si è aperto, puoi scrivere direttamente a " +
      '<a href="mailto:ilariapicci.psicologa@gmail.com">ilariapicci.psicologa@gmail.com</a> ' +
      'oppure chiamare il <a href="tel:+393275596032">327 559 6032</a>. La richiesta viene inviata solo quando confermi l’invio dalla tua email.';
  });
})();
