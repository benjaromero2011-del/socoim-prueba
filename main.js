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

  // ══════════════════════════════════════════════════
  // CART — carro de cotización, persistente en localStorage
  // Compartido entre las tarjetas de producto, el modal
  // y el formulario de contacto (sección #contacto).
  // ══════════════════════════════════════════════════
  var Cart = (function () {
    var STORAGE_KEY = 'socoim_quote_cart';
    var listeners = [];

    function read() {
      try {
        var raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch (e) { return []; }
    }

    function write(items) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch (e) {}
      listeners.forEach(function (fn) { fn(items); });
    }

    return {
      getAll: read,
      add: function (name, category, qty) {
        qty = Math.max(1, parseInt(qty, 10) || 1);
        var items = read();
        var existing = items.filter(function (i) { return i.name === name; })[0];
        var wasNew = !existing;
        if (existing) {
          existing.qty = qty;
        } else {
          items.push({ name: name, category: category || '', qty: qty });
        }
        write(items);
        return wasNew;
      },
      setQty: function (name, qty) {
        qty = Math.max(1, parseInt(qty, 10) || 1);
        var items = read();
        items.forEach(function (i) { if (i.name === name) i.qty = qty; });
        write(items);
      },
      remove: function (name) {
        write(read().filter(function (i) { return i.name !== name; }));
      },
      clear: function () {
        write([]);
      },
      onChange: function (fn) {
        listeners.push(fn);
      }
    };
  })();

  onReady(function () {
    safe(initSplash,    'splash');
    safe(initNavbar,    'navbar');
    safe(initReveal,    'reveal');
    safe(initGSAP,      'gsap');
    safe(initCarousel,  'carousel');
    safe(initFilter,    'filter');
    safe(initProductModal, 'productModal');
    safe(initProductsView, 'productsView');
    safe(initQuoteCart, 'quoteCart');
    safe(initForm,      'form');
    safe(initQuoteButtons, 'quoteButtons');
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
    var categoryButtons = document.querySelectorAll('[data-filter]');
    var brandButtons    = document.querySelectorAll('[data-brand-filter]');
    var cards    = document.querySelectorAll('.product-card');
    var search   = document.getElementById('productSearch');
    var clearBtn = document.getElementById('productSearchClear');
    var emptyMsg = document.getElementById('productSearchEmpty');
    if (!categoryButtons.length && !brandButtons.length) return;

    var activeCategory = 'all';
    var activeBrand = 'all';

    function normalize(str) {
      return (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    function apply() {
      var query = normalize(search ? search.value.trim() : '');
      var visibleCount = 0;

      cards.forEach(function (card) {
        var matchesCategory = activeCategory === 'all' || card.dataset.category === activeCategory;
        var matchesBrand = activeBrand === 'all' || card.dataset.brand === activeBrand;
        var matchesSearch = true;
        if (query) {
          var haystack = normalize(
            (card.querySelector('h3') ? card.querySelector('h3').textContent : '') + ' ' +
            (card.querySelector('.product-info p') ? card.querySelector('.product-info p').textContent : '') + ' ' +
            (card.querySelector('.product-cat') ? card.querySelector('.product-cat').textContent : '')
          );
          matchesSearch = haystack.indexOf(query) !== -1;
        }

        if (matchesCategory && matchesBrand && matchesSearch) {
          card.classList.remove('hidden');
          visibleCount++;
          // Re-trigger reveal animation si no era visible
          if (!card.classList.contains('visible')) {
            card.classList.add('visible');
          }
        } else {
          card.classList.add('hidden');
        }
      });

      if (clearBtn) clearBtn.hidden = !query;
      if (emptyMsg) emptyMsg.hidden = visibleCount !== 0;
    }

    categoryButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        categoryButtons.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        activeCategory = btn.dataset.filter;
        apply();
      });
    });

    brandButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        brandButtons.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        activeBrand = btn.dataset.brandFilter;
        apply();
      });
    });

    if (search) {
      search.addEventListener('input', apply);
    }
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        search.value = '';
        search.focus();
        apply();
      });
    }
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
    var closeBtn = modal.querySelector('.product-modal-close');
    var lastFocused = null;

    function open(card) {
      var cardImg   = card.querySelector('.product-img-wrap img');
      var cardBadge = card.querySelector('.product-badge');
      var cardCat   = card.querySelector('.product-cat');
      var cardTitle = card.querySelector('h3');
      var cardDesc  = card.querySelector('.product-info p');

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
      modal.dataset.category = card.dataset.category || '';

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
        if (e.target.closest('.product-cta')) return; // deja pasar el clic del botón Cotizar
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
  // WEB3FORMS — envío real de formularios sin backend
  // ══════════════════════════════════════════════════
  var WEB3FORMS_ACCESS_KEY = '67536def-b4b9-44eb-a141-8814c276314a';

  function submitToWeb3Forms(payload) {
    payload.access_key = WEB3FORMS_ACCESS_KEY;
    return fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (res) { return res.json(); });
  }

  // ══════════════════════════════════════════════════
  // QUOTE CART — renderiza el carro en #contacto y el
  // contador de productos en el botón "Cotizar ahora"
  // ══════════════════════════════════════════════════
  function initQuoteCart() {
    var list  = document.getElementById('quoteCartList');
    var empty = document.getElementById('quoteCartEmpty');
    var clearBtn = document.getElementById('quoteCartClear');
    var navBadges = document.querySelectorAll('.nav-cta, .footer-contact .btn');

    function render(items) {
      items = items || Cart.getAll();

      if (list) {
        list.innerHTML = '';
        items.forEach(function (item) {
          var li = document.createElement('li');
          li.className = 'quote-cart-item';

          var span = document.createElement('span');
          span.className = 'quote-cart-name';
          span.textContent = item.name;

          var qtyInput = document.createElement('input');
          qtyInput.type = 'number';
          qtyInput.min = '1';
          qtyInput.className = 'quote-cart-qty';
          qtyInput.value = item.qty || 1;
          qtyInput.setAttribute('aria-label', 'Cantidad de ' + item.name);
          qtyInput.addEventListener('change', function () {
            Cart.setQty(item.name, qtyInput.value);
          });

          var removeBtn = document.createElement('button');
          removeBtn.type = 'button';
          removeBtn.className = 'quote-cart-remove';
          removeBtn.setAttribute('aria-label', 'Quitar ' + item.name);
          removeBtn.innerHTML = '&times;';
          removeBtn.addEventListener('click', function () { Cart.remove(item.name); });

          li.appendChild(span);
          li.appendChild(qtyInput);
          li.appendChild(removeBtn);
          list.appendChild(li);
        });
      }

      if (empty) empty.hidden = items.length > 0;
      if (list) list.hidden = items.length === 0;
      if (clearBtn) clearBtn.hidden = items.length === 0;

      // Badge con contador en los CTA "Cotizar"
      navBadges.forEach(function (btn) {
        var badge = btn.querySelector('.cart-badge');
        if (items.length > 0) {
          if (!badge) {
            badge = document.createElement('span');
            badge.className = 'cart-badge';
            btn.appendChild(badge);
          }
          badge.textContent = items.length;
        } else if (badge) {
          badge.remove();
        }
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', function () { Cart.clear(); });
    }

    Cart.onChange(render);
    render();
  }

  // ══════════════════════════════════════════════════
  // FORM — envío real vía Web3Forms
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
      var cartItems = Cart.getAll();

      // Validación básica
      if (!nombre || !empresa || !email) {
        showFormError(form, 'Por favor complete los campos obligatorios (*).');
        return;
      }
      if (!isValidEmail(email)) {
        showFormError(form, 'Por favor ingrese un correo electrónico válido.');
        return;
      }
      if (!cartItems.length && !mensaje) {
        showFormError(form, 'Agregue al menos un producto desde el catálogo o describa su requerimiento en comentarios.');
        return;
      }

      var submitBtn = form.querySelector('button[type="submit"]');
      var originalBtnText = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando...';
      }

      var productosTexto = cartItems.length
        ? cartItems.map(function (i) { return '- ' + (i.qty || 1) + 'x ' + i.name; }).join('\n')
        : 'No especificados (ver comentarios)';

      submitToWeb3Forms({
        subject: 'Solicitud de Cotización — ' + empresa,
        from_name: nombre,
        nombre: nombre,
        empresa: empresa,
        email: email,
        telefono: telefono || 'No indicado',
        categoria: categoria ? formatCategoria(categoria) : 'No especificada',
        productos: productosTexto,
        comentarios: mensaje || 'Sin comentarios adicionales',
        message: productosTexto + (mensaje ? '\n\nComentarios adicionales:\n' + mensaje : ''),
        replyto: email
      }).then(function (data) {
        if (data.success) {
          Cart.clear();
          showFormSuccess(form);
        } else {
          throw new Error(data.message || 'Error desconocido');
        }
      }).catch(function () {
        showFormError(form, 'No se pudo enviar la solicitud. Intente nuevamente o escríbanos directamente a ventas@socoim.cl.');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText;
        }
      });
    });
  }

  // ══════════════════════════════════════════════════
  // QUOTE BUTTONS — botones "Cotizar" de tarjetas y modal
  // Agregan el producto al carro de cotización (Cart).
  // El cliente puede seguir agregando más mientras navega
  // el catálogo; el envío real ocurre en el formulario de
  // #contacto, donde ve el carro completo antes de enviar.
  // ══════════════════════════════════════════════════
  function initQuoteButtons() {
    var cardButtons = document.querySelectorAll('.product-card .product-cta');
    var modalBtn = document.getElementById('productModalCta');
    if (!cardButtons.length && !modalBtn) return;

    // Muestra un selector de cantidad justo al lado del botón clickeado.
    // Al confirmar (✓ o Enter), agrega al carro con esa cantidad.
    // Al cancelar (× o Escape), no hace nada.
    function showQtyPicker(btn, onConfirm) {
      if (btn.dataset.pickerOpen) return; // ya hay un picker abierto para este botón
      btn.dataset.pickerOpen = '1';
      btn.style.display = 'none';

      var picker = document.createElement('span');
      picker.className = 'qty-picker';
      picker.innerHTML =
        '<label class="qty-picker-label">Cant.</label>' +
        '<input type="number" class="qty-picker-input" min="1" value="1" />' +
        '<button type="button" class="qty-picker-confirm" aria-label="Confirmar">✓</button>' +
        '<button type="button" class="qty-picker-cancel" aria-label="Cancelar">✕</button>';
      btn.insertAdjacentElement('afterend', picker);

      var input = picker.querySelector('.qty-picker-input');
      var confirmBtn = picker.querySelector('.qty-picker-confirm');
      var cancelBtn = picker.querySelector('.qty-picker-cancel');

      function close() {
        picker.remove();
        btn.style.display = '';
        delete btn.dataset.pickerOpen;
      }

      function confirm() {
        var qty = input.value;
        close();
        onConfirm(qty);
      }

      confirmBtn.addEventListener('click', function (e) { e.stopPropagation(); confirm(); });
      cancelBtn.addEventListener('click', function (e) { e.stopPropagation(); close(); });
      input.addEventListener('click', function (e) { e.stopPropagation(); });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); confirm(); }
        if (e.key === 'Escape') { e.preventDefault(); close(); }
      });

      input.focus();
      input.select();
    }

    function addToCart(btn, productName, categorySlug, qty) {
      var added = Cart.add(productName, categorySlug, qty);
      var original = btn.textContent;
      btn.textContent = added ? '✓ Agregado' : 'Cantidad actualizada';
      setTimeout(function () { btn.textContent = original; }, 2000);
    }

    cardButtons.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var card = btn.closest('.product-card');
        if (!card) return;
        var title = card.querySelector('h3');
        var productName = title ? title.textContent : 'Producto';
        var categorySlug = card.dataset.category;
        showQtyPicker(btn, function (qty) {
          addToCart(btn, productName, categorySlug, qty);
        });
      });
    });

    if (modalBtn) {
      modalBtn.addEventListener('click', function () {
        var modal = document.getElementById('productModal');
        var title = document.getElementById('productModalTitle');
        var productName = title ? title.textContent : 'Producto';
        var categorySlug = modal ? modal.dataset.category : '';
        showQtyPicker(modalBtn, function (qty) {
          addToCart(modalBtn, productName, categorySlug, qty);
        });
      });
    }
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
      '<p>Recibimos su solicitud. El equipo de ventas de SOCOIM la revisará y se pondrá en contacto a la brevedad.</p>';
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
