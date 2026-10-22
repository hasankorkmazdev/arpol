// Sipariş onay sayfası
(function () {
  const { $, esc, money, img, icon, param, catUrl, openAuth } = SA;
  const store = SA.store;
  const order = store.order(param('no')) || store.orders()[0];

  if (!order) {
    $('#main').innerHTML = `<div class="container-site py-24 text-center"><h1 class="text-3xl font-medium">Sipariş bulunamadı</h1><p class="text-muted mt-2">Siparişlerini Hesabım sayfasından takip edebilirsin.</p><a class="btn btn-dark mt-8" href="hesabim.html#siparisler">Siparişlerime git</a></div>`;
    return;
  }
  const t = order.totals;
  const date = new Date(order.createdAt).toLocaleString('tr-TR', { dateStyle: 'long', timeStyle: 'short' });
  const a = order.address || {};
  const pay = order.payment.method === 'card'
    ? `Kredi kartı •••• ${esc(order.payment.last4)} · ${order.payment.installments > 1 ? `${order.payment.installments} taksit` : 'Tek çekim'}`
    : order.shippingMethod === 'magaza' ? 'Mağazada ödeme' : 'Kapıda ödeme';
  const ship = { magaza: 'Mağazadan teslim al', kurye: 'Aynı gün kurye', kargo: 'Standart kargo (Yurtiçi Kargo)' }[order.shippingMethod];

  $('#main').innerHTML = `<div class="container-site max-w-4xl py-12 md:py-16">
    <div class="text-center">
      <span class="w-16 h-16 rounded-full bg-ink text-white inline-flex items-center justify-center">${icon('check', 'w-8 h-8')}</span>
      <p class="font-script text-[64px] leading-none mt-6">Teşekkürler</p>
      <h1 class="text-2xl font-medium mt-3">Siparişin alındı</h1>
      <p class="text-charcoal mt-2">Sipariş numaran <b class="font-semibold">${esc(order.no)}</b>. ${order.contact && order.contact.email ? `Sipariş özetini <b class="font-medium">${esc(order.contact.email)}</b> adresine gönderdik.` : ''}</p>
      <p class="text-sm text-muted mt-1">${date}</p>
    </div>

    <ol class="grid grid-cols-4 mt-10 text-center text-xs sm:text-sm" aria-label="Sipariş durumu">
      ${['Sipariş alındı', 'Hazırlanıyor', order.shippingMethod === 'magaza' ? 'Teslime hazır' : 'Kargoda', 'Teslim edildi'].map((s, i) => `<li class="relative pt-6 ${i < 2 ? 'text-ink' : 'text-muted'}">
        <span class="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full ${i < 2 ? 'bg-ink' : 'bg-line'}"></span>
        ${i ? `<span class="absolute top-[5px] right-1/2 w-full h-[2px] -z-10 ${i < 2 ? 'bg-ink' : 'bg-line'}"></span>` : ''}${s}</li>`).join('')}
    </ol>

    <div class="grid md:grid-cols-[1fr_320px] gap-8 mt-12">
      <section>
        <h2 class="font-medium mb-3">Ürünler</h2>
        <ul class="divide-y divide-line border-y border-line">${order.items.map((it) => `<li class="flex gap-4 py-4">
          <img src="${img(it.image)}" alt="" class="w-16 aspect-square object-contain bg-blush">
          <div class="flex-1 text-sm"><p class="text-[15px]">${esc(it.name)}</p><p class="text-muted">${esc(it.color)} · Seçenek: ${esc(it.size)} · ${it.qty} adet</p></div>
          <p class="font-medium">${money(it.unit * it.qty)}</p></li>`).join('')}</ul>
      </section>
      <aside class="space-y-6 text-sm">
        <div class="bg-blush p-5">
          <dl class="space-y-2">
            <div class="flex justify-between"><dt>Ara toplam</dt><dd>${money(t.subtotal)}</dd></div>
            ${t.discount ? `<div class="flex justify-between"><dt>Kupon</dt><dd>−${money(t.discount)}</dd></div>` : ''}
            <div class="flex justify-between"><dt>Kargo</dt><dd>${t.shipping ? money(t.shipping) : 'Ücretsiz'}</dd></div>
            <div class="flex justify-between border-t border-blush-deep pt-3 text-base font-semibold"><dt>Toplam</dt><dd>${money(t.total)}</dd></div>
          </dl>
        </div>
        <div><p class="font-medium">Teslimat</p><p class="text-charcoal mt-1">${esc(ship)}<br>${esc(a.name || '')}<br>${esc(a.line || '')}${a.district ? `, ${esc(a.district)} / ${esc(a.city)}` : ''}</p></div>
        <div><p class="font-medium">Ödeme</p><p class="text-charcoal mt-1">${pay}</p></div>
      </aside>
    </div>

    <div class="flex flex-wrap justify-center gap-3 mt-12">
      ${store.user() ? '<a href="hesabim.html#siparisler" class="btn btn-dark">Siparişlerime git</a>' : '<button type="button" class="btn btn-dark" data-signup>Üye ol, siparişini takip et</button>'}
      <a href="index.html" class="btn btn-light">Alışverişe devam et</a>
    </div>
  </div>`;

  const signup = $('[data-signup]');
  if (signup) signup.addEventListener('click', () => openAuth('register', () => (location.href = 'hesabim.html#siparisler')));
})();
