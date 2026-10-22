// Favoriler — üye olmadan da çalışır
(function () {
  const { $, productCard, rail, initRails, catUrl, icon } = SA;
  const store = SA.store;

  function draw() {
    const favs = store.favs().map(SA.product);
    const suggestions = CATALOG.products.filter((p) => p.isFeatured && !favs.includes(p)).slice(0, 10);
    $('#main').innerHTML = `<div class="container-site pt-8 pb-12">
        <h1 class="text-[32px] md:text-[40px] font-medium tracking-tight">Favorilerim <span class="text-muted text-2xl font-normal">${favs.length} ürün</span></h1>
        ${store.user() ? '' : `<p class="text-charcoal mt-2">Favorilerin bu cihazda saklanıyor. <button type="button" class="link-underline" data-account>Giriş yap</button>, her cihazdan eriş.</p>`}
        ${favs.length
          ? `<div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-3 gap-y-8 md:gap-x-6 md:gap-y-10 mt-8">${favs.map((p) => productCard(p)).join('')}</div>`
          : `<div class="bg-blush py-16 px-6 text-center mt-8">${icon('heart', 'w-12 h-12 mx-auto text-muted')}<p class="text-xl font-medium mt-4">Favori listen boş</p><p class="text-muted mt-1">Ürünlerdeki kalp ikonuna dokunarak beğendiklerini burada topla.</p><a class="btn btn-dark mt-6" href="${catUrl('yeni')}">Yeni gelenleri gör</a></div>`}
      </div>
      ${rail('Bunlara da göz at', suggestions, { cls: 'pb-16' })}`;
    initRails();
  }
  // Kalbe dokununca kart hemen listeden düşsün
  window.addEventListener('store:change', (e) => { if (!e.detail || e.detail.key === 'sa_favs') draw(); });
  draw();
})();
