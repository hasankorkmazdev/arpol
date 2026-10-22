// Ar-Pol demo kataloğunu gsmaksesuari.com.tr'den üretir ve demo/assets/js/data.js dosyasını yazar.
// Kullanım: node tools/fetch-gsm.mjs   (tekrar çalıştırılabilir; var olan görseller atlanır)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEMO = path.join(ROOT, 'demo');
const BASE = 'https://www.gsmaksesuari.com.tr';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36';

// src: gsmaksesuari kategori yolları; match/exclude: ürün adı filtresi; take: demoya alınacak adet
const CATEGORIES = [
  { slug: 'sarj-guc', name: 'Şarj & Güç', blurb: 'Adaptör, powerbank ve kablosuz şarj çözümleri.', children: [
    { slug: 'sarj-adaptoru', name: 'Şarj Adaptörü', src: ['sarj-cihazlar-1fbb9959-10'], match: /adapt|şarj cihaz|sarj cihaz|başlık|baslik/i, take: 10 },
    { slug: 'powerbank', name: 'Powerbank', src: ['powerbank-1fbb9959-11', 'magsafe-powerbank-1fbb9959-138'], take: 8 },
    { slug: 'kablosuz-sarj', name: 'Kablosuz Şarj', src: ['kablosuz-sarj-1fbb9959-6'], take: 6 },
  ] },
  { slug: 'kablolar', name: 'Kablolar', blurb: 'Type-C, Lightning ve USB; hızlı şarj ve data kabloları.', children: [
    { slug: 'type-c-kablo', name: 'Type-C Kablo', src: ['sarj-kablolar-1fbb9959-20'], match: /type.?c/i, exclude: /lightning|aux|hdmi/i, take: 8 },
    { slug: 'lightning-kablo', name: 'Lightning Kablo', src: ['sarj-kablolar-1fbb9959-20'], match: /lightning/i, exclude: /aux|hdmi/i, take: 8 },
    { slug: 'micro-usb-kablo', name: 'Micro USB & Diğer', src: ['sarj-kablolar-1fbb9959-20'], match: /micro|3in1|2in1|4in1|usb/i, exclude: /lightning|type.?c/i, take: 6 },
  ] },
  { slug: 'kulaklik', name: 'Kulaklık', blurb: 'Bluetooth ve kablolu kulaklıklar.', children: [
    { slug: 'bluetooth-kulaklik', name: 'Bluetooth Kulaklık', src: ['bluetooth-kulaklk-1fbb9959-17', 'kulaklk-1fbb9959-16'], match: /bluetooth|tws|kablosuz|airpods|buds/i, take: 12 },
    { slug: 'kablolu-kulaklik', name: 'Kablolu Kulaklık', src: ['kablolu-kulaklk-1fbb9959-18', 'kulaklk-1fbb9959-16'], match: /kablolu|jack|mikrofonlu|3\.5/i, exclude: /bluetooth|tws/i, take: 6 },
  ] },
  { slug: 'kilif-koruma', name: 'Kılıf & Koruma', blurb: 'Telefon kılıfları ve ekran koruyucular.', children: [
    { slug: 'telefon-kilifi', name: 'Telefon Kılıfı', src: ['telefon-klf-1fbb9959-41'], take: 12 },
    { slug: 'ekran-koruyucu', name: 'Ekran Koruyucu', src: ['ekran-koruyucu-1fbb9959-42'], take: 8 },
  ] },
  { slug: 'arac', name: 'Araç Aksesuarı', blurb: 'Araç içi telefon tutucu ve araç şarj çözümleri.', children: [
    { slug: 'telefon-tutucu', name: 'Telefon Tutucu', src: ['arac-ici-telefon-tutucular-1fbb9959-30'], take: 8 },
    { slug: 'arac-sarj', name: 'Araç Şarjı', src: ['arac-sarj-aleti-1fbb9959-34'], take: 6 },
  ] },
  { slug: 'akilli-teknoloji', name: 'Akıllı Teknoloji', blurb: 'Akıllı saatler, kordonlar ve hoparlörler.', children: [
    { slug: 'akilli-saat', name: 'Akıllı Saat', src: ['akll-saat-1fbb9959-8'], take: 8 },
    { slug: 'saat-kordon', name: 'Saat Kordonu', src: ['akll-saat-kordon-1fbb9959-81'], take: 4 },
    { slug: 'hoparlor', name: 'Bluetooth Hoparlör', src: ['bluetooth-hoparlorler-1fbb9959-54'], take: 6 },
  ] },
];

const COLORS = [
  ['siyah', '#111111'], ['beyaz', '#f4f4f4'], ['kırmızı', '#c0282d'], ['mavi', '#2f6fd0'], ['lacivert', '#1f2a44'],
  ['yeşil', '#2f8f55'], ['gri', '#8a8a8a'], ['gümüş', '#c4c7cc'], ['gold', '#c9a34a'], ['altın', '#c9a34a'],
  ['pembe', '#e8a5b8'], ['mor', '#6e3f8f'], ['sarı', '#e6c34a'], ['turuncu', '#e07b39'], ['kahverengi', '#6b4a35'],
  ['şeffaf', '#dfe6ea'], ['bej', '#d9c4a5'], ['titanyum', '#8d8a85'],
];

const lowerTr = (s) => s.toLocaleLowerCase('tr-TR');
const slugify = (s) => lowerTr(s).replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const hash = (s) => { let h = 2166136261; for (const c of s) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');

async function get(url, as = 'text', tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (!res.ok) throw new Error(`${res.status} ${url}`);
      return as === 'buffer' ? Buffer.from(await res.arrayBuffer()) : await res.text();
    } catch (e) {
      if (i === tries - 1) throw e;
      await new Promise((r) => setTimeout(r, 700 * (i + 1)));
    }
  }
}

async function pool(items, limit, fn) {
  const out = []; let i = 0;
  await Promise.all(Array.from({ length: limit }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); } }));
  return out;
}

// Kategori sayfalarındaki ürün bağlantıları (sayfa sayfa)
async function listLinks(src, maxPages = 6) {
  const links = [];
  for (let page = 1; page <= maxPages; page++) {
    let html;
    try { html = await get(`${BASE}/kategori/${src}/${page > 1 ? `?page=${page}` : ''}`); } catch { break; }
    const found = [...new Set([...html.matchAll(/href="(\/urun\/[^"]+)"/g)].map((m) => m[1]))];
    const fresh = found.filter((l) => !links.includes(l));
    if (!fresh.length) break;
    links.push(...fresh);
  }
  return links;
}

async function readProduct(link) {
  const html = await get(BASE + link);
  const ld = html.match(/application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!ld) return null;
  let j; try { j = JSON.parse(ld[1]); } catch { return null; }
  const price = parseFloat(j.offers?.price);
  if (!price || j.offers?.availability?.includes('OutOfStock')) return null;
  const gallery = [...html.matchAll(/<a href="(\/media\/products\/[^"]+)" aria-label="Görsel \d+"/g)].map((m) => m[1]);
  const images = [...new Set(gallery.length ? gallery : [new URL(j.image).pathname])].slice(0, 3);
  const desc = decode(String(j.description || '')).replace(/\s+/g, ' ').trim();
  return { name: decode(j.name), brand: decode(j.brand?.name || 'Ar-Pol'), sku: j.sku, price, desc, images };
}

// "... 1m Siyah HG/C-09AL" gibi adlardan marka/kod ayıklayıp okunur bir ad üretir
function cleanName(n) {
  return n.replace(/\s+/g, ' ').replace(/\s*[-–]\s*$/, '').trim();
}
function colorOf(name) {
  const l = lowerTr(name);
  for (const [c, hex] of COLORS) if (new RegExp(`(^|[\\s,/-])${c}($|[\\s,/-])`).test(l)) return { name: c.charAt(0).toLocaleUpperCase('tr-TR') + c.slice(1), hex };
  return { name: 'Standart', hex: '#d8dde2' };
}

async function main() {
  const used = new Set();
  const products = [];
  const jobs = [];
  const pageCache = new Map();
  let n = 1001;

  for (const cat of CATEGORIES) {
    for (const sub of cat.children) {
      process.stdout.write(`→ ${sub.slug} ... `);
      const links = [];
      for (const s of sub.src) {
        if (!pageCache.has(s)) pageCache.set(s, await listLinks(s));
        links.push(...pageCache.get(s));
      }
      const cands = [...new Set(links)].filter((l) => !used.has(l));
      let taken = 0;
      // Aday listesini küçük gruplar halinde oku, take'e ulaşınca dur
      for (let i = 0; i < cands.length && taken < sub.take; i += 8) {
        const batch = cands.slice(i, i + 8);
        const res = await pool(batch, 4, async (l) => { try { return [l, await readProduct(l)]; } catch { return [l, null]; } });
        for (const [l, d] of res) {
          if (taken >= sub.take || !d || used.has(l)) continue;
          if (sub.match && !sub.match.test(d.name)) continue;
          if (sub.exclude && sub.exclude.test(d.name)) continue;
          used.add(l);
          taken++;
          const h = hash(l);
          const name = cleanName(d.name);
          const slug = `${slugify(name).slice(0, 60)}-${n}`;
          const col = colorOf(name);
          const images = d.images.map((u, ii) => {
            const base = `assets/img/products/${slug}/${ii + 1}`;
            jobs.push({ url: BASE + u, file: path.join(DEMO, `${base}.jpg`) });
            return base;
          });
          const listPrice = Math.round(d.price * 1.18 * 100) / 100; // gsmaksesuari fiyatı + ~%18 (KDV/kâr payı) demo fiyatı
          const price = Math.ceil(listPrice / 5) * 5;
          const hasSale = h % 3 === 0;
          products.push({
            id: `ap${n}`, slug, sku: `AP-${n}`, name,
            brand: d.brand,
            category: cat.slug, subcategory: sub.slug,
            price: hasSale ? Math.ceil(price * 1.25 / 5) * 5 : price,
            salePrice: hasSale ? price : null,
            colors: [{ name: col.name, hex: col.hex, images, inStock: true }],
            sizes: [{ name: 'Standart', stock: 6 + (h % 20) }],
            rating: 4 + ((h >>> 3) % 10) / 10,
            reviewCount: (h >>> 5) % 120,
            isNew: taken <= Math.ceil(sub.take / 3),
            isFeatured: (h >>> 7) % 3 === 0,
            isBestSeller: (h >>> 9) % 4 === 0,
            createdAt: Date.UTC(2026, 9, 20) - products.length * 36e5 * 7,
            description: d.desc.length > 40 ? d.desc.slice(0, 420).replace(/\s\S*$/, '') + (d.desc.length > 420 ? '…' : '') : `${name}, günlük kullanım için dayanıklı ve şık bir ${sub.name.toLocaleLowerCase('tr-TR')} çözümü sunar.`,
            features: [
              ['Marka', d.brand],
              ['Ürün Kodu', d.sku || `AP-${n}`],
              ['Uyumluluk', 'Akıllı telefon ve tablet'],
              ['Garanti', '2 yıl Ar-Pol garantisi'],
              ['Menşei', 'Türkiye / Çin'],
            ],
          });
          n++;
        }
      }
      console.log(`${taken} ürün`);
    }
  }

  console.log(`\n${products.length} ürün, ${jobs.length} görsel indiriliyor...`);
  let ok = 0, skip = 0, fail = 0;
  await pool(jobs, 6, async (j) => {
    try {
      if (fs.existsSync(j.file) && fs.statSync(j.file).size > 0) { skip++; return; }
      fs.mkdirSync(path.dirname(j.file), { recursive: true });
      fs.writeFileSync(j.file, await get(j.url, 'buffer'));
      ok++;
    } catch (e) { fail++; console.warn('  hata:', e.message); }
  });
  console.log(`görseller: ${ok} indirildi, ${skip} vardı, ${fail} hata`);

  // Görseli inmeyen ürünleri ele
  const good = products.filter((p) => p.colors[0].images.every((b) => fs.existsSync(path.join(DEMO, `${b}.jpg`))));

  const catalog = {
    generatedAt: new Date().toISOString(),
    categories: CATEGORIES.map((c) => ({ slug: c.slug, name: c.name, blurb: c.blurb, children: c.children.map(({ slug, name }) => ({ slug, name })) })),
    brands: [...new Set(good.map((p) => p.brand))].sort((a, b) => a.localeCompare(b, 'tr')),
    products: good,
  };
  const out = path.join(DEMO, 'assets', 'js', 'data.js');
  fs.writeFileSync(out, `// Otomatik üretildi: node tools/fetch-gsm.mjs — elle düzenlemeyin.\nwindow.CATALOG = ${JSON.stringify(catalog, null, 1)};\n`);
  console.log(`yazıldı: ${good.length} ürün → ${path.relative(ROOT, out)}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
