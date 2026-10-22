// Kategori ve arama sonuçları — aynı liste motoru (filtre, sıralama, sütun, daha fazla göster)
(function () {
  const { $, $$, esc, money, pct, icon, param, productCard, category, subcategory, catUrl, search, open, close } = SA;
  const P = CATALOG.products;
  const isSearch = document.body.dataset.page === 'search';
  const PAGE = 12;

  const DESCRIPTIONS = {
    yeni: 'Bu hafta stoklara giren ürünler. Stoklar sınırlı, beğendiğini kaçırma.',
    indirim: 'Seçili ürünlerde %50\'ye varan indirim. İndirimli fiyatlar sepette geçerli.',
    tum: 'Tüm ürünler tek sayfada.',
    'sarj-guc': 'Adaptör, powerbank ve kablosuz şarj çözümleri.',
    kablolar: 'Type-C, Lightning ve micro USB; hızlı şarj ve data kabloları.',
    kulaklik: 'Bluetooth ve kablolu kulaklıklar.',
    'kilif-koruma': 'Telefon kılıfları ve ekran koruyucular.',
    arac: 'Araç içi telefon tutucu ve araç şarj çözümleri.',
    'akilli-teknoloji': 'Akıllı saatler, kordonlar ve Bluetooth hoparlörler.',
  };

  // ---------------------------------------------------------------- temel liste
  const c = param('c') || 'tum';
  const s = param('s');
  const q = (param('q') || '').trim();
  let title; let crumbs = [['Anasayfa', 'index.html']]; let base; let chips = [];
  if (isSearch) {
    title = q ? `“${q}” için sonuçlar` : 'Arama';
    crumbs.push(['Arama', null]);
    base = q ? search(q) : [];
  } else if (c === 'yeni') {
    title = 'Yeni Gelenler'; base = P.filter((p) => p.isNew); crumbs.push([title, null]);
  } else if (c === 'indirim') {
    title = 'İndirim'; base = P.filter((p) => p.salePrice); crumbs.push([title, null]);
  } else if (category(c)) {
    const cat = category(c);
    title = cat.name;
    base = P.filter((p) => p.category === c);
    chips = cat.children.map((x) => ({ href: catUrl(c, x.slug), label: x.name, active: x.slug === s, count: P.filter((p) => p.subcategory === x.slug).length }));
    chips.unshift({ href: catUrl(c), label: 'Tümü', active: !s, count: base.length });
    if (s && subcategory(s)) {
      crumbs.push([cat.name, catUrl(c)]);
      title = subcategory(s).name;
      base = base.filter((p) => p.subcategory === s);
    }
    crumbs.push([title, null]);
  } else {
    title = 'Tüm Ürünler'; base = P; crumbs.push([title, null]);
  }
  document.title = `${isSearch ? 'Arama' : title} | Ar-Pol`;

  // ---------------------------------------------------------------- facet'ler
  const SIZE_ORDER = ['STD', 'XS', 'S', 'SM', 'M', 'L', 'LXL', 'XL', '2XL', '3XL'];
  const sizeRank = (x) => { const i = SIZE_ORDER.indexOf(x); return i >= 0 ? i : 100 + (parseFloat(x) || 0); };
  const facetSizes = [...new Set(base.flatMap((p) => p.sizes.filter((z) => z.stock > 0).map((z) => z.name)))].sort((a, b) => sizeRank(a) - sizeRank(b));
  const colorMap = new Map();
  base.forEach((p) => p.colors.forEach((x) => { if (!colorMap.has(x.name)) colorMap.set(x.name, x.hex); }));
  const facetColors = [...colorMap.entries()].sort((a, b) => a[0].localeCompare(b[0], 'tr'));
  const facetBrands = [...new Set(base.map((p) => p.brand))].sort((a, b) => a.localeCompare(b, 'tr'));
  const priceOf = (p) => p.salePrice || p.price;
  const minP = base.length ? Math.floor(Math.min(...base.map(priceOf)) / 100) * 100 : 0;
  const maxP = base.length ? Math.ceil(Math.max(...base.map(priceOf)) / 100) * 100 : 0;

  const state = { sizes: new Set(), colors: new Set(), brands: new Set(), min: minP, max: maxP, sort: 'onerilen', cols: 4, limit: PAGE };
  try { state.cols = +localStorage.getItem('sa_cols') || 4; } catch (e) { /* yok say */ }

  const SORTS = { onerilen: 'Önerilen', 'fiyat-artan': 'Fiyat: düşükten yükseğe', 'fiyat-azalan': 'Fiyat: yüksekten düşüğe', yeni: 'En yeniler', indirim: 'İndirim oranı' };

  function filtered() {
    let list = base.filter((p) =>
      (!state.sizes.size || p.sizes.some((z) => z.stock > 0 && state.sizes.has(z.name))) &&
      (!state.colors.size || p.colors.some((x) => state.colors.has(x.name))) &&
      (!state.brands.size || state.brands.has(p.brand)) &&
      priceOf(p) >= state.min && priceOf(p) <= state.max);
    const sorters = {
      'fiyat-artan': (a, b) => priceOf(a) - priceOf(b),
      'fiyat-azalan': (a, b) => priceOf(b) - priceOf(a),
      yeni: (a, b) => b.createdAt - a.createdAt,
      indirim: (a, b) => pct(b) - pct(a),
    };
    if (sorters[state.sort]) list = [...list].sort(sorters[state.sort]);
    return list;
  }
  const activeCount = () => state.sizes.size + state.colors.size + state.brands.size + (state.min > minP || state.max < maxP ? 1 : 0);

  // ---------------------------------------------------------------- şablonlar
  const group = (key, label, body, openByDefault = true) => `<details class="filter-group" ${openByDefault ? 'open' : ''} data-group="${key}">
      <summary>${label}${icon('down', 'w-4 h-4 transition-transform')}</summary><div class="pb-5">${body}</div></details>`;

  function filtersHtml(prefix) {
    const pctMin = maxP > minP ? ((state.min - minP) / (maxP - minP)) * 100 : 0;
    const pctMax = maxP > minP ? ((state.max - minP) / (maxP - minP)) * 100 : 100;
    return [
      facetSizes.length > 1 ? group('beden', 'Seçenek', `<div class="flex flex-wrap gap-2">${facetSizes.map((z) => `<button type="button" class="size-btn !min-w-[48px] !h-10 ${state.sizes.has(z) ? 'is-active' : ''}" data-f-size="${esc(z)}" aria-pressed="${state.sizes.has(z)}">${esc(z)}</button>`).join('')}</div>`) : '',
      facetColors.length ? group('renk', 'Renk', `<ul class="space-y-2.5">${facetColors.map(([n, hex]) => `<li><label class="check items-center"><input type="checkbox" data-f-color="${esc(n)}" ${state.colors.has(n) ? 'checked' : ''}><span class="swatch-dot !w-4 !h-4" style="background:${hex}"></span><span>${esc(n)}</span></label></li>`).join('')}</ul>`) : '',
      base.length > 1 && maxP > minP ? group('fiyat', 'Fiyat', `
        <div class="range" data-range>
          <div class="range__track"></div><div class="range__fill" style="left:${pctMin}%;right:${100 - pctMax}%"></div>
          <input type="range" min="${minP}" max="${maxP}" step="50" value="${state.min}" data-f-min aria-label="En düşük fiyat">
          <input type="range" min="${minP}" max="${maxP}" step="50" value="${state.max}" data-f-max aria-label="En yüksek fiyat">
        </div>
        <div class="flex justify-between text-sm mt-2"><span data-min-label>${money(state.min)}</span><span data-max-label>${money(state.max)}</span></div>`) : '',
      facetBrands.length > 1 ? group('marka', 'Marka', `<ul class="space-y-2.5">${facetBrands.map((b) => `<li><label class="check"><input type="checkbox" data-f-brand="${esc(b)}" ${state.brands.has(b) ? 'checked' : ''}><span>${esc(b)}</span></label></li>`).join('')}</ul>`, prefix === 'aside') : '',
    ].join('');
  }

  function activeTags() {
    const tags = [
      ...[...state.sizes].map((v) => ['size', v, `Seçenek: ${v}`]),
      ...[...state.colors].map((v) => ['color', v, v]),
      ...[...state.brands].map((v) => ['brand', v, v]),
    ];
    if (state.min > minP || state.max < maxP) tags.push(['price', '', `${money(state.min)} – ${money(state.max)}`]);
    if (!tags.length) return '';
    return `<div class="flex flex-wrap items-center gap-2 mb-6">${tags.map(([k, v, l]) => `<button type="button" class="chip !h-8 !text-[13px]" data-untag="${k}" data-val="${esc(v)}">${esc(l)}${icon('close', 'w-3.5 h-3.5')}</button>`).join('')}
      <button type="button" class="text-sm link-underline ml-1" data-clear>Filtreleri temizle</button></div>`;
  }

  const gridCols = () => ({ 2: 'grid-cols-2', 3: 'grid-cols-2 lg:grid-cols-3', 4: 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' })[state.cols];

  // ---------------------------------------------------------------- iskelet
  $('#main').innerHTML = `
    <div class="container-site">
      <nav class="py-5 text-sm text-muted" aria-label="Sayfa yolu"><ol class="flex flex-wrap gap-2">${crumbs.map(([l, h], i) => `<li class="flex gap-2">${i ? '<span aria-hidden="true">/</span>' : ''}${h ? `<a class="hover:text-ink" href="${h}">${esc(l)}</a>` : `<span class="text-ink" aria-current="page">${esc(l)}</span>`}</li>`).join('')}</ol></nav>
      <header class="pb-6 md:pb-8">
        <h1 class="text-[32px] md:text-[44px] font-medium tracking-tight leading-tight">${esc(title)}</h1>
        <p class="text-muted mt-2 max-w-2xl">${isSearch ? (q ? `${base.length} ürün bulundu.` : 'Aramak istediğin ürünü yaz.') : esc(DESCRIPTIONS[s ? c : c] || '')}</p>
        ${isSearch ? `<form action="arama.html" class="mt-5 flex max-w-xl" role="search"><label class="sr-only" for="q2">Ürün ara</label><input id="q2" name="q" class="input !border-r-0" value="${esc(q)}" placeholder="Ürün, kategori ya da renk ara"><button class="btn btn-dark !h-12" type="submit">Ara</button></form>` : ''}
      </header>
      ${chips.length ? `<div class="flex gap-2 overflow-x-auto no-scrollbar pb-6 -mx-4 px-4 md:mx-0 md:px-0">${chips.map((x) => `<a class="chip ${x.active ? 'is-active' : ''}" href="${x.href}">${esc(x.label)} <span class="opacity-60">${x.count}</span></a>`).join('')}</div>` : ''}
      <div class="flex items-center justify-between gap-3 border-y border-line py-3 mb-6 sticky top-[64px] lg:top-[68px] bg-white z-20">
        <button type="button" class="btn btn-light btn-sm lg:hidden" data-open-filters>${icon('filter', 'w-4 h-4')}Filtrele <span data-filter-count></span></button>
        <p class="hidden lg:block text-sm text-muted" data-result-count></p>
        <div class="flex items-center gap-4">
          <label class="flex items-center gap-2 text-sm"><span class="hidden sm:inline text-muted">Sırala</span>
            <select class="input !h-10 !w-auto max-w-[150px] sm:max-w-none !text-sm" data-sort>${Object.entries(SORTS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></label>
          <div class="hidden lg:flex items-center gap-1" role="group" aria-label="Sütun sayısı">
            ${[2, 3, 4].map((n) => `<button type="button" class="w-9 h-9 flex items-center justify-center border ${state.cols === n ? 'border-ink' : 'border-transparent'}" data-cols="${n}" aria-label="${n} sütun" aria-pressed="${state.cols === n}">
              <span class="grid gap-[2px]" style="grid-template-columns:repeat(${n},1fr)">${'<span class="block w-[5px] h-[14px] bg-current"></span>'.repeat(n)}</span></button>`).join('')}
          </div>
        </div>
      </div>
      <div class="grid lg:grid-cols-[250px_1fr] gap-10 pb-16">
        <aside class="hidden lg:block self-start sticky top-[140px] max-h-[calc(100vh-160px)] overflow-y-auto pr-2 no-scrollbar" aria-label="Filtreler" data-filters="aside"></aside>
        <section aria-live="polite">
          <div data-tags></div>
          <div class="grid gap-x-3 gap-y-8 md:gap-x-6 md:gap-y-10" data-grid></div>
          <div class="text-center mt-12" data-more></div>
        </section>
      </div>
    </div>
    <aside class="drawer drawer--bottom" id="filter-drawer" aria-label="Filtreler" aria-hidden="true">
      <div class="drawer__head"><p class="text-lg font-medium">Filtrele</p><button class="icon-btn" type="button" data-close aria-label="Kapat">${icon('close')}</button></div>
      <div class="drawer__body px-5" data-filters="drawer"></div>
      <div class="drawer__foot grid grid-cols-2 gap-3"><button type="button" class="btn btn-light" data-clear>Temizle</button><button type="button" class="btn btn-dark" data-close data-show-results></button></div>
    </aside>`;

  // ---------------------------------------------------------------- çizim
  function drawFilters() {
    $$('[data-filters]').forEach((el) => {
      const openState = {};
      $$('details', el).forEach((d) => (openState[d.dataset.group] = d.open));
      el.innerHTML = filtersHtml(el.dataset.filters);
      $$('details', el).forEach((d) => { if (d.dataset.group in openState) d.open = openState[d.dataset.group]; });
    });
  }
  function drawList() {
    const list = filtered();
    const grid = $('[data-grid]');
    grid.className = `grid gap-x-3 gap-y-8 md:gap-x-6 md:gap-y-10 ${gridCols()}`;
    grid.innerHTML = list.length
      ? list.slice(0, state.limit).map((p) => productCard(p)).join('')
      : `<div class="col-span-full text-center py-16 bg-blush">
          <p class="text-xl font-medium">${base.length ? 'Seçtiğin filtrelerle eşleşen ürün yok' : isSearch && q ? `“${esc(q)}” için ürün bulunamadı` : 'Bu kategoride henüz ürün yok'}</p>
          <p class="text-muted mt-2">${base.length ? 'Birkaç filtreyi kaldırarak tekrar dene.' : 'Daha genel bir kelime dene ya da yeni gelenlere göz at.'}</p>
          ${base.length ? '<button type="button" class="btn btn-dark mt-6" data-clear>Filtreleri temizle</button>' : `<a class="btn btn-dark mt-6" href="${catUrl('yeni')}">Yeni gelenleri gör</a>`}
        </div>`;
    const shown = Math.min(state.limit, list.length);
    $('[data-more]').innerHTML = list.length > state.limit
      ? `<p class="text-sm text-muted mb-3">${list.length} ürünün ${shown} tanesini görüyorsun</p><div class="h-[2px] w-48 mx-auto bg-line mb-5"><div class="h-full bg-ink" style="width:${(shown / list.length) * 100}%"></div></div><button type="button" class="btn btn-light" data-load-more>Daha fazla göster</button>`
      : list.length ? `<p class="text-sm text-muted">${list.length} ürünün tamamını görüyorsun</p>` : '';
    $('[data-result-count]').textContent = `${list.length} ürün`;
    $('[data-tags]').innerHTML = activeTags();
    const n = activeCount();
    $('[data-filter-count]').textContent = n ? `(${n})` : '';
    $('[data-show-results]').textContent = `${list.length} ürünü göster`;
  }
  function update() { state.limit = PAGE; drawFilters(); drawList(); }

  // ---------------------------------------------------------------- olaylar
  $('#main').addEventListener('click', (e) => {
    const t = e.target;
    const size = t.closest('[data-f-size]');
    if (size) { const v = size.dataset.fSize; state.sizes.has(v) ? state.sizes.delete(v) : state.sizes.add(v); return update(); }
    const untag = t.closest('[data-untag]');
    if (untag) {
      const { untag: k, val } = untag.dataset;
      if (k === 'size') state.sizes.delete(val);
      if (k === 'color') state.colors.delete(val);
      if (k === 'brand') state.brands.delete(val);
      if (k === 'price') { state.min = minP; state.max = maxP; }
      return update();
    }
    if (t.closest('[data-clear]')) { state.sizes.clear(); state.colors.clear(); state.brands.clear(); state.min = minP; state.max = maxP; return update(); }
    if (t.closest('[data-load-more]')) { state.limit += PAGE; return drawList(); }
    const cols = t.closest('[data-cols]');
    if (cols) {
      state.cols = +cols.dataset.cols;
      try { localStorage.setItem('sa_cols', state.cols); } catch (err) { /* yok say */ }
      $$('[data-cols]').forEach((b) => { const on = +b.dataset.cols === state.cols; b.classList.toggle('border-ink', on); b.classList.toggle('border-transparent', !on); b.setAttribute('aria-pressed', on); });
      return drawList();
    }
    if (t.closest('[data-open-filters]')) open($('#filter-drawer'));
  });
  $('#main').addEventListener('change', (e) => {
    const t = e.target;
    if (t.matches('[data-f-color]')) { t.checked ? state.colors.add(t.dataset.fColor) : state.colors.delete(t.dataset.fColor); return update(); }
    if (t.matches('[data-f-brand]')) { t.checked ? state.brands.add(t.dataset.fBrand) : state.brands.delete(t.dataset.fBrand); return update(); }
    if (t.matches('[data-f-min], [data-f-max]')) return update();
    if (t.matches('[data-sort]')) { state.sort = t.value; return drawList(); }
  });
  // Fiyat sürgüsü: sürüklerken etiketleri güncelle, bırakınca filtrele
  $('#main').addEventListener('input', (e) => {
    const t = e.target;
    if (!t.matches('[data-f-min], [data-f-max]')) return;
    const wrap = t.closest('[data-range]');
    let lo = +$('[data-f-min]', wrap).value;
    let hi = +$('[data-f-max]', wrap).value;
    if (lo > hi - 100) { if (t.matches('[data-f-min]')) lo = hi - 100; else hi = lo + 100; t.value = t.matches('[data-f-min]') ? lo : hi; }
    state.min = Math.max(minP, lo); state.max = Math.min(maxP, hi);
    const fill = $('.range__fill', wrap);
    fill.style.left = ((state.min - minP) / (maxP - minP)) * 100 + '%';
    fill.style.right = 100 - ((state.max - minP) / (maxP - minP)) * 100 + '%';
    $('[data-min-label]', wrap.parentElement).textContent = money(state.min);
    $('[data-max-label]', wrap.parentElement).textContent = money(state.max);
  });

  // Mobil filtre çekmecesindeki "N ürünü göster" kapatma düğmesi ui.js'teki [data-close] ile kapanır
  drawFilters();
  drawList();
})();
