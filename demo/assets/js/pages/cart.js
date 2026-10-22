// Sepet sayfası
(function () {
  const { $, esc, money, img, icon, productUrl, rail, initRails, catUrl, toast } = SA;
  const store = SA.store;
  let couponMsg = null;

  function summaryHtml(t) {
    const c = store.coupon();
    return `<div class="bg-blush p-6 md:p-7">
      <h2 class="text-xl font-medium">Sipariş özeti</h2>
      <form class="mt-5" data-coupon-form>
        <label class="text-sm text-charcoal" for="coupon">İndirim kodu</label>
        ${c ? `<div class="flex items-center justify-between mt-2 bg-white border border-line px-4 h-12"><span class="text-sm"><b class="font-medium">${esc(c)}</b> · ${esc(t.coupon.label)}</span><button type="button" class="text-sm link-underline" data-remove-coupon>Kaldır</button></div>`
          : `<div class="flex mt-2"><input id="coupon" name="code" class="input !border-r-0 uppercase" placeholder="Kodu gir" autocomplete="off"><button class="btn btn-dark !h-12 !px-5" type="submit">Uygula</button></div>`}
        ${couponMsg ? `<p class="text-sm mt-2 ${couponMsg.ok ? 'text-[#2f7a4b]' : 'text-alert'}">${esc(couponMsg.message)}</p>` : '<p class="text-xs text-muted mt-2">Demo kodları: HOSGELDIN10, ARPOL100</p>'}
      </form>
      <dl class="mt-6 space-y-3 text-[15px]">
        <div class="flex justify-between"><dt>Ürünler (${t.count})</dt><dd>${money(t.listTotal)}</dd></div>
        ${t.saved ? `<div class="flex justify-between text-charcoal"><dt>Ürün indirimleri</dt><dd>−${money(t.saved)}</dd></div>` : ''}
        ${t.discount ? `<div class="flex justify-between text-charcoal"><dt>Kupon (${esc(t.coupon.code)})</dt><dd>−${money(t.discount)}</dd></div>` : ''}
        <div class="flex justify-between"><dt>Kargo</dt><dd>${t.shipping ? money(t.shipping) : 'Ücretsiz'}</dd></div>
        <div class="flex justify-between border-t border-blush-deep pt-4 text-lg font-semibold"><dt>Toplam</dt><dd>${money(t.total)}</dd></div>
      </dl>
      <a href="odeme.html" class="btn btn-dark w-full mt-6">Alışverişi tamamla</a>
      <ul class="mt-5 space-y-2 text-sm text-charcoal">
        <li class="flex gap-2">${icon('lock', 'w-4 h-4 mt-0.5 shrink-0')}256-bit SSL ve 3D Secure ile güvenli ödeme</li>
        <li class="flex gap-2">${icon('refresh', 'w-4 h-4 mt-0.5 shrink-0')}14 gün içinde kolay değişim ve iade</li>
        <li class="flex gap-2">${icon('card', 'w-4 h-4 mt-0.5 shrink-0')}Peşin fiyatına 3 taksit · ${money(t.total / 3)} × 3</li>
      </ul>
    </div>`;
  }

  function lineRow(l) {
    return `<li class="grid grid-cols-[96px_1fr] md:grid-cols-[120px_1fr] gap-4 md:gap-6 py-6" data-row="${esc(l.key)}">
      <a href="${productUrl(l.product, l.colorIdx)}"><img src="${img(l.color.images[0])}" alt="${esc(l.product.name)}" class="w-full aspect-square object-contain bg-blush"></a>
      <div class="flex flex-col">
        <div class="flex justify-between gap-4">
          <div>
            <p class="text-sm text-muted">${esc(l.product.brand)}</p>
            <a href="${productUrl(l.product, l.colorIdx)}" class="text-[16px] leading-snug hover:underline underline-offset-4">${esc(l.product.name)}</a>
            <p class="text-sm text-charcoal mt-1">Renk: ${esc(l.color.name)} · Seçenek: ${esc(l.size)}</p>
          </div>
          <div class="text-right shrink-0">
            ${l.product.salePrice ? `<p class="text-sm text-muted line-through">${money(l.product.price * l.qty)}</p>` : ''}
            <p class="font-semibold">${money(l.lineTotal)}</p>
            ${l.qty > 1 ? `<p class="text-xs text-muted">${money(l.unit)} / adet</p>` : ''}
          </div>
        </div>
        <div class="flex flex-wrap items-center justify-between gap-3 mt-auto pt-4">
          <div class="qty qty--sm"><button type="button" data-row-qty="-1" aria-label="Azalt">−</button><input type="number" value="${l.qty}" min="1" data-row-input aria-label="Adet"><button type="button" data-row-qty="1" aria-label="Artır">+</button></div>
          <div class="flex gap-5 text-sm">
            <button type="button" class="flex items-center gap-1.5 hover:underline underline-offset-4" data-to-fav>${icon('heart', 'w-4 h-4')}Favorilere taşı</button>
            <button type="button" class="flex items-center gap-1.5 hover:underline underline-offset-4" data-row-remove>${icon('trash', 'w-4 h-4')}Kaldır</button>
          </div>
        </div>
      </div>
    </li>`;
  }

  function draw() {
    const lines = store.cartLines();
    const t = store.totals();
    const recommend = CATALOG.products.filter((p) => !lines.some((l) => l.id === p.id) && (p.category === 'aksesuar' || p.isBestSeller)).slice(0, 10);
    if (!lines.length) {
      $('#main').innerHTML = `<div class="container-site py-16 md:py-24 text-center">
          ${icon('bag', 'w-14 h-14 mx-auto text-muted')}
          <h1 class="text-[32px] font-medium mt-5">Sepetin boş</h1>
          <p class="text-muted mt-2">Beğendiğin ürünleri sepete ekleyerek alışverişe başlayabilirsin.</p>
          <div class="flex flex-wrap justify-center gap-3 mt-8"><a href="${catUrl('yeni')}" class="btn btn-dark">Yeni gelenleri gör</a><a href="favoriler.html" class="btn btn-light">Favorilerime git</a></div>
        </div>${rail('Çok satanlar', CATALOG.products.filter((p) => p.isBestSeller).slice(0, 10), { cls: 'pb-16' })}`;
      initRails();
      return;
    }
    const progress = Math.min(100, ((store.FREE_SHIPPING - t.freeShippingLeft) / store.FREE_SHIPPING) * 100);
    $('#main').innerHTML = `<div class="container-site pt-8 pb-16">
        <h1 class="text-[32px] md:text-[40px] font-medium tracking-tight">Sepetim <span class="text-muted text-2xl font-normal">${t.count} ürün</span></h1>
        <div class="grid lg:grid-cols-[minmax(0,1fr)_400px] gap-8 lg:gap-14 mt-6">
          <section>
            <div class="border border-line p-4 text-sm flex items-center gap-3">${icon('truck', 'w-5 h-5 shrink-0')}
              <div class="flex-1"><p>${t.freeShippingLeft > 0 ? `Ücretsiz kargo için <b>${money(t.freeShippingLeft)}</b> daha ekle.` : 'Siparişin ücretsiz kargo ile gönderilecek.'}</p>
              <div class="h-1 bg-line mt-2"><div class="h-1 bg-ink transition-all duration-500" style="width:${progress}%"></div></div></div>
            </div>
            <ul class="divide-y divide-line border-b border-line">${lines.map(lineRow).join('')}</ul>
            <a href="${catUrl('yeni')}" class="inline-flex items-center gap-2 mt-6 text-sm link-underline">${icon('left', 'w-4 h-4')}Alışverişe devam et</a>
          </section>
          <aside class="lg:sticky lg:top-[96px] self-start">${summaryHtml(t)}</aside>
        </div>
      </div>
      ${rail('Sepetine yakışır', recommend, { cls: 'pb-16' })}`;
    initRails();
  }

  $('#main').addEventListener('click', (e) => {
    const row = e.target.closest('[data-row]');
    if (row) {
      const key = row.dataset.row;
      const l = store.cart().find((x) => x.key === key);
      const q = e.target.closest('[data-row-qty]');
      if (q) store.setQty(key, l.qty + +q.dataset.rowQty);
      if (e.target.closest('[data-row-remove]')) { store.removeLine(key); toast('Ürün sepetten çıkarıldı'); }
      if (e.target.closest('[data-to-fav]')) {
        if (!store.isFav(l.id)) store.toggleFav(l.id);
        store.removeLine(key);
        toast('Ürün favorilerine taşındı', { label: 'Favorilerim', href: 'favoriler.html' });
      }
    }
    if (e.target.closest('[data-remove-coupon]')) { store.removeCoupon(); couponMsg = null; }
  });
  $('#main').addEventListener('change', (e) => {
    if (e.target.matches('[data-row-input]')) store.setQty(e.target.closest('[data-row]').dataset.row, parseInt(e.target.value, 10) || 1);
  });
  $('#main').addEventListener('submit', (e) => {
    if (!e.target.matches('[data-coupon-form]')) return;
    e.preventDefault();
    couponMsg = store.applyCoupon(e.target.code.value);
    draw();
  });
  window.addEventListener('store:change', draw);
  draw();
})();
