// Hesabım: siparişler, adresler, favoriler, üyelik bilgileri (demo üyelik)
(function () {
  const { $, $$, esc, money, img, icon, productCard, openAuth, toast, catUrl } = SA;
  const store = SA.store;
  const TABS = [
    ['siparisler', 'Siparişlerim', 'box'],
    ['adresler', 'Adreslerim', 'pin'],
    ['favoriler', 'Favorilerim', 'heart'],
    ['bilgiler', 'Üyelik bilgilerim', 'user'],
  ];
  const STEPS = ['Sipariş alındı', 'Hazırlanıyor', 'Kargoda', 'Teslim edildi'];
  let openOrder = null;
  let addingAddress = false;

  const tab = () => (TABS.some(([k]) => k === location.hash.slice(1)) ? location.hash.slice(1) : 'siparisler');

  function guest() {
    $('#main').innerHTML = `<div class="container-site py-14 md:py-20">
      <div class="grid md:grid-cols-2 gap-10 max-w-4xl mx-auto">
        <div class="border border-line p-8">
          <h1 class="text-2xl font-medium">Giriş yap</h1>
          <p class="text-muted mt-1">Siparişlerini takip etmek ve adreslerini kaydetmek için giriş yap.</p>
          <button type="button" class="btn btn-dark w-full mt-6" data-auth="login">Giriş yap</button>
        </div>
        <div class="bg-blush p-8">
          <h2 class="text-2xl font-medium">Üye ol</h2>
          <ul class="mt-4 space-y-3 text-charcoal">
            <li class="flex gap-3">${icon('check', 'w-5 h-5 shrink-0')}İlk siparişe özel %10 indirim</li>
            <li class="flex gap-3">${icon('check', 'w-5 h-5 shrink-0')}Sipariş ve kargo takibi tek yerde</li>
            <li class="flex gap-3">${icon('check', 'w-5 h-5 shrink-0')}Favori ürünlerde fiyat düşünce haber</li>
          </ul>
          <button type="button" class="btn btn-light w-full mt-6" data-auth="register">Üye ol</button>
        </div>
      </div>
    </div>`;
  }

  function ordersHtml() {
    const orders = store.orders();
    if (!orders.length) return `<div class="bg-blush p-10 text-center"><p class="text-lg font-medium">Henüz siparişin yok</p><p class="text-muted mt-1">İlk siparişinde HOSGELDIN10 koduyla %10 indirim kazan.</p><a class="btn btn-dark mt-6" href="${catUrl('yeni')}">Alışverişe başla</a></div>`;
    return `<ul class="space-y-4">${orders.map((o) => {
      const stepIdx = Math.max(0, STEPS.indexOf(o.status === 'Teslime hazır' ? 'Kargoda' : o.status));
      const isOpen = openOrder === o.no;
      const badge = o.status === 'Teslim edildi' ? 'bg-[#e6f2ea] text-[#2f7a4b]' : o.status === 'Kargoda' ? 'bg-[#e8eef8] text-[#2f5fb3]' : 'bg-blush text-charcoal';
      return `<li class="border border-line">
        <button type="button" class="w-full text-left p-5 grid grid-cols-2 md:grid-cols-[1fr_1fr_1fr_auto] gap-4 items-center" data-order="${o.no}" aria-expanded="${isOpen}">
          <div><p class="text-xs text-muted">Sipariş no</p><p class="font-medium">${esc(o.no)}</p></div>
          <div><p class="text-xs text-muted">Tarih</p><p>${new Date(o.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</p></div>
          <div><p class="text-xs text-muted">Toplam</p><p class="font-medium">${money(o.totals.total)}</p></div>
          <div class="flex items-center gap-3 justify-between"><span class="text-xs font-medium px-2.5 py-1 ${badge}">${esc(o.status)}</span>${icon('down', `w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`)}</div>
          <div class="col-span-full flex gap-2">${o.items.slice(0, 5).map((it) => `<img src="${img(it.image)}" alt="" class="w-12 aspect-square object-contain bg-blush">`).join('')}</div>
        </button>
        ${isOpen ? `<div class="border-t border-line p-5 grid md:grid-cols-[220px_1fr] gap-8">
          <ol class="timeline">${STEPS.map((s, i) => `<li class="${i <= stepIdx ? 'is-done' : ''}"><p class="${i <= stepIdx ? 'font-medium' : 'text-muted'}">${s}</p>${i === 2 && o.tracking ? `<p class="text-xs text-muted">${esc(o.tracking)}</p>` : ''}</li>`).join('')}</ol>
          <div>
            <ul class="divide-y divide-line">${o.items.map((it) => `<li class="flex gap-4 py-3"><img src="${img(it.image)}" alt="" class="w-14 aspect-square object-contain bg-blush"><div class="flex-1 text-sm"><p>${esc(it.name)}</p><p class="text-muted">${esc(it.color)} · Seçenek: ${esc(it.size)} · ${it.qty} adet</p></div><p class="text-sm font-medium">${money(it.unit * it.qty)}</p></li>`).join('')}</ul>
            <p class="text-sm text-charcoal mt-3">${o.address ? `Teslimat: ${esc(o.address.name || '')} · ${esc(o.address.line || '')}${o.address.district ? `, ${esc(o.address.district)} / ${esc(o.address.city)}` : ''}` : ''}</p>
            <div class="flex flex-wrap gap-3 mt-5">
              ${o.tracking ? '<button type="button" class="btn btn-dark btn-sm" data-demo="Kargo takip sayfası canlı sitede Yurtiçi Kargo\'ya yönlenir">Kargom nerede?</button>' : ''}
              ${o.status === 'Teslim edildi' ? '<button type="button" class="btn btn-light btn-sm" data-demo="İade talebin alındı, kargo kodu SMS ile gönderilecek">İade talebi oluştur</button>' : ''}
              <a class="btn btn-light btn-sm" href="siparis-onay.html?no=${o.no}">Sipariş özeti</a>
            </div>
          </div>
        </div>` : ''}
      </li>`;
    }).join('')}</ul>`;
  }

  function addressesHtml() {
    const list = store.addresses();
    return `<div class="grid sm:grid-cols-2 gap-4">
      ${list.map((a) => `<div class="border border-line p-5 text-sm">
        <div class="flex justify-between"><p class="font-medium text-[15px]">${esc(a.title || 'Adres')}</p><button type="button" class="link-underline text-muted" data-del-addr="${a.id}">Sil</button></div>
        <p class="mt-2">${esc(a.name)}</p><p class="text-charcoal">${esc(a.line)}</p><p class="text-charcoal">${esc(a.district)} / ${esc(a.city)}</p><p class="text-muted mt-1">${esc(a.phone || '')}</p>
      </div>`).join('')}
      ${addingAddress ? `<form class="border border-ink p-5 grid gap-3 sm:col-span-2" data-addr-form>
          <div class="grid sm:grid-cols-2 gap-3">
            <label class="field"><span>Adres başlığı</span><input class="input" name="title" placeholder="Ev, iş…" required></label>
            <label class="field"><span>Ad soyad</span><input class="input" name="name" required></label>
            <label class="field"><span>Telefon</span><input class="input" name="phone" type="tel" required></label>
            <label class="field"><span>İl / ilçe</span><input class="input" name="cityDistrict" placeholder="İstanbul / Kadıköy" required></label>
          </div>
          <label class="field"><span>Açık adres</span><textarea class="input" name="line" rows="2" required></textarea></label>
          <div class="flex gap-3"><button class="btn btn-dark btn-sm" type="submit">Adresi kaydet</button><button class="btn btn-light btn-sm" type="button" data-cancel-addr>Vazgeç</button></div>
        </form>`
        : `<button type="button" class="border border-dashed border-muted p-5 text-sm flex items-center justify-center gap-2 min-h-[140px] hover:border-ink" data-add-addr>${icon('plus', 'w-4 h-4')}Yeni adres ekle</button>`}
    </div>`;
  }

  function favsHtml() {
    const favs = store.favs().map(SA.product);
    return favs.length
      ? `<div class="grid grid-cols-2 xl:grid-cols-3 gap-x-4 gap-y-8">${favs.map((p) => productCard(p)).join('')}</div>`
      : `<div class="bg-blush p-10 text-center"><p class="text-lg font-medium">Favori listen boş</p><p class="text-muted mt-1">Beğendiğin ürünlerdeki kalbe dokunarak buraya ekleyebilirsin.</p><a class="btn btn-dark mt-6" href="${catUrl('yeni')}">Ürünleri keşfet</a></div>`;
  }

  function infoHtml(u) {
    return `<form class="grid sm:grid-cols-2 gap-4 max-w-2xl" data-info-form>
      <label class="field"><span>Ad soyad</span><input class="input" name="name" value="${esc(u.name)}" required></label>
      <label class="field"><span>E-posta</span><input class="input" type="email" name="email" value="${esc(u.email)}" required></label>
      <label class="field"><span>Telefon</span><input class="input" type="tel" name="phone" value="${esc(u.phone || '')}" placeholder="05xx xxx xx xx"></label>
      <label class="field"><span>Doğum tarihi</span><input class="input" type="date" name="birthday" value="${esc(u.birthday || '')}"></label>
      <label class="check sm:col-span-2"><input type="checkbox" checked><span>Kampanyalardan e-posta ve SMS ile haberdar olmak istiyorum.</span></label>
      <div class="sm:col-span-2"><button class="btn btn-dark" type="submit">Bilgilerimi kaydet</button></div>
    </form>`;
  }

  function draw() {
    const u = store.user();
    if (!u) return guest();
    const t = tab();
    const body = { siparisler: ordersHtml, adresler: addressesHtml, favoriler: favsHtml, bilgiler: () => infoHtml(u) }[t]();
    $('#main').innerHTML = `<div class="container-site pt-8 pb-16">
      <div class="flex flex-wrap items-end justify-between gap-4 pb-6 border-b border-line">
        <div><p class="font-script text-[44px] leading-none text-charcoal">Merhaba</p><h1 class="text-[28px] md:text-[34px] font-medium tracking-tight">${esc(u.name)}</h1></div>
        <p class="text-sm text-muted">${esc(u.email)}</p>
      </div>
      <div class="grid lg:grid-cols-[230px_1fr] gap-8 lg:gap-12 mt-8">
        <nav aria-label="Hesap menüsü" class="flex lg:flex-col gap-1 overflow-x-auto no-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0">
          ${TABS.map(([k, l, ic]) => `<a href="#${k}" class="flex items-center gap-3 px-4 h-12 whitespace-nowrap ${k === t ? 'bg-blush font-medium' : 'hover:bg-blush/60'}" ${k === t ? 'aria-current="page"' : ''}>${icon(ic, 'w-[18px] h-[18px]')}${l}${k === 'favoriler' ? ` <span class="text-muted text-sm">${store.favs().length}</span>` : ''}</a>`).join('')}
          <button type="button" class="flex items-center gap-3 px-4 h-12 whitespace-nowrap text-left hover:bg-blush/60" data-logout>${icon('logout', 'w-[18px] h-[18px]')}Çıkış yap</button>
        </nav>
        <section><h2 class="text-xl font-medium mb-5">${TABS.find(([k]) => k === t)[1]}</h2>${body}</section>
      </div>
    </div>`;
  }

  $('#main').addEventListener('click', (e) => {
    const t = e.target;
    const auth = t.closest('[data-auth]');
    if (auth) return openAuth(auth.dataset.auth);
    const o = t.closest('[data-order]');
    if (o) { openOrder = openOrder === o.dataset.order ? null : o.dataset.order; return draw(); }
    const demo = t.closest('[data-demo]');
    if (demo) return toast(demo.dataset.demo);
    if (t.closest('[data-add-addr]')) { addingAddress = true; return draw(); }
    if (t.closest('[data-cancel-addr]')) { addingAddress = false; return draw(); }
    const del = t.closest('[data-del-addr]');
    if (del) { store.removeAddress(del.dataset.delAddr); return toast('Adres silindi'); }
    if (t.closest('[data-logout]')) { store.logout(); toast('Çıkış yaptın'); }
  });
  $('#main').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target;
    if (f.matches('[data-addr-form]')) {
      const [city, district] = f.cityDistrict.value.split('/').map((s) => s.trim());
      addingAddress = false;
      store.saveAddress({ title: f.title.value, name: f.name.value, phone: f.phone.value, city: city || 'İstanbul', district: district || 'Merkez', line: f.line.value });
      toast('Adres kaydedildi');
    }
    if (f.matches('[data-info-form]')) {
      store.updateUser({ name: f.name.value.trim(), email: f.email.value.trim(), phone: f.phone.value.trim(), birthday: f.birthday.value });
      toast('Bilgilerin güncellendi');
    }
  });
  window.addEventListener('hashchange', () => { openOrder = null; draw(); window.scrollTo({ top: 0 }); });
  window.addEventListener('store:change', draw);
  if (location.hash === '#siparisler' && store.orders()[0]) openOrder = store.orders()[0].no;
  draw();
})();
