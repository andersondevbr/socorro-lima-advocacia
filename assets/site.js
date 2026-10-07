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
  if (themeBtn) themeBtn.addEventListener('click', function () {
    var dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem('sl-theme', root.dataset.theme); } catch (e) {}
    syncThemeColor();
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
      function done(ok) { b.textContent = ok ? 'Copiado' : 'Selecione e copie'; setTimeout(function () { b.textContent = old; }, 1800); }
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

  var y = document.getElementById('ano'); if (y) y.textContent = new Date().getFullYear();
})();
