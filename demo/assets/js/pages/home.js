// Ana sayfa — hero → kategoriler → vitrin → yeni gelenler → kampanya → sekmeler → koleksiyonlar → markalar → instagram
(function () {
  const { $, $$, esc, img, icon, product, productCard, rail, initRails, catUrl, productUrl } = SA;
  const P = CATALOG.products;

  const SLIDES = [
    { title: 'Hızlı Şarjın Adresi', kicker: 'Şarj & güç', sub: 'GaN adaptörler, yüksek kapasiteli powerbankler ve kablosuz şarj üniteleriyle telefonun hep dolu.', ids: ['ap1009', 'ap1014', 'ap1018'], href: catUrl('sarj-guc') },
    { title: 'Müziğin Keyfini Çıkar', kicker: 'Bluetooth kulaklıklar', sub: 'ANC destekli TWS modellerden spor kulaklıklara; kablosuz özgürlük, güçlü bas.', ids: ['ap1050', 'ap1052', 'ap1045'], href: catUrl('kulaklik') },
    { title: 'Telefonunu Koru', kicker: 'Kılıf & ekran koruyucu', sub: 'MagSafe uyumlu şeffaf kılıflar ve 5D ekran koruyucularla telefonun ilk günkü gibi kalsın.', ids: ['ap1062', 'ap1071', 'ap1064'], href: catUrl('kilif-koruma') },
  ];

  const hero = `<section class="hero" aria-roledescription="carousel" aria-label="Öne çıkanlar">
    <div class="hero__track" id="hero-track">
      ${SLIDES.map((s, i) => `<div class="hero__slide${i === 0 ? ' is-active' : ''}" role="group" aria-label="${i + 1} / ${SLIDES.length}">
        <div class="container-site hero__inner">
          <div class="hero__copy">
            <p class="hero__kicker">${esc(s.kicker)}</p>
            <h2 class="hero__title">${esc(s.title)}</h2>
            <p class="hero__sub">${esc(s.sub)}</p>
            <div class="hero__cta"><a href="${s.href}" class="btn btn-dark">Alışverişe başla</a><a href="${catUrl('indirim')}" class="btn btn-ghost">İndirimler</a></div>
          </div>
          <div class="hero__images">${s.ids.map((id, k) => `<img src="${img(product(id).colors[0].images[0])}" alt="" ${i === 0 ? '' : 'loading="lazy"'} ${i === 0 && k === 0 ? 'fetchpriority="high"' : ''}>`).join('')}</div>
        </div>
      </div>`).join('')}
    </div>
    <button class="hero__arrow left-5" type="button" data-hero="-1" aria-label="Önceki slayt">${icon('left')}</button>
    <button class="hero__arrow right-5" type="button" data-hero="1" aria-label="Sonraki slayt">${icon('right')}</button>
    <div class="hero__dots">${SLIDES.map((_, i) => `<button type="button" class="${i === 0 ? 'is-active' : ''}" data-hero-dot="${i}" aria-label="${i + 1}. slayt"></button>`).join('')}</div>
  </section>`;

  const categories = `<section class="container-site pt-4 md:pt-6" aria-label="Kategoriler">
    <div class="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
      ${CATALOG.categories.map((c) => { const pr = P.find((p) => p.category === c.slug); return `<a class="cat-tile" href="${catUrl(c.slug)}"><img src="${img(pr.colors[0].images[0])}" alt="" loading="lazy"><span class="cat-tile__name">${esc(c.name)}</span><span class="cat-tile__sub">${esc(c.blurb)}</span></a>`; }).join('')}
    </div>
  </section>`;

  // Hafta sonu kampanyası: pazar 23.59'a geri sayım (açılış penceresiyle aynı saat)
  const saleItems = P.filter((p) => p.salePrice && p.salePrice / p.price <= 0.85 && ['sarj-guc', 'kulaklik', 'kablolar'].includes(p.category));
  const campaign = `<section class="bg-ink text-white overflow-hidden">
    <div class="container-site grid md:grid-cols-2 items-center gap-8 py-12 md:py-0">
      <div class="md:py-16 text-center md:text-left">
        <p class="text-sm md:text-base tracking-[.25em] uppercase text-gold font-semibold">Hafta sonuna özel</p>
        <h2 class="font-bold tracking-tight text-[40px] md:text-[60px] leading-[1] mt-3">%20'ye varan indirim</h2>
        <div class="flex gap-3 justify-center md:justify-start mt-7" id="countdown" aria-live="off">${SA.countdownHtml()}</div>
        <a href="${catUrl('indirim')}" class="btn btn-ghost mt-8">İndirimleri gör</a>
      </div>
      <div class="hidden md:grid grid-cols-2 gap-4 lg:gap-5 py-12 relative isolate campaign__cards">
        ${saleItems.filter((p, i, a) => a.findIndex((x) => x.category === p.category) === i).slice(0, 2).map((p) => `<a href="${productUrl(p)}" class="block relative"><img src="${img(p.colors[0].images[0], 720)}" alt="${esc(p.name)}" class="w-full aspect-square object-contain bg-white p-6 rounded-2xl shadow-[0_24px_50px_-24px_rgba(0,0,0,.75)]" loading="lazy"><span class="badge absolute left-4 top-4">%${SA.pct(p)} indirim</span></a>`).join('')}
      </div>
    </div>
  </section>`;

  const TABS = [
    { key: 'new', label: 'Yeni ürünler', list: () => P.filter((p) => p.isNew) },
    { key: 'sale', label: 'İndirimli ürünler', list: () => [...P].filter((p) => p.salePrice).sort((a, b) => SA.pct(b) - SA.pct(a)) },
    { key: 'best', label: 'Çok satanlar', list: () => P.filter((p) => p.isBestSeller) },
  ];
  const tabs = `<section class="container-site py-12 md:py-16">
    <div class="tabs" role="tablist">${TABS.map((t, i) => `<button type="button" role="tab" class="tab${i === 0 ? ' is-active' : ''}" data-tab="${t.key}" aria-selected="${i === 0}">${t.label}</button>`).join('')}</div>
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-8 md:gap-x-6 md:gap-y-10 mt-8" id="tab-grid"></div>
    <div class="text-center mt-10"><a class="btn btn-light" id="tab-more" href="${catUrl('yeni')}">Tümünü gör</a></div>
  </section>`;

  const sets = `<section class="container-site py-4 md:py-8">
    <h2 class="text-[26px] md:text-[32px] font-medium tracking-tight mb-6">Koleksiyonlar</h2>
    <div class="grid md:grid-cols-[2fr_1fr] gap-3 md:gap-6">
      ${[['ap1009', 'Şarj setleri', 'GaN adaptör ve hızlı şarj kabloları', catUrl('sarj-guc', 'sarj-adaptoru')], ['ap1050', 'Kulaklık dünyası', 'TWS, spor ve kablolu modeller', catUrl('kulaklik')]]
        .map(([id, t, s, hr]) => `<a href="${hr}" class="group relative block overflow-hidden bg-gradient-to-br from-ink to-[#3a0b0e] text-white min-h-[260px] md:min-h-[360px]">
          <img src="${img(product(id).colors[0].images[0])}" alt="" class="absolute right-4 bottom-4 w-[48%] max-h-[85%] object-contain rounded-md bg-white p-3 transition-transform duration-[1200ms] group-hover:scale-[1.04]" loading="lazy">
          <div class="relative p-6 md:p-8 max-w-[52%]"><p class="font-bold tracking-tight text-[30px] md:text-[38px] leading-tight">${t}</p><p class="text-white/70 mt-2 text-sm">${s}</p><span class="inline-block mt-5 text-[12px] tracking-[.14em] font-semibold border-b border-white pb-0.5 uppercase">Ürünlere göz at</span></div>
        </a>`).join('')}
    </div>
  </section>`;

  const BRANDS = ['Samsung', 'Ttec', 'SChitec', 'DVIP', 'Philips', 'Aukey', 'AKG', 'TECNO', 'Hypergear', 'Trust'];
  const brands = `<section class="py-10 md:py-14" aria-label="Markalarımız">
    <p class="text-center text-muted mb-5">Satışını yaptığımız markalar</p>
    <div class="marquee"><div class="marquee__track">${[...BRANDS, ...BRANDS].map((b) => `<span class="marquee__item">${esc(b)}</span>`).join('')}</div></div>
  </section>`;

  const instagram = SA.stories.section();

  $('#main').innerHTML = [
    hero,
    categories,
    rail('Vitrin ürünler', P.filter((p) => p.isFeatured).slice(0, 12), { href: catUrl('tum'), cls: 'pt-14 md:pt-20 pb-4' }),
    rail('Yeni gelenler', P.filter((p) => p.isNew).slice(0, 14), { sub: 'Bu hafta stoklara giren ürünler', href: catUrl('yeni'), cls: 'py-10 md:py-14' }),
    campaign,
    tabs,
    sets,
    brands,
    instagram,
  ].join('');
  initRails();

  // Hero slider
  const track = $('#hero-track');
  const slides = $$('.hero__slide', track);
  let current = 0;
  let timer;
  const go = (i) => {
    current = (i + slides.length) % slides.length;
    track.style.transform = `translateX(-${current * 100}%)`;
    slides.forEach((s, k) => s.classList.toggle('is-active', k === current));
    $$('[data-hero-dot]').forEach((d, k) => d.classList.toggle('is-active', k === current));
    clearInterval(timer);
    timer = setInterval(() => go(current + 1), 6500);
  };
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-hero]');
    const d = e.target.closest('[data-hero-dot]');
    if (a) go(current + +a.dataset.hero);
    if (d) go(+d.dataset.heroDot);
  });
  let startX = null;
  track.addEventListener('touchstart', (e) => (startX = e.touches[0].clientX), { passive: true });
  track.addEventListener('touchend', (e) => {
    if (startX == null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) go(current + (dx < 0 ? 1 : -1));
    startX = null;
  });
  go(0);

  SA.startCountdown($('#countdown'));

  // Sekmeli ürün grid'i
  const drawTab = (key) => {
    const t = TABS.find((x) => x.key === key);
    $('#tab-grid').innerHTML = t.list().slice(0, 8).map((p) => productCard(p)).join('');
    $('#tab-more').href = catUrl(key === 'sale' ? 'indirim' : key === 'new' ? 'yeni' : 'tum');
    $$('[data-tab]').forEach((b) => { b.classList.toggle('is-active', b.dataset.tab === key); b.setAttribute('aria-selected', b.dataset.tab === key); });
  };
  $$('[data-tab]').forEach((b) => b.addEventListener('click', () => drawTab(b.dataset.tab)));
  drawTab('new');
})();
