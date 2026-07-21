/**
 * SOCOIM — main.js
 * Vanilla JS + GSAP (cargado desde CDN)
 * IIFE pattern, no import/export
 * v20260516
 */
(function () {
  'use strict';

  // ── Utilidad segura para no romper todo si falla un módulo ──
  function safe(fn, name) {
    try { fn(); }
    catch (e) { console.warn('[SOCOIM] ' + name + ' falló:', e.message); }
  }

  // ── Esperar DOM ────────────────────────────────────────────
  function onReady(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  // Estado compartido: la vista de catálogo se puede cerrar desde initAnchors
  // (ej. al navegar a otra sección del sitio mientras está abierta)
  var productsView = {
    isOpen: function () { return false; },
    close: function () {}
  };

  onReady(function () {
    safe(initSplash,    'splash');
    safe(initNavbar,    'navbar');
    safe(initReveal,    'reveal');
    safe(initGSAP,      'gsap');
    safe(initCarousel,  'carousel');
    safe(initFilter,    'filter');
    safe(initProductModal, 'productModal');
    safe(initProductsView, 'productsView');
    safe(initForm,      'form');
    safe(initAnchors,   'anchors');
    safe(initSafetyNet, 'safetyNet');
  });

  // ══════════════════════════════════════════════════
  // SPLASH — ocultar con JS además del CSS
  // ══════════════════════════════════════════════════
  function initSplash() {
    var splash = document.getElementById('splash');
    if (!splash) return;

    // CSS animation dura ~3.4s — JS refuerza con 3600ms
    setTimeout(function () {
      splash.style.opacity = '0';
      splash.style.pointerEvents = 'none';
      setTimeout(function () {
        splash.style.display = 'none';
      }, 700);
    }, 3000);
  }

  // ══════════════════════════════════════════════════
  // NAVBAR — scroll + mobile toggle
  // ══════════════════════════════════════════════════
  function initNavbar() {
    var navbar   = document.getElementById('navbar');
    var toggle   = document.getElementById('navToggle');
    var navLinks = document.getElementById('navLinks');
    if (!navbar) return;

    // Scroll state
    function onScroll() {
      if (window.scrollY > 40) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Mobile toggle
    if (toggle && navLinks) {
      toggle.addEventListener('click', function () {
        var open = navLinks.classList.toggle('open');
        toggle.setAttribute('aria-expanded', open);
      });

      // Cerrar al hacer clic en link
      navLinks.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () {
          navLinks.classList.remove('open');
          toggle.setAttribute('aria-expanded', false);
        });
      });
    }

    // Animar entrada del navbar
    navbar.style.opacity = '0';
    navbar.style.transform = 'translateY(-10px)';
    setTimeout(function () {
      navbar.style.transition = 'opacity 0.5s ease, transform 0.5s ease, background 0.4s ease, padding 0.4s ease, border-color 0.4s ease';
      navbar.style.opacity = '1';
      navbar.style.transform = 'translateY(0)';
    }, 3200);
  }

  // ══════════════════════════════════════════════════
  // REVEAL — IntersectionObserver con safety net
  // ══════════════════════════════════════════════════
  function initReveal() {
    var elements = document.querySelectorAll('.reveal');
    if (!elements.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.05,
      rootMargin: '0px 0px -40px 0px'
    });

    elements.forEach(function (el, i) {
      // Stagger: elementos del mismo padre se retrasan entre sí
      var siblings = el.parentElement ? el.parentElement.querySelectorAll('.reveal') : [];
      var idx = Array.from(siblings).indexOf(el);
      if (idx > 0) {
        el.style.transitionDelay = Math.min(idx * 0.08, 0.4) + 's';
      }
      observer.observe(el);
    });
  }

  // ══════════════════════════════════════════════════
  // GSAP — ScrollTrigger animations (si GSAP disponible)
  // ══════════════════════════════════════════════════
  function initGSAP() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    // Parallax del hero image
    var heroImg = document.querySelector('.hero-img');
    if (heroImg) {
      gsap.to(heroImg, {
        yPercent: 20,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: 'bottom top',
          scrub: 1.5
        }
      });
    }

    // Números de estadísticas — counter up
    var statNums = document.querySelectorAll('.stat-num');
    statNums.forEach(function (el) {
      var text = el.textContent.trim();
      var match = text.match(/[\d]+/);
      if (!match) return;
      var target = parseInt(match[0]);
      var prefix = text.includes('+') ? '+' : '';
      var suffix = text.replace(/[+\d]/g, '');
      el.textContent = prefix + '0' + suffix;

      ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        once: true,
        onEnter: function () {
          gsap.to({ val: 0 }, {
            val: target,
            duration: 1.8,
            ease: 'power2.out',
            onUpdate: function () {
              el.textContent = prefix + Math.round(this.targets()[0].val) + suffix;
            }
          });
        }
      });
    });

    // Why items — entrada escalonada
    var whyItems = document.querySelectorAll('.why-item');
    if (whyItems.length) {
      gsap.from(whyItems, {
        opacity: 0,
        y: 40,
        stagger: 0.12,
        duration: 0.7,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.why-grid',
          start: 'top 80%'
        }
      });
    }

    // Línea decorativa del fondo "SOCOIM" en why
    gsap.to('.why::before', {
      opacity: 0.08,
      scrollTrigger: {
        trigger: '.why',
        start: 'top center',
        end: 'bottom center',
        scrub: true
      }
    });
  }

  // ══════════════════════════════════════════════════
  // CAROUSEL — drag + botones + dots + autoplay
  // ══════════════════════════════════════════════════
  function initCarousel() {
    var track   = document.getElementById('carouselTrack');
    var prevBtn = document.getElementById('carouselPrev');
    var nextBtn = document.getElementById('carouselNext');
    var dotsWrap= document.getElementById('carouselDots');
    if (!track) return;

    var slides      = track.querySelectorAll('.carousel-slide');
    var total       = slides.length;
    var current     = 0;
    var autoplayTimer;
    var isDragging  = false;
    var startX      = 0;
    var currentX    = 0;

    // Crear dots
    if (dotsWrap && dotsWrap.children.length === 0) {
      slides.forEach(function (_, i) {
        var dot = document.createElement('button');
        dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', 'Slide ' + (i + 1));
        dot.addEventListener('click', function () { goTo(i); });
        dotsWrap.appendChild(dot);
      });
    }

    function updateDots() {
      if (!dotsWrap) return;
      dotsWrap.querySelectorAll('.carousel-dot').forEach(function (d, i) {
        d.classList.toggle('active', i === current);
      });
    }

    function updateSlides() {
      slides.forEach(function (s, i) {
        s.classList.toggle('active', i === current);
      });
    }

    function goTo(index) {
      current = (index + total) % total;
      track.style.transform = 'translateX(-' + (current * 100) + '%)';
      updateDots();
      updateSlides();
    }

    function next() { goTo(current + 1); }
    function prev() { goTo(current - 1); }

    if (nextBtn) nextBtn.addEventListener('click', function () { next(); resetAutoplay(); });
    if (prevBtn) prevBtn.addEventListener('click', function () { prev(); resetAutoplay(); });

    // Autoplay
    function startAutoplay() {
      autoplayTimer = setInterval(next, 5000);
    }
    function resetAutoplay() {
      clearInterval(autoplayTimer);
      startAutoplay();
    }
    startAutoplay();

    // Drag / swipe
    function onDragStart(x) {
      isDragging = true;
      startX = x;
      currentX = x;
      track.style.transition = 'none';
    }
    function onDragMove(x) {
      if (!isDragging) return;
      currentX = x;
      var diff = (currentX - startX) / track.offsetWidth * 100;
      track.style.transform = 'translateX(calc(-' + (current * 100) + '% + ' + diff + '%)';
    }
    function onDragEnd() {
      if (!isDragging) return;
      isDragging = false;
      track.style.transition = '';
      var diff = currentX - startX;
      if (Math.abs(diff) > 60) {
        diff < 0 ? next() : prev();
      } else {
        goTo(current); // snap back
      }
      resetAutoplay();
    }

    // Mouse events
    track.addEventListener('mousedown',  function (e) { onDragStart(e.clientX); });
    window.addEventListener('mousemove', function (e) { onDragMove(e.clientX); });
    window.addEventListener('mouseup',   onDragEnd);

    // Touch events
    track.addEventListener('touchstart', function (e) { onDragStart(e.touches[0].clientX); }, { passive: true });
    track.addEventListener('touchmove',  function (e) { onDragMove(e.touches[0].clientX); },  { passive: true });
    track.addEventListener('touchend',   onDragEnd);

    // Pausa en hover
    track.addEventListener('mouseenter', function () { clearInterval(autoplayTimer); });
    track.addEventListener('mouseleave', function () { startAutoplay(); });

    // Init
    goTo(0);
  }

  // ══════════════════════════════════════════════════
  // PRODUCT FILTER
  // ══════════════════════════════════════════════════
  function initFilter() {
    var buttons = document.querySelectorAll('.filter-btn');
    var cards   = document.querySelectorAll('.product-card');
    if (!buttons.length) return;

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        buttons.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');

        var filter = btn.dataset.filter;
        cards.forEach(function (card) {
          if (filter === 'all' || card.dataset.category === filter) {
            card.classList.remove('hidden');
            // Re-trigger reveal animation si no era visible
            if (!card.classList.contains('visible')) {
              card.classList.add('visible');
            }
          } else {
            card.classList.add('hidden');
          }
        });
      });
    });
  }

  // ══════════════════════════════════════════════════
  // PRODUCTS VIEW — pestaña dedicada al catálogo
  // (reemplaza el scroll normal solo para "Productos")
  // ══════════════════════════════════════════════════
  function initProductsView() {
    var view = document.getElementById('productos');
    var triggers = document.querySelectorAll('[data-products-trigger]');
    var closers  = document.querySelectorAll('[data-products-close]');
    if (!view || !triggers.length) return;

    var lastFocused = null;

    function open() {
      lastFocused = document.activeElement;
      view.classList.add('open');
      view.setAttribute('aria-hidden', 'false');
      document.body.classList.add('products-view-open');
      view.scrollTop = 0;
      var back = view.querySelector('.products-back-btn');
      if (back) back.focus();
    }

    function close() {
      view.classList.remove('open');
      view.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('products-view-open');
      if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    }

    triggers.forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        open();
      });
    });

    closers.forEach(function (el) {
      el.addEventListener('click', close);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      var productModal = document.getElementById('productModal');
      if (productModal && productModal.classList.contains('open')) return; // deja que se cierre el modal de producto primero
      if (view.classList.contains('open')) close();
    });

    // Exponer estado para que initAnchors pueda cerrar la vista al navegar a otra sección
    productsView.isOpen = function () { return view.classList.contains('open'); };
    productsView.close = close;
  }

  // ══════════════════════════════════════════════════
  // PRODUCT MODAL — vista de detalle en overlay (no pestaña nueva)
  // ══════════════════════════════════════════════════
  function initProductModal() {
    var modal = document.getElementById('productModal');
    var cards = document.querySelectorAll('.product-card');
    if (!modal || !cards.length) return;

    var img   = document.getElementById('productModalImg');
    var badge = document.getElementById('productModalBadge');
    var cat   = document.getElementById('productModalCat');
    var title = document.getElementById('productModalTitle');
    var desc  = document.getElementById('productModalDesc');
    var cta   = document.getElementById('productModalCta');
    var closeBtn = modal.querySelector('.product-modal-close');
    var lastFocused = null;

    function open(card) {
      var cardImg   = card.querySelector('.product-img-wrap img');
      var cardBadge = card.querySelector('.product-badge');
      var cardCat   = card.querySelector('.product-cat');
      var cardTitle = card.querySelector('h3');
      var cardDesc  = card.querySelector('.product-info p');
      var cardCta   = card.querySelector('.product-cta');

      if (cardImg) {
        img.src = cardImg.src;
        img.alt = cardImg.alt;
      }
      if (cardBadge) {
        badge.textContent = cardBadge.textContent;
        badge.className = 'product-badge' + (cardBadge.classList.contains('new') ? ' new' : '');
        badge.style.display = '';
      } else {
        badge.style.display = 'none';
      }
      cat.textContent   = cardCat ? cardCat.textContent : '';
      title.textContent = cardTitle ? cardTitle.textContent : '';
      desc.textContent  = cardDesc ? cardDesc.textContent : '';
      if (cardCta) cta.setAttribute('href', cardCta.getAttribute('href'));

      lastFocused = document.activeElement;
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
      if (closeBtn) closeBtn.focus();
    }

    function close() {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');
      if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    }

    cards.forEach(function (card) {
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');

      card.addEventListener('click', function (e) {
        if (e.target.closest('.product-cta')) return; // deja pasar el mailto normal
        open(card);
      });

      card.addEventListener('keydown', function (e) {
        if (e.target.closest('.product-cta')) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open(card);
        }
      });
    });

    modal.querySelectorAll('[data-modal-close]').forEach(function (el) {
      el.addEventListener('click', close);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('open')) close();
    });
  }

  // ══════════════════════════════════════════════════
  // FORM — mailto con datos del formulario
  // ══════════════════════════════════════════════════
  function initForm() {
    var form = document.getElementById('quoteForm');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var nombre   = form.querySelector('#nombre').value.trim();
      var empresa  = form.querySelector('#empresa').value.trim();
      var email    = form.querySelector('#email').value.trim();
      var telefono = form.querySelector('#telefono').value.trim();
      var categoria= form.querySelector('#categoria').value;
      var mensaje  = form.querySelector('#mensaje').value.trim();

      // Validación básica
      if (!nombre || !empresa || !email || !mensaje) {
        showFormError(form, 'Por favor complete los campos obligatorios (*).');
        return;
      }
      if (!isValidEmail(email)) {
        showFormError(form, 'Por favor ingrese un correo electrónico válido.');
        return;
      }

      // Construir correo
      var subject = encodeURIComponent('Solicitud de Cotización — ' + empresa);
      var body = encodeURIComponent(
        'Estimado equipo SOCOIM,\n\n' +
        'Les contacto para solicitar cotización.\n\n' +
        '─────────────────────────────\n' +
        'Nombre: ' + nombre + '\n' +
        'Empresa: ' + empresa + '\n' +
        'Correo: ' + email + '\n' +
        (telefono ? 'Teléfono: ' + telefono + '\n' : '') +
        (categoria ? 'Categoría: ' + formatCategoria(categoria) + '\n' : '') +
        '─────────────────────────────\n\n' +
        'Detalle del requerimiento:\n' + mensaje + '\n\n' +
        'Quedo atento a su respuesta.\n\n' +
        'Saludos,\n' + nombre
      );

      window.location.href = 'mailto:ventas@socoim.cl?subject=' + subject + '&body=' + body;

      // Mostrar estado de éxito en formulario
      showFormSuccess(form);
    });
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function formatCategoria(val) {
    var map = {
      bombas: 'Bombas de Agua',
      valvulas: 'Válvulas',
      mangueras: 'Mangueras',
      flanges: 'Flanges y Fittings',
      tuberias: 'Tuberías (PVC / Conduit)',
      vial: 'Seguridad Vial',
      minero: 'Equipamiento Minero',
      otro: 'Otro / Varios'
    };
    return map[val] || val;
  }

  function showFormError(form, msg) {
    var existing = form.querySelector('.form-error-msg');
    if (existing) existing.remove();
    var div = document.createElement('div');
    div.className = 'form-error-msg';
    div.style.cssText = 'color:#f87171;font-size:0.825rem;margin-bottom:1rem;padding:0.6rem 1rem;background:rgba(248,113,113,0.08);border-radius:6px;border:1px solid rgba(248,113,113,0.2);';
    div.textContent = msg;
    form.insertBefore(div, form.querySelector('.btn'));
    setTimeout(function () { if (div.parentNode) div.remove(); }, 4000);
  }

  function showFormSuccess(form) {
    var success = form.querySelector('.form-success');
    if (success) {
      form.querySelectorAll('.form-row, .form-group, .btn, .form-note, .form-title').forEach(function (el) {
        el.style.display = 'none';
      });
      success.classList.add('show');
      return;
    }

    // Crear mensaje de éxito
    var div = document.createElement('div');
    div.className = 'form-success show';
    div.innerHTML =
      '<div class="form-success-icon">' +
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
          '<path d="M20 6L9 17l-5-5"/>' +
        '</svg>' +
      '</div>' +
      '<h4>¡Solicitud enviada!</h4>' +
      '<p>Su cliente de correo se abrirá con el mensaje listo para enviar a ventas.</p>';
    div.style.cssText = 'text-align:center;padding:2rem 1rem;';

    // Resetear form visualmente
    form.style.transition = 'opacity 0.3s';
    form.style.opacity = '0';
    setTimeout(function () {
      form.innerHTML = div.outerHTML;
      form.style.opacity = '1';
    }, 300);
  }

  // ══════════════════════════════════════════════════
  // ANCHORS — smooth scroll con offset del navbar
  // ══════════════════════════════════════════════════
  function initAnchors() {
    // Los enlaces con data-products-trigger los maneja initProductsView
    document.querySelectorAll('a[href^="#"]:not([data-products-trigger])').forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        var href = anchor.getAttribute('href');
        if (href === '#') return;
        var target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        if (productsView.isOpen()) productsView.close();
        var navbarH = document.getElementById('navbar')
          ? document.getElementById('navbar').offsetHeight
          : 80;
        var top = target.getBoundingClientRect().top + window.scrollY - navbarH - 16;
        window.scrollTo({ top: top, behavior: 'smooth' });
      });
    });
  }

  // ══════════════════════════════════════════════════
  // SAFETY NET — revelar todo después de 6s
  // ══════════════════════════════════════════════════
  function initSafetyNet() {
    setTimeout(function () {
      document.querySelectorAll('.reveal:not(.visible)').forEach(function (el) {
        el.classList.add('visible');
      });
    }, 6000);
  }

})();
