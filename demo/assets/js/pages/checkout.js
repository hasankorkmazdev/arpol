// Ödeme: iletişim → teslimat → kargo → ödeme → 3D Secure simülasyonu → sipariş onayı
(function () {
  const { $, $$, esc, money, img, icon, catUrl, openAuth, openLegal, modal, close } = SA;
  const store = SA.store;

  const CITIES = {
    Konya: ['Karatay', 'Selçuklu', 'Meram', 'Akşehir', 'Beyşehir', 'Cihanbeyli', 'Ereğli', 'Ilgın', 'Kulu', 'Seydişehir'],
    İstanbul: ['Ataşehir', 'Bakırköy', 'Başakşehir', 'Beşiktaş', 'Esenyurt', 'Fatih', 'Kadıköy', 'Şişli', 'Ümraniye', 'Üsküdar'],
    Ankara: ['Çankaya', 'Etimesgut', 'Keçiören', 'Mamak', 'Pursaklar', 'Sincan', 'Yenimahalle'],
    İzmir: ['Bayraklı', 'Bornova', 'Buca', 'Karşıyaka', 'Konak', 'Menemen'],
    Bursa: ['Mudanya', 'Nilüfer', 'Osmangazi', 'Yıldırım'],
    Antalya: ['Alanya', 'Kepez', 'Konyaaltı', 'Muratpaşa'],
    Kayseri: ['Kocasinan', 'Melikgazi', 'Talas'],
    Karaman: ['Merkez', 'Ermenek'],
    Aksaray: ['Merkez', 'Ortaköy'],
    Gaziantep: ['Şahinbey', 'Şehitkamil'],
  };

  const state = {
    step: 1,
    contact: { email: '', phone: '' },
    delivery: 'adres',
    address: { name: '', phone: '', city: 'İstanbul', district: 'Kadıköy', line: '' },
    addressId: null,
    shipping: 'kargo',
    payment: 'card',
    installments: 1,
    card: { number: '', name: '', exp: '', cvc: '' },
  };
  const user = store.user();
  if (user) {
    state.contact.email = user.email;
    state.contact.phone = user.phone || '';
    state.step = 2;
    const saved = store.addresses()[0];
    if (saved) { state.addressId = saved.id; }
  }

  const totals = () => store.totals(store.coupon(), state.delivery === 'magaza' ? 'magaza' : state.shipping);
  const digits = (s) => (s || '').replace(/\D/g, '');

  // ---------------------------------------------------------------- adımlar
  function stepShell(n, title, summary, body) {
    const done = state.step > n;
    const active = state.step === n;
    return `<section class="step border-b border-line py-6 ${done ? 'is-done' : ''} ${!done && !active ? 'is-locked' : ''}" data-step="${n}">
      <div class="step-head">
        <span class="step-num">${done ? icon('check', 'w-4 h-4') : n}</span>
        <h2 class="text-lg font-medium flex-1">${title}</h2>
        ${done ? `<button type="button" class="text-sm link-underline" data-edit="${n}">Düzenle</button>` : ''}
      </div>
      ${done && summary ? `<div class="pl-10 mt-2 text-sm text-charcoal">${summary}</div>` : ''}
      ${active ? `<div class="pl-0 md:pl-10 mt-5">${body}</div>` : ''}
    </section>`;
  }

  function contactStep() {
    const body = user
      ? `<p class="text-sm">${esc(user.name)} olarak giriş yaptın (${esc(user.email)}).</p><button type="button" class="btn btn-dark mt-5" data-next="1">Devam et</button>`
      : `<div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm mb-5"><span>Üye misin?</span><button type="button" class="link-underline" data-login>Giriş yap</button><span class="text-muted">ya da misafir olarak devam et.</span></div>
        <form class="grid sm:grid-cols-2 gap-4" data-form="1" novalidate>
          <label class="field"><span>E-posta</span><input class="input" type="email" name="email" value="${esc(state.contact.email)}" required autocomplete="email" placeholder="ornek@mail.com"></label>
          <label class="field"><span>Cep telefonu</span><input class="input" type="tel" name="phone" value="${esc(state.contact.phone)}" required autocomplete="tel" placeholder="05xx xxx xx xx" data-mask="phone"></label>
          <label class="check sm:col-span-2"><input type="checkbox" checked><span>Kampanya ve yeni ürünlerden e-posta/SMS ile haberdar olmak istiyorum.</span></label>
          <div class="sm:col-span-2"><button class="btn btn-dark" type="submit">Teslimat bilgilerine geç</button></div>
        </form>`;
    return stepShell(1, 'İletişim bilgileri', `${esc(state.contact.email)}${state.contact.phone ? ' · ' + esc(state.contact.phone) : ''}`, body);
  }

  function addressSummary() {
    if (state.delivery === 'magaza') return 'Mağazadan teslim al — Ar-Pol, İstanbul';
    const a = state.addressId ? store.addresses().find((x) => x.id === state.addressId) : state.address;
    return a ? `${esc(a.name)} · ${esc(a.line)}, ${esc(a.district)} / ${esc(a.city)}` : '';
  }

  function deliveryStep() {
    const saved = store.addresses();
    const a = state.address;
    const body = `<div class="grid sm:grid-cols-2 gap-3">
        <label class="option"><input type="radio" name="delivery" value="adres" ${state.delivery === 'adres' ? 'checked' : ''} data-delivery><span><b class="font-medium block">Adrese teslim</b><span class="text-sm text-muted">Yurtiçi Kargo ile 1–3 iş günü</span></span></label>
        <label class="option"><input type="radio" name="delivery" value="magaza" ${state.delivery === 'magaza' ? 'checked' : ''} data-delivery><span><b class="font-medium block">Mağazadan teslim al</b><span class="text-sm text-muted">İstanbul · ücretsiz</span></span></label>
      </div>
      <form class="mt-6" data-form="2" novalidate>
        ${state.delivery === 'magaza'
          ? `<div class="bg-blush p-5 text-sm flex gap-3">${icon('store', 'w-5 h-5 shrink-0')}<div><b class="font-medium">Ar-Pol</b><p class="text-charcoal mt-1">İstanbul · Pzt–Cmt 09.00–19.00</p><p class="text-charcoal">Siparişin hazır olduğunda SMS ile haber vereceğiz.</p></div></div>
             <label class="field mt-4 max-w-sm"><span>Teslim alacak kişi</span><input class="input" name="name" value="${esc(a.name || (user && user.name) || '')}" required autocomplete="name"></label>`
          : `${saved.length ? `<p class="text-sm font-medium mb-3">Kayıtlı adreslerin</p><div class="grid sm:grid-cols-2 gap-3 mb-5">
                ${saved.map((s) => `<label class="option"><input type="radio" name="addr" value="${s.id}" ${state.addressId === s.id ? 'checked' : ''} data-addr><span class="text-sm"><b class="font-medium block">${esc(s.title || 'Adres')}</b>${esc(s.name)}<br>${esc(s.line)}<br>${esc(s.district)} / ${esc(s.city)}</span></label>`).join('')}
                <label class="option"><input type="radio" name="addr" value="" ${!state.addressId ? 'checked' : ''} data-addr><span class="text-sm"><b class="font-medium block">Yeni adres</b>Farklı bir adrese gönder</span></label>
              </div>` : ''}
             ${!state.addressId ? `<div class="grid sm:grid-cols-2 gap-4">
                <label class="field"><span>Ad soyad</span><input class="input" name="name" value="${esc(a.name)}" required autocomplete="name"></label>
                <label class="field"><span>Telefon</span><input class="input" type="tel" name="phone" value="${esc(a.phone || state.contact.phone)}" required data-mask="phone" placeholder="05xx xxx xx xx"></label>
                <label class="field"><span>İl</span><select class="input" name="city" data-city>${Object.keys(CITIES).map((c) => `<option ${c === a.city ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
                <label class="field"><span>İlçe</span><select class="input" name="district" data-district>${CITIES[a.city].map((d) => `<option ${d === a.district ? 'selected' : ''}>${d}</option>`).join('')}</select></label>
                <label class="field sm:col-span-2"><span>Açık adres</span><textarea class="input" rows="3" name="line" required placeholder="Mahalle, cadde, sokak, bina ve daire no">${esc(a.line)}</textarea></label>
                <label class="check sm:col-span-2"><input type="checkbox" checked><span>Fatura adresim teslimat adresimle aynı</span></label>
              </div>` : ''}`}
        <button class="btn btn-dark mt-6" type="submit">${state.delivery === 'magaza' ? 'Ödemeye geç' : 'Kargo seçimine geç'}</button>
      </form>`;
    return stepShell(2, 'Teslimat', addressSummary(), body);
  }

  function shippingStep() {
    if (state.delivery === 'magaza') return '';
    const t = store.totals(store.coupon(), 'kargo');
    const body = `<div class="space-y-3">
        <label class="option"><input type="radio" name="ship" value="kargo" ${state.shipping === 'kargo' ? 'checked' : ''} data-ship><span class="flex-1 flex justify-between gap-4"><span><b class="font-medium block">Standart kargo</b><span class="text-sm text-muted">Yurtiçi Kargo · 1–3 iş günü</span></span><span class="font-medium">${t.shipping ? money(t.shipping) : 'Ücretsiz'}</span></span></label>
        <label class="option ${state.address.city !== 'İstanbul' && !state.addressId ? 'opacity-50 pointer-events-none' : ''}"><input type="radio" name="ship" value="kurye" ${state.shipping === 'kurye' ? 'checked' : ''} data-ship><span class="flex-1 flex justify-between gap-4"><span><b class="font-medium block">Aynı gün kurye</b><span class="text-sm text-muted">Yalnızca İstanbul içi · 16.00'ya kadar verilen siparişler</span></span><span class="font-medium">${money(store.COURIER_FEE)}</span></span></label>
      </div>
      <button type="button" class="btn btn-dark mt-6" data-next="3">Ödemeye geç</button>`;
    return stepShell(3, 'Kargo', state.shipping === 'kurye' ? 'Aynı gün kurye (İstanbul içi)' : 'Standart kargo · Yurtiçi Kargo', body);
  }

  function paymentStep() {
    const t = totals();
    const n = state.delivery === 'magaza' ? 3 : 4;
    const c = state.card;
    const shown = (digits(c.number) + '•'.repeat(16)).slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
    const body = `<div class="grid sm:grid-cols-2 gap-3">
        <label class="option"><input type="radio" name="pay" value="card" ${state.payment === 'card' ? 'checked' : ''} data-pay><span><b class="font-medium block">Kredi / banka kartı</b><span class="text-sm text-muted">3D Secure · peşin fiyatına 3 taksit</span></span></label>
        <label class="option"><input type="radio" name="pay" value="kapida" ${state.payment === 'kapida' ? 'checked' : ''} data-pay><span><b class="font-medium block">${state.delivery === 'magaza' ? 'Mağazada öde' : 'Kapıda ödeme'}</b><span class="text-sm text-muted">Nakit veya kart ile</span></span></label>
      </div>
      <form class="mt-6" data-form="pay" novalidate>
        ${state.payment === 'card' ? `<div class="grid md:grid-cols-[1fr_300px] gap-6 items-start">
            <div class="grid grid-cols-2 gap-4">
              <label class="field col-span-2"><span>Kart numarası</span><input class="input tracking-wider" name="number" inputmode="numeric" autocomplete="cc-number" placeholder="0000 0000 0000 0000" value="${esc(c.number)}" data-mask="card" required></label>
              <label class="field col-span-2"><span>Kart üzerindeki isim</span><input class="input uppercase" name="name" autocomplete="cc-name" value="${esc(c.name)}" required></label>
              <label class="field"><span>Son kullanma (AA/YY)</span><input class="input" name="exp" inputmode="numeric" autocomplete="cc-exp" placeholder="AA/YY" value="${esc(c.exp)}" data-mask="exp" required></label>
              <label class="field"><span>CVC</span><input class="input" name="cvc" inputmode="numeric" autocomplete="cc-csc" placeholder="000" maxlength="4" value="${esc(c.cvc)}" required></label>
            </div>
            <div class="credit-card hidden md:flex" aria-hidden="true">
              <div class="flex justify-between items-start"><span class="font-script text-[28px] leading-none">Ar-Pol Müşterisi</span><span class="w-10 h-7 rounded-sm bg-gradient-to-br from-[#d9c08a] to-[#a8884f]"></span></div>
              <p class="credit-card__num" data-card-num>${shown}</p>
              <div class="flex justify-between text-xs tracking-widest uppercase"><span data-card-name>${esc(c.name) || 'Ad soyad'}</span><span data-card-exp>${esc(c.exp) || 'AA/YY'}</span></div>
            </div>
          </div>
          <p class="text-sm font-medium mt-6 mb-3">Taksit seçenekleri</p>
          <div class="border border-line divide-y divide-line">
            ${[1, 2, 3].map((k) => `<label class="flex items-center gap-3 px-4 py-3 cursor-pointer"><input type="radio" name="inst" value="${k}" ${state.installments === k ? 'checked' : ''} class="accent-black w-4 h-4" data-inst>
              <span class="flex-1">${k === 1 ? 'Tek çekim' : `${k} taksit`}</span><span class="text-sm text-muted">${k === 1 ? '' : `${money(t.total / k)} × ${k}`}</span><span class="font-medium w-28 text-right">${money(t.total)}</span></label>`).join('')}
          </div>
          <p class="text-xs text-muted mt-3">Demo: test kartı olarak 4242 4242 4242 4242 kullanabilirsin. Gerçek ödeme alınmaz.</p>`
        : `<div class="bg-blush p-5 text-sm">${state.delivery === 'magaza' ? 'Ödemeyi ürünü teslim alırken mağazada nakit veya kartla yapabilirsin.' : 'Ödemeyi kargo görevlisine nakit veya kartla yapabilirsin.'}</div>`}
        <div class="mt-6 space-y-3">
          <label class="check"><input type="checkbox" name="terms" required><span><button type="button" class="link-underline" data-legal="Ön Bilgilendirme Formu">Ön bilgilendirme formunu</button> ve <button type="button" class="link-underline" data-legal="Mesafeli Satış Sözleşmesi">mesafeli satış sözleşmesini</button> okudum, onaylıyorum.</span></label>
          <p class="field-error" data-terms-error hidden>Devam etmek için sözleşmeleri onaylaman gerekiyor.</p>
        </div>
        <p class="field-error mt-3" data-pay-error hidden></p>
        <button class="btn btn-dark w-full sm:w-auto mt-6" type="submit">${icon('lock', 'w-4 h-4')}Siparişi onayla · ${money(t.total)}</button>
      </form>`;
    return stepShell(n, 'Ödeme', '', body);
  }

  function summary() {
    const lines = store.cartLines();
    const t = totals();
    return `<div class="bg-blush p-6 md:p-7">
      <div class="flex items-center justify-between"><h2 class="text-lg font-medium">Sipariş özeti</h2><a href="sepet.html" class="text-sm link-underline">Sepeti düzenle</a></div>
      <ul class="mt-5 space-y-4 max-h-[360px] overflow-y-auto pr-1">${lines.map((l) => `<li class="flex gap-4">
          <div class="relative w-16 shrink-0"><img src="${img(l.color.images[0])}" alt="" class="w-16 aspect-square object-contain bg-white"><span class="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-ink text-white text-[11px] flex items-center justify-center">${l.qty}</span></div>
          <div class="flex-1 min-w-0 text-sm"><p class="leading-snug">${esc(l.product.name)}</p><p class="text-muted">${esc(l.color.name)} · ${esc(l.size)}</p></div>
          <p class="text-sm font-medium">${money(l.lineTotal)}</p></li>`).join('')}</ul>
      <dl class="mt-6 pt-5 border-t border-blush-deep space-y-2.5 text-[15px]">
        <div class="flex justify-between"><dt>Ara toplam</dt><dd>${money(t.subtotal)}</dd></div>
        ${t.discount ? `<div class="flex justify-between"><dt>Kupon (${esc(t.coupon.code)})</dt><dd>−${money(t.discount)}</dd></div>` : ''}
        <div class="flex justify-between"><dt>${state.delivery === 'magaza' ? 'Mağazadan teslim' : state.shipping === 'kurye' ? 'Aynı gün kurye' : 'Kargo'}</dt><dd>${t.shipping ? money(t.shipping) : 'Ücretsiz'}</dd></div>
        <div class="flex justify-between border-t border-blush-deep pt-4 text-lg font-semibold"><dt>Toplam</dt><dd>${money(t.total)}</dd></div>
      </dl>
      ${t.saved ? `<p class="text-sm text-charcoal mt-3">Bu siparişte ${money(t.saved + t.discount)} tasarruf ediyorsun.</p>` : ''}
    </div>
    <p class="flex items-center gap-2 text-sm text-muted mt-4">${icon('lock', 'w-4 h-4')}Ödeme bilgilerin 3D Secure ile korunur.</p>`;
  }

  function draw() {
    if (!store.cartLines().length) {
      $('#main').innerHTML = `<div class="container-site py-24 text-center"><h1 class="text-3xl font-medium">Sepetin boş</h1><p class="text-muted mt-2">Ödeme adımına geçmek için sepetine ürün ekle.</p><a class="btn btn-dark mt-8" href="${catUrl('yeni')}">Alışverişe başla</a></div>`;
      return;
    }
    $('#main').innerHTML = `<div class="container-site pt-6 pb-10">
      <h1 class="text-[28px] md:text-[36px] font-medium tracking-tight">Ödeme</h1>
      <div class="grid lg:grid-cols-[minmax(0,1fr)_420px] gap-8 lg:gap-14 mt-2">
        <div>${contactStep()}${deliveryStep()}${shippingStep()}${paymentStep()}</div>
        <aside class="lg:sticky lg:top-6 self-start lg:mt-6">${summary()}</aside>
      </div>
    </div>`;
  }

  // ---------------------------------------------------------------- doğrulama
  function invalid(form, names) {
    let bad = null;
    names.forEach(([name, test]) => {
      const el = form.elements[name];
      if (!el) return;
      const ok = test(el.value.trim());
      el.classList.toggle('is-invalid', !ok);
      if (!ok && !bad) bad = el;
    });
    if (bad) bad.focus();
    return !!bad;
  }
  const notEmpty = (v) => v.length > 1;
  const phoneOk = (v) => digits(v).length >= 10;
  const next = (n) => { state.step = n; draw(); const s = $(`[data-step="${n}"]`); s && s.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  const nextAfterDelivery = () => next(state.delivery === 'magaza' ? 3 : 3);

  // ---------------------------------------------------------------- 3D Secure simülasyonu
  function threeDS(order) {
    const t = totals();
    const panel = modal(`<div class="p-7 md:p-9">
      <div class="flex items-center justify-between border-b border-line pb-4">
        <p class="font-semibold tracking-wide">DEMO BANK</p><p class="text-xs text-muted flex items-center gap-1">${icon('lock', 'w-3.5 h-3.5')}3D Secure doğrulama</p>
      </div>
      <dl class="grid grid-cols-[110px_1fr] gap-y-1.5 text-sm mt-5">
        <dt class="text-muted">İşyeri</dt><dd>Ar-Pol</dd>
        <dt class="text-muted">Tutar</dt><dd class="font-semibold">${money(t.total)}${state.installments > 1 ? ` (${state.installments} taksit)` : ''}</dd>
        <dt class="text-muted">Kart</dt><dd>•••• ${digits(state.card.number).slice(-4)}</dd>
      </dl>
      <form class="mt-6" data-3ds novalidate>
        <label class="field"><span>Telefonuna gönderilen 6 haneli doğrulama kodu</span><input class="input text-center text-xl tracking-[.5em]" name="code" inputmode="numeric" maxlength="6" autocomplete="one-time-code" autofocus></label>
        <p class="text-xs text-muted mt-2">Demo: herhangi 6 rakam yazabilirsin. Kalan süre <b data-3ds-timer>03:00</b></p>
        <p class="field-error" data-3ds-error hidden>Kodu 6 rakam olarak gir.</p>
        <button class="btn btn-dark w-full mt-5" type="submit">Onayla</button>
      </form>
      <div class="hidden py-8 text-center" data-3ds-wait><div class="w-10 h-10 border-2 border-line border-t-ink rounded-full animate-spin mx-auto"></div><p class="mt-4">Ödemen onaylanıyor…</p></div>
    </div>`, 440);
    let left = 180;
    const timer = setInterval(() => {
      left--; const el = $('[data-3ds-timer]', panel);
      if (!el || left < 0) return clearInterval(timer);
      el.textContent = `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`;
    }, 1000);
    $('[data-3ds]', panel).addEventListener('submit', (e) => {
      e.preventDefault();
      if (!/^\d{6}$/.test(e.target.code.value.trim())) { $('[data-3ds-error]', panel).hidden = false; return; }
      clearInterval(timer);
      e.target.hidden = true;
      $('[data-3ds-wait]', panel).classList.remove('hidden');
      setTimeout(order, 1400);
    });
  }

  function placeOrder() {
    const saved = state.addressId && store.addresses().find((a) => a.id === state.addressId);
    const order = store.placeOrder({
      contact: state.contact,
      shippingMethod: state.delivery === 'magaza' ? 'magaza' : state.shipping,
      address: state.delivery === 'magaza' ? { name: state.address.name, store: true, city: 'İstanbul', district: 'Kadıköy', line: 'Ar-Pol mağazası' } : saved || state.address,
      payment: state.payment === 'card' ? { method: 'card', installments: state.installments, last4: digits(state.card.number).slice(-4) } : { method: 'kapida' },
    });
    if (store.user() && state.delivery !== 'magaza' && !saved) store.saveAddress({ ...state.address, title: 'Ev' });
    location.href = `siparis-onay.html?no=${order.no}`;
  }

  // ---------------------------------------------------------------- olaylar
  const main = $('#main');
  main.addEventListener('click', (e) => {
    const t = e.target;
    const edit = t.closest('[data-edit]');
    if (edit) return next(+edit.dataset.edit);
    const nx = t.closest('[data-next]');
    if (nx) return next(+nx.dataset.next + 1);
    if (t.closest('[data-login]')) openAuth('login', () => location.reload());
  });
  main.addEventListener('change', (e) => {
    const t = e.target;
    if (t.matches('[data-delivery]')) { state.delivery = t.value; return draw(); }
    if (t.matches('[data-addr]')) { state.addressId = t.value || null; return draw(); }
    if (t.matches('[data-ship]')) { state.shipping = t.value; return draw(); }
    if (t.matches('[data-pay]')) { state.payment = t.value; return draw(); }
    if (t.matches('[data-inst]')) { state.installments = +t.value; return; }
    if (t.matches('[data-city]')) {
      state.address.city = t.value;
      state.address.district = CITIES[t.value][0];
      if (t.value !== 'İstanbul' && state.shipping === 'kurye') state.shipping = 'kargo';
      $('[data-district]').innerHTML = CITIES[t.value].map((d) => `<option>${d}</option>`).join('');
    }
    if (t.matches('[data-district]')) state.address.district = t.value;
  });
  // Giriş maskeleri ve kart önizlemesi
  main.addEventListener('input', (e) => {
    const t = e.target;
    const m = t.dataset.mask;
    if (m === 'card') t.value = digits(t.value).slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
    if (m === 'exp') { const d = digits(t.value).slice(0, 4); t.value = d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d; }
    if (m === 'phone') { const d = digits(t.value).slice(0, 11); t.value = d.replace(/^(\d{4})(\d{0,3})(\d{0,2})(\d{0,2}).*/, (_, a, b, c, dd) => [a, b, c, dd].filter(Boolean).join(' ')); }
    if (t.name === 'cvc') t.value = digits(t.value).slice(0, 4);
    if (t.closest('[data-form="pay"]')) {
      state.card[t.name] = t.value;
      const num = $('[data-card-num]');
      if (num) {
        num.textContent = (digits(state.card.number) + '•'.repeat(16)).slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
        $('[data-card-name]').textContent = state.card.name || 'Ad soyad';
        $('[data-card-exp]').textContent = state.card.exp || 'AA/YY';
      }
    }
    if (t.classList.contains('is-invalid')) t.classList.remove('is-invalid');
  });
  main.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target;
    const step = f.dataset.form;
    if (step === '1') {
      if (invalid(f, [['email', (v) => /^\S+@\S+\.\S+$/.test(v)], ['phone', phoneOk]])) return;
      state.contact = { email: f.email.value.trim(), phone: f.phone.value.trim() };
      return next(2);
    }
    if (step === '2') {
      if (state.delivery === 'magaza') {
        if (invalid(f, [['name', notEmpty]])) return;
        state.address.name = f.name.value.trim();
        return next(3);
      }
      if (!state.addressId) {
        if (invalid(f, [['name', notEmpty], ['phone', phoneOk], ['line', (v) => v.length > 8]])) return;
        Object.assign(state.address, { name: f.name.value.trim(), phone: f.phone.value.trim(), city: f.city.value, district: f.district.value, line: f.line.value.trim() });
      }
      return nextAfterDelivery();
    }
    if (step === 'pay') {
      if (state.payment === 'card') {
        const expOk = (v) => { const [mm, yy] = v.split('/').map(Number); if (!mm || mm > 12 || yy == null) return false; const end = new Date(2000 + yy, mm, 1); return end > new Date(); };
        if (invalid(f, [['number', (v) => digits(v).length === 16], ['name', notEmpty], ['exp', expOk], ['cvc', (v) => digits(v).length >= 3]])) {
          const err = $('[data-pay-error]'); err.hidden = false; err.textContent = 'Kart bilgilerini kontrol et.';
          return;
        }
      }
      if (!f.terms.checked) { $('[data-terms-error]').hidden = false; return; }
      if (state.payment === 'card') threeDS(placeOrder);
      else placeOrder();
    }
  });
  window.addEventListener('store:change', (e) => { if (e.detail && e.detail.key === 'sa_user') location.reload(); });

  draw();
})();
