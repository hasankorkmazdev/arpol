// Demo durum katmanı: sepet, favoriler, üye, siparişler — hepsi localStorage'da.
(function () {
  const KEYS = { cart: 'sa_cart', favs: 'sa_favs', user: 'sa_user', orders: 'sa_orders', recent: 'sa_recent', coupon: 'sa_coupon', addresses: 'sa_addresses' };
  const memory = {};

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch (e) {
      return key in memory ? memory[key] : fallback;
    }
  }
  function write(key, value, silent) {
    memory[key] = value;
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* gizli sekme: bellekte kalır */ }
    if (!silent) window.dispatchEvent(new CustomEvent('store:change', { detail: { key } }));
  }

  const FREE_SHIPPING = 1500;
  const SHIPPING_FEE = 89.9;
  const COURIER_FEE = 49.9; // İstanbul içi aynı gün kurye
  const COUPONS = {
    HOSGELDIN10: { label: 'Hoş geldin %10', type: 'percent', value: 10 },
    ARPOL100: { label: '100 TL indirim', type: 'amount', value: 100, min: 1000 },
  };

  const byId = (id) => window.CATALOG.products.find((p) => p.id === id);
  const unitPrice = (p) => p.salePrice || p.price;

  const store = {
    FREE_SHIPPING,
    SHIPPING_FEE,
    COURIER_FEE,
    COUPONS,

    // ---------------- sepet
    cart() { return read(KEYS.cart, []).filter((l) => byId(l.id)); },
    cartLines() {
      return this.cart().map((l) => {
        const p = byId(l.id);
        return { ...l, product: p, color: p.colors[l.colorIdx] || p.colors[0], unit: unitPrice(p), lineTotal: unitPrice(p) * l.qty };
      });
    },
    cartCount() { return this.cart().reduce((a, l) => a + l.qty, 0); },
    addToCart(id, colorIdx, size, qty) {
      const cart = this.cart();
      const key = `${id}|${colorIdx}|${size}`;
      const line = cart.find((l) => l.key === key);
      const p = byId(id);
      const max = (p.sizes.find((s) => s.name === size) || {}).stock || 10;
      if (line) line.qty = Math.min(line.qty + qty, max);
      else cart.unshift({ key, id, colorIdx, size, qty: Math.min(qty, max), addedAt: Date.now() });
      write(KEYS.cart, cart);
      return key;
    },
    setQty(key, qty) {
      const cart = this.cart();
      const line = cart.find((l) => l.key === key);
      if (!line) return;
      if (qty <= 0) return this.removeLine(key);
      const p = byId(line.id);
      const max = (p.sizes.find((s) => s.name === line.size) || {}).stock || 10;
      line.qty = Math.min(qty, max);
      write(KEYS.cart, cart);
    },
    removeLine(key) { write(KEYS.cart, this.cart().filter((l) => l.key !== key)); },
    clearCart() { write(KEYS.cart, []); write(KEYS.coupon, null); },

    // ---------------- kupon & toplamlar
    coupon() { return read(KEYS.coupon, null); },
    applyCoupon(code) {
      const c = COUPONS[(code || '').trim().toUpperCase()];
      if (!c) return { ok: false, message: 'Bu kod geçerli değil. Demo kodları: HOSGELDIN10, ARPOL100' };
      const sub = this.totals(null).subtotal;
      if (c.min && sub < c.min) return { ok: false, message: `${c.label} için sepet tutarı en az ${c.min} TL olmalı.` };
      write(KEYS.coupon, code.trim().toUpperCase());
      return { ok: true, message: `${c.label} uygulandı.` };
    },
    removeCoupon() { write(KEYS.coupon, null); },
    totals(couponCode = this.coupon(), shippingMethod = 'kargo') {
      const lines = this.cartLines();
      const listTotal = lines.reduce((a, l) => a + l.product.price * l.qty, 0);
      const subtotal = lines.reduce((a, l) => a + l.lineTotal, 0);
      const c = couponCode && COUPONS[couponCode];
      let discount = 0;
      if (c) discount = c.type === 'percent' ? Math.round(subtotal * c.value) / 100 : Math.min(c.value, subtotal);
      const afterDiscount = subtotal - discount;
      const free = shippingMethod === 'magaza' || afterDiscount >= FREE_SHIPPING;
      let shipping = lines.length === 0 || free ? 0 : SHIPPING_FEE;
      if (shippingMethod === 'kurye' && lines.length) shipping = COURIER_FEE;
      return {
        count: lines.reduce((a, l) => a + l.qty, 0),
        listTotal, subtotal, saved: listTotal - subtotal, discount, coupon: c ? { code: couponCode, ...c } : null,
        shipping, total: afterDiscount + shipping,
        freeShippingLeft: Math.max(0, FREE_SHIPPING - afterDiscount),
      };
    },

    // ---------------- favoriler
    favs() { return read(KEYS.favs, []).filter(byId); },
    isFav(id) { return this.favs().includes(id); },
    toggleFav(id) {
      const favs = this.favs();
      const on = !favs.includes(id);
      write(KEYS.favs, on ? [id, ...favs] : favs.filter((f) => f !== id));
      return on;
    },

    // ---------------- son incelenenler
    recent() { return read(KEYS.recent, []).filter(byId); },
    pushRecent(id) { write(KEYS.recent, [id, ...this.recent().filter((r) => r !== id)].slice(0, 12), true); },

    // ---------------- üyelik (demo: her e-posta/şifre kabul edilir)
    user() { return read(KEYS.user, null); },
    login(email, name) {
      const local = email.split('@')[0].replace(/[._-]+/g, ' ');
      const user = { email, name: name || local.replace(/(^|\s)\S/g, (m) => m.toLocaleUpperCase('tr-TR')), phone: '', since: Date.now() };
      write(KEYS.user, user);
      this.seedDemoData();
      return user;
    },
    updateUser(patch) { write(KEYS.user, { ...this.user(), ...patch }); },
    logout() { write(KEYS.user, null); },

    addresses() { return read(KEYS.addresses, []); },
    saveAddress(addr) {
      const list = this.addresses().filter((a) => a.id !== addr.id);
      write(KEYS.addresses, [{ ...addr, id: addr.id || 'adr' + Date.now() }, ...list]);
    },
    removeAddress(id) { write(KEYS.addresses, this.addresses().filter((a) => a.id !== id)); },

    // ---------------- siparişler
    orders() { return read(KEYS.orders, []); },
    order(no) { return this.orders().find((o) => o.no === no); },
    placeOrder(details) {
      const t = this.totals(this.coupon(), details.shippingMethod);
      const no = 'SA' + String(Date.now()).slice(-8);
      const order = {
        no, createdAt: Date.now(), status: 'Hazırlanıyor',
        items: this.cartLines().map((l) => ({ id: l.id, name: l.product.name, brand: l.product.brand, colorIdx: l.colorIdx, color: l.color.name, size: l.size, qty: l.qty, unit: l.unit, image: l.color.images[0] })),
        totals: t, ...details,
      };
      write(KEYS.orders, [order, ...this.orders()]);
      this.clearCart();
      return order;
    },

    // Hesabım'da boş görünmesin diye iki örnek geçmiş sipariş
    seedDemoData() {
      if (read('sa_seeded', false)) return;
      const ps = window.CATALOG.products;
      const mk = (no, daysAgo, status, picks, tracking) => {
        const items = picks.map(([i, size]) => {
          const p = ps[i];
          return { id: p.id, name: p.name, brand: p.brand, colorIdx: 0, color: p.colors[0].name, size, qty: 1, unit: unitPrice(p), image: p.colors[0].images[0] };
        });
        const subtotal = items.reduce((a, it) => a + it.unit, 0);
        return {
          no, createdAt: Date.now() - daysAgo * 864e5, status, tracking, demo: true, items,
          totals: { subtotal, discount: 0, shipping: 0, total: subtotal, count: items.length },
          shippingMethod: 'kargo', payment: { method: 'card', installments: 1, last4: '4242' },
          address: { name: 'Örnek Müşteri', city: 'İstanbul', district: 'Kadıköy', line: 'Caferağa Mah. Demo Sok. No:12' },
        };
      };
      const seeded = [
        mk('SA48210375', 3, 'Kargoda', [[44, ps[44].sizes[0].name], [69, 'STD']], 'Yurtiçi Kargo · 701234567891'),
        mk('SA47115902', 24, 'Teslim edildi', [[12, ps[12].sizes[0].name]]),
      ];
      write(KEYS.orders, [...this.orders().filter((o) => !o.demo), ...seeded], true);
      if (!this.addresses().length) {
        write(KEYS.addresses, [{ id: 'adr1', title: 'Ev', name: 'Örnek Müşteri', phone: '0555 000 00 00', city: 'İstanbul', district: 'Kadıköy', line: 'Caferağa Mah. Demo Sok. No:12 D:4' }], true);
      }
      write('sa_seeded', true, true);
    },
  };

  window.SA = window.SA || {};
  window.SA.store = store;
})();
