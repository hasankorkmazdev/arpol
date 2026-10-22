// Ortak arayüz: header, footer, mini sepet, arama, giriş, hızlı bakış, ürün kartı, karusel, toast.
(function () {
  const SA = window.SA;
  const C = window.CATALOG;
  const store = SA.store;

  // ---------------------------------------------------------------- yardımcılar
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const moneyFmt = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' });
  const money = (n) => moneyFmt.format(n);
  const pct = (p) => (p.salePrice ? Math.round((1 - p.salePrice / p.price) * 100) : 0);
  const img = (base) => `${base}.jpg`;
  const param = (k) => new URLSearchParams(location.search).get(k);
  const norm = (s) => String(s || '').toLocaleLowerCase('tr-TR').replace(/ı/g, 'i').normalize('NFD').replace(/[̀-ͯ]/g, '');
  const product = (id) => C.products.find((p) => p.id === id);
  const category = (slug) => C.categories.find((c) => c.slug === slug);
  const subcategory = (slug) => C.categories.flatMap((c) => c.children.map((s) => ({ ...s, parent: c }))).find((s) => s.slug === slug);
  const productUrl = (p, colorIdx) => `urun.html?id=${p.id}${colorIdx ? `&renk=${colorIdx}` : ''}`;
  const catUrl = (c, s) => `kategori.html?c=${c}${s ? `&s=${s}` : ''}`;
  const PHONE = '0850 000 00 00';
  const WA = 'https://wa.me/908500000000';

  const ICON_PATHS = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
    heart: '<path d="M12 20s-7.5-4.6-9.2-9.3C1.6 7.4 3.8 4 7.2 4c2 0 3.5 1.1 4.8 2.8C13.3 5.1 14.8 4 16.8 4c3.4 0 5.6 3.4 4.4 6.7C19.5 15.4 12 20 12 20z"/>',
    bag: '<path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
    menu: '<path d="M3 7h18M3 12h18M3 17h18"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    left: '<path d="m15 18-6-6 6-6"/>',
    right: '<path d="m9 18 6-6-6-6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    truck: '<path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
    refresh: '<path d="M4 12a8 8 0 0 1 13.7-5.6L20 9M20 4v5h-5M20 12a8 8 0 0 1-13.7 5.6L4 15M4 20v-5h5"/>',
    store: '<path d="M4 10v10h16V10M3 10l2-6h14l2 6M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/><path d="M10 20v-5h4v5"/>',
    headset: '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="14" width="4" height="6" rx="1"/><rect x="17" y="14" width="4" height="6" rx="1"/>',
    lock: '<rect x="5" y="10" width="14" height="10" rx="1"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    check: '<path d="m5 12 5 5 9-10"/>',
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8"/>',
    filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
    ruler: '<path d="M3 17 17 3l4 4L7 21z"/><path d="m7 13 2 2M10 10l2 2M13 7l2 2"/>',
    card: '<rect x="3" y="5" width="18" height="14" rx="1"/><path d="M3 10h18M7 15h4"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z"/>',
    pin: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    box: '<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="m3 7.5 9 4.5 9-4.5M12 12v9"/>',
    logout: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  };
  const icon = (name, cls = 'w-5 h-5') =>
    `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name]}</svg>`;
  const waIcon = (cls = 'w-6 h-6') => `<svg class="${cls}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2a9.9 9.9 0 0 0-8.5 15l-1.4 5.1 5.2-1.4A9.9 9.9 0 1 0 12.04 2zm0 18.1a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3.1.8.8-3-.2-.3a8.2 8.2 0 1 1 7 3.9zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.3.8 3.2.7.5-.1 1.5-.6 1.8-1.2.2-.6.2-1.1.1-1.2l-.5-.3z"/></svg>`;
  const stars = (rating, cls = 'w-3.5 h-3.5') => {
    let s = '';
    for (let i = 1; i <= 5; i++) {
      const fill = rating >= i - 0.25 ? 'currentColor' : 'none';
      s += `<svg class="${cls}" viewBox="0 0 24 24" fill="${fill}" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="m12 3 2.6 5.6 6.1.7-4.5 4.1 1.2 6.1L12 16.5l-5.4 3 1.2-6.1-4.5-4.1 6.1-.7z"/></svg>`;
    }
    return `<span class="inline-flex text-gold" aria-label="5 üzerinden ${rating.toFixed(1)} puan">${s}</span>`;
  };
  const logo = (extra = '', light) => `<a href="index.html" class="logo ${extra}" aria-label="Ar-Pol ana sayfa"><img class="logo__img" src="assets/img/brand/arpol-logo${light ? '-beyaz' : ''}.png" alt="Ar-Pol Toptan GSM Aksesuarları"></a>`;

  // ---------------------------------------------------------------- ürün kartı
  function priceHtml(p, big) {
    const now = p.salePrice || p.price;
    return `<div class="price">${p.salePrice ? `<span class="price__old">${money(p.price)}</span>` : ''}<span class="price__now"${big ? ' style="font-size:24px;font-weight:500"' : ''}>${money(now)}</span></div>`;
  }
  function productCard(p, opts = {}) {
    const c = p.colors[0];
    const alt = c.images[1] || c.images[0];
    const fav = store.isFav(p.id);
    const d = pct(p);
    return `<article class="card">
      <div class="card__top">
        <a class="card__media" href="${productUrl(p)}">
          <img src="${img(c.images[0])}" alt="${esc(p.name)}" loading="lazy" width="540" height="720">
          <img class="card__alt" src="${img(alt)}" alt="" loading="lazy" width="540" height="720">
        </a>
        <div class="card__badges">${d ? `<span class="badge">%${d} indirim</span>` : ''}${p.isNew && !opts.hideNew ? '<span class="badge badge--light">Yeni ürün</span>' : ''}</div>
        <button class="card__fav" type="button" data-fav="${p.id}" aria-pressed="${fav}" aria-label="${fav ? 'Favorilerden çıkar' : 'Favorilere ekle'}">${icon('heart', `w-[18px] h-[18px] icon-heart${fav ? ' is-on' : ''}`)}</button>
        <div class="card__quick"><button class="btn" type="button" data-quick="${p.id}" aria-label="${esc(p.name)} sepete ekle">${icon('bag', 'w-4 h-4')}<span>Sepete ekle</span></button></div>
      </div>
      <div class="card__body">
        <div class="card__brand">${esc(p.brand)}</div>
        <a class="card__name" href="${productUrl(p)}">${esc(p.name)}</a>
        ${priceHtml(p)}
        ${p.colors.length > 1 ? `<div class="swatches" aria-label="${p.colors.length} renk">${p.colors.map((x) => `<span class="swatch-dot" style="background:${x.hex}" title="${esc(x.name)}"></span>`).join('')}</div>` : ''}
      </div>
    </article>`;
  }

  // Yatay karusel bölümü
  function rail(title, products, opts = {}) {
    const id = 'rail-' + Math.random().toString(36).slice(2, 8);
    return `<section class="${opts.cls || 'py-10 md:py-14'}">
      <div class="container-site">
        <div class="flex items-end justify-between gap-4 mb-6">
          <div>
            <h2 class="text-[26px] md:text-[32px] font-medium tracking-tight leading-tight">${esc(title)}</h2>
            ${opts.sub ? `<p class="text-muted mt-1">${esc(opts.sub)}</p>` : ''}
          </div>
          <div class="flex items-center gap-2">
            ${opts.href ? `<a href="${opts.href}" class="hidden sm:inline text-sm link-underline mr-3">Tümünü gör</a>` : ''}
            <button class="rail-btn" type="button" data-rail-prev="${id}" aria-label="Önceki ürünler">${icon('left')}</button>
            <button class="rail-btn" type="button" data-rail-next="${id}" aria-label="Sonraki ürünler">${icon('right')}</button>
          </div>
        </div>
        <div class="rail ${opts.five ? 'rail--5' : ''} no-scrollbar" id="${id}">${products.map((p) => productCard(p)).join('')}</div>
      </div>
    </section>`;
  }
  function initRails(root = document) {
    $$('.rail', root).forEach((el) => {
      if (el.dataset.ready) return;
      el.dataset.ready = '1';
      const prev = $(`[data-rail-prev="${el.id}"]`);
      const next = $(`[data-rail-next="${el.id}"]`);
      const update = () => {
        if (!prev) return;
        prev.disabled = el.scrollLeft < 4;
        next.disabled = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
      };
      prev && prev.addEventListener('click', () => el.scrollBy({ left: -el.clientWidth, behavior: 'smooth' }));
      next && next.addEventListener('click', () => el.scrollBy({ left: el.clientWidth, behavior: 'smooth' }));
      el.addEventListener('scroll', update, { passive: true });
      update();
    });
  }

  // ---------------------------------------------------------------- arama
  function search(q) {
    const terms = norm(q).split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    return C.products
      .map((p) => {
        const sub = subcategory(p.subcategory);
        const hay = norm([p.name, p.brand, sub && sub.name, sub && sub.parent.name, p.colors.map((c) => c.name).join(' '), p.sku].join(' '));
        const ok = terms.every((t) => hay.includes(t));
        return ok ? { p, score: norm(p.name).startsWith(terms[0]) ? 2 : norm(p.name).includes(terms[0]) ? 1 : 0 } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.p);
  }

  // ---------------------------------------------------------------- header
  const ANNOUNCEMENTS = ['1.500 TL üzeri ücretsiz kargo', '14 gün içinde kolay değişim', 'Peşin fiyatına 3 taksit', 'Kapıda ödeme imkânı', 'İlk siparişe özel HOSGELDIN10 ile %10 indirim'];

  function renderHeader(active) {
    const host = $('#app-header');
    if (!host) return;
    if (document.body.dataset.header === 'checkout') {
      host.innerHTML = `<div class="announce"><div class="announce__item is-active">Bu bir tasarım demosudur — gerçek ödeme alınmaz</div></div>
        <header class="border-b border-line bg-white"><div class="container-site flex items-center justify-between h-[72px]">
          ${logo()}
          <div class="flex items-center gap-2 text-sm text-charcoal">${icon('lock', 'w-4 h-4')}<span>Güvenli ödeme</span></div>
        </div></header>`;
      return;
    }
    const navItems = [
      { slug: 'yeni', name: 'Yeni Gelenler', href: catUrl('yeni') },
      ...C.categories.map((c) => ({ slug: c.slug, name: c.name, href: catUrl(c.slug), cat: c })),
      { slug: 'indirim', name: 'İndirim', href: catUrl('indirim'), sale: true },
    ];
    const mega = (c) => {
      const picks = C.products.filter((p) => p.category === c.slug).slice(0, 2);
      return `<div class="mega"><div class="container-site grid grid-cols-12 gap-8 py-9">
        <div class="col-span-3">
          <p class="font-medium mb-4">${esc(c.name)}</p>
          <ul class="space-y-2.5 text-[15px]">
            ${c.children.map((s) => `<li><a href="${catUrl(c.slug, s.slug)}">${esc(s.name)}</a></li>`).join('')}
            <li class="pt-2"><a href="${catUrl(c.slug)}" class="font-medium">Tümünü gör</a></li>
          </ul>
        </div>
        <div class="col-span-5 grid grid-cols-2 gap-5">
          ${picks.map((p) => `<a href="${productUrl(p)}" class="block group"><div class="aspect-square overflow-hidden bg-white border border-line"><img src="${img(p.colors[0].images[0])}" alt="" class="w-full h-full object-contain p-2" loading="lazy"></div><p class="mt-2 text-sm">${esc(p.name)}</p><p class="text-sm font-semibold">${money(p.salePrice || p.price)}</p></a>`).join('')}
        </div>
        <a href="${catUrl(c.slug)}" class="col-span-4 flex flex-col justify-end bg-ink !text-white p-8 min-h-[280px] border-l-4 border-gold"><p class="text-2xl font-semibold leading-tight">${esc(c.name)}</p><p class="text-white/70 mt-2">${esc(c.blurb || '')}</p><span class="mt-5 text-[12px] tracking-[.14em] font-semibold uppercase border-b-2 border-gold self-start pb-0.5">Keşfet</span></a>
      </div></div>`;
    };

    host.innerHTML = `
      <div class="announce" role="region" aria-label="Duyurular">${ANNOUNCEMENTS.map((a, i) => `<div class="announce__item${i === 0 ? ' is-active' : ''}">${esc(a)}</div>`).join('')}</div>
      <header class="site-header" id="site-header">
        <div class="container-site site-header__bar grid grid-cols-[1fr_auto_1fr] lg:flex items-center gap-6">
          <div class="flex items-center lg:hidden">
            <button class="icon-btn -ml-2" type="button" data-open="menu" aria-label="Menüyü aç">${icon('menu', 'w-6 h-6')}</button>
            <button class="icon-btn" type="button" data-open="search" aria-label="Ara">${icon('search')}</button>
          </div>
          <div class="justify-self-center lg:mr-6">${logo()}</div>
          <nav class="hidden lg:flex items-stretch gap-7 xl:gap-9 h-full mx-auto" aria-label="Ana menü">
            ${navItems.map((n) => `<div class="nav-item flex items-stretch">
              <a class="nav-link${n.sale ? ' nav-link--sale' : ''}${active === n.slug ? ' is-current' : ''}" href="${n.href}">${esc(n.name)}</a>
              ${n.cat ? mega(n.cat) : ''}
            </div>`).join('')}
          </nav>
          <div class="flex items-center justify-end gap-0.5 lg:gap-1.5">
            <button class="icon-btn hidden lg:inline-flex" type="button" data-open="search" aria-label="Ara">${icon('search')}</button>
            <button class="icon-btn hidden sm:inline-flex" type="button" data-account aria-label="Hesabım">${icon('user')}</button>
            <a class="icon-btn" href="favoriler.html" aria-label="Favorilerim">${icon('heart')}<span class="icon-badge" data-fav-count></span></a>
            <button class="icon-btn" type="button" data-open="cart" aria-label="Sepetim">${icon('bag')}<span class="icon-badge" data-cart-count></span><span class="hidden xl:inline text-[14px]">Sepetim</span></button>
          </div>
        </div>
      </header>`;

    // Duyuru barı döngüsü
    const items = $$('.announce__item', host);
    let i = 0;
    if (items.length > 1) {
      setInterval(() => {
        items[i].classList.remove('is-active');
        items[i].classList.add('is-leaving');
        const prev = items[i];
        setTimeout(() => prev.classList.remove('is-leaving'), 600);
        i = (i + 1) % items.length;
        items[i].classList.add('is-active');
      }, 4000);
    }
    // Kaydırınca küçülen header
    const header = $('#site-header');
    const onScroll = () => header.classList.toggle('is-compact', window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function updateCounts() {
    const cart = store.cartCount();
    const favs = store.favs().length;
    $$('[data-cart-count]').forEach((el) => {
      if (el.textContent !== String(cart || '')) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
      el.textContent = cart || ''; el.dataset.count = cart;
    });
    $$('[data-fav-count]').forEach((el) => { el.textContent = favs || ''; el.dataset.count = favs; });
  }

  // ---------------------------------------------------------------- footer
  function renderFooter() {
    const host = $('#app-footer');
    if (!host) return;
    if (document.body.dataset.header === 'checkout') {
      host.innerHTML = `<footer class="border-t border-line mt-16"><div class="container-site py-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
        <span>© 2026 Ar-Pol</span>
        <button type="button" class="link-underline" data-legal="Mesafeli Satış Sözleşmesi">Mesafeli satış sözleşmesi</button>
        <button type="button" class="link-underline" data-legal="İade ve Değişim Politikası">İade politikası</button>
        <button type="button" class="link-underline" data-legal="KVKK Aydınlatma Metni">KVKK</button>
      </div></footer>`;
      return;
    }
    const col = (title, links) => `<div><p class="font-semibold mb-4 text-white uppercase tracking-[.12em] text-[13px]">${title}</p><ul class="space-y-2.5 text-[14.5px] text-white/70">${links.join('')}</ul></div>`;
    const legal = (t) => `<li><button type="button" class="hover:text-white transition-colors text-left" data-legal="${t}">${t}</button></li>`;
    host.innerHTML = `
      <section class="bg-white border-t border-line">
        <div class="container-site grid grid-cols-2 lg:grid-cols-4 gap-y-8 gap-x-6 py-10">
          ${[['headset', 'Kusursuz müşteri hizmeti', 'WhatsApp üzerinden hızlı destek'], ['truck', 'Aynı gün kargo', '1.500 TL üzeri ücretsiz'], ['store', 'Mağazadan teslim al', 'İstanbul mağazamızdan'], ['refresh', 'Kolay değişim ve iade', '14 gün içinde koşulsuz']]
            .map(([ic, t, s]) => `<div class="flex items-start gap-4">${icon(ic, 'w-8 h-8 shrink-0 text-gold')}<div><p class="font-medium leading-snug">${t}</p><p class="text-sm text-muted">${s}</p></div></div>`).join('')}
        </div>
      </section>
      <footer class="bg-ink text-white/80">
        <div class="container-site py-12 md:py-16 grid gap-10 lg:grid-cols-12">
          <div class="lg:col-span-4">
            ${logo('!items-start', true)}
            <p class="mt-5 text-white/70 max-w-sm">Telefon aksesuarlarında yeni ürünler ve kampanyalardan ilk sen haberdar ol.</p>
            <form class="mt-5 flex max-w-sm" data-newsletter>
              <label class="sr-only" for="nl-email">E-posta adresin</label>
              <input id="nl-email" type="email" required placeholder="E-posta adresin" class="input !h-12 !border-r-0">
              <button class="btn btn-dark !h-12 !px-5 shrink-0" type="submit">Abone ol</button>
            </form>
            <div class="flex gap-3 mt-6">
              <a href="https://www.instagram.com/arpol/" target="_blank" rel="noopener" class="icon-btn !w-11 !h-11 border border-white/20 text-white hover:bg-gold hover:border-gold" aria-label="Instagram">${icon('instagram')}</a>
              <a href="${WA}" target="_blank" rel="noopener" class="icon-btn !w-11 !h-11 border border-white/20 text-white hover:bg-gold hover:border-gold" aria-label="WhatsApp">${waIcon('w-5 h-5')}</a>
            </div>
          </div>
          <div class="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-8">
            ${col('Kategoriler', C.categories.map((c) => `<li><a class="hover:text-white transition-colors" href="${catUrl(c.slug)}">${esc(c.name)}</a></li>`))}
            ${col('Yardım', [
              '<li><a class="hover:text-white transition-colors" href="hesabim.html#siparisler">Sipariş takibi</a></li>',
              legal('İade ve Değişim Politikası'), legal('Kargo ve Teslimat'), legal('Sıkça Sorulan Sorular'),
            ])}
            ${col('Sözleşmeler', [legal('Mesafeli Satış Sözleşmesi'), legal('Ön Bilgilendirme Formu'), legal('KVKK Aydınlatma Metni'), legal('Çerez Politikası')])}
            ${col('İletişim', [
              `<li class="flex gap-2">${icon('pin', 'w-4 h-4 mt-1 shrink-0')}<span>İstanbul</span></li>`,
              `<li class="flex gap-2">${icon('phone', 'w-4 h-4 mt-1 shrink-0')}<a href="tel:+908500000000" class="hover:text-white transition-colors">${PHONE}</a></li>`,
              `<li class="flex gap-2">${icon('instagram', 'w-4 h-4 mt-1 shrink-0')}<a href="https://www.instagram.com/arpol/" target="_blank" rel="noopener" class="hover:text-white transition-colors">@arpol</a></li>`,
              '<li class="text-white/50 text-sm pt-1">Pzt–Cmt 09.00–19.00</li>',
            ])}
          </div>
        </div>
        <div class="border-t border-white/10">
          <div class="container-site py-5 flex flex-col md:flex-row gap-4 md:items-center justify-between text-sm text-white/50">
            <p>© 2026 Ar-Pol. Bu site bir tasarım demosudur; ürün görselleri yer tutucudur.</p>
            <div class="flex flex-wrap gap-2" aria-label="Ödeme yöntemleri">
              ${['Visa', 'Mastercard', 'Troy', 'Amex', '3D Secure'].map((x) => `<span class="px-2.5 py-1 border border-white/15 text-[12px] font-medium text-white/80">${x}</span>`).join('')}
            </div>
          </div>
        </div>
      </footer>
      <a class="wa-float" href="${WA}" target="_blank" rel="noopener" aria-label="WhatsApp ile yazın">${waIcon()}</a>`;
  }

  // ---------------------------------------------------------------- katmanlar (çekmece, modal, arama)
  function renderShell() {
    const el = document.createElement('div');
    el.innerHTML = `
      <div class="overlay" id="overlay"></div>
      <aside class="drawer drawer--right" id="cart-drawer" aria-label="Sepetim" aria-hidden="true"></aside>
      <aside class="drawer drawer--left" id="menu-drawer" aria-label="Menü" aria-hidden="true"></aside>
      <div class="search-layer" id="search-layer" aria-hidden="true"></div>
      <div class="modal" id="modal" aria-hidden="true"><div class="modal__panel" role="dialog" aria-modal="true"></div></div>
      <div class="toast-wrap" id="toasts" aria-live="polite"></div>`;
    document.body.append(...el.children);
  }

  let openEl = null;
  function open(el) {
    if (openEl && openEl !== el) close(true);
    openEl = el;
    el.classList.add('is-open');
    el.setAttribute('aria-hidden', 'false');
    if (!el.classList.contains('modal')) $('#overlay').classList.add('is-open');
    document.body.classList.add('lock');
    setTimeout(() => {
      const f = $('[autofocus]', el) || $('input:not([type=hidden]), select, textarea', el) || $('button', el);
      f && f.focus({ preventScroll: true });
    }, 80);
  }
  function close(keepLock) {
    if (!openEl) return;
    openEl.classList.remove('is-open');
    openEl.setAttribute('aria-hidden', 'true');
    $('#overlay').classList.remove('is-open');
    openEl = null;
    if (!keepLock) document.body.classList.remove('lock');
  }

  function modal(html, width) {
    const m = $('#modal');
    const panel = $('.modal__panel', m);
    panel.style.setProperty('--w', (width || 520) + 'px');
    panel.innerHTML = `<button class="modal__close" type="button" data-close aria-label="Kapat">${icon('close')}</button>${html}`;
    open(m);
    $('#overlay').classList.add('is-open');
    return panel;
  }

  // Mini sepet
  function renderCart() {
    const d = $('#cart-drawer');
    const lines = store.cartLines();
    const t = store.totals();
    const progress = Math.min(100, ((store.FREE_SHIPPING - t.freeShippingLeft) / store.FREE_SHIPPING) * 100);
    d.innerHTML = `
      <div class="drawer__head"><p class="text-lg font-medium">Sepetim <span class="text-muted font-normal">(${t.count})</span></p><button class="icon-btn" type="button" data-close aria-label="Sepeti kapat">${icon('close')}</button></div>
      ${lines.length ? `
        <div class="px-5 py-4 bg-blush text-sm">
          <p>${t.freeShippingLeft > 0 ? `Ücretsiz kargo için <b>${money(t.freeShippingLeft)}</b> daha ekle.` : 'Tebrikler, kargon ücretsiz!'}</p>
          <div class="h-1 bg-white mt-2"><div class="h-1 bg-ink transition-all duration-500" style="width:${progress}%"></div></div>
        </div>
        <div class="drawer__body divide-y divide-line">${lines.map(lineHtml).join('')}</div>
        <div class="drawer__foot space-y-3">
          <div class="flex justify-between"><span>Ara toplam</span><span class="font-semibold">${money(t.subtotal)}</span></div>
          ${t.saved > 0 ? `<p class="text-sm text-muted">İndirimlerle ${money(t.saved)} kazandın.</p>` : ''}
          <a href="odeme.html" class="btn btn-dark w-full">Alışverişi tamamla</a>
          <a href="sepet.html" class="btn btn-light w-full">Sepete git</a>
        </div>` : `
        <div class="drawer__body flex flex-col items-center justify-center text-center px-8">
          ${icon('bag', 'w-12 h-12 text-muted')}
          <p class="text-lg font-medium mt-4">Sepetin şu an boş</p>
          <p class="text-muted mt-1">Yeni gelen aksesuarlara göz at, beğendiğini sepete ekle.</p>
          <a href="${catUrl('yeni')}" class="btn btn-dark mt-6">Yeni gelenleri gör</a>
        </div>`}`;
  }
  function lineHtml(l) {
    return `<div class="flex gap-4 p-5" data-line="${esc(l.key)}">
      <a href="${productUrl(l.product, l.colorIdx)}" class="w-[84px] shrink-0"><img src="${img(l.color.images[0])}" alt="" class="w-full aspect-square object-contain bg-blush"></a>
      <div class="flex-1 min-w-0">
        <div class="flex justify-between gap-3"><a href="${productUrl(l.product, l.colorIdx)}" class="text-[14.5px] leading-snug hover:underline">${esc(l.product.name)}</a>
          <button type="button" class="text-muted hover:text-ink h-6" data-remove="${esc(l.key)}" aria-label="Ürünü sepetten çıkar">${icon('trash', 'w-[18px] h-[18px]')}</button></div>
        <p class="text-sm text-muted mt-0.5">${esc(l.color.name)} · Seçenek: ${esc(l.size)}</p>
        <div class="flex items-center justify-between mt-3">
          <div class="qty qty--sm"><button type="button" data-qty="-1" aria-label="Azalt">−</button><input type="number" value="${l.qty}" min="1" aria-label="Adet" data-qty-input><button type="button" data-qty="1" aria-label="Artır">+</button></div>
          <div class="text-right">${l.product.salePrice ? `<div class="text-xs text-muted line-through">${money(l.product.price * l.qty)}</div>` : ''}<div class="font-semibold">${money(l.lineTotal)}</div></div>
        </div>
      </div>
    </div>`;
  }

  // Mobil menü
  function renderMenu() {
    const d = $('#menu-drawer');
    const user = store.user();
    d.innerHTML = `
      <div class="drawer__head">${logo()}<button class="icon-btn" type="button" data-close aria-label="Menüyü kapat">${icon('close')}</button></div>
      <div class="drawer__body">
        <nav class="px-5" aria-label="Mobil menü">
          <a href="${catUrl('yeni')}" class="flex py-4 border-b border-line text-[17px]">Yeni Gelenler</a>
          ${C.categories.map((c) => `<details class="acc"><summary class="!py-4 text-[17px] !font-normal">${esc(c.name)}${icon('down', 'w-4 h-4')}</summary>
            <ul class="pb-4 pl-3 space-y-3 text-charcoal">${c.children.map((s) => `<li><a href="${catUrl(c.slug, s.slug)}">${esc(s.name)}</a></li>`).join('')}<li><a class="font-medium text-ink" href="${catUrl(c.slug)}">Tümünü gör</a></li></ul></details>`).join('')}
          <a href="${catUrl('indirim')}" class="flex py-4 border-b border-line text-[17px] text-alert">İndirim</a>
        </nav>
        <div class="grid grid-cols-2 gap-3 p-5">
          <button type="button" data-account class="chip !h-12 justify-center">${icon('user', 'w-4 h-4')}${user ? 'Hesabım' : 'Giriş yap'}</button>
          <a href="favoriler.html" class="chip !h-12 justify-center">${icon('heart', 'w-4 h-4')}Favorilerim</a>
          <a href="hesabim.html#siparisler" class="chip !h-12 justify-center">${icon('box', 'w-4 h-4')}Siparişlerim</a>
          <a href="${WA}" target="_blank" rel="noopener" class="chip !h-12 justify-center">${waIcon('w-4 h-4')}Destek</a>
        </div>
      </div>
      <div class="drawer__foot text-sm text-charcoal">İstanbul · <a href="tel:+908500000000">${PHONE}</a></div>`;
  }

  // Arama katmanı
  const POPULAR = ['Powerbank', 'Type-C kablo', 'Kulaklık', 'Kılıf', 'Araç tutucu', 'Akıllı saat'];
  function renderSearch() {
    const s = $('#search-layer');
    s.innerHTML = `<div class="container-site py-6 md:py-10">
      <div class="flex items-center gap-4">
        <form action="arama.html" class="flex-1 flex items-center gap-3" role="search">
          ${icon('search', 'w-6 h-6 shrink-0')}
          <label class="sr-only" for="search-q">Ürün ara</label>
          <input id="search-q" name="q" class="search-input" placeholder="Ne arıyorsun? Örn. type-c kablo" autocomplete="off" autofocus>
        </form>
        <button class="icon-btn" type="button" data-close aria-label="Aramayı kapat">${icon('close', 'w-6 h-6')}</button>
      </div>
      <div id="search-results" class="mt-8"></div>
    </div>`;
    const input = $('#search-q', s);
    const results = $('#search-results', s);
    const draw = () => {
      const q = input.value.trim();
      if (!q) {
        results.innerHTML = `<p class="text-sm text-muted mb-3">Popüler aramalar</p>
          <div class="flex flex-wrap gap-2">${POPULAR.map((p) => `<a class="chip" href="arama.html?q=${encodeURIComponent(p)}">${p}</a>`).join('')}</div>
          <p class="text-sm text-muted mt-8 mb-3">Kategoriler</p>
          <div class="flex flex-wrap gap-2">${C.categories.map((c) => `<a class="chip" href="${catUrl(c.slug)}">${esc(c.name)}</a>`).join('')}</div>`;
        return;
      }
      const found = search(q);
      results.innerHTML = found.length
        ? `<div class="flex items-baseline justify-between mb-4"><p class="text-sm text-muted">${found.length} ürün bulundu</p><a class="text-sm link-underline" href="arama.html?q=${encodeURIComponent(q)}">Tüm sonuçları gör</a></div>
           <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">${found.slice(0, 6).map((p) => `<a href="${productUrl(p)}" class="block"><img src="${img(p.colors[0].images[0])}" alt="" class="w-full aspect-square object-contain bg-blush"><p class="text-sm mt-2 leading-snug">${esc(p.name)}</p><p class="text-sm font-semibold">${money(p.salePrice || p.price)}</p></a>`).join('')}</div>`
        : `<p class="text-lg">“${esc(q)}” için sonuç bulunamadı.</p><p class="text-muted mt-1">Daha genel bir kelime dene ya da kategorilere göz at.</p>
           <div class="flex flex-wrap gap-2 mt-4">${POPULAR.map((p) => `<a class="chip" href="arama.html?q=${encodeURIComponent(p)}">${p}</a>`).join('')}</div>`;
    };
    input.addEventListener('input', draw);
    draw();
  }

  // Giriş / üye ol
  function openAuth(mode = 'login', after) {
    const panel = modal(`<div class="p-8 md:p-10">
      <div class="text-center mb-6">${logo()}</div>
      <div class="tabs !justify-start mb-6" role="tablist">
        <button type="button" class="tab ${mode === 'login' ? 'is-active' : ''}" data-auth-tab="login" role="tab">Giriş yap</button>
        <button type="button" class="tab ${mode === 'register' ? 'is-active' : ''}" data-auth-tab="register" role="tab">Üye ol</button>
      </div>
      <form class="space-y-4" data-auth-form novalidate>
        <label class="field" data-only="register" ${mode === 'login' ? 'hidden' : ''}><span>Ad soyad</span><input class="input" name="name" autocomplete="name"></label>
        <label class="field"><span>E-posta</span><input class="input" type="email" name="email" required autocomplete="email" placeholder="ornek@mail.com"></label>
        <label class="field"><span>Şifre</span><input class="input" type="password" name="password" required minlength="4" autocomplete="current-password"></label>
        <label class="check" data-only="register" ${mode === 'login' ? 'hidden' : ''}><input type="checkbox" name="kvkk"><span>KVKK aydınlatma metnini okudum, kampanya e-postası almak istiyorum.</span></label>
        <p class="field-error" data-auth-error hidden></p>
        <button class="btn btn-dark w-full" type="submit" data-auth-submit>${mode === 'login' ? 'Giriş yap' : 'Üye ol'}</button>
        <p class="text-xs text-muted text-center">Demo: herhangi bir e-posta ve şifre ile giriş yapabilirsin.</p>
      </form>
    </div>`, 460);
    const form = $('[data-auth-form]', panel);
    const setMode = (m) => {
      mode = m;
      $$('[data-auth-tab]', panel).forEach((b) => b.classList.toggle('is-active', b.dataset.authTab === m));
      $$('[data-only="register"]', panel).forEach((el) => (el.hidden = m !== 'register'));
      $('[data-auth-submit]', panel).textContent = m === 'login' ? 'Giriş yap' : 'Üye ol';
    };
    $$('[data-auth-tab]', panel).forEach((b) => b.addEventListener('click', () => setMode(b.dataset.authTab)));
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = form.email.value.trim();
      const err = $('[data-auth-error]', panel);
      if (!/^\S+@\S+\.\S+$/.test(email) || form.password.value.length < 4) {
        err.hidden = false;
        err.textContent = 'Geçerli bir e-posta ve en az 4 karakterli bir şifre gir.';
        return;
      }
      const user = store.login(email, mode === 'register' ? form.name.value.trim() : '');
      close();
      toast(`Hoş geldin, ${user.name.split(' ')[0]}`);
      if (after) after(user);
    });
  }

  // Hızlı bakış (kart üzerindeki "Sepete ekle")
  function quickView(id) {
    const p = product(id);
    let colorIdx = 0;
    let size = p.sizes.filter((s) => s.stock > 0).length === 1 ? p.sizes.find((s) => s.stock > 0).name : null;
    const panel = modal(`<div class="grid sm:grid-cols-2">
      <img data-qv-img src="${img(p.colors[0].images[0], 720)}" alt="${esc(p.name)}" class="w-full aspect-square object-contain bg-blush hidden sm:block">
      <div class="p-6 sm:p-8 flex flex-col">
        <p class="text-sm text-muted">${esc(p.brand)}</p>
        <h2 class="text-xl font-medium leading-snug pr-8">${esc(p.name)}</h2>
        <div class="mt-2">${priceHtml(p, true)}</div>
        <p class="text-sm mt-5 mb-2">Renk: <b data-qv-color>${esc(p.colors[0].name)}</b></p>
        <div class="flex gap-1.5">${p.colors.map((c, i) => `<button type="button" class="color-btn${i === 0 ? ' is-active' : ''}" data-qv-c="${i}" aria-label="${esc(c.name)}"><span style="background:${c.hex}"></span></button>`).join('')}</div>
        <p class="text-sm mt-5 mb-2">Seçenek</p>
        <div class="flex flex-wrap gap-2" data-qv-sizes>${p.sizes.map((s) => `<button type="button" class="size-btn${size === s.name ? ' is-active' : ''}" data-qv-s="${esc(s.name)}" ${s.stock ? '' : 'disabled'}>${esc(s.name)}</button>`).join('')}</div>
        <p class="field-error" data-qv-err hidden>Lütfen seçenek seç.</p>
        <div class="mt-auto pt-6 space-y-3">
          <button type="button" class="btn btn-dark w-full" data-qv-add>Sepete ekle</button>
          <a href="${productUrl(p)}" class="block text-center text-sm link-underline">Ürün detayına git</a>
        </div>
      </div>
    </div>`, 820);
    panel.addEventListener('click', (e) => {
      const c = e.target.closest('[data-qv-c]');
      const s = e.target.closest('[data-qv-s]');
      if (c) {
        colorIdx = +c.dataset.qvC;
        $$('[data-qv-c]', panel).forEach((b) => b.classList.toggle('is-active', b === c));
        $('[data-qv-img]', panel).src = img(p.colors[colorIdx].images[0], 720);
        $('[data-qv-color]', panel).textContent = p.colors[colorIdx].name;
      }
      if (s) {
        size = s.dataset.qvS;
        $$('[data-qv-s]', panel).forEach((b) => b.classList.toggle('is-active', b === s));
        $('[data-qv-err]', panel).hidden = true;
      }
      if (e.target.closest('[data-qv-add]')) {
        if (!size) {
          $('[data-qv-err]', panel).hidden = false;
          const sizes = $('[data-qv-sizes]', panel);
          sizes.classList.remove('shake'); void sizes.offsetWidth; sizes.classList.add('shake');
          return;
        }
        addToCart(p.id, colorIdx, size, 1);
      }
    });
  }

  function addToCart(id, colorIdx, size, qty, opts = {}) {
    store.addToCart(id, colorIdx, size, qty);
    if (opts.silent) return;
    close(true);
    renderCart();
    open($('#cart-drawer'));
  }

  function toggleFav(id) {
    const on = store.toggleFav(id);
    $$(`[data-fav="${id}"]`).forEach((b) => {
      b.setAttribute('aria-pressed', on);
      b.setAttribute('aria-label', on ? 'Favorilerden çıkar' : 'Favorilere ekle');
      const svg = $('svg', b);
      svg && svg.classList.toggle('is-on', on);
      const label = $('[data-fav-label]', b);
      if (label) label.textContent = on ? 'Favorilerde' : 'Favorilere ekle';
    });
    toast(on ? 'Favorilerine eklendi' : 'Favorilerden çıkarıldı', on ? { label: 'Favorilerim', href: 'favoriler.html' } : null);
  }

  function toast(msg, action) {
    const wrap = $('#toasts');
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `${icon('check', 'w-4 h-4')}<span>${esc(msg)}</span>${action ? `<a class="underline underline-offset-4 ml-2" href="${action.href}">${esc(action.label)}</a>` : ''}`;
    wrap.append(t);
    setTimeout(() => { t.classList.add('is-out'); setTimeout(() => t.remove(), 320); }, 2600);
  }

  // Yasal metin modalı (demo yer tutucu)
  function openLegal(title) {
    modal(`<div class="p-8 md:p-10">
      <h2 class="text-2xl font-medium pr-8">${esc(title)}</h2>
      <div class="mt-5 space-y-3 text-charcoal text-[15px] leading-relaxed">
        <p>Bu metin tasarım demosu için yer tutucudur. Canlı sitede ${esc(title.toLocaleLowerCase('tr-TR'))}, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği'ne uygun olarak mağazanıza özel hazırlanacaktır.</p>
        <p>Satıcı: Ar-Pol Telefon Aksesuarları — İstanbul. İletişim: ${PHONE}.</p>
        <p>Cayma hakkı: Ürünü teslim aldığın tarihten itibaren 14 gün içinde, kullanılmamış ve etiketi sökülmemiş olması koşuluyla iade edebilir ya da değiştirebilirsin.</p>
      </div>
      <button type="button" class="btn btn-dark mt-8" data-close>Anladım</button>
    </div>`, 640);
  }

  // ---------------------------------------------------------------- kampanya geri sayımı
  // Hafta sonu kampanyası pazar 23.59'da biter; ana sayfa bandı ve açılış penceresi aynı saati kullanır
  function campaignEnd() {
    const d = new Date();
    d.setDate(d.getDate() + ((7 - d.getDay()) % 7));
    d.setHours(23, 59, 59, 0);
    return d;
  }
  const COUNT_UNITS = ['Gün', 'Saat', 'Dakika', 'Saniye'];
  const countdownHtml = (cls = '') => COUNT_UNITS.map((u) => `<div class="count-box ${cls}"><b data-cd="${u}">00</b><small>${u}</small></div>`).join('');
  function startCountdown(root) {
    const end = campaignEnd();
    const tick = () => {
      const s = Math.max(0, Math.floor((end - Date.now()) / 1000));
      const v = { Gün: Math.floor(s / 86400), Saat: Math.floor((s % 86400) / 3600), Dakika: Math.floor((s % 3600) / 60), Saniye: s % 60 };
      COUNT_UNITS.forEach((u) => { const el = $(`[data-cd="${u}"]`, root); if (el) el.textContent = String(v[u]).padStart(2, '0'); });
    };
    tick();
    const timer = setInterval(() => (root.isConnected ? tick() : clearInterval(timer)), 1000);
  }

  // Açılış kampanya penceresi: ana sayfada, oturum başına bir kez (?kampanya ile her zaman)
  const PROMO_CODE = 'HOSGELDIN10';
  function openPromo() {
    const pick = C.products.find((p) => p.id === 'ap1009') || C.products[0];
    const panel = modal(`<div class="grid sm:grid-cols-[1fr_1.15fr]">
      <a href="${catUrl('indirim')}" class="relative block bg-blush">
        <img src="${img(pick.colors[0].images[0], 720)}" alt="" class="w-full h-[210px] sm:h-full object-contain p-6 bg-white">
        <span class="badge absolute left-4 top-4">%20'ye varan</span>
      </a>
      <div class="p-7 sm:p-9 text-center flex flex-col justify-center">
        <p class="text-sm tracking-[.25em] uppercase text-gold font-semibold">Hafta sonuna özel</p>
        <h2 class="font-bold tracking-tight text-[38px] sm:text-[44px] leading-[1] mt-2">İndirim başladı</h2>
        <p class="text-charcoal mt-3">Seçili ürünlerde %20'ye varan indirim pazar gece yarısı bitiyor.</p>
        <div class="flex justify-center gap-2 mt-6" aria-label="Kampanyanın bitmesine kalan süre">${countdownHtml('count-box--dark')}</div>
        <div class="mt-6 border border-dashed border-ink p-3 flex items-center justify-between gap-3 text-left">
          <div><p class="text-xs text-muted">İlk siparişe ekstra %10</p><p class="font-semibold tracking-[.12em]">${PROMO_CODE}</p></div>
          <button type="button" class="btn btn-dark btn-sm shrink-0" data-promo-code>Kodu kullan</button>
        </div>
        <a href="${catUrl('indirim')}" class="btn btn-light w-full mt-3">İndirimleri gör</a>
        <button type="button" class="text-sm text-muted mt-4 link-underline self-center" data-close>Şimdi değil</button>
      </div>
    </div>`, 820);
    startCountdown(panel);
    $('[data-promo-code]', panel).addEventListener('click', (e) => {
      store.applyCoupon(PROMO_CODE);
      try { navigator.clipboard && navigator.clipboard.writeText(PROMO_CODE); } catch (err) { /* panoya yazılamazsa kod zaten sepette */ }
      e.currentTarget.innerHTML = `${icon('check', 'w-4 h-4')}Tanımlandı`;
      toast(`${PROMO_CODE} sepetine tanımlandı`, { label: 'Alışverişe başla', href: catUrl('indirim') });
    });
  }
  function maybePromo() {
    if (document.body.dataset.page !== 'home') return;
    const forced = new URLSearchParams(location.search).has('kampanya');
    let seen = false;
    try { seen = sessionStorage.getItem('sa_promo_seen') === '1'; } catch (e) { /* yok say */ }
    if (seen && !forced) return;
    setTimeout(() => {
      if (openEl) return; // kullanıcı bu arada menü/sepet açtıysa araya girme
      try { sessionStorage.setItem('sa_promo_seen', '1'); } catch (e) { /* yok say */ }
      openPromo();
    }, 1200);
  }

  // ---------------------------------------------------------------- global olaylar
  function bindGlobal() {
    document.addEventListener('click', (e) => {
      const t = e.target;
      const fav = t.closest('[data-fav]');
      if (fav) { e.preventDefault(); toggleFav(fav.dataset.fav); return; }
      const quick = t.closest('[data-quick]');
      if (quick) { e.preventDefault(); quickView(quick.dataset.quick); return; }
      const o = t.closest('[data-open]');
      if (o) {
        const what = o.dataset.open;
        if (what === 'cart') { renderCart(); open($('#cart-drawer')); }
        if (what === 'menu') { renderMenu(); open($('#menu-drawer')); }
        if (what === 'search') { renderSearch(); open($('#search-layer')); }
        return;
      }
      if (t.closest('[data-account]')) {
        if (store.user()) location.href = 'hesabim.html';
        else openAuth('login', () => (location.href = 'hesabim.html'));
        return;
      }
      const legal = t.closest('[data-legal]');
      if (legal) { openLegal(legal.dataset.legal); return; }
      if (t.closest('[data-close]') || t.id === 'overlay' || t.id === 'modal') { close(); return; }

      // Mini sepet satırları
      const line = t.closest('#cart-drawer [data-line]');
      if (line) {
        const key = line.dataset.line;
        const rm = t.closest('[data-remove]');
        const q = t.closest('[data-qty]');
        if (rm) store.removeLine(key);
        if (q) { const l = store.cart().find((x) => x.key === key); store.setQty(key, l.qty + +q.dataset.qty); }
        if (rm || q) renderCart();
      }
    });
    document.addEventListener('change', (e) => {
      const input = e.target.closest('#cart-drawer [data-qty-input]');
      if (input) { store.setQty(input.closest('[data-line]').dataset.line, parseInt(input.value, 10) || 1); renderCart(); }
    });
    document.addEventListener('submit', (e) => {
      if (e.target.matches('[data-newsletter]')) { e.preventDefault(); e.target.reset(); toast('Bültene abone oldun'); }
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    window.addEventListener('store:change', updateCounts);
    window.addEventListener('storage', () => { updateCounts(); });
  }

  // ---------------------------------------------------------------- başlat
  function init() {
    renderHeader(document.body.dataset.nav);
    renderFooter();
    renderShell();
    bindGlobal();
    updateCounts();
    maybePromo();
  }

  Object.assign(SA, {
    $, $$, esc, money, pct, img, param, norm, icon, waIcon, stars, logo, product, category, subcategory, productUrl, catUrl,
    priceHtml, productCard, rail, initRails, search, modal, open, close, openAuth, quickView, addToCart, toggleFav, toast,
    renderCart, lineHtml, openLegal, countdownHtml, startCountdown, openPromo, PHONE, WA,
  });
  init();
})();
