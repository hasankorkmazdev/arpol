// Ürün detay sayfası
(function () {
  const { $, $$, esc, money, pct, img, icon, waIcon, stars, param, product, category, subcategory, productCard, rail, initRails, catUrl, productUrl, addToCart, modal, toast, WA } = SA;
  const store = SA.store;
  const p = product(param('id')) || CATALOG.products[0];
  const cat = category(p.category);
  const sub = subcategory(p.subcategory);
  let colorIdx = Math.min(+(param('renk') || 0), p.colors.length - 1);
  const inStock = p.sizes.filter((s) => s.stock > 0);
  let size = inStock.length === 1 ? inStock[0].name : null;
  let qty = 1;
  const price = p.salePrice || p.price;
  document.title = `${p.name} | Ar-Pol`;
  store.pushRecent(p.id);

  const REVIEWS = [
    ['Ayşe K.', 5, 'Kumaşı çok kaliteli, kalıbı tam oturdu. Kargo ertesi gün geldi.'],
    ['Zeynep T.', 5, 'Fotoğraftaki gibi, rengi canlıda daha da güzel. Paketleme çok özenliydi.'],
    ['Merve A.', 4, 'Hızlı geldi, ürün tam tarif edildiği gibi. Telefonumla sorunsuz çalışıyor.'],
  ];

  const sizeGuide = () => modal(`<div class="p-8">
    <h2 class="text-2xl font-medium">Beden tablosu</h2>
    <p class="text-muted mt-1 text-sm">Ölçüler santimetredir; iki beden arasında kalırsan büyük bedeni öneririz.</p>
    <table class="w-full mt-6 text-sm text-left">
      <thead><tr class="border-b border-ink"><th class="py-2 font-medium">Beden</th><th class="font-medium">Karşılığı</th><th class="font-medium">Göğüs</th><th class="font-medium">Bel</th><th class="font-medium">Basen</th></tr></thead>
      <tbody class="divide-y divide-line">
        ${[['1 / S', '36–38', '88–92', '70–74', '96–100'], ['2 / M', '40–42', '96–100', '78–82', '104–108'], ['3 / L', '44–46', '104–108', '86–90', '112–116'], ['4 / XL', '48–50', '112–116', '94–98', '120–124'], ['STD', '36–44', 'Bol kesim', '—', '—']]
          .map((r) => `<tr>${r.map((c, i) => `<td class="py-2.5 ${i === 0 ? 'font-medium' : ''}">${c}</td>`).join('')}</tr>`).join('')}
      </tbody>
    </table>
    <p class="text-sm mt-5">Emin olamadın mı? <a class="link-underline" href="${WA}" target="_blank" rel="noopener">WhatsApp'tan sor</a>, mağazadan ölçü bilgisi verelim.</p>
  </div>`, 600);

  const installments = [1, 2, 3].map((n) => [n, price / n]);

  $('#main').innerHTML = `
    <div class="container-site">
      <nav class="py-5 text-sm text-muted" aria-label="Sayfa yolu"><ol class="flex flex-wrap gap-2">
        <li><a class="hover:text-ink" href="index.html">Anasayfa</a></li><li aria-hidden="true">/</li>
        <li><a class="hover:text-ink" href="${catUrl(cat.slug)}">${esc(cat.name)}</a></li><li aria-hidden="true">/</li>
        <li><a class="hover:text-ink" href="${catUrl(cat.slug, sub.slug)}">${esc(sub.name)}</a></li><li aria-hidden="true">/</li>
        <li class="text-ink" aria-current="page">${esc(p.name)}</li></ol></nav>

      <div class="grid lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-6 lg:gap-14 pb-16">
        <div>
          <div class="pdp-gallery no-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0" data-gallery></div>
          <div class="flex justify-center gap-1.5 mt-3 lg:hidden" data-gallery-dots></div>
        </div>

        <div class="lg:sticky lg:top-[96px] self-start">
          <a href="arama.html?q=${encodeURIComponent(p.brand)}" class="text-sm text-muted hover:text-ink">${esc(p.brand)}</a>
          <h1 class="text-[26px] md:text-[32px] font-medium leading-tight tracking-tight mt-1">${esc(p.name)}</h1>
          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-muted">
            <span>Stok kodu: ${esc(p.sku)}</span>
            <a href="#yorumlar" class="flex items-center gap-1.5 hover:text-ink" data-goto-reviews>${stars(p.rating)}<span>${p.reviewCount} değerlendirme</span></a>
          </div>
          <div class="flex items-center gap-3 mt-5">
            ${pct(p) ? `<span class="badge !text-[12px] !px-2.5 !py-1.5">%${pct(p)} indirim</span>` : ''}
            ${SA.priceHtml(p, true).replace('class="price"', 'class="price !mt-0"')}
          </div>
          <p class="text-sm text-charcoal mt-2">Peşin fiyatına 3 taksit: ${money(price / 3)} × 3</p>

          <div class="mt-7">
            <p class="text-sm mb-2.5">Renk: <b class="font-medium" data-color-name>${esc(p.colors[colorIdx].name)}</b></p>
            <div class="flex flex-wrap gap-1.5">${p.colors.map((c, i) => `<button type="button" class="color-btn" data-color="${i}" aria-label="${esc(c.name)}" title="${esc(c.name)}"><span style="background:${c.hex}"></span></button>`).join('')}</div>
          </div>

          <div class="mt-6${p.sizes.length === 1 ? ' hidden' : ''}">
            <div class="flex items-center justify-between mb-2.5">
              <p class="text-sm">Seçenek${size && inStock.length === 1 ? '' : ': <b class="font-medium" data-size-name>seçilmedi</b>'}</p>
            </div>
            <div class="flex flex-wrap gap-2" data-sizes>${p.sizes.map((s) => `<button type="button" class="size-btn${size === s.name ? ' is-active' : ''}" data-size="${esc(s.name)}" ${s.stock ? '' : 'disabled aria-disabled="true" title="Tükendi"'}>${esc(s.name)}</button>`).join('')}</div>
            <p class="text-sm mt-2.5 min-h-[1.4em]" data-stock-note></p>
          </div>

          <div class="flex gap-3 mt-4">
            <div class="qty" aria-label="Adet"><button type="button" data-q="-1" aria-label="Azalt">−</button><input type="number" value="1" min="1" data-q-input aria-label="Adet"><button type="button" data-q="1" aria-label="Artır">+</button></div>
            <button type="button" class="btn btn-dark flex-1 min-w-0 !px-3" data-add>Sepete ekle</button>
            <button type="button" class="btn btn-light !px-0 w-[50px] shrink-0" data-fav="${p.id}" aria-pressed="${store.isFav(p.id)}" aria-label="${store.isFav(p.id) ? 'Favorilerden çıkar' : 'Favorilere ekle'}">${icon('heart', `w-5 h-5 icon-heart${store.isFav(p.id) ? ' is-on' : ''}`)}</button>
          </div>
          <button type="button" class="btn btn-light w-full mt-3" data-buy-now>Hemen al</button>
          <a href="${WA}?text=${encodeURIComponent(`Merhaba, ${p.name} (${p.sku}) hakkında bilgi almak istiyorum.`)}" target="_blank" rel="noopener" class="flex items-center justify-center gap-2 text-sm mt-4 hover:underline underline-offset-4">${waIcon('w-4 h-4 text-[#25d366]')}WhatsApp ile sipariş ver</a>

          <ul class="mt-7 border border-line divide-y divide-line text-sm">
            <li class="flex gap-3 p-4">${icon('truck', 'w-5 h-5 shrink-0')}<span><b class="font-medium">Aynı gün kargo.</b> Saat 16.00'ya kadar verilen siparişler bugün kargoda. ${money(store.FREE_SHIPPING)} üzeri ücretsiz.</span></li>
            <li class="flex gap-3 p-4">${icon('store', 'w-5 h-5 shrink-0')}<span><b class="font-medium">Mağazadan teslim al.</b> İstanbul mağazamızdan ücretsiz teslim alabilirsin.</span></li>
            <li class="flex gap-3 p-4">${icon('refresh', 'w-5 h-5 shrink-0')}<span><b class="font-medium">14 gün içinde değişim.</b> Kullanılmamış ürünlerde kolay iade ve değişim.</span></li>
          </ul>

          <div class="mt-4">
            <details class="acc" open><summary>Ürün özellikleri${icon('down', 'w-4 h-4')}</summary><div class="acc__body">
              <p>${esc(p.description)}</p>
              <dl class="grid grid-cols-[120px_1fr] gap-y-2 mt-4">${p.features.map(([k, v]) => `<dt class="text-muted">${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}<dt class="text-muted">Renk</dt><dd data-color-name>${esc(p.colors[colorIdx].name)}</dd></dl>
            </div></details>
            <details class="acc"><summary>Kargo ve iade${icon('down', 'w-4 h-4')}</summary><div class="acc__body space-y-2">
              <p>Siparişin Yurtiçi Kargo ile 1–3 iş günü içinde teslim edilir. Kargo takip numarası e-posta ve SMS ile gönderilir.</p>
              <p>Ürünü teslim aldıktan sonra 14 gün içinde ambalajı açılmamış olarak iade edebilir ya da değiştirebilirsin.</p>
            </div></details>
            <details class="acc"><summary>Ödeme seçenekleri${icon('down', 'w-4 h-4')}</summary><div class="acc__body">
              <table class="w-full text-sm"><thead><tr class="text-left text-muted"><th class="font-normal pb-2">Taksit</th><th class="font-normal pb-2">Aylık</th><th class="font-normal pb-2 text-right">Toplam</th></tr></thead>
              <tbody class="divide-y divide-line">${installments.map(([n, m]) => `<tr><td class="py-2">${n === 1 ? 'Tek çekim' : `${n} taksit`}</td><td>${money(m)}</td><td class="text-right">${money(price)}</td></tr>`).join('')}</tbody></table>
              <p class="mt-3 text-muted">Tüm kartlara peşin fiyatına 3 taksit. Kapıda nakit veya kartla ödeme de mümkün.</p>
            </div></details>
            <details class="acc" id="yorumlar"><summary>Yorumlar (${p.reviewCount})${icon('down', 'w-4 h-4')}</summary><div class="acc__body">
              <div class="flex items-center gap-3 mb-4"><span class="text-3xl font-medium text-ink">${p.rating.toFixed(1)}</span>${stars(p.rating, 'w-4 h-4')}<span class="text-muted">${p.reviewCount} değerlendirme</span></div>
              <ul class="divide-y divide-line">${REVIEWS.map(([n, r, t]) => `<li class="py-3"><div class="flex items-center justify-between"><b class="font-medium text-ink">${n}</b>${stars(r)}</div><p class="mt-1">${t}</p></li>`).join('')}</ul>
            </div></details>
          </div>
        </div>
      </div>
    </div>
    <div data-related></div>
    <div data-recent></div>

    <div class="sticky-buy" data-sticky-buy>
      <img src="${img(p.colors[colorIdx].images[0])}" alt="" class="w-11 h-11 object-contain" data-sticky-img>
      <div class="flex-1 min-w-0"><p class="text-sm truncate">${esc(p.name)}</p><p class="font-semibold">${money(price)}</p></div>
      <button type="button" class="btn btn-dark btn-sm !h-11" data-sticky-add>Sepete ekle</button>
    </div>
    <div class="lightbox" data-lightbox role="dialog" aria-modal="true" aria-label="Ürün görseli">
      <img alt="" data-lightbox-img>
      <button type="button" class="hero__arrow left-4 !flex" data-lb="-1" aria-label="Önceki görsel">${icon('left')}</button>
      <button type="button" class="hero__arrow right-4 !flex" data-lb="1" aria-label="Sonraki görsel">${icon('right')}</button>
      <button type="button" class="modal__close !top-4 !right-4" data-lb-close aria-label="Kapat">${icon('close')}</button>
      <p class="absolute bottom-5 left-1/2 -translate-x-1/2 text-sm" data-lb-count></p>
    </div>
    <div class="live-note" data-live><span class="live-dot"></span><span>Şu an <b>${12 + (p.reviewCount % 30)}</b> kişi bu ürünü inceliyor</span></div>`;

  // ---------------------------------------------------------------- galeri
  let lbIndex = 0;
  function drawGallery() {
    const images = p.colors[colorIdx].images;
    $('[data-gallery]').innerHTML = images.map((b, i) => `<button type="button" data-zoom="${i}" aria-label="Görseli büyüt (${i + 1}/${images.length})"><img src="${img(b, 720)}" alt="${esc(p.name)} – ${esc(p.colors[colorIdx].name)} ${i + 1}" ${i > 1 ? 'loading="lazy"' : ''}></button>`).join('');
    $('[data-gallery-dots]').innerHTML = images.map((_, i) => `<span class="w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-ink' : 'bg-line'}" data-dot="${i}"></span>`).join('');
    $$('[data-color]').forEach((b) => b.classList.toggle('is-active', +b.dataset.color === colorIdx));
    $$('[data-color-name]').forEach((el) => (el.textContent = p.colors[colorIdx].name));
    $('[data-sticky-img]').src = img(images[0]);
  }
  const gallery = $('[data-gallery]');
  gallery.addEventListener('scroll', () => {
    const i = Math.round(gallery.scrollLeft / (gallery.firstElementChild?.offsetWidth || 1));
    $$('[data-dot]').forEach((d) => { d.classList.toggle('bg-ink', +d.dataset.dot === i); d.classList.toggle('bg-line', +d.dataset.dot !== i); });
  }, { passive: true });

  const lb = $('[data-lightbox]');
  const showLb = (i) => {
    const images = p.colors[colorIdx].images;
    lbIndex = (i + images.length) % images.length;
    $('[data-lightbox-img]').src = img(images[lbIndex], 720);
    $('[data-lb-count]').textContent = `${lbIndex + 1} / ${images.length}`;
  };

  // ---------------------------------------------------------------- beden & stok
  function drawSize() {
    $$('[data-size]').forEach((b) => b.classList.toggle('is-active', b.dataset.size === size));
    const nameEl = $('[data-size-name]');
    if (nameEl) nameEl.textContent = size || 'seçilmedi';
    const s = p.sizes.find((x) => x.name === size);
    const note = $('[data-stock-note]');
    note.className = 'text-sm mt-2.5 min-h-[1.4em]';
    if (!s) note.textContent = inStock.length < p.sizes.length ? 'Üstü çizili seçenekler tükendi.' : '';
    else if (s.stock <= 2) { note.textContent = `Son ${s.stock} ürün! Tükenmeden sepetine ekle.`; note.classList.add('text-alert'); }
    else note.textContent = 'Stokta, aynı gün kargoda.';
  }

  function requireSize() {
    if (size) return true;
    const el = $('[data-sizes]');
    el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake');
    const note = $('[data-stock-note]');
    note.textContent = 'Lütfen bir seçenek seç.';
    note.className = 'text-sm mt-2.5 min-h-[1.4em] text-alert';
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return false;
  }

  // ---------------------------------------------------------------- olaylar
  $('#main').addEventListener('click', (e) => {
    const t = e.target;
    const c = t.closest('[data-color]');
    if (c) { colorIdx = +c.dataset.color; history.replaceState(null, '', productUrl(p, colorIdx)); return drawGallery(); }
    const s = t.closest('[data-size]');
    if (s && !s.disabled) { size = s.dataset.size; return drawSize(); }
    const q = t.closest('[data-q]');
    if (q) { qty = Math.max(1, Math.min(10, qty + +q.dataset.q)); $('[data-q-input]').value = qty; return; }
    if (t.closest('[data-add], [data-sticky-add]')) { if (requireSize()) addToCart(p.id, colorIdx, size, qty); return; }
    if (t.closest('[data-buy-now]')) { if (requireSize()) { store.addToCart(p.id, colorIdx, size, qty); location.href = 'odeme.html'; } return; }
    if (t.closest('[data-size-guide]')) return sizeGuide();
    if (t.closest('[data-goto-reviews]')) { e.preventDefault(); const r = $('#yorumlar'); r.open = true; r.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    const z = t.closest('[data-zoom]');
    if (z) { showLb(+z.dataset.zoom); lb.classList.add('is-open'); document.body.classList.add('lock'); return; }
    const nav = t.closest('[data-lb]');
    if (nav) return showLb(lbIndex + +nav.dataset.lb);
    if (t.closest('[data-lb-close]') || t === $('[data-lightbox-img]')) { lb.classList.remove('is-open'); document.body.classList.remove('lock'); }
  });
  $('[data-q-input]').addEventListener('change', (e) => { qty = Math.max(1, Math.min(10, parseInt(e.target.value, 10) || 1)); e.target.value = qty; });
  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'Escape') { lb.classList.remove('is-open'); document.body.classList.remove('lock'); }
    if (e.key === 'ArrowRight') showLb(lbIndex + 1);
    if (e.key === 'ArrowLeft') showLb(lbIndex - 1);
  });

  // Mobilde ana buton görünmezken alttaki yapışkan bar
  const sticky = $('[data-sticky-buy]');
  new IntersectionObserver(([en]) => {
    const show = !en.isIntersecting && en.boundingClientRect.top < 0;
    sticky.classList.toggle('is-open', show);
    document.body.classList.toggle('has-sticky-buy', show);
  }).observe($('[data-add]'));

  // "Şu an X kişi inceliyor"
  const live = $('[data-live]');
  setTimeout(() => live.classList.add('is-open'), 3500);
  setTimeout(() => live.classList.remove('is-open'), 11000);

  // ---------------------------------------------------------------- ilgili ürünler
  const related = CATALOG.products.filter((x) => x.id !== p.id && x.subcategory === p.subcategory)
    .concat(CATALOG.products.filter((x) => x.id !== p.id && x.category === p.category && x.subcategory !== p.subcategory))
    .slice(0, 10);
  $('[data-related]').innerHTML = rail('Bunu da beğenebilirsin', related, { href: catUrl(cat.slug), cls: 'py-12 border-t border-line' });
  const recent = store.recent().filter((id) => id !== p.id).map(product).slice(0, 10);
  if (recent.length) $('[data-recent]').innerHTML = rail('Son incelediklerin', recent, { cls: 'pb-16' });
  initRails();

  drawGallery();
  drawSize();
})();
