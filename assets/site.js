(function () {
  var root = document.documentElement, body = document.body;
  var WA = '5585999661030';

  // tema claro/escuro (preferência guardada só neste navegador)
  try { var saved = localStorage.getItem('sl-theme'); if (saved) root.dataset.theme = saved; } catch (e) {}
  // cor da barra do navegador acompanha o tema escolhido manualmente
  function syncThemeColor() {
    if (!root.dataset.theme) return;
    var c = root.dataset.theme === 'dark' ? '#1a1411' : '#faf8f5';
    document.querySelectorAll('meta[name="theme-color"]').forEach(function (m) { m.setAttribute('content', c); });
  }
  syncThemeColor();
  var themeBtn = document.getElementById('theme');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (themeBtn) themeBtn.addEventListener('click', function (ev) {
    function apply() {
      var dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
      root.dataset.theme = dark ? 'light' : 'dark';
      try { localStorage.setItem('sl-theme', root.dataset.theme); } catch (e) {}
      syncThemeColor();
    }
    if (reduce || !document.startViewTransition) { apply(); return; }
    // novo tema se abre em círculo a partir do botão
    var r = themeBtn.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    var end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    root.classList.add('vt-theme');
    var vt = document.startViewTransition(apply);
    vt.ready.then(function () {
      root.animate({ clipPath: ['circle(0 at ' + x + 'px ' + y + 'px)', 'circle(' + end + 'px at ' + x + 'px ' + y + 'px)'] },
        { duration: 650, easing: 'cubic-bezier(.65,0,.35,1)', pseudoElement: '::view-transition-new(root)' });
    }).catch(function () {});
    vt.finished.then(function () { root.classList.remove('vt-theme'); }, function () { root.classList.remove('vt-theme'); });
  });

  // borda do cabeçalho ao rolar
  var top = document.getElementById('top');
  function onScroll() { top.classList.toggle('scrolled', window.scrollY > 8); }
  onScroll(); addEventListener('scroll', onScroll, { passive: true });

  // menu do celular
  var burger = document.getElementById('burger');
  function setMenu(open) {
    body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    body.style.overflow = open ? 'hidden' : '';
  }
  burger.addEventListener('click', function () { setMenu(!body.classList.contains('menu-open')); });
  document.querySelectorAll('.mnav a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  var desk = matchMedia('(min-width: 901px)');
  var onDesk = function (m) { if (m.matches) setMenu(false); };
  desk.addEventListener ? desk.addEventListener('change', onDesk) : desk.addListener(onDesk);

  // submenu de áreas (desktop)
  var dd = document.querySelector('.dd'), ddBtn = dd && dd.querySelector('.dd-btn'), closeT;
  function setDD(open) { dd.classList.toggle('open', open); ddBtn.setAttribute('aria-expanded', open); }
  if (dd) {
    ddBtn.addEventListener('click', function () { setDD(!dd.classList.contains('open')); });
    dd.addEventListener('mouseenter', function () { clearTimeout(closeT); setDD(true); });
    dd.addEventListener('mouseleave', function () { closeT = setTimeout(function () { setDD(false); }, 160); });
    dd.addEventListener('focusout', function (e) { if (!dd.contains(e.relatedTarget)) setDD(false); });
    document.addEventListener('click', function (e) { if (!dd.contains(e.target)) setDD(false); });
  }
  addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (body.classList.contains('menu-open')) { setMenu(false); burger.focus(); }
    if (dd && dd.classList.contains('open')) { setDD(false); ddBtn.focus(); }
  });

  // copiar telefone / e-mail
  document.querySelectorAll('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var txt = b.getAttribute('data-copy'), old = b.textContent;
      function done(ok) {
        b.textContent = ok ? 'Copiado' : 'Selecione e copie';
        b.classList.remove('done'); void b.offsetWidth; b.classList.add('done');
        setTimeout(function () { b.textContent = old; b.classList.remove('done'); }, 1800);
      }
      try { navigator.clipboard.writeText(txt).then(function () { done(true); }, function () { done(false); }); } catch (e) { done(false); }
    });
  });

  // formulário de contato -> mensagem pronta no WhatsApp
  var form = document.getElementById('form');
  if (form) {
    var nome = form.querySelector('#f-nome'), cidade = form.querySelector('#f-cidade'),
        msg = form.querySelector('#f-msg'), count = form.querySelector('#f-count'),
        bubble = form.querySelector('#f-preview'), send = form.querySelector('#f-send'),
        errNome = form.querySelector('#e-nome'), MAX = 600;

    // assunto pré-selecionado pelo endereço (ex.: contato.html#divorcio)
    var h = (location.hash || '').slice(1);
    if (h) { var pre = form.querySelector('input[name="assunto"][value="' + h + '"]'); if (pre) pre.checked = true; }

    function val(name) { var c = form.querySelector('input[name="' + name + '"]:checked'); return c ? c : null; }
    function build() {
      var n = nome.value.trim(), c = cidade.value.trim(), m = msg.value.trim();
      var a = val('assunto'), mod = val('modalidade');
      var lines = ['Olá, Dra. Socorro. Meu nome é ' + (n || '[seu nome]') + (c ? ', sou de ' + c : '') + '.'];
      lines.push('Gostaria de agendar uma consulta sobre: ' + (a ? a.getAttribute('data-label') : 'assunto a definir') + '.');
      if (mod && mod.value !== 'indiferente') lines.push('Prefiro atendimento ' + mod.value + '.');
      if (m) lines.push('', m);
      return lines.join('\n');
    }
    function update() {
      if (msg.value.length > MAX) msg.value = msg.value.slice(0, MAX);
      count.textContent = msg.value.length + ' / ' + MAX;
      var t = build();
      bubble.textContent = t;
      send.href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(t);
    }
    form.addEventListener('input', function () {
      if (nome.value.trim()) { nome.removeAttribute('aria-invalid'); errNome.hidden = true; }
      update();
    });
    form.addEventListener('change', update);
    send.addEventListener('click', function (e) {
      if (!nome.value.trim()) {
        e.preventDefault();
        nome.setAttribute('aria-invalid', 'true'); errNome.hidden = false; nome.focus();
      }
    });
    form.addEventListener('submit', function (e) { e.preventDefault(); send.click(); });
    update();
  }

  // barra fixa de WhatsApp no celular (CSS só a mostra abaixo de 900px).
  // Usa o link da página (nas áreas, a mensagem já vem com o assunto). Fora da página de contato, que tem o formulário.
  var waLink = !form && (document.querySelector('.aside a[href^="https://wa.me"]') || document.querySelector('main a.btn[href^="https://wa.me"]'));
  if (waLink) {
    var bar = document.createElement('div');
    bar.className = 'wa-bar';
    bar.innerHTML = '<a class="btn btn-primary" target="_blank" rel="noopener"></a>';
    var bl = bar.firstChild;
    bl.href = waLink.href;
    bl.innerHTML = (waLink.querySelector('svg') ? waLink.querySelector('svg').outerHTML : '') + 'Agendar consulta pelo WhatsApp';
    body.appendChild(bar); body.classList.add('has-wa');
    var onBar = function () { bar.classList.toggle('show', window.scrollY > 420); };
    onBar(); addEventListener('scroll', onBar, { passive: true });
  }

  // ===== movimento (desligado para quem pede menos movimento no sistema) =====
  if (!reduce) {
    // títulos principais entram palavra por palavra
    document.querySelectorAll('.hero h1, .phead h1').forEach(function (h) {
      if (h.children.length) return;
      var base = h.closest('.hero') ? .22 : .27;
      var words = h.textContent.trim().split(/\s+/);
      h.setAttribute('aria-label', h.textContent.trim());
      h.innerHTML = words.map(function (w, i) {
        return '<span class="w" aria-hidden="true"><span style="--d:' + (base + i * .045).toFixed(3) + 's">' + w.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</span></span>';
      }).join(' ');
      h.classList.add('split');
    });

    // revelar ao rolar: primeiro os itens internos, depois os blocos que não contêm itens já marcados
    var groups = [
      ['.alist > li, .defs > div, .prose > p, .steps > li, .faq details, .list > li, .side-nav li, footer .cols > div, .pager > a, .chips', 'up', true],
      ['.portrait, .area-photo, .cinfo figure', 'img'],
      ['.quote', 'quote'],
      ['.alist, .defs, .steps', 'line'],
      ['.shead > *, .others, .duo > div > *, .cta .wrap > *, .two > div > h2, .area-main > section > h2, .box, .side-nav .label, .faq-group > h2, .form, .cinfo .note, .map, .sec .wrap > p, .legal', 'up', true]
    ];
    var marked = [];
    groups.forEach(function (g) {
      document.querySelectorAll(g[0]).forEach(function (el) {
        if (el.hasAttribute('data-reveal') || el.closest('.hero, .phead')) return;
        if (g[1] === 'up') {
          var p = el.parentElement.closest('[data-reveal="up"],[data-reveal="quote"]');
          if (p || el.querySelector('[data-reveal="up"],[data-reveal="quote"]')) return;
        }
        el.setAttribute('data-reveal', g[1]);
        if (g[2]) { // cascata entre irmãos (no máximo 6 passos)
          var i = Array.prototype.indexOf.call(el.parentElement.children, el);
          el.style.setProperty('--d', (Math.min(i, 6) * .07).toFixed(2) + 's');
        }
        marked.push(el);
      });
    });
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add('in'); io.unobserve(e.target);
          // depois de entrar, o atraso não deve afetar outras transições do elemento
          setTimeout(function () { e.target.style.removeProperty('--d'); }, 1600);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: .12 });
      marked.forEach(function (el) { io.observe(el); });
      // no fim da página, o que estiver colado no rodapé nunca entra na área observada: revela tudo
      var atEnd = function () {
        if (innerHeight + scrollY < document.documentElement.scrollHeight - 4) return;
        marked.forEach(function (el) { if (!el.classList.contains('in')) { el.classList.add('in'); io.unobserve(el); } });
        removeEventListener('scroll', atEnd);
      };
      addEventListener('scroll', atEnd, { passive: true });
    } else {
      marked.forEach(function (el) { el.classList.add('in'); });
    }

    // "Mais de 30 anos": o número conta até 30 na abertura
    document.querySelectorAll('.facts li').forEach(function (li) {
      var m = li.textContent.match(/^(\D*)(\d+)(.*)$/);
      if (!m) return;
      var target = +m[2], t0 = null;
      li.setAttribute('aria-label', li.textContent);
      li.innerHTML = m[1] + '<span aria-hidden="true" style="font-variant-numeric:tabular-nums">0</span>' + m[3];
      var span = li.querySelector('span');
      setTimeout(function () {
        requestAnimationFrame(function step(t) {
          if (t0 === null) t0 = t;
          var k = Math.min((t - t0) / 1400, 1), ease = 1 - Math.pow(1 - k, 3);
          span.textContent = Math.round(target * ease);
          if (k < 1) requestAnimationFrame(step);
        });
      }, 900);
    });
  }

  var y = document.getElementById('ano'); if (y) y.textContent = new Date().getFullYear();
})();
