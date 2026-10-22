// Instagram tarzı hikâyeler: ana sayfadaki halkalı kapaklar + tam ekran, otomatik ilerleyen görüntüleyici.
(function () {
  const { $, esc, img, money, pct, icon, productUrl, catUrl } = SA;
  const P = CATALOG.products;
  const DURATION = 5000;
  const SEEN_KEY = 'ap_seen_stories';
  const LOGO = 'assets/img/brand/arpol-logo.png';
  const TIMES = ['1 sa', '2 sa', '4 sa', '6 sa', '9 sa', '12 sa', '1 g', '2 g'];

  // Hikâye grupları: kampanya + yeni gelenler + her kategori
  const pick = (list, n) => list.slice(0, n);
  const byCat = (slug) => {
    const all = P.filter((p) => p.category === slug);
    return [...all.filter((p) => p.isFeatured), ...all.filter((p) => !p.isFeatured)];
  };
  const SHORT = { 'sarj-guc': 'Şarj', kablolar: 'Kablo', kulaklik: 'Kulaklık', 'kilif-koruma': 'Kılıf', arac: 'Araç', 'akilli-teknoloji': 'Akıllı' };
  const GROUPS = [
    { id: 'indirim', label: 'İndirim', title: 'Hafta sonuna özel', href: catUrl('indirim'), items: pick([...P].filter((p) => p.salePrice).sort((a, b) => pct(b) - pct(a)), 5) },
    { id: 'yeni', label: 'Yeni', title: 'Yeni gelenler', href: catUrl('yeni'), items: pick(P.filter((p) => p.isNew), 5) },
    ...CATALOG.categories.map((c) => ({ id: c.slug, label: SHORT[c.slug] || c.name, title: c.name, href: catUrl(c.slug), items: pick(byCat(c.slug), 4) })),
  ].filter((g) => g.items.length);

  const readSeen = () => { try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]')); } catch (e) { return new Set(); } };
  const seen = readSeen();
  const markSeen = (id) => {
    seen.add(id);
    try { localStorage.setItem(SEEN_KEY, JSON.stringify([...seen])); } catch (e) { /* gizli sekme: bu oturumda kalır */ }
    const b = document.querySelector(`[data-story="${id}"]`);
    if (b) b.classList.add('is-seen');
  };

  // ---------------------------------------------------------------- ana sayfa bölümü
  function section() {
    return `<section class="container-site pb-14 md:pb-20" aria-label="Instagram hikâyeleri">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div><h2 class="text-[26px] md:text-[32px] font-medium tracking-tight">Instagram'da biz</h2><p class="text-muted mt-1">Hikâyelere dokun; yeni gelenleri ve kampanyaları kaçırma.</p></div>
        <a href="https://www.instagram.com/arpol/" target="_blank" rel="noopener" class="btn btn-light btn-sm self-start">${icon('instagram', 'w-4 h-4')} @arpol</a>
      </div>
      <div class="stories-row no-scrollbar">
        ${GROUPS.map((g) => `<button type="button" class="story-bubble${seen.has(g.id) ? ' is-seen' : ''}" data-story="${g.id}" aria-label="${esc(g.label)} hikâyesini aç">
          <span class="story-bubble__ring"><img src="${img(g.items[0].colors[0].images[0])}" alt="" loading="lazy"></span>
          <span class="story-bubble__label">${esc(g.label)}</span>
        </button>`).join('')}
      </div>
    </section>`;
  }

  // ---------------------------------------------------------------- görüntüleyici
  const PAUSE = '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>';
  const PLAY = '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>';

  let root; let g = 0; let s = 0; let elapsed = 0; let last = 0; let raf = 0; let paused = false; let returnFocus = null;

  function build() {
    root = document.createElement('div');
    root.className = 'story-viewer';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'Hikâyeler');
    root.hidden = true;
    root.innerHTML = `<button type="button" class="story-nav story-nav--prev" data-sv-group="-1" aria-label="Önceki hikâye">${icon('left')}</button>
      <div class="story-frame" data-sv-frame></div>
      <button type="button" class="story-nav story-nav--next" data-sv-group="1" aria-label="Sonraki hikâye">${icon('right')}</button>`;
    document.body.appendChild(root);
    bind();
  }

  function render() {
    const grp = GROUPS[g];
    const p = grp.items[s];
    const d = pct(p);
    const now = p.salePrice || p.price;
    $('[data-sv-frame]', root).innerHTML = `
      <div class="story-bars" aria-hidden="true">${grp.items.map((_, k) => `<span><i style="width:${k < s ? 100 : 0}%"></i></span>`).join('')}</div>
      <div class="story-head">
        <span class="story-head__avatar"><img src="${LOGO}" alt=""></span>
        <p class="story-head__meta"><b>arpol</b><span>${esc(grp.label)}</span><small>${TIMES[g % TIMES.length]}</small></p>
        <button type="button" class="story-icon" data-sv-pause aria-label="${paused ? 'Devam et' : 'Duraklat'}">${paused ? PLAY : PAUSE}</button>
        <button type="button" class="story-icon" data-sv-close aria-label="Hikâyeyi kapat">${icon('close')}</button>
      </div>
      <div class="story-body">
        <a class="story-kicker" href="${grp.href}">${esc(grp.title)}</a>
        <div class="story-media">
          <img src="${img(p.colors[0].images[0])}" alt="${esc(p.name)}">
          ${d ? `<span class="story-sticker">%${d} indirim</span>` : p.isNew ? '<span class="story-sticker story-sticker--dark">Yeni</span>' : ''}
        </div>
        <p class="story-brand">${esc(p.brand)}</p>
        <p class="story-name">${esc(p.name)}</p>
        <p class="story-price">${p.salePrice ? `<s>${money(p.price)}</s>` : ''}<b>${money(now)}</b></p>
      </div>
      <div class="story-actions">
        <a class="btn btn-light" href="${productUrl(p)}">Ürünü incele</a>
        <button type="button" class="btn btn-dark" data-sv-add>Sepete ekle</button>
      </div>
      <p class="sr-only" aria-live="polite">${esc(grp.label)}: ${s + 1} / ${grp.items.length}. ${esc(p.name)}</p>`;
    root.classList.toggle('is-paused', paused);
    $('.story-nav--prev', root).disabled = g === 0 && s === 0;
    // Sıradaki görseli önden yükle
    const next = grp.items[s + 1] || (GROUPS[g + 1] && GROUPS[g + 1].items[0]);
    if (next) new Image().src = img(next.colors[0].images[0]);
  }

  function tick(t) {
    if (!paused) elapsed += t - last;
    last = t;
    const bar = root.querySelectorAll('.story-bars i')[s];
    if (bar) bar.style.width = `${Math.min(100, (elapsed / DURATION) * 100)}%`;
    if (elapsed >= DURATION) return step(1);
    raf = requestAnimationFrame(tick);
  }
  function start() {
    cancelAnimationFrame(raf);
    elapsed = 0;
    last = performance.now();
    render();
    raf = requestAnimationFrame(tick);
  }

  function step(dir) {
    const grp = GROUPS[g];
    if (dir > 0 && s < grp.items.length - 1) { s++; return start(); }
    if (dir < 0 && s > 0) { s--; return start(); }
    jump(dir);
  }
  // Önceki/sonraki gruba geç; geri dönüşte grubun başından başla
  function jump(dir) {
    const to = g + dir;
    if (to < 0) { s = 0; return start(); }
    if (to >= GROUPS.length) return hide();
    g = to; s = 0;
    markSeen(GROUPS[g].id);
    start();
  }

  function setPaused(v) {
    paused = v;
    root.classList.toggle('is-paused', paused);
    const b = $('[data-sv-pause]', root);
    if (b) { b.innerHTML = paused ? PLAY : PAUSE; b.setAttribute('aria-label', paused ? 'Devam et' : 'Duraklat'); }
  }

  function show(id) {
    if (!root) build();
    g = Math.max(0, GROUPS.findIndex((x) => x.id === id));
    s = 0;
    returnFocus = document.activeElement;
    root.hidden = false;
    requestAnimationFrame(() => root.classList.add('is-open'));
    document.body.classList.add('lock');
    setPaused(false);
    markSeen(GROUPS[g].id);
    start();
    setTimeout(() => { const c = $('[data-sv-close]', root); c && c.focus({ preventScroll: true }); }, 60);
  }
  function hide() {
    cancelAnimationFrame(raf);
    root.classList.remove('is-open');
    document.body.classList.remove('lock');
    setTimeout(() => { root.hidden = true; }, 200);
    if (returnFocus && returnFocus.focus) returnFocus.focus({ preventScroll: true });
  }

  function bind() {
    let down = null;
    const frame = $('[data-sv-frame]', root);

    root.addEventListener('click', (e) => {
      const t = e.target;
      if (t.closest('[data-sv-close]')) return hide();
      if (t.closest('[data-sv-pause]')) return setPaused(!paused);
      const gb = t.closest('[data-sv-group]');
      if (gb) return jump(+gb.dataset.svGroup);
      if (t.closest('[data-sv-add]')) {
        const p = GROUPS[g].items[s];
        hide();
        return SA.addToCart(p.id, 0, p.sizes[0].name, 1);
      }
      if (t === root) hide(); // çerçevenin dışına tıklama
    });

    // Dokunma: kısa dokunuş = önceki/sonraki, basılı tut = duraklat, yatay kaydırma = grup değiştir, aşağı kaydırma = kapat
    frame.addEventListener('pointerdown', (e) => {
      if (e.target.closest('a, button')) return;
      down = { x: e.clientX, y: e.clientY, t: performance.now(), wasPaused: paused };
      setPaused(true);
    });
    const up = (e) => {
      if (!down) return;
      const dx = e.clientX - down.x; const dy = e.clientY - down.y; const dt = performance.now() - down.t;
      const wasPaused = down.wasPaused;
      down = null;
      setPaused(wasPaused);
      if (dy > 90 && Math.abs(dy) > Math.abs(dx)) return hide();
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) return jump(dx < 0 ? 1 : -1);
      if (dt < 260 && Math.abs(dx) < 10 && Math.abs(dy) < 10) {
        const r = frame.getBoundingClientRect();
        step(e.clientX - r.left < r.width / 3 ? -1 : 1);
      }
    };
    frame.addEventListener('pointerup', up);
    frame.addEventListener('pointercancel', () => { if (down) { setPaused(down.wasPaused); down = null; } });

    document.addEventListener('keydown', (e) => {
      if (root.hidden) return;
      if (e.key === 'Escape') hide();
      else if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === ' ' && !e.target.closest('a, button')) { e.preventDefault(); setPaused(!paused); }
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden && !root.hidden) setPaused(true); });
  }

  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-story]');
    if (b) show(b.dataset.story);
  });

  SA.stories = { section, open: show };
})();
